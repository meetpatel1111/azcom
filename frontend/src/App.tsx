import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ErrorProvider } from './context/ErrorContext';
import { ErrorBoundary, NotificationContainer } from './components/UI';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected routes with layout */}
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="products" element={<Products />} />
                    <Route path="products/:id" element={<ProductDetail />} />
                    
                    {/* Authenticated routes */}
                    <Route path="cart" element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    } />
                    <Route path="checkout" element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    } />
                    <Route path="orders" element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    } />
                    <Route path="orders/:id" element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin routes */}
                    <Route path="admin" element={
                      <ProtectedRoute requireAdmin>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                  </Route>
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                
                {/* Global notification container */}
                <NotificationContainer />
              </div>
            </Router>
          </CartProvider>
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

export default App;