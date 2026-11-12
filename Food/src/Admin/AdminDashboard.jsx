import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import apiClient from '../api/client';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiClient.get('/admin/dashboard');
        if (res.data && res.data.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="text-center py-5 text-warning">Loading analytics overview...</div>;
  }

  const metrics = data?.metrics || {};
  const statusDist = data?.status_distribution || {};
  const recentOrders = data?.recent_orders || [];

  const metricCards = [
    { label: 'Total Revenue', value: `₹${metrics.total_revenue?.toFixed(2) || '0.00'}`, icon: 'fa-money', color: '#4caf50' },
    { label: 'Total Orders', value: metrics.total_orders || 0, icon: 'fa-shopping-cart', color: '#ff9800' },
    { label: 'Pending Orders', value: metrics.pending_orders || 0, icon: 'fa-clock-o', color: '#ffb74d' },
    { label: 'Completed Orders', value: metrics.completed_orders || 0, icon: 'fa-check-circle', color: '#81c784' },
    { label: 'Cancelled Orders', value: metrics.cancelled_orders || 0, icon: 'fa-ban', color: '#e57373' },
    { label: 'Total Products', value: metrics.total_products || 0, icon: 'fa-cutlery', color: '#64b5f6' },
    { label: 'Registered Users', value: metrics.total_users || 0, icon: 'fa-users', color: '#ba68c8' },
    { label: 'New Inquiries', value: metrics.new_inquiries || 0, icon: 'fa-envelope-open', color: '#4dd0e1' },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: 'orange', margin: 0 }}>Executive Overview</h2>
          <small style={{ color: 'gray' }}>Real-time business performance and operations monitor</small>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="row g-3 mb-5">
        {metricCards.map((c) => (
          <div key={c.label} className="col-12 col-sm-6 col-lg-3">
            <div
              style={{
                backgroundColor: '#1e1e1e',
                border: '1px solid #2e2e2e',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ color: 'gray', fontSize: '13px', marginBottom: '6px' }}>{c.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{c.value}</div>
              </div>
              <div
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '10px',
                  backgroundColor: `${c.color}22`,
                  color: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className={`fa ${c.icon}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Order Status Distribution */}
        <div className="col-lg-5">
          <div
            style={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #2e2e2e',
              borderRadius: '10px',
              padding: '24px',
              height: '100%',
            }}
          >
            <h5 className="mb-3" style={{ color: 'orange' }}>Order Status Breakdown</h5>
            {Object.keys(statusDist).length === 0 ? (
              <p className="text-secondary">No orders recorded yet.</p>
            ) : (
              <div className="d-flex flex-column gap-3 mt-3">
                {Object.entries(statusDist).map(([status, count]) => (
                  <div key={status}>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: '13px' }}>
                      <span>{status}</span>
                      <span className="text-warning font-weight-bold">{count}</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (count / (metrics.total_orders || 1)) * 100)}%`,
                          height: '100%',
                          backgroundColor:
                            status === 'Delivered'
                              ? '#4caf50'
                              : status === 'Cancelled'
                              ? '#f44336'
                              : 'orange',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="col-lg-7">
          <div
            style={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #2e2e2e',
              borderRadius: '10px',
              padding: '24px',
              height: '100%',
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ color: 'orange', margin: 0 }}>Recent Orders</h5>
              <NavLink to="/admin/orders" style={{ color: 'orange', fontSize: '13px', textDecoration: 'none' }}>
                View All →
              </NavLink>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-secondary">No recent orders.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-sm bg-transparent mb-0">
                  <thead>
                    <tr style={{ color: 'gray', fontSize: '12px' }}>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id} style={{ fontSize: '13px' }}>
                        <td style={{ color: 'orange' }}>{o.order_number}</td>
                        <td>{o.customer_name}</td>
                        <td>₹{o.total_amount?.toFixed(2)}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: o.status === 'Delivered' ? '#2e7d32' : o.status === 'Cancelled' ? '#c62828' : '#e65100',
                            }}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
