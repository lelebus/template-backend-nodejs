var router = require("express").Router();

// split up route handling
router.use("/stripe", require("./stripe"));

module.exports = router;
