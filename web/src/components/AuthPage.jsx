import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api/authApi";

export default function AuthPage({ mode, onAuth }) {
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (isRegister && password !== rePassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const authData = isRegister
        ? await registerUser({ username, email, password, rePassword })
        : await loginUser({ username, password });

      onAuth(authData.user);
      navigate("/analyze", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>{isRegister ? "Create Account" : "Login"}</h1>

        <label className="auth-field">
          <span>Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            minLength={3}
            maxLength={40}
            pattern="[a-zA-Z0-9_.-]+"
            placeholder="nguyenvana"
          />
        </label>

        {isRegister && (
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>
        )}

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
        </label>

        {isRegister && (
          <label className="auth-field">
            <span>Re-password</span>
            <input
              type="password"
              value={rePassword}
              onChange={(event) => setRePassword(event.target.value)}
              required
              minLength={6}
              placeholder="Enter password again"
            />
          </label>
        )}

        {error && <div className="error">{error}</div>}

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "Need an account?"}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Login" : "Register"}
          </Link>
        </p>
      </form>
    </div>
  );
}
