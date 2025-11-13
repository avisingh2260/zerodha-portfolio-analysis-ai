import papaparse from 'papaparse';
const Papa = papaparse.default || papaparse;

/**
 * Parse Zerodha Console CSV format
 * Expected columns: Instrument, Qty., Avg. cost, LTP, Cur. val, P&L, Net chg., Day chg.
 */
export function parseZerodhaCSV(csvContent) {
  try {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });

    if (result.errors.length > 0) {
      throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    const holdings = result.data.map((row, index) => {
      // Handle different possible column names from Zerodha
      const ticker = row.Instrument || row.Symbol || row.instrument || row.symbol;
      const quantity = parseFloat(row['Qty.'] || row.Quantity || row.quantity || row.qty || 0);
      const avgCost = parseFloat(row['Avg. cost'] || row['Avg cost'] || row.avg_cost || row.averagePrice || 0);
      const ltp = parseFloat(row.LTP || row['Last Price'] || row.last_price || row.currentPrice || avgCost);

      if (!ticker) {
        throw new Error(`Row ${index + 1}: Missing instrument/symbol name`);
      }

      const costBasis = quantity * avgCost;
      const currentValue = quantity * ltp;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return {
        ticker,
        quantity,
        purchasePrice: avgCost,
        purchaseDate: null,
        currentPrice: ltp,
        currentValue,
        costBasis,
        gainLoss,
        gainLossPercent
      };
    });

    if (holdings.length === 0) {
      throw new Error('No valid holdings found in CSV');
    }

    return {
      success: true,
      holdings
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse generic CSV format
 * Required columns: ticker, quantity, purchasePrice
 * Optional: purchaseDate, currentPrice
 */
export function parseGenericCSV(csvContent) {
  try {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });

    if (result.errors.length > 0) {
      throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    const holdings = result.data.map((row, index) => {
      const ticker = row.ticker || row.Ticker || row.symbol || row.Symbol;
      const quantity = parseFloat(row.quantity || row.Quantity || row.qty || row.Qty || 0);
      const purchasePrice = parseFloat(row.purchasePrice || row.purchase_price || row.avg_cost || row['Avg. cost'] || 0);
      const currentPrice = parseFloat(row.currentPrice || row.current_price || row.ltp || row.LTP || purchasePrice);
      const purchaseDate = row.purchaseDate || row.purchase_date || null;

      if (!ticker) {
        throw new Error(`Row ${index + 1}: Missing ticker/symbol`);
      }
      if (!quantity || quantity <= 0) {
        throw new Error(`Row ${index + 1}: Invalid quantity for ${ticker}`);
      }
      if (!purchasePrice || purchasePrice <= 0) {
        throw new Error(`Row ${index + 1}: Invalid purchase price for ${ticker}`);
      }

      const costBasis = quantity * purchasePrice;
      const currentValue = quantity * currentPrice;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return {
        ticker,
        quantity,
        purchasePrice,
        purchaseDate,
        currentPrice,
        currentValue,
        costBasis,
        gainLoss,
        gainLossPercent
      };
    });

    if (holdings.length === 0) {
      throw new Error('No valid holdings found in CSV');
    }

    return {
      success: true,
      holdings
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Auto-detect CSV format and parse
 */
export function parseCSV(csvContent) {
  // Try Zerodha format first
  const zerodhaResult = parseZerodhaCSV(csvContent);
  if (zerodhaResult.success) {
    return {
      success: true,
      format: 'zerodha',
      holdings: zerodhaResult.holdings
    };
  }

  // Fall back to generic format
  const genericResult = parseGenericCSV(csvContent);
  if (genericResult.success) {
    return {
      success: true,
      format: 'generic',
      holdings: genericResult.holdings
    };
  }

  return {
    success: false,
    error: `Could not parse CSV. Errors:\n- Zerodha format: ${zerodhaResult.error}\n- Generic format: ${genericResult.error}`
  };
}
