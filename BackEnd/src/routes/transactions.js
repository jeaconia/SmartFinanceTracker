const express = require('express');
const router  = express.Router();
const {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');

router.post('/',    createTransaction);
router.get('/',     listTransactions);
router.get('/:id',  getTransaction);
router.put('/:id',  updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
