import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs, { watch } from "fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
  const localAvatarPath = req.files?.avatar?.[0]?.path;
  const localCoverImagePath = req.files?.coverImage?.[0]?.path;

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    // if any field is empty
    fs.unlinkSync(localAvatarPath);
    fs.unlinkSync(localCoverImagePath);
    throw new ApiErrors(400, "Please fill all the fields");
  }

  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    // if user is already exist
    fs.unlinkSync(localAvatarPath);
    fs.unlinkSync(localCoverImagePath);
    throw new ApiErrors(409, "User already exists");
  }

  console.log("localAvatar : ", JSON.stringify(req.files?.avatar, null, 3));

  if (!localAvatarPath) {
    // if avatar is not provided
    fs.unlinkSync(localAvatarPath);
    fs.unlinkSync(localCoverImagePath);
    throw new ApiErrors(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(localAvatarPath);
  const coverImage = await uploadOnCloudinary(localCoverImagePath);

  if (!avatar || !coverImage) {
    throw new ApiErrors(500, "Something went wrong while uploading files");
  }

  const user = await User.create({
    username: username?.trim(),
    email: email?.trim(),
    fullName: fullName?.trim(),
    password,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiErrors(500, "User not created");
  }

  // send response
  return res
    .status(201)
    .json(new ApiResponse(200, "User created successfully", createdUser));
});

const generateToken = async (id) => {
  // get the user credentials
  // generate accessToken and refreshToken
  // save refreshToken in database
  // return accessToken and refreshToken

  try {
    if (!id) {
      throw new ApiErrors(500, "User id is required");
    }
    const user = await User.findById(id).findOne();
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiErrors(
      500,
      `Something went wrong while generating token : ${error.message}`
    );
  }
};

export const loginUser = asyncHandler(async (req, res) => {
  // gather the request body
  // validate input : email or username, password
  // check weather user is exist with email
  // check weather password is correct
  // generate refreshToken and accessToken
  // send response

  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiErrors(400, "Email or username is required");
  }

  const user = await User.findOne({ $or: [{ email }, { username }] }).select(
    " -refreshToken"
  );

  if (!user) {
    throw new ApiErrors(404, "User not found");
  }

  const isPasswordCorrect = await user.isCorrectPassword(password);

  if (!isPasswordCorrect) {
    throw new ApiErrors(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateToken(user._id);

  const options = { httpOnly: true, secure: true, sameSite: "none" };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, "Login successful", {
        accessToken,
        refreshToken,
      })
    );
});

export const logOutUser = asyncHandler(async (req, res) => {
  // remove cookie
  // remove refresh token in database
  // send response

  const options = { httpOnly: true, secure: true, sameSite: "none" };

  const { _id } = req.user;

  const user = await User.findById(_id).findOne();

  user.refreshToken = null;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "Logout successful"));
});

export const refreshToken = asyncHandler(async (req, res) => {
  // gather refreshToken from cookie or header
  // validate refreshToken using jwt
  // compare refreshToken with database refreshToken
  // if match then generate accessToken and send response
  // if not match then send response

  const incomingRefreshToken =
    req.cookies?.refreshToken ?? req.headers.authorization?.split(" ")?.[1];

  if (!incomingRefreshToken) {
    throw new ApiErrors(401, "refresh token is required");
  }

  try {
    const decoded = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded?._id).findOne();

    if (!user) {
      throw new ApiErrors(401, "User not found");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiErrors(401, "Refresh token is invalid");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateToken(
      user._id
    );

    const options = { httpOnly: true, secure: true, sameSite: "none" };

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(200, "Refresh token is valid", {
          accessToken,
          refreshToken: newRefreshToken,
        })
      );
  } catch (error) {
    throw new ApiErrors(401, "Invalid refresh token");
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  // gather current password and new password from request body
  // validate current password with database password
  // if not match then throw error
  // update password
  // send response

  const { currentPassword, newPassword } = req.body;
  const { _id } = req.user;

  if (!currentPassword || !newPassword) {
    throw new ApiErrors(400, "Current password and new password is required");
  }

  if (currentPassword === newPassword) {
    throw new ApiErrors(400, "Current password and new password is same");
  }

  const user = await User.findById(_id).findOne();
  const isPasswordCorrect = await user.isCorrectPassword(currentPassword);
  if (!isPasswordCorrect) {
    throw new ApiErrors(400, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, "User found", req.user));
});

export const updateUserDetails = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { fullName, email } = req.body;

  if (!(fullName && email)) {
    throw new ApiErrors(400, "Please fill all the fields");
  }

  const user = await User.findByIdAndUpdate(
    _id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, "User details updated successfully", user));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiErrors(400, "Username is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.trim()?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        subscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiErrors(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, "User found", channel[0]));
});

export const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req?.user?._id?.toString()),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
    {
      $project: {
        watchHistory: 1,
        username: 1,
        fullName:1,
        avatar:1,
        coverImage:1,
        createdAt:1,
        updatedAt:1
      },
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "User watch history found", user[0]));
});
