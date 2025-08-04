import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

export const CLOUDINARY_FOLDER = 'wedding-planner'
export const UPLOAD_PRESETS = {
  photo: 'wedding_photo_preset',
  document: 'wedding_document_preset',
  avatar: 'wedding_avatar_preset'
}

export const IMAGE_TRANSFORMATIONS = {
  thumbnail: {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 'auto',
    format: 'webp'
  },
  gallery: {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto',
    format: 'webp'
  },
  fullsize: {
    width: 1920,
    height: 1080,
    crop: 'limit',
    quality: 'auto',
    format: 'webp'
  }
}