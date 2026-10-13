import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaPaw } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg paw-navbar">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/" onClick={close}>
          <FaPaw size={28} className="brand-icon" />
          <span className="brand-text">Paw<span>Help</span></span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${open ? "show" : ""}`}>
          {user ? (
            <>
              <ul className="navbar-nav me-auto ms-lg-3">
                <li className="nav-item">
                  <NavLink className="nav-link" to="/" end onClick={close}>Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/drives" onClick={close}>Drives</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/calendar" onClick={close}>Calendar</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/my-drives" onClick={close}>My Drives</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/profile" onClick={close}>Profile</NavLink>
                </li>
              </ul>
              <div className="d-flex align-items-center gap-3 mt-2 mt-lg-0">
                <span className="nav-greeting">Hi, {user.name}</span>
                <button className="btn btn-outline-primary" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="d-flex gap-2 ms-auto mt-2 mt-lg-0">
              <Link className="btn btn-outline-primary" to="/login" onClick={close}>Login</Link>
              <Link className="btn btn-primary" to="/register" onClick={close}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}