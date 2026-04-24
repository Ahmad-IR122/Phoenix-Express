"use strict";

const {
  Customer,
  User,
  IndividualCustomerProfile,
  CompanyCustomerProfile,
  sequelize,
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

const getProfilePayload = (body = {}, customerType) => {
  if (customerType === "individual") {
    const profile = body.individual_profile || {};

    return {
      full_name:
        profile.full_name !== undefined ? profile.full_name : body.full_name,
    };
  }

  if (customerType === "company") {
    const profile = body.company_profile || {};

    return {
      company_name:
        profile.company_name !== undefined
          ? profile.company_name
          : body.company_name,
      company_phone:
        profile.company_phone !== undefined
          ? profile.company_phone
          : body.company_phone,
      company_location:
        profile.company_location !== undefined
          ? profile.company_location
          : body.company_location,
    };
  }

  return {};
};

const validateProfilePayload = (customerType, profilePayload) => {
  if (customerType === "individual" && !profilePayload.full_name) {
    return "full_name is required for individual customers";
  }

  if (customerType === "company" && !profilePayload.company_name) {
    return "company_name is required for company customers";
  }

  return null;
};

const syncCustomerProfile = async (
  customerId,
  customerType,
  profilePayload,
  transaction
) => {
  if (customerType === "individual") {
    await CompanyCustomerProfile.destroy({
      where: { customer_id: customerId },
      transaction,
    });

    await IndividualCustomerProfile.upsert(
      {
        customer_id: customerId,
        ...profilePayload,
      },
      { transaction }
    );

    return;
  }

  if (customerType === "company") {
    await IndividualCustomerProfile.destroy({
      where: { customer_id: customerId },
      transaction,
    });

    await CompanyCustomerProfile.upsert(
      {
        customer_id: customerId,
        ...profilePayload,
      },
      { transaction }
    );
  }
};

const createCustomer = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { user_id, customer_type } = req.body;
    const profilePayload = getProfilePayload(req.body, customer_type);
    const validationError = validateProfilePayload(
      customer_type,
      profilePayload
    );

    if (validationError) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Failed to create customer",
        errors: [validationError],
      });
    }

    const customer = await Customer.create({
      user_id,
      customer_type,
    }, { transaction });

    await syncCustomerProfile(
      customer.id,
      customer_type,
      profilePayload,
      transaction
    );

    await transaction.commit();

    const createdCustomer = await Customer.findByPk(customer.id, {
      include: customerIncludes,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: createdCustomer,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

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
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { user_id, customer_type } = req.body;
    const customer = await Customer.findByPk(id, { transaction });

    if (!customer) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const nextCustomerType =
      customer_type !== undefined ? customer_type : customer.customer_type;
    const profilePayload = getProfilePayload(req.body, nextCustomerType);
    const shouldUpdateProfile =
      customer_type !== undefined ||
      req.body.full_name !== undefined ||
      req.body.company_name !== undefined ||
      req.body.company_phone !== undefined ||
      req.body.company_location !== undefined ||
      req.body.individual_profile !== undefined ||
      req.body.company_profile !== undefined;

    if (shouldUpdateProfile) {
      const existingIndividualProfile =
        await IndividualCustomerProfile.findOne({
          where: { customer_id: customer.id },
          transaction,
        });
      const existingCompanyProfile = await CompanyCustomerProfile.findOne({
        where: { customer_id: customer.id },
        transaction,
      });

      const mergedProfilePayload =
        nextCustomerType === "individual"
          ? {
              full_name:
                profilePayload.full_name !== undefined
                  ? profilePayload.full_name
                  : existingIndividualProfile?.full_name,
            }
          : {
              company_name:
                profilePayload.company_name !== undefined
                  ? profilePayload.company_name
                  : existingCompanyProfile?.company_name,
              company_phone:
                profilePayload.company_phone !== undefined
                  ? profilePayload.company_phone
                  : existingCompanyProfile?.company_phone,
              company_location:
                profilePayload.company_location !== undefined
                  ? profilePayload.company_location
                  : existingCompanyProfile?.company_location,
            };

      const validationError = validateProfilePayload(
        nextCustomerType,
        mergedProfilePayload
      );

      if (validationError) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "Failed to update customer",
          errors: [validationError],
        });
      }

      await syncCustomerProfile(
        customer.id,
        nextCustomerType,
        mergedProfilePayload,
        transaction
      );
    }

    await customer.update({
      user_id: user_id !== undefined ? user_id : customer.user_id,
      customer_type:
        customer_type !== undefined ? customer_type : customer.customer_type,
    }, { transaction });

    await transaction.commit();

    const updatedCustomer = await Customer.findByPk(id, {
      include: customerIncludes,
    });

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

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
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id, { transaction });

    if (!customer) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await IndividualCustomerProfile.destroy({
      where: { customer_id: id },
      transaction,
    });
    await CompanyCustomerProfile.destroy({
      where: { customer_id: id },
      transaction,
    });
    await customer.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

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
