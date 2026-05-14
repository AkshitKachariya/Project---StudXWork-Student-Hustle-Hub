const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  acceptBid,
  submitWork,
  approveSubmission,
  requestRevision,
  rejectWork,
  getMyAssignedTasks,
  getTaskWorkspace,
} = require('../controllers/workflowController');

// ── Student Routes ──
router.get('/my-tasks', protect, authorize('student'), getMyAssignedTasks);
router.post('/submit/:taskId', protect, authorize('student'), submitWork);

// ── Recruiter Routes ──
router.post('/accept-bid/:applicationId', protect, authorize('recruiter'), acceptBid);
router.post('/approve/:taskId', protect, authorize('recruiter'), approveSubmission);
router.post('/revision/:taskId', protect, authorize('recruiter'), requestRevision);
router.post('/reject/:taskId', protect, authorize('recruiter'), rejectWork);

// ── Shared Route ──
router.get('/workspace/:taskId', protect, getTaskWorkspace);

module.exports = router;
