import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Bookmark,
  History,
  Barcode,
  Loader2,
  ExternalLink,
  X
} from 'lucide-react';
import { fetchMyLoans, renewLoan } from '../services/circulationService';
import { fetchMyReservations, cancelReservation } from '../services/reservationService';
import { fetchMyFines } from '../services/fineService';
import { useAuth } from '../hooks/useAuth';

const MyLibrary = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('loans'); // 'loans', 'history', 'reservations', 'fines'

  const [activeLoans, setActiveLoans] = useState([]);
  const [loanHistory, setLoanHistory] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [finesData, setFinesData] = useState({ fines: [], outstandingTotal: 0 });

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    loadMemberData();
  }, [user]);

  const loadMemberData = async () => {
    setLoading(true);
    try {
      const [loansRes, resRes, finesRes] = await Promise.all([
        fetchMyLoans(),
        fetchMyReservations(),
        fetchMyFines()
      ]);

      const allLoans = loansRes.data || [];
      setActiveLoans(allLoans.filter((l) => l.status === 'active' || l.status === 'overdue'));
      setLoanHistory(allLoans.filter((l) => l.status === 'returned'));
      setReservations(resRes.data || []);
      setFinesData(finesRes.data || { fines: [], outstandingTotal: 0 });
    } catch (err) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (loanId) => {
    setActionLoadingId(loanId);
    setStatusMessage(null);
    try {
      const res = await renewLoan(loanId);
      setStatusMessage({
        type: 'success',
        text: `Loan renewed! Your new due date is ${new Date(res.data.dueDate).toLocaleDateString()}.`
      });
      loadMemberData();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.friendlyMessage || 'Loan renewal could not be processed.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelReservation = async (resId) => {
    setActionLoadingId(resId);
    setStatusMessage(null);
    try {
      await cancelReservation(resId);
      setStatusMessage({
        type: 'success',
        text: 'Reservation cancelled successfully.'
      });
      loadMemberData();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.friendlyMessage || 'Failed to cancel reservation.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getDueStatus = (dueDateStr) => {
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`,
        className: 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold',
        isOverdue: true
      };
    } else if (diffDays === 0) {
      return {
        label: 'Due Today',
        className: 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold',
        isOverdue: false
      };
    } else if (diffDays <= 3) {
      return {
        label: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
        className: 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold',
        isOverdue: false
      };
    } else {
      return {
        label: `Due in ${diffDays} days`,
        className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        isOverdue: false
      };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner / Digital Library ID Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Digital Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-2xl border border-indigo-500/30 relative overflow-hidden flex flex-col justify-between space-y-6">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-300">
                Official Library Member Card
              </span>
              <h2 className="text-xl font-bold tracking-tight mt-1">{user?.name}</h2>
              <p className="text-xs text-indigo-200 font-mono mt-0.5">{user?.email}</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <BookOpen className="w-6 h-6 text-indigo-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/10 text-xs">
            <div>
              <span className="text-[10px] text-indigo-300 block">Membership ID</span>
              <span className="font-mono font-bold tracking-wider text-sm">{user?.membershipId || 'LIB-MEM-000'}</span>
            </div>
            <div>
              <span className="text-[10px] text-indigo-300 block">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {user?.membershipStatus || 'Active'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-indigo-300 block">Borrow Limit</span>
              <span className="font-bold">{activeLoans.length} / {user?.maxBorrowLimit || 5} books</span>
            </div>
            <div>
              <span className="text-[10px] text-indigo-300 block">Valid Until</span>
              <span className="font-bold">
                {user?.membershipExpiry ? new Date(user.membershipExpiry).toLocaleDateString() : 'Annual'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-indigo-300 font-mono">
            <div className="flex items-center space-x-1.5">
              <Barcode className="w-5 h-5 opacity-80" />
              <span>{user?.membershipId}</span>
            </div>
            <span className="text-[10px] opacity-70">BookVerse LMS</span>
          </div>
        </div>

        {/* Quick Stats overview */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Currently Borrowed</span>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {activeLoans.length}
              </span>
              <span className="text-xs text-slate-400">items</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">Active loan items</span>
          </div>

          <div className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Holds</span>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-violet-600 dark:text-violet-400">
                {reservations.filter((r) => r.status === 'pending' || r.status === 'available').length}
              </span>
              <span className="text-xs text-slate-400">holds</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">Pending fulfillment</span>
          </div>

          <div className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lifetime Returns</span>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                {loanHistory.length}
              </span>
              <span className="text-xs text-slate-400">books</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">Borrowing history</span>
          </div>

          <div className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Outstanding Fines</span>
            <div className="mt-3 flex items-baseline space-x-1">
              <span className={`text-3xl font-extrabold ${finesData.outstandingTotal > 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                ${finesData.outstandingTotal.toFixed(2)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">Unpaid balances</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab('loans')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'loans'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Active Loans ({activeLoans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'reservations'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>My Reservations ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Borrowing History ({loanHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fines')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'fines'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Fines & Receipts ({finesData.fines?.length || 0})</span>
        </button>
      </div>

      {/* Global Status Message */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center space-x-2 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* TAB 1: ACTIVE LOANS */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs">Loading active loans...</p>
            </div>
          ) : activeLoans.length === 0 ? (
            <div className="py-16 text-center space-y-3 glass-card rounded-3xl border border-slate-200 dark:border-slate-800">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No active book loans</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                You haven't borrowed any books currently. Explore our catalog and pick up your next great read!
              </p>
              <Link
                to="/"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all mt-2"
              >
                <span>Browse Catalog</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLoans.map((loan) => {
                const dueStatus = getDueStatus(loan.dueDate);
                const isLoading = actionLoadingId === loan._id;

                return (
                  <div
                    key={loan._id}
                    className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all"
                  >
                    <div className="flex space-x-4">
                      {loan.book?.coverImage && (
                        <img
                          src={loan.book.coverImage}
                          alt={loan.book.title}
                          className="w-16 h-24 object-cover rounded-xl shadow-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link
                          to={`/books/${loan.book?._id}`}
                          className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 line-clamp-1 transition-colors"
                        >
                          {loan.book?.title}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{loan.book?.author}</p>
                        <div className="pt-2 text-[11px] text-slate-400 space-y-0.5">
                          <p>Copy Accession: <span className="font-mono text-slate-700 dark:text-slate-300">{loan.copy?.accessionNumber}</span></p>
                          <p>Shelf Location: <span className="text-slate-700 dark:text-slate-300">{loan.copy?.shelfLocation || 'Main Stacks'}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block">Due Date</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {new Date(loan.dueDate).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] rounded-full border ${dueStatus.className}`}>
                            {dueStatus.label}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRenew(loan._id)}
                        disabled={isLoading || dueStatus.isOverdue || loan.renewalCount >= (loan.maxRenewals || 2)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Renew ({loan.renewalCount || 0}/{loan.maxRenewals || 2})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {reservations.length === 0 ? (
            <div className="py-16 text-center space-y-3 glass-card rounded-3xl border border-slate-200 dark:border-slate-800">
              <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No active book reservations</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Need a book that is currently checked out? Place a reservation hold and we will notify you when it returns.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservations.map((res) => {
                const isLoading = actionLoadingId === res._id;
                const isReady = res.status === 'available';

                return (
                  <div
                    key={res._id}
                    className={`p-5 rounded-3xl glass-card border shadow-lg space-y-4 ${
                      isReady
                        ? 'border-emerald-500/60 bg-emerald-500/5'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex space-x-4">
                      {res.book?.coverImage && (
                        <img
                          src={res.book.coverImage}
                          alt={res.book.title}
                          className="w-16 h-24 object-cover rounded-xl shadow-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link
                          to={`/books/${res.book?._id}`}
                          className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 line-clamp-1"
                        >
                          {res.book?.title}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{res.book?.author}</p>
                        <p className="text-[11px] text-slate-400 pt-1">
                          Reserved on: {new Date(res.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        {isReady ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-emerald-500 flex items-center space-x-1 text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Ready for pickup at front desk!</span>
                            </span>
                            {res.pickupDeadline && (
                              <p className="text-[10px] text-slate-500">
                                Claim before {new Date(res.pickupDeadline).toLocaleDateString()} {new Date(res.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                            Queue Position: #{res.priority}
                          </span>
                        )}
                      </div>

                      {['pending', 'available'].includes(res.status) && (
                        <button
                          onClick={() => handleCancelReservation(res._id)}
                          disabled={isLoading}
                          className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center space-x-1"
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          <span>Cancel Hold</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BORROWING HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loanHistory.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 glass-card rounded-3xl border border-slate-200 dark:border-slate-800">
              No borrowing history recorded yet.
            </div>
          ) : (
            <div className="rounded-3xl glass-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Book Title</th>
                    <th className="px-4 py-3">Copy Accession #</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3">Return Date</th>
                    <th className="px-4 py-3">Fine Assessed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loanHistory.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {l.book?.title}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {l.copy?.accessionNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {new Date(l.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        {l.returnDate ? new Date(l.returnDate).toLocaleDateString() : 'Returned'}
                      </td>
                      <td className="px-4 py-3">
                        {l.fineAmount > 0 ? (
                          <span className="text-rose-500 font-bold">${l.fineAmount.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">$0.00</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FINES & RECEIPTS */}
      {activeTab === 'fines' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Outstanding Balance Due</span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                ${finesData.outstandingTotal.toFixed(2)}
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xs text-right">
              Fines can be paid in cash, credit card, or UPI at the main library circulation counter.
            </p>
          </div>

          {finesData.fines?.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 glass-card rounded-3xl border border-slate-200 dark:border-slate-800">
              No fine records or penalties on your account. Good job returning books on time!
            </div>
          ) : (
            <div className="rounded-3xl glass-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Book Reference</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Fine Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {finesData.fines?.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {f.loan?.book?.title || 'Library Penalty'}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400">
                        {f.reason} {f.daysOverdue > 0 && `(${f.daysOverdue} days)`}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        ${f.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          f.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : f.status === 'waived'
                            ? 'bg-indigo-500/10 text-indigo-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {f.status === 'paid' && f.paymentDate ? (
                          <span>Paid on {new Date(f.paymentDate).toLocaleDateString()} via {f.paymentMethod?.toUpperCase()}</span>
                        ) : f.status === 'waived' ? (
                          <span>Waived: {f.waiverReason}</span>
                        ) : (
                          <span className="text-rose-500">Pay at Circulation Desk</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyLibrary;
