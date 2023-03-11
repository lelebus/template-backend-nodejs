const DEFAULT_USER = "u_y03k02hfue019irhtys82husyh";

const users = [
  {
    id: DEFAULT_USER,
    role: "ADMIN",
    locale: "IT",
    email: "user-1@email.com",
    password: "password",
    reset_token: null,
    image_url: "https://example.com/public_image.jpg",
    profile: {
      firstName: "User",
      lastName: "One",
      gender: "MALE",
    },
    reset_count: 2,
    created_on: "2022-03-08 20:56:01.337573",
    last_updated: "2022-03-09 19:36:52.450094",
    registered_on: "2022-03-08 20:56:01.337573",
  },
];

const RESET_TOKEN = {
  reset_token: "123456",
  reset_token_expiration: new Date().toISOString(),
};

const getUsers = function () {
  return users;
};

module.exports = {
  DEFAULT_USER,
  getUsers,
  RESET_TOKEN,
};
