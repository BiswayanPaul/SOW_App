import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import prisma from "../db/prisma.js";

export const verifyJwt = async (req, resizeBy, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, "Access token missing");
    }
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || "default"
    );
    const business = await prisma.business.findUnique({
      where: { id: decoded.businessId },
    });
    if (!business) {
      throw new ApiError(404, "Business not found");
    }
    req.business = business;
    next();
  } catch (error) {
    throw new ApiError(401, "Unauthorized access");
  }
};
