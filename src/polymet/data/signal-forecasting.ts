/**
 * # Signal Forecasting Service
 *
 * ## Overview
 * Provides time-series forecasting for signal values using simple
 * statistical methods (moving average, linear regression, exponential smoothing).
 *
 * ## Features
 * - Multiple forecasting methods
 * - Confidence intervals
 * - Trend analysis
 * - Anomaly detection
 */

export interface ForecastPoint {
  timestamp: number;
  predicted: number;
  confidence: number; // 0-1
  lower_bound: number;
  upper_bound: number;
}

export interface TrendAnalysis {
  direction: "up" | "down" | "stable";
  strength: number; // 0-1
  slope: number;
  r_squared: number;
}

export interface AnomalyDetection {
  isAnomaly: boolean;
  score: number; // 0-1, higher = more anomalous
  reason?: string;
}

/**
 * Simple Moving Average forecast
 */
export function forecastMovingAverage(
  historicalData: Array<{ timestamp: number; value: number }>,
  periods: number = 7,
  forecastDays: number = 7
): ForecastPoint[] {
  if (historicalData.length < periods) {
    return [];
  }

  const forecast: ForecastPoint[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const lastTimestamp = historicalData[historicalData.length - 1].timestamp;

  // Calculate moving average
  const recentValues = historicalData.slice(-periods).map((d) => d.value);
  const ma = recentValues.reduce((a, b) => a + b, 0) / periods;

  // Calculate standard deviation for confidence
  const variance =
    recentValues.reduce((sum, val) => sum + Math.pow(val - ma, 2), 0) / periods;
  const stdDev = Math.sqrt(variance);

  // Generate forecast points
  for (let i = 1; i <= forecastDays; i++) {
    const timestamp = lastTimestamp + i * dayMs;
    const confidence = Math.max(0.3, 1 - i / forecastDays); // Decreasing confidence

    forecast.push({
      timestamp,
      predicted: ma,
      confidence,
      lower_bound: ma - 1.96 * stdDev,
      upper_bound: ma + 1.96 * stdDev,
    });
  }

  return forecast;
}

/**
 * Linear Regression forecast
 */
export function forecastLinearRegression(
  historicalData: Array<{ timestamp: number; value: number }>,
  forecastDays: number = 7
): ForecastPoint[] {
  if (historicalData.length < 3) {
    return [];
  }

  const n = historicalData.length;
  const dayMs = 24 * 60 * 60 * 1000;

  // Normalize timestamps to days
  const firstTimestamp = historicalData[0].timestamp;
  const x = historicalData.map(
    (d, i) => (d.timestamp - firstTimestamp) / dayMs
  );
  const y = historicalData.map((d) => d.value);

  // Calculate linear regression coefficients
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce(
    (sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2),
    0
  );
  const rSquared = 1 - ssResidual / ssTotal;

  // Calculate residual standard error
  const residuals = y.map((yi, i) => yi - (slope * x[i] + intercept));
  const rse = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2));

  // Generate forecast
  const forecast: ForecastPoint[] = [];
  const lastTimestamp = historicalData[historicalData.length - 1].timestamp;
  const lastX = x[x.length - 1];

  for (let i = 1; i <= forecastDays; i++) {
    const timestamp = lastTimestamp + i * dayMs;
    const xValue = lastX + i;
    const predicted = slope * xValue + intercept;
    const confidence = Math.max(0.3, rSquared * (1 - i / (forecastDays * 2)));

    forecast.push({
      timestamp,
      predicted,
      confidence,
      lower_bound: predicted - 1.96 * rse,
      upper_bound: predicted + 1.96 * rse,
    });
  }

  return forecast;
}

/**
 * Exponential Smoothing forecast
 */
export function forecastExponentialSmoothing(
  historicalData: Array<{ timestamp: number; value: number }>,
  alpha: number = 0.3,
  forecastDays: number = 7
): ForecastPoint[] {
  if (historicalData.length < 2) {
    return [];
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const values = historicalData.map((d) => d.value);

  // Calculate smoothed values
  const smoothed: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
  }

  // Calculate forecast error
  const errors = values.map((v, i) => (i > 0 ? v - smoothed[i - 1] : 0));
  const mse = errors.reduce((sum, e) => sum + e * e, 0) / (errors.length - 1);
  const rmse = Math.sqrt(mse);

  // Generate forecast
  const forecast: ForecastPoint[] = [];
  const lastTimestamp = historicalData[historicalData.length - 1].timestamp;
  const lastSmoothed = smoothed[smoothed.length - 1];

  for (let i = 1; i <= forecastDays; i++) {
    const timestamp = lastTimestamp + i * dayMs;
    const confidence = Math.max(0.3, 1 - i / forecastDays);

    forecast.push({
      timestamp,
      predicted: lastSmoothed,
      confidence,
      lower_bound: lastSmoothed - 1.96 * rmse,
      upper_bound: lastSmoothed + 1.96 * rmse,
    });
  }

  return forecast;
}

/**
 * Analyze trend in historical data
 */
export function analyzeTrend(
  historicalData: Array<{ timestamp: number; value: number }>
): TrendAnalysis {
  if (historicalData.length < 3) {
    return {
      direction: "stable",
      strength: 0,
      slope: 0,
      r_squared: 0,
    };
  }

  const n = historicalData.length;
  const dayMs = 24 * 60 * 60 * 1000;
  const firstTimestamp = historicalData[0].timestamp;

  // Normalize timestamps
  const x = historicalData.map(
    (d, i) => (d.timestamp - firstTimestamp) / dayMs
  );
  const y = historicalData.map((d) => d.value);

  // Linear regression
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce(
    (sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2),
    0
  );
  const rSquared = 1 - ssResidual / ssTotal;

  // Determine direction and strength
  const avgValue = yMean;
  const slopePercent = (slope / avgValue) * 100;

  let direction: "up" | "down" | "stable";
  if (Math.abs(slopePercent) < 0.5) {
    direction = "stable";
  } else if (slope > 0) {
    direction = "up";
  } else {
    direction = "down";
  }

  const strength = Math.min(1, Math.abs(rSquared));

  return {
    direction,
    strength,
    slope,
    r_squared: rSquared,
  };
}

/**
 * Detect anomalies in recent data
 */
export function detectAnomaly(
  historicalData: Array<{ timestamp: number; value: number }>,
  currentValue: number,
  threshold: number = 2.5
): AnomalyDetection {
  if (historicalData.length < 5) {
    return { isAnomaly: false, score: 0 };
  }

  const values = historicalData.map((d) => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  const stdDev = Math.sqrt(variance);

  // Z-score
  const zScore = Math.abs((currentValue - mean) / stdDev);
  const isAnomaly = zScore > threshold;
  const score = Math.min(1, zScore / (threshold * 2));

  let reason: string | undefined;
  if (isAnomaly) {
    if (currentValue > mean) {
      reason = `Value is ${zScore.toFixed(1)} standard deviations above historical average`;
    } else {
      reason = `Value is ${zScore.toFixed(1)} standard deviations below historical average`;
    }
  }

  return {
    isAnomaly,
    score,
    reason,
  };
}

/**
 * Get best forecast method based on historical data
 */
export function getBestForecast(
  historicalData: Array<{ timestamp: number; value: number }>,
  forecastDays: number = 7
): {
  method: "moving_average" | "linear_regression" | "exponential_smoothing";
  forecast: ForecastPoint[];
  confidence: number;
} {
  // Try all methods
  const ma = forecastMovingAverage(historicalData, 7, forecastDays);
  const lr = forecastLinearRegression(historicalData, forecastDays);
  const es = forecastExponentialSmoothing(historicalData, 0.3, forecastDays);

  // Calculate average confidence for each method
  const maConfidence =
    ma.reduce((sum, p) => sum + p.confidence, 0) / (ma.length || 1);
  const lrConfidence =
    lr.reduce((sum, p) => sum + p.confidence, 0) / (lr.length || 1);
  const esConfidence =
    es.reduce((sum, p) => sum + p.confidence, 0) / (es.length || 1);

  // Choose method with highest confidence
  if (lrConfidence >= maConfidence && lrConfidence >= esConfidence) {
    return {
      method: "linear_regression",
      forecast: lr,
      confidence: lrConfidence,
    };
  } else if (esConfidence >= maConfidence) {
    return {
      method: "exponential_smoothing",
      forecast: es,
      confidence: esConfidence,
    };
  } else {
    return { method: "moving_average", forecast: ma, confidence: maConfidence };
  }
}

/**
 * Calculate forecast accuracy metrics
 */
export function calculateForecastAccuracy(
  actual: number[],
  predicted: number[]
): {
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Squared Error
} {
  if (actual.length !== predicted.length || actual.length === 0) {
    return { mae: 0, mape: 0, rmse: 0 };
  }

  const n = actual.length;
  let sumAE = 0;
  let sumAPE = 0;
  let sumSE = 0;

  for (let i = 0; i < n; i++) {
    const error = Math.abs(actual[i] - predicted[i]);
    sumAE += error;
    sumAPE += (error / Math.abs(actual[i])) * 100;
    sumSE += Math.pow(error, 2);
  }

  return {
    mae: sumAE / n,
    mape: sumAPE / n,
    rmse: Math.sqrt(sumSE / n),
  };
}
