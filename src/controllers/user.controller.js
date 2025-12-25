import { asyncHandler } from "../utils/AsyncHandler.js";

export const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({message: "User registered successfully"})
})