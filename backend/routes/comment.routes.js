const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams để lấy taskId từ route cha
const commentController = require("../controllers/comment.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

router.use(authenticateToken);

router.get("/", commentController.getTaskComments);
router.post("/", commentController.addComment);
router.delete("/:id", commentController.deleteComment);

module.exports = router;
