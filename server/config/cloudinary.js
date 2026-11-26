const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

const uploadsDir = path.join(__dirname, '..', 'uploads');

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const ensureLocalUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

/**
 * Uploads a Multer memory file either to Cloudinary (if configured)
 * or to local /uploads static folder as an automatic fallback.
 * Supports restricted KYC folder placement via options.restricted.
 */
const uploadMediaFile = async (file, req, options = {}) => {
  if (!file) return null;
  const { folder = 'janupkram-portal', restricted = false } = options;

  if (isCloudinaryConfigured()) {
    const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';
    const uploadParams = {
      folder: restricted ? 'janupkram-kyc-private' : folder,
      resource_type: resourceType,
    };
    if (restricted) {
      uploadParams.type = 'authenticated';
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        uploadParams,
        (error, uploaded) => {
          if (error) return reject(error);
          resolve(uploaded);
        }
      );
      stream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      filename: file.originalname,
      mimetype: file.mimetype,
      restricted,
    };
  }

  ensureLocalUploadsDir();
  const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
  const safeBase = path
    .basename(file.originalname || 'evidence', ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeBase}${ext}`;
  const targetPath = path.join(uploadsDir, uniqueName);
  await fs.promises.writeFile(targetPath, file.buffer);

  const protocol = req ? req.protocol : 'http';
  const host = req ? req.get('host') : `localhost:${process.env.PORT || 5000}`;

  return {
    url: `${protocol}://${host}/uploads/${uniqueName}`,
    publicId: `local:${uniqueName}`,
    filename: file.originalname,
    mimetype: file.mimetype,
  };
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadMediaFile,
  uploadsDir,
};
