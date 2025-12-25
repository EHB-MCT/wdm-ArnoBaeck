import React from 'react';

export default function Button({ label, onClick, disabled = false }) {
	return (
		<button 
			onClick={onClick} 
			disabled={disabled}
			style={{
				backgroundColor: '#3b82f6',
				color: '#ffffff',
				border: 'none',
				padding: '0.75rem 1.5rem',
				borderRadius: '6px',
				cursor: disabled ? 'not-allowed' : 'pointer',
				fontSize: '0.9rem',
				fontWeight: '500',
				transition: 'background-color 0.2s ease',
				opacity: disabled ? 0.5 : 1,
				margin: '0.5rem'
			}}
		>
			{label}
		</button>
	);
}