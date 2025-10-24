// server/middleware/upload.js
const multer = require('multer');

const storage = multer.memoryStorage();

const allowedTypes = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  // Videos
  'video/mp4',
  'video/webm',
  'video/ogg',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
]);

function fileFilter(_req, file, cb) {
  if (allowedTypes.has(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error('Unsupported file type'), false);
}

// Global limits: up to 10 files per request and 100MB per file
const limits = {
  files: 10,
  fileSize: 100 * 1024 * 1024,
};

const upload = multer({ storage, fileFilter, limits });

module.exports = { upload };
