import { useEffect, useState } from "react";
import { Overview } from "./components/Overview.jsx";
import { Conversations } from "./components/Conversations.jsx";
import { Leads } from "./components/Leads.jsx";

const TABS = ["overview", "conversations", "leads"];

export function App() {
  const [tab, setTab] = useState("overview");
  const [conversations, setConversations] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [conversationsRes, leadsRes] = await Promise.all([
          fetch("/dev/conversations"),
          fetch("/dev/leads"),
        ]);

        if (conversationsRes.ok) {
          const data = await conversationsRes.json();
          setConversations(data.conversations ?? []);
        }

        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setLeads(data.leads ?? []);
        }
      } catch {
        // app/server may not be running yet; keep showing the last known data
      }
    }

    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>WhatsApp Agent Dashboard</h1>
        <nav>
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={tab === name ? "selected" : ""}
              onClick={() => setTab(name)}
            >
              {name[0].toUpperCase() + name.slice(1)}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {tab === "overview" && (
          <Overview conversations={conversations} leads={leads} />
        )}
        {tab === "conversations" && (
          <Conversations conversations={conversations} />
        )}
        {tab === "leads" && <Leads leads={leads} />}
      </main>
    </div>
  );
}
