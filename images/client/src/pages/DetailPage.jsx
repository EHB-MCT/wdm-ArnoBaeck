import { useState } from "react";
import Button from "../components/Button";
import Navigation from "../components/Navigation";
import "../styles/Details.css";

export default function DetailPage() {
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);

  async function handleProfile() {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) return;

    setResult(null);
    setLoading(true);
    setTimer(0);

    const startedAt = performance.now();
    const intervalId = setInterval(() => {
      const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);
      setTimer(seconds);

    }, 300);

    try {
      const res = await fetch(`http://localhost:3000/profile?session_id=${sessionId}`);
      const data = await res.json();
      clearInterval(intervalId);
      setResult(data);
    } catch {
      clearInterval(intervalId);
      setResult({ error: "Failed to generate profile." });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    const ok = confirm("Are you sure you want to clear all data?");
    if (!ok) return;
    await fetch("http://localhost:3000/reset", { method: "DELETE" });
    setResult({ message: "Database cleared." });
  }

  return (
    <div>
      <Navigation />
      <main className="page">
      <header className="page__header">
        <h1 className="title">Fake Broker Dashboard</h1>
      </header>

      <section className="controls">
        <div className="controls__row">
          <Button label="Buy" />
          <Button label="Sell" />
        </div>
        <div className="controls__row">
          <Button label="Profile" onClick={handleProfile} />
          <Button label="Reset Database" onClick={handleReset} />
        </div>
        {loading && (
          <p className="info">Generating profile… <strong>{timer}s</strong></p>
        )}
      </section>

      {result && (
        <section className="result">
          {result.error && <div className="alert alert--error">{result.error}</div>}
          {result.message && <div className="alert alert--ok">{result.message}</div>}

          {result.features && (
            <div className="card">
              <h2 className="card__title">Features</h2>
              <pre className="code">{JSON.stringify(result.features, null, 2)}</pre>
            </div>
          )}

          {result.profile && (
            <div className="card">
              <h2 className="card__title">Profile</h2>
              <pre className="code">{JSON.stringify(result.profile, null, 2)}</pre>
            </div>
          )}
        </section>
      )}
    </main>
    </div>
  );
}