import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { logger, logRequest, logError, logInfo } from '@/lib/logger';

// Stricter email validation - rejects fake-looking emails
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const suspiciousEmailRegex = /(.+)\1{3,}/; // Detects repeated characters like "assssssssd"

const feedbackSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string()
    .regex(emailRegex, 'Invalid email format')
    .refine((email) => !suspiciousEmailRegex.test(email.split('@')[0]), {
      message: 'Please enter a valid email address',
    })
    .refine((email) => {
      const domain = email.split('@')[1];
      // Block disposable email domains
      const blockedDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'throwaway.email'];
      return !blockedDomains.includes(domain.toLowerCase());
    }, {
      message: 'Please use a valid email domain',
    }),
  rating: z.number().min(1).max(5),
  message: z.string().min(1).max(1000),
});

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    const body = await request.json();
    logRequest('POST', '/api/feedback', ip);
    
    const result = feedbackSchema.safeParse(body);

    if (!result.success) {
      logInfo('Feedback validation failed', { errors: result.error.flatten(), ip });
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, rating, message } = result.data;
    logInfo('Processing feedback', { name, email, rating, ip });
    const adminEmail = process.env.ADMIN_EMAIL;
    const fromAddress = process.env.MAIL_FROM_ADDRESS;
    const fromName = process.env.MAIL_FROM_NAME;

    // Generate star rating HTML
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    // 1. Send notification to admin
    const adminMailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: adminEmail,
      subject: `New Feedback from ${name}`,
      html: `
        <h2>New Feedback Submission</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Rating</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: #f59e0b;">${stars} (${rating}/5)</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Message</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${message.replace(/\n/g, '<br>')}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          This feedback was submitted via the Security Posture Analyzer.
        </p>
      `,
    };

    // 2. Send thank you email to user
    const userMailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: email,
      subject: 'Thank You for Your Feedback!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Thank You for Your Feedback!</h2>
          <p>Hi ${name},</p>
          <p>We have received your feedback and appreciate you taking the time to share your thoughts with us.</p>
          
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Your Rating:</strong> <span style="color: #f59e0b;">${stars}</span></p>
            <p style="margin: 8px 0 0 0;"><strong>Your Message:</strong></p>
            <p style="margin: 8px 0 0 0; font-style: italic;">"${message.replace(/\n/g, '<br>')}"</p>
          </div>
          
          <p>Our team will review your feedback and use it to improve our Security Posture Analyzer.</p>
          
          <p style="margin-top: 24px;">
            Best regards,<br>
            <strong>${fromName}</strong>
          </p>
        </div>
      `,
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions),
    ]);

    const duration = Date.now() - startTime;
    logInfo('Feedback sent successfully', { name, email, duration: `${duration}ms` });
    
    return NextResponse.json({ success: true, message: 'Feedback sent successfully' });
  } catch (error) {
    logError(error as Error, { route: '/api/feedback', ip });
    return NextResponse.json(
      { error: 'Failed to send feedback' },
      { status: 500 }
    );
  }
}
