import React, { useState } from "react";
import "../Pages/signup.css";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../Contex/AuthContext";
import apiClient from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthContext();
  const redirectPath = new URLSearchParams(location.search).get("redirect") || "/food";

  const backgroundStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/bg.jpg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter otp & new password
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user && user.roles && user.roles.includes("admin")) {
        navigate("/admin/dashboard");
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Invalid credentials. Please try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiClient.post("/auth/forgot-password", { email: email.trim() });
      setSuccessMessage(res.data?.message || "Password reset OTP dispatched.");
      setForgotStep(2);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetOtp || !newPassword || !confirmNewPassword) {
      setErrorMessage("Please fill all required fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiClient.post("/auth/reset-password", {
        email: email.trim(),
        otp: resetOtp.trim(),
        new_password: newPassword,
        confirm_password: confirmNewPassword,
      });
      setSuccessMessage(res.data?.message || "Password reset successfully. You can now login.");
      setForgotMode(false);
      setForgotStep(1);
      setPassword("");
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}></div>

      <div className="Main" style={{ position: "relative", zIndex: "5", paddingBottom: "60px" }}>
        <div className="sign-up-container">
          <h2>{forgotMode ? "Reset Password" : "Welcome Back"}</h2>

          {errorMessage && <div className="alert alert-danger py-2 small">{errorMessage}</div>}
          {successMessage && <div className="alert alert-success py-2 small">{successMessage}</div>}

          {!forgotMode ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  style={{ color: "white" }}
                />
              </div>

              <div className="form-group">
                <div className="d-flex justify-content-between align-items-center">
                  <label htmlFor="password">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "orange",
                      fontSize: "12px",
                      width: "auto",
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ color: "white" }}
                />
              </div>

              <button type="submit" className="btn-submit mt-2" disabled={loading}>
                {loading ? "Authenticating..." : "Login"}
              </button>

              <div className="d-flex mt-3 justify-content-center">
                <span style={{ color: "lightgray" }}>Don't have an account?</span>
                &nbsp;&nbsp;
                <NavLink to={`/signup${location.search}`} style={{ color: "orange", textDecoration: "none" }}>
                  <strong>Create Account</strong>
                </NavLink>
              </div>
            </form>
          ) : forgotStep === 1 ? (
            <form onSubmit={handleSendResetOtp}>
              <p style={{ color: "lightgray", fontSize: "13px", textAlign: "center" }}>
                Enter your registered email address to receive a 6-digit password reset OTP.
              </p>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{ color: "white" }}
                />
              </div>

              <button type="submit" className="btn-submit mt-2" disabled={loading}>
                {loading ? "Sending OTP..." : "Send Reset OTP"}
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "lightgray",
                    fontSize: "12px",
                    width: "auto",
                    padding: 0,
                  }}
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="resetOtp">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  id="resetOtp"
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="------"
                  required
                  style={{ color: "orange", letterSpacing: "6px", textAlign: "center", fontWeight: "bold" }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  required
                  style={{ color: "white" }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{ color: "white" }}
                />
              </div>

              <button type="submit" className="btn-submit mt-2" disabled={loading}>
                {loading ? "Resetting..." : "Set New Password"}
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "lightgray",
                    fontSize: "12px",
                    width: "auto",
                    padding: 0,
                  }}
                >
                  ← Request another code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
