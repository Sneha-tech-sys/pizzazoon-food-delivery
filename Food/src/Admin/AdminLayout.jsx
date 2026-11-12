import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../Contex/AuthContext';

export default function AdminLayout() {
  const { user, isAdmin, loading, logout } = useAuthContext();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#121212', color: 'orange' }}>
        <h3>Loading Admin Panel...</h3>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#121212', color: 'white' }}>
        <h2 style={{ color: 'orange' }}>Admin Access Required</h2>
        <p>Please log in with administrator credentials.</p>
        <button
          className="btn btn-outline-warning mt-3"
          onClick={() => navigate('/login')}
          style={{ width: 'auto' }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    borderRadius: '8px',
    color: isActive ? '#000' : '#ddd',
    backgroundColor: isActive ? 'orange' : 'transparent',
    textDecoration: 'none',
    fontWeight: isActive ? 'bold' : 'normal',
    marginBottom: '8px',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#121212', color: '#fff' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid #2a2a2a',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
        }}
      >
        <div className="mb-4 text-center">
          <h2 style={{ fontFamily: 'Courgette, cursive', color: 'orange', margin: 0 }}>
            Foody<span style={{ color: '#fff' }}>Admin</span>
          </h2>
          <small style={{ color: 'gray', fontSize: '11px' }}>Management Portal</small>
        </div>

        <nav style={{ flex: 1 }}>
          <NavLink to="/admin/dashboard" style={navLinkStyle}>
            <i className="fa fa-tachometer" /> Dashboard
          </NavLink>
          <NavLink to="/admin/orders" style={navLinkStyle}>
            <i className="fa fa-shopping-bag" /> Orders
          </NavLink>
          <NavLink to="/admin/products" style={navLinkStyle}>
            <i className="fa fa-cutlery" /> Products
          </NavLink>
          <NavLink to="/admin/categories" style={navLinkStyle}>
            <i className="fa fa-tags" /> Categories
          </NavLink>
          <NavLink to="/admin/users" style={navLinkStyle}>
            <i className="fa fa-users" /> Users
          </NavLink>
          <NavLink to="/admin/contacts" style={navLinkStyle}>
            <i className="fa fa-envelope" /> Contact Inquiries
          </NavLink>
          <NavLink to="/admin/settings" style={navLinkStyle}>
            <i className="fa fa-cogs" /> Settings
          </NavLink>
        </nav>

        <div style={{ borderTop: '1px solid #333', paddingTop: '16px' }}>
          <div className="mb-3 px-2">
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'orange' }}>{user.full_name}</div>
            <div style={{ fontSize: '11px', color: 'gray' }}>{user.email}</div>
          </div>
          <NavLink to="/" className="btn btn-sm btn-outline-light w-100 mb-2">
            <i className="fa fa-globe" /> Back to Store
          </NavLink>
          <button onClick={handleLogout} className="btn btn-sm btn-outline-danger w-100">
            <i className="fa fa-sign-out" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
