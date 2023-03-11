import {
  accessTokenBody,
  accessTokenSecret,
  refreshTokenBody,
  refreshTokenSecret,
  renewRefreshTokens,
} from "../../config";

import { verify } from "jsonwebtoken";

import { createCookieTokens } from "../../services/core/auth.service";
import db from "../../data-access";

export default async (req, res, next) => {
  const accessToken = req.cookies["access-token"];
  const refreshToken = req.cookies["refresh-token"];

  if (!refreshToken && !accessToken) {
    return next();
  }

  let data;

  try {
    data = verify(accessToken, accessTokenSecret);
    req.userId = data.userId;
    req.userType = data.userType;
    return next();
  } catch {
    // accessToken is not valid
  }

  if (!refreshToken) {
    return next();
  }

  try {
    data = verify(refreshToken, refreshTokenSecret);
  } catch {
    // refreshToken is also not valid
    return next();
  }

  let user = await db.User.findOne({
    where: { id: data.userId },
  });
  if (user == null) {
    return next();
  }

  if (user.resetCount != data.count) {
    // password has been changed
    return next();
  }

  // refreshToken valid
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    createCookieTokens(user);
  res.cookie("access-token", newAccessToken, accessTokenBody);

  if (renewRefreshTokens) {
    res.cookie("refresh-token", newRefreshToken, refreshTokenBody);
  }

  req.userId = user.id;
  req.userType = user.type;
  next();
};
