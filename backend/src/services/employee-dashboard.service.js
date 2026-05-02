'use strict';

const STATUS_LABELS = {
  pending: 'معلق',
  accepted: 'مقبول',
  picked_up: 'تم الاستلام',
  in_transit: 'قيد التوصيل',
  out_for_delivery: 'خرج للتسليم',
  delivered: 'مكتمل',
  returned: 'مرتجع',
  confirmed: 'مؤكد',
  cancelled: 'ملغي',
  arrived_to_destination_city: 'وصل إلى مدينة الوجهة',
};

module.exports = {
  STATUS_LABELS,
};
