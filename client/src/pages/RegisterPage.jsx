import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPaw } from "react-icons/fa";
import { registerUser, errorMessage } from "../api.js";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.name.trim().length < 2) return setError("Name must be at least 2 characters");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirm) return setError("Passwords do not match");

    setLoading(true);
    try {
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      // Do not log the user in here; send them to the login page instead
      navigate("/login", {
        replace: true,
        state: { registered: true, email: form.email },
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-5">
        <div className="paw-card p-4">
          <div className="text-center mb-2" style={{ color: "var(--orange)" }}>
            <FaPaw size={36} />
          </div>
          <h3 className="fw-bold text-center mb-1">Join PawHelp</h3>
          <p className="text-center meta">Create an account to volunteer.</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label fw-bold">Name</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Email</label>
              <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Password</label>
              <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Confirm password</label>
              <input type="password" name="confirm" className="form-control" value={form.confirm} onChange={handleChange} />
            </div>
            <button className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}