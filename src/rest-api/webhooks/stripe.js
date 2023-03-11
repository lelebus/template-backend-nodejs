const stripeService = require("stripe");

const router = require("express").Router();
const logger = require("../../utils/logger");

const { stripe } = require("../../config");
const endpointSecret = stripe.webhook_secrets.account;

router.get(
  "/account",
  require("express").raw({ type: "application/json" }),
  async (req, res) => {
    res.send("ok");
  }
);

router.post(
  "/account",
  require("express").raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripeService.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      logger.error(`stripe-webhook -> ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      // insert your own event handlers here
      default:
        logger.info(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
  }
);

module.exports = router;
