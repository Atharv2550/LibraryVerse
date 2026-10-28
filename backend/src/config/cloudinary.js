const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  return Boolean(
    name &&
    key &&
    secret &&
    name !== 'demo' &&
    key !== '123456789' &&
    secret !== 'abcdefghijklmnopqrstuvwxyz'
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

module.exports = { cloudinary, isCloudinaryConfigured };
