import { useState, useEffect } from "react";
import Button from "../components/Button";
import Navigation from "../components/Navigation";
import { useSessionTracking } from "../hooks/useSessionTracking";
import { useAuth } from "../contexts/AuthContext";
import { generatePricePoints } from "../utils/priceGenerator";

import "../styles/Details.css";
import "../styles/Chart.css";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);
  const { user, isAdmin } = useAuth();
  const [priceData, setPriceData] = useState(() => generatePricePoints());

  useEffect(() => {
    const interval = setInterval(() => {
      setPriceData(currentData => {
        const lastPrice = currentData[currentData.length - 1].price;
        const maxChange = lastPrice * 0.05;
        const change = (Math.random() - 0.5) * 2 * maxChange;
        const newPrice = Math.max(lastPrice + change, 1);
        
        const newPoint = {
          index: currentData.length + 1,
          price: parseFloat(newPrice.toFixed(2))
        };
        
        return [...currentData.slice(-19), newPoint];
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);
  
  useSessionTracking(user?.id);

  async function handleProfile() {
    const token = localStorage.getItem("token");
    if (!token) return;

    setResult(null);
    setLoading(true);
    setTimer(0);

    const startedAt = performance.now();
    const intervalId = setInterval(() => {
      const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);
      setTimer(seconds);

    }, 300);

    try {
      const res = await fetch("http://localhost:3000/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
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
    const token = localStorage.getItem("token");
    await fetch("http://localhost:3000/reset", { 
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    setResult({ message: "Database cleared." });
  }

  return (
    <div>
      <Navigation />
      <main className="page">
        <header className="page__header">
          <h1 className="title">Fake Broker Dashboard</h1>
        </header>

        <section className="chart-container">
          <h2>Price Chart</h2>
          <div className="line-chart">
            <svg viewBox="0 0 800 300" className="chart-svg">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={i * 50}
                  x2="800"
                  y2={i * 50}
                  stroke="#e0e0e0"
                  strokeWidth="1"
                />
              ))}
              
              <polyline
                points={priceData.map((point, index) => {
                  const x = (index / (priceData.length - 1)) * 780 + 10;
                  const y = 280 - ((point.price - 80) / 40) * 250;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#8884d8"
                strokeWidth="2"
              />
              
              {priceData.map((point, index) => {
                const x = (index / (priceData.length - 1)) * 780 + 10;
                const y = 280 - ((point.price - 80) / 40) * 250;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#8884d8"
                      className="chart-point"
                    />
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#666"
                      className="chart-point-label"
                    >
                      €{point.price.toFixed(2)}
                    </text>
                  </g>
                );
              })}
              
              {priceData.map((_, index) => {
                if (index % 4 === 0) {
                  const x = (index / (priceData.length - 1)) * 780 + 10;
                  return (
                    <text
                      key={`label-${index}`}
                      x={x}
                      y="295"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#666"
                    >
                      {index + 1}
                    </text>
                  );
                }
                return null;
              })}
            </svg>
          </div>
        </section>

        <section className="controls">
          <div className="controls__row">
            <Button label="Buy" />
            <Button label="Sell" />
          </div>
          <div className="controls__row">
            <Button label="Profile" onClick={handleProfile} />
            {user && isAdmin() && <Button label="Reset Database" onClick={handleReset} />}
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