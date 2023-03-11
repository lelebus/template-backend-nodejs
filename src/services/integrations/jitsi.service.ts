import { jitsi } from "../../config";

import { sign } from "jsonwebtoken";

/**
 * @param {Date} startingDateTime - when the room will start
 * @param {Date} endingDateTime - when the room will start
 * @param {Object} userFromDB - user obj from db
 * @param {string} user.id
 * @param {string} user.name
 * @param {string} user.email
 * @param {string} user.avatar - public url profile img
 * @param {boolean} [user.moderator]
 * @param {string} contentId - id of content identifying room
 */
export function getRoomToken(
  startingDateTime: Date,
  endingDateTime: Date,
  userFromDB: Object,
  contentId: string
): string {
  const { jitsiTokenPrivateKey, jitsiAppId, jitsiKid } = jitsi;

  const user = getJitsiUserFromUserFromDB(userFromDB);
  const roomName = contentId.toLocaleLowerCase().replace("_", "");

  const roomSettings = {
    aud: "jitsi",
    iss: "chat",
    context: {
      user,
    },
    // iat: 1662650356,
    exp: getUnixTime(endingDateTime),
    nbf: getUnixTime(startingDateTime),
    room: roomName,
    sub: jitsiAppId,
  };
  const signedRoom = sign(roomSettings, jitsiTokenPrivateKey, {
    header: {
      alg: "RS256",
      kid: jitsiKid,
      typ: "JWT",
    },
  });

  return signedRoom;
}

const getJitsiUserFromUserFromDB = (item) => {
  return {
    id: item.id,
    email: item.email,
    name: item.profile.publicIdentity.name,
    avatar: item.profile.publicIdentity.imageUrl,
    moderator: item.type === "PROFESSIONAL",
  };
};

const getUnixTime = (date) => {
  const dateCopy = new Date(date.getTime());

  return Math.round(dateCopy.getTime() / 1000);
};
