import nodemailer from "nodemailer";
import { config } from "../config/env";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export interface WelcomeEmailData {
  to: string,
  username: string
};

export interface InviteEmailData {
  to: string,
  inviteeName: string,
  workspaceName: string,
  inviterName: string
};

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const info = await transporter.sendMail({
    from: config.email.from,
    to: data.to,
    subject: 'Welcome to DevFlow',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to DevFlow, ${data.username}!</h1>
        <p>Your account has been created successfully.</p>
        <p>DevFlow helps your team track issues, collaborate in real-time, and ship faster.</p>
        <a href="http://localhost:3000" 
           style="display:inline-block; background:#4F46E5; color:white; 
                  padding:12px 24px; border-radius:6px; text-decoration:none;">
          Get Started
        </a>
        <p style="color: #6B7280; margin-top: 24px; font-size: 14px;">
          The DevFlow Team
        </p>
      </div>
    `,
  });

  // In development, log the Ethereal preview URL
  if(config.nodeEnv === 'development') {
    console.log('📧 Email preview URL:', nodemailer.getTestMessageUrl(info));
  };
};

export async function sendInviteEmail(data: InviteEmailData): Promise<void> {
  const info = await transporter.sendMail({
    from: config.email.from,
    to: data.to,
    subject: `${data.inviterName} invited you to join ${data.workspaceName} workspace on DevFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">You've been invited!</h1>
        <p>Hi ${data.inviteeName},</p>
        <p>
          <strong>${data.inviterName}</strong> has invited you to join 
          <strong>${data.workspaceName}</strong> on DevFlow.
        </p>
        <a href="http://localhost:3000" 
           style="display:inline-block; background:#4F46E5; color:white; 
                  padding:12px 24px; border-radius:6px; text-decoration:none;">
          Accept Invitation
        </a>
        <p style="color: #6B7280; margin-top: 24px; font-size: 14px;">
          The DevFlow Team
        </p>
      </div>
    `,
  });

  if(config.nodeEnv === 'development') {
    console.log('📧 Email preview URL:', nodemailer.getTestMessageUrl(info));
  };
};