'use strict';

const parsePositiveInteger = (value, fallback = null, max = 100) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return Math.min(parsedValue, max);
};

const buildLimitOption = (value, max = 100) => {
  const limit = parsePositiveInteger(value, null, max);
  return limit ? { limit } : {};
};

module.exports = {
  buildLimitOption,
  parsePositiveInteger,
};
