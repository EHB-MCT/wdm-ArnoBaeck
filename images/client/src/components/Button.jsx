import { useState } from "react";
import axios from "axios";

function Button({ label = "Unknown", onClick }) {
  const [hoverStarted, setHoverStarted] = useState(null);

  function sendEvent(event) {
    const token = localStorage.getItem("token");

    
    if (!token) {

      return;
    }
    
    const currentSessionId = localStorage.getItem('currentSessionId') || "unknown-session";
    const eventWithSession = {
      ...event,
      session_id: currentSessionId
    };
    

    
    axios.post("http://localhost:3000/event", eventWithSession, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }).catch((error) => {
      console.warn('Event send failed:', error.message);
    });
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

        sendEvent({
          type: "hover",
          target,
          hover_ms,
        });
        setHoverStarted(null);
      }}
      onClick={(event) => {
        if (isExcluded) {
          if (onClick) onClick(event);
          return;
        }

        sendEvent({
          type: "click",
          target,
          hover_ms: 0,
        });
        if (onClick) onClick(event);
      }}
    >
      {label}
    </button>
  );
}

export default Button;