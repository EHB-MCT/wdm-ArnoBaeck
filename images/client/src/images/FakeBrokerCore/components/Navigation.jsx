export default function Navigation() {
	return (
		<nav>
			<ul>
				<li>
					<a href="/">Home</a>
				</li>
				<li>
					<a href="/dashboard">Dashboard</a>
				</li>
                {/* Protected route only for users with admin email/rights. */}
				<li>
					<a href="/admin">Admin</a>
				</li>
			</ul>
		</nav>
	);
}
