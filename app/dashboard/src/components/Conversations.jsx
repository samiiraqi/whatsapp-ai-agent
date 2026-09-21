import { useEffect, useState } from "react";
import { MessageBubble } from "./MessageBubble.jsx";

export function Conversations({ conversations }) {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="conversations">
      <ul className="conversation-list">
        {conversations.length === 0 && (
          <li className="empty">No conversations yet</li>
        )}
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <button
              type="button"
              className={conversation.id === selectedId ? "selected" : ""}
              onClick={() => setSelectedId(conversation.id)}
            >
              <span className="conversation-id">{conversation.id}</span>
              <span className="conversation-lang">{conversation.language}</span>
              {conversation.handoff && (
                <span className="badge">Handed to human</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="thread">
        {selected ? (
          selected.messages.map((message, index) => (
            <MessageBubble
              key={index}
              text={message.text}
              direction={message.direction}
            />
          ))
        ) : (
          <p className="empty">Select a conversation</p>
        )}
      </div>
    </div>
  );
}
