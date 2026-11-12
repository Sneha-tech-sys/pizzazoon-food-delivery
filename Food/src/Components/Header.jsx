import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCartContext } from '../Contex/Cart_Contex';
import { useAuthContext } from '../Contex/AuthContext';
import '../Components/Header.css';
import '../pizzaTheme.css';

export default function Header() {
  const { totalItems = 0 } = useCartContext();
  const { user, isAuthenticated, isAdmin, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Top Live Advertisement & Offer Ticker */}
      <div className="pizza-top-ticker">
        <div className="ticker-track">
          <span className="ticker-item">
            <span className="ticker-badge">HOT DEAL</span> 🍕 BOGO FEST: Buy 1 Get 1 FREE on All Medium Handcrafted Pizzas! Code: <strong>PIZZABOGO</strong>
          </span>
          <span className="ticker-item">
            <span className="ticker-badge">EXPRESS</span> ⚡ 20-Min Hot Oven Guarantee: Steaming Hot to Doorstep or It's FREE!
          </span>
          <span className="ticker-item">
            <span className="ticker-badge">CHEESE BURST</span> 🧀 Extra Wisconsin Mozzarella & Smoked Garlic Dip on Orders &gt; ₹399!
          </span>
          <span className="ticker-item">
            <span className="ticker-badge">APP SPECIAL</span> 📱 Flat 50% OFF on 1st Order with Code: <strong>CHEESY50</strong>
          </span>
          {/* Loop copy for continuous marquee */}
          <span className="ticker-item">
            <span className="ticker-badge">HOT DEAL</span> 🍕 BOGO FEST: Buy 1 Get 1 FREE on All Medium Handcrafted Pizzas! Code: <strong>PIZZABOGO</strong>
          </span>
          <span className="ticker-item">
            <span className="ticker-badge">EXPRESS</span> ⚡ 20-Min Hot Oven Guarantee: Steaming Hot to Doorstep or It's FREE!
          </span>
          <span className="ticker-item">
            <span className="ticker-badge">CHEESE BURST</span> 🧀 Extra Wisconsin Mozzarella & Smoked Garlic Dip on Orders &gt; ₹399!
          </span>
        </div>
      </div>

      <nav className="navbar" style={{ top: '34px' }}>
        <div className="navbar-container container">
          <input type="checkbox" name="" id="nav-toggle" />
          <div className="hamburger-lines">
            <span className="line line1"></span>
            <span className="line line2"></span>
            <span className="line line3"></span>
          </div>
          <ul className="menu-items">
            <li><NavLink to="/">Home</NavLink></li>
            <li>
              <NavLink to="/food">
                <span style={{ color: '#ff4757', marginRight: '4px' }}>🍕</span>Pizza Menu
              </NavLink>
            </li>
            <li><NavLink to="/wish">Wishlist</NavLink></li>
            <li><NavLink to="/contact">Contact</NavLink></li>
            <li>
              <NavLink to="/cart">
                <i className="fa fa-shopping-cart" style={{ fontSize: '20px' }}></i>
                <span className="cart-count">{totalItems}</span>
              </NavLink>
            </li>

            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <li>
                    <NavLink to="/admin/dashboard" style={{ color: '#ffd54f' }}>
                      <i className="fa fa-tachometer me-1" /> Admin
                    </NavLink>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'orange',
                      fontFamily: '"Courgette", cursive',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: '-2px',
                    }}
                    title={`Logged in as ${user?.full_name} - Click to Logout`}
                  >
                    <i className="fa fa-sign-out" /> Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <NavLink to="/login" title="Login / Register">
                  <i className="fa fa-user" aria-hidden="true" style={{ color: 'orange' }}></i>
                </NavLink>
              </li>
            )}
          </ul>

          <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '28px' }} className="bounce-tag">🍕</span>
            <h1 className="logo" data-aos="fade-right" style={{ color: 'orange', fontFamily: "Courgette, cursive", margin: 0 }}>
              Pizza<span style={{ color: '#ff3838' }}>Zoon</span>
            </h1>
          </NavLink>
        </div>
      </nav>
    </>
  );
}
