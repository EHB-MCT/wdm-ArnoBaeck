import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

import "../styles/Details.css";
import "../styles/Chart.css";

export default function DashboardPage() {
	const { axiosInstance, user } = useAuth();
	const [userData, setUserData] = useState(null);
	const [userDataLoading, setUserDataLoading] = useState(false);
	const [sessionFilter, setSessionFilter] = useState('all');
	const [error, setError] = useState(null);

	const fetchUserData = useCallback(async (filter = 'all') => {
		setUserDataLoading(true);
		setError(null);
		
		try {
			const response = await axiosInstance.get(`/api/user/data?filter=${filter}`);
			setUserData(response.data);
		} catch (err) {
			setError(err.response?.data?.error || 'Failed to fetch user data');
		} finally {
			setUserDataLoading(false);
		}
	}, [axiosInstance]);

	const handleSessionFilterChange = (newFilter) => {
		setSessionFilter(newFilter);
		fetchUserData(newFilter);
	};

	useEffect(() => {
		if (user) {
			fetchUserData('all');
		}
	}, [user, fetchUserData]);

	return (
		<div>
			<Navigation />
			<main className="page">
				<header className="page__header">
					<h1 className="title">Dashboard</h1>
				</header>

				{error && <div className="alert alert--error">{error}</div>}
				
				{userDataLoading && <p className="info">Loading your data...</p>}
				
				{userData && (
					<div className="card">
						<h2 className="card__title">
							Your Activity Data
							<span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
								({userData.events.length} events, {userData.sessions.filter(s => s.type === 'session_summary').length} sessions)
							</span>
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
								{userData.sessions.filter(s => s.type === 'session_summary').map(session => (
									<option key={session.session_id} value={session.session_id}>
										Session {session.session_id.slice(0, 8)}...
									</option>
								))}
							</select>
						</div>

						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
							<div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
								<h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Your Profile</h3>
								{user.profile && (
									<div>
										<p><strong>Profile Type:</strong> {user.profile.profile_type}</p>
										<p><strong>Confidence:</strong> {Math.round(user.profile.confidence * 100)}%</p>
										<p><strong>Signals:</strong> {user.profile.signals?.join(', ')}</p>
									</div>
								)}
								{!user.profile && (
									<p style={{ color: '#6b7280' }}>No profile data available yet. Generate a profile to see insights.</p>
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
												height: `${Math.max(20, (userData.features.number_of_clicks_buy / Math.max(userData.features.number_of_clicks_buy, userData.features.number_of_clicks_sell, 1)) * 160)}px`,
												borderRadius: '4px',
												marginBottom: '0.5rem'
											}}></div>
											<div style={{ fontSize: '0.9rem' }}>Buy ({userData.features.number_of_clicks_buy})</div>
										</div>
										<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
											<div style={{ 
												backgroundColor: '#82ca9d', 
												width: '80px', 
												height: `${Math.max(20, (userData.features.number_of_clicks_sell / Math.max(userData.features.number_of_clicks_buy, userData.features.number_of_clicks_sell, 1)) * 160)}px`,
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
											.map((s) => (
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
					</div>
				)}
			</main>
		</div>
	);
}