import { sendEmail } from "../integrations/sendgrid.service";

import { emitter, events } from "../../events";
import db from "../../data-access";

export async function notifyPasswordResetToken(
  email: string,
  name: string,
  token: string
) {
  // send notification through sendgrid
  await sendEmail(email, {
    templateKey: "SEND_PASSWORD_RESET_TOKEN",
    dynamic_template_data: {
      name,
      token,
    },
  });

  emitter.emit(events.NOTIFICATION_SENT, {
    service: "auth",
    data: {
      notification: {
        type: "SEND_PASSWORD_RESET_TOKEN",
        email,
      },
    },
  });

  return;
}

export async function notifyEmailResetToken(
  email: string,
  name: string,
  token: string
) {
  // send notification through sendgrid
  await sendEmail(email, {
    templateKey: "SEND_EMAIL_CHANGE_TOKEN",
    dynamic_template_data: {
      name,
      token,
    },
  });

  emitter.emit(events.NOTIFICATION_SENT, {
    service: "auth",
    data: {
      notification: {
        type: "SEND_EMAIL_CHANGE_TOKEN",
        email,
      },
    },
  });

  return;
}

export async function notifyAdminsOfProfessionalAccountRegistration(
  professionalUserId: string,
  professionalUserName: string
) {
  // get all administrators
  const admins = await db.User.findAll({
    where: { role: "ADMIN" },
  });

  // send notification through sendgrid
  for (const admin of admins) {
    await sendEmail(admin.email, {
      templateKey: "PROFESSIONAL_ACCOUNT_REGISTRATION",
      dynamic_template_data: {
        name: admin.profile.privateIdentity.name,
        professionalUserId,
        professionalUserName,
      },
    });

    emitter.emit(events.NOTIFICATION_SENT, {
      service: "auth",
      data: {
        notification: {
          type: "PROFESSIONAL_ACCOUNT_REGISTRATION",
          email: admin.email,
          professionalUserId,
        },
      },
    });
  }

  return;
}

export async function notifyProfessionalAccountActivation(
  email: string,
  name: string
) {
  // send notification through sendgrid
  await sendEmail(email, {
    templateKey: "PROFESSIONAL_ACCOUNT_ACTIVATION",
    dynamic_template_data: {
      name,
      recipientPrivateName: name,
    },
  });

  emitter.emit(events.NOTIFICATION_SENT, {
    service: "auth",
    data: {
      notification: {
        type: "PROFESSIONAL_ACCOUNT_ACTIVATION",
        email,
      },
    },
  });

  return;
}

export async function notifyEventPaymentMethodUpdateRequired(
  email: string,
  name: string,
  eventId: string,
  paymentId: string
) {
  // send notification through sendgrid
  await sendEmail(email, {
    templateKey: "PAYMENT_FAILED_METHOD_UPDATE_REQUIRED",
    dynamic_template_data: {
      name,
      eventId,
      paymentId,
    },
  });

  emitter.emit(events.NOTIFICATION_SENT, {
    service: "payment",
    data: {
      notification: {
        type: "PAYMENT_FAILED_METHOD_UPDATE_REQUIRED",
        email,
      },
    },
  });

  return;
}

export async function notifyEventPaymentCancellationBecauseItFailed(
  email: string,
  name: string,
  eventId: string
) {
  // send notification through sendgrid
  await sendEmail(email, {
    templateKey: "PAYMENT_FAILED_AND_CANCELLED",
    dynamic_template_data: {
      name,
      eventId,
    },
  });

  emitter.emit(events.NOTIFICATION_SENT, {
    service: "payment",
    data: {
      notification: {
        type: "PAYMENT_FAILED_AND_CANCELLED",
        email,
      },
    },
  });

  return;
}

export async function notifyNewBookingPrivateUser(
  email: string,
  professionalName: string,
  professionalId: string,
  professionalImageUrl: string,
  eventName: string,
  eventPrice: string,
  date: string,
  startTime: string,
  eventId: string
) {
  // send notification through sendgrid
  await sendEmail(email, {
    templateKey: "NEW_BOOKING_PRIVATE_USER",
    dynamic_template_data: {
      professionalName,
      professionalId,
      professionalImageUrl,
      date,
      startTime,
      eventName,
      eventPrice,
    },
  });

  emitter.emit(events.NOTIFICATION_SENT, {
    service: "booking",
    data: {
      notification: {
        type: "NEW_BOOKING_PRIVATE",
        eventId,
      },
    },
  });

  return;
}

export async function notifyNewBookingProfessionalUser(
  email: string,
  professionalId: string,
  professionalName: string,
  professionalImageUrl: string,
  userId: string,
  userName: string,
  userImageUrl: string,
  eventName: string,
  eventPrice: string,
  date: string,
  startTime: string,
  eventId: string,
  recipientPrivateName: string
) {
  // send notification through sendgrid
  await sendEmail(email, {
    templateKey: "NEW_BOOKING_PROFESSIONAL_USER",
    dynamic_template_data: {
      professionalId,
      professionalName,
      professionalImageUrl,
      userId,
      userName,
      userImageUrl,
      eventName,
      eventPrice,
      date,
      startTime,
      recipientPrivateName,
    },
  });

  emitter.emit(events.NOTIFICATION_SENT, {
    service: "booking",
    data: {
      notification: {
        type: "NEW_BOOKING_PROFESSIONAL",
        eventId,
      },
    },
  });

  return;
}

export async function notifyDeletedBooking(
  email: string,
  professionalName: string,
  userName: string,
  date: string,
  startTime: string,
  eventId: string
) {
  // send notification through sendgrid
  await sendEmail(email, {
    templateKey: "DELETE_BOOKING_USER",
    dynamic_template_data: {
      professionalName,
      date,
      startTime,
      recipientPrivateName: userName,
    },
  });

  emitter.emit(events.NOTIFICATION_SENT, {
    service: "booking",
    data: {
      notification: {
        type: "DELETE_BOOKING",
        eventId,
      },
    },
  });

  return;
}
