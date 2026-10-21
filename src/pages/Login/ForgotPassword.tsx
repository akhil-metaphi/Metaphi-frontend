import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset, verifyOTP, resetPassword } from "../../services/api";
import "./ForgotPassword.css";

const EnvelopeIcon = () => (
  <svg width="84" height="56" viewBox="0 0 84 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", margin: "0 auto" }}>
    <g transform="translate(18, 6)">
      {/* Base rounded rectangle */}
      <rect width="66" height="44" rx="4.5" fill="#67E8F9" />
      
      {/* Inner shadow/darker background */}
      <path d="M0 4.5 C0 2.01472 2.01472 0 4.5 0 L61.5 0 C63.9853 0 66 2.01472 66 4.5 L66 39.5 C66 41.9853 63.9853 44 61.5 44 L4.5 44 C2.01472 44 0 41.9853 0 39.5 L0 4.5 Z" fill="#38BDF8" />
      
      {/* Top flap */}
      <path d="M0 4.5 C0 2.01472 2.01472 0 4.5 0 L61.5 0 C63.9853 0 66 2.01472 66 4.5 L33 26 L0 4.5 Z" fill="#7DD3FC" />
      
      {/* Shadow overlay for depth */}
      <path d="M0 4.5 L33 26 L66 4.5" stroke="rgba(0,0,0,0.03)" strokeWidth="1" fill="none" />
      
      {/* Bottom flap overlap */}
      <path d="M0 44 L33 24 L66 44 Z" fill="#22D3EE" />
      
    </g>

    {/* Three Speed Lines */}
    <path d="M2 18 L12 18" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M7 28 L17 28" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M2 38 L12 38" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await requestPasswordReset(email);
      setSuccess(res.message);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to request OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP sent to your email.");
      return;
    }
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await verifyOTP(email, otp);
      setSuccess(res.message);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await resetPassword(email, otp, newPassword);
      setSuccess(res.message);
      // Short delay before redirecting to login
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        
        <div className="forgot-password-header">
          <h2>Forgot Password?</h2>
          <p>Reset password with Rnets & Knots</p>
        </div>

        <div className="envelope-icon">
          <EnvelopeIcon />
        </div>

        <div className="alert-box">
          {step === 1 && "Enter your email and OTP will be sent to you!"}
          {step === 2 && `An OTP has been sent to ${email}`}
          {step === 3 && "Please enter your new password to reset it!"}
        </div>

        {error && <div className="error-message-fp">{error}</div>}
        {success && <div className="success-message-fp">{success}</div>}

        {step === 1 && (
          <form className="forgot-password-form" onSubmit={handleRequestOTP}>
            <div className="form-group-fp">
              <label htmlFor="email">Email <span>*</span></label>
              <input
                id="email"
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn-fp" disabled={isLoading}>
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="forgot-password-form" onSubmit={handleVerifyOTP}>
            <div className="form-group-fp">
              <label htmlFor="otp">OTP <span>*</span></label>
              <input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn-fp" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
            
            <div className="back-to-login">
              <a onClick={() => { setStep(1); setSuccess(""); setError(""); }}>
                Change Email
              </a>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="forgot-password-form" onSubmit={handleResetPassword}>
            <div className="form-group-fp">
              <label htmlFor="newPassword">New Password <span>*</span></label>
              <div className="password-wrapper-fp">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-fp"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-group-fp">
              <label htmlFor="confirmPassword">Confirm Password <span>*</span></label>
              <div className="password-wrapper-fp">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-fp"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn-fp" disabled={isLoading}>
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="back-to-login">
          Wait, I remember my password... <a onClick={() => navigate("/login")}>Click here</a>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
