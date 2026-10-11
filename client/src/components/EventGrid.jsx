import { FaDog } from "react-icons/fa";
import EventCard from "./EventCard.jsx";

export default function EventGrid({
  events,
  joinedIds,
  busyId,
  onJoin,
  onCancel,
  onDetails,
}) {
  if (events.length === 0) {
    return (
      <div className="text-center meta py-5">
        <FaDog size={40} className="mb-2" />
        <p className="mb-0">No drives found.</p>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {events.map((event) => (
        <div className="col-12 col-md-6 col-lg-4" key={event._id}>
          <EventCard
            event={event}
            joined={joinedIds.includes(event._id)}
            busy={busyId === event._id}
            onJoin={onJoin}
            onCancel={onCancel}
            onDetails={onDetails}
          />
        </div>
      ))}
    </div>
  );
}