const express = require('express');
const router = express.Router();
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');
const { getJobs, getJob, createJob, updateJob, deleteJob, getMyJobs } = require('../controllers/jobController');

router.get('/',         optionalProtect, getJobs);
router.get('/my',       protect, authorize('recruiter'), getMyJobs);
router.get('/:id',      optionalProtect, getJob);
router.post('/',        protect, authorize('recruiter','admin'), createJob);
router.put('/:id',      protect, authorize('recruiter','admin'), updateJob);
router.delete('/:id',   protect, authorize('recruiter','admin'), deleteJob);

module.exports = router;
