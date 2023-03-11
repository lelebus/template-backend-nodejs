/* __tests__/rest-api/v1/hello-world.spec.js */
const restApi = require("../../../../rest-api/index");

const supertest = require("supertest");
const port = 4001
const url = `http://localhost:${port}/api/v1`;
const endpoint = "/hello-world";
const request = supertest(url);

beforeAll(async () => {
  // start REST service
  await restApi.start("production", port);
});

afterAll(async () => {
  // stop services
  // TODO: stop REST service
});

const restApiGetRequest = async (body = {}) => {
  const res = await request
    .get(endpoint)
    .send(body)
    .set("Accept", "application/json")

  return res.body;
};

const restApiPostRequest = async (body = {}) => {
  const res = await request
    .post(endpoint)
    .send(body)
    .set("Accept", "application/json")

  return res.body;
};

describe.only("Hello World", () => {
  it("should return hello world data", async () => {
    const resultBody = await restApiGetRequest();
    expect(resultBody.result.data).toBe("Hello World");
  });
});