export function validatePortfolioJSON(data) {
  const errors = [];

  // Check required fields
  if (!data.clientId) errors.push('Missing required field: clientId');
  if (!data.portfolioName) errors.push('Missing required field: portfolioName');
  if (!data.currency) errors.push('Missing required field: currency');
  if (!data.holdings || !Array.isArray(data.holdings)) {
    errors.push('Missing or invalid field: holdings (must be an array)');
  }

  // Validate holdings
  if (data.holdings && Array.isArray(data.holdings)) {
    data.holdings.forEach((holding, index) => {
      if (!holding.ticker) errors.push(`Holding ${index}: Missing ticker`);
      if (typeof holding.quantity !== 'number') errors.push(`Holding ${index}: Invalid quantity`);
      if (typeof holding.purchasePrice !== 'number') errors.push(`Holding ${index}: Invalid purchasePrice`);
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function parsePortfolioJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    const validation = validatePortfolioJSON(data);

    if (!validation.valid) {
      throw new Error(`Invalid portfolio data: ${validation.errors.join(', ')}`);
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
