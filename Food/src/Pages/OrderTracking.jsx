import React, { useState, useEffect, useRef } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import apiClient from '../api/client';
import '../Pages/App.css';
import '../pizzaTheme.css';

const STATUS_STEPS = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready for Dispatch',
  'Out for Delivery',
  'Delivered',
];

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const wsRef = useRef(null);

  const fetchOrder = async () => {
    try {
      const res = await apiClient.get(`/orders/${id}`);
      if (res.data && res.data.data) {
        setOrder(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // WebSocket connection
    const token = localStorage.getItem('access_token');
    const wsBaseUrl = process.env.REACT_APP_WS_BASE_URL || (
      typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'ws://localhost:8000/ws'
        : 'wss://pizzazoon-food-delivery.onrender.com/ws'
    );
    const socket = new WebSocket(`${wsBaseUrl}/orders/${id}?token=${token}`);
    wsRef.current = socket;

    socket.onopen = () => {
      setWsStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'ORDER_STATUS_UPDATED') {
          setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
          // Refresh full history
          fetchOrder();
        }
      } catch (e) {
        console.error('Error handling WebSocket message:', e);
      }
    };

    socket.onerror = () => {
      setWsStatus('error');
    };

    socket.onclose = () => {
      setWsStatus('disconnected');
    };

    // Heartbeat ping
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      socket.close();
    };
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelLoading(true);
    try {
      const res = await apiClient.post(`/orders/${id}/cancel`);
      setOrder(res.data?.data || order);
    } catch (err) {
      alert(err.response?.data?.detail || 'Cancellation failed.');
    } finally {
      setCancelLoading(false);
    }
  };

  const backgroundStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/bg.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    position: 'relative',
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 0,
  };

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isCancelled = order && (order.status === 'Cancelled' || order.status === 'Failed');

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}></div>
      <div className="Main" style={{ position: 'relative', zIndex: '5', paddingBottom: '60px' }}>
        <div className="container" style={{ maxWidth: '850px', color: 'white' }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 style={{ fontFamily: 'Courgette, cursive', color: 'orange' }}>Live Order Tracking</h2>
            <div className="d-flex align-items-center gap-2">
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: wsStatus === 'connected' ? '#00e676' : '#ff9100',
                }}
              ></span>
              <span style={{ fontSize: '12px', color: 'lightgray' }}>
                {wsStatus === 'connected' ? 'Live Updates Active' : 'Connecting WebSocket...'}
              </span>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-5">Loading order details...</p>
          ) : errorMsg ? (
            <div className="alert alert-danger">{errorMsg}</div>
          ) : !order ? (
            <p className="text-center">Order not found.</p>
          ) : (
            <div
              className="p-4 rounded"
              style={{
                backgroundColor: 'rgba(25, 25, 25, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              }}
            >
              {/* Header Info */}
              <div className="row pb-3 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="col-md-6">
                  <h4 style={{ color: 'orange' }}>Order #{order.order_number}</h4>
                  <p className="text-secondary small mb-1">Placed on: {new Date(order.created_at).toLocaleString()}</p>
                  <p className="text-secondary small">Delivery to: {order.delivery_address}</p>
                </div>
                <div className="col-md-6 text-md-end">
                  <span
                    className="badge p-2"
                    style={{
                      backgroundColor: isCancelled ? '#d32f2f' : '#ff9800',
                      color: isCancelled ? '#fff' : '#000',
                      fontSize: '14px',
                    }}
                  >
                    Status: {order.status}
                  </span>
                  <h5 className="mt-2 text-white">Total: ₹{parseFloat(order.total_amount).toFixed(2)}</h5>
                  <small className="text-secondary">Payment: {order.payment_method} ({order.payment_status})</small>
                </div>
              </div>

              {/* Status Stepper */}
              {!isCancelled ? (
                <div className="my-4">
                  <h6 className="text-secondary mb-3">Order Progress</h6>
                  <div className="d-flex justify-content-between flex-wrap gap-2 text-center">
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      return (
                        <div key={step} style={{ flex: '1 1 100px', minWidth: '90px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              margin: '0 auto 8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isCurrent ? 'orange' : isCompleted ? '#4caf50' : '#424242',
                              color: isCurrent ? '#000' : '#fff',
                              fontWeight: 'bold',
                              boxShadow: isCurrent ? '0 0 10px orange' : 'none',
                            }}
                          >
                            {isCompleted && !isCurrent ? '✓' : idx + 1}
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              color: isCurrent ? 'orange' : isCompleted ? '#fff' : 'gray',
                              fontWeight: isCurrent ? 'bold' : 'normal',
                            }}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="alert alert-danger my-3">
                  This order was marked as <strong>{order.status}</strong>.
                </div>
              )}

              {/* Items List */}
              <h6 className="text-secondary mt-4 mb-2">Items in this order</h6>
              <div className="table-responsive">
                <table className="table table-dark table-sm bg-transparent">
                  <thead>
                    <tr style={{ color: 'orange' }}>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it) => (
                      <tr key={it.id}>
                        <td>
                          {it.product_image && (
                            <img
                              src={`${process.env.PUBLIC_URL}/${it.product_image}`}
                              alt={it.product_name}
                              style={{ width: '30px', height: '30px', borderRadius: '4px', marginRight: '10px' }}
                            />
                          )}
                          {it.product_name}
                        </td>
                        <td>{it.quantity}</td>
                        <td>₹{parseFloat(it.price_at_purchase).toFixed(2)}</td>
                        <td className="text-end">₹{parseFloat(it.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Status History */}
              {order.status_history && order.status_history.length > 0 && (
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h6 className="text-secondary mb-2">Status Timeline</h6>
                  <ul className="list-unstyled mb-0" style={{ fontSize: '13px' }}>
                    {order.status_history.map((h) => (
                      <li key={h.id} className="mb-1 text-secondary">
                        <span style={{ color: 'orange' }}>● {h.status}</span> &nbsp;
                        <span>({new Date(h.created_at).toLocaleTimeString()})</span>
                        {h.comment && <span className="text-white"> - {h.comment}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <NavLink to="/food" className="btn btn-outline-light btn-sm">
                  Continue Shopping
                </NavLink>

                {['Pending', 'Confirmed'].includes(order.status) && (
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    style={{ width: 'auto' }}
                  >
                    {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
