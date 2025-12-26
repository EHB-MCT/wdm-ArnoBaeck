export const generatePricePoints = (count = 20, basePrice = 100) => {
  const pricePoints = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < count; i++) {
    pricePoints.push({
      index: i + 1,
      price: parseFloat(currentPrice.toFixed(2))
    });
    
    const maxChange = currentPrice * 0.05;
    const change = (Math.random() - 0.5) * 2 * maxChange;
    currentPrice = Math.max(currentPrice + change, 1);
  }
  
  return pricePoints;
};