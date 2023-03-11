const HelperService = require("./src/services/core/helper.service");

jest
  .spyOn(HelperService, "generateRandomNumericToken")
  .mockImplementation(() => {
    return "123456";
  });
