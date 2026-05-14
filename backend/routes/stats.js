const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCounters } = require('../controllers/statsController');

router.get('/', protect, getCounters);

module.exports = router;
