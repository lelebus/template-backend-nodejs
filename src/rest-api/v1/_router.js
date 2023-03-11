var router = require("express").Router();

// split up route handling
router.use("/hello-world", require("./endpoints/hello-world"));

module.exports = router;
