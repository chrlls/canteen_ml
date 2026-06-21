import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminDashboard from './components/dashboard/AdminDashboard';
import ReportsPage from './components/dashboard/ReportsPage';
import MenuList from './components/menu/MenuList';
import POSInterface from './components/orders/POSInterface';
import InventoryTable from './components/inventory/InventoryTable';
import UserManagement from './components/users/UserManagement';
import OrderHistory from './components/orders/OrderHistory';

function App() {
    return (
        <Router>
            <Routes>

                {/* Public Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Admin Only */}
                <Route path="/dashboard" element={
                    <ProtectedRoute roles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/reports" element={
                    <ProtectedRoute roles={['admin']}>
                        <ReportsPage />
                    </ProtectedRoute>
                } />
                <Route path="/users" element={
                    <ProtectedRoute roles={['admin']}>
                        <UserManagement />
                    </ProtectedRoute>
                } />

                {/* Admin & Cashier */}
                <Route path="/inventory" element={
                    <ProtectedRoute roles={['admin', 'cashier']}>
                        <InventoryTable />
                    </ProtectedRoute>
                } />
                <Route path="/history" element={
                     <ProtectedRoute roles={['customer']}>
                          <OrderHistory />
                     </ProtectedRoute>
                } />

                {/* All Roles */}
                <Route path="/menu" element={
                    <ProtectedRoute roles={['admin', 'cashier']}>
                        <MenuList />
                    </ProtectedRoute>
                } />
                <Route path="/orders" element={
                    <ProtectedRoute roles={['admin', 'cashier', 'customer']}>
                        <POSInterface />
                    </ProtectedRoute>
                } />

            </Routes>
        </Router>
    );
}

export default App;