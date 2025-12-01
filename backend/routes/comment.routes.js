const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams để lấy taskId
const commentController = require("../controllers/comment.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// QUAN TRỌNG: Import middleware upload để xử lý FormData
const upload = require("../middleware/upload.middleware");

router.use(authenticateToken);

router.get("/", commentController.getTaskComments);

// --- SỬA TẠI ĐÂY ---
// Thêm upload.single('file') vào giữa.
// Nó sẽ giúp biến đổi FormData thành req.body (text) và req.file (ảnh)
router.post("/", upload.single("file"), commentController.addComment);

router.delete("/:id", commentController.deleteComment);

module.exports = router;
