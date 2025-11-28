const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { isAdmin, isAdminOrPM } = require("../middleware/role.middleware");

// Middleware xác thực chung
router.use(authenticateToken);
router.get("/", isAdminOrPM, userController.getUsers);

// Các route Cấu hình hệ thống (Tạo, Sửa, Xóa User)
router.post("/", isAdmin, userController.createUser);
router.patch("/:id", isAdmin, userController.updateUser);
router.delete("/:id", isAdmin, userController.deleteUser);

module.exports = router;
