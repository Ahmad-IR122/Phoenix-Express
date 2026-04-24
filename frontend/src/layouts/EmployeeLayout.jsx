import React, { useMemo } from 'react';
import DashboardLayout from '../Components/layout/DashboardLayout';

const employeeNotifications = [
  {
    id: 1,
    title: "تم إضافة طلب جديد إلى مهامك",
    time: "منذ 4 دقائق",
    type: "info",
    read: false,
  },
  {
    id: 2,
    title: "تم تحديث حالة طلب قيد التوصيل",
    time: "منذ 12 دقيقة",
    type: "warning",
    read: false,
  },
  {
    id: 3,
    title: "تم تحويل دفعة إلى المحفظة",
    time: "منذ 25 دقيقة",
    type: "info",
    read: true,
  },
];

const EmployeeLayout = ({ children }) => {
  const today = new Date();
  const arabicDate = useMemo(() => {
    return today.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [today]);

  return (
    <DashboardLayout
      layoutType="employee"
      userName="أحمد"
      notifications={employeeNotifications}
      customTitle="مرحبًا، أحمد"
      customDate={arabicDate}
    >
      {children}
    </DashboardLayout>
  );
}

export default EmployeeLayout;
