import type { ActivityEvent } from "@atomic/shared";

interface ActivityFeedProps {
  events: ActivityEvent[];
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <section className="panel">
      <h2>Activity</h2>
      <ul className="activity-list">
        {events.length === 0 ? (
          <li>No activity yet — agent runs and deploys will appear here.</li>
        ) : (
          events.map((event) => (
            <li key={event.id}>
              <strong>{event.type}</strong>: {event.summary}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
