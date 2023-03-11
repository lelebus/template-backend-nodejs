const { stripe } = require("../../config");

const stripeSDK = require("stripe")(stripe.secret_key);

//////////////////////////////////
//
// Customer Operations
//
//////////////////////////////////
export function createCustomer(name: string, email: string) {
  return stripeSDK.customers.create({
    name,
    email,
    preferred_locales: ["it"],
  });
}

export function getSetupIntentClientSecret(customerId: string) {
  return stripeSDK.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
  });
}

export async function listCustomerPaymentMethods(customerId) {
  return stripeSDK.customers.listPaymentMethods(customerId, {
    type: "card",
  });
}

export async function detachCustomerPaymentMethod(paymentMethodId) {
  return stripeSDK.paymentMethods.detach(paymentMethodId);
}
