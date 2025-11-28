const db = require("../config/db");

/**
 * Middleware 1: Kiểm tra có phải là thành viên dự án không (Dùng cho việc xem)
 */
const isProjectMember = async (req, res, next) => {
  try {
    if (req.user.role === "ADMIN") return next();

    const { projectId } = req.params;
    const userId = req.user.id;

    const query = `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`;
    const { rows } = await db.query(query, [projectId, userId]);

    if (rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Bạn không phải là thành viên của dự án này." });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Lỗi kiểm tra quyền thành viên." });
  }
};

/**
 * Middleware 2 (QUAN TRỌNG): Kiểm tra quyền Quản lý (Manager)
 * Thay thế cho isProjectOwnerOrAdmin cũ
 */
const isProjectManagerOrAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const user = req.user;

    if (user.role === "ADMIN") return next();

    // 2. Kiểm tra trong bảng project_members xem user này có cột is_manager = true không
    const query = `
            SELECT is_manager 
            FROM project_members 
            WHERE project_id = $1 AND user_id = $2
        `;
    const { rows } = await db.query(query, [projectId, user.id]);

    // Nếu tìm thấy VÀ is_manager là true -> Cho qua
    if (rows.length > 0 && rows[0].is_manager === true) {
      return next();
    }

    return res
      .status(403)
      .json({ message: "Bạn không có quyền quản lý dự án này." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi kiểm tra quyền quản lý." });
  }
};

module.exports = {
  isProjectMember,
  isProjectManagerOrAdmin,
};
