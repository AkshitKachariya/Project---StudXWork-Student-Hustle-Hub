const Message = require('../models/Message');
const User = require('../models/User');

// Get conversation between two users
exports.getConversation = async (req, res) => {
  const { userId } = req.params;
  const messages = await Message.find({
    $or: [
      { sender: req.user.id, receiver: userId },
      { sender: userId, receiver: req.user.id }
    ]
  }).sort({ createdAt: 1 });

  // Mark as read
  await Message.updateMany({ sender: userId, receiver: req.user.id, isRead: false }, { isRead: true });

  res.status(200).json({ success: true, data: messages });
};

// Send message
exports.sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  if (!receiverId || !content) return res.status(400).json({ success: false, error: 'Receiver and content required' });

  const receiver = await User.findById(receiverId);
  if (!receiver) return res.status(404).json({ success: false, error: 'Receiver not found' });

  const message = await Message.create({ sender: req.user.id, receiver: receiverId, content });
  const populated = await message.populate('sender', 'name profilePicture');
  res.status(201).json({ success: true, data: populated });
};

// Get all chat contacts (people I've talked with)
exports.getContacts = async (req, res) => {
  const sent = await Message.distinct('receiver', { sender: req.user.id });
  const received = await Message.distinct('sender', { receiver: req.user.id });
  const contactIds = [...new Set([...sent.map(String), ...received.map(String)])].filter(id => id !== req.user.id);

  const contacts = await User.find({ _id: { $in: contactIds } }).select('name profilePicture role');
  
  const contactsWithUnread = await Promise.all(contacts.map(async (c) => {
    const unreadCount = await Message.countDocuments({ sender: c._id, receiver: req.user.id, isRead: false });
    return { ...c.toObject(), unreadCount };
  }));

  res.status(200).json({ success: true, data: contactsWithUnread });
};

// Unread count
exports.getUnreadCount = async (req, res) => {
  const count = await Message.countDocuments({ receiver: req.user.id, isRead: false });
  res.status(200).json({ success: true, count });
};

// Delete single message
exports.deleteMessage = async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ success: false, error: 'Message not found' });
  
  if (message.sender.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Not authorized to delete this message' });
  }

  await message.deleteOne();
  res.status(200).json({ success: true, message: 'Message deleted' });
};

// Clear entire conversation
exports.clearChat = async (req, res) => {
  const { userId } = req.params;
  await Message.deleteMany({
    $or: [
      { sender: req.user.id, receiver: userId },
      { sender: userId, receiver: req.user.id }
    ]
  });
  res.status(200).json({ success: true, message: 'Chat cleared' });
};
