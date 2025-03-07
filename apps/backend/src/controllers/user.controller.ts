import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import { IUser, userCreateSchema, userLoginSchema } from "../types/user.types";
import ApiError from "../utils/ApiError";
import User from "../models/user.models";

const generateAccessToken = async (user: IUser) => {
  const accessToken = await user.generateAccessTokenMethod();
  return accessToken;
};
const userCreate = asyncHandler(async (req: Request, res: Response) => {
  const userData = userCreateSchema.safeParse(req.body);
  if (!userData.success) {
    res.send(new ApiError(400, "Credentails are wrong", userData.data));
    return;
  }
  const userExisted = await User.find({
    username: userData?.data.username,
  });

  if (userExisted.length) {
    const resData = new ApiError(
      400,
      "Error the user with this username already existed"
    );
    res.status(400).send(resData);
    return;
  }
  const user = await User.create({
    username: userData?.data.username,
    password: userData?.data.password,
    email: userData?.data.email,
  });
  res.send(new ApiResponse(200, user, "Successfully craeted the account"));
});
const userLogin = asyncHandler(async (req: Request, res: Response) => {
  const userData = userLoginSchema.safeParse(req.body);
  if (!userData.success) {
    res.send(new ApiError(400, "Credentails are wrong", userData.data));
    return;
  }
  const userExisted = await User.findOne({
    username: userData?.data.username,
  });
  if (!userExisted) {
    res
      .status(400)
      .send(
        new ApiError(400, "Error the user with this username doesn't existed")
      );
    return;
  }
  const passwordComp = await userExisted.comparePassword(
    userData?.data.password
  );

  if (!passwordComp) {
    res.send(new ApiError(400, "Credentails are wrong"));
    return;
  }
  const accessToken = await generateAccessToken(userExisted);
  userExisted.password = "";

  res
    .cookie("accessToken", accessToken, {
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      secure: true, // Ensures it's only sent over HTTPS
    })
    .send(
      new ApiResponse(200, { accessToken, userExisted }, "Successfully login")
    );
});
const userProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id;
  if (!userId) {
    res.status(400).send(new ApiError(400, "User Profie unsuccessfull"));
  }
  const user = await User.findById(userId).select("-password");
  if (!user) {
    res.status(400).send(new ApiError(400, "User Profie unsuccessfull"));
  }
  res
    .status(200)
    .send(new ApiResponse(200, user, "User Profile Successfully retrevied"));
});
const userLogout = asyncHandler(async (req: Request, res: Response) => {
  res
    .clearCookie("accessToken")
    .status(200)
    .send(new ApiResponse(200, "Successfully Logout"));
});

export { userCreate, userLogin, userLogout, userProfile };
