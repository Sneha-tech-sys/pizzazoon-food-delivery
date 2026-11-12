import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready for Dispatch',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await apiClient.get('/admin/orders', { params });
      if (res.data && res.data.data) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusComment('');
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await apiClient.put(`/admin/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        comment: statusComment,
      });
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: 'orange', margin: 0 }}>Order Management</h2>
          <small style={{ color: 'gray' }}>Real-time order lifecycle and dispatch processing</small>
        </div>
        <button className="btn btn-outline-warning btn-sm" onClick={fetchOrders} style={{ width: 'auto' }}>
          <i className="fa fa-refresh" /> Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="row g-3 mb-4">
        <div className="col-md-7">
          <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Order # or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
            />
            <button type="submit" className="btn btn-warning" style={{ width: 'auto' }}>
              Search
            </button>
          </form>
        </div>
        <div className="col-md-5 d-flex gap-2 align-items-center justify-content-md-end">
          <span style={{ fontSize: '13px', color: 'gray' }}>Filter:</span>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#fff', width: 'auto' }}
          >
            <option value="All">All Statuses</option>
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <p className="text-center py-5 text-warning">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-center py-5 text-secondary">No orders match the criteria.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 bg-transparent">
              <thead>
                <tr style={{ color: 'orange', fontSize: '13px' }}>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Placed At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} style={{ fontSize: '13px', verticalAlign: 'middle' }}>
                    <td style={{ color: 'orange', fontWeight: 'bold' }}>{o.order_number}</td>
                    <td>{o.customer_name}</td>
                    <td>
                      <small className="d-block">{o.customer_email}</small>
                      <small className="text-secondary">{o.customer_phone}</small>
                    </td>
                    <td>
                      <small>
                        {o.items.map((it) => `${it.product_name} (x${it.quantity})`).join(', ')}
                      </small>
                    </td>
                    <td>₹{parseFloat(o.total_amount).toFixed(2)}</td>
                    <td>
                      <span className="badge bg-secondary">{o.payment_method}</span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            o.status === 'Delivered'
                              ? '#2e7d32'
                              : o.status === 'Cancelled'
                              ? '#c62828'
                              : '#e65100',
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => openStatusModal(o)}
                        style={{ width: 'auto', fontSize: '12px', padding: '4px 10px' }}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
          }}
        >
          <div
            style={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #333',
              borderRadius: '10px',
              width: '90%',
              maxWidth: '500px',
              padding: '24px',
              color: '#fff',
            }}
          >
            <h5 style={{ color: 'orange', marginBottom: '16px' }}>
              Update Order #{selectedOrder.order_number}
            </h5>
            <div className="mb-3">
              <label style={{ fontSize: '13px', color: 'gray' }}>Select New Status</label>
              <select
                className="form-select mt-1"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
              >
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label style={{ fontSize: '13px', color: 'gray' }}>Internal Note / Customer Comment</label>
              <textarea
                className="form-control mt-1"
                rows="3"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="e.g. Chef is preparing the dish / Driver is 5 mins away"
                style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedOrder(null)}
                disabled={updating}
                style={{ width: 'auto' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-warning btn-sm"
                onClick={handleStatusUpdate}
                disabled={updating}
                style={{ width: 'auto' }}
              >
                {updating ? 'Updating & Notifying...' : 'Save & Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
