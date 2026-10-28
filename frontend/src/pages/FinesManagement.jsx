import React, { useState, useEffect } from 'react';
import { 
  Banknote, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Search,
  Filter,
  Plus,
  CreditCard,
  QrCode,
  User
} from 'lucide-react';
import { fineService } from '../services/fineService';
import { useAuth } from '../hooks/useAuth';
import toast from '../utils/toast';

const FinesManagement = () => {
  const { user } = useAuth();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [payModalFine, setPayModalFine] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');

  const [waiveModalFine, setWaiveModalFine] = useState(null);
  const [waiverReason, setWaiverReason] = useState('');

  const [assessModalOpen, setAssessModalOpen] = useState(false);
  const [assessForm, setAssessForm] = useState({
    memberId: '',
    amount: '',
    reason: 'book_damage',
    notes: ''
  });

  const [processing, setProcessing] = useState(false);

  const fetchFines = async () => {
    try {
      setLoading(true);
      const res = await fineService.getFines({ status: statusFilter || undefined });
      const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setFines(items);
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Failed to load fines');
      setFines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [statusFilter]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payModalFine) return;
    try {
      setProcessing(true);
      await fineService.recordPayment(payModalFine._id, {
        paymentMethod,
        transactionNote: paymentNote
      });
      toast.success('Payment recorded successfully');
      setPayModalFine(null);
      setPaymentNote('');
      fetchFines();
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Payment recording failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleWaive = async (e) => {
    e.preventDefault();
    if (!waiverReason.trim()) {
      toast.error('Waiver reason is required');
      return;
    }
    try {
      setProcessing(true);
      await fineService.waiveFine(waiveModalFine._id, waiverReason);
      toast.success('Fine waived successfully');
      setWaiveModalFine(null);
      setWaiverReason('');
      fetchFines();
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Fine waiver failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleAssessPenalty = async (e) => {
    e.preventDefault();
    if (!assessForm.memberId || !assessForm.amount) {
      toast.error('Please enter Member ID and Amount');
      return;
    }
    try {
      setProcessing(true);
      await fineService.assessPenalty({
        memberId: assessForm.memberId,
        amount: Number(assessForm.amount),
        reason: `${assessForm.reason}: ${assessForm.notes}`
      });
      toast.success('Penalty assessed successfully');
      setAssessModalOpen(false);
      setAssessForm({ memberId: '', amount: '', reason: 'book_damage', notes: '' });
      fetchFines();
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Failed to assess penalty');
    } finally {
      setProcessing(false);
    }
  };

  // Filtered fines
  const fineList = Array.isArray(fines) ? fines : [];
  const filteredFines = fineList.filter((f) => {
    const q = searchQuery.toLowerCase();
    const memName = f.member?.name?.toLowerCase() || '';
    const memId = f.member?.membershipId?.toLowerCase() || '';
    const bookTitle = f.loan?.book?.title?.toLowerCase() || '';
    return memName.includes(q) || memId.includes(q) || bookTitle.includes(q);
  });

  const totalOutstanding = fineList
    .filter((f) => f.status === 'outstanding')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const totalCollected = fineList
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const totalWaived = fineList
    .filter((f) => f.status === 'waived')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-8 h-8 text-amber-500" />
            Fines & Financial Desk
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor overdue penalties, collect manual payments (Cash/Card/UPI), and issue audited fee waivers.
          </p>
        </div>
        <button
          onClick={() => setAssessModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-md transition font-medium text-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Assess Manual Penalty
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Total Outstanding</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">${totalOutstanding.toFixed(2)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fines.filter(f => f.status === 'outstanding').length} pending fines</p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Collected</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">${totalCollected.toFixed(2)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fines.filter(f => f.status === 'paid').length} settled receipts</p>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Waived</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">${totalWaived.toFixed(2)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fines.filter(f => f.status === 'waived').length} administrative waivers</p>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by member name, membership ID, or book title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="outstanding">Outstanding Only</option>
            <option value="paid">Paid Only</option>
            <option value="waived">Waived Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading fine records...</div>
        ) : filteredFines.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">No fine records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Reason / Title</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Days Overdue</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment Details</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFines.map((fine) => (
                  <tr key={fine._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{fine.member?.name || 'Unknown'}</div>
                      <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{fine.member?.membershipId || 'No ID'}</div>
                      <div className="text-xs text-gray-400">{fine.member?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{fine.reason?.replace('_', ' ')}</p>
                      {fine.loan?.book && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          Book: {fine.loan.book.title}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white">${fine.amount?.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {fine.daysOverdue ? (
                        <span className="text-red-500 font-medium">{fine.daysOverdue} days</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          fine.status === 'outstanding'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : fine.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {fine.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {fine.status === 'paid' ? (
                        <div>
                          <p className="font-medium text-emerald-600 dark:text-emerald-400 capitalize">{fine.paymentMethod}</p>
                          <p>{fine.paymentDate ? new Date(fine.paymentDate).toLocaleDateString() : ''}</p>
                          {fine.collectedBy && <p>By: {fine.collectedBy.name}</p>}
                        </div>
                      ) : fine.status === 'waived' ? (
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Reason: {fine.waiverReason}</p>
                          {fine.collectedBy && <p>By: {fine.collectedBy.name}</p>}
                        </div>
                      ) : (
                        <span className="text-gray-400">Awaiting collection</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {fine.status === 'outstanding' && (
                        <>
                          <button
                            onClick={() => setPayModalFine(fine)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                          >
                            Collect
                          </button>
                          <button
                            onClick={() => setWaiveModalFine(fine)}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-medium transition"
                          >
                            Waive
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      {payModalFine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Record Fine Payment
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Confirm receipt of <span className="font-bold text-gray-900 dark:text-white">${payModalFine.amount?.toFixed(2)}</span> from{' '}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{payModalFine.member?.name}</span>.
            </p>

            <form onSubmit={handlePay} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['cash', 'card', 'upi'].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase transition flex flex-col items-center gap-1 ${
                        paymentMethod === m
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {m === 'cash' && <Banknote className="w-4 h-4" />}
                      {m === 'card' && <CreditCard className="w-4 h-4" />}
                      {m === 'upi' && <QrCode className="w-4 h-4" />}
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Receipt / Transaction Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Receipt #1042 or UPI Ref ID"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalFine(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waive Fine Modal */}
      {waiveModalFine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-amber-500" />
              Waive Fine
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Waiving fine of <span className="font-bold text-gray-900 dark:text-white">${waiveModalFine.amount?.toFixed(2)}</span> for{' '}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{waiveModalFine.member?.name}</span>. An audit log will be created.
            </p>

            <form onSubmit={handleWaive} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Reason for Waiver <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Valid medical emergency, institutional scholarship exemption, system discrepancy..."
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWaiveModalFine(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-50"
                >
                  {processing ? 'Waiving...' : 'Approve Waiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assess Manual Penalty Modal */}
      {assessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              Assess Manual Penalty / Fee
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Apply a fee for damaged copies, replacement costs, or administrative processing.
            </p>

            <form onSubmit={handleAssessPenalty} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Member ID or User Mongo ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LIB-2026-0001 or User ID"
                  value={assessForm.memberId}
                  onChange={(e) => setAssessForm({ ...assessForm, memberId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  required
                  placeholder="e.g. 15.00"
                  value={assessForm.amount}
                  onChange={(e) => setAssessForm({ ...assessForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Reason
                </label>
                <select
                  value={assessForm.reason}
                  onChange={(e) => setAssessForm({ ...assessForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="book_damage">Book Damage Assessment</option>
                  <option value="book_lost">Book Replacement Cost (Lost)</option>
                  <option value="late_return">Manual Late Return Adjustment</option>
                  <option value="card_replacement">ID Card Replacement Fee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Details / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Torn cover, spine water damage on accession #ACC-004"
                  value={assessForm.notes}
                  onChange={(e) => setAssessForm({ ...assessForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssessModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-50"
                >
                  {processing ? 'Applying...' : 'Apply Penalty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinesManagement;
