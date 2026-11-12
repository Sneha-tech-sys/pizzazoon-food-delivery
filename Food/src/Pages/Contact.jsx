import React, { useState, useEffect } from 'react';
import '../Pages/signup.css';
import '../Pages/App.css';
import apiClient from '../api/client';

export default function Contact() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    otp: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address first.' });
      return;
    }
    if (!formData.fullName || !formData.phone || !formData.subject || !formData.message) {
      setStatusMessage({ type: 'error', text: 'Please fill in all contact fields before requesting OTP.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await apiClient.post('/contacts/send-otp', { email: formData.email });
      setOtpSent(true);
      setCountdown(60);
      setStatusMessage({
        type: 'success',
        text: res.data?.message || 'A 6-digit verification code has been dispatched to your email.',
      });
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to send OTP. Try again.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) {
      setStatusMessage({ type: 'error', text: 'Please enter the valid 6-digit OTP received in your email.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const payload = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        otp: formData.otp,
      };
      const res = await apiClient.post('/contacts/submit', payload);
      setStatusMessage({
        type: 'success',
        text: res.data?.message || 'Inquiry submitted successfully! A confirmation email has been sent.',
      });
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        otp: '',
      });
      setOtpSent(false);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Submission failed. Please check OTP.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const backgroundStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/bg.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    minHeight: '100vh',
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 0,
  };

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}></div>
      <div className="Main" style={{ position: 'relative', zIndex: '5', paddingBottom: '60px' }}>
        <div className="sign-up-container" style={{ maxWidth: '520px' }}>
          <h2>
            Get in <span style={{ color: 'orange' }}>Touch</span>
          </h2>
          <p style={{ textAlign: 'center', color: 'lightgray', fontSize: '13px', marginTop: '-10px' }}>
            Fill the form and verify your email to submit your message directly to our team.
          </p>

          {statusMessage.text && (
            <div
              className={`alert ${statusMessage.type === 'error' ? 'alert-danger' : 'alert-success'} py-2 my-3`}
              style={{ fontSize: '13px', borderRadius: '4px' }}
            >
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={otpSent ? handleSubmit : handleSendOtp}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                disabled={otpSent}
                style={{ color: 'white' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={otpSent}
                style={{ color: 'white' }}
              />
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
                required
                disabled={otpSent}
                style={{ color: 'white' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this regarding?"
                required
                disabled={otpSent}
                style={{ color: 'white' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows="4"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message here..."
                required
                disabled={otpSent}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  border: '1px solid lightgray',
                  borderRadius: '4px',
                  color: 'white',
                }}
              />
            </div>

            {otpSent && (
              <div className="form-group" style={{ backgroundColor: 'rgba(255,165,0,0.1)', padding: '15px', borderRadius: '6px' }}>
                <label htmlFor="otp" style={{ color: 'orange' }}>
                  Enter 6-Digit Email OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  maxLength={6}
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  required
                  style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '18px', color: 'orange', fontWeight: 'bold' }}
                />
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={countdown > 0 || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: countdown > 0 ? 'gray' : 'orange',
                      fontSize: '12px',
                      cursor: countdown > 0 ? 'default' : 'pointer',
                      width: 'auto',
                      padding: 0,
                    }}
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'lightgray',
                      fontSize: '12px',
                      width: 'auto',
                      padding: 0,
                    }}
                  >
                    Edit Info
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="btn-submit mt-3" disabled={loading}>
              {loading ? 'Processing...' : otpSent ? 'Verify OTP & Submit Inquiry' : 'Send Verification OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
