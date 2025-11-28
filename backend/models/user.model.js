const db = require("../config/db");
/**
 * Tạo một user mới
 */
const create = async (username, email, password_hash, role = "MEMBER") => {
  const queryText = `
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, role, created_at
    `;
  // RETURNING để trả về thông tin user vừa tạo

  const values = [username, email, password_hash, role];

  try {
    const { rows } = await db.query(queryText, values);
    return rows[0];
  } catch (error) {
    console.error("Lỗi khi tạo user:", error);
    throw error;
  }
};

/**
 * Tìm user bằng email (dùng cho đăng nhập)
 */
const findByEmail = async (email) => {
  const queryText = "SELECT * FROM users WHERE email = $1";

  try {
    const { rows } = await db.query(queryText, [email]);
    return rows[0]; // Trả về user (hoặc undefined nếu không tìm thấy)
  } catch (error) {
    console.error("Lỗi khi tìm user bằng email:", error);
    throw error;
  }
};

/**
 * Tìm user bằng ID
 */
const findById = async (id) => {
  const queryText = "SELECT id, username, email, role FROM users WHERE id = $1";
  try {
    const { rows } = await db.query(queryText, [id]);
    return rows[0];
  } catch (error) {
    console.error("Lỗi khi tìm user bằng ID:", error);
    throw error;
  }
};

const findAll = async (
  keyword = "",
  limit = 10,
  offset = 0,
  roleFilter = ""
) => {
  const searchTerm = `%${keyword}%`;
  const roleCondition = roleFilter ? `AND role = '${roleFilter}'` : "";

  const dataQuery = `
        SELECT id, username, email, role, created_at 
        FROM users 
        WHERE (username ILIKE $1 OR email ILIKE $1)
        ${roleCondition}
        ORDER BY id ASC
        LIMIT $2 OFFSET $3
    `;

  const countQuery = `
        SELECT COUNT(*) 
        FROM users 
        WHERE (username ILIKE $1 OR email ILIKE $1)
        ${roleCondition}
    `;

  try {
    const [dataRes, countRes] = await Promise.all([
      db.query(dataQuery, [searchTerm, limit, offset]),
      db.query(countQuery, [searchTerm]),
    ]);

    return {
      users: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật thông tin user
 */
const update = async (userId, userData) => {
  // userData: { username, role, password_hash (optional) }
  const fields = Object.keys(userData);
  const values = Object.values(userData);

  if (fields.length === 0) return null;

  const setString = fields
    .map((field, index) => `"${field}" = $${index + 2}`)
    .join(", ");

  const queryText = `
        UPDATE users
        SET ${setString}
        WHERE id = $1
        RETURNING id, username, email, role
    `;

  try {
    const { rows } = await db.query(queryText, [userId, ...values]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};

const deleteById = async (userId) => {
  const queryText = "DELETE FROM users WHERE id = $1 RETURNING id";
  const { rows } = await db.query(queryText, [userId]);
  return rows[0];
};

module.exports = {
  create,
  findByEmail,
  findById,
  findAll,
  update,
  deleteById,
};
