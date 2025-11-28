const userService = require("../services/user.service");

const getUsers = async (req, res) => {
  try {
    // Lấy tham số từ URL (VD: ?page=1&search=admin)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Mặc định 10 dòng/trang
    const search = req.query.search || "";
    const role = req.query.role || ""; // Lấy role từ query

    const result = await userService.getAllUsers(search, page, limit, role);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ message: "Đã xóa người dùng." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
