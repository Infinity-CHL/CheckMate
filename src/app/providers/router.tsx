// import { createBrowserRouter } from 'react-router-dom'
// import { RootLayout } from '@/app/layouts/RootLayout'
// import { AuthCallback } from '@/pages/auth/AuthCallback'
// import { UpdatePassword } from '@/pages/auth/UpdatePassword'
// import { LoginPage } from '@/pages/LoginPage'
// import { SignUpPage } from '@/pages/SignUpPage'
// import { HomePage } from '@/pages/HomePage'

// export const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <RootLayout />,
//     children: [
//       { index: true, element: <HomePage /> },
//       { path: 'login', element: <LoginPage /> },
//       { path: 'signup', element: <SignUpPage /> },
//       { path: 'auth/callback', element: <AuthCallback /> },
//       { path: 'update-password', element: <UpdatePassword /> },
//     ],
//   },
// ])

import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/app/layouts/RootLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { OrdersPage } from '@/pages/orders/OrdersPage'
import { OrderDetailsPage } from '@/pages/orders/OrderDetailsPage'
import { CreateOrderPage } from '@/pages/orders/CreateOrderPage'
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
      { path: 'orders', element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
      { path: 'orders/:orderId', element: <ProtectedRoute><OrderDetailsPage /></ProtectedRoute> },
      { path: 'orders/create', element: <ProtectedRoute><CreateOrderPage /></ProtectedRoute> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignUpPage /> },
      { path: 'auth/callback', element: <AuthCallback /> },
      { path: 'update-password', element: <UpdatePassword /> },
    ],
  },
])
