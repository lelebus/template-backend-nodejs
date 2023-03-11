const getAccessTokenCookie = async (
  request: any,
  endpoint: string,
  email: string,
  password: string
): Promise<string> => {
  const query = `mutation($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        id
        email
      }
    }`;
  const variables = {
    email,
    password,
  };

  const res = await request
    .post(endpoint)
    .send({
      query,
      variables,
    })
    .set("Accept", "application/json");

  return res.headers["set-cookie"][0];
};

export { getAccessTokenCookie };
