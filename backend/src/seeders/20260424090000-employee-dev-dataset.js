'use strict';

const {
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
  buildShipmentTimeline,
} = require('./helpers/employee-dev-factories');

const TRUNCATE_TABLES = [
  'tracking_updates',
  'shipments',
  'merchant_settlements',
  'wallet_transactions',
  'withdrawal_requests',
  'employee_documents',
  'vehicles',
  'employee_wallets',
  'orders',
  'feedback',
  'company_customer_profiles',
  'individual_customer_profiles',
  'employees',
  'customers',
  'admins',
  'regions',
  'users',
];

const truncateDevTables = async (queryInterface, transaction) => {
  await queryInterface.sequelize.query(
    `TRUNCATE TABLE ${TRUNCATE_TABLES.join(', ')} RESTART IDENTITY CASCADE;`,
    { transaction }
  );
};

const syncSequenceToTableMax = async (queryInterface, tableName, transaction) => {
  await queryInterface.sequelize.query(
    `SELECT setval(
      pg_get_serial_sequence('${tableName}', 'id'),
      COALESCE((SELECT MAX(id) FROM ${tableName}), 0) + 1,
      false
    );`,
    { transaction }
  );
};

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await truncateDevTables(queryInterface, transaction);

      const regions = [
        makeRegion({ id: 1, name: 'west_bank', price: 20 }),
        makeRegion({ id: 2, name: 'jerusalem', price: 30 }),
        makeRegion({ id: 3, name: 'inside', price: 70 }),
      ];

      const users = [
        makeUser({
          id: 1,
          email: 'admin@phoenix.ps',
          phone: '0599000000',
          role: 'admin',
          password: '12345',
        }),
        makeUser({
          id: 2,
          email: 'ahmad.employee@phoenix.ps',
          phone: '0599000001',
          role: 'employee',
        }),
        makeUser({
          id: 3,
          email: 'samer.employee@phoenix.ps',
          phone: '0599000002',
          role: 'employee',
        }),
        makeUser({
          id: 4,
          email: 'lama.customer@phoenix.ps',
          phone: '0599000003',
          role: 'customer',
        }),
        makeUser({
          id: 5,
          email: 'yousef.customer@phoenix.ps',
          phone: '0599000004',
          role: 'customer',
        }),
        makeUser({
          id: 6,
          email: 'nour.customer@phoenix.ps',
          phone: '0599000005',
          role: 'customer',
        }),
        makeUser({
          id: 7,
          email: 'merchant.demo@phoenix.ps',
          phone: '0599000006',
          role: 'customer',
        }),
      ];

      const admins = [
        makeAdmin({
          id: 1,
          userId: 1,
        }),
      ];

      const employees = [
        makeEmployee({
          id: 1,
          userId: 2,
          fullName: 'أحمد أبو الهيجا',
          address: 'نابلس - رفيديا - شارع الجامعة',
          availabilityStatus: 'available',
        }),
        makeEmployee({
          id: 2,
          userId: 3,
          fullName: 'سامر دويكات',
          address: 'رام الله - الطيرة - قرب الدوار',
          availabilityStatus: 'busy',
        }),
      ];

      const customers = [
        makeCustomer({ id: 1, userId: 4 }),
        makeCustomer({ id: 2, userId: 5 }),
        makeCustomer({ id: 3, userId: 6 }),
        makeCustomer({ id: 4, userId: 7, customerType: 'company' }),
      ];

      const companyCustomerProfiles = [
        {
          id: 1,
          customer_id: 4,
          company_name: 'تاجر تجريبي',
          company_phone: '0599000006',
          company_location: 'رام الله',
          created_at: createRelativeDate({ days: -10 }),
          updated_at: createRelativeDate({ days: -10 }),
        },
      ];

      const vehicles = [
        makeVehicle({
          id: 1,
          employeeId: 1,
          brand: 'Honda',
          model: 'CBF',
          color: 'أبيض',
          year: 2021,
          type: 'دراجة نارية',
          plateNumber: '32-145-9',
          vehiclePhotoUrl: 'https://example.com/vehicles/employee-1.jpg',
        }),
        makeVehicle({
          id: 2,
          employeeId: 2,
          brand: 'Hyundai',
          model: 'i10',
          color: 'فضي',
          year: 2020,
          type: 'سيارة صغيرة',
          plateNumber: '41-278-6',
          vehiclePhotoUrl: 'https://example.com/vehicles/employee-2.jpg',
        }),
      ];

      const documents = [
        makeEmployeeDocument({
          id: 1,
          employeeId: 1,
          documentType: 'driving_license',
          fileUrl: 'https://example.com/docs/ahmad-driving-license.pdf',
          expiryDate: formatDateOnly(createRelativeDate({ days: 340 })),
          status: 'valid',
        }),
        makeEmployeeDocument({
          id: 2,
          employeeId: 1,
          documentType: 'vehicle_license',
          fileUrl: 'https://example.com/docs/ahmad-vehicle-license.pdf',
          expiryDate: formatDateOnly(createRelativeDate({ days: 21 })),
          status: 'expiring_soon',
        }),
        makeEmployeeDocument({
          id: 3,
          employeeId: 1,
          documentType: 'vehicle_insurance',
          fileUrl: 'https://example.com/docs/ahmad-insurance.pdf',
          expiryDate: formatDateOnly(createRelativeDate({ days: -12 })),
          status: 'expired',
        }),
        makeEmployeeDocument({
          id: 4,
          employeeId: 1,
          documentType: 'national_id',
          fileUrl: 'https://example.com/docs/ahmad-national-id.pdf',
          expiryDate: formatDateOnly(createRelativeDate({ days: 720 })),
          status: 'valid',
        }),
        makeEmployeeDocument({
          id: 5,
          employeeId: 2,
          documentType: 'driving_license',
          fileUrl: 'https://example.com/docs/samer-driving-license.pdf',
          expiryDate: formatDateOnly(createRelativeDate({ days: 280 })),
          status: 'valid',
        }),
        makeEmployeeDocument({
          id: 6,
          employeeId: 2,
          documentType: 'vehicle_license',
          fileUrl: 'https://example.com/docs/samer-vehicle-license.pdf',
          expiryDate: formatDateOnly(createRelativeDate({ days: 14 })),
          status: 'expiring_soon',
        }),
        makeEmployeeDocument({
          id: 7,
          employeeId: 2,
          documentType: 'vehicle_insurance',
          fileUrl: 'https://example.com/docs/samer-insurance.pdf',
          expiryDate: formatDateOnly(createRelativeDate({ days: 180 })),
          status: 'valid',
        }),
        makeEmployeeDocument({
          id: 8,
          employeeId: 2,
          documentType: 'national_id',
          fileUrl: 'https://example.com/docs/samer-national-id.pdf',
          expiryDate: formatDateOnly(createRelativeDate({ days: -40 })),
          status: 'expired',
        }),
      ];

      const wallets = [
        makeEmployeeWallet({
          id: 1,
          employeeId: 1,
          availableBalance: 195,
          totalEarnings: 280,
        }),
        makeEmployeeWallet({
          id: 2,
          employeeId: 2,
          availableBalance: 240,
          totalEarnings: 360,
        }),
      ];

      const deliveredTodayAt = createRelativeDate({ hours: -2 });
      const deliveredYesterdayAt = createRelativeDate({ days: -1, hours: -3 });

      const orders = [
        makeOrder({
          id: 1,
          customerId: 1,
          regionId: 1,
          senderName: 'مكتبة النجاح',
          senderPhone: '0598111101',
          senderAddress: 'نابلس - شارع الجامعة - مقابل البوابة الرئيسية',
          receiverName: 'لما عودة',
          receiverPhone: '0598222201',
          receiverAddress: 'جنين - الحي الشرقي - قرب المستشفى',
          originCity: 'نابلس',
          destinationCity: 'جنين',
          packageSize: 'small',
          deliverySpeed: 'normal',
          isFragile: false,
          declaredValue: 85,
          packageDescription: 'كتب جامعية ودفاتر',
          status: 'delivered',
          deliveredAt: deliveredTodayAt,
          createdOffset: { days: -1, hours: -4 },
        }),
        makeOrder({
          id: 2,
          customerId: 2,
          regionId: 2,
          senderName: 'صيدلية الهدى',
          senderPhone: '0598111102',
          senderAddress: 'رام الله - شارع ركب - بجانب البنك',
          receiverName: 'يوسف بركات',
          receiverPhone: '0598222202',
          receiverAddress: 'القدس - بيت حنينا - قرب الدوار',
          originCity: 'رام الله',
          destinationCity: 'القدس',
          packageSize: 'small',
          deliverySpeed: 'urgent',
          isFragile: true,
          declaredValue: 120,
          packageDescription: 'أدوية ومستحضرات طبية',
          status: 'out_for_delivery',
          createdOffset: { hours: -8 },
        }),
        makeOrder({
          id: 3,
          customerId: 3,
          regionId: 1,
          senderName: 'متجر التقنية الحديثة',
          senderPhone: '0598111103',
          senderAddress: 'نابلس - شارع فيصل - عمارة النخيل',
          receiverName: 'نور شقير',
          receiverPhone: '0598222203',
          receiverAddress: 'طولكرم - الحي الشمالي - قرب البلدية',
          originCity: 'نابلس',
          destinationCity: 'طولكرم',
          packageSize: 'medium',
          deliverySpeed: 'express',
          isFragile: true,
          declaredValue: 420,
          packageDescription: 'سماعات وأكسسوارات إلكترونية',
          status: 'in_transit',
          createdOffset: { days: -1, hours: -1 },
        }),
        makeOrder({
          id: 4,
          customerId: 1,
          regionId: 3,
          senderName: 'حلويات العكر',
          senderPhone: '0598111104',
          senderAddress: 'رام الله - شارع الإرسال - مقابل المخبز',
          receiverName: 'رائد خضر',
          receiverPhone: '0598222204',
          receiverAddress: 'حيفا - الحليصة - شارع الكرمة',
          originCity: 'رام الله',
          destinationCity: 'حيفا',
          packageSize: 'large',
          deliverySpeed: 'normal',
          isFragile: false,
          declaredValue: 160,
          packageDescription: 'صندوق ضيافة وحلويات',
          status: 'picked_up',
          createdOffset: { days: -1, hours: -6 },
        }),
        makeOrder({
          id: 5,
          customerId: 2,
          regionId: 2,
          senderName: 'ورود القدس',
          senderPhone: '0598111105',
          senderAddress: 'القدس - شعفاط - شارع السوق',
          receiverName: 'منة قبها',
          receiverPhone: '0598222205',
          receiverAddress: 'رام الله - بيتونيا - قرب المحكمة',
          originCity: 'القدس',
          destinationCity: 'رام الله',
          packageSize: 'small',
          deliverySpeed: 'urgent',
          isFragile: true,
          declaredValue: 95,
          packageDescription: 'بوكيه ورد وهدايا خفيفة',
          status: 'accepted',
          createdOffset: { hours: -3 },
        }),
        makeOrder({
          id: 6,
          customerId: 3,
          regionId: 3,
          senderName: 'شركة الرواد',
          senderPhone: '0598111106',
          senderAddress: 'الخليل - عين سارة - عمارة الرواد',
          receiverName: 'هديل زيدان',
          receiverPhone: '0598222206',
          receiverAddress: 'يافا - شارع ييفت - قرب الميناء',
          originCity: 'الخليل',
          destinationCity: 'يافا',
          packageSize: 'medium',
          deliverySpeed: 'express',
          isFragile: false,
          declaredValue: 260,
          packageDescription: 'مستندات وعينات تجارية',
          status: 'delivered',
          deliveredAt: deliveredYesterdayAt,
          createdOffset: { days: -2, hours: -5 },
        }),
        makeOrder({
          id: 7,
          customerId: 2,
          regionId: 1,
          senderName: 'محمصة البلد',
          senderPhone: '0598111107',
          senderAddress: 'نابلس - دوار الشهداء - قرب السوق',
          receiverName: 'رنا حماد',
          receiverPhone: '0598222207',
          receiverAddress: 'جنين - الحي الغربي - عمارة الندى',
          originCity: 'نابلس',
          destinationCity: 'جنين',
          packageSize: 'small',
          deliverySpeed: 'normal',
          isFragile: false,
          declaredValue: 60,
          packageDescription: 'قهوة وبن محمص',
          status: 'accepted',
          createdOffset: { hours: -1 },
        }),
        makeOrder({
          id: 8,
          customerId: 1,
          regionId: 2,
          senderName: 'صيدلية المدينة',
          senderPhone: '0598111108',
          senderAddress: 'رام الله - شارع المكتبة - بجانب الدوار',
          receiverName: 'ليث دراغمة',
          receiverPhone: '0598222208',
          receiverAddress: 'القدس - بيت حنينا - قرب المسجد',
          originCity: 'رام الله',
          destinationCity: 'القدس',
          packageSize: 'small',
          deliverySpeed: 'urgent',
          isFragile: true,
          declaredValue: 110,
          packageDescription: 'أدوية ومستلزمات صحية',
          status: 'picked_up',
          createdOffset: { days: -1, hours: -2 },
        }),
        makeOrder({
          id: 9,
          customerId: 3,
          regionId: 1,
          senderName: 'مكتبة الرواد',
          senderPhone: '0598111109',
          senderAddress: 'نابلس - شارع سفيان - مقابل البلدية',
          receiverName: 'سلمى نزال',
          receiverPhone: '0598222209',
          receiverAddress: 'طولكرم - الحي الجنوبي - قرب الجامعة',
          originCity: 'نابلس',
          destinationCity: 'طولكرم',
          packageSize: 'medium',
          deliverySpeed: 'express',
          isFragile: false,
          declaredValue: 180,
          packageDescription: 'قرطاسية وملفات جامعية',
          status: 'in_transit',
          createdOffset: { days: -1, hours: -3 },
        }),
        makeOrder({
          id: 10,
          customerId: 2,
          regionId: 3,
          senderName: 'شركة النورس',
          senderPhone: '0598111110',
          senderAddress: 'رام الله - الماصيون - برج الريحان',
          receiverName: 'آية جابر',
          receiverPhone: '0598222210',
          receiverAddress: 'يافا - شارع الميناء - قرب الساحة',
          originCity: 'رام الله',
          destinationCity: 'يافا',
          packageSize: 'large',
          deliverySpeed: 'normal',
          isFragile: false,
          declaredValue: 230,
          packageDescription: 'صندوق منتجات تجارية',
          status: 'arrived_to_destination_city',
          createdOffset: { days: -2, hours: -4 },
        }),
        makeOrder({
          id: 11,
          customerId: 1,
          regionId: 2,
          senderName: 'ورود الشام',
          senderPhone: '0598111111',
          senderAddress: 'القدس - شعفاط - قرب السوق',
          receiverName: 'سارة المصري',
          receiverPhone: '0598222211',
          receiverAddress: 'رام الله - الطيرة - بجانب الحديقة',
          originCity: 'القدس',
          destinationCity: 'رام الله',
          packageSize: 'small',
          deliverySpeed: 'urgent',
          isFragile: true,
          declaredValue: 90,
          packageDescription: 'هدايا وبوكيه ورد',
          status: 'out_for_delivery',
          createdOffset: { hours: -6 },
        }),
        makeOrder({
          id: 12,
          customerId: 3,
          regionId: 1,
          senderName: 'متجر البيان',
          senderPhone: '0598111112',
          senderAddress: 'نابلس - شارع الجامعة - قرب المكتبة',
          receiverName: 'محمود جرار',
          receiverPhone: '0598222212',
          receiverAddress: 'قلقيلية - وسط البلد - قرب البلدية',
          originCity: 'نابلس',
          destinationCity: 'قلقيلية',
          packageSize: 'medium',
          deliverySpeed: 'normal',
          isFragile: false,
          declaredValue: 140,
          packageDescription: 'ملفات مكتبية وطابعة صغيرة',
          status: 'delivered',
          deliveredAt: createRelativeDate({ hours: -4 }),
          createdOffset: { days: -1, hours: -7 },
        }),
        makeOrder({
          id: 13,
          customerId: 2,
          regionId: 2,
          senderName: 'متجر الأناقة',
          senderPhone: '0598111113',
          senderAddress: 'القدس - شارع الزهراء - قرب البريد',
          receiverName: 'سارة أحمد',
          receiverPhone: '0598222213',
          receiverAddress: 'رام الله - حي الإرسال - عمارة الهدى',
          originCity: 'القدس',
          destinationCity: 'رام الله',
          packageSize: 'small',
          deliverySpeed: 'express',
          isFragile: false,
          declaredValue: 150,
          packageDescription: 'ملابس وإكسسوارات خفيفة',
          status: 'pending',
          createdOffset: { hours: -2 },
        }),
        makeOrder({
          id: 14,
          customerId: 1,
          regionId: 3,
          senderName: 'مكتبة العلم',
          senderPhone: '0598111114',
          senderAddress: 'نابلس - رفيديا - قرب الجامعة',
          receiverName: 'محمد خالد',
          receiverPhone: '0598222214',
          receiverAddress: 'حيفا - شارع الجبل - قرب الدوار',
          originCity: 'نابلس',
          destinationCity: 'حيفا',
          packageSize: 'large',
          deliverySpeed: 'urgent',
          isFragile: true,
          declaredValue: 320,
          packageDescription: 'كتب جامعية وأجهزة مكتبية',
          status: 'confirmed',
          createdOffset: { hours: -5 },
        }),
      ];

      const shipments = [
        makeShipment({
          id: 1,
          orderId: 1,
          driverId: 1,
          trackingNumber: 'PHX-1001',
          currentStatus: 'delivered',
          estimatedDeliveryDate: deliveredTodayAt,
          updatedOffset: { hours: -2 },
        }),
        makeShipment({
          id: 2,
          orderId: 2,
          driverId: 1,
          trackingNumber: 'PHX-1002',
          currentStatus: 'out_for_delivery',
          estimatedDeliveryDate: createRelativeDate({ hours: 2 }),
          updatedOffset: { hours: -1 },
        }),
        makeShipment({
          id: 3,
          orderId: 3,
          driverId: 1,
          trackingNumber: 'PHX-1003',
          currentStatus: 'in_transit',
          estimatedDeliveryDate: createRelativeDate({ hours: 6 }),
          updatedOffset: { hours: -4 },
        }),
        makeShipment({
          id: 4,
          orderId: 4,
          driverId: 1,
          trackingNumber: 'PHX-1004',
          currentStatus: 'picked_up',
          estimatedDeliveryDate: createRelativeDate({ days: 1, hours: 1 }),
          updatedOffset: { hours: -5 },
        }),
        makeShipment({
          id: 5,
          orderId: 5,
          driverId: 2,
          trackingNumber: 'PHX-2001',
          currentStatus: 'accepted',
          estimatedDeliveryDate: createRelativeDate({ hours: 5 }),
          updatedOffset: { hours: -2 },
        }),
        makeShipment({
          id: 6,
          orderId: 6,
          driverId: 2,
          trackingNumber: 'PHX-2002',
          currentStatus: 'delivered',
          estimatedDeliveryDate: deliveredYesterdayAt,
          updatedOffset: { days: -1, hours: -3 },
        }),
        makeShipment({
          id: 7,
          orderId: 7,
          driverId: 1,
          trackingNumber: 'PHX-1007',
          currentStatus: 'accepted',
          estimatedDeliveryDate: createRelativeDate({ hours: 4 }),
          updatedOffset: { minutes: -45 },
        }),
        makeShipment({
          id: 8,
          orderId: 8,
          driverId: 1,
          trackingNumber: 'PHX-1008',
          currentStatus: 'picked_up',
          estimatedDeliveryDate: createRelativeDate({ hours: 3 }),
          updatedOffset: { hours: -2 },
        }),
        makeShipment({
          id: 9,
          orderId: 9,
          driverId: 1,
          trackingNumber: 'PHX-1009',
          currentStatus: 'in_transit',
          estimatedDeliveryDate: createRelativeDate({ hours: 7 }),
          updatedOffset: { hours: -3 },
        }),
        makeShipment({
          id: 10,
          orderId: 10,
          driverId: 1,
          trackingNumber: 'PHX-1010',
          currentStatus: 'arrived_to_destination_city',
          estimatedDeliveryDate: createRelativeDate({ hours: 9 }),
          updatedOffset: { hours: -4 },
        }),
        makeShipment({
          id: 11,
          orderId: 11,
          driverId: 1,
          trackingNumber: 'PHX-1011',
          currentStatus: 'out_for_delivery',
          estimatedDeliveryDate: createRelativeDate({ hours: 1 }),
          updatedOffset: { hours: -1 },
        }),
        makeShipment({
          id: 12,
          orderId: 12,
          driverId: 1,
          trackingNumber: 'PHX-1012',
          currentStatus: 'delivered',
          estimatedDeliveryDate: createRelativeDate({ hours: -4 }),
          updatedOffset: { hours: -4 },
        }),
        makeShipment({
          id: 13,
          orderId: 14,
          driverId: null,
          trackingNumber: 'PHX-1014',
          currentStatus: 'accepted',
          estimatedDeliveryDate: createRelativeDate({ hours: 10 }),
          updatedOffset: { hours: -2 },
        }),
      ];

      const walletTransactions = [
        makeWalletTransaction({
          id: 1,
          walletId: 1,
          orderId: 1,
          type: 'earning',
          amount: 70,
          description: 'عمولة شحنة PHX-1001',
          createdOffset: { hours: -2 },
        }),
        makeWalletTransaction({
          id: 2,
          walletId: 1,
          orderId: null,
          type: 'earning',
          amount: 120,
          description: 'أرباح أسبوعية مرحّلة',
          createdOffset: { days: -1, hours: -1 },
        }),
        makeWalletTransaction({
          id: 3,
          walletId: 1,
          orderId: null,
          type: 'earning',
          amount: 90,
          description: 'عمولة شحنات نهاية الأسبوع',
          createdOffset: { days: -4, hours: -2 },
        }),
        makeWalletTransaction({
          id: 4,
          walletId: 1,
          orderId: null,
          type: 'adjustment',
          amount: 15,
          description: 'تعديل رصيد بسبب مكافأة أداء',
          createdOffset: { days: -3 },
        }),
        makeWalletTransaction({
          id: 5,
          walletId: 1,
          orderId: null,
          type: 'handover',
          amount: -100,
          description: 'خصم عملية سحب مدفوعة',
          createdOffset: { days: -5 },
        }),
        makeWalletTransaction({
          id: 6,
          walletId: 2,
          orderId: 6,
          type: 'earning',
          amount: 140,
          description: 'عمولة شحنة PHX-2002',
          createdOffset: { days: -1, hours: -3 },
        }),
        makeWalletTransaction({
          id: 7,
          walletId: 2,
          orderId: null,
          type: 'earning',
          amount: 160,
          description: 'أرباح مجمعة من شحنات داخلية',
          createdOffset: { days: -2, hours: -4 },
        }),
        makeWalletTransaction({
          id: 8,
          walletId: 2,
          orderId: null,
          type: 'earning',
          amount: 60,
          description: 'عمولة إضافية على تسليم سريع',
          createdOffset: { days: -6 },
        }),
        makeWalletTransaction({
          id: 9,
          walletId: 2,
          orderId: null,
          type: 'handover',
          amount: -110,
          description: 'خصم سحب تمت معالجته',
          createdOffset: { days: -7 },
        }),
        makeWalletTransaction({
          id: 10,
          walletId: 2,
          orderId: null,
          type: 'adjustment',
          amount: -10,
          description: 'تسوية رصيد بسيطة',
          createdOffset: { days: -8 },
        }),
      ];

      const withdrawalRequests = [
        makeWithdrawalRequest({
          id: 1,
          employeeId: 1,
          amount: 80,
          withdrawalMethod: 'bank_transfer',
          status: 'pending',
          requestedOffset: { days: -1, hours: -2 },
        }),
        makeWithdrawalRequest({
          id: 2,
          employeeId: 1,
          amount: 100,
          withdrawalMethod: 'cash',
          status: 'paid',
          requestedOffset: { days: -5, hours: -1 },
          processedOffset: { days: -4, hours: -5 },
        }),
        makeWithdrawalRequest({
          id: 3,
          employeeId: 1,
          amount: 50,
          withdrawalMethod: 'ewallet',
          status: 'rejected',
          requestedOffset: { days: -8 },
          processedOffset: { days: -7, hours: -3 },
        }),
        makeWithdrawalRequest({
          id: 4,
          employeeId: 2,
          amount: 120,
          withdrawalMethod: 'bank_transfer',
          status: 'approved',
          requestedOffset: { days: -3, hours: -4 },
          processedOffset: { days: -2, hours: -6 },
        }),
      ];

      const trackingUpdates = [
        ...buildShipmentTimeline({
          shipmentId: 1,
          startId: 1,
          finalStatus: 'delivered',
          route: {
            baseDays: -1,
            locations: {
              accepted: 'نابلس',
              picked_up: 'نابلس - رفيديا',
              in_transit: 'طريق نابلس - جنين',
              arrived_to_destination_city: 'جنين',
              out_for_delivery: 'جنين - الحي الشرقي',
              delivered: 'جنين - قرب المستشفى',
            },
            notes: {
              accepted: 'تم قبول الشحنة وإسنادها للسائق.',
              picked_up: 'تم استلام الطرد من المرسل.',
              in_transit: 'الشحنة في الطريق إلى مدينة الوجهة.',
              arrived_to_destination_city: 'وصلت الشحنة إلى مدينة الوجهة.',
              out_for_delivery: 'خرج السائق لتسليم الشحنة.',
              delivered: 'تم تسليم الشحنة بنجاح للمستلم.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 2,
          startId: 7,
          finalStatus: 'out_for_delivery',
          route: {
            baseDays: 0,
            locations: {
              accepted: 'رام الله',
              picked_up: 'رام الله - شارع ركب',
              in_transit: 'الطريق إلى القدس',
              arrived_to_destination_city: 'القدس',
              out_for_delivery: 'بيت حنينا',
            },
            notes: {
              accepted: 'تم قبول الطلب بشكل فوري.',
              picked_up: 'تم استلام الطرد من الصيدلية.',
              in_transit: 'الشحنة في الطريق إلى القدس.',
              arrived_to_destination_city: 'تم الوصول إلى القدس.',
              out_for_delivery: 'الطلب في مرحلة التسليم الأخيرة.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 3,
          startId: 12,
          finalStatus: 'in_transit',
          route: {
            baseDays: -1,
            locations: {
              accepted: 'نابلس',
              picked_up: 'شارع فيصل',
              in_transit: 'طريق نابلس - طولكرم',
            },
            notes: {
              accepted: 'تم تأكيد الشحنة.',
              picked_up: 'تم الاستلام من متجر التقنية الحديثة.',
              in_transit: 'الطرد في الطريق إلى طولكرم.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 4,
          startId: 15,
          finalStatus: 'picked_up',
          route: {
            baseDays: -1,
            locations: {
              accepted: 'رام الله',
              picked_up: 'الإرسال',
            },
            notes: {
              accepted: 'تم قبول المهمة.',
              picked_up: 'تم استلام صندوق الحلويات.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 5,
          startId: 17,
          finalStatus: 'accepted',
          route: {
            baseDays: 0,
            locations: {
              accepted: 'القدس',
            },
            notes: {
              accepted: 'بانتظار توجه السائق للاستلام.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 6,
          startId: 18,
          finalStatus: 'delivered',
          route: {
            baseDays: -2,
            locations: {
              accepted: 'الخليل',
              picked_up: 'عين سارة',
              in_transit: 'الطريق إلى الداخل',
              arrived_to_destination_city: 'يافا',
              out_for_delivery: 'شارع ييفت',
              delivered: 'يافا - قرب الميناء',
            },
            notes: {
              accepted: 'تم إسناد الشحنة للسائق.',
              picked_up: 'تم استلام المستندات والعينات.',
              in_transit: 'الشحنة في الطريق إلى يافا.',
              arrived_to_destination_city: 'وصلت إلى مدينة الوجهة.',
              out_for_delivery: 'السائق في مرحلة التسليم الأخيرة.',
              delivered: 'تم التسليم بنجاح.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 7,
          startId: 24,
          finalStatus: 'accepted',
          route: {
            baseDays: 0,
            locations: {
              accepted: 'نابلس - السوق',
            },
            notes: {
              accepted: 'تم إسناد الطلب إلى أحمد أبو الهيجا وبانتظار التوجه للاستلام.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 8,
          startId: 25,
          finalStatus: 'picked_up',
          route: {
            baseDays: -1,
            locations: {
              accepted: 'رام الله',
              picked_up: 'رام الله - شارع المكتبة',
            },
            notes: {
              accepted: 'تم قبول الطلب وتحديد السائق.',
              picked_up: 'تم استلام الطرد من صيدلية المدينة.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 9,
          startId: 27,
          finalStatus: 'in_transit',
          route: {
            baseDays: -1,
            locations: {
              accepted: 'نابلس',
              picked_up: 'نابلس - شارع سفيان',
              in_transit: 'طريق نابلس - طولكرم',
            },
            notes: {
              accepted: 'تم قبول الطلب بنجاح.',
              picked_up: 'تم استلام الشحنة من مكتبة الرواد.',
              in_transit: 'الشحنة في الطريق إلى طولكرم.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 10,
          startId: 30,
          finalStatus: 'arrived_to_destination_city',
          route: {
            baseDays: -2,
            locations: {
              accepted: 'رام الله',
              picked_up: 'الماصيون',
              in_transit: 'الطريق إلى يافا',
              arrived_to_destination_city: 'يافا',
            },
            notes: {
              accepted: 'تم جدولة الشحنة لأحمد أبو الهيجا.',
              picked_up: 'تم استلام الشحنة من شركة النورس.',
              in_transit: 'الطرد في الطريق إلى يافا.',
              arrived_to_destination_city: 'وصلت الشحنة إلى مدينة الوجهة.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 11,
          startId: 34,
          finalStatus: 'out_for_delivery',
          route: {
            baseDays: 0,
            locations: {
              accepted: 'القدس',
              picked_up: 'شعفاط',
              in_transit: 'الطريق إلى رام الله',
              arrived_to_destination_city: 'رام الله',
              out_for_delivery: 'رام الله - الطيرة',
            },
            notes: {
              accepted: 'تم قبول الطلب بشكل عاجل.',
              picked_up: 'تم استلام الهدايا من ورود الشام.',
              in_transit: 'الشحنة في الطريق إلى رام الله.',
              arrived_to_destination_city: 'تم الوصول إلى رام الله.',
              out_for_delivery: 'السائق في مرحلة التسليم الأخيرة.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 12,
          startId: 39,
          finalStatus: 'delivered',
          route: {
            baseDays: -1,
            locations: {
              accepted: 'نابلس',
              picked_up: 'شارع الجامعة',
              in_transit: 'الطريق إلى قلقيلية',
              arrived_to_destination_city: 'قلقيلية',
              out_for_delivery: 'قلقيلية - وسط البلد',
              delivered: 'قلقيلية - قرب البلدية',
            },
            notes: {
              accepted: 'تم إسناد الشحنة إلى أحمد أبو الهيجا.',
              picked_up: 'تم استلام الطرد من متجر البيان.',
              in_transit: 'الشحنة في الطريق إلى قلقيلية.',
              arrived_to_destination_city: 'وصلت الشحنة إلى مدينة الوجهة.',
              out_for_delivery: 'الطلب في مرحلة التسليم النهائية.',
              delivered: 'تم التسليم بنجاح للمستلم.',
            },
          },
        }),
        ...buildShipmentTimeline({
          shipmentId: 13,
          startId: 45,
          finalStatus: 'accepted',
          route: {
            baseDays: 0,
            locations: {
              accepted: 'نابلس',
            },
            notes: {
              accepted: 'تم تجهيز الشحنة وتنتظر اختيار المندوب المناسب.',
            },
          },
        }),
      ];


      await queryInterface.bulkInsert('regions', regions, { transaction });
      await queryInterface.bulkInsert('users', users, { transaction });
      await queryInterface.bulkInsert('admins', admins, { transaction });
      await queryInterface.bulkInsert('employees', employees, { transaction });
      await queryInterface.bulkInsert('customers', customers, { transaction });
      await queryInterface.bulkInsert('company_customer_profiles', companyCustomerProfiles, { transaction });
      await queryInterface.bulkInsert('vehicles', vehicles, { transaction });
      await queryInterface.bulkInsert('employee_documents', documents, { transaction });
      await queryInterface.bulkInsert('employee_wallets', wallets, { transaction });
      await queryInterface.bulkInsert('orders', orders, { transaction });
      await queryInterface.bulkInsert('shipments', shipments, { transaction });
      // await queryInterface.bulkInsert('merchant_settlements', merchantSettlements, { transaction });
      await queryInterface.bulkInsert('wallet_transactions', walletTransactions, { transaction });
      await queryInterface.bulkInsert('withdrawal_requests', withdrawalRequests, { transaction });

      const fixedTrackingUpdates = trackingUpdates.map((update) => {
        const { created_at, updated_at, ...rest } = update;

        return {
          ...rest,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
      await queryInterface.bulkInsert('tracking_updates', fixedTrackingUpdates, { transaction });
      await syncSequenceToTableMax(queryInterface, 'users', transaction);
      await syncSequenceToTableMax(queryInterface, 'customers', transaction);
      await syncSequenceToTableMax(queryInterface, 'company_customer_profiles', transaction);
      await syncSequenceToTableMax(queryInterface, 'employees', transaction);
      await syncSequenceToTableMax(queryInterface, 'vehicles', transaction);
      await syncSequenceToTableMax(queryInterface, 'employee_documents', transaction);
      await syncSequenceToTableMax(queryInterface, 'employee_wallets', transaction);
      await syncSequenceToTableMax(queryInterface, 'orders', transaction);
      await syncSequenceToTableMax(queryInterface, 'shipments', transaction);
      // await syncSequenceToTableMax(queryInterface, 'merchant_settlements', transaction);
      await syncSequenceToTableMax(queryInterface, 'wallet_transactions', transaction);
      await syncSequenceToTableMax(queryInterface, 'withdrawal_requests', transaction);
      await syncSequenceToTableMax(queryInterface, 'tracking_updates', transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await truncateDevTables(queryInterface, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
