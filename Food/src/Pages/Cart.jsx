import React from "react";
import { useCartContext } from "../Contex/Cart_Contex";
import CartItem from "../Components/CartIte";
import "../Pages/App.css";
import "../pizzaTheme.css";
import { NavLink } from "react-router-dom";

export default function Cart() {
  const { cart, removeItem } = useCartContext();

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const backgroundStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/bg.jpg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "100vh",
    position: "relative",
    backgroundColor: "#0c0d12",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12, 13, 18, 0.92)",
    zIndex: 0,
  };

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}></div>
      <div className="Main" style={{ position: "relative", zIndex: "5", paddingBottom: "70px" }}>
        
        <div className="container">
          
          <div className="text-center mb-4">
            <span style={{ color: "#ff9f00", fontSize: "12px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>
              YOUR HOT OVEN SELECTION
            </span>
            <h2 style={{ color: "#ffffff", fontFamily: '"Courgette", cursive', fontSize: "2.4rem", margin: "4px 0" }}>
              Pizza <span style={{ color: "#ff3838" }}>Cart</span>
            </h2>
          </div>

          {/* Cart Header */}
          <div className="container row text-white py-2" id="carth" style={{ backgroundColor: "rgba(255, 159, 0, 0.12)", borderRadius: "8px", border: "1px solid rgba(255,159,0,0.3)" }}>
            <div className="col-lg-2 col-2" id="fonti">
              ITEM
            </div>
            <div className="col-lg-3 col-3" id="fonti">
              NAME
            </div>
            <div className="col-lg-3 col-3" id="fontiw">
              QUANTITY
            </div>
            <div className="col-lg-2 col-2" id="fontiw">
              PRICE
            </div>
            <div className="col-lg-2 col-2" id="fonti">
              REMOVE
            </div>
          </div>

          <div
            className="container"
            style={{ marginTop: "20px", color: "white", textAlign: "center" }}
          >
            {cart.length === 0 ? (
              <div className="p-5" style={{ background: "rgba(22, 23, 31, 0.8)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "48px" }}>🍕</span>
                <h4 className="mt-3 text-white">Your Pizza Cart is Empty!</h4>
                <p style={{ color: "#a4b0be", fontSize: "14px" }}>
                  Craving a hot, cheesy slice? Add your favorite wood-fired pizzas now!
                </p>
                <NavLink to="/food">
                  <button className="pizza-btn-add mt-2">
                    Browse Hot Pizzas
                  </button>
                </NavLink>
              </div>
            ) : (
              <div>
                {cart.map((item) => (
                  <CartItem
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    image={process.env.PUBLIC_URL + "/" + item.image}
                    price={item.price}
                    quantity={item.quantity}
                    removeItem={removeItem}
                  />
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <>
              {/* Promo Offer Banner inside Cart */}
              <div
                className="mt-4 p-3 d-flex flex-wrap justify-content-between align-items-center gap-2"
                style={{
                  background: "linear-gradient(90deg, rgba(255, 159, 0, 0.18), rgba(255, 51, 68, 0.18))",
                  border: "1px dashed #ff9f00",
                  borderRadius: "10px"
                }}
              >
                <div className="d-flex align-items-center gap-2 text-white">
                  <span style={{ fontSize: "20px" }}>🎁</span>
                  <span style={{ fontSize: "13px" }}>
                    <strong>Apply Coupon at Checkout:</strong> Use code <span className="coupon-pill">CHEESY50</span> for 50% OFF or <span className="coupon-pill">PARTY499</span>!
                  </span>
                </div>
                <div style={{ color: "#2ed573", fontSize: "12px", fontWeight: "bold" }}>
                  ⚡ Free Hot Delivery on Orders &gt; ₹500
                </div>
              </div>

              {/* Subtotal & Action Buttons */}
              <div className="d-flex flex-wrap justify-content-between align-items-center mt-4 p-4" style={{ backgroundColor: "rgba(18, 19, 26, 0.85)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div>
                  <span style={{ color: "#a4b0be", fontSize: "13px", textTransform: "uppercase" }}>Estimated Subtotal</span>
                  <div style={{ fontSize: "28px", color: "#fffa65", fontWeight: "800" }}>
                    ₹{totalPrice.toFixed(2)}
                  </div>
                  <span style={{ color: "#747d8c", fontSize: "12px" }}>
                    Taxes &amp; ₹100 express delivery calculated at checkout
                  </span>
                </div>

                <div className="d-flex gap-3 mt-3 mt-md-0">
                  <NavLink to="/food">
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: "transparent",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.3)",
                        padding: "10px 20px",
                        fontWeight: "600"
                      }}
                    >
                      + Add More Pizzas
                    </button>
                  </NavLink>

                  <NavLink to="/checkout">
                    <button
                      type="button"
                      className="pizza-btn-add"
                      style={{ padding: "10px 24px", fontSize: "15px" }}
                    >
                      Proceed to Checkout →
                    </button>
                  </NavLink>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
