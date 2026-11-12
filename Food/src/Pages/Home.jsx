import React, { useState } from "react";
import Slider from "../Components/Slider";
import "../Pages/App.css";
import "../pizzaTheme.css";
import { NavLink } from "react-router-dom";

export default function Home() {
  const [copiedCoupon, setCopiedCoupon] = useState("");

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(""), 2500);
  };

  const backgroundStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/bg.jpg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
    backgroundColor: "#0c0d12",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12, 13, 18, 0.88)",
    zIndex: 0,
  };

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}></div>

      <div className="Main" style={{ position: "relative", zIndex: "5", paddingBottom: "70px" }}>
        
        {/* ================= HERO SECTION ================= */}
        <div className="container" id="glass" style={{ marginTop: "-20px", border: "1px solid rgba(255, 159, 0, 0.35)" }}>
          <div className="container-fluid row p-4 p-lg-5 align-items-center">
            
            {/* Left Hero Content */}
            <div className="col-lg-6" id="mainhead">
              <div className="d-inline-flex align-items-center gap-2 mb-3 px-3 py-1" style={{
                backgroundColor: "rgba(255, 51, 68, 0.15)",
                border: "1px solid rgba(255, 51, 68, 0.5)",
                borderRadius: "30px",
                color: "#ff6b81",
                fontSize: "12px",
                fontWeight: "700"
              }}>
                <span className="pizza-pulse" style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "#ff3344", borderRadius: "50%" }}></span>
                WOOD-FIRED ARTISAN PIZZAS • 20 MIN GUARANTEE
              </div>

              <h1
                className="heading"
                id="mainhe"
                style={{
                  lineHeight: "1.15",
                  fontSize: "3.4rem",
                  color: "#ff9f00",
                  fontFamily: '"Courgette", cursive',
                  marginBottom: "16px"
                }}
              >
                Hot, Cheesy & <br />
                <span style={{ color: "#ffffff", textShadow: "0 0 20px rgba(255,255,255,0.4)" }}>Delivered Fast</span>
              </h1>

              <p className="small" id="main" style={{ fontSize: "15px", lineHeight: "1.6", color: "#dcdde1", maxWidth: "500px" }}>
                Handcrafted with 100% Wisconsin Mozzarella, 48-hour slow-fermented dough, and sun-ripened Italian San Marzano sauce. Steaming from our 500°C stone oven straight to your doorstep in 20 minutes!
              </p>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap gap-3 mt-4">
                <NavLink to="/food" style={{ textDecoration: "none" }}>
                  <button
                    type="button"
                    style={{
                      background: "linear-gradient(135deg, #ff9f00 0%, #ff3838 100%)",
                      color: "#fff",
                      border: "none",
                      padding: "14px 28px",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "700",
                      boxShadow: "0 8px 25px rgba(255, 60, 0, 0.45)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <span>🍕</span> Order Hot Pizza Now
                  </button>
                </NavLink>

                <a href="#promos" style={{ textDecoration: "none" }}>
                  <button
                    type="button"
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#fffa65",
                      border: "1px solid rgba(255, 250, 101, 0.4)",
                      padding: "14px 24px",
                      borderRadius: "8px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      backdropFilter: "blur(6px)"
                    }}
                  >
                    🎁 View Deals &amp; Coupons
                  </button>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="d-flex flex-wrap gap-4 mt-4 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "13px", color: "#a4b0be" }}>
                <span>⏱️ <strong>20 Min</strong> Hot Delivery</span>
                <span>🧀 <strong>100% Real</strong> Mozzarella</span>
                <span>⭐ <strong>4.9/5</strong> (35K+ Reviews)</span>
              </div>
            </div>

            {/* Right Hero: 3D Floating Pizza & Live Deal Tag */}
            <div className="col-lg-6 text-center mt-4 mt-lg-0 position-relative">
              <div className="position-relative d-inline-block">
                
                {/* Floating Discount Tag */}
                <div
                  className="pizza-pulse"
                  style={{
                    position: "absolute",
                    top: "15px",
                    right: "-10px",
                    background: "linear-gradient(135deg, #ff3344, #e84118)",
                    color: "white",
                    padding: "10px 18px",
                    borderRadius: "50px",
                    fontWeight: "800",
                    fontSize: "14px",
                    zIndex: 10,
                    boxShadow: "0 8px 20px rgba(255, 51, 68, 0.6)"
                  }}
                >
                  ⚡ 50% OFF 2ND PIZZA
                </div>

                {/* Main Hero Pizza with Floating Animation */}
                <img
                  src={`${process.env.PUBLIC_URL}/Assets/pizza.jpeg`}
                  alt="Hot Cheesy Wood-Fired Pizza"
                  className="pizza-float"
                  style={{
                    maxWidth: "85%",
                    height: "auto",
                    borderRadius: "50%",
                    border: "6px solid rgba(255, 159, 0, 0.45)",
                    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9), 0 0 50px rgba(255, 110, 0, 0.4)"
                  }}
                />

                {/* Floating Chef Recommendation Pill */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "-15px",
                    background: "rgba(18, 19, 26, 0.92)",
                    border: "1px solid rgba(255, 159, 0, 0.5)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    textAlign: "left",
                    color: "#fff",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                    zIndex: 10
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#ff9f00", fontWeight: "bold" }}>👑 CHEF SPECIAL</div>
                  <div style={{ fontSize: "14px", fontWeight: "700" }}>4-Cheese Burst Pan Pizza</div>
                  <div style={{ fontSize: "12px", color: "#2ed573" }}>₹200.00 • Hot &amp; Fresh</div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ================= REAL-WORLD ADVERTISEMENTS & PROMOS ================= */}
        <div className="container mt-5 pt-3" id="promos">
          <div className="text-center mb-4">
            <span style={{ color: "#ff9f00", fontSize: "12px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>
              EXCLUSIVE PIZZA PROMOTIONS
            </span>
            <h2 style={{ color: "#ffffff", fontFamily: '"Courgette", cursive', fontSize: "2.4rem", marginTop: "4px" }}>
              Pizza Mania <span style={{ color: "#ff3838" }}>Deals &amp; Combos</span>
            </h2>
            <p style={{ color: "#a4b0be", fontSize: "14px" }}>
              Save up to 45% today with our handcrafted family combos and sponsored party packs!
            </p>
          </div>

          <div className="row g-4">
            
            {/* Promo Card 1: Weekend Party Binge Box */}
            <div className="col-lg-4 col-md-6">
              <div className="pizza-ad-card p-4 h-100 d-flex flex-column justify-content-between">
                <span className="ad-ribbon">45% OFF</span>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span style={{ fontSize: "22px" }}>👑</span>
                    <span style={{ color: "#ff9f00", fontWeight: "700", fontSize: "12px" }}>SPONSORED COMBO DEAL</span>
                  </div>
                  <h4 style={{ color: "#ffffff", fontWeight: "800", marginBottom: "8px" }}>
                    The Ultimate Pizza Party Box
                  </h4>
                  <p style={{ color: "#dcdde1", fontSize: "13px", lineHeight: "1.5" }}>
                    2 Medium Cheesy Pan Pizzas + 1 Stuffed Garlic Breadsticks + 2 Molten Choco Lava Cakes + 1.25L Chilled Beverage.
                  </p>
                </div>

                <div>
                  <div className="d-flex align-items-baseline gap-2 mb-3">
                    <span style={{ color: "#fffa65", fontSize: "24px", fontWeight: "800" }}>₹499</span>
                    <span style={{ color: "#747d8c", textDecoration: "line-through", fontSize: "14px" }}>₹899</span>
                    <span style={{ color: "#2ed573", fontSize: "12px", fontWeight: "700" }}>Save ₹400</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <span
                      className="coupon-pill"
                      title="Click to copy coupon code"
                      onClick={() => handleCopyCode("PARTY499")}
                    >
                      <span>🏷️</span> {copiedCoupon === "PARTY499" ? "COPIED!" : "PARTY499"}
                    </span>
                    <NavLink to="/food">
                      <button className="pizza-btn-add" style={{ padding: "6px 14px", fontSize: "13px" }}>
                        Order Box
                      </button>
                    </NavLink>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Card 2: BOGO Wednesday Slice Fest */}
            <div className="col-lg-4 col-md-6">
              <div className="pizza-ad-card p-4 h-100 d-flex flex-column justify-content-between" style={{ borderColor: "rgba(255, 51, 68, 0.45)" }}>
                <span className="ad-ribbon" style={{ background: "linear-gradient(135deg, #ffa801, #ff5e57)" }}>BUY 1 GET 1</span>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span style={{ fontSize: "22px" }}>🍕</span>
                    <span style={{ color: "#ff5e57", fontWeight: "700", fontSize: "12px" }}>BOGO PIZZA CARNIVAL</span>
                  </div>
                  <h4 style={{ color: "#ffffff", fontWeight: "800", marginBottom: "8px" }}>
                    BOGO Double Slice Feast
                  </h4>
                  <p style={{ color: "#dcdde1", fontSize: "13px", lineHeight: "1.5" }}>
                    Buy any Large Signature Crust Pizza and get a Medium Classic Margherita or Veggie Feast Pizza completely FREE!
                  </p>
                </div>

                <div>
                  <div className="d-flex align-items-baseline gap-2 mb-3">
                    <span style={{ color: "#fffa65", fontSize: "24px", fontWeight: "800" }}>1 + 1 FREE</span>
                    <span style={{ color: "#2ed573", fontSize: "12px", fontWeight: "700" }}>Valid All Day</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <span
                      className="coupon-pill"
                      title="Click to copy coupon code"
                      onClick={() => handleCopyCode("PIZZABOGO")}
                    >
                      <span>🏷️</span> {copiedCoupon === "PIZZABOGO" ? "COPIED!" : "PIZZABOGO"}
                    </span>
                    <NavLink to="/food">
                      <button className="pizza-btn-add" style={{ padding: "6px 14px", fontSize: "13px" }}>
                        Claim BOGO
                      </button>
                    </NavLink>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Card 3: Cheese Burst Volcano */}
            <div className="col-lg-4 col-md-12">
              <div className="pizza-ad-card p-4 h-100 d-flex flex-column justify-content-between" style={{ borderColor: "rgba(46, 213, 115, 0.45)" }}>
                <span className="ad-ribbon" style={{ background: "linear-gradient(135deg, #10ac84, #1dd1a1)" }}>NEW LAUNCH</span>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span style={{ fontSize: "22px" }}>🧀</span>
                    <span style={{ color: "#2ed573", fontWeight: "700", fontSize: "12px" }}>CHEF'S SIGNATURE</span>
                  </div>
                  <h4 style={{ color: "#ffffff", fontWeight: "800", marginBottom: "8px" }}>
                    Volcano 4-Cheese Burst
                  </h4>
                  <p style={{ color: "#dcdde1", fontSize: "13px", lineHeight: "1.5" }}>
                    Loaded with liquid Cheddar, aged Gouda, stretchy Mozzarella, and herb Parmesan with a smoked garlic butter dip.
                  </p>
                </div>

                <div>
                  <div className="d-flex align-items-baseline gap-2 mb-3">
                    <span style={{ color: "#fffa65", fontSize: "24px", fontWeight: "800" }}>₹200</span>
                    <span style={{ color: "#747d8c", textDecoration: "line-through", fontSize: "14px" }}>₹320</span>
                    <span style={{ color: "#2ed573", fontSize: "12px", fontWeight: "700" }}>Free Garlic Dip</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <span
                      className="coupon-pill"
                      title="Click to copy coupon code"
                      onClick={() => handleCopyCode("CHEESY50")}
                    >
                      <span>🏷️</span> {copiedCoupon === "CHEESY50" ? "COPIED!" : "CHEESY50"}
                    </span>
                    <NavLink to="/food">
                      <button className="pizza-btn-add" style={{ padding: "6px 14px", fontSize: "13px" }}>
                        Try Now
                      </button>
                    </NavLink>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= PIZZERIA PROMISE / WHY US ================= */}
        <div className="container mt-5 pt-4">
          <div className="row g-3">
            
            <div className="col-lg-3 col-6">
              <div className="pizza-feature-box">
                <div className="pizza-feature-icon">🍕</div>
                <h5 style={{ color: "#ff9f00", fontWeight: "700", fontSize: "16px" }}>Hand-Tossed Daily</h5>
                <p style={{ color: "#dcdde1", fontSize: "12px", margin: 0 }}>
                  48-hr slow-fermented organic dough made fresh every morning.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-6">
              <div className="pizza-feature-box">
                <div className="pizza-feature-icon">🔥</div>
                <h5 style={{ color: "#ff9f00", fontWeight: "700", fontSize: "16px" }}>500°C Stone Oven</h5>
                <p style={{ color: "#dcdde1", fontSize: "12px", margin: 0 }}>
                  Authentic blistered crust baked with aromatic wood chips.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-6">
              <div className="pizza-feature-box">
                <div className="pizza-feature-icon">⚡</div>
                <h5 style={{ color: "#ff9f00", fontWeight: "700", fontSize: "16px" }}>20-Min Hot Express</h5>
                <p style={{ color: "#dcdde1", fontSize: "12px", margin: 0 }}>
                  Insulated thermal box keeps pizza piping hot right to your door.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-6">
              <div className="pizza-feature-box">
                <div className="pizza-feature-icon">🧀</div>
                <h5 style={{ color: "#ff9f00", fontWeight: "700", fontSize: "16px" }}>100% Real Cheese</h5>
                <p style={{ color: "#dcdde1", fontSize: "12px", margin: 0 }}>
                  Zero artificial oils or cheese analogues. Pure melted bliss.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ================= TRENDING SLIDER SECTION ================= */}
        <div className="container-fluid p-4 p-lg-5 mt-4">
          <div className="container">
            <div className="text-center mb-3">
              <h3 style={{ color: "#ff9f00", fontFamily: '"Courgette", cursive' }}>
                Customer Favorites &amp; Beverages
              </h3>
            </div>
            <Slider />
          </div>
        </div>

      </div>
    </div>
  );
}
