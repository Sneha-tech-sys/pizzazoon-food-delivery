import React, { useState, useEffect } from "react";
import "../Pages/signup.css";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../Contex/AuthContext";
import apiClient from "../api/client";

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, verifySignupOtp } = useAuthContext();
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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-15 digit phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await signup({
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });

      setOtpStep(true);
      setResendCountdown(60);
      setApiSuccess(res?.message || "Registration successful! A 6-digit verification code has been sent to your email.");
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Registration failed. Please try again.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    if (!formData.otp || formData.otp.length !== 6) {
      setApiError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      await verifySignupOtp(formData.email.trim(), formData.otp.trim());
      navigate(redirectPath);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Invalid or expired OTP.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setLoading(true);
    setApiError("");
    try {
      await apiClient.post("/auth/resend-otp", {
        email: formData.email.trim(),
        purpose: "signup",
      });
      setResendCountdown(60);
      setApiSuccess("A new 6-digit verification code has been dispatched to your email.");
    } catch (err) {
      setApiError(err.response?.data?.detail || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}></div>

      <div className="Main" style={{ position: "relative", zIndex: "5", paddingBottom: "60px" }}>
        <div className="sign-up-container">
          <h2>{otpStep ? "Verify Your Email" : "Create an Account"}</h2>

          {apiError && <div className="alert alert-danger py-2 small">{apiError}</div>}
          {apiSuccess && <div className="alert alert-success py-2 small">{apiSuccess}</div>}

          {!otpStep ? (
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  style={{ color: "white" }}
                />
                {errors.name && <p className="error">{errors.name}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  style={{ color: "white" }}
                />
                {errors.email && <p className="error">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  style={{ color: "white" }}
                />
                {errors.phone && <p className="error">{errors.phone}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  style={{ color: "white" }}
                />
                {errors.password && <p className="error">{errors.password}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  style={{ color: "white" }}
                />
                {errors.confirmPassword && (
                  <p className="error">{errors.confirmPassword}</p>
                )}
              </div>

              <button type="submit" className="btn-submit mt-2" disabled={loading}>
                {loading ? "Creating Account..." : "Sign Up"}
              </button>

              <div className="d-flex mt-3 justify-content-center">
                <span style={{ color: "lightgray" }}>Already have an account?</span>
                &nbsp;&nbsp;
                <NavLink to="/login" style={{ color: "orange", textDecoration: "none" }}>
                  <strong>Login</strong>
                </NavLink>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <p style={{ color: "lightgray", fontSize: "13px", textAlign: "center" }}>
                We sent a 6-digit confirmation code to: <br />
                <strong style={{ color: "orange" }}>{formData.email}</strong>
              </p>

              <div className="form-group my-3">
                <label htmlFor="otp" style={{ color: "orange", textAlign: "center" }}>
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  maxLength={6}
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="------"
                  style={{
                    color: "orange",
                    letterSpacing: "8px",
                    textAlign: "center",
                    fontSize: "20px",
                    fontWeight: "bold",
                  }}
                />
              </div>

              <button type="submit" className="btn-submit mt-2" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Activate Account"}
              </button>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCountdown > 0 ? "gray" : "orange",
                    fontSize: "12px",
                    width: "auto",
                    padding: 0,
                  }}
                >
                  {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : "Resend OTP"}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpStep(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "lightgray",
                    fontSize: "12px",
                    width: "auto",
                    padding: 0,
                  }}
                >
                  Edit Information
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
