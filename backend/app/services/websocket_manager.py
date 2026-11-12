import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("websocket_manager")


class OrderConnectionManager:
    def __init__(self):
        # Maps order_id (str) -> Set[WebSocket]
        self.active_order_connections: Dict[str, Set[WebSocket]] = {}
        # Admin connections listening to ALL orders
        self.admin_connections: Set[WebSocket] = {} if isinstance({}, set) else set()

    async def connect(self, websocket: WebSocket, order_id: str, is_admin: bool = False):
        await websocket.accept()
        if is_admin:
            self.admin_connections.add(websocket)
            logger.info(f"Admin WebSocket connected for real-time monitoring")
        
        if order_id not in self.active_order_connections:
            self.active_order_connections[order_id] = set()
        self.active_order_connections[order_id].add(websocket)
        logger.info(f"WebSocket connected to order channel #{order_id}")

    def disconnect(self, websocket: WebSocket, order_id: str, is_admin: bool = False):
        if is_admin and websocket in self.admin_connections:
            self.admin_connections.remove(websocket)
        
        if order_id in self.active_order_connections:
            self.active_order_connections[order_id].discard(websocket)
            if not self.active_order_connections[order_id]:
                del self.active_order_connections[order_id]
        logger.info(f"WebSocket disconnected from order channel #{order_id}")

    async def broadcast_order_update(self, order_id: str, data: Dict[str, Any]):
        """Publish real-time update to all clients subscribed to order_id, plus global admin listeners."""
        message_str = json.dumps(data)
        
        # 1. Notify specific order channel
        recipients = list(self.active_order_connections.get(order_id, []))
        for conn in recipients:
            try:
                await conn.send_text(message_str)
            except Exception as e:
                logger.error(f"Error sending order event to client: {e}")
                self.active_order_connections[order_id].discard(conn)

        # 2. Notify global admin listeners
        for admin_conn in list(self.admin_connections):
            try:
                await admin_conn.send_text(message_str)
            except Exception as e:
                logger.error(f"Error sending order event to admin: {e}")
                self.admin_connections.discard(admin_conn)


ws_manager = OrderConnectionManager()
