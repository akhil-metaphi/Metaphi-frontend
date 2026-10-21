import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { loginUser } from "../../services/api";

const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!mobileNumber || !password) {
      setError(
        "Mobile number and password are required."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({
        mobileNumber,
        password,
      });

      // Store authentication data
      localStorage.setItem(
        "token",
        response.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.user)
      );

      console.log(
        "Login successful:",
        response
      );

      // Redirect to Dashboard
      navigate("/dashboard");

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* =========================
            LEFT BRANDING SECTION
        ========================= */}
        <div className="branding-section">

          <div className="branding-content">

            <div className="logo-effect">

              <div className="circle circle-1">

                <div className="circle circle-2">

                  <div className="circle circle-3">

                    <div className="circle circle-3">

                      <img
                        src="/Logo.png"
                        alt="Metaphi Logo"
                      />

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <p className="copyright">
              © Copyright 2026
            </p>

          </div>

        </div>


        {/* =========================
            RIGHT LOGIN SECTION
        ========================= */}
        <div className="login-section">

          {/* Logo for smaller screens */}
          <div className="mobile-logo">

            <img
              src="/Logo.png"
              alt="Metaphi Logo"
            />

          </div>


          <div className="login-content">

            {/* Welcome */}
            <div className="welcome-section">

              <h1>Welcome Back</h1>

              <p>
                Sign in to continue to Dashboard
              </p>

            </div>


            {/* Form */}
            <form
              className="login-form"
              onSubmit={handleSubmit}
            >

              {/* Mobile Number */}
              <div className="form-group">

                <label htmlFor="mobile">
                  Mobile Number{" "}
                  <span>*</span>
                </label>

                <input
                  id="mobile"
                  name="mobile_number"
                  type="tel"
                  placeholder="Enter your mobile number"
                  maxLength={10}
                  autoComplete="tel"
                  value={mobileNumber}
                  onChange={(e) =>
                    setMobileNumber(
                      e.target.value
                    )
                  }
                />

              </div>


              {/* Password */}
              <div className="form-group">

                <div className="password-header">

                  <label htmlFor="password">
                    Password{" "}
                    <span>*</span>
                  </label>

                  <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate("/forgot-password"); }}>
                    Forgot password?
                  </a>

                </div>


                <div className="password-wrapper">

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword
                      ? "◉"
                      : "◌"}
                  </button>

                </div>

              </div>


              {/* Error */}
              {error && (
                <div
                  style={{
                    color: "#dc3545",
                    fontSize: "14px",
                    marginTop: "-5px",
                    marginBottom: "15px",
                  }}
                >
                  {error}
                </div>
              )}


              {/* Remember Me */}
              <div className="remember-me">

                <input
                  id="rememberMe"
                  name="remember_me"
                  type="checkbox"
                />

                <label htmlFor="rememberMe">
                  Remember me
                </label>

              </div>


              {/* Sign In */}
              <div className="button-container">

                <button
                  type="submit"
                  className="sign-in-button"
                  disabled={loading}
                >
                  {loading
                    ? "Signing In..."
                    : "Sign In"}
                </button>

              </div>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;