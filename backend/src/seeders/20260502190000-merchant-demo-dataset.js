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

const hashPassword = (plainPassword = 'Password123!') => bcrypt.hashSync(plainPassword, 10);

const stamp = (offset = {}) => {
  const createdAt = createRelativeDate(offset);
  return {
    created_at: createdAt,
    updated_at: createdAt,
  };
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
      const users = [
        {
          id: 101,
          email: 'nablus.supplies@phoenix.ps',
          phone: '0597000001',
          password: hashPassword(),
          role: 'customer',
          ...stamp({ days: -20 }),
        },
        {
          id: 102,
          email: 'jerusalem.pharma@phoenix.ps',
          phone: '0597000002',
          password: hashPassword(),
          role: 'customer',
          ...stamp({ days: -20 }),
        },
        {
          id: 103,
          email: 'inside.tech@phoenix.ps',
          phone: '0597000003',
          password: hashPassword(),
          role: 'customer',
          ...stamp({ days: -20 }),
        },
        {
          id: 104,
          email: 'ramallah.flowers@phoenix.ps',
          phone: '0597000004',
          password: hashPassword(),
          role: 'customer',
          ...stamp({ days: -20 }),
        },
        {
          id: 105,
          email: 'hebron.fashion@phoenix.ps',
          phone: '0597000005',
          password: hashPassword(),
          role: 'customer',
          ...stamp({ days: -20 }),
        },
      ];

      const customers = users.map((user, index) => ({
        id: user.id,
        user_id: user.id,
        customer_type: 'company',
        ...stamp({ days: -19 + index }),
      }));

      const profiles = [
        {
          id: 101,
          customer_id: 101,
          company_name: 'مكتبة نابلس الحديثة',
          company_phone: '0597000001',
          company_location: 'نابلس',
          ...stamp({ days: -18 }),
        },
        {
          id: 102,
          customer_id: 102,
          company_name: 'صيدلية القدس المركزية',
          company_phone: '0597000002',
          company_location: 'القدس',
          ...stamp({ days: -18 }),
        },
        {
          id: 103,
          customer_id: 103,
          company_name: 'تقنية الداخل',
          company_phone: '0597000003',
          company_location: 'الداخل',
          ...stamp({ days: -18 }),
        },
        {
          id: 104,
          customer_id: 104,
          company_name: 'زهور رام الله',
          company_phone: '0597000004',
          company_location: 'رام الله',
          ...stamp({ days: -18 }),
        },
        {
          id: 105,
          customer_id: 105,
          company_name: 'أزياء الخليل',
          company_phone: '0597000005',
          company_location: 'الخليل',
          ...stamp({ days: -18 }),
        },
      ];

      const orders = [
        {
          id: 101,
          customer_id: 101,
          region_id: 1,
          sender_name: 'مكتبة نابلس الحديثة',
          sender_phone: '0597000001',
          sender_address: 'نابلس - رفيديا',
          receiver_name: 'ليان عودة',
          receiver_phone: '0598111001',
          receiver_address: 'جنين - الحي الشرقي',
          origin_city: 'نابلس',
          destination_city: 'جنين',
          package_size: 'small',
          delivery_speed: 'normal',
          is_fragile: false,
          declared_value: 80,
          package_description: 'كتب وقرطاسية',
          status: 'pending',
          delivered_at: null,
          ...stamp({ days: -1, hours: -5 }),
        },
        {
          id: 102,
          customer_id: 101,
          region_id: 2,
          sender_name: 'مكتبة نابلس الحديثة',
          sender_phone: '0597000001',
          sender_address: 'نابلس - شارع الجامعة',
          receiver_name: 'آدم سلهب',
          receiver_phone: '0598111002',
          receiver_address: 'رام الله - الطيرة',
          origin_city: 'نابلس',
          destination_city: 'رام الله',
          package_size: 'medium',
          delivery_speed: 'urgent',
          is_fragile: false,
          declared_value: 130,
          package_description: 'طلبات مدرسية',
          status: 'confirmed',
          delivered_at: null,
          ...stamp({ days: -1, hours: -2 }),
        },
        {
          id: 103,
          customer_id: 101,
          region_id: 1,
          sender_name: 'مكتبة نابلس الحديثة',
          sender_phone: '0597000001',
          sender_address: 'نابلس - وسط البلد',
          receiver_name: 'عمر زيدان',
          receiver_phone: '0598111003',
          receiver_address: 'طولكرم - الحي الشمالي',
          origin_city: 'نابلس',
          destination_city: 'طولكرم',
          package_size: 'small',
          delivery_speed: 'normal',
          is_fragile: false,
          declared_value: 65,
          package_description: 'ملفات وأوراق',
          status: 'picked_up',
          delivered_at: null,
          ...stamp({ days: -2, hours: -3 }),
        },
        {
          id: 104,
          customer_id: 101,
          region_id: 1,
          sender_name: 'مكتبة نابلس الحديثة',
          sender_phone: '0597000001',
          sender_address: 'نابلس - رفيديا',
          receiver_name: 'نور المصري',
          receiver_phone: '0598111004',
          receiver_address: 'قلقيلية - وسط البلد',
          origin_city: 'نابلس',
          destination_city: 'قلقيلية',
          package_size: 'small',
          delivery_speed: 'express',
          is_fragile: false,
          declared_value: 95,
          package_description: 'حقيبة أدوات',
          status: 'delivered',
          delivered_at: createRelativeDate({ days: -1, hours: -2 }),
          ...stamp({ days: -3, hours: -2 }),
        },
        {
          id: 105,
          customer_id: 102,
          region_id: 2,
          sender_name: 'صيدلية القدس المركزية',
          sender_phone: '0597000002',
          sender_address: 'القدس - شعفاط',
          receiver_name: 'يزن حامد',
          receiver_phone: '0598111005',
          receiver_address: 'نابلس - رفيديا',
          origin_city: 'القدس',
          destination_city: 'نابلس',
          package_size: 'small',
          delivery_speed: 'urgent',
          is_fragile: true,
          declared_value: 150,
          package_description: 'أدوية ومستحضرات',
          status: 'in_transit',
          delivered_at: null,
          ...stamp({ hours: -12 }),
        },
        {
          id: 106,
          customer_id: 102,
          region_id: 2,
          sender_name: 'صيدلية القدس المركزية',
          sender_phone: '0597000002',
          sender_address: 'القدس - الشيخ جراح',
          receiver_name: 'سارة عريقات',
          receiver_phone: '0598111006',
          receiver_address: 'بيت لحم - شارع المهد',
          origin_city: 'القدس',
          destination_city: 'بيت لحم',
          package_size: 'medium',
          delivery_speed: 'normal',
          is_fragile: true,
          declared_value: 170,
          package_description: 'أجهزة فحص منزلية',
          status: 'arrived_to_destination_city',
          delivered_at: null,
          ...stamp({ days: -1, hours: -6 }),
        },
        {
          id: 107,
          customer_id: 102,
          region_id: 2,
          sender_name: 'صيدلية القدس المركزية',
          sender_phone: '0597000002',
          sender_address: 'القدس - باب العامود',
          receiver_name: 'محمد نزال',
          receiver_phone: '0598111007',
          receiver_address: 'الخليل - عين سارة',
          origin_city: 'القدس',
          destination_city: 'الخليل',
          package_size: 'small',
          delivery_speed: 'express',
          is_fragile: false,
          declared_value: 140,
          package_description: 'طلبية دوائية',
          status: 'out_for_delivery',
          delivered_at: null,
          ...stamp({ days: -1, hours: -1 }),
        },
        {
          id: 108,
          customer_id: 102,
          region_id: 2,
          sender_name: 'صيدلية القدس المركزية',
          sender_phone: '0597000002',
          sender_address: 'القدس - الشيخ جراح',
          receiver_name: 'لجين فرح',
          receiver_phone: '0598111008',
          receiver_address: 'رام الله - الإرسال',
          origin_city: 'القدس',
          destination_city: 'رام الله',
          package_size: 'small',
          delivery_speed: 'urgent',
          is_fragile: true,
          declared_value: 160,
          package_description: 'مكملات صحية',
          status: 'delivered',
          delivered_at: createRelativeDate({ days: -2, hours: -4 }),
          ...stamp({ days: -4, hours: -2 }),
        },
        {
          id: 109,
          customer_id: 103,
          region_id: 3,
          sender_name: 'تقنية الداخل',
          sender_phone: '0597000003',
          sender_address: 'الداخل - المركز التجاري',
          receiver_name: 'ميس حجازي',
          receiver_phone: '0598111009',
          receiver_address: 'جنين - الحي الغربي',
          origin_city: 'الداخل',
          destination_city: 'جنين',
          package_size: 'medium',
          delivery_speed: 'express',
          is_fragile: true,
          declared_value: 220,
          package_description: 'سماعات وملحقات',
          status: 'delivered',
          delivered_at: createRelativeDate({ days: -4, hours: -4 }),
          ...stamp({ days: -5, hours: -2 }),
        },
        {
          id: 110,
          customer_id: 103,
          region_id: 1,
          sender_name: 'تقنية الداخل',
          sender_phone: '0597000003',
          sender_address: 'الداخل - شارع البحر',
          receiver_name: 'فارس صبح',
          receiver_phone: '0598111010',
          receiver_address: 'بيت لحم - شارع الصف',
          origin_city: 'الداخل',
          destination_city: 'بيت لحم',
          package_size: 'small',
          delivery_speed: 'normal',
          is_fragile: false,
          declared_value: 70,
          package_description: 'أكسسوارات هاتف',
          status: 'cancelled',
          delivered_at: null,
          ...stamp({ days: -2, hours: -6 }),
        },
        {
          id: 111,
          customer_id: 103,
          region_id: 1,
          sender_name: 'تقنية الداخل',
          sender_phone: '0597000003',
          sender_address: 'الداخل - وسط البلد',
          receiver_name: 'ديما قبها',
          receiver_phone: '0598111011',
          receiver_address: 'نابلس - المخفية',
          origin_city: 'الداخل',
          destination_city: 'نابلس',
          package_size: 'medium',
          delivery_speed: 'urgent',
          is_fragile: true,
          declared_value: 190,
          package_description: 'ساعة ذكية',
          status: 'confirmed',
          delivered_at: null,
          ...stamp({ hours: -8 }),
        },
        {
          id: 112,
          customer_id: 104,
          region_id: 2,
          sender_name: 'زهور رام الله',
          sender_phone: '0597000004',
          sender_address: 'رام الله - الإرسال',
          receiver_name: 'كريم صوالحة',
          receiver_phone: '0598111012',
          receiver_address: 'القدس - بيت حنينا',
          origin_city: 'رام الله',
          destination_city: 'القدس',
          package_size: 'small',
          delivery_speed: 'urgent',
          is_fragile: true,
          declared_value: 110,
          package_description: 'تنسيق ورد',
          status: 'delivered',
          delivered_at: createRelativeDate({ days: 0, hours: -3 }),
          ...stamp({ days: -1, hours: -10 }),
        },
        {
          id: 113,
          customer_id: 104,
          region_id: 1,
          sender_name: 'زهور رام الله',
          sender_phone: '0597000004',
          sender_address: 'رام الله - المصايف',
          receiver_name: 'رنا بكر',
          receiver_phone: '0598111013',
          receiver_address: 'بيت لحم - الدوحة',
          origin_city: 'رام الله',
          destination_city: 'بيت لحم',
          package_size: 'small',
          delivery_speed: 'normal',
          is_fragile: true,
          declared_value: 90,
          package_description: 'هدايا وورود',
          status: 'pending',
          delivered_at: null,
          ...stamp({ hours: -5 }),
        },
        {
          id: 114,
          customer_id: 104,
          region_id: 1,
          sender_name: 'زهور رام الله',
          sender_phone: '0597000004',
          sender_address: 'رام الله - الطيرة',
          receiver_name: 'لؤي عابد',
          receiver_phone: '0598111014',
          receiver_address: 'الخليل - الجامعة',
          origin_city: 'رام الله',
          destination_city: 'الخليل',
          package_size: 'small',
          delivery_speed: 'urgent',
          is_fragile: false,
          declared_value: 125,
          package_description: 'هدية موسمية',
          status: 'out_for_delivery',
          delivered_at: null,
          ...stamp({ days: -1, hours: -4 }),
        },
        {
          id: 115,
          customer_id: 105,
          region_id: 1,
          sender_name: 'أزياء الخليل',
          sender_phone: '0597000005',
          sender_address: 'الخليل - عين سارة',
          receiver_name: 'نور مشعل',
          receiver_phone: '0598111015',
          receiver_address: 'رام الله - البيرة',
          origin_city: 'الخليل',
          destination_city: 'رام الله',
          package_size: 'medium',
          delivery_speed: 'normal',
          is_fragile: false,
          declared_value: 210,
          package_description: 'ملابس جاهزة',
          status: 'delivered',
          delivered_at: createRelativeDate({ days: -5, hours: -1 }),
          ...stamp({ days: -6, hours: -3 }),
        },
        {
          id: 116,
          customer_id: 105,
          region_id: 1,
          sender_name: 'أزياء الخليل',
          sender_phone: '0597000005',
          sender_address: 'الخليل - الحرس',
          receiver_name: 'يوسف جرار',
          receiver_phone: '0598111016',
          receiver_address: 'نابلس - شارع القدس',
          origin_city: 'الخليل',
          destination_city: 'نابلس',
          package_size: 'medium',
          delivery_speed: 'express',
          is_fragile: false,
          declared_value: 240,
          package_description: 'طلبية ملابس موسمية',
          status: 'in_transit',
          delivered_at: null,
          ...stamp({ days: -1, hours: -9 }),
        },
      ];

      const shipments = [
        { id: 101, order_id: 101, driver_id: null, tracking_number: 'PHX-M101', current_status: 'accepted', estimated_delivery_date: createRelativeDate({ days: 1 }), ...stamp({ days: -1, hours: -5 }) },
        { id: 102, order_id: 102, driver_id: null, tracking_number: 'PHX-M102', current_status: 'accepted', estimated_delivery_date: createRelativeDate({ days: 1 }), ...stamp({ days: -1, hours: -2 }) },
        { id: 103, order_id: 103, driver_id: 1, tracking_number: 'PHX-M103', current_status: 'picked_up', estimated_delivery_date: createRelativeDate({ days: 1 }), ...stamp({ days: -2, hours: -3 }) },
        { id: 104, order_id: 104, driver_id: 1, tracking_number: 'PHX-M104', current_status: 'delivered', estimated_delivery_date: createRelativeDate({ days: -1 }), ...stamp({ days: -1, hours: -2 }) },
        { id: 105, order_id: 105, driver_id: 2, tracking_number: 'PHX-M105', current_status: 'in_transit', estimated_delivery_date: createRelativeDate({ days: 1 }), ...stamp({ hours: -12 }) },
        { id: 106, order_id: 106, driver_id: 2, tracking_number: 'PHX-M106', current_status: 'arrived_to_destination_city', estimated_delivery_date: createRelativeDate({ days: 1 }), ...stamp({ days: -1, hours: -6 }) },
        { id: 107, order_id: 107, driver_id: 1, tracking_number: 'PHX-M107', current_status: 'out_for_delivery', estimated_delivery_date: createRelativeDate({ days: 0 }), ...stamp({ days: -1, hours: -1 }) },
        { id: 108, order_id: 108, driver_id: 2, tracking_number: 'PHX-M108', current_status: 'delivered', estimated_delivery_date: createRelativeDate({ days: -2 }), ...stamp({ days: -2, hours: -4 }) },
        { id: 109, order_id: 109, driver_id: 2, tracking_number: 'PHX-M109', current_status: 'delivered', estimated_delivery_date: createRelativeDate({ days: -4 }), ...stamp({ days: -4, hours: -4 }) },
        { id: 110, order_id: 110, driver_id: null, tracking_number: 'PHX-M110', current_status: 'cancelled', estimated_delivery_date: createRelativeDate({ days: -2 }), ...stamp({ days: -2, hours: -6 }) },
        { id: 111, order_id: 111, driver_id: null, tracking_number: 'PHX-M111', current_status: 'accepted', estimated_delivery_date: createRelativeDate({ days: 2 }), ...stamp({ hours: -8 }) },
        { id: 112, order_id: 112, driver_id: 1, tracking_number: 'PHX-M112', current_status: 'delivered', estimated_delivery_date: createRelativeDate({ days: 0 }), ...stamp({ hours: -3 }) },
        { id: 113, order_id: 113, driver_id: null, tracking_number: 'PHX-M113', current_status: 'accepted', estimated_delivery_date: createRelativeDate({ days: 1 }), ...stamp({ hours: -5 }) },
        { id: 114, order_id: 114, driver_id: 2, tracking_number: 'PHX-M114', current_status: 'out_for_delivery', estimated_delivery_date: createRelativeDate({ days: 0 }), ...stamp({ days: -1, hours: -4 }) },
        { id: 115, order_id: 115, driver_id: 1, tracking_number: 'PHX-M115', current_status: 'delivered', estimated_delivery_date: createRelativeDate({ days: -5 }), ...stamp({ days: -5, hours: -1 }) },
        { id: 116, order_id: 116, driver_id: 2, tracking_number: 'PHX-M116', current_status: 'in_transit', estimated_delivery_date: createRelativeDate({ days: 1 }), ...stamp({ days: -1, hours: -9 }) },
      ];

      const settlements = [
        {
          id: 101,
          customer_id: 102,
          amount: 60,
          status: 'pending',
          payment_method: 'cash',
          settled_at: null,
          notes: 'بانتظار استلام التاجر للمبلغ الأسبوعي',
          ...stamp({ days: -1, hours: -5 }),
        },
        {
          id: 102,
          customer_id: 103,
          amount: 250,
          status: 'settled',
          payment_method: 'bank_transfer',
          settled_at: createRelativeDate({ days: -1, hours: -2 }),
          notes: 'تسوية كاملة لمستحقات الطلبات المسلمة',
          ...stamp({ days: -1, hours: -2 }),
        },
        {
          id: 103,
          customer_id: 104,
          amount: 45,
          status: 'pending',
          payment_method: 'ewallet',
          settled_at: null,
          notes: 'دفعة جزئية قيد المراجعة',
          ...stamp({ hours: -4 }),
        },
        {
          id: 104,
          customer_id: 105,
          amount: 180,
          status: 'settled',
          payment_method: 'cash',
          settled_at: createRelativeDate({ days: -3, hours: -1 }),
          notes: 'تم تسليم المستحقات للتاجر',
          ...stamp({ days: -3, hours: -1 }),
        },
      ];

      await queryInterface.bulkInsert('users', users, { transaction });
      await queryInterface.bulkInsert('customers', customers, { transaction });
      await queryInterface.bulkInsert('company_customer_profiles', profiles, { transaction });
      await queryInterface.bulkInsert('orders', orders, { transaction });
      await queryInterface.bulkInsert('shipments', shipments, { transaction });
      await queryInterface.bulkInsert('merchant_settlements', settlements, { transaction });

      await syncSequenceToTableMax(queryInterface, 'users', transaction);
      await syncSequenceToTableMax(queryInterface, 'customers', transaction);
      await syncSequenceToTableMax(queryInterface, 'company_customer_profiles', transaction);
      await syncSequenceToTableMax(queryInterface, 'orders', transaction);
      await syncSequenceToTableMax(queryInterface, 'shipments', transaction);
      await syncSequenceToTableMax(queryInterface, 'merchant_settlements', transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete('merchant_settlements', { id: [101, 102, 103, 104] }, { transaction });
      await queryInterface.bulkDelete(
        'shipments',
        { id: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116] },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'orders',
        { id: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116] },
        { transaction }
      );
      await queryInterface.bulkDelete('company_customer_profiles', { id: [101, 102, 103, 104, 105] }, { transaction });
      await queryInterface.bulkDelete('customers', { id: [101, 102, 103, 104, 105] }, { transaction });
      await queryInterface.bulkDelete('users', { id: [101, 102, 103, 104, 105] }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
