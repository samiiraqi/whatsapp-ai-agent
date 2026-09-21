export function Overview({ conversations, leads }) {
  const handoffCount = conversations.filter((c) => c.handoff).length;

  return (
    <div className="stats">
      <div className="stat-card">
        <span className="stat-value">{conversations.length}</span>
        <span className="stat-label">Conversations</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{leads.length}</span>
        <span className="stat-label">Leads</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{handoffCount}</span>
        <span className="stat-label">Handed to human</span>
      </div>
    </div>
  );
}
