import dotenv from "dotenv";
dotenv.config();

export const jest = {
  jestWorkerId: process.env.JEST_WORKER_ID,
};

export const environment = process.env.NODE_ENV || "production";
export const log_level = process.env.LOG_LEVEL || "info";

export const graphql = {
  port: process.env.GRAPHQL_PORT || 4000,
  path: process.env.GRAPHQL_PATH || "/graphql",
  subscriptionTriggerNames: {
    NEW_NOTIFICATION: "NEW_NOTIFICATION",
  },
};

export const api = {
  port: process.env.API_PORT || 4001,
};

export const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
export const accessTokenBody = {
  httpOnly: false,
  sameSite: "none",
  secure: true,
  maxAge: 900000, // 15 minutes
};

export const renewRefreshTokens = true;
export const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
export const refreshTokenBody = {
  httpOnly: true,
  sameSite: "none",
  secure: true,
  maxAge: 15 * 86400000, // 15 days
};

export const database = {
  url: process.env.DB_URL,
  name: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
};

export const fallbackLocale = "IT";

export const sendgrid = {
  api_key: process.env.SENDGRID_API_KEY || "SG.undefined",
  verified_sender: {
    name: "Boilerplate",
    email: "info@example.com",
  },

  administrators: [
    {
      name: "Gabriele De Candido",
      email: "gabrieledecandido@flashbeing.com",
    },
    {
      name: "Alessio Crea",
      email: "alessiocrea@flashbeing.com",
    },
  ],

  templates: {
    SEND_PASSWORD_RESET_TOKEN: "d-undefined",
    SEND_EMAIL_CHANGE_TOKEN: "d-undefined",
  },
};

export const stripe = {
  secret_key: process.env.STRIPE_SECRET_KEY,
  webhook_secrets: {
    account: process.env.STRIPE_WHSEC_CHECKOUT_COMPLETED,
  },
};

export const aws_s3 = {
  accessKeyId: process.env.AWS_S3_ID,
  secretAccessKey: process.env.AWS_S3_SECRET,
  bucketName: process.env.AWS_S3_BUCKET_NAME || "undefined-bucket",
};

export const jitsi = {
  jitsiTokenPrivateKey: JSON.parse(`"${process.env.JITSI_TOKEN_PRIVATE_KEY}"`),
  jitsiAppId: process.env.JITSI_APP_ID,
  jitsiKid: process.env.JITSI_KID,
};
