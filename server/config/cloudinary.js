// server/config/cloudinary.js
const cloudinary = require('cloudinary').v2;

// Prefer CLOUDINARY_URL if provided; otherwise use explicit keys
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true }); // CLOUDINARY_URL is auto-detected by the SDK
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

module.exports = cloudinary;
