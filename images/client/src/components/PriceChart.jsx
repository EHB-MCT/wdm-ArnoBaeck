import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import '../styles/PriceChart.css';

function PriceChart({ onBuy, onSell }) {
	const [priceData, setPriceData] = useState([]);
	const [currentPrice, setCurrentPrice] = useState(null);
	const [hoveredPoint, setHoveredPoint] = useState(null);
	const canvasRef = useRef(null);

	useEffect(() => {
		const fetchPrice = async () => {
			try {
				const response = await fetch('http://localhost:3000/price');
				if (!response.ok) {
					const errorText = await response.text();
					console.error('Server response:', response.status, errorText);
					throw new Error(`HTTP ${response.status}: ${errorText}`);
				}
				const data = await response.json();
				
				setCurrentPrice(data.price);
				if (data.history) {
					setPriceData(data.history);
				} else {
					setPriceData(prev => {
						const newData = [...prev, { price: data.price, timestamp: data.timestamp }];
						return newData.slice(-50);
					});
				}
			} catch (error) {
				console.error('Error fetching price:', error);
			}
		};

		fetchPrice();
		const interval = setInterval(fetchPrice, 30000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (!canvasRef.current || priceData.length < 2) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		const rect = canvas.getBoundingClientRect();
		
		// Set canvas size
		canvas.width = rect.width * window.devicePixelRatio;
		canvas.height = rect.height * window.devicePixelRatio;
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

		// Clear canvas
		ctx.clearRect(0, 0, rect.width, rect.height);

		const padding = { top: 20, right: 20, bottom: 40, left: 60 };
		const chartWidth = rect.width - padding.left - padding.right;
		const chartHeight = rect.height - padding.top - padding.bottom;

		// Calculate price range
		const prices = priceData.map(d => d.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		const priceRange = maxPrice - minPrice || 1;

		// Draw grid
		ctx.strokeStyle = '#2a3441';
		ctx.lineWidth = 1;
		ctx.setLineDash([3, 3]);

		// Horizontal grid lines
		for (let i = 0; i <= 5; i++) {
			const y = padding.top + (chartHeight / 5) * i;
			ctx.beginPath();
			ctx.moveTo(padding.left, y);
			ctx.lineTo(rect.width - padding.right, y);
			ctx.stroke();
		}

		// Vertical grid lines
		for (let i = 0; i <= 10; i++) {
			const x = padding.left + (chartWidth / 10) * i;
			ctx.beginPath();
			ctx.moveTo(x, padding.top);
			ctx.lineTo(x, rect.height - padding.bottom);
			ctx.stroke();
		}

		ctx.setLineDash([]);

		// Draw axes
		ctx.strokeStyle = '#2a3441';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(padding.left, padding.top);
		ctx.lineTo(padding.left, rect.height - padding.bottom);
		ctx.lineTo(rect.width - padding.right, rect.height - padding.bottom);
		ctx.stroke();

		// Create gradient
		const gradient = ctx.createLinearGradient(0, padding.top, 0, rect.height - padding.bottom);
		gradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
		gradient.addColorStop(1, 'rgba(0, 255, 136, 0.05)');

		// Draw area
		ctx.fillStyle = gradient;
		ctx.beginPath();
		priceData.forEach((point, index) => {
			const x = padding.left + (chartWidth / (priceData.length - 1)) * index;
			const y = padding.top + (1 - (point.price - minPrice) / priceRange) * chartHeight;
			
			if (index === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});
		ctx.lineTo(rect.width - padding.right, rect.height - padding.bottom);
		ctx.lineTo(padding.left, rect.height - padding.bottom);
		ctx.closePath();
		ctx.fill();

		// Draw line
		ctx.strokeStyle = '#00ff88';
		ctx.lineWidth = 3;
		ctx.shadowColor = '#00ff88';
		ctx.shadowBlur = 10;
		ctx.beginPath();
		priceData.forEach((point, index) => {
			const x = padding.left + (chartWidth / (priceData.length - 1)) * index;
			const y = padding.top + (1 - (point.price - minPrice) / priceRange) * chartHeight;
			
			if (index === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});
		ctx.stroke();
		ctx.shadowBlur = 0;

		// Draw data points
		priceData.forEach((point, index) => {
			const x = padding.left + (chartWidth / (priceData.length - 1)) * index;
			const y = padding.top + (1 - (point.price - minPrice) / priceRange) * chartHeight;
			
			ctx.fillStyle = index === priceData.length - 1 ? '#00ff88' : '#00ccff';
			ctx.beginPath();
			ctx.arc(x, y, index === priceData.length - 1 ? 6 : 2, 0, Math.PI * 2);
			ctx.fill();
			
			if (index === priceData.length - 1) {
				ctx.strokeStyle = '#ffffff';
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		});

		// Draw price labels
		ctx.fillStyle = '#9aa4b2';
		ctx.font = '11px ui-sans-serif, system-ui, Arial, sans-serif';
		for (let i = 0; i <= 5; i++) {
			const price = minPrice + (priceRange / 5) * (5 - i);
			const y = padding.top + (chartHeight / 5) * i;
			ctx.fillText(`$${price.toFixed(0)}`, 5, y + 4);
		}

	}, [priceData]);

	const priceChange = priceData.length > 1 
		? currentPrice - priceData[0].price 
		: 0;
	const priceChangePercent = priceData.length > 1 && priceData[0].price !== 0
		? (priceChange / priceData[0].price) * 100
		: 0;

	const handleMouseMove = (e) => {
		if (!canvasRef.current || priceData.length === 0) return;

		const rect = canvasRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const padding = { left: 60, right: 20 };
		const chartWidth = rect.width - padding.left - padding.right;
		
		const index = Math.round(((x - padding.left) / chartWidth) * (priceData.length - 1));
		
		if (index >= 0 && index < priceData.length) {
			setHoveredPoint({
				...priceData[index],
				x: e.clientX,
				y: e.clientY
			});
		}
	};

	const handleMouseLeave = () => {
		setHoveredPoint(null);
	};

	return (
		<div className="price-chart">
			<div className="chart-header">
				<div className="chart-title-section">
					<h2>Price Action</h2>
					<div className="price-change">
						<span className={`change-value ${priceChange >= 0 ? 'positive' : 'negative'}`}>
							{priceChange >= 0 ? '▲' : '▼'} ${Math.abs(priceChange).toFixed(2)}
						</span>
						<span className={`change-percent ${priceChange >= 0 ? 'positive' : 'negative'}`}>
							({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
						</span>
					</div>
				</div>
				<div className="current-price">
					${currentPrice}
				</div>
			</div>
			
			<div className="chart-container">
				<canvas
					ref={canvasRef}
					className="chart-canvas"
					onMouseMove={handleMouseMove}
					onMouseLeave={handleMouseLeave}
				/>
				{hoveredPoint && (
					<div 
						className="custom-tooltip"
						style={{
							left: hoveredPoint.x + 10,
							top: hoveredPoint.y - 40
						}}
					>
						<div className="tooltip-time">{new Date(hoveredPoint.timestamp).toLocaleString()}</div>
						<div className="tooltip-price">${hoveredPoint.price.toFixed(2)}</div>
					</div>
				)}
			</div>
			
			<div className="trading-controls">
				<Button label="Buy" onClick={onBuy} />
				<Button label="Sell" onClick={onSell} />
			</div>
		</div>
	);
}

export default PriceChart;