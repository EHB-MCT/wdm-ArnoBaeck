import { useState } from "react";
import axios from "axios";

function Button({ label = "Unknown", onClick }) {
  const [hoverStarted, setHoverStarted] = useState(null);

  function sendEvent(event) {
    const token = localStorage.getItem("token");
    console.log("Token found:", !!token);
    console.log("Token value:", token);
    
    if (!token) {
      console.error("No token found in localStorage");
      return;
    }
    
    // Add session_id to event for server validation
    const eventWithSession = {
      ...event,
      session_id: "user-session"
    };
    
    console.log("Sending event with session:", eventWithSession);
    
    axios.post("http://localhost:3000/event", eventWithSession, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }).then(response => {
      console.log("✅ Event saved successfully:", response.data);
    }).catch((error) => {
      console.error("Failed to send event:", error.response?.data || error.message);
      console.error("Status:", error.response?.status);
      console.error("Response data:", error.response?.data);
      console.error("Full error:", error);
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