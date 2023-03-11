import { graphql } from "../../../../../config";

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

beforeEach(async () => {
  // clean database
  await cleanDb();

  // populate database
  await insertUsers();
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

describe("User query", () => {
  describe("existsUser", () => {
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
      return { errors, data: data ? data.existsUser : null };
    };

    it("should return `true` for existing user", async () => {
      const query = `query Query($email: String!) {
      existsUser(email: $email)
    }`;
      const variables = {
        email: defaultUser.email,
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(errors).toBeNull();
      expect(data).toBe(true);
    });

    it("should return `false` for non-existing user", async () => {
      const query = `query Query($email: String!) {
      existsUser(email: $email)
    }`;
      const variables = {
        email: "inexistent-user@email.com",
      };

      const { data, errors } = await queryServer(query, variables, null);
      expect(errors).toBeNull();
      expect(data).toBe(false);
    });
  });

  describe("me", () => {
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
      return { errors, data: data ? data.me : null };
    };

    it("should return 401 error for no logged user", async () => {
      const query = `query {
        me {
          id
          email
        }
      }`;

      const { data, errors } = await queryServer(query, {}, null);
      expect(data).toBeNull();
      expect(errors[0].extensions.code).toBe("401");
    });

    it("should return user data - logged user", async () => {
      const query = `query {
        me {
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

      // execute login
      const accessTokenCookie = await getAccessTokenCookie(
        request,
        endpoint,
        defaultUser.email,
        defaultUser.password
      );

      const { data, errors } = await queryServer(query, {}, accessTokenCookie);
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
});
