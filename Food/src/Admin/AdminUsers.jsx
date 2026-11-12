import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = search.trim() ? { search: search.trim() } : {};
      const res = await apiClient.get('/admin/users', { params });
      if (res.data && res.data.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const toggleUserActive = async (u) => {
    try {
      await apiClient.put(`/admin/users/${u.id}`, { is_active: !u.is_active });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: 'orange', margin: 0 }}>User Management</h2>
          <small style={{ color: 'gray' }}>Inspect customer registrations, email verification status, and permissions</small>
        </div>
      </div>

      <div className="row g-2 mb-4">
        <div className="col-md-6">
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search user by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
            />
            <button type="submit" className="btn btn-warning" style={{ width: 'auto' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <p className="text-center py-5 text-warning">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-center py-5 text-secondary">No users found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 bg-transparent">
              <thead>
                <tr style={{ color: 'orange', fontSize: '13px' }}>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Email Verified</th>
                  <th>Roles</th>
                  <th>Account Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ fontSize: '13px', verticalAlign: 'middle' }}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: 'bold' }}>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '-'}</td>
                    <td>
                      <span className={`badge ${u.is_verified ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {u.is_verified ? 'Verified' : 'Pending OTP'}
                      </span>
                    </td>
                    <td>
                      {u.roles?.map((r) => (
                        <span key={r} className="badge bg-secondary me-1">
                          {r}
                        </span>
                      ))}
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'bg-success' : 'bg-danger'}`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => toggleUserActive(u)}
                        style={{ width: 'auto', padding: '2px 8px', fontSize: '12px' }}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
