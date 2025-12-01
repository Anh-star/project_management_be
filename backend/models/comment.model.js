const db = require("../config/db");

const create = async (taskId, userId, content) => {
  const query = `
        INSERT INTO comments (task_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
  const { rows } = await db.query(query, [taskId, userId, content]);
  return rows[0];
};

const getByTaskId = async (taskId) => {
  // Join với bảng users để lấy tên và email người bình luận
  const query = `
        SELECT c.*, u.username, u.email, u.role
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC
    `;
  const { rows } = await db.query(query, [taskId]);
  return rows;
};

const deleteById = async (commentId) => {
  await db.query("DELETE FROM comments WHERE id = $1", [commentId]);
};

module.exports = { create, getByTaskId, deleteById };
