import nodemailer from "nodemailer";

export type OwnerEmail = { subject: string; html: string };

// Sends an email to the shop owner. No-ops (logs) when SMTP is not configured,
// so it is safe in tests/dev and never throws to the caller.
export async function sendOwnerEmail({ subject, html }: OwnerEmail): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.OWNER_EMAIL ?? user;

  if (!user || !pass || !to) {
    console.warn("[email] SMTP not configured — skipping send:", subject);
    return;
  }

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transport.sendMail({ from: user, to, subject, html });
}
