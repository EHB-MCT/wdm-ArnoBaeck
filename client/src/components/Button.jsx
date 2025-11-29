import { useState } from "react";
import axios from "axios";

function Button({ label = "Unknown", onClick }) {
  const [hoverStarted, setHoverStarted] = useState(null);

  function sendEvent(event) {
    axios.post("http://localhost:3000/event", event).catch(() => {});
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