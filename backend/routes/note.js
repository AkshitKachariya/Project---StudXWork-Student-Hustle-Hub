const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotes, uploadNote, buyNote, getMyNotes } = require('../controllers/noteController');

router.get('/',         getNotes);
router.get('/my',       protect, getMyNotes);
router.post('/',        protect, uploadNote);
router.post('/:id/buy', protect, buyNote);

module.exports = router;
