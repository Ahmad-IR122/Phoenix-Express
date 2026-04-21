'use strict';

const { User, Admin, Customer, Employee } = require('../models');
const bcrypt = require('bcrypt');

// Create user
const createUser = async (req, res) => {
  try {
    const { email, phone, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      phone,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create user',
      errors: error.errors ? error.errors.map(err => err.message) : [error.message],
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Admin,
          as: 'admin',
        },
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: Employee,
          as: 'employee',
        },
      ],
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      errors: [error.message],
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Admin,
          as: 'admin',
        },
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: Employee,
          as: 'employee',
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      errors: [error.message],
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, password, role } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.update({
      email: email !== undefined ? email : user.email,
      phone: phone !== undefined ? phone : user.phone,
      password: password !== undefined ? await bcrypt.hash(password, 10) : user.password,
      role: role !== undefined ? role : user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update user',
      errors: error.errors ? error.errors.map(err => err.message) : [error.message],
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      errors: [error.message],
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};