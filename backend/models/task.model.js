const db = require("../config/db");

/**
 * Tạo một công việc mới
 */
const create = async (taskData) => {
  const {
    projectId,
    title,
    description,
    status,
    priority,
    start_date,
    due_date,
    assignee_id, // ID người được giao
    created_by, // ID người tạo (PM/Admin)
    parent_id, // ID công việc cha (có thể null)
  } = taskData;

  const queryText = `
        INSERT INTO tasks (
            project_id, title, description, status, priority, 
            start_date, due_date, assignee_id, created_by, parent_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `;

  // Nếu status, priority, v.v. không được cung cấp, chúng sẽ dùng DEFAULT trong DB
  const values = [
    projectId,
    title,
    description,
    status || "TODO",
    priority || "MEDIUM",
    start_date,
    due_date,
    assignee_id,
    created_by,
    parent_id,
  ];

  try {
    const { rows } = await db.query(queryText, values);
    return rows[0];
  } catch (error) {
    // Lỗi 23503 có thể là do project_id, assignee_id, created_by hoặc parent_id không tồn tại
    if (error.code === "23503") {
      console.error("Lỗi khóa ngoại khi tạo task:", error.detail);
      throw new Error("Dự án, người dùng hoặc công việc cha không hợp lệ.");
    }
    throw error;
  }
};

/**
 * Lấy tất cả công việc (dạng phẳng) của một dự án
 */
const findByProjectId = async (projectId, priority = "", status = "") => {
  let queryText = `SELECT * FROM tasks WHERE project_id = $1`;
  const params = [projectId];
  let paramIndex = 2; // Bắt đầu từ $2

  // Lọc Priority
  if (priority) {
    queryText += ` AND priority = $${paramIndex}`;
    params.push(priority);
    paramIndex++;
  }

  // Lọc Status (Mới thêm)
  if (status) {
    queryText += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  queryText += ` ORDER BY created_at ASC`;

  try {
    const { rows } = await db.query(queryText, params);
    return rows;
  } catch (error) {
    throw error;
  }
};
/**
 * Tìm một công việc bằng ID của nó
 */
const findById = async (taskId) => {
  const queryText = "SELECT * FROM tasks WHERE id = $1";
  try {
    const { rows } = await db.query(queryText, [taskId]);
    return rows[0]; // Trả về task hoặc undefined
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật một công việc
 */
const update = async (taskId, updates) => {
  // updates là một object, ví dụ: { title: 'New Title', status: 'DONE' }

  // Tự động tạo chuỗi query SET
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  // Tạo chuỗi "title" = $1, "status" = $2, ...
  const setString = fields
    .map((field, index) => `"${field}" = $${index + 2}`)
    .join(", ");

  const queryText = `
        UPDATE tasks
        SET ${setString}
        WHERE id = $1
        RETURNING *
    `;

  try {
    const { rows } = await db.query(queryText, [taskId, ...values]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa một công việc
 */
const deleteById = async (taskId) => {
  // LƯU Ý: Do ràng buộc khóa ngoại, nếu bạn xóa một task cha,
  // các task con sẽ có parent_id = NULL (như chúng ta đã set)
  // Nếu muốn xóa cả cây, logic sẽ phức tạp hơn.

  const queryText = "DELETE FROM tasks WHERE id = $1 RETURNING *";
  try {
    const { rows } = await db.query(queryText, [taskId]);
    return rows[0]; // Trả về task đã xóa
  } catch (error) {
    throw error;
  }
};

const countIncomplete = async (projectId) => {
  const queryText = `
        SELECT COUNT(*) 
        FROM tasks 
        WHERE project_id = $1 AND status != 'DONE'
    `;
  try {
    const { rows } = await db.query(queryText, [projectId]);
    return parseInt(rows[0].count);
  } catch (error) {
    throw error;
  }
};

const hasIncompleteChildren = async (parentId) => {
  const queryText = `
        SELECT 1 
        FROM tasks 
        WHERE parent_id = $1 AND status != 'DONE'
        LIMIT 1
    `;
  try {
    const { rows } = await db.query(queryText, [parentId]);
    return rows.length > 0; // Nếu tìm thấy dòng nào -> Có task con chưa xong
  } catch (error) {
    throw error;
  }
};

const findAllByUserId = async (userId, role, filters = {}) => {
  const { projectId, assigneeId } = filters;
  let params = [];
  let paramIdx = 1;

  let queryText = `
        SELECT t.*, p.name as project_name, u.username as assignee_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.assignee_id = u.id
    `;

  // Điều kiện Join để bảo mật (Chỉ xem task của dự án mình tham gia)
  if (role !== "ADMIN") {
    queryText += `
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = $${paramIdx++}
        `;
    params.push(userId);
  } else {
    queryText += ` WHERE 1=1 `; // Dummy condition cho Admin
  }

  // Filter theo Dự án
  if (projectId) {
    queryText += ` AND t.project_id = $${paramIdx++}`;
    params.push(projectId);
  }

  // Filter theo Người được giao
  if (assigneeId) {
    queryText += ` AND t.assignee_id = $${paramIdx++}`;
    params.push(assigneeId);
  }

  queryText += ` ORDER BY t.due_date ASC`;

  try {
    const { rows } = await db.query(queryText, params);
    return rows;
  } catch (error) {
    throw error;
  }
};
module.exports = {
  create,
  findByProjectId,
  findById,
  update,
  deleteById,
  countIncomplete,
  hasIncompleteChildren,
  findAllByUserId,
};
