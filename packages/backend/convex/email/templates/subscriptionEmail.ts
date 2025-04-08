/* eslint-disable react-refresh/only-export-components */
import { env } from "@/env";
import { sendEmail } from "../index";
import {
  renderSubscriptionErrorEmail,
  renderSubscriptionSuccessEmail,
} from "@v1/email/emails/subscriptionEmail";

type SubscriptionEmailOptions = {
  email: string;
  subscriptionId: string;
};

/**
 * Senders.
 */
export async function sendSubscriptionSuccessEmail({
  email,
  subscriptionId,
}: SubscriptionEmailOptions) {
  const html = await renderSubscriptionSuccessEmail({
    email,
    subscriptionId,
    siteUrl: env.SITE_URL,
  });

  await sendEmail({
    to: email,
    subject: "Successfully Subscribed to PRO",
    html,
  });
}

export async function sendSubscriptionErrorEmail({
  email,
  subscriptionId,
}: SubscriptionEmailOptions) {
  const html = await renderSubscriptionErrorEmail({
    email,
    subscriptionId,
    siteUrl: env.SITE_URL,
  });

  await sendEmail({
    to: email,
    subject: "Subscription Issue - Customer Support",
    html,
  });
}
