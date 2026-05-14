const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, getAllStudents, getAllRecruiters } = require('../controllers/profileController');

router.get('/me',              protect, getProfile);
router.put('/update',          protect, updateProfile);
router.get('/students',        protect, authorize('recruiter','admin'), getAllStudents);
router.get('/recruiters',      protect, authorize('admin'), getAllRecruiters);
router.get('/:id',             protect, getProfile);

module.exports = router;
