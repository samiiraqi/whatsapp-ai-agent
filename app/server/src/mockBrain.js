// BrainAdapter interface: reply(context) -> { text, handoff }

import { detectLanguage } from "./language.js";
import { matchesKeyword } from "./keywords.js";
import { wantsHuman, humanHandoffMessage } from "./intents.js";

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
    products: (business) => `Our products: ${formatProducts(business, "en")}.`,
    productPrice: (product, business) =>
      `${productName(product, "en")} costs ${product.price.toFixed(2)} ${business.currency}.`,
    address: (business) => `You can find us at ${business.address}.`,
    unknownHandoff: () =>
      "Sorry, I didn't understand that. Let me get a team member to help you.",
  },
  he: {
    hours: (business) => `שעות הפעילות שלנו: ${business.hours}.`,
    products: (business) => `המוצרים שלנו: ${formatProducts(business, "he")}.`,
    productPrice: (product, business) =>
      `${productName(product, "he")} עולה ${product.price.toFixed(2)} ${business.currency}.`,
    address: (business) => `הכתובת שלנו: ${business.address}.`,
    unknownHandoff: () => "מצטערים, לא הבנו את השאלה. נעביר אותך לנציג אנושי.",
  },
  ar: {
    hours: (business) => `ساعات عملنا: ${business.hours}.`,
    products: (business) => `منتجاتنا: ${formatProducts(business, "ar")}.`,
    productPrice: (product, business) =>
      `سعر ${productName(product, "ar")}: ${product.price.toFixed(2)} ${business.currency}.`,
    address: (business) => `عنواننا: ${business.address}.`,
    unknownHandoff: () => "عذرًا، لم أفهم سؤالك. سأحولك إلى أحد الموظفين.",
  },
};

function productName(product, language) {
  return product.name[language] ?? product.name.en;
}

function formatProducts(business, language) {
  return business.products
    .map(
      (p) => `${productName(p, language)} - ${p.price.toFixed(2)} ${business.currency}`
    )
    .join(", ");
}

function findMentionedProduct(text, business, language) {
  const lower = text.toLowerCase();
  return business.products.find((product) =>
    productName(product, language)
      .split(/\s+/)
      .some((word) => word.length > 1 && lower.includes(word.toLowerCase()))
  );
}

export class MockBrain {
  constructor(business) {
    this.business = business;
  }

  reply(context) {
    const text = context.text ?? "";
    const language = detectLanguage(text);
    const templates = TEMPLATES[language];

    if (wantsHuman(text)) {
      return { text: humanHandoffMessage(text), handoff: true };
    }

    if (matchesKeyword(text, HOURS_KEYWORDS, language)) {
      return { text: templates.hours(this.business), handoff: false };
    }

    if (matchesKeyword(text, PRODUCT_KEYWORDS, language)) {
      const product = findMentionedProduct(text, this.business, language);
      if (product) {
        return {
          text: templates.productPrice(product, this.business),
          handoff: false,
        };
      }
      return { text: templates.products(this.business), handoff: false };
    }

    if (matchesKeyword(text, ADDRESS_KEYWORDS, language)) {
      return { text: templates.address(this.business), handoff: false };
    }

    return { text: templates.unknownHandoff(), handoff: true };
  }
}
