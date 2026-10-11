import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaPaw } from "react-icons/fa";
import {
    fetchMyEvents,
    fetchMyRegistrations,
    cancelEvent,
    errorMessage,
} from "../api.js";
import DriveBrowser from "../components/DriveBrowser.jsx";
import { todayString } from "../utils.js";



export default function DashboardPage() {
    const [myEvents, setMyEvents] = useState([]);
    const [joined, setJoined] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [browserKey, setBrowserKey] = useState(0);
    const [heroOk, setHeroOk] = useState(true);

    const load = async () => {
        try {
            const [mine, regs] = await Promise.all([fetchMyEvents(), fetchMyRegistrations()]);
            setMyEvents(mine.data);
            setJoined(regs.data);
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleCancel = async (eventId) => {
        setError("");
        setSuccess("");
        setBusyId(eventId);
        try {
            await cancelEvent(eventId);
            setSuccess("Your spot was cancelled.");
            await load();
            setBrowserKey((k) => k + 1);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    const volunteersSignedUp = myEvents.reduce((sum, e) => sum + e.registered, 0);
    const upcoming = joined.filter((r) => r.event.date >= todayString()).length;

    const stats = [
        { label: "Drives I organize", value: myEvents.length, color: "stat-orange" },
        { label: "Volunteers signed up", value: volunteersSignedUp, color: "stat-orange" },
        { label: "Drives I joined", value: joined.length, color: "stat-teal" },
        { label: "My upcoming drives", value: upcoming, color: "stat-teal" },
    ];

    return (
        <>
            <section className="hero mb-4">
                <div className="row align-items-center g-4">
                    <div className="col-12 col-lg-6">
                        <div className="hero-eyebrow mb-2">Volunteer drives for animals</div>
                        <h1 className="display-5 mb-3">Find a drive. Lend a hand. Change a tail.</h1>
                        <p className="mb-4">
                            Shelters and rescuers post volunteer drives. You pick one, reserve a
                            slot, and show up ready to help.
                        </p>
                        <div className="d-flex gap-2 flex-wrap">
                            <Link to="/drives" className="btn btn-light btn-lg">Browse Drives</Link>
                            <Link to="/my-drives" className="btn btn-outline-light btn-lg">Post a Drive</Link>
                        </div>
                    </div>
                    <div className="col-lg-6 d-none d-lg-block">
                        {heroOk ? (
                            <img
                                src="/hero.jpg"
                                alt="Volunteer walking a shelter dog"
                                className="hero-photo"
                                onError={() => setHeroOk(false)}
                            />
                        ) : (
                            <div className="hero-photo d-flex">
                                <FaPaw size={96} />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="row g-3 mb-5">
                {stats.map((s) => (
                    <div className="col-6 col-lg-3" key={s.label}>
                        <div className="stat-card">
                            <div className={`stat-number ${s.color}`}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <DriveBrowser key={browserKey} title="Upcoming Drives" onChange={load} />

            <h2 className="section-title mt-5 mb-3">Drives I joined</h2>
            {joined.length === 0 ? (
                <p className="meta">
                    You have not joined any drives yet. <Link to="/drives">Browse drives</Link>
                </p>
            ) : (
                <div className="table-responsive paw-card">
                    <table className="table align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Drive</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {joined.map((r) => (
                                <tr key={r._id}>
                                    <td className="fw-bold">{r.event.title}</td>
                                    <td>{r.event.date} {r.event.time}</td>
                                    <td>{r.event.location}</td>
                                    <td className="text-end">
                                        {r.event.date < todayString() ? (
                                            <span className="meta">Ended</span>
                                        ) : (
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                disabled={busyId === r.event._id}
                                                onClick={() => handleCancel(r.event._id)}
                                            >
                                                {busyId === r.event._id ? "Please wait..." : "Cancel"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}