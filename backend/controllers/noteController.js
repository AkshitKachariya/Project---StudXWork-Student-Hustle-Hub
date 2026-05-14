const Note = require('../models/Note');
const User = require('../models/User');
const WalletTx = require('../models/WalletTx');

// Get approved notes
exports.getNotes = async (req, res) => {
  const { page = 1, limit = 12, search, subject } = req.query;
  const query = { isApproved: true };
  if (search) query.title = { $regex: search, $options: 'i' };
  if (subject) query.subject = { $regex: subject, $options: 'i' };
  const options = { page: parseInt(page), limit: parseInt(limit), populate: { path: 'uploader', select: 'name' }, sort: { createdAt: -1 } };
  const notes = await Note.paginate(query, options);
  res.status(200).json({ success: true, data: notes });
};

// Upload note (now accepts URL instead of file)
exports.uploadNote = async (req, res) => {
  const { fileUrl } = req.body;
  if (!fileUrl) return res.status(400).json({ success: false, error: 'Please provide a file URL' });
  req.body.uploader = req.user.id;
  req.body.fileUrl = fileUrl;
  const note = await Note.create(req.body);
  res.status(201).json({ success: true, data: note, message: 'Note submitted for admin approval' });
};

// Buy / download note
exports.buyNote = async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
  if (!note.isApproved) return res.status(400).json({ success: false, error: 'Note not approved yet' });

  // Check if already bought
  if (note.buyers.includes(req.user.id) || note.uploader.toString() === req.user.id) {
    return res.status(200).json({ success: true, fileUrl: note.fileUrl, message: 'Download ready' });
  }

  const buyer = await User.findById(req.user.id);
  if (note.price > 0 && buyer.walletBalance < note.price)
    return res.status(400).json({ success: false, error: 'Insufficient wallet balance' });

  if (note.price > 0) {
    buyer.walletBalance -= note.price;
    await buyer.save();
    await WalletTx.create({ user: buyer._id, type: 'debit', amount: note.price, source: 'note', reference: note._id.toString(), note: `Purchased note: ${note.title}` });

    // Credit uploader
    const uploader = await User.findById(note.uploader);
    uploader.walletBalance += note.price;
    await uploader.save();
    await WalletTx.create({ user: uploader._id, type: 'credit', amount: note.price, source: 'note', reference: note._id.toString(), note: `Note sold: ${note.title}` });
  }

  note.buyers.push(buyer._id);
  note.downloads += 1;
  await note.save();

  res.status(200).json({ success: true, fileUrl: note.fileUrl, message: 'Download ready' });
};

// My uploaded notes
exports.getMyNotes = async (req, res) => {
  const notes = await Note.find({ uploader: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: notes.length, data: notes });
};
