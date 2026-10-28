import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  X,
  Loader2,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Check
} from 'lucide-react';
import {
  fetchMembers,
  fetchMemberById,
  createMember,
  updateMembership,
  updateUserRole
} from '../services/userService';
import { useAuth } from '../hooks/useAuth';

const MembersManagement = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Selected member details modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Create member modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'member',
    maxBorrowLimit: 5
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit membership limit modal state
  const [editLimitMember, setEditLimitMember] = useState(null);
  const [newLimit, setNewLimit] = useState(5);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    loadMembers();
  }, [page, statusFilter, roleFilter]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await fetchMembers({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        page,
        limit: 15
      });
      setMembers(res.data?.items || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadMembers();
  };

  // Open details modal
  const handleOpenDetails = async (memberId) => {
    setDetailsLoading(true);
    setSelectedMember(null);
    setMemberStats(null);
    try {
      const res = await fetchMemberById(memberId);
      setSelectedMember(res.data?.user);
      setMemberStats(res.data?.stats);
    } catch (err) {
      // non-fatal
    } finally {
      setDetailsLoading(false);
    }
  };

  // Toggle Member Status (active vs suspended)
  const handleToggleStatus = async (member) => {
    const nextStatus = member.membershipStatus === 'active' ? 'suspended' : 'active';
    setActionLoading(true);
    try {
      await updateMembership(member._id, { membershipStatus: nextStatus });
      setStatusMessage({
        type: 'success',
        text: `Member status updated to ${nextStatus.toUpperCase()}`
      });
      loadMembers();
      if (selectedMember && selectedMember._id === member._id) {
        setSelectedMember({ ...selectedMember, membershipStatus: nextStatus });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.friendlyMessage || 'Status update failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Promote / Change role (Admin only)
  const handleRoleChange = async (memberId, newRole) => {
    if (!isAdmin) return;
    setActionLoading(true);
    try {
      await updateUserRole(memberId, newRole);
      setStatusMessage({ type: 'success', text: `User role changed to ${newRole.toUpperCase()}` });
      loadMembers();
      if (selectedMember && selectedMember._id === memberId) {
        setSelectedMember({ ...selectedMember, role: newRole });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.friendlyMessage || 'Role change failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Save new borrow limit
  const handleSaveBorrowLimit = async (e) => {
    e.preventDefault();
    if (!editLimitMember) return;
    setActionLoading(true);
    try {
      await updateMembership(editLimitMember._id, { maxBorrowLimit: Number(newLimit) });
      setStatusMessage({ type: 'success', text: 'Borrowing limit updated successfully' });
      setEditLimitMember(null);
      loadMembers();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.friendlyMessage || 'Failed to update limit' });
    } finally {
      setActionLoading(false);
    }
  };

  // Create member submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      await createMember(createFormData);
      setStatusMessage({ type: 'success', text: 'New member account created successfully!' });
      setIsCreateOpen(false);
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        role: 'member',
        maxBorrowLimit: 5
      });
      loadMembers();
    } catch (err) {
      setCreateError(err.friendlyMessage || 'Failed to create member account');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Members & Staff Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage library student members, librarians, account statuses, and borrowing privileges.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Library Member</span>
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center space-x-2 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, membership ID, or phone..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="member">Student / Member</option>
            <option value="librarian">Librarian</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-3xl glass-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Member Profile</th>
                <th className="px-4 py-3">Membership ID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Borrow Limit</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading library members...</span>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No members found matching criteria.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const roleBadge = m.role === 'admin'
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    : m.role === 'librarian'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';

                  const statusBadge = m.membershipStatus === 'active'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20';

                  return (
                    <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={m.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{m.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {m.membershipId || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleBadge}`}>
                          {m.role === 'user' ? 'member' : m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                          {m.membershipStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                        {m.maxBorrowLimit || 5} books
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenDetails(m._id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-[11px]"
                          >
                            Card
                          </button>

                          <button
                            onClick={() => {
                              setEditLimitMember(m);
                              setNewLimit(m.maxBorrowLimit || 5);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-[11px]"
                          >
                            Limit
                          </button>

                          <button
                            onClick={() => handleToggleStatus(m)}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] ${
                              m.membershipStatus === 'active'
                                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {m.membershipStatus === 'active' ? 'Suspend' : 'Activate'}
                          </button>

                          {isAdmin && (
                            <select
                              value={m.role === 'user' ? 'member' : m.role}
                              onChange={(e) => handleRoleChange(m._id, e.target.value)}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            >
                              <option value="member">Role: Member</option>
                              <option value="librarian">Role: Librarian</option>
                              <option value="admin">Role: Admin</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Member Card & Loan History Details */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative space-y-6">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <img
                src={selectedMember.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={selectedMember.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/40"
              />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{selectedMember.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedMember.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] text-slate-400 block">Active Loans</span>
                <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  {memberStats?.activeLoans || 0}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] text-slate-400 block">Overdue Items</span>
                <span className={`font-bold text-sm ${memberStats?.overdueLoans > 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                  {memberStats?.overdueLoans || 0}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] text-slate-400 block">Unpaid Fines</span>
                <span className={`font-bold text-sm ${memberStats?.outstandingFines > 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                  ${(memberStats?.outstandingFines || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] text-slate-400 block">Total Lifetime</span>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  {memberStats?.totalLoans || 0}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Membership ID: <strong className="font-mono text-slate-900 dark:text-slate-100">{selectedMember.membershipId}</strong></span>
              </p>
              {selectedMember.phone && (
                <p className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  <span>Phone: <strong className="text-slate-900 dark:text-slate-100">{selectedMember.phone}</strong></span>
                </p>
              )}
              {selectedMember.address && (
                <p className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span>Address: <strong className="text-slate-900 dark:text-slate-100">{selectedMember.address}</strong></span>
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Member Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative space-y-4">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              <span>Register New Library Member</span>
            </h3>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  placeholder="e.g. maya@libraryverse.test"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  placeholder="Defaults to LibraryPass123!"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    placeholder="+1 (555) 012-3456"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Borrow Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={createFormData.maxBorrowLimit}
                    onChange={(e) => setCreateFormData({ ...createFormData, maxBorrowLimit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {isAdmin && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Role</label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="member">Student / Member</option>
                    <option value="librarian">Librarian Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Borrow Limit */}
      {editLimitMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative space-y-4">
            <button
              onClick={() => setEditLimitMember(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Adjust Borrow Limit for {editLimitMember.name}
            </h3>

            <form onSubmit={handleSaveBorrowLimit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Max Borrowable Books (1 - 20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditLimitMember(null)}
                  className="px-3 py-1.5 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersManagement;
