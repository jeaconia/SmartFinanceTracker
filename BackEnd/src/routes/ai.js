const express = require('express');
const router = express.Router();
const {
  getBudgetRecommendation,
  getSpendingLabel,
  predictNextMonthExpense,
  getAiResults,
} = require('../controllers/aiController');

// GET /api/ai/budget-recommendation
router.get('/budget-recommendation', getBudgetRecommendation);

// GET /api/ai/spending-label?month=YYYY-MM
router.get('/spending-label', getSpendingLabel);

// GET /api/ai/predict
router.get('/predict', predictNextMonthExpense);

// GET /api/ai/results?month=YYYY-MM
router.get('/results', getAiResults);

module.exports = router;