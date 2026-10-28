import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Edit3,
  Save,
  X,
  Check,
  AlertCircle,
  Loader2,
  BookOpen,
  Calendar,
  ShieldCheck,
  Clock,
  DollarSign,
  Phone,
  MapPin,
  Barcode,
  ArrowRight
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import toast from '../utils/toast';

const Profile = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    avatar: '',
    phone: '',
    address: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserProfile();
      const u = res.data?.user || res.data;
      setProfileData(u);
      setStats(res.data?.stats || null);
      setEditForm({
        name: u.name || '',
        avatar: u.avatar || '',
        phone: u.phone || '',
        address: u.address || ''
      });
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load cardholder profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [authUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const res = await updateUserProfile(editForm);
      const updatedUser = res.data?.user || res.data;
      setProfileData(updatedUser);
      if (setAuthUser) {
        setAuthUser((prev) => ({ ...prev, ...updatedUser }));
      }
      setSaveSuccess(true);
      setIsEditing(false);
      toast.success('Member contact information updated successfully');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.friendlyMessage || 'Failed to update profile.');
      toast.error(err.friendlyMessage || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading member cardholder profile..." />;
  }

  if (error || !profileData) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="p-8 rounded-3xl glass-card border border-rose-500/20 text-rose-500">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-400" />
          <h2 className="text-xl font-bold">{error || 'Profile not found'}</h2>
          <p className="text-xs text-slate-400 mt-2">Could not retrieve account details.</p>
        </div>
      </div>
    );
  }

  const roleLabel = profileData.role?.toUpperCase() || 'MEMBER';
  const statusColor =
    profileData.membershipStatus === 'active'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
      : profileData.membershipStatus === 'expired'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800'
      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner / Member Card */}
      <div className="relative overflow-hidden rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with role ring */}
          <div className="relative shrink-0">
            <img
              src={
                profileData.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  profileData.name || 'User'
                )}`
              }
              alt={profileData.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-xl"
            />
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow">
              {roleLabel}
            </span>
          </div>

          {/* User Bio and Identification */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profileData.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Barcode className="w-3.5 h-3.5 text-indigo-500" />
                    ID: {profileData.membershipId || 'LIB-2026-0001'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {profileData.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center sm:justify-end">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                  {profileData.membershipStatus?.toUpperCase() || 'ACTIVE'}
                </span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Contact'}</span>
                </button>
              </div>
            </div>

            {/* Institutional Membership Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Max Borrow Limit</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {profileData.maxBorrowLimit || 5} Books concurrently
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Valid Until</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {profileData.membershipExpiry
                    ? new Date(profileData.membershipExpiry).toLocaleDateString()
                    : 'Annual Renewal (Active)'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Member Since</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : '2026'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form Drawer */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Update Contact & Cardholder Information
            </h3>

            {saveError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Avatar Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editForm.avatar}
                  onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Campus / Postal Address</label>
                <input
                  type="text"
                  placeholder="Dorm Hall B, Room 204"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Circulation & Lending Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Loans */}
        <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Loans</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats?.activeLoansCount || 0}
          </p>
          <div className="pt-2">
            <Link
              to="/my-library"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View Borrowed Books</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Overdue Items */}
        <div className={`p-5 rounded-2xl glass-card border space-y-2 ${
          (stats?.overdueLoansCount || 0) > 0
            ? 'border-rose-500/40 bg-rose-500/5'
            : 'border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue Items</span>
            <Clock className={`w-4 h-4 ${(stats?.overdueLoansCount || 0) > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-3xl font-extrabold ${(stats?.overdueLoansCount || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {stats?.overdueLoansCount || 0}
          </p>
          <p className="text-xs text-slate-500">
            {(stats?.overdueLoansCount || 0) > 0 ? 'Immediate return required' : 'All loans in good standing'}
          </p>
        </div>

        {/* Hold Reservations */}
        <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Hold Requests</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats?.activeReservationsCount || 0}
          </p>
          <div className="pt-2">
            <Link
              to="/my-library"
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View Hold Queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Outstanding Fines */}
        <div className={`p-5 rounded-2xl glass-card border space-y-2 ${
          (stats?.unpaidFinesAmount || 0) > 0
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Fine Balance</span>
            <DollarSign className={`w-4 h-4 ${(stats?.unpaidFinesAmount || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
          </div>
          <p className={`text-3xl font-extrabold ${(stats?.unpaidFinesAmount || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            ${Number(stats?.unpaidFinesAmount || 0).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500">
            {(stats?.unpaidFinesAmount || 0) > 0 ? `${stats?.unpaidFinesCount || 1} outstanding balance(s)` : 'Zero pending balance'}
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Member Self-Service */}
        <div className="p-6 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Member Circulation Center
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Manage your borrowed books, renew loans before due dates, and view reservation holds.
          </p>
          <div className="pt-2">
            <Link
              to="/my-library"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              <span>Go to My Library Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Library Staff Portal */}
        {(profileData.role === 'admin' || profileData.role === 'librarian') ? (
          <div className="p-6 rounded-3xl glass-card border border-emerald-500/30 bg-emerald-500/5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Staff Administration Tools
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Access the Circulation Desk for issues and returns, member enrollment, fines processing, and operational analytics.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to="/circulation"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Circulation Desk
              </Link>
              <Link
                to="/members"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Members
              </Link>
              <Link
                to="/reports"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Reports
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Library Rules & Policy
              </h3>
            </div>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Standard loan period: 14 days with up to 2 renewals.</li>
              <li>Late fine rate: $0.50 per day past the due date.</li>
              <li>Present institutional card ID at physical desk when collecting holds.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
