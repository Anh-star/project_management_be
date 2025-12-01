const commentModel = require("../models/comment.model");

const getTaskComments = async (req, res) => {
  try {
    const comments = await commentModel.getByTaskId(req.params.taskId);
    res.status(200).json(comments);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Nội dung trống" });

    const newComment = await commentModel.create(
      req.params.taskId,
      req.user.id,
      content
    );

    // (Tùy chọn) Lấy thêm info user để trả về frontend hiển thị ngay
    newComment.username = req.user.username;

    res.status(201).json(newComment);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    await commentModel.deleteById(req.params.id);
    res.status(200).json({ message: "Đã xóa" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getTaskComments, addComment, deleteComment };
