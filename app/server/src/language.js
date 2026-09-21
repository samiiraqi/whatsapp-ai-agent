export function detectLanguage(text) {
  if (/[֐-׿]/.test(text)) return "he";
  if (/[؀-ۿ]/.test(text)) return "ar";
  return "en";
}
