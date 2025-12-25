import React from 'react';

export default function Button({ label, onClick, disabled = false }) {
	return (
		<button 
			onClick={onClick} 
			disabled={disabled}
			style={{
				backgroundColor: '#3498db',
				color: 'white',
				border: 'none',
				padding: '0.75rem 1.5rem',
				borderRadius: '4px',
				cursor: disabled ? 'not-allowed' : 'pointer',
				fontSize: '1rem',
				fontWeight: '500',
				transition: 'background-color 0.3s ease',
				opacity: disabled ? 0.6 : 1,
				margin: '0.5rem'
			}}
		>
			{label}
		</button>
	);
}