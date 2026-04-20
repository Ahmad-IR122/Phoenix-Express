"use strict";
const { Admin, User, sequelize } = require("../models");
const bcrypt = require("bcrypt");
const createAdmin = async (req, res) => {
  let transaction;
  try {
    const { email, phone, password, role, is_active } = req.body;
    if (role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Role must be 'admin'",
      });
    }
    transaction = await sequelize.transaction();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create(
      {
        email,
        phone,
        password: hashedPassword,
        role,
      },
      { transaction },
    );

    const admin = await Admin.create(
      {
        user_id: user.id,
        is_active,
      },
      { transaction },
    );
    await transaction.commit();
    const result = await Admin.findByPk(admin.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
        },
      ],
    });
    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: result,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(400).json({
      success: false,
      message: "Failed to create admin",
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Admins fetched successfully",
      data: admins,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
      errors: [error.message],
    });
  }
};

const findAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
        },
      ],
    });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Admin fetched successfully",
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin",
      errors: [error.message],
    });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, password, role, is_active } = req.body;
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    const user = await User.findByPk(admin.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Associated user not found",
      });
    }
    await user.update({
      email: email !== undefined ? email : user.email,
      phone: phone !== undefined ? phone : user.phone,
      password:
        password !== undefined
          ? await bcrypt.hash(password, 10)
          : user.password,
      role: role !== undefined ? role : user.role,
    });
    await admin.update({
      is_active: is_active !== undefined ? is_active : admin.is_active,
    });
    const result = await Admin.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
        },
      ],
    });
    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update admin",
      errors: [error.message],
    });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    await admin.destroy();
    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete admin",
      errors: [error.message],
    });
  }
};
module.exports = {
  createAdmin,
  getAllAdmins,
  findAdminById,
  updateAdmin,
  deleteAdmin
};
