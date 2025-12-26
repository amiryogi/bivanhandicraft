import path from 'path';
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// 1. Configuration (Matches official sample, using env vars)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Storage Engine (Multer-Cloudinary bridge)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nevan-handicraft',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

// 3. Upload Route
router.post('/', upload.single('image'), (req, res) => {
  try {
    // The file is already uploaded to Cloudinary by the storage engine.
    // 'req.file.filename' gives us the public_id needed for the SDK methods.

    // 4. Optimize delivery
    // We use cloudinary.url() instead of cloudinary.image() to get the string URL for React.
    // We applied your requested transformations here.
    const optimizeUrl = cloudinary.url(req.file.filename, {
      transformation: [
        { width: 500, crop: 'scale' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' },
      ],
      secure: true, // Force HTTPS
    });

    res.send({
      message: 'Image uploaded successfully',
      image: optimizeUrl, // Return the optimized URL
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Upload failed' });
  }
});

export default router;
