'use strict';

const { EmployeeWallet, Employee, WalletTransaction } = require('../models');

const walletIncludes = [
  {
    model: Employee,
    as: 'employee',
  },
  {
    model: WalletTransaction,
    as: 'transactions',
  },
];

const createWallet = async (req, res) => {
  try {
    const { employee_id, available_balance, total_earnings } = req.body;

    const wallet = await EmployeeWallet.create({
      employee_id,
      available_balance,
      total_earnings,
    });

    const createdWallet = await EmployeeWallet.findByPk(wallet.id, {
      include: walletIncludes,
    });

    return res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      data: createdWallet,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create wallet',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllWallets = async (req, res) => {
  try {
    const wallets = await EmployeeWallet.findAll({
      include: walletIncludes,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Wallets fetched successfully',
      data: wallets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch wallets',
      errors: [error.message],
    });
  }
};

const findWalletById = async (req, res) => {
  try {
    const { id } = req.params;
    const wallet = await EmployeeWallet.findByPk(id, {
      include: walletIncludes,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Wallet fetched successfully',
      data: wallet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet',
      errors: [error.message],
    });
  }
};

const updateWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, available_balance, total_earnings } = req.body;
    const wallet = await EmployeeWallet.findByPk(id);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    await wallet.update({
      employee_id: employee_id !== undefined ? employee_id : wallet.employee_id,
      available_balance:
        available_balance !== undefined
          ? available_balance
          : wallet.available_balance,
      total_earnings:
        total_earnings !== undefined ? total_earnings : wallet.total_earnings,
    });

    const updatedWallet = await EmployeeWallet.findByPk(id, {
      include: walletIncludes,
    });

    return res.status(200).json({
      success: true,
      message: 'Wallet updated successfully',
      data: updatedWallet,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update wallet',
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const deleteWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const wallet = await EmployeeWallet.findByPk(id);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    await wallet.destroy();

    return res.status(200).json({
      success: true,
      message: 'Wallet deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete wallet',
      errors: [error.message],
    });
  }
};

module.exports = {
  createWallet,
  getAllWallets,
  findWalletById,
  updateWallet,
  deleteWallet,
};
