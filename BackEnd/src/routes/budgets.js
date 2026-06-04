const express = require('express');
const router  = express.Router();
const {
  createBudget,
  listBudgets,
  updateBudget,
  deleteBudget,
} = require('../controllers/budgetController');

router.post('/',    createBudget);
router.get('/',     listBudgets);
router.put('/:id',  updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
