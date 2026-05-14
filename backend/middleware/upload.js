const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Ensure submissions folder exists
const submissionsDir = path.join(__dirname, '../uploads/submissions');
if (!fs.existsSync(submissionsDir)) fs.mkdirSync(submissionsDir, { recursive: true });

// Ensure support folder exists
const supportDir = path.join(__dirname, '../uploads/support');
if (!fs.existsSync(supportDir)) fs.mkdirSync(supportDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, submissionsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext || mime) cb(null, true);
  else cb(new Error('Only images, PDFs, and documents are allowed'), false);
};

const submissionFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|zip|rar|7z|tar|gz|txt|csv|xls|xlsx|mp4|mp3|avi|mov|psd|ai|fig|sketch|svg|json|xml|html|css|js|py|java|cpp|c|md/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  if (ext) cb(null, true);
  else cb(null, true); // Allow all files for submissions
};

const supportStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, supportDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const submissionUpload = multer({ 
  storage: submissionStorage, 
  fileFilter: submissionFileFilter, 
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB for submissions
});

const supportUpload = multer({
  storage: supportStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB for support
});

module.exports = upload;
module.exports.submissionUpload = submissionUpload;
module.exports.supportUpload = supportUpload;
