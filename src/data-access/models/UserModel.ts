import { DataTypes, Model } from "sequelize";
import { ulid } from "ulid";
import { genSaltSync, hashSync, compare } from "bcryptjs";

export interface Profile {
  firstName: string;
  lastName: string;
  gender: string;
  imageUrl: string;
}

export interface UserAttributes {
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

export default function (connection: any) {
  class User extends Model<UserAttributes> implements UserAttributes {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    id!: string;
    role: string;
    locale!: string;
    email!: string;
    password!: string;
    resetCount!: number;
    resetToken: string;
    resetTokenExpiration: Date;

    // data & details
    profile: Profile;
    profilePicture: string;

    // metadata
    metadata!: JSON;
    created_on!: Date;
    last_update!: Date;
    deleted_on: Date;

    // methods
    validPassword(password: string): Promise<boolean> {
      return compare(password, this.password);
    }

    // associations can be defined here
    static associate(models: any) {
      // define association here
    }
  }

  const idPrefix = `u_`;
  User.init(
    {
      id: {
        type: DataTypes.STRING(26 + idPrefix.length),
        defaultValue: function () {
          return idPrefix + ulid().toLowerCase();
        },
        allowNull: false,
        primaryKey: true,
      },
      role: {
        type: DataTypes.ENUM("ADMIN"),
        allowNull: true,
      },
      locale: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
        set(value: string) {
          this.setDataValue("email", value.replace(/\s+/g, "").toLowerCase());
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        // validate: {
        //   isEmail: true,
        // },
        set(value: string) {
          const hashed = hashSync(value, genSaltSync(10));
          this.setDataValue("password", hashed);
        },
      },
      resetCount: {
        type: DataTypes.INTEGER,
        field: "reset_count",
        defaultValue: 0,
      },
      resetToken: {
        type: DataTypes.STRING,
        field: "reset_token",
      },
      resetTokenExpiration: {
        type: DataTypes.DATE,
        field: "reset_token_expiration",
      },

      // data & details
      profile: {
        type: DataTypes.JSON,
        get() {
          let profile = this.getDataValue('profile')
          profile.imageUrl = this.profilePicture
          return profile
        },
      },
      profilePicture: {
        type: DataTypes.STRING,
        field: "image_url",
        allowNull: true,
      },

      // metadata
      metadata: {
        type: DataTypes.VIRTUAL,
        get() {
          return {
            createdOn: this.created_on,
            lastUpdatedOn: this.last_update,
            deletedOn: this.deleted_on,
          };
        },
      },
    },
    {
      modelName: "user",
      paranoid: true,
      createdAt: "created_on",
      updatedAt: "last_update",
      deletedAt: "deleted_on",
      sequelize: connection,
    }
  );

  return User;
}
