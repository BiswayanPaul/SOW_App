import ApiError from "./ApiError.js";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";

const generateAccessAndRefreshToken = async (email) => {
  try {
    const business = await prisma.business.findUnique({
      where: { email },
    });

    if (!business) {
      throw new ApiError(404, "Business not found");
    }

    const accessToken = jwt.sign(
      {
        businessId: business.id,
        email: business.email,
        businessName: business.name,
      },
      process.env.ACCESS_TOKEN_SECRET || "default",
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" }
    );

    const refreshToken = jwt.sign(
      {
        businessId: business.id,
      },
      process.env.REFRESH_TOKEN_SECRET || "default",
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Could not generate tokens");
  }
};

export default generateAccessAndRefreshToken;
