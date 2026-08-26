import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import "./SweetGuide.css";

/**
 * Floating assistant. Deliberately self-contained: it owns its own state, its
 * own stylesheet and its own launcher, so no other view has to reach into it.
 * It renders on every breakpoint and is never hidden behind the mobile dock.
 */

const WHATSAPP =
  "https://wa.me/919702655000?text=Namaste%20Ashok%20Sweets%2C%20I%20need%20help%20with%20an%20order.";

type Message = { from: "bot" | "user"; text: string };

type Rule = { match: RegExp; reply: string };

const RULES: Rule[] = [
  {
    match: /fssai|licen[cs]e|certif/i,
    reply:
      "Our packaging carries FSSAI licences 11518021000077 and 11522021000582. Both are printed on every box.",
  },
  {
    match: /address|location|store|shop|where|outlet|branch/i,
    reply:
      "Two stores in Dombivli — West: 1 Everest, Pandit Dindayal Road (421202), 9702655000. East: Everest Pride, Kelkar Road (421201), 8691899000.",
  },
  {
    match: /bulk|wedding|corporate|hamper|gift|order in quantity|wholesale/i,
    reply:
      "We take wedding, corporate and festive bulk orders. Open any product and tap “Need a bulk quote?”, or message us on WhatsApp for a same-day quote.",
  },
  {
    match: /deliver|shipping|ship|how long|when will|time|dispatch/i,
    reply:
      "Delivery across Dombivli usually takes 30–45 minutes. Orders above ₹1,499 ship free; below that it is ₹99. Pickup from either store is always free.",
  },
  {
    match: /pay|payment|upi|card|online|cod|cash/i,
    reply:
      "Cash on delivery only — you pay the rider when the sweets reach you. Nothing is charged in advance, and we do not take UPI, cards or netbanking on the site. Please keep the exact amount ready, as riders may not carry change.",
  },
  {
    match: /fresh|stale|shelf|store it|storage|keep|expire|best before/i,
    reply:
      "Everything is made in small batches. Milk-based sweets (kalakand, rasmalai, peda) keep 2–3 days refrigerated; dry sweets like katli, laddoo and soan papdi keep 5–7 days in a cool, airtight place.",
  },
  {
    match: /veg|non.?veg|egg|jain|halal/i,
    reply:
      "Every product we make is vegetarian and egg-free. Ingredients and allergens are printed on each pack.",
  },
  {
    match: /allerg|nut|milk|gluten|sugar.?free|diabet/i,
    reply:
      "Our kitchen handles milk, nuts, gluten and sesame, so we cannot guarantee an allergen-free batch. We do make sugar-free kaju katli. Please call us before ordering if you have an allergy.",
  },
  {
    match: /refund|return|cancel|wrong|damaged|spoil/i,
    reply:
      "Sweets are perishable, so we cannot take returns for change of mind. If something arrives wrong, damaged or spoiled, contact us within about four hours with photos and we will replace or refund it.",
  },
  {
    match: /coupon|discount|offer|promo|code|sale/i,
    reply:
      "Try ASHOK10 or FESTIVE15 at checkout. Festival coupons are announced on WhatsApp first.",
  },
  {
    match: /price|cost|how much|rate|₹/i,
    reply:
      "Prices run from about ₹240 for everyday sweets to ₹1,200 for premium gift hampers. Every product page shows the exact price per kg or per box.",
  },
  {
    match: /hi|hello|namaste|hey|good (morning|evening|afternoon)/i,
    reply:
      "Namaste! Ask me about any sweet, delivery, bulk gifting, storage or our stores.",
  },
];

const FALLBACK =
  "I can help with sweets, delivery, storage, bulk gifting, payment and offers. For anything else, tap WhatsApp below and a person will reply.";

const QUICK_REPLIES = [
  "Delivery time?",
  "Bulk gifting",
  "How to store sweets",
  "Store address",
];

function answer(question: string): string {
  const rule = RULES.find((r) => r.match.test(question));
  return rule ? rule.reply : FALLBACK;
}

export default function SweetGuide() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "Namaste! I'm the Ashok Sweet Guide. Ask me about sweets, delivery, bulk gifting or our stores.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only show the quick replies until the customer has actually asked something.
  const showQuickReplies = useMemo(
    () => !messages.some((m) => m.from === "user"),
    [messages],
  );

  const ask = (raw: string) => {
    const question = raw.trim();
    if (!question || typing) return;
    setMessages((m) => [...m, { from: "user", text: question }]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: answer(question) }]);
      setTyping(false);
    }, 420);
  };

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  // Focus the field on open and hand focus back to the launcher on close —
  // but never on first mount, which would steal focus from the page.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (open) inputRef.current?.focus();
    else launcherRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Escape closes, and a click outside dismisses without stealing taps.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !launcherRef.current?.contains(target)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="guide-root">
      {open && (
        <div
          className="guide-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Ashok Sweet Guide"
        >
          <header className="guide-head">
            <span className="guide-avatar" aria-hidden="true">
              <Sparkles size={18} />
            </span>
            <span className="guide-id">
              <b>Ashok Sweet Guide</b>
              <small>
                <i className="guide-dot" aria-hidden="true" /> Usually replies
                instantly
              </small>
            </span>
            <button
              className="guide-close"
              onClick={() => setOpen(false)}
              aria-label="Close the sweet guide"
            >
              <X size={19} />
            </button>
          </header>

          <div className="guide-log" ref={logRef} role="log" aria-live="polite">
            {messages.map((message, index) => (
              <p key={index} className={`guide-msg guide-${message.from}`}>
                {message.text}
              </p>
            ))}
            {typing && (
              <p className="guide-msg guide-bot guide-typing" aria-label="Typing">
                <i />
                <i />
                <i />
              </p>
            )}
            {showQuickReplies && (
              <div className="guide-chips">
                {QUICK_REPLIES.map((chip) => (
                  <button key={chip} onClick={() => ask(chip)}>
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="guide-compose">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder="Ask about sweets, delivery, gifting…"
              aria-label="Ask the sweet guide a question"
            />
            <button
              onClick={() => ask(input)}
              disabled={!input.trim() || typing}
              aria-label="Send question"
            >
              <Send size={17} />
            </button>
          </div>

          <a
            className="guide-handoff"
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={15} /> Talk to a person on WhatsApp
          </a>
        </div>
      )}

      <button
        ref={launcherRef}
        className={`guide-launcher${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close the sweet guide" : "Open the sweet guide"}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
        <span className="guide-launcher-label">Sweet guide</span>
      </button>
    </div>
  );
}
