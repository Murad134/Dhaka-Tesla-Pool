const router = require("express").Router();
const { authMiddleware, requireRole } = require("../middlewares/authMiddleware");
const { rideOwnershipMiddleware } = require("../middlewares/ownershipMiddleware");
const {
  createRide,
  listHistory,
  getById,
  matchRide,
  transition
} = require("../controllers/rideController");

router.use(authMiddleware);
router.post("/", requireRole("PASSENGER"), createRide);
router.get("/history", requireRole("PASSENGER"), listHistory);
router.post("/:id/match", requireRole("DRIVER"), matchRide);
router.get("/:id", rideOwnershipMiddleware, getById);
router.patch("/:id/status", rideOwnershipMiddleware, transition);

module.exports = router;