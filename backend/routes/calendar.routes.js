const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendar.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

router.get("/", authenticateToken, calendarController.getCalendarTasks);

module.exports = router;
