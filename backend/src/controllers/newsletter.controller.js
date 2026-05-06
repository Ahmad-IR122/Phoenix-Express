'use strict';

const nodemailer = require('nodemailer');
const path = require('path');
const {
  NewsletterSubscriber,
  NewsletterCampaign,
  User,
} = require('../models');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createMailTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Email service is not configured');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const buildNewsletterHtml = ({ body }) => {
  const formattedBody = String(body || '')
    .split('\n')
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 14px; font-size:16px; line-height:1.9;">${line}</p>`)
    .join('');

  return `
    <div dir="rtl" style="margin:0; padding:0; background:#f4f7fb; font-family:Arial, sans-serif;">
      <div style="max-width:620px; margin:0 auto; padding:32px 16px;">
        <div style="background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e8eef6;">
          <div style="background:#38B6FF; padding:30px 24px; text-align:center;">
            <img src="cid:phoenix-logo" alt="Phoenix Express" style="width:92px; height:92px; object-fit:cover; border-radius:18px; background:#ffffff; padding:6px;" />
            <h1 style="margin:18px 0 0; color:#ffffff; font-size:24px; font-weight:800;">نشرة فينوكس الشهرية</h1>
          </div>
          <div style="padding:30px 28px; color:#1f2937;">
            ${formattedBody}
            <div style="margin-top:24px; padding:18px; border-radius:14px; background:#eef8ff; color:#0f172a; font-size:14px; line-height:1.8;">
              شكراً لاشتراكك في نشرة فينوكس إكسبرس. نرسل لك محتوى عملياً يساعدك على تحسين تجربة التوصيل وخدمة العملاء.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const getNewsletterStatusPayload = async () => {
  const subscribersCount = await NewsletterSubscriber.count({
    where: { is_active: true },
  });

  const lastCampaign = await NewsletterCampaign.findOne({
    order: [['sent_at', 'DESC']],
  });

  const lastSentAt = lastCampaign?.sent_at || null;
  const daysSinceLastSend = lastSentAt
    ? Math.floor((Date.now() - new Date(lastSentAt).getTime()) / 86400000)
    : null;
  const isSendDue = !lastSentAt || daysSinceLastSend >= 30;

  return {
    subscribersCount,
    lastCampaign,
    lastSentAt,
    daysSinceLastSend,
    isSendDue,
    nextDueAt: lastSentAt
      ? new Date(new Date(lastSentAt).getTime() + 30 * 86400000)
      : new Date(),
  };
};

const subscribe = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email is required',
      });
    }

    const [subscriber, created] = await NewsletterSubscriber.findOrCreate({
      where: { email },
      defaults: {
        email,
        user_id: req.user?.id || null,
        is_active: true,
        subscribed_at: new Date(),
      },
    });

    if (!created && !subscriber.is_active) {
      await subscriber.update({
        is_active: true,
        user_id: req.user?.id || subscriber.user_id,
        subscribed_at: new Date(),
        unsubscribed_at: null,
      });
    } else if (!created && req.user?.id && subscriber.user_id !== req.user.id) {
      await subscriber.update({ user_id: req.user.id });
    }

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Newsletter subscription created' : 'Newsletter subscription already exists',
      data: subscriber,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to subscribe to newsletter',
      errors: [error.message],
    });
  }
};

const getEmployeeNewsletter = async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.findAll({
      where: { is_active: true },
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone'], required: false }],
      order: [['subscribed_at', 'DESC']],
    });
    const status = await getNewsletterStatusPayload();

    return res.status(200).json({
      success: true,
      message: 'Newsletter data fetched successfully',
      data: {
        ...status,
        subscribers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch newsletter data',
      errors: [error.message],
    });
  }
};

const getNewsletterStatus = async (req, res) => {
  try {
    const status = await getNewsletterStatusPayload();

    return res.status(200).json({
      success: true,
      message: 'Newsletter status fetched successfully',
      data: status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch newsletter status',
      errors: [error.message],
    });
  }
};

const sendNewsletter = async (req, res) => {
  try {
    const subject = String(req.body?.subject || '').trim();
    const body = String(req.body?.body || '').trim();

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Newsletter subject and body are required',
      });
    }

    const subscribers = await NewsletterSubscriber.findAll({
      where: { is_active: true },
      order: [['subscribed_at', 'DESC']],
    });

    if (!subscribers.length) {
      return res.status(400).json({
        success: false,
        message: 'No active newsletter subscribers found',
      });
    }

    const transporter = createMailTransport();
    const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;
    const fromName = process.env.MAIL_FROM_NAME || 'فينوكس إكسبرس';
    const logoPath = path.resolve(__dirname, '../../../frontend/src/Images/Phonex_logo.jpeg');
    const html = buildNewsletterHtml({ body });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: fromEmail,
      bcc: subscribers.map((subscriber) => subscriber.email),
      subject,
      text: body,
      html,
      attachments: [
        {
          filename: 'phoenix-logo.jpeg',
          path: logoPath,
          cid: 'phoenix-logo',
        },
      ],
    });

    const campaign = await NewsletterCampaign.create({
      employee_user_id: req.user?.id || null,
      subject,
      body,
      recipients_count: subscribers.length,
      sent_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Newsletter sent successfully',
      data: {
        campaign,
        recipientsCount: subscribers.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send newsletter',
      errors: [error.message],
    });
  }
};

module.exports = {
  subscribe,
  getEmployeeNewsletter,
  getNewsletterStatus,
  sendNewsletter,
};
