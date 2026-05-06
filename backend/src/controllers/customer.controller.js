"use strict";

const {
  Customer,
  User,
  IndividualCustomerProfile,
  CompanyCustomerProfile,
  sequelize,
} = require("../models");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizePhone = (value) => String(value || "").trim();
const normalizeName = (value) => String(value || "").trim();

const validateAuthenticatedProfilePayload = ({ name, email, phone }) => {
  if (!name) {
    return "الاسم مطلوب";
  }

  if (name.length < 2) {
    return "الاسم يجب أن يكون حرفين على الأقل";
  }

  if (!email) {
    return "البريد الإلكتروني مطلوب";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "يرجى إدخال بريد إلكتروني صحيح";
  }

  if (!phone) {
    return "رقم الهاتف مطلوب";
  }

  if (!/^[0-9]{7,15}$/.test(phone)) {
    return "رقم الهاتف يجب أن يحتوي على أرقام فقط من 7 إلى 15 رقم";
  }

  return null;
};

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

const getAuthenticatedCustomerProfile = async (req, res) => {
  try {
    let customer = await Customer.findOne({
      where: { user_id: req.user.id },
      include: customerIncludes,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    if (customer.customer_type === "individual" && !customer.individual_profile) {
      await IndividualCustomerProfile.create({
        customer_id: customer.id,
        full_name:
          req.user.fullName ||
          req.user.name ||
          customer.user?.fullName ||
          customer.user?.name ||
          "عميل فينوكس",
      });

      customer = await Customer.findOne({
        where: { user_id: req.user.id },
        include: customerIncludes,
      });
    }

    if (customer.customer_type === "company" && !customer.company_profile) {
      await CompanyCustomerProfile.create({
        customer_id: customer.id,
        company_name:
          req.user.fullName ||
          req.user.name ||
          customer.user?.fullName ||
          customer.user?.name ||
          "شركة فينوكس",
        company_phone: customer.user?.phone || "",
        company_location: "",
      });

      customer = await Customer.findOne({
        where: { user_id: req.user.id },
        include: customerIncludes,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer profile fetched successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer profile",
      errors: [error.message],
    });
  }
};

const updateAuthenticatedCustomerProfile = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const customer = await Customer.findOne({
      where: { user_id: req.user.id },
      include: customerIncludes,
      transaction,
    });

    if (!customer) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    const name = normalizeName(req.body.name);
    const email = normalizeEmail(req.body.email);
    const phone = normalizePhone(req.body.phone);
    const validationError = validateAuthenticatedProfilePayload({
      name,
      email,
      phone,
    });

    if (validationError) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const emailOwner = await User.findOne({ where: { email }, transaction });
    if (emailOwner && emailOwner.id !== req.user.id) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message: "هذا البريد الإلكتروني مستخدم من حساب آخر",
      });
    }

    const phoneOwner = await User.findOne({ where: { phone }, transaction });
    if (phoneOwner && phoneOwner.id !== req.user.id) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message: "رقم الهاتف مستخدم من حساب آخر",
      });
    }

    await customer.user.update({ email, phone }, { transaction });

    if (customer.customer_type === "company") {
      await CompanyCustomerProfile.upsert(
        {
          customer_id: customer.id,
          company_name: name,
          company_phone: phone,
          company_location: customer.company_profile?.company_location || "",
        },
        { transaction }
      );
    } else {
      await IndividualCustomerProfile.upsert(
        {
          customer_id: customer.id,
          full_name: name,
        },
        { transaction }
      );
    }

    await transaction.commit();

    const updatedCustomer = await Customer.findOne({
      where: { user_id: req.user.id },
      include: customerIncludes,
    });

    return res.status(200).json({
      success: true,
      message: "Customer profile updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    return res.status(400).json({
      success: false,
      message: "Failed to update customer profile",
      errors: error.errors
        ? error.errors.map((err) => err.message)
        : [error.message],
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
  getAuthenticatedCustomerProfile,
  updateAuthenticatedCustomerProfile,
  updateCustomer,
  deleteCustomer,
};
