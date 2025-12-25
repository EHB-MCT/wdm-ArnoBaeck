import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
// import {
//   LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
// } from 'recharts';

import "../styles/Details.css";
import "../styles/Chart.css";

export default function AdminPage() {
	const { axiosInstance } = useAuth();
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState(null);
	const [suggestions, setSuggestions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [userData, setUserData] = useState(null);
	const [userDataLoading, setUserDataLoading] = useState(false);
	const [sessionFilter, setSessionFilter] = useState('all');
	const searchRef = useRef(null);

	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			setError('Please enter a search term');
			return;
		}

		setLoading(true);
		setError(null);
		setSearchResults(null);
		setShowSuggestions(false);

		try {
			console.log('Axios instance headers:', axiosInstance.defaults.headers.common);
			const response = await axiosInstance.get(`/api/admin/search-users?q=${encodeURIComponent(searchQuery.trim())}`);
			setSearchResults(response.data);
		} catch (err) {
			setError(err.response?.data?.error || 'Search failed');
		} finally {
			setLoading(false);
		}
	};

	const fetchSuggestions = async (query) => {
		if (!query.trim() || query.length < 2) {
			setSuggestions([]);
			return;
		}

		try {
			console.log('Suggestions axios instance headers:', axiosInstance.defaults.headers.common);
			const response = await axiosInstance.get(`/api/admin/search-users?q=${encodeURIComponent(query.trim())}`);
			const users = response.data.users || [];
			setSuggestions(users.slice(0, 5)); // Limit to 5 suggestions
		} catch (err) {
			console.log('Suggestions error:', err);
			setSuggestions([]);
		}
	};

	const handleInputChange = (e) => {
		const value = e.target.value;
		setSearchQuery(value);
		setShowSuggestions(true);
		
		if (value.length >= 2) {
			fetchSuggestions(value);
		} else {
			setSuggestions([]);
		}
	};

	const handleSuggestionClick = (user) => {
		setSearchQuery(user.email);
		setShowSuggestions(false);
		setSuggestions([]);
	};

	const handleUserSelect = async (user) => {
		setSelectedUser(user);
		setUserDataLoading(true);
		setUserData(null);
		
		try {
			const response = await axiosInstance.get(`/api/admin/user/${user.id}/data?filter=${sessionFilter}`);
			setUserData(response.data);
		} catch (err) {
			setError(err.response?.data?.error || 'Failed to fetch user data');
		} finally {
			setUserDataLoading(false);
		}
	};

	const handleSessionFilterChange = async (newFilter) => {
		setSessionFilter(newFilter);
		if (selectedUser) {
			setUserDataLoading(true);
			try {
				const response = await axiosInstance.get(`/api/admin/user/${selectedUser.id}/data?filter=${newFilter}`);
				setUserData(response.data);
			} catch (err) {
				setError(err.response?.data?.error || 'Failed to fetch user data');
			} finally {
				setUserDataLoading(false);
			}
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSearch();
		}
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (searchRef.current && !searchRef.current.contains(event.target)) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div>
			<Navigation />
			<main className="page">
				<header className="page__header">
					<h1 className="title">Admin Panel</h1>
				</header>

				<section className="controls">
					<div className="search-container" ref={searchRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
						<input
							type="text"
							value={searchQuery}
							onChange={handleInputChange}
							onKeyPress={handleKeyPress}
							onFocus={() => setShowSuggestions(true)}
							placeholder="Search by email, username, or ID..."
							className="search-input"
							style={{
								padding: '0.5rem 1rem',
								border: '1px solid #e5e7eb',
								borderRadius: '6px',
								fontSize: '0.9rem',
								marginRight: '0.5rem',
								minWidth: '300px',
								flex: 1
							}}
						/>
						<Button label="Search" onClick={handleSearch} disabled={loading} />
						
						{showSuggestions && suggestions.length > 0 && (
							<div className="suggestions-dropdown" style={{
								position: 'absolute',
								top: '100%',
								left: '0',
								right: '0',
								background: 'white',
								border: '1px solid #e5e7eb',
								borderRadius: '6px',
								boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
								zIndex: 1000,
								maxHeight: '200px',
								overflowY: 'auto'
							}}>
								{suggestions.map((user) => (
									<div
										key={user.id}
										onClick={() => handleSuggestionClick(user)}
										style={{
											padding: '0.5rem 1rem',
											cursor: 'pointer',
											borderBottom: '1px solid #f3f4f6',
											fontSize: '0.9rem'
										}}
										onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
										onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
									>
										<div style={{ fontWeight: 'bold' }}>{user.username}</div>
										<div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{user.email}</div>
									</div>
								))}
							</div>
						)}
					</div>
					
					{loading && <p className="info">Searching...</p>}
					{error && <div className="alert alert--error">{error}</div>}
				</section>

				{searchResults && (
					<section className="result">
						{searchResults.users && searchResults.users.length > 0 ? (
							<div className="card">
								<h2 className="card__title">Search Results ({searchResults.users.length} found)</h2>
								<div className="user-list">
									{searchResults.users.map((user) => (
										<div key={user.id} className="user-card" style={{
											border: '1px solid #e5e7eb',
											borderRadius: '8px',
											padding: '1rem',
											marginBottom: '1rem',
											backgroundColor: '#f9fafb',
											cursor: 'pointer',
											transition: 'all 0.2s ease'
										}}
										onClick={() => handleUserSelect(user)}
										onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
										onMouseLeave={(e) => e.target.style.backgroundColor = '#f9fafb'}
										>
											<h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
												{user.username} ({user.email})
											</h3>
											<div className="user-details">
												<p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
													<strong>ID:</strong> {user.id}
												</p>
												<p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
													<strong>Email:</strong> {user.email}
												</p>
												<p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
													<strong>Username:</strong> {user.username}
												</p>
												<p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
													<strong>Created:</strong> {new Date(user.created_at).toLocaleString()}
												</p>
												{user.profile && (
													<p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
														<strong>Profile:</strong> {user.profile.profile_type} ({Math.round(user.profile.confidence * 100)}% confidence)
													</p>
												)}
												{user.is_admin && (
													<span style={{
														backgroundColor: '#dc2626',
														color: 'white',
														padding: '0.25rem 0.5rem',
														borderRadius: '4px',
														fontSize: '0.8rem',
														fontWeight: 'bold'
													}}>
														ADMIN
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="alert alert--error">No users found matching "{searchQuery}"</div>
						)}
					</section>
				)}

				{selectedUser && (
					<section className="result">
						<div className="card">
							<h2 className="card__title">
								User Data: {selectedUser.username}
								{userData && (
									<span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
										({userData.events.length} events, {userData.sessions.filter(s => s.type === 'session_summary').length} sessions)
									</span>
								)}
							</h2>
							
							<div style={{ marginBottom: '1rem' }}>
								<label style={{ marginRight: '0.5rem' }}>Filter by session:</label>
								<select 
									value={sessionFilter} 
									onChange={(e) => handleSessionFilterChange(e.target.value)}
									style={{
										padding: '0.25rem 0.5rem',
										border: '1px solid #e5e7eb',
										borderRadius: '4px',
										fontSize: '0.9rem'
									}}
								>
									<option value="all">All Sessions</option>
									{userData?.sessions.filter(s => s.type === 'session_summary').map(session => (
										<option key={session.session_id} value={session.session_id}>
											Session {session.session_id.slice(0, 8)}...
										</option>
									))}
								</select>
							</div>

							{userDataLoading && <p className="info">Loading user data...</p>}
							
							{userData && (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
									<div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
										<h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>User Profile</h3>
										{selectedUser.profile && (
											<div>
												<p><strong>Profile Type:</strong> {selectedUser.profile.profile_type}</p>
												<p><strong>Confidence:</strong> {Math.round(selectedUser.profile.confidence * 100)}%</p>
												<p><strong>Signals:</strong> {selectedUser.profile.signals?.join(', ')}</p>
											</div>
										)}
										{!selectedUser.profile && (
											<p style={{ color: '#6b7280' }}>No profile data available</p>
										)}
									</div>

									<div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
										<h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Activity Overview</h3>
										{userData.features && (
											<div>
												<p><strong>Total Clicks (Buy):</strong> {userData.features.number_of_clicks_buy}</p>
												<p><strong>Total Clicks (Sell):</strong> {userData.features.number_of_clicks_sell}</p>
												<p><strong>Avg Session Duration:</strong> {Math.round(userData.features.average_session_duration_ms / 1000)}s</p>
												<p><strong>Total Sessions:</strong> {userData.features.total_sessions}</p>
												<p><strong>Peak Activity Hour:</strong> {userData.features.peak_activity_hour || 'N/A'}</p>
											</div>
										)}
									</div>

									{userData.features && (
										<div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
											<h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Click Activity</h3>
											<div style={{ display: 'flex', gap: '1rem', alignItems: 'end', height: '200px' }}>
												<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
													<div style={{ 
														backgroundColor: '#8884d8', 
														width: '80px', 
														height: `${Math.max(20, (userData.features.number_of_clicks_buy / Math.max(userData.features.number_of_clicks_buy, userData.features.number_of_clicks_sell)) * 160)}px`,
														borderRadius: '4px',
														marginBottom: '0.5rem'
													}}></div>
													<div style={{ fontSize: '0.9rem' }}>Buy ({userData.features.number_of_clicks_buy})</div>
												</div>
												<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
													<div style={{ 
														backgroundColor: '#82ca9d', 
														width: '80px', 
														height: `${Math.max(20, (userData.features.number_of_clicks_sell / Math.max(userData.features.number_of_clicks_buy, userData.features.number_of_clicks_sell)) * 160)}px`,
														borderRadius: '4px',
														marginBottom: '0.5rem'
													}}></div>
													<div style={{ fontSize: '0.9rem' }}>Sell ({userData.features.number_of_clicks_sell})</div>
												</div>
											</div>
										</div>
									)}

									{userData.features && (
										<div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
											<h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Hover Duration (ms)</h3>
											<div style={{ display: 'flex', gap: '1rem', alignItems: 'end', height: '200px' }}>
												<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
													<div style={{ 
														backgroundColor: '#8884d8', 
														width: '80px', 
														height: `${Math.max(20, (userData.features.average_hover_buy_duration / Math.max(userData.features.average_hover_buy_duration, userData.features.average_hover_sell_duration, 1)) * 160)}px`,
														borderRadius: '4px',
														marginBottom: '0.5rem'
													}}></div>
													<div style={{ fontSize: '0.9rem' }}>Buy ({userData.features.average_hover_buy_duration}ms)</div>
												</div>
												<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
													<div style={{ 
														backgroundColor: '#82ca9d', 
														width: '80px', 
														height: `${Math.max(20, (userData.features.average_hover_sell_duration / Math.max(userData.features.average_hover_buy_duration, userData.features.average_hover_sell_duration, 1)) * 160)}px`,
														borderRadius: '4px',
														marginBottom: '0.5rem'
													}}></div>
													<div style={{ fontSize: '0.9rem' }}>Sell ({userData.features.average_hover_sell_duration}ms)</div>
												</div>
											</div>
										</div>
									)}

									{userData.features?.device_distribution && Object.keys(userData.features.device_distribution).length > 0 && (
										<div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
											<h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Device Distribution</h3>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
												{Object.entries(userData.features.device_distribution).map(([device, count]) => {
													const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
													const percentage = (count / Object.values(userData.features.device_distribution).reduce((a, b) => a + b, 0)) * 100;
													return (
														<div key={device} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
															<div style={{ 
																backgroundColor: colors[Object.keys(userData.features.device_distribution).indexOf(device) % 5],
																width: '20px',
																height: '20px',
																borderRadius: '4px'
															}}></div>
															<div style={{ flex: 1 }}>{device}</div>
															<div style={{ fontSize: '0.9rem' }}>{count} ({percentage.toFixed(1)}%)</div>
														</div>
													);
												})}
											</div>
										</div>
									)}

									{userData.features?.browser_distribution && Object.keys(userData.features.browser_distribution).length > 0 && (
										<div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
											<h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Browser Distribution</h3>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
												{Object.entries(userData.features.browser_distribution).map(([browser, count]) => {
													const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
													const percentage = (count / Object.values(userData.features.browser_distribution).reduce((a, b) => a + b, 0)) * 100;
													return (
														<div key={browser} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
															<div style={{ 
																backgroundColor: colors[Object.keys(userData.features.browser_distribution).indexOf(browser) % 5],
																width: '20px',
																height: '20px',
																borderRadius: '4px'
															}}></div>
															<div style={{ flex: 1 }}>{browser}</div>
															<div style={{ fontSize: '0.9rem' }}>{count} ({percentage.toFixed(1)}%)</div>
														</div>
													);
												})}
											</div>
										</div>
									)}

									{userData.sessions.filter(s => s.type === 'session_summary').length > 0 && (
										<div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', gridColumn: '1 / -1' }}>
											<h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Session Data</h3>
											<div style={{ display: 'grid', gap: '0.5rem' }}>
												{userData.sessions
													.filter(s => s.type === 'session_summary' && s.duration_ms)
													.map((s, index) => (
														<div key={s.session_id} style={{ 
															border: '1px solid #e5e7eb', 
															borderRadius: '4px', 
															padding: '0.75rem',
															backgroundColor: '#f9fafb'
														}}>
															<div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
																Session {s.session_id.slice(0, 8)}...
															</div>
															<div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
																Duration: {Math.round(s.duration_ms / 1000)}s | 
																Buy Clicks: {s.clicks_buy || 0} | 
																Sell Clicks: {s.clicks_sell || 0}
															</div>
														</div>
													))}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</section>
				)}
			</main>
		</div>
	);
}