import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getUserWatchHistory,
  loginUser,
  logOutUser,
  refreshToken,
  registerUser,
  updateUserDetails,
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
router.post("/refresh-token", refreshToken);
router.post("/change-password", protectedRoute, changeCurrentPassword);
router.get('/me',protectedRoute,getCurrentUser)
router.post('/update-details',protectedRoute,updateUserDetails)
router.get("/watch-history", protectedRoute, getUserWatchHistory);



router.get('/channel/:username',protectedRoute,getUserChannelProfile)


export default router;
