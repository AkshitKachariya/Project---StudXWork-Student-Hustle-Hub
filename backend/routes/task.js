const express = require('express');
const router = express.Router();
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');
const { getTasks, getTask, createTask, updateTask, deleteTask, getMyTasks } = require('../controllers/taskController');

router.get('/',         optionalProtect, getTasks);
router.get('/my',       protect, authorize('recruiter'), getMyTasks);
router.get('/:id',      optionalProtect, getTask);
router.post('/',        protect, authorize('recruiter','admin'), createTask);
router.put('/:id',      protect, authorize('recruiter','admin'), updateTask);
router.delete('/:id',   protect, authorize('recruiter','admin'), deleteTask);

module.exports = router;
