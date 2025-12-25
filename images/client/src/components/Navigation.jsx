import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminLink() {
	const { user, isAdmin } = useAuth();
	
	if (!user || !isAdmin()) return null;
	
	return <Link to="/admin" style={styles.link}>Admin</Link>;
}

export default function Navigation() {
	const { logout } = useAuth();

	const handleLogout = () => {
		logout();
	};

	return (
		<nav style={styles.nav}>
			<div style={styles.wrapper}>
				<ul style={styles.ul}>
					<li style={styles.li}>
						<Link to="/" style={styles.link}>Home</Link>
					</li>
					<li style={styles.li}>
						<Link to="/dashboard" style={styles.link}>Dashboard</Link>
					</li>
					<li style={styles.li}>
						<AdminLink />
					</li>
				</ul>
				<button onClick={handleLogout} style={styles.logoutButton}>
					Logout
				</button>
			</div>
		</nav>
	);
}

const styles = {
	nav: {
		backgroundColor: '#ffffff',
		boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
		borderBottom: '1px solid #e5e7eb',
	},
	wrapper: {
		maxWidth: '900px',
		margin: '0 auto',
		padding: '1rem 2rem',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	ul: {
		listStyle: 'none',
		margin: 0,
		padding: 0,
		display: 'flex',
		alignItems: 'center',
		gap: '1rem',
	},
	li: {
		margin: 0,
	},
	link: {
		color: '#374151',
		textDecoration: 'none',
		fontWeight: '500',
		padding: '0.5rem 1rem',
		borderRadius: '6px',
		transition: 'background-color 0.2s ease',
		fontSize: '0.9rem',
	},
	logoutButton: {
		backgroundColor: '#dc2626',
		color: '#ffffff',
		border: 'none',
		padding: '0.5rem 1rem',
		borderRadius: '6px',
		cursor: 'pointer',
		fontWeight: '500',
		transition: 'background-color 0.2s ease',
		fontSize: '0.9rem',
	},
};