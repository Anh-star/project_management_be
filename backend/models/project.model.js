const db = require("../config/db");

/**
 * Tạo dự án mới VÀ thêm người tạo làm thành viên
 * (Sử dụng transaction)
 */
const create = async (projectData, createdById, managerIds = []) => {
  const { name, project_code, description } = projectData;
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // Tạo Project
    const projectQuery = `INSERT INTO projects (name, project_code, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *`;
    const projectRes = await client.query(projectQuery, [
      name,
      project_code,
      description,
      createdById,
    ]);
    const newProject = projectRes.rows[0];

    // Tạo danh sách Manager (Người tạo + Người được chọn)
    const uniqueManagers = new Set([createdById, ...managerIds]);

    for (const userId of uniqueManagers) {
      const memberQuery = `
                INSERT INTO project_members (project_id, user_id, is_manager) 
                VALUES ($1, $2, TRUE)
                ON CONFLICT (project_id, user_id) DO UPDATE SET is_manager = TRUE
            `;
      await client.query(memberQuery, [newProject.id, userId]);
    }

    await client.query("COMMIT");
    return newProject;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") throw new Error("Mã dự án đã tồn tại.");
    throw error;
  } finally {
    client.release();
  }
};
/**
 * Lấy các dự án mà một user là thành viên
 */
const findProjectsByUserId = async (userId, keyword = "", status = "") => {
  const searchTerm = `%${keyword}%`;
  const statusCondition = status ? `AND p.status = '${status}'` : "";
  const queryText = `
        SELECT DISTINCT p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'DONE') as completed_tasks
        FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = $1 AND (p.name ILIKE $2 OR p.project_code ILIKE $2) ${statusCondition}
        ORDER BY p.created_at DESC
    `;
  const { rows } = await db.query(queryText, [userId, searchTerm]);
  return rows.map((row) => ({
    ...row,
    progress:
      row.total_tasks > 0
        ? Math.round((row.completed_tasks / row.total_tasks) * 100)
        : 0,
  }));
};

const addMember = async (projectId, userId) => {
  const queryText = `
        INSERT INTO project_members (project_id, user_id)
        VALUES ($1, $2)
        RETURNING *
    `;
  try {
    const { rows } = await db.query(queryText, [projectId, userId]);
    return rows[0];
  } catch (error) {
    if (error.code === "23505") {
      // Lỗi unique (đã là thành viên)
      throw new Error("Người dùng đã ở trong dự án này.");
    }
    if (error.code === "23503") {
      // Lỗi khóa ngoại (user hoặc project không tồn tại)
      throw new Error("Người dùng hoặc dự án không tồn tại.");
    }
    throw error;
  }
};

/**
 * Lấy danh sách thành viên của một dự án
 */
const getMembersByProjectId = async (pid) => {
  const { rows } = await db.query(
    `
        SELECT u.id, u.username, u.email, u.role, pm.is_manager 
        FROM users u 
        JOIN project_members pm ON u.id = pm.user_id 
        WHERE pm.project_id = $1
    `,
    [pid]
  );
  return rows;
};

const findById = async (projectId) => {
  const queryText = "SELECT * FROM projects WHERE id = $1";
  try {
    const { rows } = await db.query(queryText, [projectId]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật dự án
 */
const update = async (projectId, projectData, managerIds = null) => {
  const client = await db.getClient();
  const { name, description, status } = projectData;

  try {
    await client.query("BEGIN");

    // Update thông tin cơ bản
    if (name || description || status) {
      const fields = [];
      const values = [];
      if (name) {
        values.push(name);
        fields.push(`name = $${values.length}`);
      }
      if (description) {
        values.push(description);
        fields.push(`description = $${values.length}`);
      }
      if (status) {
        values.push(status);
        fields.push(`status = $${values.length}`);
      }

      if (fields.length > 0) {
        values.push(projectId);
        await client.query(
          `UPDATE projects SET ${fields.join(", ")} WHERE id = $${values.length}`,
          values
        );
      }
    }

    // Update danh sách Manager (Nếu có gửi lên)
    if (managerIds && Array.isArray(managerIds)) {
      // Reset quyền cũ
      await client.query(
        `UPDATE project_members SET is_manager = FALSE WHERE project_id = $1`,
        [projectId]
      );
      // Set quyền mới
      for (const userId of managerIds) {
        const upsertQuery = `
                    INSERT INTO project_members (project_id, user_id, is_manager)
                    VALUES ($1, $2, TRUE)
                    ON CONFLICT (project_id, user_id) DO UPDATE SET is_manager = TRUE
                `;
        await client.query(upsertQuery, [projectId, userId]);
      }
    }

    await client.query("COMMIT");
    const { rows } = await client.query(
      "SELECT * FROM projects WHERE id = $1",
      [projectId]
    );
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Xóa dự án
 * (Tất cả thành viên và công việc liên quan sẽ bị xóa theo
 * nhờ 'ON DELETE CASCADE' trong DDL)
 */
const deleteById = async (projectId) => {
  const queryText = "DELETE FROM projects WHERE id = $1 RETURNING *";
  try {
    const { rows } = await db.query(queryText, [projectId]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};

const removeMember = async (projectId, userId) => {
  const queryText =
    "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *";
  try {
    const { rows } = await db.query(queryText, [projectId, userId]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};

const findAll = async (keyword = "", status = "") => {
  const searchTerm = `%${keyword}%`;
  const statusCondition = status ? `AND p.status = '${status}'` : "";
  const queryText = `
        SELECT p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'DONE') as completed_tasks
        FROM projects p
        WHERE (p.name ILIKE $1 OR p.project_code ILIKE $1) ${statusCondition}
        ORDER BY p.created_at DESC
    `;
  const { rows } = await db.query(queryText, [searchTerm]);
  return rows.map((row) => ({
    ...row,
    progress:
      row.total_tasks > 0
        ? Math.round((row.completed_tasks / row.total_tasks) * 100)
        : 0,
  }));
};

const getProjectReport = async (projectId) => {
  const memberStatsQuery = `
        SELECT u.username, u.email, u.id as user_id,
            COUNT(t.id) as assigned_tasks,
            COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) as done_tasks,
            COUNT(
                CASE 
                    WHEN t.status != 'DONE' 
                    AND t.due_date IS NOT NULL 
                    AND t.due_date < NOW() 
                    THEN 1 
                END
            ) as overdue_tasks
        FROM users u
        JOIN project_members pm ON u.id = pm.user_id
        LEFT JOIN tasks t ON u.id = t.assignee_id AND t.project_id = $1
        WHERE pm.project_id = $1
        GROUP BY u.id, u.username, u.email
    `;

  const { rows } = await db.query(memberStatsQuery, [projectId]);

  return {
    members: rows,
  };
};

module.exports = {
  create,
  findProjectsByUserId,
  findById,
  update,
  deleteById,
  addMember,
  getMembersByProjectId,
  removeMember,
  findAll,
  getProjectReport,
};
