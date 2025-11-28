const taskModel = require("../models/task.model");

/**
 * Middleware kiểm tra quyền SỬA CÔNG VIỆC.
 * - Admin/PM: Được sửa.
 * - Member: Chỉ được sửa nếu họ là NGƯỜI ĐƯỢC GIAO (assignee).
 */
const canUpdateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const user = req.user; // Từ authenticateToken

    // Admin và PM có toàn quyền (giả định họ đã qua middleware isProjectMember)
    if (user.role === "ADMIN" || user.role === "PM") {
      return next();
    }

    // Nếu là MEMBER, kiểm tra xem có phải là assignee không
    const task = await taskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Công việc không tồn tại." });
    }

    if (task.assignee_id === user.id) {
      // Đánh dấu là assignee để service xử lý logic
      req.isAssigneeOnly = true;
      return next();
    }

    // Không phải PM, cũng không phải Assignee
    return res
      .status(403)
      .json({ message: "Bạn không có quyền sửa công việc này." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi kiểm tra quyền sửa task." });
  }
};

module.exports = {
  canUpdateTask,
};
