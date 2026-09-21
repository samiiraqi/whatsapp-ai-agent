const TEMPLATES = {
  en: {
    askName: () => "Great! Can I get your name?",
    askItem: (name) => `Thanks ${name}! What would you like to order?`,
    confirm: (name, item) =>
      `Thanks ${name}, we've got your order for "${item}". Someone will follow up soon.`,
  },
  he: {
    askName: () => "מעולה! מה השם שלך?",
    askItem: (name) => `תודה ${name}! מה תרצה להזמין?`,
    confirm: (name, item) =>
      `תודה ${name}, קיבלנו את ההזמנה שלך ל"${item}". ניצור איתך קשר בקרוב.`,
  },
  ar: {
    askName: () => "رائع! ما اسمك؟",
    askItem: (name) => `شكرًا ${name}! ماذا تريد أن تطلب؟`,
    confirm: (name, item) =>
      `شكرًا ${name}، استلمنا طلبك لـ"${item}". سنتواصل معك قريبًا.`,
  },
};

export function startOrderFlow(language) {
  return {
    state: { step: "awaiting_name", language },
    reply: TEMPLATES[language].askName(),
  };
}

export function continueOrderFlow(state, text) {
  const templates = TEMPLATES[state.language];
  const value = text.trim();

  if (state.step === "awaiting_name") {
    return {
      state: { step: "awaiting_item", language: state.language, name: value },
      reply: templates.askItem(value),
    };
  }

  return {
    state: null,
    reply: templates.confirm(state.name, value),
    lead: { name: state.name, item: value, language: state.language },
  };
}
