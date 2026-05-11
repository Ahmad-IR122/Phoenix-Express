export const AUTH_PHONE_REGEX = /^(056|059)\d{7}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export const isValidAuthPhone = (phone = "") =>
  AUTH_PHONE_REGEX.test(String(phone).trim());

export const isValidEmail = (email = "") =>
  EMAIL_REGEX.test(String(email).trim());

export const hasMinPasswordLength = (
  password = "",
  minPasswordLength = MIN_PASSWORD_LENGTH,
) => String(password).length >= minPasswordLength;
