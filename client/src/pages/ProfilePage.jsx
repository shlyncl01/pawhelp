import { useState } from "react";
import { updateProfile, errorMessage } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (name.trim().length < 2) return setError("Name must be at least 2 characters");
    if (password && password.length < 6)
      return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords do not match");
    if (name.trim() === user.name && !password) return setError("No changes to save");

    setLoading(true);
    try {
      const data = { name: name.trim() };
      if (password) data.password = password;
      const res = await updateProfile(data);
      updateUser(res.data.user);
      setPassword("");
      setConfirm("");
      setSuccess("Profile updated.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <div className="paw-card p-4">
          <h3 className="fw-bold mb-3">My profile</h3>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            <div className="mb-3">
              <label className="form-label fw-bold">Email</label>
              <input className="form-control" value={user.email} disabled />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Role</label>
              <input className="form-control" value={user.role} disabled />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Name</label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">New password (leave blank to keep)</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Confirm new password</label>
              <input
                type="password"
                className="form-control"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}