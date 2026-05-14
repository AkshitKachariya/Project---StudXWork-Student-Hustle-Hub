const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { addRating, getUserRatings, getAllRatings, toggleApproval } = require('../controllers/ratingController');

router.post('/',                protect, addRating);
router.get('/all',              protect, authorize('admin'), getAllRatings);
router.get('/:userId',          getUserRatings);
router.put('/:id/toggle',       protect, authorize('admin'), toggleApproval);

module.exports = router;
