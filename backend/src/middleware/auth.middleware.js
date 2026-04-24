'use strict';

const crypto = require('crypto');
const { Employee, User } = require('../models');

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
};

const verifyJwtToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !token || token.split('.').length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = token.split('.');
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (expectedSignature !== signature) {
    return null;
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload));

  if (payload.exp && Date.now() >= payload.exp * 1000) {
    return null;
  }

  return payload;
};

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7).trim();
};

const extractUserId = (payload, req) => {
  return (
    payload?.id ||
    payload?.userId ||
    payload?.user_id ||
    req.headers['x-user-id'] ||
    req.headers['X-User-Id']
  );
};

const authenticateEmployee = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    const payload = verifyJwtToken(token);
    const userId = Number(extractUserId(payload, req));

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'role', 'email', 'phone'],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user not found',
      });
    }

    if (user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Employee access only',
      });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      isMockAuth: false,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication data',
      errors: [error.message],
    });
  }
};

const findMockEmployee = async (preferredUserId) => {
  const employeeInclude = [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'role', 'email', 'phone'],
      where: { role: 'employee' },
      required: true,
    },
  ];

  if (preferredUserId) {
    const preferredEmployee = await Employee.findOne({
      where: { user_id: preferredUserId },
      include: employeeInclude,
    });

    if (preferredEmployee) {
      return preferredEmployee;
    }
  }

  return Employee.findOne({
    where: { is_active: true },
    include: employeeInclude,
    order: [['id', 'ASC']],
  });
};

const mockEmployeeAuth = async (req, res, next) => {
  try {
    const preferredUserId = Number(
      req.headers['x-mock-user-id'] || process.env.MOCK_EMPLOYEE_USER_ID || 0
    );

    const employee = await findMockEmployee(preferredUserId || null);

    if (!employee || !employee.user) {
      req.user = {
        id: preferredUserId || null,
        role: 'employee',
        employeeId: employee?.id || null,
        email: employee?.user?.email || null,
        phone: employee?.user?.phone || null,
        isMockAuth: true,
        isFallbackMockAuth: true,
      };

      return next();
    }

    req.user = {
      id: employee.user.id,
      role: 'employee',
      employeeId: employee.id,
      email: employee.user.email,
      phone: employee.user.phone,
      isMockAuth: true,
      isFallbackMockAuth: false,
    };

    next();
  } catch (error) {
    req.user = {
      id: null,
      role: 'employee',
      employeeId: null,
      email: null,
      phone: null,
      isMockAuth: true,
      isFallbackMockAuth: true,
      mockAuthError: error.message,
    };

    return next();
  }
};

module.exports = {
  authenticateEmployee,
  mockEmployeeAuth,
};
