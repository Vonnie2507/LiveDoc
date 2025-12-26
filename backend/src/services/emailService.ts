import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_ADDRESS } from '../config/environment';
import logger from '../utils/logger';
import { ValidationError, EmailDeliveryError } from '../utils/errorHandlers';

export async function sendNotificationEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(to)) {
    throw new ValidationError(`Invalid email address format: ${to}`);
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  const mailOptions = {
    from: SMTP_FROM_ADDRESS,
    to: to,
    subject: subject,
    html: htmlContent
  };

  try {
    await transport.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to} with subject: ${subject}`);
  } catch (error: any) {
    throw new EmailDeliveryError(`Failed to send email to ${to}: ${error.message}`);
  }
}

export async function sendQuoteEmail(to: string, projectName: string, quoteAmount: number, quoteUrl: string): Promise<void> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(to)) {
    throw new ValidationError(`Invalid email address format: ${to}`);
  }

  if (quoteAmount <= 0) {
    throw new ValidationError('Quote amount must be positive number');
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(quoteAmount);

  const htmlBody = `<h1>Quote Ready for ${projectName}</h1><p>Your quote is ready: ${formattedAmount}</p><p><a href="${quoteUrl}">View Quote</a></p>`;

  try {
    await sendNotificationEmail(to, `Your Quote for ${projectName}`, htmlBody);
    logger.info(`Quote email sent successfully for project ${projectName} to ${to}`);
  } catch (error: any) {
    if (error instanceof ValidationError || error instanceof EmailDeliveryError) {
      throw error;
    }
    throw error;
  }
}