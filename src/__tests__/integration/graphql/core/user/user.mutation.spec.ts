import { graphql, sendgrid } from "../../../../../config";

import db from "../../../../../data-access/DBConnection";
import { graphQLServer } from "../../../../../index";

import { getAccessTokenCookie } from "../../helpers";
import supertest from "supertest";
const url = `http://localhost:${graphql.port}`;
const endpoint = graphql.path;
const request = supertest(url);

// mocked database
import { cleanDb, insertUsers } from "../../../../db_setup";
import { DEFAULT_USER, getUsers } from "../../../../mocks/users";
const [defaultUser] = getUsers().filter((user) => {
  return user.id === DEFAULT_USER;
});

// mock services
import sgMail from "@sendgrid/mail";
const mockedSendGridSend = jest.spyOn(sgMail, "send").mockResolvedValue(null);

beforeEach(async () => {
  // clean database
  await cleanDb();

  // populate database
  await insertUsers();
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  // stop services
  await graphQLServer.stop();
  await db.stop();
});

const graphqlRequest = async (
  query: string,
  variables: object = {},
  accessTokenCookie: string = null
) => {
  const res = await request
    .post(endpoint)
    .send({
      query,
      variables,
    })
    .set("Accept", "application/json")
    .set("cookie", accessTokenCookie);

  return {
    errors: res.body.errors ? res.body.errors : null,
    data: res.body.data,
  };
};

describe("User mutation", () => {
  describe("login", () => {
    const queryServer = async (
      query: string,
      variables: object,
      accessTokenCookie: string
    ) => {
      const { errors, data } = await graphqlRequest(
        query,
        variables,
        accessTokenCookie
      );
      return { errors, data: data ? data.login : null };
    };

    it("should return 401 - invalid email", async () => {
      const query = `mutation($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        id
      }
    }`;
      const variables = {
        email: "non-existent@email.com",
        password: defaultUser.password,
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(data).toBeNull();
      expect(errors[0].extensions.code).toBe("401");
    });

    it("should return 401 - wrong password", async () => {
      const query = `mutation($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        id
      }
    }`;
      const variables = {
        email: defaultUser.email,
        password: "invalidPassword",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(data).toBeNull();
      expect(errors[0].extensions.code).toBe("401");
    });

    it("should return user - valid credentials", async () => {
      const query = `mutation($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          id
          email
          locale
          role
          profile {
            firstName
            lastName
            gender
            imageUrl
          }
          metadata {
            createdOn
            lastUpdatedOn
            deletedOn
          }
        }
      }`;
      const variables = {
        email: defaultUser.email,
        password: defaultUser.password,
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(errors).toBeNull();

      expect(data.id).toBe(defaultUser.id);
      expect(data.email).toBe(defaultUser.email);
      expect(data.locale).toBe(defaultUser.locale);
      expect(data.role).toBe(defaultUser.role);
      expect(data.profile.firstName).toBe(defaultUser.profile.firstName);
      expect(data.profile.lastName).toBe(defaultUser.profile.lastName);
      expect(data.profile.gender).toBe(defaultUser.profile.gender);
      expect(data.profile.imageUrl).toBe(defaultUser.image_url);

      expect(data.metadata.createdOn).toBeTruthy();
      expect(data.metadata.lastUpdatedOn).toBeTruthy();
      expect(data.metadata.deletedOn).toBeNull();
    });
  });

  describe("sendUserPasswordResetToken", () => {
    const queryServer = async (
      query: string,
      variables: object,
      accessTokenCookie: string
    ) => {
      const { errors, data } = await graphqlRequest(
        query,
        variables,
        accessTokenCookie
      );
      return { errors, data: data ? data.sendUserPasswordResetToken : null };
    };

    it("should store reset token and 10 minutes token expiration in database", async () => {
      const query = `mutation($email: String!) { 
        sendUserPasswordResetToken(email: $email) 
      }`;
      const variables = {
        email: defaultUser.email,
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(errors).toBeNull();
      expect(data).toBeTruthy();

      // get user from database
      const user = await db
        .getInstance()
        .query(`SELECT * FROM users WHERE email = '${defaultUser.email}'`)
        .then((res) => <any>res[0][0]);
      expect(user.reset_token).toBeTruthy();
      expect(user.reset_token.length).toBe(6);

      const now = new Date();
      const expectedExpiration = new Date(now.setTime(now.getTime() + 10));
      expect(new Date(user.reset_token_expiration).toDateString()).toBe(
        expectedExpiration.toDateString()
      );
    });

    it("should send reset token to user", async () => {
      const query = `mutation($email: String!) { 
        sendUserPasswordResetToken(email: $email) 
      }`;
      const variables = {
        email: defaultUser.email,
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(errors).toBeNull();
      expect(data).toBeTruthy();

      expect(mockedSendGridSend).toHaveBeenCalledWith({
        template_id: sendgrid.templates["SEND_PASSWORD_RESET_TOKEN"],
        from: sendgrid.verified_sender,
        to: defaultUser.email,
        dynamic_template_data: {
          name: `${defaultUser.profile.firstName} ${defaultUser.profile.lastName}`,
          token: "123456",
        },
        subject: "NOTIFICATION",
        html: "Notification",
        text: "Notification",
      });
    });

    it("should return true also for inexistent email", async () => {
      const query = `mutation($email: String!) { 
        sendUserPasswordResetToken(email: $email) 
      }`;
      const variables = {
        email: "email-inexistent",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(errors).toBeNull();
      expect(data).toBeTruthy();
    });

    it("should not send reset token for inexistent email", async () => {
      const query = `mutation($email: String!) { 
        sendUserPasswordResetToken(email: $email) 
      }`;
      const variables = {
        email: "email-inexistent",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(errors).toBeNull();
      expect(data).toBeTruthy();

      expect(mockedSendGridSend).not.toHaveBeenCalled();
    });
  });

  describe("resetUserPassword", () => {
    const queryServer = async (
      query: string,
      variables: object,
      accessTokenCookie: string
    ) => {
      const { errors, data } = await graphqlRequest(
        query,
        variables,
        accessTokenCookie
      );
      return { errors, data: data ? data.resetUserPassword : null };
    };

    it("should return 403 for inexistent user", async () => {
      const query = `mutation($email: String!, $newPassword: String!, $token: String!) { 
        resetUserPassword(email: $email, newPassword: $newPassword, token: $token)
      }`;
      const variables = {
        email: "user-inexistent@email.com",
        token: "000000",
        newPassword: "newPassword",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(data).toBeNull();

      const error = errors[0].extensions;
      expect(error.code).toBe("403");
    });

    it("should return 403 for wrong token", async () => {
      const query = `mutation($email: String!, $newPassword: String!, $token: String!) { 
        resetUserPassword(email: $email, newPassword: $newPassword, token: $token)
      }`;
      const variables = {
        email: defaultUser.email,
        token: "000000",
        newPassword: "newPassword",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(data).toBeNull();

      const error = errors[0].extensions;
      expect(error.code).toBe("403");
    });

    it("should return 403 for expired token", async () => {
      // expire token
      const now = new Date();
      await db
        .getInstance()
        .query(
          `UPDATE users SET reset_token_expiration = '${new Date(
            now.setMinutes(now.getMinutes() + 11)
          ).toDateString()}'`
        );

      const query = `mutation($email: String!, $newPassword: String!, $token: String!) { 
        resetUserPassword(email: $email, newPassword: $newPassword, token: $token)
      }`;
      const variables = {
        email: defaultUser.email,
        token: "123456",
        newPassword: "newPassword",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(data).toBeNull();

      const error = errors[0].extensions;
      expect(error.code).toBe("403");
    });

    it("should store new password in database and increment reset count", async () => {
      const query = `mutation($email: String!, $newPassword: String!, $token: String!) { 
        resetUserPassword(email: $email, newPassword: $newPassword, token: $token)
      }`;
      const variables = {
        email: defaultUser.email,
        token: "123456",
        newPassword: "newPassword",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(errors).toBeNull();
      expect(data).toBeTruthy();

      const user = await db
        .getInstance()
        .query(`SELECT * FROM users WHERE id = '${defaultUser.id}'`)
        .then((res) => {
          return <any>res[0][0];
        });
      expect(user.reset_token).toBeNull();
      expect(user.reset_token_expiration).toBeNull();

      expect(user.reset_count).toBe(defaultUser.reset_count + 1);
    });

    it.skip("should refresh cookies for logged in user", async () => {
      // execute login
      const accessTokenCookie = await getAccessTokenCookie(
        request,
        endpoint,
        defaultUser.email,
        defaultUser.password
      );

      const query = `mutation($email: String!, $newPassword: String!, $token: String!) { 
        resetUserPassword(email: $email, newPassword: $newPassword, token: $token)
      }`;
      const variables = {
        email: defaultUser.email,
        token: "123456",
        newPassword: "newPassword",
      };

      const { data, errors } = await queryServer(
        query,
        variables,
        accessTokenCookie
      );
      expect(errors).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  describe("sendUserEmailChangeToken", () => {
    const queryServer = async (
      query: string,
      variables: object,
      accessTokenCookie: string
    ) => {
      const { errors, data } = await graphqlRequest(
        query,
        variables,
        accessTokenCookie
      );
      return { errors, data: data ? data.sendUserEmailChangeToken : null };
    };

    it("should return 401 error for inexistent email", async () => {
      const query = `mutation($email: String!) { 
        sendUserEmailChangeToken(email: $email) 
      }`;
      const variables = {
        email: "email-inexistent",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(data).toBeNull();

      const error = errors[0].extensions;
      expect(error.code).toBe("401");
    });

    it("should store reset token and 10 minutes token expiration in database", async () => {
      // execute login
      const accessTokenCookie = await getAccessTokenCookie(
        request,
        endpoint,
        defaultUser.email,
        defaultUser.password
      );

      const query = `mutation($email: String!) { 
        sendUserEmailChangeToken(email: $email) 
      }`;
      const variables = {
        email: defaultUser.email,
      };

      const { data, errors } = await queryServer(
        query,
        variables,
        accessTokenCookie
      );
      expect(errors).toBeNull();
      expect(data).toBeTruthy();

      // get user from database
      const user = await db
        .getInstance()
        .query(`SELECT * FROM users WHERE email = '${defaultUser.email}'`)
        .then((res) => <any>res[0][0]);
      expect(user.reset_token).toBeTruthy();
      expect(user.reset_token.length).toBe(6);

      const now = new Date();
      const expectedExpiration = new Date(now.setTime(now.getTime() + 10));
      expect(new Date(user.reset_token_expiration).toDateString()).toBe(
        expectedExpiration.toDateString()
      );
    });

    it("should send reset token to user", async () => {
      // execute login
      const accessTokenCookie = await getAccessTokenCookie(
        request,
        endpoint,
        defaultUser.email,
        defaultUser.password
      );

      const query = `mutation($email: String!) { 
        sendUserEmailChangeToken(email: $email) 
      }`;
      const variables = {
        email: defaultUser.email,
      };

      const { data, errors } = await queryServer(
        query,
        variables,
        accessTokenCookie
      );
      expect(errors).toBeNull();
      expect(data).toBeTruthy();

      expect(mockedSendGridSend).toHaveBeenCalledWith({
        template_id: sendgrid.templates["SEND_EMAIL_CHANGE_TOKEN"],
        from: sendgrid.verified_sender,
        to: defaultUser.email,
        dynamic_template_data: {
          name: `${defaultUser.profile.firstName} ${defaultUser.profile.lastName}`,
          token: "123456",
        },
        subject: "NOTIFICATION",
        html: "Notification",
        text: "Notification",
      });
    });
  });

  describe("changeUserEmail", () => {
    const queryServer = async (
      query: string,
      variables: object,
      accessTokenCookie: string
    ) => {
      const { errors, data } = await graphqlRequest(
        query,
        variables,
        accessTokenCookie
      );
      return { errors, data: data ? data.changeUserEmail : null };
    };

    it("should return 403 for inexistent user", async () => {
      const query = `mutation($userId: ID!, $newEmail: String!, $token: String!) { 
        changeUserEmail(userId: $userId, newEmail: $newEmail, token: $token)
      }`;
      const variables = {
        userId: "user-inexistent",
        token: "000000",
        newEmail: "new-user@email.com",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(data).toBeNull();

      const error = errors[0].extensions;
      expect(error.code).toBe("403");
    });

    it("should return 403 for wrong token", async () => {
      const query = `mutation($userId: ID!, $newEmail: String!, $token: String!) { 
        changeUserEmail(userId: $userId, newEmail: $newEmail, token: $token)
      }`;
      const variables = {
        userId: defaultUser.id,
        token: "000000",
        newEmail: "new-user@email.com",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(data).toBeNull();

      const error = errors[0].extensions;
      expect(error.code).toBe("403");
    });

    it("should return 403 for expired token", async () => {
      // expire token
      const now = new Date();
      await db
        .getInstance()
        .query(
          `UPDATE users SET reset_token_expiration = '${new Date(
            now.setMinutes(now.getMinutes() + 11)
          ).toDateString()}'`
        );

      const query = `mutation($userId: ID!, $newEmail: String!, $token: String!) { 
        changeUserEmail(userId: $userId, newEmail: $newEmail, token: $token)
      }`;
      const variables = {
        userId: defaultUser.id,
        token: "123456",
        newEmail: "new-user@email.com",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(data).toBeNull();

      const error = errors[0].extensions;
      expect(error.code).toBe("403");
    });

    it("should store new email in database and increment reset count", async () => {
      const query = `mutation($userId: ID!, $newEmail: String!, $token: String!) { 
        changeUserEmail(userId: $userId, newEmail: $newEmail, token: $token)
      }`;
      const variables = {
        userId: defaultUser.id,
        token: "123456",
        newEmail: "new-email@email.com",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(errors).toBeNull();
      expect(data).toBeTruthy();

      const user = await db
        .getInstance()
        .query(`SELECT * FROM users WHERE id = '${defaultUser.id}'`)
        .then((res) => {
          return <any>res[0][0];
        });
      expect(user.email).toBe(variables.newEmail);

      expect(user.reset_token).toBeNull();
      expect(user.reset_token_expiration).toBeNull();

      expect(user.reset_count).toBe(defaultUser.reset_count + 1);
    });

    it.skip("should refresh cookies for logged in user", async () => {
      // execute login
      const accessTokenCookie = await getAccessTokenCookie(
        request,
        endpoint,
        defaultUser.email,
        defaultUser.password
      );

      const query = `mutation($email: String!, $newEmail: String!, $token: String!) { 
        changeUserEmail(email: $email, newEmail: $newEmail, token: $token)
      }`;
      const variables = {
        email: defaultUser.email,
        token: "123456",
        newEmail: "newEmail",
      };

      const { data, errors } = await queryServer(
        query,
        variables,
        accessTokenCookie
      );
      expect(errors).toBeNull();
      expect(data).toBeTruthy();
    });
  });
});
