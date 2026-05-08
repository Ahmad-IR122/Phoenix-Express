"use strict";

const {
  Customer,
  MerchantSettlement,
  Order,
  Region,
  User,
  IndividualCustomerProfile,
  CompanyCustomerProfile,
  sequelize,
} = require("../models");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizePhone = (value) => String(value || "").trim();
const normalizeName = (value) => String(value || "").trim();
const normalizeText = (value) => String(value || "").trim();
const toNumber = (value) => Number(value || 0);
const DEFAULT_CUSTOMER_NAME = "\u0639\u0645\u064A\u0644 \u0641\u064A\u0646\u0648\u0643\u0633";
const DEFAULT_COMPANY_NAME = "\u0634\u0631\u0643\u0629 \u0641\u064A\u0646\u0648\u0643\u0633";
const ALLOWED_SETTLEMENT_METHODS = ["cash", "bank_transfer", "ewallet"];

const getEmailLocalPart = (email) => normalizeEmail(email).split("@")[0];

const isEmailDerivedName = (name, email) => {
  const normalizedName = normalizeName(name).toLowerCase();
  return Boolean(normalizedName && normalizedName === getEmailLocalPart(email));
};

const sanitizeAuthenticatedCustomerProfile = (customer) => {
  if (!customer) return customer;

  const customerJson = typeof customer.toJSON === "function" ? customer.toJSON() : customer;
  const email = customerJson.user?.email;

  if (
    customerJson.individual_profile &&
    isEmailDerivedName(customerJson.individual_profile.full_name, email)
  ) {
    customerJson.individual_profile.full_name = DEFAULT_CUSTOMER_NAME;
  }

  if (
    customerJson.company_profile &&
    isEmailDerivedName(customerJson.company_profile.company_name, email)
  ) {
    customerJson.company_profile.company_name = DEFAULT_COMPANY_NAME;
  }

  return customerJson;
};

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

const mapMerchantSettlement = (settlement) => ({
  id: settlement.id,
  amount: toNumber(settlement.amount),
  status: settlement.status,
  payment_method: settlement.payment_method || "cash",
  settled_at: settlement.settled_at,
  requested_at: settlement.requested_at,
  customer_confirmed_at: settlement.customer_confirmed_at,
  bank_name: settlement.bank_name || "",
  bank_account_holder: settlement.bank_account_holder || "",
  bank_account_number: settlement.bank_account_number || "",
  bank_iban: settlement.bank_iban || "",
  notes: settlement.notes || "",
  created_at: settlement.createdAt,
});

const OPEN_SETTLEMENT_STATUSES = ["pending", "requested"];

const getCustomerSettlementSummary = async (customerId) => {
  const [deliveredFinancials, settlements] = await Promise.all([
    Order.findAll({
      attributes: [
        [
          sequelize.fn(
            "SUM",
            sequelize.literal('COALESCE("Order"."declared_value", 0)')
          ),
          "merchant_due",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal('COALESCE("region"."price", 0)')
          ),
          "phoenix_commission",
        ],
      ],
      where: {
        customer_id: customerId,
        status: "delivered",
      },
      include: [
        {
          model: Region,
          as: "region",
          attributes: [],
          required: false,
        },
      ],
      raw: true,
    }),
    MerchantSettlement.findAll({
      where: { customer_id: customerId },
      order: [["createdAt", "DESC"]],
    }),
  ]);

  const financialRow = deliveredFinancials?.[0] || {};
  const merchantDue = toNumber(financialRow.merchant_due);
  const phoenixCommission = toNumber(financialRow.phoenix_commission);
  const totalCollected = merchantDue + phoenixCommission;
  const settledAmount = settlements
    .filter((settlement) => settlement.status === "settled")
    .reduce((sum, settlement) => sum + toNumber(settlement.amount), 0);
  const pendingAmount = settlements
    .filter((settlement) => OPEN_SETTLEMENT_STATUSES.includes(settlement.status))
    .reduce((sum, settlement) => sum + toNumber(settlement.amount), 0);
  const remainingAmount = Math.max(merchantDue - settledAmount, 0);
  const availableRequestAmount = Math.max(merchantDue - settledAmount - pendingAmount, 0);

  return {
    total_collected: totalCollected,
    merchant_due: merchantDue,
    phoenix_commission: phoenixCommission,
    total_settled_amount: settledAmount,
    pending_settlement_amount: pendingAmount,
    remaining_settlement_amount: remainingAmount,
    available_settlement_request_amount: availableRequestAmount,
    settlements: settlements.map(mapMerchantSettlement),
  };
};

const getAuthenticatedCustomer = async (userId, transaction = undefined) =>
  Customer.findOne({
    where: { user_id: userId },
    include: customerIncludes,
    transaction,
  });

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
          req.user.full_name ||
          req.user.name ||
          customer.user?.full_name ||
          customer.user?.fullName ||
          customer.user?.name ||
          DEFAULT_CUSTOMER_NAME,
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
          req.user.full_name ||
          req.user.name ||
          customer.user?.full_name ||
          customer.user?.fullName ||
          customer.user?.name ||
          DEFAULT_COMPANY_NAME,
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
      data: sanitizeAuthenticatedCustomerProfile(customer),
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

    await customer.user.update({ email, phone, full_name: name }, { transaction });

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
      data: sanitizeAuthenticatedCustomerProfile(updatedCustomer),
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

const getAuthenticatedCustomerSettlements = async (req, res) => {
  try {
    const customer = await getAuthenticatedCustomer(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    const summary = await getCustomerSettlementSummary(customer.id);

    return res.status(200).json({
      success: true,
      message: "Customer settlements fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer settlements",
      errors: [error.message],
    });
  }
};

const requestAuthenticatedCustomerSettlement = async (req, res) => {
  try {
    const customer = await getAuthenticatedCustomer(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    const summary = await getCustomerSettlementSummary(customer.id);
    const availableAmount = toNumber(summary.available_settlement_request_amount);
    const requestedAmount = toNumber(req.body?.amount);
    const amount = requestedAmount > 0 ? requestedAmount : availableAmount;
    const paymentMethod = normalizeText(req.body?.payment_method);
    const bankName = normalizeText(req.body?.bank_name);
    const bankAccountHolder = normalizeText(req.body?.bank_account_holder);
    const bankAccountNumber = normalizeText(req.body?.bank_account_number);
    const bankIban = normalizeText(req.body?.bank_iban);
    const notes = normalizeText(req.body?.notes) || null;

    if (availableAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No amount is currently available for settlement",
      });
    }

    if (amount <= 0 || amount > availableAmount) {
      return res.status(400).json({
        success: false,
        message: "Settlement amount must be greater than zero and within the available balance",
      });
    }

    if (!ALLOWED_SETTLEMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "A valid settlement method is required",
      });
    }

    if (paymentMethod === "bank_transfer" && (!bankName || !bankAccountHolder || !bankAccountNumber)) {
      return res.status(400).json({
        success: false,
        message: "Bank name, account holder, and account number are required",
      });
    }

    const existingOpenSettlement = await MerchantSettlement.findOne({
      where: {
        customer_id: customer.id,
        status: OPEN_SETTLEMENT_STATUSES,
      },
      order: [["createdAt", "DESC"]],
    });

    if (existingOpenSettlement) {
      return res.status(400).json({
        success: false,
        message: "There is already an open settlement request awaiting admin or merchant action",
      });
    }

    const settlement = await MerchantSettlement.create({
      customer_id: customer.id,
      amount,
      status: "pending",
      payment_method: paymentMethod,
      requested_at: new Date(),
      bank_name: paymentMethod === "bank_transfer" ? bankName : null,
      bank_account_holder: paymentMethod === "bank_transfer" ? bankAccountHolder : null,
      bank_account_number: paymentMethod === "bank_transfer" ? bankAccountNumber : null,
      bank_iban: paymentMethod === "bank_transfer" ? bankIban || null : null,
      notes,
    });

    const refreshedSummary = await getCustomerSettlementSummary(customer.id);

    return res.status(201).json({
      success: true,
      message: "Settlement request submitted successfully",
      data: {
        settlement: mapMerchantSettlement(settlement),
        summary: refreshedSummary,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to request settlement",
      errors: [error.message],
    });
  }
};

const confirmAuthenticatedCustomerSettlement = async (req, res) => {
  try {
    const customer = await getAuthenticatedCustomer(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    const settlement = await MerchantSettlement.findOne({
      where: {
        id: req.params.id,
        customer_id: customer.id,
      },
    });

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement request not found",
      });
    }

    if (settlement.status !== "requested") {
      return res.status(400).json({
        success: false,
        message: "Settlement must be sent by admin before confirmation",
      });
    }

    if (settlement.customer_confirmed_at) {
      return res.status(400).json({
        success: false,
        message: "Settlement receipt is already confirmed",
      });
    }

    await settlement.update({
      status: "settled",
      customer_confirmed_at: new Date(),
    });

    const refreshedSummary = await getCustomerSettlementSummary(customer.id);

    return res.status(200).json({
      success: true,
      message: "Settlement receipt confirmed successfully",
      data: {
        settlement: mapMerchantSettlement(settlement),
        summary: refreshedSummary,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to confirm settlement receipt",
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
  getAuthenticatedCustomerProfile,
  updateAuthenticatedCustomerProfile,
  getAuthenticatedCustomerSettlements,
  requestAuthenticatedCustomerSettlement,
  confirmAuthenticatedCustomerSettlement,
  updateCustomer,
  deleteCustomer,
};
