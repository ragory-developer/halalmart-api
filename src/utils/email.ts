import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using the configured SMTP transporter.
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { host, port, user, pass, fromName, fromEmail } = config.smtp;

    if (!host || !user || !pass) {
      console.warn('[Email Warning] SMTP credentials are not fully configured. Email not sent.');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports (like 587)
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Message sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send email:', error);
    return false;
  }
};
