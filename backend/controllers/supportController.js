const Support = require('../models/Support');
const User = require('../models/User');
const Task = require('../models/Task');

// Create Ticket
exports.createTicket = async (req, res) => {
  try {
    const { title, description, category, relatedTaskId, relatedPaymentId, priority, attachmentUrls } = req.body;
    
    // Parse attachment URLs from request body
    let parsedUrls = [];
    try { parsedUrls = attachmentUrls ? (typeof attachmentUrls === 'string' ? JSON.parse(attachmentUrls) : attachmentUrls) : []; } catch { parsedUrls = []; }

    const attachments = parsedUrls.map(f => ({
      filename: f.name || f.url.split('/').pop() || 'file',
      originalName: f.name || f.url.split('/').pop() || 'file',
      path: f.url
    }));

    const ticket = await Support.create({
      title,
      description,
      category,
      relatedTaskId: (relatedTaskId && relatedTaskId !== 'undefined') ? relatedTaskId : null,
      relatedPaymentId: (relatedPaymentId && relatedPaymentId !== 'undefined') ? relatedPaymentId : null,
      priority: priority || 'LOW',
      createdBy: req.user.id,
      userRole: req.user.role,
      attachments
    });

    // Notify Admins
    if (req.io) {
      req.io.emit('new_support_ticket', { ticketId: ticket.ticketId, title: ticket.title, priority: ticket.priority });
    }

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create ticket' });
  }
};

// Get All Tickets (Admin) or My Tickets (User)
exports.getTickets = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    } else {
      if (status) query.status = status;
      if (category) query.category = category;
      if (priority) query.priority = priority;
    }

    const tickets = await Support.find(query)
      .populate('createdBy', 'name email profilePicture')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Support.countDocuments(query);

    res.status(200).json({ success: true, count: tickets.length, total, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
};

// Get Single Ticket
exports.getTicket = async (req, res) => {
  try {
    const ticket = await Support.findById(req.params.id)
      .populate('createdBy', 'name email profilePicture')
      .populate('assignedTo', 'name email')
      .populate('relatedTaskId', 'title status')
      .populate('messages.sender', 'name profilePicture role');

    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    // Security check
    if (req.user.role !== 'admin' && ticket.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized access' });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch ticket details' });
  }
};

// Add Message to Thread
exports.addMessage = async (req, res) => {
  try {
    const { message, attachmentUrls } = req.body;
    const ticket = await Support.findById(req.params.id);

    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    // Check permissions
    if (req.user.role !== 'admin' && ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Parse attachment URLs from request body
    let parsedUrls = [];
    try { parsedUrls = attachmentUrls ? (typeof attachmentUrls === 'string' ? JSON.parse(attachmentUrls) : attachmentUrls) : []; } catch { parsedUrls = []; }

    const attachments = parsedUrls.map(f => ({
      filename: f.name || f.url.split('/').pop() || 'file',
      originalName: f.name || f.url.split('/').pop() || 'file',
      path: f.url
    }));

    const newMessage = {
      sender: req.user.id,
      message,
      attachments
    };

    ticket.messages.push(newMessage);
    
    // Auto change status if admin replies
    if (req.user.role === 'admin' && ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();

    // Notify other party
    if (req.io) {
      const targetId = req.user.role === 'admin' ? ticket.createdBy : (ticket.assignedTo || 'admins');
      req.io.emit(`support_message_${targetId}`, { ticketId: ticket.ticketId, message });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// Update Ticket (Status/Assignment) - Admin Only
exports.updateTicket = async (req, res) => {
  try {
    const { status, priority, assignedTo, adminNotes } = req.body;
    const ticket = await Support.findById(req.params.id);

    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    if (status) {
      ticket.status = status;
      if (status === 'RESOLVED') ticket.resolvedAt = Date.now();
      if (status === 'CLOSED') ticket.closedAt = Date.now();
    }
    if (priority) ticket.priority = priority;
    if (assignedTo) ticket.assignedTo = assignedTo;
    if (adminNotes !== undefined) ticket.adminNotes = adminNotes;

    await ticket.save();

    // Notify User
    if (req.io && status) {
      req.io.emit(`ticket_status_update_${ticket.createdBy}`, { ticketId: ticket.ticketId, status });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update ticket' });
  }
};

// Reopen Ticket (User Only)
exports.reopenTicket = async (req, res) => {
  try {
    const ticket = await Support.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    
    if (ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only creator can reopen' });
    }

    ticket.status = 'IN_PROGRESS';
    ticket.resolvedAt = null;
    ticket.closedAt = null;
    
    ticket.messages.push({
      sender: req.user.id,
      message: '--- Ticket Reopened by User ---'
    });

    await ticket.save();

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reopen ticket' });
  }
};
