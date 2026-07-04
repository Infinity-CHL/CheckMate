import { Navigate, createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/app/layouts/RootLayout'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { OrdersPage } from '@/pages/orders/OrdersPage'
import { OrderDetailsPage } from '@/pages/orders/OrderDetailsPage'
import { OrderEditPage } from '@/pages/orders/OrderEditPage'
import { CreateOrderPage } from '@/pages/orders/CreateOrderPage'
import { TablesPage } from '@/pages/tables/TablesPage'
import { TableOrderPage } from '@/pages/tables/TableOrderPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { MenuPage } from '@/pages/menu/MenuPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { AdminEmployeesPage } from '@/pages/admin/AdminEmployeesPage'
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { AuthCallback } from '@/pages/auth/AuthCallback'
import { UpdatePassword } from '@/pages/auth/UpdatePassword'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
      { path: 'dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
      { path: 'menu', element: <ProtectedRoute><MenuPage /></ProtectedRoute> },
      { path: 'notifications', element: <ProtectedRoute><NotificationsPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      {
        path: 'admin',
        element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <Navigate to="/admin/employees" replace /> },
          { path: 'employees', element: <AdminEmployeesPage /> },
          { path: 'analytics', element: <AdminAnalyticsPage /> },
        ],
      },
      { path: 'tables', element: <ProtectedRoute><TablesPage /></ProtectedRoute> },
      { path: 'tables/:tableId/order', element: <ProtectedRoute><TableOrderPage /></ProtectedRoute> },
      { path: 'orders', element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
      { path: 'orders/:orderId', element: <ProtectedRoute><OrderDetailsPage /></ProtectedRoute> },
      { path: 'orders/:orderId/edit', element: <ProtectedRoute><OrderEditPage /></ProtectedRoute> },
      { path: 'orders/create', element: <ProtectedRoute><CreateOrderPage /></ProtectedRoute> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignUpPage /> },
      { path: 'auth/callback', element: <AuthCallback /> },
      { path: 'update-password', element: <UpdatePassword /> },
    ],
  },
])
