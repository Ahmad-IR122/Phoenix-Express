'use strict';

const { User, Customer, Employee, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const path = require("path");

const resetCodes = {};
let mailTransporter = null;
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizePhone = (value) => String(value || '').trim();
const normalizeName = (value) => String(value || '').trim();

const createMailTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Email service is not configured');
  }

  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 2,
      maxMessages: 20,
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return mailTransporter;
};

const sendPasswordResetEmail = async (email, code) => {
  const transporter = createMailTransport();
  const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;
  const fromName = process.env.MAIL_FROM_NAME || "ظپظٹظ†ظˆظƒط³ ط¥ظƒط³ط¨ط±ط³";

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: 'ط±ظ…ط² ط§ط³طھط¹ط§ط¯ط© ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± - ظپظٹظ†ظˆظƒط³ ط¥ظƒط³ط¨ط±ط³',
    text: `ط±ظ…ط² ط§ط³طھط¹ط§ط¯ط© ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظپظٹ ظپظٹظ†ظˆظƒط³ ط¥ظƒط³ط¨ط±ط³ ظ‡ظˆ: ${code}. طµط§ظ„ط­ ظ„ظ…ط¯ط© 5 ط¯ظ‚ط§ط¦ظ‚.`,
    html: `
      <div dir="rtl" style="margin:0; padding:0; background:#f4f7fb; font-family:Arial, sans-serif;">
        <div style="max-width:560px; margin:0 auto; padding:32px 16px;">
          <div style="background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e8eef6;">
            <div style="background:#38B6FF; padding:28px 24px; text-align:center;">
              <div style="display:inline-block; min-width:120px; padding:10px 18px; border-radius:999px; background:#ffffff; color:#38B6FF; font-size:16px; font-weight:800;">
                Phoenix Express
              </div>
              <h1 style="margin:18px 0 0; color:#ffffff; font-size:24px; font-weight:800;">ط§ط³طھط¹ط§ط¯ط© ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±</h1>
            </div>
            <div style="padding:30px 26px; color:#1f2937; line-height:1.8;">
              <p style="margin:0 0 14px; font-size:16px;">ظ…ط±ط­ط¨ط§ظ‹طŒ</p>
              <p style="margin:0 0 20px; font-size:16px;">ط§ط³طھط®ط¯ظ… ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚ ط§ظ„طھط§ظ„ظٹ ظ„ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط®ط§طµط© ط¨ط­ط³ط§ط¨ظƒ ظپظٹ ظپظٹظ†ظˆظƒط³ ط¥ظƒط³ط¨ط±ط³:</p>
              <div style="direction:ltr; text-align:center; margin:24px 0; padding:18px; border-radius:14px; background:#eef8ff; border:1px dashed #38B6FF; color:#0f172a; font-size:32px; font-weight:800; letter-spacing:8px;">
                ${code}
              </div>
              <p style="margin:0 0 8px; font-size:14px; color:#64748b;">ظ‡ط°ط§ ط§ظ„ط±ظ…ط² طµط§ظ„ط­ ظ„ظ…ط¯ط© 5 ط¯ظ‚ط§ط¦ظ‚ ظپظ‚ط·.</p>
              <p style="margin:0; font-size:14px; color:#64748b;">ط¥ط°ط§ ظ„ظ… طھط·ظ„ط¨ ط§ط³طھط¹ط§ط¯ط© ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±طŒ ظٹظ…ظƒظ†ظƒ طھط¬ط§ظ‡ظ„ ظ‡ط°ظ‡ ط§ظ„ط±ط³ط§ظ„ط©.</p>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

const sendPasswordResetEmailClean = async (email, code) => {
  const transporter = createMailTransport();
  const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;
  const fromName = process.env.MAIL_FROM_NAME || "Phoenix Express";
  const subject = "\u0631\u0645\u0632 \u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 - Phoenix Express";

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject,
    text: `\u0631\u0645\u0632 \u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0647\u0648: ${code}. \u0635\u0627\u0644\u062d \u0644\u0645\u062f\u0629 5 \u062f\u0642\u0627\u0626\u0642.`,
    html: `
      <div dir="rtl" style="margin:0; padding:0; background:#f4f7fb; font-family:Arial, sans-serif;">
        <div style="max-width:560px; margin:0 auto; padding:32px 16px;">
          <div style="background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e8eef6;">
            <div style="background:#38B6FF; padding:28px 24px; text-align:center;">
              <div style="display:inline-block; min-width:120px; padding:10px 18px; border-radius:999px; background:#ffffff; color:#38B6FF; font-size:16px; font-weight:800;">Phoenix Express</div>
              <h1 style="margin:18px 0 0; color:#ffffff; font-size:24px; font-weight:800;">\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</h1>
            </div>
            <div style="padding:30px 26px; color:#1f2937; line-height:1.8;">
              <p style="margin:0 0 14px; font-size:16px;">\u0645\u0631\u062d\u0628\u0627\u064b\u060c</p>
              <p style="margin:0 0 20px; font-size:16px;">\u0627\u0633\u062a\u062e\u062f\u0645 \u0631\u0645\u0632 \u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u062a\u0627\u0644\u064a \u0644\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631:</p>
              <div style="direction:ltr; text-align:center; margin:24px 0; padding:18px; border-radius:14px; background:#eef8ff; border:1px dashed #38B6FF; color:#0f172a; font-size:32px; font-weight:800; letter-spacing:8px;">${code}</div>
              <p style="margin:0 0 8px; font-size:14px; color:#64748b;">\u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632 \u0635\u0627\u0644\u062d \u0644\u0645\u062f\u0629 5 \u062f\u0642\u0627\u0626\u0642 \u0641\u0642\u0637.</p>
              <p style="margin:0; font-size:14px; color:#64748b;">\u0625\u0630\u0627 \u0644\u0645 \u062a\u0637\u0644\u0628 \u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u060c \u064a\u0645\u0643\u0646\u0643 \u062a\u062c\u0627\u0647\u0644 \u0647\u0630\u0647 \u0627\u0644\u0631\u0633\u0627\u0644\u0629.</p>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

/*
const createMailTransportOld = () => {
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendPasswordResetEmail = async (email, code) => {
  const transporter = createMailTransport();
  const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;
  const fromName = process.env.MAIL_FROM_NAME || "فينوكس إكسبرس";
  const logoPath = path.resolve(__dirname, "../../../frontend/src/Images/Phonex_logo.jpeg");

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: 'رمز استعادة كلمة المرور - فينوكس إكسبرس',
    text: `رمز استعادة كلمة المرور في فينوكس إكسبرس هو: ${code}. صالح لمدة 5 دقائق.`,
    html: `
      <div dir="rtl" style="margin:0; padding:0; background:#f4f7fb; font-family:Arial, sans-serif;">
        <div style="max-width:560px; margin:0 auto; padding:32px 16px;">
          <div style="background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e8eef6;">
            <div style="background:#38B6FF; padding:28px 24px; text-align:center;">
              <img src="cid:phoenix-logo" alt="فينوكس إكسبرس" style="width:92px; height:92px; object-fit:cover; border-radius:18px; background:#ffffff; padding:6px;" />
              <h1 style="margin:18px 0 0; color:#ffffff; font-size:24px; font-weight:800;">استعادة كلمة المرور</h1>
            </div>
            <div style="padding:30px 26px; color:#1f2937; line-height:1.8;">
              <p style="margin:0 0 14px; font-size:16px;">مرحباً،</p>
              <p style="margin:0 0 20px; font-size:16px;">استخدم رمز التحقق التالي لإعادة تعيين كلمة المرور الخاصة بحسابك في فينوكس إكسبرس:</p>
              <div style="direction:ltr; text-align:center; margin:24px 0; padding:18px; border-radius:14px; background:#eef8ff; border:1px dashed #38B6FF; color:#0f172a; font-size:32px; font-weight:800; letter-spacing:8px;">
                ${code}
              </div>
              <p style="margin:0 0 8px; font-size:14px; color:#64748b;">هذا الرمز صالح لمدة 5 دقائق فقط.</p>
              <p style="margin:0; font-size:14px; color:#64748b;">إذا لم تطلب استعادة كلمة المرور، يمكنك تجاهل هذه الرسالة.</p>
            </div>
          </div>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: "phoenix-logo.jpeg",
        path: logoPath,
        cid: "phoenix-logo",
      },
    ],
  });
};

*/

const register = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { email, phone, password, role, fullName, address } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);
    const normalizedFullName = normalizeName(fullName);
    const safeAccountName =
      normalizedFullName ||
      (role === 'company'
        ? "\u0634\u0631\u0643\u0629 \u0641\u064A\u0646\u0648\u0643\u0633"
        : "\u0639\u0645\u064A\u0644 \u0641\u064A\u0646\u0648\u0643\u0633");

    const user = await User.create(
      {
        email: normalizedEmail,
        phone: normalizedPhone,
        full_name: safeAccountName,
        password,
        role,
      },
      { transaction: t }
    );

    if (role === 'employee') {
      await Employee.create(
        {
          user_id: user.id,
          full_name: safeAccountName,
          address: address || '',
        },
        { transaction: t }
      );
    } else if (role === 'customer' || role === 'company') {
      const customer = await Customer.create(
        {
          user_id: user.id,
          customer_type: role === 'company' ? 'company' : 'individual',
        },
        { transaction: t }
      );

      if (role === 'company') {
        await sequelize.models.CompanyCustomerProfile.create(
          {
            customer_id: customer.id,
            company_name: safeAccountName,
            company_phone: normalizedPhone,
            company_location: address || '',
          },
          { transaction: t }
        );
      } else {
        await sequelize.models.IndividualCustomerProfile.create(
          {
            customer_id: customer.id,
            full_name: safeAccountName,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();

    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: ['customer', 'employee'],
    });

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: createdUser,
    });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }

    return res.status(400).json({
      success: false,
      message: 'فشل إنشاء الحساب',
      errors: error.errors ? error.errors.map((err) => err.message) : [error.message],
    });
  }
};

const login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedPhone && !normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "رقم الهاتف أو البريد الإلكتروني مطلوب",
      });
    }

    const user = await User.findOne({
      where: normalizedPhone ? { phone: normalizedPhone } : { email: normalizedEmail },
      include: ['customer', 'employee'],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "كلمة المرور خاطئة",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "phoenix_secret_key",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "فشل تسجيل الدخول",
      errors: [error.message],
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = normalizePhone(phone);

    const user = await User.findOne({ where: { phone: normalizedPhone } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "رقم الهاتف غير مسجل",
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    resetCodes[normalizedPhone] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    try {
      sendPasswordResetEmailClean(user.email, code).catch((emailError) => {
        console.error('Password reset email failed:', {
          to: user.email,
          message: emailError.message,
          code: emailError.code,
          command: emailError.command,
          response: emailError.response,
        });
        delete resetCodes[normalizedPhone];
      });
    } catch (smsError) {
      console.error('Password reset email failed:', {
        to: user.email,
        message: smsError.message,
        code: smsError.code,
        command: smsError.command,
        response: smsError.response,
      });
      delete resetCodes[normalizedPhone];

      return res.status(503).json({
        success: false,
        message: "خدمة البريد غير مفعلة حالياً. تواصل مع الدعم لاستعادة كلمة المرور.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم إرسال رمز التحقق",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "فشل إرسال رمز التحقق",
      errors: [error.message],
    });
  }
};

const resetPasswordWithCode = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    const normalizedPhone = normalizePhone(phone);

    const savedCode = resetCodes[normalizedPhone];

    if (!savedCode) {
      return res.status(400).json({
        success: false,
        message: "لم يتم طلب رمز تحقق لهذا الرقم",
      });
    }

    if (Date.now() > savedCode.expiresAt) {
      delete resetCodes[normalizedPhone];

      return res.status(400).json({
        success: false,
        message: "انتهت صلاحية رمز التحقق",
      });
    }

    if (savedCode.code !== code) {
      return res.status(400).json({
        success: false,
        message: "رمز التحقق غير صحيح",
      });
    }

    const user = await User.findOne({ where: { phone: normalizedPhone } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "رقم الهاتف غير مسجل",
      });
    }

    user.password = newPassword;
    await user.save();

    delete resetCodes[normalizedPhone];

    return res.status(200).json({
      success: true,
      message: "تم تغيير كلمة المرور بنجاح",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "فشل تغيير كلمة المرور",
      errors: error.errors ? error.errors.map((err) => err.message) : [error.message],
    });
  }
};

const getAllAuths = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: ['customer', 'employee'],
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [error.message],
    });
  }
};

const findAuthById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: ['customer', 'employee'],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [error.message],
    });
  }
};

const updateAuth = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, password, role } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    const updateData = {
      role,
      ...(email !== undefined ? { email: normalizeEmail(email) } : {}),
      ...(phone !== undefined ? { phone: normalizePhone(phone) } : {}),
    };

    if (password) {
      updateData.password = password;
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    return res.status(200).json({
      success: true,
      message: 'تم التحديث بنجاح',
      data: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      errors: [error.message],
    });
  }
};

const deleteAuth = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'تم حذف الحساب بنجاح',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [error.message],
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const body = req.body || {};
    const currentPassword = String(
      body.currentPassword || body.oldPassword || body.password || ''
    ).trim();
    const newPassword = String(body.newPassword || body.new_password || '').trim();
    const confirmPassword = String(
      body.confirmPassword || body.confirm_password || body.passwordConfirmation || ''
    ).trim();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirmation are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password confirmation does not match',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordValid =
      (await bcrypt.compare(currentPassword, user.password)) ||
      currentPassword === user.password;

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to change password',
      errors: error.errors ? error.errors.map((err) => err.message) : [error.message],
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPasswordWithCode,
  getAllAuths,
  findAuthById,
  updateAuth,
  deleteAuth,
  changePassword,
};
