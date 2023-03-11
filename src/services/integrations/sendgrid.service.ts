import { sendgrid } from "../../config";
const { api_key, verified_sender, administrators, templates } = sendgrid;

import logger from "../../utils/logger";

import sgMail from "@sendgrid/mail";
sgMail.setApiKey(api_key);

// TODO: keep in mind translations
export function sendEmail(
  recipients: string | string[],
  {
    templateKey,
    subject = "NOTIFICATION",
    body = "Notification",
    text = "",
    html = "",
    dynamic_template_data = {},
  }
) {
  const template_id = templates[templateKey];
  let msg: any = {
    to: recipients,
    from: verified_sender,
    subject,
    text: text || body,
    html: html || body,
    template_id,
    dynamic_template_data,
  };

  // notify missing template to admins
  if (template_id == null || template_id == undefined) {
    if (recipients instanceof Array) {
      recipients = recipients.join(", ");
    }
    msg = {
      to: administrators,
      from: verified_sender,
      subject: "WARNING: Could not send email",
      text: `Could not send notification email, because template_id ('${templateKey}') was invalid. 
      Recipients: ${recipients}
      `,
    };
  }

  sgMail.send(msg).catch((error) => {
    logger.error(error);
  });
}

export function sendErrorNotificationToAdministration(
  subject: string,
  text: string = ""
) {
  const msg = {
    to: administrators,
    from: verified_sender,
    subject,
    text,
  };

  sgMail.send(msg).catch((error) => {
    logger.error(error);
  });
}
