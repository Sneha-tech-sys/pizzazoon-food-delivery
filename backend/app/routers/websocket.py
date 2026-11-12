import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.core.security import decode_token
from app.models.user import User
from app.models.order import Order
from app.core.dependencies import get_user_roles
from app.services.websocket_manager import ws_manager

router = APIRouter(tags=["WebSockets"])
logger = logging.getLogger("websocket_router")


@router.websocket("/ws/orders/{order_id}")
async def websocket_order_tracking(
    websocket: WebSocket,
    order_id: str,
    token: str = Query(..., description="JWT Bearer access token")
):
    # 1. Authenticate user from JWT token
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Unauthorized: Invalid access token")
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001, reason="Unauthorized: User ID missing")
        return

    db: Session = SessionLocal()
    try:
        user = db.get(User, int(user_id))
        if not user or not user.is_active:
            await websocket.close(code=4003, reason="Forbidden: Account inactive")
            return

        roles = get_user_roles(user, db)
        is_admin = "admin" in roles or "staff" in roles

        # 2. Authorization check on the requested order
        order = db.get(Order, int(order_id)) if order_id.isdigit() else None
        if not order:
            await websocket.close(code=4004, reason="Order not found")
            return

        if not is_admin and order.user_id != user.id:
            await websocket.close(code=4003, reason="Forbidden: Cannot track another customer's order")
            return

        # 3. Connect to WebSocket channel
        await ws_manager.connect(websocket, order_id=str(order.id), is_admin=is_admin)

        # Send initial status snapshot immediately
        initial_payload = {
            "event": "INITIAL_STATUS",
            "order_id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "payment_status": order.payment_status,
            "total_amount": float(order.total_amount)
        }
        await websocket.send_text(json.dumps(initial_payload))

        # 4. Keep alive / Listen for pings
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, order_id=order_id, is_admin=is_admin if 'is_admin' in locals() else False)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket, order_id=order_id, is_admin=is_admin if 'is_admin' in locals() else False)
    finally:
        db.close()
