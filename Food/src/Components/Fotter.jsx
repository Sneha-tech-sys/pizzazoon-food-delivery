import React from 'react';
import { NavLink } from 'react-router-dom';
import '../Components/Fotter.css';
import '../pizzaTheme.css';

export default function Fotter() {
  return (
    <>
      <div className="footer" style={{ borderTop: "2px solid rgba(255, 159, 0, 0.3)", backgroundColor: "#0c0d12" }}>
        
        {/* Pizzeria Promise Strip */}
        <div style={{ backgroundColor: "rgba(255, 159, 0, 0.08)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "18px 0" }}>
          <div className="container d-flex flex-wrap justify-content-around align-items-center text-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: "24px" }}>⏱️</span>
              <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: "600" }}>
                <strong>20-Min Delivery</strong> or It's On Us
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: "24px" }}>🧀</span>
              <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: "600" }}>
                <strong>100% Mozzarella</strong> &amp; Fresh Dough
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: "24px" }}>🛡️</span>
              <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: "600" }}>
                <strong>Zero Contact</strong> Tamper-Proof Box
              </span>
            </div>
          </div>
        </div>

        <div className="contain py-4">
          <div className="col">
            <h1>PizzaZoon</h1>
            <ul>
              <li><NavLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>About Our Oven</NavLink></li>
              <li>Wood-Fire Secrets</li>
              <li>Artisan Ingredients</li>
              <li>Store Locations</li>
              <li><NavLink to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Kitchen</NavLink></li>
            </ul>
          </div>
          <div className="col">
            <h1>Menu &amp; Deals</h1>
            <ul>
              <li><NavLink to="/food" style={{ color: 'inherit', textDecoration: 'none' }}>All Pizzas</NavLink></li>
              <li>Cheese Burst Pan</li>
              <li>Wood-Fired Classics</li>
              <li>Garlic Breads &amp; Sides</li>
              <li>Chilled Shakes &amp; Dips</li>
            </ul>
          </div>
          <div className="col">
            <h1>My Order</h1>
            <ul>
              <li><NavLink to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Customer Login</NavLink></li>
              <li><NavLink to="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Register (Get ₹100)</NavLink></li>
              <li><NavLink to="/cart" style={{ color: 'inherit', textDecoration: 'none' }}>View Pizza Cart</NavLink></li>
              <li><NavLink to="/wish" style={{ color: 'inherit', textDecoration: 'none' }}>Saved Favorites</NavLink></li>
            </ul>
          </div>
          <div className="col">
            <h1>Deals &amp; Combos</h1>
            <ul>
              <li>BOGO Slice Fest</li>
              <li>Party Binge Box</li>
              <li>Midnight Cravings</li>
              <li>Corporate Catering</li>
              <li>Student Discount (15%)</li>
            </ul>
          </div>
          <div className="col">
            <h1>Hotline &amp; Help</h1>
            <ul>
              <li>
                <NavLink to="/contact" style={{ color: 'orange', textDecoration: 'none', fontWeight: 'bold' }}>
                  24/7 Pizza Helpline
                </NavLink>
              </li>
              <li>📞 1800-PIZZA-ZOON</li>
              <li>📍 Kanpur Delivery Hub</li>
              <li>Track Live Delivery</li>
            </ul>
          </div>

          <div className="clearfix"></div>
          <div className="p-3 mt-3" style={{ backgroundColor: '#06070a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ textAlign: 'center', color: '#747d8c', fontSize: '13px', margin: 0 }}>
              © 2026 <strong>PizzaZoon Inc.</strong> Fresh Wood-Fired Pizza Delivery • Developed with ❤️ by Sneha Tiwari
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
