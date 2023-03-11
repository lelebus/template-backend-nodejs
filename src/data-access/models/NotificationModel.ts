import { DataTypes, Model } from "sequelize";
import { ulid } from "ulid";

export interface NotificationAttributes {
  id: string;
  user: string;
  type: string;
  data: JSON;
  read: boolean;
}

export default function (connection: any) {
  class Notification
    extends Model<NotificationAttributes>
    implements NotificationAttributes
  {
    id!: string;
    user!: string;
    type!: string;
    data!: JSON;
    read: boolean;
  }

  const idPrefix = `ntf_`;
  Notification.init(
    {
      id: {
        type: DataTypes.STRING(26 + idPrefix.length),
        defaultValue: function () {
          return idPrefix + ulid().toLowerCase();
        },
        allowNull: false,
        primaryKey: true,
      },
      user: {
        type: DataTypes.STRING(26 + `u_`.length),
        field: "user",
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      modelName: "notification",
      createdAt: "created_on",
      updatedAt: "last_update",
      sequelize: connection,
    }
  );

  return Notification;
}
