'use strict';

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {
  NewsletterSubscriber,
  NewsletterCampaign,
  User,
} = require('../models');

const NEWSLETTER_SEND_JOB_TTL_MS = 60 * 60 * 1000;
const newsletterSendJobs = new Map();

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

const isDeliverableNewsletterEmail = (email) => {
  if (!isValidEmail(email)) return false;

  const domain = email.split('@').pop();
  const blockedDomains = new Set([
    'localhost',
    'phoenix-load.local',
  ]);

  return (
    !blockedDomains.has(domain) &&
    !domain.endsWith('.local') &&
    !domain.endsWith('.test') &&
    !domain.endsWith('.invalid') &&
    !domain.endsWith('.example')
  );
};

const getDeliverableNewsletterEmails = (subscribers) =>
  getUniqueSubscriberEmails(subscribers).filter(isDeliverableNewsletterEmail);

const getNewsletterSendConcurrency = () => {
  const configuredConcurrency = Number(process.env.NEWSLETTER_SEND_CONCURRENCY || 5);
  return Number.isInteger(configuredConcurrency) && configuredConcurrency > 0
    ? configuredConcurrency
    : 5;
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
    pool: true,
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    maxConnections: getNewsletterSendConcurrency(),
    maxMessages: 100,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 30000),
  });
};

const normalizeMailAddress = (value) => normalizeEmail(String(value || '').replace(/^.*<(.+)>.*$/, '$1'));

const getMailAddressList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(normalizeMailAddress).filter(isValidEmail);
  }

  return [normalizeMailAddress(value)].filter(isValidEmail);
};

const getMailDeliveryResult = ({ email, info }) => {
  const recipient = normalizeEmail(email);
  const accepted = getMailAddressList(info?.accepted);
  const rejected = getMailAddressList(info?.rejected);
  const pending = getMailAddressList(info?.pending);

  if (rejected.includes(recipient)) {
    return {
      email,
      success: false,
      error: info?.response || 'SMTP rejected the recipient',
      messageId: info?.messageId || null,
    };
  }

  if (accepted.length > 0 && !accepted.includes(recipient)) {
    return {
      email,
      success: false,
      error: info?.response || 'SMTP did not accept the recipient',
      messageId: info?.messageId || null,
    };
  }

  if (accepted.length === 0 && rejected.length === 0 && pending.length === 0 && !info?.messageId) {
    return {
      email,
      success: false,
      error: info?.response || 'SMTP did not confirm message acceptance',
      messageId: null,
    };
  }

  return {
    email,
    success: true,
    messageId: info?.messageId || null,
    response: info?.response || null,
  };
};

const sendNewsletterToRecipients = async ({ transporter, recipients, mailOptions, onResult }) => {
  const concurrency = Math.min(getNewsletterSendConcurrency(), recipients.length);
  const results = [];
  let nextRecipientIndex = 0;

  const sendNext = async () => {
    while (nextRecipientIndex < recipients.length) {
      const recipientIndex = nextRecipientIndex;
      nextRecipientIndex += 1;
      const email = recipients[recipientIndex];

      try {
        const info = await transporter.sendMail({
          ...mailOptions,
          to: email,
        });

        results[recipientIndex] = getMailDeliveryResult({
          email,
          info,
        });
      } catch (mailError) {
        results[recipientIndex] = {
          email,
          success: false,
          error: mailError.message,
        };
      }

      if (typeof onResult === 'function') {
        onResult(results[recipientIndex]);
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, sendNext));

  return results;
};

const createNewsletterMailOptions = ({ body, subject }) => {
  const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;
  const fromName = process.env.MAIL_FROM_NAME || 'ظپظٹظ†ظˆظƒط³ ط¥ظƒط³ط¨ط±ط³';
  const html = buildNewsletterHtml({ body, subject });

  return {
    from: `"${fromName}" <${fromEmail}>`,
    sender: fromEmail,
    replyTo: fromEmail,
    subject,
    text: body,
    html,
    headers: {
      'X-Phoenix-Newsletter': 'true',
    },
  };
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
            <p style="margin:0 0 6px; color:#dff3ff; font-size:14px; font-weight:700;">Phoenix Express</p>
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
  const activeSubscribers = await NewsletterSubscriber.findAll({
    where: { is_active: true },
    attributes: ['email'],
  });
  const deliverableSubscribersCount = getDeliverableNewsletterEmails(activeSubscribers).length;

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
    deliverableSubscribersCount,
    skippedSubscribersCount: subscribersCount - deliverableSubscribersCount,
    lastCampaign,
    lastSentAt,
    daysSinceLastSend,
    isSendDue,
    nextDueAt: lastSentAt
      ? new Date(new Date(lastSentAt).getTime() + 30 * 86400000)
      : new Date(),
  };
};

const cleanupExpiredNewsletterJobs = () => {
  const now = Date.now();

  for (const [jobId, job] of newsletterSendJobs.entries()) {
    if (job.expiresAt && job.expiresAt <= now) {
      newsletterSendJobs.delete(jobId);
    }
  }
};

const getPublicNewsletterJob = (job) => ({
  id: job.id,
  status: job.status,
  subject: job.subject,
  totalCount: job.totalCount,
  sentCount: job.sentCount,
  failedCount: job.failedCount,
  skippedCount: job.skippedCount || 0,
  startedAt: job.startedAt,
  finishedAt: job.finishedAt || null,
  error: job.error || null,
  result: job.result || null,
});

const runNewsletterSendJob = async ({ jobId, employeeUserId, subject, body, recipientEmails }) => {
  const job = newsletterSendJobs.get(jobId);
  if (!job) return;

  let transporter;

  try {
    transporter = createMailTransport();
    const sendResults = await sendNewsletterToRecipients({
      transporter,
      recipients: recipientEmails,
      mailOptions: createNewsletterMailOptions({ body, subject }),
      onResult: (result) => {
        if (result.success) {
          job.sentCount += 1;
        } else {
          job.failedCount += 1;
        }
      },
    });

    const failedResults = sendResults.filter((result) => !result.success);

    if (!job.sentCount) {
      job.status = 'failed';
      job.error = 'Failed to send newsletter to all subscribers';
      job.result = {
        recipientsCount: 0,
        failedCount: failedResults.length,
        failedRecipients: failedResults.map((result) => ({
          email: result.email,
          error: result.error,
        })),
      };
      return;
    }

    const campaign = await NewsletterCampaign.create({
      employee_user_id: employeeUserId || null,
      subject,
      body,
      recipients_count: job.sentCount,
      sent_at: new Date(),
    });

    job.status = failedResults.length ? 'partial' : 'completed';
    job.result = {
      campaign,
      recipientsCount: job.sentCount,
      failedCount: failedResults.length,
      failedRecipients: failedResults.map((result) => ({
        email: result.email,
        error: result.error,
      })),
    };
  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
  } finally {
    if (transporter) {
      transporter.close();
    }

    job.finishedAt = new Date();
    job.expiresAt = Date.now() + NEWSLETTER_SEND_JOB_TTL_MS;
  }
};

const subscribe = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!isDeliverableNewsletterEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'A real deliverable email is required',
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
    cleanupExpiredNewsletterJobs();

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

    const allSubscriberEmails = getUniqueSubscriberEmails(subscribers);
    const recipientEmails = allSubscriberEmails.filter(isDeliverableNewsletterEmail);
    const skippedCount = allSubscriberEmails.length - recipientEmails.length;

    if (!recipientEmails.length) {
      return res.status(400).json({
        success: false,
        message: 'No deliverable newsletter subscriber emails found',
      });
    }

    const verificationTransporter = createMailTransport();
    await verificationTransporter.verify();
    verificationTransporter.close();

    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      status: 'sending',
      subject,
      totalCount: recipientEmails.length,
      sentCount: 0,
      failedCount: 0,
      skippedCount,
      startedAt: new Date(),
      finishedAt: null,
      error: null,
      result: null,
    };

    newsletterSendJobs.set(jobId, job);
    setImmediate(() => {
      runNewsletterSendJob({
        jobId,
        employeeUserId: req.user?.id || null,
        subject,
        body,
        recipientEmails,
      }).catch((error) => {
        const activeJob = newsletterSendJobs.get(jobId);
        if (activeJob) {
          activeJob.status = 'failed';
          activeJob.error = error.message;
          activeJob.finishedAt = new Date();
          activeJob.expiresAt = Date.now() + NEWSLETTER_SEND_JOB_TTL_MS;
        }
      });
    });

    return res.status(202).json({
      success: true,
      message: 'Newsletter sending started',
      data: getPublicNewsletterJob(job),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send newsletter',
      errors: [error.message],
    });
  }
};

const getNewsletterSendStatus = async (req, res) => {
  cleanupExpiredNewsletterJobs();

  const job = newsletterSendJobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Newsletter send job not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Newsletter send status fetched successfully',
    data: getPublicNewsletterJob(job),
  });
};

module.exports = {
  subscribe,
  getEmployeeNewsletter,
  getNewsletterStatus,
  sendNewsletter,
  getNewsletterSendStatus,
};
