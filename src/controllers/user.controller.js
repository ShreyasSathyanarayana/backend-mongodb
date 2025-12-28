import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const registerUser = asyncHandler(async (req, res) => {
  // gather the request body
  // validate input
  // check weather user is already exist with email and username
  // check weather avatar exist
  // upload avatar and cover image on cloudinary
  // check weather avatar and cover image got uploaded
  // create user
  // check weather user is created
  // send response

  const { username, email, fullName, password } = req.body;

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiErrors(400, "Please fill all the fields");
  }

  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    throw new ApiErrors(409, "User already exists");
  }

  const localAvatarPath = req.files?.avatar[0]?.path;
  const localCoverImagePath = req.files?.coverImage[0]?.path;
  console.log("localAvatar : ", JSON.stringify(req.files?.avatar, null, 3));

  if (!localAvatarPath){
    throw new ApiErrors(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(localAvatarPath);
  const coverImage = await uploadOnCloudinary(localCoverImagePath);

  if (!avatar || !coverImage) {
    throw new ApiErrors(500, "Something went wrong while uploading files");
  }

  const user = await User.create({
    username:username?.trim(),
    email:email?.trim(),
    fullName:fullName?.trim(),
    password,
    avatar:avatar?.url,
    coverImage:coverImage?.url || "",
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiErrors(500, "User not created");
  }

  // send response
  res.status(201).json(new ApiResponse(200,"User created successfully", createdUser));
});
