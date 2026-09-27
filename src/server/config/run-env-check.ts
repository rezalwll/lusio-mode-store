import "dotenv/config";

import { getMediaEnvironment, getMessageEnvironment, getOrderReservationMinutes, getPaymentEnvironment, validateRuntimeEnvironment } from "./env.js";

try {
  validateRuntimeEnvironment();
  const payment = getPaymentEnvironment();
  const messaging = getMessageEnvironment();
  const media = getMediaEnvironment();
  console.log(JSON.stringify({ ok: true, paymentProvider: payment.provider, messageProvider: messaging.provider, mediaDriver: media.driver, reservationMinutes: getOrderReservationMinutes() }));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Environment validation failed" }));
  process.exitCode = 1;
}
