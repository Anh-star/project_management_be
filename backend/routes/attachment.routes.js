const express = require("express");
const router = express.Router();
const attachmentController = require("../controllers/attachment.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

router.use(authenticateToken);

router.post("/", upload.single("file"), attachmentController.uploadFile);
router.get("/", attachmentController.getAttachments);
router.delete("/:id", attachmentController.deleteAttachment);

module.exports = router;
