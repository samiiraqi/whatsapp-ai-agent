import { isRtl } from "../rtl.js";

export function MessageBubble({ text, direction }) {
  return (
    <div className={`bubble ${direction}`} dir={isRtl(text) ? "rtl" : "ltr"}>
      {text}
    </div>
  );
}
