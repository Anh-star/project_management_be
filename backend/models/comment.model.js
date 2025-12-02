const db = require("../config/db");

const create = async (
  taskId,
  userId,
  content,
  parentId = null,
  imageUrl = null
) => {
  const query = `
        INSERT INTO comments (task_id, user_id, content, parent_id, image_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
  const { rows } = await db.query(query, [
    taskId,
    userId,
    content || "",
    parentId,
    imageUrl,
  ]);
  return rows[0];
};

const getByTaskId = async (taskId) => {
  // Join thêm bảng comments (alias p) để lấy tên người được reply
  const query = `
        SELECT c.*, 
               u.username, u.email, u.role,
               p.id as parent_id, 
               pu.username as parent_username,
               pu.email as parent_email,
               p.content as parent_content
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN comments p ON c.parent_id = p.id
        LEFT JOIN users pu ON p.user_id = pu.id
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC
    `;
  const { rows } = await db.query(query, [taskId]);
  return rows;
};

const findById = async (commentId) => {
  const { rows } = await db.query("SELECT * FROM comments WHERE id = $1", [
    commentId,
  ]);
  return rows[0];
};

const deleteById = async (commentId) => {
  const query = `
        UPDATE comments 
        SET 
            content = 'Tin nhắn đã bị xóa', -- Ghi đè nội dung
            image_url = NULL,              -- Xóa ảnh (tiết kiệm chỗ)
            is_deleted = TRUE              -- Đánh dấu
        WHERE id = $1
    `;
  await db.query(query, [commentId]);
};

module.exports = { create, getByTaskId, deleteById, findById };
