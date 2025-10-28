import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../db/prisma.js";
import jwt from "jsonwebtoken";
import generateAccessAndRefreshToken from "../utils/AccessAndRefreshTokenGenerate.js";
import bcrypt from "bcrypt";
// REGISTER

export const registerBusiness = asyncHandler(async (req, res) => {
  const {
    businessName,
    address,
    postalNumber,
    city,
    email,
    phoneNumber,
    password,
  } = req.body;

  if (
    [
      businessName,
      address,
      postalNumber,
      city,
      email,
      phoneNumber,
      password,
    ].some((field) => !field || field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  try {
    const existingBusinessWithEmail = await prisma.business.findUnique({
      where: { email },
    });

    const existingBusinessWithName = await prisma.business.findFirst({
      where: { businessName: businessName },
    });
    if (existingBusinessWithEmail || existingBusinessWithName) {
      throw new ApiError(
        400,
        "Business with this email or name already exists"
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newBusiness = await prisma.business.create({
      data: {
        businessName,
        address,
        postalNumber,
        city,
        email,
        phoneNumber,
        password: hashedPassword,
      },
    });

    const createdBusiness = await prisma.business.findUnique({
      where: { id: newBusiness.id },
      select: {
        id: true,
        businessName: true,
        address: true,
        postalNumber: true,
        city: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createdBusiness,
          "Business registered successfully"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Server Error");
  }
});

// LOGIN

export const loginBusiness = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  try {
    const business = await prisma.business.findUnique({
      where: { email },
    });
    if (!business) {
      throw new ApiError(404, "Business not found");
    }
    const isPasswordValid = await bcrypt.compare(password, business.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(email);

    await prisma.business.update({
      where: { id: business.id },
      data: { refreshToken },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            business: { id: business.id, email: business.email },
            accessToken,
            refreshToken,
          },
          "Login successful"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Server Error");
  }
});

// LOGOUT

export const logoutbusiness = asyncHandler(async (req, res) => {
  const { id } = req.business;
  await prisma.business.update({
    where: { id },
    data: { refreshToken: null },
  });

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logout successful"));
});

// REFRESH TOKEN

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }
  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET || "default"
    );
    const business = await prisma.business.findUnique({
      where: { id: decoded.businessId },
    });
    if (!business || business.refreshToken !== incomingRefreshToken) {
      throw new ApiError(404, "Business not found");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      business.email
    );

    prisma.Business.update({
      where: { id: business.id },
      data: { refreshToken },
    });
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            business: { id: business.id, email: business.email },
            accessToken,
            refreshToken,
          },
          "Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Server Error");
  }
});
