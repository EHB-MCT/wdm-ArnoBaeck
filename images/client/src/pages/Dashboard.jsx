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
            <h2>User Data: {userData.user.username}</h2>
            <pre className="json-display">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;