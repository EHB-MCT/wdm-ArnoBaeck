import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
	const { logout } = useAuth();

	const handleLogout = () => {
		logout();
	};

	return (
		<nav style={styles.nav}>
			<ul style={styles.ul}>
				<li style={styles.li}>
					<Link to="/" style={styles.link}>Home</Link>
				</li>
				<li style={styles.li}>
					<Link to="/dashboard" style={styles.link}>Dashboard</Link>
				</li>
				<li style={styles.li}>
					<Link to="/admin" style={styles.link}>Admin</Link>
				</li>
				<li style={styles.li}>
					<button onClick={handleLogout} style={styles.logoutButton}>
						Logout
					</button>
				</li>
			</ul>
		</nav>
	);
}

const styles = {
	nav: {
		backgroundColor: '#2c3e50',
		padding: '1rem 2rem',
		boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
	},
	ul: {
		listStyle: 'none',
		margin: 0,
		padding: 0,
		display: 'flex',
		alignItems: 'center',
		gap: '2rem',
	},
	li: {
		margin: 0,
	},
	link: {
		color: '#ecf0f1',
		textDecoration: 'none',
		fontWeight: '500',
		padding: '0.5rem 1rem',
		borderRadius: '4px',
		transition: 'background-color 0.3s ease',
		'&:hover': {
			backgroundColor: '#34495e',
		},
	},
	logoutButton: {
		backgroundColor: '#e74c3c',
		color: '#white',
		border: 'none',
		padding: '0.5rem 1rem',
		borderRadius: '4px',
		cursor: 'pointer',
		fontWeight: '500',
		transition: 'background-color 0.3s ease',
		marginLeft: 'auto',
		'&:hover': {
			backgroundColor: '#c0392b',
		},
	},
};