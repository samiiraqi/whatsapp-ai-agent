// BrainAdapter interface: reply(context) -> { text, handoff }

import { detectLanguage } from "./language.js";

const HUMAN_KEYWORDS = {
  en: ["human", "agent", "representative", "person"],
  he: ["נציג", "אדם", "בנאדם"],
  ar: ["موظف", "انسان", "إنسان", "بشري"],
};

const HOURS_KEYWORDS = {
  en: ["hour", "open", "close", "time"],
  he: ["שעות", "פתוח", "סגור"],
  ar: ["ساعات", "دوام", "مفتوح", "مغلق"],
};

const PRODUCT_KEYWORDS = {
  en: ["price", "product", "cost", "menu", "buy"],
  he: ["מחיר", "מוצר", "מוצרים", "לקנות"],
  ar: ["سعر", "منتج", "منتجات", "شراء"],
};

const ADDRESS_KEYWORDS = {
  en: ["address", "location", "where"],
  he: ["כתובת", "איפה", "מיקום"],
  ar: ["عنوان", "أين", "موقع"],
};

const TEMPLATES = {
  en: {
    hours: (business) => `We're open ${business.hours}.`,
    products: (business) =>
      `Our products: ${formatProducts(business)}.`,
    address: (business) => `You can find us at ${business.address}.`,
    humanHandoff: () => "Sure, connecting you with a team member now.",
    unknownHandoff: () =>
      "Sorry, I didn't understand that. Let me get a team member to help you.",
  },
  he: {
    hours: (business) => `שעות הפעילות שלנו: ${business.hours}.`,
    products: (business) => `המוצרים שלנו: ${formatProducts(business)}.`,
    address: (business) => `הכתובת שלנו: ${business.address}.`,
    humanHandoff: () => "בטח, אני מעביר אותך לנציג אנושי.",
    unknownHandoff: () => "מצטערים, לא הבנו את השאלה. נעביר אותך לנציג אנושי.",
  },
  ar: {
    hours: (business) => `ساعات عملنا: ${business.hours}.`,
    products: (business) => `منتجاتنا: ${formatProducts(business)}.`,
    address: (business) => `عنواننا: ${business.address}.`,
    humanHandoff: () => "بالتأكيد، سأحولك إلى أحد الموظفين.",
    unknownHandoff: () => "عذرًا، لم أفهم سؤالك. سأحولك إلى أحد الموظفين.",
  },
};

function formatProducts(business) {
  return business.products
    .map((p) => `${p.name} - ${p.price.toFixed(2)} ${business.currency}`)
    .join(", ");
}

function matchesKeyword(text, keywordsByLanguage, language) {
  const keywords = keywordsByLanguage[language] ?? keywordsByLanguage.en;
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

export class MockBrain {
  constructor(business) {
    this.business = business;
  }

  reply(context) {
    const text = context.text ?? "";
    const language = detectLanguage(text);
    const templates = TEMPLATES[language];

    if (matchesKeyword(text, HUMAN_KEYWORDS, language)) {
      return { text: templates.humanHandoff(), handoff: true };
    }

    if (matchesKeyword(text, HOURS_KEYWORDS, language)) {
      return { text: templates.hours(this.business), handoff: false };
    }

    if (matchesKeyword(text, PRODUCT_KEYWORDS, language)) {
      return { text: templates.products(this.business), handoff: false };
    }

    if (matchesKeyword(text, ADDRESS_KEYWORDS, language)) {
      return { text: templates.address(this.business), handoff: false };
    }

    return { text: templates.unknownHandoff(), handoff: true };
  }
}
