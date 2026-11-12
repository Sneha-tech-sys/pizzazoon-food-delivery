import React from 'react';
import { useAuthContext } from '../Contex/AuthContext';

export default function AdminSettings() {
  const { user } = useAuthContext();

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ color: 'orange', margin: 0 }}>System Settings & Status</h2>
        <small style={{ color: 'gray' }}>Platform configuration, security policies, and connectivity status</small>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '10px', padding: '24px' }}>
            <h5 style={{ color: 'orange' }} className="mb-3">Backend & Database Status</h5>
            <ul className="list-unstyled mb-0" style={{ fontSize: '13px' }}>
              <li className="d-flex justify-content-between py-2 border-bottom border-secondary">
                <span>FastAPI Backend Engine</span>
                <span className="badge bg-success">Online (v1.0.0)</span>
              </li>
              <li className="d-flex justify-content-between py-2 border-bottom border-secondary">
                <span>PostgreSQL 18 Database</span>
                <span className="badge bg-success">Connected (fooddel)</span>
              </li>
              <li className="d-flex justify-content-between py-2 border-bottom border-secondary">
                <span>WebSocket Gateway</span>
                <span className="badge bg-success">Active (/ws/orders)</span>
              </li>
              <li className="d-flex justify-content-between py-2 border-bottom border-secondary">
                <span>Password Hashing</span>
                <span className="badge bg-info text-dark">Argon2id + Bcrypt fallback</span>
              </li>
              <li className="d-flex justify-content-between py-2">
                <span>SMTP Email Integration</span>
                <span className="badge bg-warning text-dark">Active (Background Tasks)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="col-lg-6">
          <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '10px', padding: '24px' }}>
            <h5 style={{ color: 'orange' }} className="mb-3">Current Admin Session</h5>
            <div style={{ fontSize: '13px' }}>
              <p><strong>Signed In As:</strong> {user?.full_name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Roles:</strong> {user?.roles?.join(', ')}</p>
              <p><strong>JWT Authorization:</strong> Active Bearer Session</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
