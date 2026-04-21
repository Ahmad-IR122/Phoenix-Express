"use strict";

const {
  Customer,
  User,
  IndividualCustomerProfile,
  CompanyCustomerProfile,
} = require("../models");

const customerIncludes = [
  {
    model: User,
    as: "user",
    attributes: { exclude: ["password"] },
  },
  {
    model: IndividualCustomerProfile,
    as: "individual_profile",
  },
  {
    model: CompanyCustomerProfile,
    as: "company_profile",
  },
];

const createCustomer = async (req, res) => {
  try {
    const { user_id, customer_type } = req.body;

    const customer = await Customer.create({
      user_id,
      customer_type,
    });

    const createdCustomer = await Customer.findByPk(customer.id, {
      include: customerIncludes,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: createdCustomer,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create customer",
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: customerIncludes,
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      errors: [error.message],
    });
  }
};

const findCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id, {
      include: customerIncludes,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      errors: [error.message],
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, customer_type } = req.body;
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await customer.update({
      user_id: user_id !== undefined ? user_id : customer.user_id,
      customer_type:
        customer_type !== undefined ? customer_type : customer.customer_type,
    });

    const updatedCustomer = await Customer.findByPk(id, {
      include: customerIncludes,
    });

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update customer",
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await customer.destroy();

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      errors: [error.message],
    });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  findCustomerById,
  updateCustomer,
  deleteCustomer,
};
