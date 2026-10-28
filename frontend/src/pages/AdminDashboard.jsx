import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  BookOpen,
  RefreshCw,
  Clock,
  AlertTriangle,
  DollarSign,
  Settings,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  BarChart3,
  Layers,
  Activity,
  Sliders,
  Loader2,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import {
  getAdminOverview,
  getLibrarians,
  approveLibrarian,
  rejectLibrarian,
  getUsers,
  updateUserStatus,
  getPolicies,
  updatePolicies
} from '../services/adminService';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'requests' | 'users' | 'policies'
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Librarian Requests state
  const [librarians, setLibrarians] = useState([]);
  const [librarianFilter, setLibrarianFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [loadingLibrarians, setLoadingLibrarians] = useState(false);
  const [librarianSearch, setLibrarianSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectionModalUser, setRejectionModalUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // User management state
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Policy configuration state
  const [policies, setPolicies] = useState({
    loanDurationDays: 14,
    maxBorrowLimit: 5,
    renewalLimit: 2,
    dailyFineRate: 1.0,
    reservationPickupHours: 48
  });
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyMessage, setPolicyMessage] = useState('');

  const [generalError, setGeneralError] = useState('');

  // Load Overview Data
  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await getAdminOverview();
      setOverview(res.data);
    } catch (err) {
      setGeneralError(err.friendlyMessage || 'Failed to fetch admin overview');
    } finally {
      setLoadingOverview(false);
    }
  };

  // Load Librarian Applications
  const loadLibrarians = async () => {
    try {
      setLoadingLibrarians(true);
      const res = await getLibrarians(librarianFilter, librarianSearch);
      setLibrarians(res.data || []);
    } catch (err) {
      setGeneralError(err.friendlyMessage || 'Failed to load librarian applications');
    } finally {
      setLoadingLibrarians(false);
    }
  };

  // Load Users
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await getUsers({
        search: userSearch,
        role: userRoleFilter,
        status: userStatusFilter,
        limit: 50
      });
      setUsersList(res.data?.items || []);
    } catch (err) {
      setGeneralError(err.friendlyMessage || 'Failed to load user accounts');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load Policies
  const loadPolicies = async () => {
    try {
      const res = await getPolicies();
      if (res.data) {
        setPolicies({
          loanDurationDays: res.data.loanDurationDays || 14,
          maxBorrowLimit: res.data.maxBorrowLimit || 5,
          renewalLimit: res.data.renewalLimit || 2,
          dailyFineRate: res.data.dailyFineRate || 1.0,
          reservationPickupHours: res.data.reservationPickupHours || 48
        });
      }
    } catch (err) {
      console.error('Failed to load policies', err);
    }
  };

  useEffect(() => {
    loadOverview();
    loadPolicies();
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      loadLibrarians();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, librarianFilter]);

  // Handle Approve Librarian
  const handleApprove = async (id) => {
    try {
      setActionLoadingId(id);
      await approveLibrarian(id);
      await loadLibrarians();
      await loadOverview();
    } catch (err) {
      setGeneralError(err.friendlyMessage || 'Failed to approve application');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Librarian
  const handleRejectSubmit = async () => {
    if (!rejectionModalUser) return;
    try {
      setActionLoadingId(rejectionModalUser._id);
      await rejectLibrarian(rejectionModalUser._id, rejectionReason);
      setRejectionModalUser(null);
      setRejectionReason('');
      await loadLibrarians();
      await loadOverview();
    } catch (err) {
      setGeneralError(err.friendlyMessage || 'Failed to reject application');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Toggle User Status (Suspend / Reactivate)
  const handleToggleStatus = async (user) => {
    const newStatus = user.accountStatus === 'suspended' ? 'active' : 'suspended';
    try {
      setActionLoadingId(user._id);
      await updateUserStatus(user._id, newStatus);
      await loadUsers();
      await loadOverview();
    } catch (err) {
      setGeneralError(err.friendlyMessage || 'Failed to update account status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Save Policies
  const handleSavePolicies = async (e) => {
    e.preventDefault();
    try {
      setSavingPolicy(true);
      setPolicyMessage('');
      await updatePolicies(policies);
      setPolicyMessage('Library circulation policies and limits updated successfully.');
      setTimeout(() => setPolicyMessage(''), 4000);
    } catch (err) {
      setGeneralError(err.friendlyMessage || 'Failed to save system policies');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Administrator Platform Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global library system oversight, staff authorization, cardholder management, and policy controls
          </p>
        </div>

        {/* Quick Operational Links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/circulation"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Circulation Desk</span>
          </Link>
          <Link
            to="/reports"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Reports & CSV</span>
          </Link>
          <Link
            to="/audit"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Audit Trail</span>
          </Link>
        </div>
      </div>

      {generalError && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
          <span>{generalError}</span>
          <button onClick={() => setGeneralError('')} className="text-rose-400 hover:text-rose-200 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>System Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap relative ${
            activeTab === 'requests'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Librarian Requests</span>
          {overview?.pendingLibrarians > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {overview.pendingLibrarians}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Staff</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'policies'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Library Policies</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {loadingOverview ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              {/* Top Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Registered Members</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {overview?.totalUsers || 0}
                  </div>
                  <div className="text-[11px] text-slate-400">Cardholder community</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Active Librarians</span>
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {overview?.totalLibrarians || 0}
                  </div>
                  <div className="text-[11px] text-slate-400">Approved operational staff</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-amber-500/20 bg-amber-500/5 space-y-1">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    <span>Pending Staff Requests</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {overview?.pendingLibrarians || 0}
                  </div>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Review applications</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Book Titles / Copies</span>
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {overview?.totalBooks || 0} <span className="text-sm font-normal text-slate-400">/ {overview?.totalCopies || 0}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Total physical inventory</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Active Loans</span>
                    <RefreshCw className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {overview?.activeLoans || 0}
                  </div>
                  <div className="text-[11px] text-slate-400">Currently in reader hands</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-rose-500/20 bg-rose-500/5 space-y-1">
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <span>Overdue Loans</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
                    {overview?.overdueLoans || 0}
                  </div>
                  <div className="text-[11px] text-slate-400">Items past due date</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Pending Reservations</span>
                    <Layers className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {overview?.pendingReservations || 0}
                  </div>
                  <div className="text-[11px] text-slate-400">Titles in hold queue</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Unpaid Fines</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    ${(overview?.outstandingFines || 0).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400">Outstanding overdue fees</div>
                </div>
              </div>

              {/* Recent Audit Activities */}
              <div className="p-6 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Recent System Audit Operations
                    </h2>
                  </div>
                  <Link
                    to="/audit"
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>View complete log</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {overview?.recentAudits?.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {overview.recentAudits.map((log) => (
                      <div key={log._id} className="py-2.5 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {log.actorName || log.actor?.name || 'System'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {log.actorRole || log.actor?.role}
                            </span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">
                              {log.action}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Entity: <span className="font-medium text-slate-700 dark:text-slate-300">{log.entityType}</span>
                            {log.details?.email && ` (${log.details.email})`}
                            {log.details?.bookTitle && ` - "${log.details.bookTitle}"`}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No recent audit logs recorded.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: LIBRARIAN REQUESTS & APPROVALS */}
      {activeTab === 'requests' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Subfilter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {['pending', 'approved', 'rejected', 'all'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLibrarianFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all ${
                    librarianFilter === filter
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search applicants..."
                value={librarianSearch}
                onChange={(e) => setLibrarianSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadLibrarians()}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {loadingLibrarians ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : librarians.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Librarian Applications Found
              </h3>
              <p className="text-xs text-slate-400">
                There are currently no staff requests matching status "{librarianFilter}".
              </p>
            </div>
          ) : (
            <div className="rounded-2xl glass-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Applied Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Details / Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {librarians.map((lib) => (
                      <tr key={lib._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                              {lib.name.charAt(0)}
                            </span>
                            <span>{lib.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                          {lib.email}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(lib.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            lib.accountStatus === 'approved' || lib.accountStatus === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : lib.accountStatus === 'rejected'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          }`}>
                            {lib.accountStatus || 'pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {lib.accountStatus === 'rejected' && lib.rejectionReason && (
                            <span className="text-rose-600 dark:text-rose-400 italic">
                              Reason: {lib.rejectionReason}
                            </span>
                          )}
                          {lib.accountStatus === 'approved' && lib.approvedBy && (
                            <span className="text-slate-400">
                              Approved by: {lib.approvedBy?.name || 'Administrator'}
                            </span>
                          )}
                          {lib.accountStatus === 'pending' && (
                            <span className="text-amber-600 dark:text-amber-400">
                              Awaiting administrator action
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {lib.accountStatus === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(lib._id)}
                                disabled={actionLoadingId === lib._id}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-all disabled:opacity-50"
                              >
                                {actionLoadingId === lib._id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => setRejectionModalUser(lib)}
                                disabled={actionLoadingId === lib._id}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1 transition-all disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Processed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rejection Modal */}
          {rejectionModalUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="text-sm font-bold">Reject Librarian Application</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  You are about to reject the staff application for{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {rejectionModalUser.name} ({rejectionModalUser.email})
                  </span>
                  .
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Rejection Reason (will be shown to applicant)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setRejectionModalUser(null);
                      setRejectionReason('');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectSubmit}
                    disabled={actionLoadingId === rejectionModalUser._id}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {actionLoadingId === rejectionModalUser._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USERS & STAFF DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Roles</option>
                <option value="user">User (Member)</option>
                <option value="librarian">Librarian</option>
                <option value="admin">Admin</option>
              </select>

              {/* Status filter */}
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, card ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : usersList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-card border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No matching accounts found.
            </div>
          ) : (
            <div className="rounded-2xl glass-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4">Card ID</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {usersList.map((usr) => (
                      <tr key={usr._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {usr.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                          {usr.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            usr.role === 'admin'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : usr.role === 'librarian'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {usr.role === 'member' ? 'user' : usr.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            usr.accountStatus === 'suspended'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : usr.accountStatus === 'pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {usr.accountStatus || 'active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {usr.membershipId || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {usr.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleStatus(usr)}
                              disabled={actionLoadingId === usr._id}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                usr.accountStatus === 'suspended'
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-600 hover:text-white'
                              }`}
                            >
                              {usr.accountStatus === 'suspended' ? 'Reactivate' : 'Suspend'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SYSTEM POLICIES & OPERATIONAL RULES */}
      {activeTab === 'policies' && (
        <div className="max-w-2xl space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Global Circulation Rules & Policies
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure loan durations, renewal thresholds, reservation deadlines, and daily fine rates.
              </p>
            </div>

            {policyMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{policyMessage}</span>
              </div>
            )}

            <form onSubmit={handleSavePolicies} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Default Loan Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={policies.loanDurationDays}
                    onChange={(e) => setPolicies({ ...policies, loanDurationDays: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Standard period before loan is marked overdue.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Max Active Loans Per Member
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={policies.maxBorrowLimit}
                    onChange={(e) => setPolicies({ ...policies, maxBorrowLimit: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Borrowing cap per cardholder.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Renewal Count Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={policies.renewalLimit}
                    onChange={(e) => setPolicies({ ...policies, renewalLimit: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Maximum times an active loan may be renewed.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Daily Fine Rate ($ per day)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="10"
                    value={policies.dailyFineRate}
                    onChange={(e) => setPolicies({ ...policies, dailyFineRate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Accrued automatically on overdue book return.</p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Reservation Hold Window (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={policies.reservationPickupHours}
                    onChange={(e) => setPolicies({ ...policies, reservationPickupHours: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Hours a ready reserved copy is held at desk before release.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPolicy}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                {savingPolicy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Policies...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save System Policies</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
