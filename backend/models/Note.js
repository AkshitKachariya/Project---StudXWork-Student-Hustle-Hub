const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const NoteSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  subject:     { type: String, required: true },
  description: { type: String, default: '' },
  fileUrl:     { type: String, required: true },
  thumbnailUrl:{ type: String, default: '' },
  price:       { type: Number, default: 0 },
  uploader:    { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  isApproved:  { type: Boolean, default: false },
  buyers:      [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  downloads:   { type: Number, default: 0 },
}, { timestamps: true });

NoteSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Note', NoteSchema);
