import { useState } from "react";

function Button({ label = "Unknown", onClick }) {
  const [hoverStarted, setHoverStarted] = useState(null);

  const sessionId =
    localStorage.getItem("sessionId") ||
    (() => {
      const id = crypto.randomUUID();
      localStorage.setItem("sessionId", id);
      return id;
    })();

  function sendEvent(event) {
    fetch("http://localhost:3000/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {});
  }

  const target = label ? String(label).toLowerCase() : null;
  const isExcluded = target === "profile" || target === "reset database";

  const btnVariant =
    label === "Buy" ? "btn--buy" :
    label === "Sell" ? "btn--sell" :
    "btn--neutral";

  return (
    <button
      className={`btn ${btnVariant}`}
      onMouseEnter={() => {
        if (isExcluded) return;
        setHoverStarted(performance.now());
      }}
      onMouseLeave={() => {
        if (isExcluded || hoverStarted == null) return;
        const hover_ms = Math.round(performance.now() - hoverStarted);
        console.log(`hover ${target}: ${hover_ms}ms`);
        sendEvent({
          session_id: sessionId,
          ts: new Date().toISOString(),
          type: "hover",
          target,
          hover_ms,
        });
        setHoverStarted(null);
      }}
      onClick={(event) => {
        if (onClick) onClick(event);
        if (isExcluded) return;
        console.log(`click ${target}`);
        sendEvent({
          session_id: sessionId,
          ts: new Date().toISOString(),
          type: "click",
          target,
          hover_ms: 0,
        });
      }}
    >
      {label}
    </button>
  );
}

export default Button;