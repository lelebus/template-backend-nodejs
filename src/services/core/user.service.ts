import db from "../../data-access";

import { UserAttributes, Profile } from "../../data-access/models/UserModel";
import {
  NotFoundError,
} from "../../utils/errors";

export default class User implements UserAttributes {
  id: string;
  role: string;
  locale: string;
  email: string;
  password: string;
  resetCount: number;
  resetToken: string;
  resetTokenExpiration: Date;

  // data & details
  profile: Profile;
  profilePicture: string;

  // metadata
  metadata: JSON;
}

function getById(id: string): Promise<User> {
  return db.User.findByPk(id).then((user) => {
    if (!user) {
      throw new NotFoundError("This user does not exist");
    }

    return user
  });
}

function getByEmail(email: string): Promise<User> {
  const formattedEmail = email.replace(/\s+/g, "").toLowerCase();
  return db.User.findOne({ where: { email: formattedEmail } }).then((user) => {
    if (!user) {
      throw new NotFoundError("This user does not exist");
    }

    return {
      ...user.dataValues,
      profile: mapProfileWithProfilePicture(
        user.profile,
        user.publicProfilePicture
      ),
    };
  });
}

function emailExists(email: string): Promise<boolean> {
  return db.User.findOne({ where: { email } }).then((user) => {
    return !!user;
  });
}

function mapProfileWithProfilePicture(profile, publicProfilePicture) {
  return {
    ...profile,
    publicIdentity: {
      ...profile.publicIdentity,
      imageUrl: publicProfilePicture,
    },
  };
}

export {
  getById,
  getByEmail,
  emailExists,
};
