import { ReplitConnectors } from "@replit/connectors-sdk";

export async function sendEmailVerificationCode(email: string, otp: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }

  const response = await new ReplitConnectors().proxy("resend", "/emails", {
    method: "POST",
    body: {
      from,
      to: [email],
      subject: "Your IndiaConnect verification code",
      text: `Your IndiaConnect verification code is ${otp}. It expires in 10 minutes and can only be used once.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #172033;">
          <h2>Verify your IndiaConnect email</h2>
          <p>Use this six-digit code to finish creating your account:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 8px;">${otp}</p>
          <p>This code expires in 10 minutes and can only be used once.</p>
          <p>If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend rejected the verification email (${response.status}): ${details}`);
  }
}