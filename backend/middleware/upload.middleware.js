// backend/middleware/upload.middleware.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");

// 1. Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Cấu hình Storage (Đã sửa lỗi mất đuôi file)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Lấy tên file gốc (bỏ đuôi)
    const name = path.parse(file.originalname).name;
    // Lấy đuôi file (ví dụ: .docx -> docx)
    const ext = path.extname(file.originalname).substring(1);

    return {
      folder: "project_manager_app",

      // Tự động nhận diện (image, video, raw)
      resource_type: "auto",

      // QUAN TRỌNG: Ép buộc định dạng file trên Cloudinary
      // Điều này giúp link trả về luôn có đuôi (vd: .docx, .xlsx)
      format: ext,

      // Đặt tên file: Timestamp - Tên Gốc
      public_id: `${Date.now()}-${name}`,

      // Giữ nguyên tên file gốc khi tải về (nếu trình duyệt hỗ trợ)
      use_filename: true,
    };
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
