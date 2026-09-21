import { detectLanguage } from "./language.js";
import { matchesKeyword } from "./keywords.js";

const HUMAN_KEYWORDS = {
  en: ["human", "agent", "representative", "person"],
  he: ["נציג", "אדם", "בנאדם"],
  ar: ["موظف", "انسان", "إنسان", "بشري"],
};

const ORDER_KEYWORDS = {
  en: ["order", "place an order"],
  he: ["להזמין", "הזמנה"],
  ar: ["اطلب", "طلب"],
};

const HUMAN_HANDOFF_MESSAGE = {
  en: "Sure, connecting you with a team member now.",
  he: "בטח, אני מעביר אותך לנציג אנושי.",
  ar: "بالتأكيد، سأحولك إلى أحد الموظفين.",
};

export function wantsHuman(text) {
  return matchesKeyword(text, HUMAN_KEYWORDS, detectLanguage(text));
}

export function wantsToOrder(text) {
  return matchesKeyword(text, ORDER_KEYWORDS, detectLanguage(text));
}

export function humanHandoffMessage(text) {
  return HUMAN_HANDOFF_MESSAGE[detectLanguage(text)];
}
