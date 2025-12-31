import { Router } from "express";
import {
  loginUser,
  logOutUser,
  refreshToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.post("/login", loginUser);
router.post("/logout", protectedRoute, logOutUser);
router.post('/refresh-token', refreshToken)

export default router;
