const router = require("express").Router();
const { authMiddleware, requireRole } = require("../middlewares/authMiddleware");
const {
  getMe,
  setOnline,
  relevantRequests,
  history
} = require("../controllers/driverController");

router.use(authMiddleware, requireRole("DRIVER"));
router.get("/me", getMe);
router.patch("/online", setOnline);
router.get("/requests", relevantRequests);
router.get("/history", history);

module.exports = router;
