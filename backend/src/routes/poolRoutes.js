const router = require("express").Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const { getPool } = require("../controllers/poolController");

router.use(authMiddleware);
router.get("/:id", getPool);

module.exports = router;
