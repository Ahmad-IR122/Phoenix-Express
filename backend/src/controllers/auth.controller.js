'use strict';
const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const createAuth = async (req, res) => {
  try {
    const { email, phone, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      phone,
      password: hashedPassword,
      role,
    });

    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
    });

    return res.status(201).json({
      success: true,
      message: 'Auth user created successfully',
      data: createdUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create auth user',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};
const loginAuth = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    const user = await User.findOne({
      where: phone ? { phone } : { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone,
      },
      process.env.JWT_SECRET || "phoenix_secret_key",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      errors: [error.message],
    });
  }
};

const getAllAuths = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Auth users fetched successfully',
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch auth users',
      errors: [error.message],
    });
  }
};

const findAuthById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Auth user not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Auth user fetched successfully',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch auth user',
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
        message: 'Auth user not found',
      });
    }

    await user.update({
      email: email !== undefined ? email : user.email,
      phone: phone !== undefined ? phone : user.phone,
      password:
        password !== undefined ? await bcrypt.hash(password, 10) : user.password,
      role: role !== undefined ? role : user.role,
    });

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    return res.status(200).json({
      success: true,
      message: 'Auth user updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update auth user',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const deleteAuth = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Auth user not found',
      });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'Auth user deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete auth user',
      errors: [error.message],
    });
  }
};

module.exports = {
  createAuth,
  loginAuth,
  getAllAuths,
  findAuthById,
  updateAuth,
  deleteAuth,
};
