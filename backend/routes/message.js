const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getConversation, sendMessage, getContacts, getUnreadCount, deleteMessage, clearChat } = require('../controllers/messageController');

router.get('/contacts',      protect, getContacts);
router.get('/unread',        protect, getUnreadCount);
router.get('/:userId',       protect, getConversation);
router.post('/',             protect, sendMessage);
router.delete('/:id',        protect, deleteMessage);
router.delete('/clear/:userId', protect, clearChat);

module.exports = router;
