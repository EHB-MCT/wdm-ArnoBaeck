import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const fetchUserData = async (userId) => {
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

      setUserEvents(eventsResponse.data);
      setUserSessions(sessionsResponse.data);
      setUserProfile(profileResponse.data);
    } catch {
      setError('Failed to fetch user data');
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchUserData(user.id);
    setSearchTerm(user.email);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="admin-loading">Loading users...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="user-selection">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        {searchTerm && (
          <div className="user-dropdown">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="user-option"
                onClick={() => handleUserSelect(user)}
              >
                {user.username} ({user.email})
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="user-details">
          <h2>User Details: {selectedUser.username}</h2>
          <div className="user-info">
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
          </div>

          {userProfile && (
            <div className="user-profile">
              <h3>User Profile</h3>
              <p><strong>Profile Type:</strong> {userProfile.profile_type}</p>
              <p><strong>Confidence:</strong> {userProfile.confidence}</p>
              <p><strong>Signals:</strong> {userProfile.signals?.join(', ')}</p>
            </div>
          )}

          <div className="user-activity">
            <h3>Activity Summary</h3>
            <div className="activity-stats">
              <div className="stat-card">
                <h4>Events</h4>
                <p>{userEvents.length} total events</p>
                <p>{userEvents.filter(e => e.type === 'click').length} clicks</p>
                <p>{userEvents.filter(e => e.type === 'hover').length} hovers</p>
              </div>
              
              <div className="stat-card">
                <h4>Sessions</h4>
                <p>{userSessions.length} total sessions</p>
                <p>{userSessions.filter(s => s.type === 'session_start').length} session starts</p>
                <p>{userSessions.filter(s => s.type === 'session_end').length} session ends</p>
              </div>
            </div>
          </div>

          <div className="detailed-data">
            <h3>Detailed Event Data</h3>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Target</th>
                    <th>Timestamp</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {userEvents.slice(0, 10).map((event, index) => (
                    <tr key={index}>
                      <td>{event.type}</td>
                      <td>{event.target}</td>
                      <td>{new Date(event.timestamp).toLocaleString()}</td>
                      <td>{event.hover_ms ? `Hover: ${event.hover_ms}ms` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userEvents.length > 10 && <p>Showing first 10 of {userEvents.length} events</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;