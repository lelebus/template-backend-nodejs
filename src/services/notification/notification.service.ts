import { Sequelize } from "sequelize";
import db from "../../data-access";
import { NotificationAttributes } from "../../data-access/models/NotificationModel";
import { NotFoundError } from "../../utils/errors";

export default class Notification implements NotificationAttributes {
  id: string;
  user: string;
  type: string;
  data: JSON;
  read: boolean;
}

function getById(id: string): Promise<Notification> {
  return db.Notification.findByPk(id).then((notification) => {
    if (!notification) {
      throw new NotFoundError("This notification does not exist");
    }

    return mapFromDb(notification.dataValues);
  });
}

function getByUserId(
  userId: string,
  offset: number = 0,
  limit: number = 10
): Promise<Notification> {
  return db.Notification.findAll({
    where: { user: userId },
    offset,
    limit,
    order: [["id", "DESC"]],
  }).then((notifications) => {
    return notifications.map((notification) =>
      mapFromDb(notification.dataValues)
    );
  });
}

async function toggleReadStatus(id: string) {
  await db.Notification.update(
    { read: Sequelize.literal("NOT read") },
    {
      where: {
        id,
      },
    }
  );

  return true;
}

function mapFromDb(notification) {
  return {
    ...notification,
    ...notification.data,
    createdOn: notification.created_on,
  };
}

export { getById, getByUserId, toggleReadStatus };
