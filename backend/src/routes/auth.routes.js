const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/auth.middleware");

const {
    register,
    login,
    forgotPassword,
    resetPasswordWithCode,
    getAllAuths,
    findAuthById,
    updateAuth,
    deleteAuth,
    changePassword,
} = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordWithCode);
router.patch("/change-password", authenticateUser, changePassword);

router.get("/", getAllAuths);
router.get("/:id", findAuthById);
router.put("/:id", updateAuth);
router.delete("/:id", deleteAuth);

module.exports = router;
