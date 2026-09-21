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
const seenIds = new Set();

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

  await fetch("/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, text }),
  });
});

async function poll() {
  try {
    const res = await fetch("/outbox");
    const data = await res.json();
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
    // app server or simulator may not be reachable yet; retry next tick
  }
}

setInterval(poll, 1500);
poll();
