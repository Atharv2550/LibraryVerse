import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Bookmark,
  LogOut,
  Menu,
  X,
  RefreshCw,
  CreditCard,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isStaff = user && (user.role === 'admin' || user.role === 'librarian');
  const isAdmin = user && user.role === 'admin';

  const navLinks = [
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Console', icon: ShieldCheck }] : []),
    ...(isStaff ? [{ to: '/circulation', label: 'Circulation Desk', icon: RefreshCw }] : []),
    { to: '/', label: 'Catalog', icon: BookOpen },
    ...(user ? [{ to: '/my-library', label: 'My Library', icon: Bookmark }] : []),
    ...(isStaff ? [
      { to: '/members', label: 'Members', icon: Users },
      { to: '/fines', label: 'Fines', icon: CreditCard },
      { to: '/reports', label: 'Reports', icon: BarChart3 }
    ] : []),
    ...(isAdmin ? [
      { to: '/audit', label: 'Audit Trail', icon: ShieldCheck }
    ] : [])
  ];

  return (
    <nav className="sticky top-0 z-50 glass-nav transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 group"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 dark:from-white dark:via-indigo-200 dark:to-indigo-400 bg-clip-text text-transparent leading-none">
                LibraryVerse
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600/80 dark:text-indigo-400">
                Smart LMS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white flex items-center space-x-1.5 text-xs font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle (Dark / Light / System) */}
            <ThemeToggle />

            {/* Notification Bell (Logged in) */}
            {user && <NotificationBell />}

            {/* User Profile Pill or Sign In buttons */}
            {user ? (
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-500/50 transition-all shadow-sm"
                >
                  <img
                    src={
                      user.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                    }
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-indigo-500/40"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    user.role === 'admin'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : user.role === 'librarian'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {user.role || 'Member'}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/25 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-5 space-y-2 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Icon className="w-4 h-4 text-indigo-500" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2.5"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/40"
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-indigo-600 text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
