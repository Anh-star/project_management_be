const db = require("../config/db");

const create = async (data) => {
  const { user_id, title, message, type } = data;
  const query = `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
  try {
    const { rows } = await db.query(query, [user_id, title, message, type]);
    return rows[0];
  } catch (error) {
    console.error("Lỗi tạo noti:", error);
  }
};

const getByUserId = async (userId) => {
  // Lấy 20 thông báo mới nhất
  const query = `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`;
  const { rows } = await db.query(query, [userId]);
  return rows;
};

const markAsRead = async (id) => {
  await db.query(`UPDATE notifications SET is_read = TRUE WHERE id = $1`, [id]);
};

const markAllAsRead = async (userId) => {
  await db.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [
    userId,
  ]);
};

// Hàm check task quá hạn để tạo thông báo (Chạy ngầm)
const checkOverdueTasks = async () => {
  // Tìm task chưa xong, đã quá hạn, và CHƯA được báo
  const findQuery = `
        SELECT * FROM tasks 
        WHERE status != 'DONE' 
        AND due_date < NOW() 
        AND is_overdue_notified = FALSE
        AND assignee_id IS NOT NULL
    `;
  const { rows } = await db.query(findQuery);

  for (const task of rows) {
    // 1. Tạo thông báo
    await create({
      user_id: task.assignee_id,
      title: "Công việc quá hạn ⏰",
      message: `Công việc "${task.title}" đã quá hạn! Vui lòng kiểm tra.`,
      type: "OVERDUE",
    });

    // 2. Đánh dấu là đã báo (để không spam)
    await db.query(
      `UPDATE tasks SET is_overdue_notified = TRUE WHERE id = $1`,
      [task.id]
    );
  }
};

const deleteOldNotifications = async () => {
  try {
    const query = `
            DELETE FROM notifications 
            WHERE created_at < NOW() - INTERVAL '30 days'
        `;
    const { rowCount } = await db.query(query);
    if (rowCount > 0) {
      console.log(`[CLEANUP] Đã xóa ${rowCount} thông báo cũ.`);
    }
  } catch (error) {
    console.error("Lỗi dọn dẹp thông báo:", error);
  }
};

const deleteById = async (id) => {
  await db.query(`DELETE FROM notifications WHERE id = $1`, [id]);
};

module.exports = {
  create,
  getByUserId,
  markAsRead,
  markAllAsRead,
  checkOverdueTasks,
  deleteOldNotifications,
  deleteById,
};
