const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { apply, getMyApplications, getApplicants, updateStatus, releasePayment } = require('../controllers/applicationController');

router.post('/',                protect, authorize('student'), apply);
router.get('/my',               protect, authorize('student'), getMyApplications);
router.get('/applicants',       protect, authorize('recruiter','admin'), getApplicants);
router.put('/:id/status',       protect, authorize('recruiter','admin'), updateStatus);
router.post('/:id/release',     protect, authorize('recruiter'), releasePayment);

module.exports = router;
