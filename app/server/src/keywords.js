export function matchesKeyword(text, keywordsByLanguage, language) {
  const keywords = keywordsByLanguage[language] ?? keywordsByLanguage.en;
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}
