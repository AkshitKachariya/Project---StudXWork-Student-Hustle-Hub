const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getNotices, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');

router.get('/',         protect, getNotices);
router.post('/',        protect, authorize('admin'), createNotice);
router.put('/:id',      protect, authorize('admin'), updateNotice);
router.delete('/:id',   protect, authorize('admin'), deleteNotice);

module.exports = router;
