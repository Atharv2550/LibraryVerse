import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BookDetails from './pages/BookDetails';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Smart LMS Pages
import CirculationDesk from './pages/CirculationDesk';
import MyLibrary from './pages/MyLibrary';
import MembersManagement from './pages/MembersManagement';
import FinesManagement from './pages/FinesManagement';
import LibraryReports from './pages/LibraryReports';
import AuditLogs from './pages/AuditLogs';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <Navbar />
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          {/* Public Catalog & Auth */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/books/:id" element={<BookDetails />} />

          {/* Member Cardholder Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Smart LMS: Member Self-Service */}
          <Route
            path="/my-library"
            element={
              <ProtectedRoute>
                <MyLibrary />
              </ProtectedRoute>
            }
          />

          {/* Smart LMS: Librarian & Admin Circulation Desk */}
          <Route
            path="/circulation"
            element={
              <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                <CirculationDesk />
              </ProtectedRoute>
            }
          />

          {/* Smart LMS: Member Directory */}
          <Route
            path="/members"
            element={
              <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                <MembersManagement />
              </ProtectedRoute>
            }
          />

          {/* Smart LMS: Fines Desk */}
          <Route
            path="/fines"
            element={
              <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                <FinesManagement />
              </ProtectedRoute>
            }
          />

          {/* Smart LMS: Analytics & CSV Reports */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                <LibraryReports />
              </ProtectedRoute>
            }
          />

          {/* Smart LMS: Audit Trail (Admin only) */}
          <Route
            path="/audit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />

          {/* Role 1: Admin Governance Console */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
