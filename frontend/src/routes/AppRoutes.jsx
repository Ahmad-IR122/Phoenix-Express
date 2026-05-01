import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import CustomerLayout from "../layouts/CustomerLayout";
import AdminLayout from "../layouts/AdminLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";
import AuthLayout from "../layouts/AuthLayout";

import HomePage from "../features/customuer/pages/HomePage";
import AboutPage from "../features/customuer/pages/AboutPage";
import TrackingPage from "../features/customuer/pages/TrackingPage";
import PhotoGalleryPage from "../features/customuer/pages/PhotoGalleryPage";
import FeedbackPage from "../features/customuer/pages/FeedbackPage";
import BlogPage from "../features/customuer/pages/BlogPage";
import RequestDeliveryServicePage from "../features/customuer/pages/RequestDeliveryServicePage";
import ReviewsPage from "../features/customuer/pages/ReviewsPage";
import SignInPage from "../features/auth/pages/SignInPage";
import LoginPage from "../features/auth/pages/LoginPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";

import DashboardPage from "../features/Admin/pages/DashboardPage";
import ParcelDistributionPage from "../features/Admin/pages/ParcelDistributionPage";
import MerchantsPage from "../features/Admin/pages/MerchantsPage";
import DelegatesPage from "../features/Admin/pages/DelegatesPage";
import ReportsPage from "../features/Admin/pages/ReportsPage";

import EmployeeHomePage from "../features/employee/pages/HomePage";
import OrdersPage from "../features/employee/pages/OrdersPage";
import PaymentPage from "../features/employee/pages/PaymentPage";
import ProfilePage from "../features/employee/pages/ProfilePage";
import PageNotFound from "../pages/pageNotFound";
import OrderConfirmation from "../features/customuer/pages/OrderConfirmation";
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>          
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/gallery" element={<PhotoGalleryPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route
            path="/request-delivery"
            element={<RequestDeliveryServicePage />}
          />
          <Route path="/track" element={<Navigate to="/tracking" replace />} />
          <Route
            path="/request-service"
            element={<Navigate to="/request-delivery" replace />}
          />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />  
        </Route>

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Admin protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route
            path="/admin/parcel-distribution"
            element={<ParcelDistributionPage />}
          />
          <Route path="/admin/merchants" element={<MerchantsPage />} />
          <Route path="/admin/delegates" element={<DelegatesPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
        </Route>

        {/* Employee protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["employee"]}>
                <EmployeeLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/employee" element={<Navigate to="/employee/home" replace />} />
          <Route path="/employee/home" element={<EmployeeHomePage />} />
          <Route path="/employee/orders" element={<OrdersPage />} />
          <Route path="/employee/payment" element={<PaymentPage />} />
          <Route path="/employee/profile" element={<ProfilePage />} />
        </Route>

        {/* Example protected route for both admin and employee */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "employee", "customer"]}>
                <ProfilePage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Not found */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
