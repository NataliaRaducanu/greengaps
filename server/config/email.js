const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nataliaraducanu10@gmail.com',
    pass: 'tvsrpnovurwqzbvv',
  },
  debug: true,
  logger: true,
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const sendPasswordResetEmail = async (email, resetLink) => {
  const info = await transporter.sendMail({
    from: '"GreenGaps" <nataliaraducanu10@gmail.com>',
    to: email,
    subject: 'Reset Your GreenGaps Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2d7a4f; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚲 GreenGaps</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Birmingham Cycling Infrastructure</p>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a1a; margin-bottom: 16px;">Reset Your Password</h2>
          <p style="color: #555; line-height: 1.6;">We received a request to reset your GreenGaps password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="background: #2d7a4f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 13px;">This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #aaa; font-size: 12px; text-align: center;">GreenGaps — Birmingham Cycling Infrastructure</p>
        </div>
      </div>
    `,
  });
  console.log('Password reset email sent:', info.messageId);
};

const sendStatusUpdateEmail = async (email, fullName, reportLocation, status, comment) => {
  const formatStatus = (s) => {
    if (s === 'in_progress') return 'In Progress';
    if (s === 'resolved') return 'Resolved';
    return s;
  };

  const statusColor = {
    'Open': '#ca8a04',
    'in_progress': '#2563eb',
    'resolved': '#2d7a4f',
  };

  const color = statusColor[status] || '#555';
  const displayStatus = formatStatus(status);

  const info = await transporter.sendMail({
    from: '"GreenGaps" <nataliaraducanu10@gmail.com>',
    to: email,
    subject: `Your GreenGaps Report Has Been Updated — ${displayStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2d7a4f; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚲 GreenGaps</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Birmingham Cycling Infrastructure</p>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Report Status Updated</h2>
          <p style="color: #555; line-height: 1.6;">Hi ${fullName || 'there'},</p>
          <p style="color: #555; line-height: 1.6;">Your report for <strong>${reportLocation}</strong> has been updated.</p>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${color};">
            <p style="margin: 0 0 8px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">New Status</p>
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${color};">${displayStatus}</p>
          </div>
          ${comment ? `
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Admin Comment</p>
            <p style="margin: 0; color: #333; line-height: 1.6;">${comment}</p>
          </div>
          ` : ''}
          <div style="text-align: center; margin: 32px 0;">
            <a href="${FRONTEND_URL}/my-reports" style="background: #2d7a4f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              View My Reports
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #aaa; font-size: 12px; text-align: center;">GreenGaps — Birmingham Cycling Infrastructure</p>
        </div>
      </div>
    `,
  });
  console.log('Status update email sent:', info.messageId);
};

const sendForumReplyEmail = async (email, fullName, postTitle, replierName, replyContent, postId) => {
  const info = await transporter.sendMail({
    from: '"GreenGaps" <nataliaraducanu10@gmail.com>',
    to: email,
    subject: `💬 New reply on your GreenGaps post: "${postTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2d7a4f; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚲 GreenGaps</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Birmingham Cycling Infrastructure</p>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Someone replied to your post!</h2>
          <p style="color: #555; line-height: 1.6;">Hi ${fullName || 'there'},</p>
          <p style="color: #555; line-height: 1.6;">
            <strong>${replierName || 'Someone'}</strong> replied to your discussion: 
            <strong>"${postTitle}"</strong>
          </p>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #2d7a4f;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Their reply</p>
            <p style="margin: 0; color: #333; line-height: 1.6; font-style: italic;">
              "${replyContent?.length > 200 ? replyContent.substring(0, 200) + '...' : replyContent}"
            </p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${FRONTEND_URL}/forum/${postId}" style="background: #2d7a4f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              View Discussion
            </a>
          </div>
          <p style="color: #888; font-size: 13px; text-align: center;">
            You're receiving this because you started this discussion on GreenGaps.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #aaa; font-size: 12px; text-align: center;">GreenGaps — Birmingham Cycling Infrastructure</p>
        </div>
      </div>
    `,
  });
  console.log('✅ Forum reply email sent to', email, ':', info.messageId);
};

const sendBroadcastEmail = async (email, fullName, subject, message) => {
  const info = await transporter.sendMail({
    from: '"GreenGaps" <nataliaraducanu10@gmail.com>',
    to: email,
    subject: `📢 ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2d7a4f; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚲 GreenGaps</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Birmingham Cycling Infrastructure</p>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">${subject}</h2>
          <p style="color: #555; line-height: 1.6;">Hi ${fullName || 'there'},</p>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #2d7a4f;">
            <p style="margin: 0; color: #333; line-height: 1.7; white-space: pre-wrap;">${message}</p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${FRONTEND_URL}" style="background: #2d7a4f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Visit GreenGaps
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            You're receiving this because you're a member of GreenGaps Birmingham.<br>
            GreenGaps — Birmingham Cycling Infrastructure
          </p>
        </div>
      </div>
    `,
  });
  console.log('✅ Broadcast email sent to', email, ':', info.messageId);
};

module.exports = { sendPasswordResetEmail, sendStatusUpdateEmail, sendForumReplyEmail, sendBroadcastEmail };