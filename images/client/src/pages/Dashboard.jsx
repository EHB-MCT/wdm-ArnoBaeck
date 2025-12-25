import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const fetchUserData = async (userId, user) => {
    try {
      const [eventsResponse, sessionsResponse, profileResponse] = await Promise.all([
        axios.get(`http://localhost:3000/api/admin/users/${userId}/events`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`http://localhost:3000/api/admin/users/${userId}/sessions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`http://localhost:3000/api/admin/users/${userId}/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setUserData({
        user: user,
        events: eventsResponse.data,
        sessions: sessionsResponse.data,
        profile: profileResponse.data
      });
    } catch {
      setError('Failed to fetch user data');
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchUserData(user.id, user);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="dashboard-loading">Loading users...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="dashboard-content">
        <div className="user-menu">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <div className="user-list">
            {filteredUsers.map(user => (
              <div 
                key={user.id} 
                className="user-item"
                onClick={() => handleUserClick(user)}
              >
                <span className="username">{user.username}</span>
                <span className="email">{user.email}</span>
              </div>
            ))}
          </div>
        </div>

        {userData && userData.user && (
          <div className="user-data">
            <h2>User Analytics: {userData.user.username}</h2>
            
            <div className="graphs-section">
              <div className="graph-container">
                <h3>Trading Activity</h3>
                <div className="trading-chart">
                  {(() => {
                    const buyCount = userData.events?.filter(e => e.target?.includes('buy')).length || 0;
                    const sellCount = userData.events?.filter(e => e.target?.includes('sell')).length || 0;
                    
                    return (
                      <div className="chart-bars">
                        <div className="bar-group">
                          <div className="bar buy-bar" style={{height: `${Math.max(20, (buyCount / Math.max(buyCount, sellCount, 1)) * 180)}px`}}>
                            <span className="bar-value">{buyCount}</span>
                          </div>
                          <span className="bar-label">Buys</span>
                        </div>
                        <div className="bar-group">
                          <div className="bar sell-bar" style={{height: `${Math.max(20, (sellCount / Math.max(buyCount, sellCount, 1)) * 180)}px`}}>
                            <span className="bar-value">{sellCount}</span>
                          </div>
                          <span className="bar-label">Sells</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div className="graph-container">
                <h3>Hover Time Distribution</h3>
                <div className="hover-distribution">
                  {(() => {
                    const hoverEvents = userData.events?.filter(e => e.hover_ms) || [];
                    const ranges = [
                      { label: '0-100ms', min: 0, max: 100, color: '#27ae60' },
                      { label: '100-500ms', min: 100, max: 500, color: '#f39c12' },
                      { label: '500-1000ms', min: 500, max: 1000, color: '#e67e22' },
                      { label: '1s-2s', min: 1000, max: 2000, color: '#e74c3c' },
                      { label: '2s+', min: 2000, max: Infinity, color: '#8e44ad' }
                    ];
                    
                    return ranges.map((range, index) => {
                      const count = hoverEvents.filter(e => e.hover_ms >= range.min && e.hover_ms < range.max).length;
                      const percentage = hoverEvents.length > 0 ? (count / hoverEvents.length) * 100 : 0;
                      
                      return (
                        <div key={index} className="hover-range">
                          <div className="range-info">
                            <span className="range-label">{range.label}</span>
                            <span className="range-count">{count} events</span>
                          </div>
                          <div className="range-bar">
                            <div className="range-fill" style={{width: `${percentage}%`, backgroundColor: range.color}}></div>
                          </div>
                          <span className="range-percentage">{percentage.toFixed(1)}%</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              
              <div className="graph-container">
                <h3>Daily Activity Pattern</h3>
                <div className="activity-heatmap">
                  {(() => {
                    const eventsByHour = Array(24).fill(0);
                    userData.events?.forEach(event => {
                      const hour = new Date(event.timestamp).getHours();
                      eventsByHour[hour]++;
                    });
                    
                    const maxEvents = Math.max(...eventsByHour);
                    
                    return (
                      <div className="heatmap-grid">
                        {eventsByHour.map((count, hour) => (
                          <div key={hour} className="heatmap-cell" title={`${hour}:00 - ${count} events`}>
                            <div className="cell-time">{hour}</div>
                            <div 
                              className="cell-activity" 
                              style={{opacity: maxEvents > 0 ? count / maxEvents : 0}}
                            ></div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="heatmap-legend">
                    <span>Low</span>
                    <div className="legend-scale">
                      <div className="scale-block" style={{opacity: 0.2}}></div>
                      <div className="scale-block" style={{opacity: 0.4}}></div>
                      <div className="scale-block" style={{opacity: 0.6}}></div>
                      <div className="scale-block" style={{opacity: 0.8}}></div>
                      <div className="scale-block" style={{opacity: 1}}></div>
                    </div>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-section">
              <div className="info-card">
                <h3>User Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Username:</span>
                    <span className="value">{userData.user.username}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{userData.user.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Member Since:</span>
                    <span className="value">{new Date(userData.user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>Activity Summary</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Total Sessions:</span>
                    <span className="value">{userData.sessions?.length || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Total Events:</span>
                    <span className="value">{userData.events?.length || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Click Events:</span>
                    <span className="value">{userData.events?.filter(e => e.type === 'click').length || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Hover Events:</span>
                    <span className="value">{userData.events?.filter(e => e.type === 'hover').length || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Average Hover Time:</span>
                    <span className="value">
                      {userData.events?.filter(e => e.hover_ms).length > 0 
                        ? Math.round(userData.events.filter(e => e.hover_ms).reduce((acc, e) => acc + e.hover_ms, 0) / userData.events.filter(e => e.hover_ms).length) + 'ms'
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {userData.profile && (
                <div className="info-card">
                  <h3>User Profile</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Profile Type:</span>
                      <span className="value">{userData.profile.profile_type}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Confidence:</span>
                      <span className="value">{userData.profile.confidence}</span>
                    </div>
                    {userData.profile.signals && (
                      <div className="info-item">
                        <span className="label">Signals:</span>
                        <span className="value">{userData.profile.signals.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="info-card">
                <h3>Recent Events</h3>
                <div className="events-list">
                  {userData.events?.slice(0, 10).map((event, index) => (
                    <div key={index} className="event-item">
                      <span className="event-type">{event.type}</span>
                      <span className="event-target">{event.target}</span>
                      <span className="event-time">{new Date(event.timestamp).toLocaleString()}</span>
                      {event.hover_ms && (
                        <span className="event-hover">{event.hover_ms}ms</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;