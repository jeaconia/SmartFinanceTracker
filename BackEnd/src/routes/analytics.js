const express = require('express');
const router = express.Router();
const {
  getSummary,
  getMonthlyChart,
  getCategoryChart,
  getTrendChart,
} = require('../controllers/analyticsController');

// GET /api/analytics/summary?month=YYYY-MM
router.get('/summary', getSummary);

// GET /api/analytics/chart/monthly?year=YYYY
router.get('/chart/monthly', getMonthlyChart);

// GET /api/analytics/chart/category?month=YYYY-MM
router.get('/chart/category', getCategoryChart);

// GET /api/analytics/chart/trend?months=6
router.get('/chart/trend', getTrendChart);

module.exports = router;