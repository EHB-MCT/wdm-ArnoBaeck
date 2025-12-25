import React from 'react';
import Navigation from '../components/Navigation';

export default function AdminPage() {
	return (
		<div>
			<Navigation />
			<main>
				<h1>Admin Panel</h1>
				<p>Admin only area - restricted access</p>
			</main>
		</div>
	);
}