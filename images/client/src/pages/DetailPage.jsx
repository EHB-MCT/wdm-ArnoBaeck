import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import PriceChart from "../components/PriceChart";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import "../styles/Details.css";

export default function DetailPage() {
  const { user, logout, isAdmin } = useAuth();
  
  // Debug admin check
  if (user) {
    const adminEmails = ['admin@email.be'];
    console.log('=== ADMIN DEBUG ===');
    console.log('User email:', user.email);
    console.log('Hardcoded admin emails:', adminEmails);
    console.log('Should show button:', adminEmails.includes(user.email));
  }
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);

  async function handleProfile() {
    setResult(null);
    setLoading(true);
    setTimer(0);

    const startedAt = performance.now();
    const intervalId = setInterval(() => {
      const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);
      setTimer(seconds);
      console.info(`Generating profile... ${seconds}s`);
    }, 300);

    try {
      const res = await axios.get('http://localhost:3000/profile');
      const data = res.data;
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
    const ok = confirm("Are you sure you want to clear your data?");
    if (!ok) return;
    try {
      await axios.delete("http://localhost:3000/reset");
      setResult({ message: "Your data cleared successfully." });
    } catch {
      setResult({ error: "Failed to clear data." });
    }
  }

  const handleBuy = () => {
    console.log("Buy button clicked");
  };

  const handleSell = () => {
    console.log("Sell button clicked");
  };

  return (
    <main className="page">
      <header className="page__header">
        <div className="header-content">
          <h1 className="title">Fake Broker Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user?.username}!</span>
            {user && user.email === 'admin@email.be' && (
              <button onClick={() => {
                console.log('Admin button clicked, navigating to /admin');
                navigate('/admin');
              }} className="admin-button">
                Admin Dashboard
              </button>
            )}
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <PriceChart onBuy={handleBuy} onSell={handleSell} />

        <section className="controls">
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
      </div>
    </main>
  );
}