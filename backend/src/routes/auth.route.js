import { Router } from "express";
import {
  loginBusiness,
  registerBusiness,
  logoutbusiness,
  refreshAccessToken,
} from "../controllers/auth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerBusiness);
router.route("/login").post(loginBusiness);
router.route("/logout").post(verifyJwt, logoutbusiness);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
