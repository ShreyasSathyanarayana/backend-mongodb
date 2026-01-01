import { User } from "../models/user.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";

const protectedRoute = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ?? req.headers.authorization?.split(" ")?.[1];

  if (!accessToken) {
    throw new ApiErrors(401, "You are not authenticated");
  }

  try {
    const decoded = await jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decoded?._id)
      .select("-password -refreshToken");

    if (!user) {
      throw new ApiErrors(401, "User not found");
    }

    console.log(JSON.stringify(decoded, null, 2));

    req.user = user;
    next();
  } catch (err) {
    throw new ApiErrors(401, "Invalid token");
  }
});

export { protectedRoute };
