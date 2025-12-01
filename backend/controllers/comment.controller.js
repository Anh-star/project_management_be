// backend/controllers/comment.controller.js
const commentModel = require("../models/comment.model");
const userModel = require("../models/user.model");
const notiModel = require("../models/notification.model");
const cloudinary = require("cloudinary").v2; // <--- 1. IMPORT CLOUDINARY

// ... (Giữ nguyên hàm getTaskComments và addComment) ...
const getTaskComments = async (req, res) => {
  try {
    const c = await commentModel.getByTaskId(req.params.taskId);
    res.status(200).json(c);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const addComment = async (req, res) => {
  try {
    const body = req.body || {};
    const { content, parentId } = body;
    const imageUrl = req.file ? req.file.path : null;

    if ((!content || !content.trim()) && !imageUrl) {
      return res.status(400).json({ message: "Nội dung trống." });
    }

    const newComment = await commentModel.create(
      req.params.taskId,
      req.user.id,
      content || "",
      parentId,
      imageUrl
    );
    newComment.username = req.user.username;

    // Logic Notification (Tag, Reply...) - Giữ nguyên như cũ
    if (content) {
      const mentionRegex = /@(\w+)/g;
      const mentions = [...content.matchAll(mentionRegex)].map((m) => m[1]);
      const uniqueMentions = [...new Set(mentions)];
      for (const username of uniqueMentions) {
        const taggedUser = await userModel.findByUsername(username);
        if (taggedUser && taggedUser.id !== req.user.id) {
          await notiModel.create({
            user_id: taggedUser.id,
            title: "💬 Bạn được nhắc đến",
            message: `${req.user.username} nhắc bạn trong bình luận.`,
            type: "MENTION",
          });
        }
      }
    }
    res.status(201).json(newComment);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

// --- 2. SỬA HÀM DELETE COMMENT ---
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    // A. Tìm Comment trước để lấy link ảnh
    const comment = await commentModel.findById(id);

    if (!comment) {
      return res.status(404).json({ message: "Bình luận không tồn tại" });
    }

    // B. Nếu có ảnh -> Xóa trên Cloudinary
    if (comment.image_url) {
      try {
        // URL dạng: .../upload/v123/project_manager_app/1715-anh.jpg
        // Cần lấy public_id: project_manager_app/1715-anh

        const folderName = "project_manager_app";
        const urlParts = comment.image_url.split("/");
        let fileName = urlParts[urlParts.length - 1]; // 1715-anh.jpg

        // Giải mã URL (phòng trường hợp tên có dấu cách %20)
        fileName = decodeURIComponent(fileName);

        // Bỏ đuôi mở rộng (.jpg, .png)
        const fileNameWithoutExt = fileName.split(".").slice(0, -1).join(".");

        const publicId = `${folderName}/${fileNameWithoutExt}`;

        // Gọi Cloudinary xóa
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted Cloudinary Image: ${publicId}`);
      } catch (cloudError) {
        console.error("Lỗi xóa ảnh Cloudinary:", cloudError);
        // Vẫn cho phép xóa DB dù lỗi xóa ảnh (để tránh kẹt dữ liệu)
      }
    }

    // C. Xóa trong Database
    await commentModel.deleteById(id);

    res.status(200).json({ message: "Đã xóa bình luận" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getTaskComments, addComment, deleteComment };
