import React, { useState, useEffect } from "react";
import { useCartContext } from "../Contex/Cart_Contex";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../Contex/AuthContext";
import apiClient from "../api/client";
import "../pizzaTheme.css";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart } = useCartContext();
  const { user } = useAuthContext();

  const [formData, setFormData] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    notes: "",
    paymentMethod: "COD", // COD or Razorpay
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.full_name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const taxPrice = totalPrice * 0.05;
  const shippingPrice = totalPrice > 0 ? 100 : 0;
  const finalAmount = totalPrice + taxPrice + shippingPrice;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (paymentRefId = null) => {
    if (!user) {
      setErrorMsg("You must be logged in to place an order. Please click 'Log In / Sign Up' to proceed.");
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setErrorMsg("Please fill in all shipping details.");
      return;
    }

    if (cart.length === 0) {
      setErrorMsg("Your cart is empty. Add items before placing an order.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        customer_name: formData.name.trim(),
        customer_email: formData.email.trim(),
        customer_phone: formData.phone.trim(),
        delivery_address: formData.address.trim(),
        order_notes: formData.notes.trim() || null,
        payment_method: formData.paymentMethod,
        payment_reference_id: paymentRefId,
        items: cart.map((it) => ({
          product_id: it.id,
          quantity: it.quantity,
        })),
      };

      const res = await apiClient.post("/orders/", payload);
      if (res.data && res.data.data) {
        const orderId = res.data.data.id;
        navigate(`/orders/${orderId}`);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.data?.detail === "Authentication token is required") {
        setErrorMsg("You must be logged in to place an order. Please click 'Log In / Sign Up' above.");
      } else {
        setErrorMsg(err.response?.data?.detail || "Failed to place order. Please check inputs.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setErrorMsg("Please fill in all shipping details before proceeding.");
      return;
    }

    if (formData.paymentMethod === "COD") {
      handlePlaceOrder(null);
      return;
    }

    // Razorpay flow
    if (window.Razorpay) {
      const options = {
        key: "rzp_test_ABC123xyz",
        amount: Math.round(finalAmount * 100),
        currency: "INR",
        name: "FoodyZone",
        description: "Fresh Food Order",
        handler: function (response) {
          handlePlaceOrder(response.razorpay_payment_id || "PAY_SIMULATED");
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#ff9800",
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
        rzp.on("payment.failed", function () {
          // If simulation fails in demo mode, allow fallback to COD placement
          if (window.confirm("Razorpay demo mode: Proceed order with simulated payment?")) {
            handlePlaceOrder("PAY_DEMO_COMPLETED");
          }
        });
      } catch (err) {
        handlePlaceOrder("PAY_FALLBACK");
      }
    } else {
      handlePlaceOrder(null);
    }
  };

  const backgroundStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/bg.jpg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "auto",
    minHeight: "100vh",
    position: "relative",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    zIndex: 0,
  };

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}></div>
      <div className="Main" style={{ position: "relative", zIndex: "5", paddingBottom: "60px" }}>
        <div className="container row" style={{ color: "white" }}>
          <div className="col-lg-7 p-4">
            {!user && (
              <div
                style={{
                  backgroundColor: "rgba(255, 165, 0, 0.15)",
                  border: "1px solid orange",
                  color: "#fff",
                  padding: "14px 18px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <strong style={{ color: "orange" }}>Login Required:</strong> Please log in or create an account to place and track your order.
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/login?redirect=/checkout")}
                  style={{
                    backgroundColor: "orange",
                    color: "#000",
                    fontWeight: "bold",
                    border: "none",
                    padding: "7px 16px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Log In / Sign Up
                </button>
              </div>
            )}

            <h4 style={{ color: "orange", fontFamily: "Courgette, cursive" }}>Shipping Details</h4>

            {errorMsg && <div className="alert alert-danger py-2 small my-3">{errorMsg}</div>}

            <form onSubmit={handlePayment} className="form-horizontal mt-3">
              <div className="form-group mb-3">
                <label className="mb-1" style={{ fontSize: "13px", color: "lightgray" }}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-control"
                  required
                  placeholder="Enter recipient's name"
                  style={{
                    backgroundColor: "transparent",
                    color: "white",
                    border: "1px solid lightgray",
                  }}
                />
              </div>

              <div className="form-group mb-3">
                <label className="mb-1" style={{ fontSize: "13px", color: "lightgray" }}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  required
                  placeholder="For order confirmation & live receipts"
                  style={{
                    backgroundColor: "transparent",
                    color: "white",
                    border: "1px solid lightgray",
                  }}
                />
              </div>

              <div className="form-group mb-3">
                <label className="mb-1" style={{ fontSize: "13px", color: "lightgray" }}>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-control"
                  required
                  placeholder="Delivery agent will call on this number"
                  style={{
                    backgroundColor: "transparent",
                    color: "white",
                    border: "1px solid lightgray",
                  }}
                />
              </div>

              <div className="form-group mb-3">
                <label className="mb-1" style={{ fontSize: "13px", color: "lightgray" }}>Complete Delivery Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-control mb-3"
                  rows="3"
                  required
                  placeholder="Flat/House No, Building, Street, Landmark, Pincode"
                  style={{
                    backgroundColor: "transparent",
                    color: "white",
                    border: "1px solid lightgray",
                  }}
                />
              </div>

              <div className="form-group mb-3">
                <label className="mb-1" style={{ fontSize: "13px", color: "lightgray" }}>Delivery Notes (Optional)</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. Ring bell twice / leave at door"
                  style={{
                    backgroundColor: "transparent",
                    color: "white",
                    border: "1px solid lightgray",
                  }}
                />
              </div>

              <div className="form-group mb-4">
                <label className="mb-2" style={{ fontSize: "13px", color: "orange" }}>Payment Method</label>
                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentMethod"
                      id="pmCod"
                      value="COD"
                      checked={formData.paymentMethod === "COD"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="pmCod">
                      Cash on Delivery (COD)
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentMethod"
                      id="pmRazorpay"
                      value="Razorpay"
                      checked={formData.paymentMethod === "Razorpay"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="pmRazorpay">
                      Pay Online (Razorpay)
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cart.length === 0}
                style={{
                  backgroundColor: "orange",
                  color: "black",
                  fontWeight: "bold",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                {loading
                  ? "Processing Order..."
                  : formData.paymentMethod === "COD"
                  ? `Place Order (₹${finalAmount.toFixed(2)})`
                  : `Pay Online (₹${finalAmount.toFixed(2)})`}
              </button>
            </form>
          </div>

          <div className="col-lg-5 p-4">
            <div
              className="p-4 rounded"
              style={{
                backgroundColor: "rgba(25, 25, 25, 0.8)",
                border: "1px solid lightgray",
              }}
            >
              <h5 style={{ color: "orange", borderBottom: "1px solid #444", paddingBottom: "10px" }}>Order Summary</h5>
              
              {cart.map((item) => (
                <div key={item.id} className="d-flex justify-content-between my-2" style={{ fontSize: "13px" }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ color: "orange" }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              <hr style={{ borderColor: "#444" }} />

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Tax (5%):</span>
                <span>₹{taxPrice.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping Fee:</span>
                <span>₹{shippingPrice.toFixed(2)}</span>
              </div>

              <hr style={{ borderColor: "#444" }} />

              <div className="d-flex justify-content-between" style={{ fontSize: "18px", fontWeight: "bold" }}>
                <span>Final Total:</span>
                <span style={{ color: "orange" }}>₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
