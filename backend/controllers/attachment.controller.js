const db = require("../config/db");
const cloudinary = require("cloudinary").v2;

// Upload
const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Chưa chọn file" });

    const { taskId, projectId } = req.body;
    const filePath = req.file.path;

    // --- SỬA LỖI FONT TIẾNG VIỆT TẠI ĐÂY ---
    // Chuyển đổi tên file từ Latin1 sang UTF-8 để không bị lỗi font
    const originalName = Buffer.from(req.file.originalname, "latin1").toString(
      "utf8"
    );
    // ----------------------------------------

    const query = `
            INSERT INTO attachments (file_name, file_path, file_type, task_id, project_id, uploaded_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

    // Dùng biến 'originalName' vừa sửa thay cho 'req.file.originalname'
    const values = [
      originalName,
      filePath,
      req.file.mimetype,
      taskId || null,
      projectId || null,
      req.user.id,
    ];

    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi upload" });
  }
};

// Get List
const getAttachments = async (req, res) => {
  try {
    const { taskId, projectId } = req.query;
    let query = `SELECT * FROM attachments WHERE `;
    let params = [];

    if (taskId) {
      query += `task_id = $1`;
      params.push(taskId);
    } else if (projectId) {
      query += `project_id = $1`;
      params.push(projectId);
    } else {
      return res.status(400).json({ message: "Thiếu ID" });
    }

    query += ` ORDER BY created_at DESC`;
    const { rows } = await db.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete
const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const fileQuery = await db.query(
      "SELECT * FROM attachments WHERE id = $1",
      [id]
    );
    if (fileQuery.rows.length === 0)
      return res.status(404).json({ message: "File không tồn tại trong DB" });

    const file = fileQuery.rows[0];

    // Xóa trên Cloudinary
    try {
      const folderName = "project_manager_app";

      const urlParts = file.file_path.split("/");
      let fullFileName = urlParts[urlParts.length - 1];

      // --- FIX LỖI QUAN TRỌNG: GIẢI MÃ URL ---
      // Biến "%20" thành dấu cách " "
      fullFileName = decodeURIComponent(fullFileName);
      // ---------------------------------------

      // Tách tên và đuôi
      // Lưu ý: Một số file có nhiều dấu chấm (vd: my.file.docx), nên ta phải cẩn thận
      const lastDotIndex = fullFileName.lastIndexOf(".");
      const fileNameWithoutExt =
        lastDotIndex !== -1
          ? fullFileName.substring(0, lastDotIndex)
          : fullFileName;

      let publicId = "";
      let resourceType = "";

      if (
        file.file_type.startsWith("image/") ||
        file.file_type.startsWith("video/")
      ) {
        // Ảnh/Video: ID là "folder/ten-khong-duoi"
        publicId = `${folderName}/${fileNameWithoutExt}`;
        resourceType = file.file_type.startsWith("image/") ? "image" : "video";
      } else {
        // File Raw: ID là "folder/ten-co-duoi.docx"
        publicId = `${folderName}/${fullFileName}`;
        resourceType = "raw";
      }

      console.log(
        `[CLOUDINARY DELETE] ID: ${publicId} | Type: ${resourceType}`
      );

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      console.log("[CLOUDINARY RESULT]", result);
    } catch (cloudError) {
      console.error("Lỗi xóa file trên Cloud:", cloudError);
    }

    // Xóa DB
    await db.query("DELETE FROM attachments WHERE id = $1", [id]);

    res.status(200).json({ message: "Đã xóa file thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadFile, getAttachments, deleteAttachment };
