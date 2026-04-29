'use strict';

const { User, Customer, Employee, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const resetCodes = {};

const register = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { email, phone, password, role, fullName, address } = req.body;

    const user = await User.create(
      {
        email,
        phone,
        password,
        role,
      },
      { transaction: t }
    );

    if (role === 'employee') {
      await Employee.create(
        {
          user_id: user.id,
          full_name: fullName,
          address: address || '',
        },
        { transaction: t }
      );
    } else if (role === 'customer' || role === 'company') {
      await Customer.create(
        {
          user_id: user.id,
          customer_type: role === 'company' ? 'company' : 'individual',
        },
        { transaction: t }
      );
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
    await t.rollback();

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

    const user = await User.findOne({
      where: phone ? { phone } : { email },
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

    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "رقم الهاتف غير مسجل",
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    resetCodes[phone] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    return res.status(200).json({
      success: true,
      message: "تم إرسال رمز التحقق",
      mockCode: code,
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

    const savedCode = resetCodes[phone];

    if (!savedCode) {
      return res.status(400).json({
        success: false,
        message: "لم يتم طلب رمز تحقق لهذا الرقم",
      });
    }

    if (Date.now() > savedCode.expiresAt) {
      delete resetCodes[phone];

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

    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "رقم الهاتف غير مسجل",
      });
    }

    user.password = newPassword;
    await user.save();

    delete resetCodes[phone];

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

    const updateData = { email, phone, role };

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

module.exports = {
  register,
  login,
  forgotPassword,
  resetPasswordWithCode,
  getAllAuths,
  findAuthById,
  updateAuth,
  deleteAuth,
};