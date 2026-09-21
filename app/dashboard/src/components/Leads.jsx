import { isRtl } from "../rtl.js";

export function Leads({ leads }) {
  return (
    <table className="leads-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Item</th>
          <th>Language</th>
          <th>Created</th>
          <th>Conversation</th>
        </tr>
      </thead>
      <tbody>
        {leads.length === 0 && (
          <tr>
            <td colSpan={5} className="empty">
              No leads yet
            </td>
          </tr>
        )}
        {leads.map((lead) => (
          <tr key={lead.id}>
            <td dir={isRtl(lead.name) ? "rtl" : "ltr"}>{lead.name}</td>
            <td dir={isRtl(lead.item) ? "rtl" : "ltr"}>{lead.item}</td>
            <td>{lead.language}</td>
            <td>{new Date(lead.createdAt).toLocaleString()}</td>
            <td>{lead.conversationHash.slice(0, 8)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
