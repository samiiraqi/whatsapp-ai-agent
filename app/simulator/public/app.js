const PHONE_KEY = "simulatorPhone";

function getPhone() {
  let phone = localStorage.getItem(PHONE_KEY);
  if (!phone) {
    phone = "1555" + Math.floor(1000000 + Math.random() * 8999999);
    localStorage.setItem(PHONE_KEY, phone);
  }
  return phone;
}

function isRtl(text) {
  return /[֐-׿؀-ۿ]/.test(text);
}

const phone = getPhone();
const messagesEl = document.getElementById("messages");
const form = document.getElementById("composer");
const input = document.getElementById("text");
const badge = document.getElementById("handoff-badge");
const statusBanner = document.getElementById("status-banner");
const seenIds = new Set();

function showStatus(text) {
  statusBanner.textContent = text;
  statusBanner.classList.remove("hidden");
}

function hideStatus() {
  statusBanner.classList.add("hidden");
}

function addBubble(text, direction) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${direction}`;
  bubble.dir = isRtl(text) ? "rtl" : "ltr";
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addBubble(text, "out");
  input.value = "";

  try {
    const res = await fetch("/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, text }),
    });

    if (res.status === 503) {
      const data = await res.json().catch(() => ({}));
      showStatus(data.error || "Server is not running");
    }
  } catch {
    showStatus("Server is not running");
  }
});

async function poll() {
  try {
    const res = await fetch("/outbox");
    const data = await res.json();

    if (res.status === 503) {
      showStatus(data.error || "Server is not running");
      return;
    }
    hideStatus();

    let handoff = false;

    for (const message of data.messages ?? []) {
      if (message.to !== phone) continue;
      if (message.handoff) handoff = true;
      if (!seenIds.has(message.id)) {
        seenIds.add(message.id);
        addBubble(message.text, "in");
      }
    }

    badge.classList.toggle("hidden", !handoff);
  } catch {
    showStatus("Server is not running");
  }
}

setInterval(poll, 1500);
poll();
