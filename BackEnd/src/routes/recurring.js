const express = require('express');
const router  = express.Router();
const {
  createRecurring,
  listRecurring,
  updateRecurring,
  deleteRecurring,
  activateRecurring,
} = require('../controllers/recurringController');

router.post('/',              createRecurring);
router.get('/',               listRecurring);
router.put('/:id',            updateRecurring);
router.delete('/:id',         deleteRecurring);
router.post('/:id/activate',  activateRecurring);

module.exports = router;
