import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DetailPage from './pages/DetailPage';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/detail" 
              element={
                <ProtectedRoute>
                  <DetailPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/detail" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;