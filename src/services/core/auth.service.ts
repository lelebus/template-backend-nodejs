import { accessTokenSecret, refreshTokenSecret } from "../../config";

import db from "../../data-access";
import Sequelize from "sequelize";
import { sign } from "jsonwebtoken";
import { NotFoundError } from "../../utils/errors";

import User, { getById } from "./user.service";
import {
  notifyPasswordResetToken,
  notifyEmailResetToken,
} from "../notification/notification.email.service";
import { generateRandomNumericToken } from "./helper.service";

async function login(email: string, password: string): Promise<User | null> {
  return await db.User.findOne({
    where: { email: email.replace(/\s+/g, "").toLowerCase() },
  }).then(async (user) => {
    if (!user || (await user.validPassword(password)) === false) {
      return null;
    }

    return user;
  });
}

async function sendUserPasswordResetToken(email: string): Promise<boolean> {
  const formattedEmail = email.replace(/\s+/g, "").toLowerCase();
  const user = await db.User.findOne({
    where: { email: formattedEmail },
  });
  if (!user) {
    return true;
  }

  const now = new Date();
  user.resetTokenExpiration = new Date(now.setMinutes(now.getMinutes() + 10));
  user.resetToken = generateRandomNumericToken(6);
  await user.save();

  notifyPasswordResetToken(
    user.email,
    `${user.profile.firstName} ${user.profile.lastName}`,
    user.resetToken
  );

  return true;
}

async function sendUserEmailChangeToken(email: string): Promise<boolean> {
  const formattedEmail = email.replace(/\s+/g, "").toLowerCase();
  const user = await db.User.findOne({
    where: { email: formattedEmail },
  });
  if (!user) {
    throw new NotFoundError("This user does not exist");
  }

  const now = new Date();
  user.resetTokenExpiration = new Date(now.setMinutes(now.getMinutes() + 10));
  user.resetToken = generateRandomNumericToken(6);
  await user.save();

  notifyEmailResetToken(
    user.email,
    `${user.profile.firstName} ${user.profile.lastName}`,
    user.resetToken
  );

  return true;
}

async function verifyResetToken(id: string, token: string): Promise<boolean> {
  const user = await db.User.findOne({
    where: { id },
  });
  if (
    !user ||
    user.resetToken != token ||
    new Date().getTime() >
      new Date(user.resetTokenExpiration).getTime() + 60000 * 10
  ) {
    return false;
  }

  return true;
}

async function setPassword(
  userId: string,
  password: string
): Promise<User | null> {
  const user = await await db.User.findByPk(userId);
  if (!user) {
    return null;
  }

  user.password = password;
  user.resetToken = null;
  user.resetTokenExpiration = null;
  user.resetCount = user.resetCount + 1;
  await user.save();

  return user;
}

async function setEmail(userId: string, email: string): Promise<User | null> {
  const user = await db.User.findByPk(userId);

  user.email = email.replace(/\s+/g, "").toLowerCase();
  user.resetToken = null;
  user.resetTokenExpiration = null;
  user.resetCount = user.resetCount + 1;
  await user.save();

  return user;
}

function createCookieTokens(user: User) {
  const accessToken = sign(
    {
      userId: user.id,
      userRole: user.role,
    },
    accessTokenSecret,
    { expiresIn: "15min" }
  );
  const refreshToken = sign(
    {
      userId: user.id,
      userRole: user.role,
      count: user.resetCount,
    },
    refreshTokenSecret,
    { expiresIn: "90d" }
  );
  return { accessToken, refreshToken };
}

export {
  login,
  createCookieTokens,
  sendUserPasswordResetToken,
  sendUserEmailChangeToken,
  verifyResetToken,
  setPassword,
  setEmail,
};
