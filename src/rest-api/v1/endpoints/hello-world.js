const router = require("express").Router();

router.get("/", async (req, res) => {
    res.status(200);
    res.end(
        JSON.stringify({
            info: { path: req.originalUrl },
            result: { data: "Hello CodeWorks" },
            errors: {},
        })
    );
    res.end();
});

module.exports = router;
