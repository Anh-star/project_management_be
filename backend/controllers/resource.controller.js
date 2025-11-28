// backend/controllers/resource.controller.js
const db = require("../config/db");

const getResourceStatus = async (req, res) => {
  try {
    // Query này:
    // 1. Lấy tất cả user
    // 2. Đếm số task đang active (chưa DONE)
    // 3. Gom danh sách các task đó lại thành mảng JSON để hiển thị chi tiết
    const queryText = `
            SELECT 
                u.id, u.username, u.email, u.role,
                COUNT(t.id) FILTER (WHERE t.status IN ('TODO', 'IN_PROGRESS', 'REVIEW')) as workload_count,
                COALESCE(
                    JSON_AGG(
                        json_build_object(
                            'id', t.id, 
                            'title', t.title, 
                            'status', t.status, 
                            'priority', t.priority,
                            'project_id', t.project_id
                        )
                    ) FILTER (WHERE t.status IN ('TODO', 'IN_PROGRESS', 'REVIEW')), 
                    '[]'
                ) as active_tasks
            FROM users u
            LEFT JOIN tasks t ON u.id = t.assignee_id
            WHERE u.role != 'ADMIN' -- Không cần xem tải của Admin hệ thống
            GROUP BY u.id
            ORDER BY workload_count DESC; -- Người bận nhất lên đầu
        `;

    const { rows } = await db.query(queryText);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi lấy dữ liệu tài nguyên." });
  }
};

module.exports = { getResourceStatus };
