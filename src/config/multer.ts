import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { config } from './env';
import { AppError } from '../utils/AppError';
import { Request } from 'express';
import { FileFilterCallback } from 'multer';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export { cloudinary };

// Avatar storage — auto resize to 200x200, stored in devflow/avatars folder
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'devflow/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
  } as object,
});

// Attachment storage — raw files, stored in devflow/attachments
const attachmentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'devflow/attachments',
    resource_type: 'auto', // auto-detect image, video, raw
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'txt', 'zip'],
    access_mode: 'public',
  } as object,
});

function imageFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if(allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400));
  };
};

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

export const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
});