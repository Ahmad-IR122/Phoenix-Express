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

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getUniqueSubscriberEmails = (subscribers) => [
  ...new Set(
    subscribers
      .map((subscriber) => normalizeEmail(subscriber.email))
      .filter(isValidEmail)
  ),
];

const getNewsletterBatchSize = () => {
  const configuredSize = Number(process.env.NEWSLETTER_BATCH_SIZE || 50);
  return Number.isInteger(configuredSize) && configuredSize > 0 ? configuredSize : 50;
};

const getNewsletterBatchConcurrency = () => {
  const configuredConcurrency = Number(process.env.NEWSLETTER_BATCH_CONCURRENCY || 3);
  return Number.isInteger(configuredConcurrency) && configuredConcurrency > 0
    ? configuredConcurrency
    : 3;
};

const chunkArray = (items, size) => {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

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

const buildNewsletterHtml = ({ body, subject }) => {
  const formattedBody = String(body || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const lines = paragraph
        .split('\n')
        .map((line) => escapeHtml(line.trim()))
        .filter(Boolean);

      return `<p style="margin:0 0 16px; color:#243244; font-size:16px; line-height:1.9;">${lines.join('<br />')}</p>`;
    })
    .join('');

  const safeSubject = escapeHtml(subject || 'نشرة فينوكس إكسبرس');

  return `
    <div dir="rtl" style="margin:0; padding:0; background:#f3f7fb; font-family:Arial, Tahoma, sans-serif;">
      <div style="display:none; max-height:0; overflow:hidden; color:#f3f7fb;">
        ${safeSubject}
      </div>
      <div style="max-width:640px; margin:0 auto; padding:34px 16px;">
        <div style="background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e2eaf3; box-shadow:0 18px 40px rgba(15, 23, 42, 0.08);">
          <div style="background:#0f6fae; padding:30px 24px; text-align:center;">
            <img src="cid:phoenix-logo" alt="Phoenix Express" style="display:block; width:88px; height:88px; object-fit:cover; border-radius:16px; background:#ffffff; padding:6px; margin:0 auto;" />
            <p style="margin:18px 0 6px; color:#dff3ff; font-size:14px; font-weight:700;">Phoenix Express</p>
            <h1 style="margin:0; color:#ffffff; font-size:25px; line-height:1.4; font-weight:800;">${safeSubject}</h1>
          </div>
          <div style="padding:30px 28px 26px; color:#243244; text-align:right;">
            ${formattedBody}
            <div style="margin-top:24px; padding:18px 20px; border-radius:14px; background:#eef8ff; border:1px solid #cfeeff; color:#14354a; font-size:14px; line-height:1.9;">
              شكراً لاشتراكك في نشرة فينوكس إكسبرس. نرسل لك آخر الأخبار والتنبيهات والنصائح التي تساعدك على متابعة خدمات التوصيل بسهولة.
            </div>
          </div>
          <div style="padding:18px 24px; background:#f8fafc; border-top:1px solid #e8eef6; text-align:center; color:#64748b; font-size:13px; line-height:1.7;">
            هذه الرسالة أُرسلت لأن بريدك مشترك في النشرة البريدية لفينوكس إكسبرس.
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

    const recipientEmails = getUniqueSubscriberEmails(subscribers);

    if (!recipientEmails.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid newsletter subscriber emails found',
      });
    }

    const transporter = createMailTransport();
    const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;
    const fromName = process.env.MAIL_FROM_NAME || 'فينوكس إكسبرس';
    const logoPath = path.resolve(__dirname, '../../../frontend/src/Images/Phonex_logo.jpeg');
    const html = buildNewsletterHtml({ body, subject });
    const baseMailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
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
    };
    const sendResults = [];
    const recipientBatches = chunkArray(recipientEmails, getNewsletterBatchSize());
    const batchConcurrency = getNewsletterBatchConcurrency();

    for (let index = 0; index < recipientBatches.length; index += batchConcurrency) {
      const currentBatches = recipientBatches.slice(index, index + batchConcurrency);
      const currentResults = await Promise.all(
        currentBatches.map(async (recipientBatch) => {
          try {
            await transporter.sendMail({
              ...baseMailOptions,
              to: fromEmail,
              bcc: recipientBatch,
            });
            return {
              recipients: recipientBatch,
              success: true,
            };
          } catch (mailError) {
            return {
              recipients: recipientBatch,
              success: false,
              error: mailError.message,
            };
          }
        })
      );

      sendResults.push(...currentResults);
    }

    const sentCount = sendResults
      .filter((result) => result.success)
      .reduce((total, result) => total + result.recipients.length, 0);
    const failedResults = sendResults.filter((result) => !result.success);

    if (!sentCount) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send newsletter to all subscribers',
        errors: failedResults.map((result) => `${result.recipients.join(', ')}: ${result.error}`),
      });
    }

    const campaign = await NewsletterCampaign.create({
      employee_user_id: req.user?.id || null,
      subject,
      body,
      recipients_count: sentCount,
      sent_at: new Date(),
    });

    return res.status(failedResults.length ? 207 : 201).json({
      success: true,
      message: failedResults.length
        ? 'Newsletter sent with some failed recipients'
        : 'Newsletter sent successfully',
      data: {
        campaign,
        recipientsCount: sentCount,
        failedCount: failedResults.reduce((total, result) => total + result.recipients.length, 0),
        failedRecipients: failedResults.flatMap((result) =>
          result.recipients.map((email) => ({
            email,
            error: result.error,
          }))
        ),
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
