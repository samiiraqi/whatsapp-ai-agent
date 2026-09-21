export function isRtl(text) {
  return /[֐-׿؀-ۿ]/.test(text ?? "");
}
