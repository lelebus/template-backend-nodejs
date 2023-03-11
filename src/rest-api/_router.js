var router = require("express").Router();

// split up route handling
router.use("/webhooks", require("./webhooks/_router"));
// router.use("/v1", require("./v1/_router"));

module.exports = router;
