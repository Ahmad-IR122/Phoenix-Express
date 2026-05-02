'use strict';

const bcrypt = require('bcrypt');

const now = new Date();

const createRelativeDate = ({ days = 0, hours = 0, minutes = 0 } = {}) => {
  const value = new Date(now);
  value.setDate(value.getDate() + days);
  value.setHours(value.getHours() + hours);
  value.setMinutes(value.getMinutes() + minutes);
  return value;
};

const formatDateOnly = (date) => {
  return date.toISOString().slice(0, 10);
};

const buildPasswordHash = (plainPassword = 'Password123!') => {
  return bcrypt.hashSync(plainPassword, 10);
};

const buildTimestamps = (createdAtOffset = {}) => {
  const createdAt = createRelativeDate(createdAtOffset);
  return {
    created_at: createdAt,
    updated_at: createdAt,
  };
};

const makeUser = ({ id, email, phone, role, password = 'Password123!' }) => ({
  id,
  email,
  phone,
  password: buildPasswordHash(password),
  role,
  ...buildTimestamps({ days: -12 }),
});

const makeAdmin = ({ id, userId, isActive = true }) => ({
  id,
  user_id: userId,
  is_active: isActive,
  ...buildTimestamps({ days: -10 }),
});

const makeEmployee = ({ id, userId, fullName, address, availabilityStatus = 'available' }) => ({
  id,
  user_id: userId,
  full_name: fullName,
  address,
  is_active: true,
  availability_status: availabilityStatus,
  ...buildTimestamps({ days: -10 }),
});

const makeCustomer = ({ id, userId, customerType = 'individual' }) => ({
  id,
  user_id: userId,
  customer_type: customerType,
  ...buildTimestamps({ days: -11 }),
});

const makeVehicle = ({
  id,
  employeeId,
  brand,
  model,
  color,
  year,
  type,
  plateNumber,
  vehiclePhotoUrl,
}) => ({
  id,
  employee_id: employeeId,
  brand,
  model,
  color,
  year,
  type,
  plate_number: plateNumber,
  vehicle_photo_url: vehiclePhotoUrl,
  ...buildTimestamps({ days: -8 }),
});

const makeEmployeeDocument = ({
  id,
  employeeId,
  documentType,
  fileUrl,
  expiryDate,
  status,
}) => ({
  id,
  employee_id: employeeId,
  document_type: documentType,
  file_url: fileUrl,
  expiry_date: expiryDate,
  status,
  verified_by_admin_id: null,
  verified_at: null,
  ...buildTimestamps({ days: -7 }),
});

const makeEmployeeWallet = ({ id, employeeId, availableBalance, totalEarnings }) => ({
  id,
  employee_id: employeeId,
  available_balance: availableBalance,
  total_earnings: totalEarnings,
  ...buildTimestamps({ days: -7 }),
});

const makeWalletTransaction = ({
  id,
  walletId,
  orderId = null,
  type,
  amount,
  description,
  createdOffset,
}) => ({
  id,
  wallet_id: walletId,
  order_id: orderId,
  transaction_type: type,
  amount,
  description,
  ...buildTimestamps(createdOffset),
});

const makeWithdrawalRequest = ({
  id,
  employeeId,
  amount,
  withdrawalMethod,
  status,
  requestedOffset,
  processedOffset = null,
}) => ({
  id,
  employee_id: employeeId,
  amount,
  withdrawal_method: withdrawalMethod,
  status,
  requested_at: createRelativeDate(requestedOffset),
  processed_at: processedOffset ? createRelativeDate(processedOffset) : null,
  ...buildTimestamps(requestedOffset),
});

const makeRegion = ({ id, name, price }) => ({
  id,
  name,
  price,
  ...buildTimestamps({ days: -20 }),
});

const makeOrder = ({
  id,
  customerId,
  regionId,
  senderName,
  senderPhone,
  senderAddress,
  receiverName,
  receiverPhone,
  receiverAddress,
  originCity,
  destinationCity,
  packageSize,
  deliverySpeed,
  isFragile,
  declaredValue,
  packageDescription,
  status,
  deliveredAt = null,
  createdOffset,
}) => ({
  id,
  customer_id: customerId,
  region_id: regionId,
  sender_name: senderName,
  sender_phone: senderPhone,
  sender_address: senderAddress,
  receiver_name: receiverName,
  receiver_phone: receiverPhone,
  receiver_address: receiverAddress,
  origin_city: originCity,
  destination_city: destinationCity,
  package_size: packageSize,
  delivery_speed: deliverySpeed,
  is_fragile: isFragile,
  declared_value: declaredValue,
  package_description: packageDescription,
  status,
  delivered_at: deliveredAt,
  ...buildTimestamps(createdOffset),
});

const makeShipment = ({
  id,
  orderId,
  driverId,
  trackingNumber,
  currentStatus,
  estimatedDeliveryDate,
  updatedOffset,
}) => {
  const timestamps = buildTimestamps(updatedOffset);

  return {
    id,
    order_id: orderId,
    driver_id: driverId,
    tracking_number: trackingNumber,
    current_status: currentStatus,
    estimated_delivery_date: estimatedDeliveryDate,
    created_at: timestamps.created_at,
    updated_at: timestamps.updated_at,
  };
};

const makeTrackingUpdate = ({
  id,
  shipmentId,
  status,
  note,
  currentLocation,
  createdOffset,
}) => ({
  id,
  shipment_id: shipmentId,
  status,
  note,
  current_location: currentLocation,
  ...buildTimestamps(createdOffset),
});

const buildShipmentTimeline = ({ shipmentId, startId, finalStatus, route }) => {
  const statusSteps = [
    'accepted',
    'picked_up',
    'in_transit',
    'arrived_to_destination_city',
    'out_for_delivery',
    'delivered',
  ];

  const finalIndex = statusSteps.indexOf(finalStatus);
  const steps = statusSteps.slice(0, finalIndex + 1);

  return steps.map((status, index) =>
    makeTrackingUpdate({
      id: startId + index,
      shipmentId,
      status,
      note: route.notes[status],
      currentLocation: route.locations[status],
      createdOffset: { days: route.baseDays, hours: index - steps.length },
    })
  );
};

module.exports = {
  now,
  createRelativeDate,
  formatDateOnly,
  makeUser,
  makeAdmin,
  makeEmployee,
  makeCustomer,
  makeVehicle,
  makeEmployeeDocument,
  makeEmployeeWallet,
  makeWalletTransaction,
  makeWithdrawalRequest,
  makeRegion,
  makeOrder,
  makeShipment,
  makeTrackingUpdate,
  buildShipmentTimeline,
};
