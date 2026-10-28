import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ArrowRightLeft,
  Barcode,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  RotateCcw,
  Search,
  Loader2,
  FileText,
  DollarSign
} from 'lucide-react';
import {
  issueBook,
  returnBook,
  renewLoan,
  fetchLoans,
  fetchOverdueLoans
} from '../services/circulationService';
import { fetchCopyByCode } from '../services/copyService';
import { fetchMemberById, fetchMembers } from '../services/userService';
import { useAuth } from '../hooks/useAuth';

const CirculationDesk = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('issue'); // 'issue', 'return', 'loans'

  // Quick Issue state
  const [issueBarcode, setIssueBarcode] = useState('');
  const [issueMemberId, setIssueMemberId] = useState('');
  const [customDueDate, setCustomDueDate] = useState('');
  const [issueNotes, setIssueNotes] = useState('');
  const [previewCopy, setPreviewCopy] = useState(null);
  const [previewMember, setPreviewMember] = useState(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(null);
  const [issueError, setIssueError] = useState('');

  // Quick Return state
  const [returnBarcode, setReturnBarcode] = useState('');
  const [returnPreview, setReturnPreview] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(null);
  const [returnError, setReturnError] = useState('');

  // Active & Overdue Loans table state
  const [loans, setLoans] = useState([]);
  const [loansFilter, setLoansFilter] = useState('active'); // 'active', 'overdue', 'all'
  const [loansSearch, setLoansSearch] = useState('');
  const [loansLoading, setLoansLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [tableMessage, setTableMessage] = useState(null);

  // Load loans when tab or filter changes
  useEffect(() => {
    if (activeTab === 'loans') {
      loadLoansTable();
    }
  }, [activeTab, loansFilter]);

  const loadLoansTable = async () => {
    setLoansLoading(true);
    try {
      if (loansFilter === 'overdue') {
        const res = await fetchOverdueLoans();
        setLoans(res.data || []);
      } else {
        const status = loansFilter === 'all' ? undefined : loansFilter;
        const res = await fetchLoans({ status, limit: 50 });
        setLoans(res.data?.items || []);
      }
    } catch (err) {
      setLoans([]);
    } finally {
      setLoansLoading(false);
    }
  };

  // Quick copy lookup for Issue
  const handleLookupCopyForIssue = async () => {
    if (!issueBarcode.trim()) return;
    try {
      setIssueError('');
      const res = await fetchCopyByCode(issueBarcode.trim());
      setPreviewCopy(res.data);
    } catch (err) {
      setPreviewCopy(null);
      setIssueError(err.friendlyMessage || `Copy not found with code: "${issueBarcode}"`);
    }
  };

  // Quick member lookup for Issue
  const handleLookupMemberForIssue = async () => {
    if (!issueMemberId.trim()) return;
    try {
      setIssueError('');
      const searchRes = await fetchMembers({ search: issueMemberId.trim(), limit: 1 });
      const found = searchRes.data?.items?.[0];
      if (found) {
        setPreviewMember(found);
      } else {
        setPreviewMember(null);
        setIssueError(`No member found for: "${issueMemberId}"`);
      }
    } catch (err) {
      setPreviewMember(null);
      setIssueError('Failed to lookup member');
    }
  };

  // Execute Issue
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueBarcode.trim() || !issueMemberId.trim()) {
      setIssueError('Both copy barcode and member identifier are required.');
      return;
    }

    setIssueLoading(true);
    setIssueError('');
    setIssueSuccess(null);
    try {
      const res = await issueBook({
        copyIdentifier: issueBarcode.trim(),
        memberIdentifier: issueMemberId.trim(),
        dueDate: customDueDate || undefined,
        notes: issueNotes.trim() || undefined
      });
      setIssueSuccess(res.data);
      setIssueBarcode('');
      setIssueMemberId('');
      setPreviewCopy(null);
      setPreviewMember(null);
      setCustomDueDate('');
      setIssueNotes('');
    } catch (err) {
      setIssueError(err.friendlyMessage || 'Failed to issue book copy.');
    } finally {
      setIssueLoading(false);
    }
  };

  // Quick Return lookup on barcode change / submit
  const handleLookupReturn = async () => {
    if (!returnBarcode.trim()) return;
    try {
      setReturnError('');
      const res = await fetchCopyByCode(returnBarcode.trim());
      setReturnPreview(res.data);
    } catch (err) {
      setReturnPreview(null);
      setReturnError(err.friendlyMessage || `No copy found for barcode "${returnBarcode}"`);
    }
  };

  // Execute Return
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnBarcode.trim()) {
      setReturnError('Please scan or enter copy barcode.');
      return;
    }

    setReturnLoading(true);
    setReturnError('');
    setReturnSuccess(null);
    try {
      const res = await returnBook({ copyIdentifier: returnBarcode.trim() });
      setReturnSuccess(res.data);
      setReturnBarcode('');
      setReturnPreview(null);
    } catch (err) {
      setReturnError(err.friendlyMessage || 'Failed to process return.');
    } finally {
      setReturnLoading(false);
    }
  };

  // Renew loan from table
  const handleRenewFromTable = async (loanId) => {
    setActionLoadingId(loanId);
    setTableMessage(null);
    try {
      const res = await renewLoan(loanId);
      setTableMessage({ type: 'success', text: `Loan renewed until ${new Date(res.data.dueDate).toLocaleDateString()}` });
      loadLoansTable();
    } catch (err) {
      setTableMessage({ type: 'error', text: err.friendlyMessage || 'Renewal failed' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Return loan from table
  const handleReturnFromTable = async (copyBarcode, loanId) => {
    setActionLoadingId(loanId);
    setTableMessage(null);
    try {
      const res = await returnBook({ loanId });
      setTableMessage({
        type: 'success',
        text: `Book returned successfully.${res.data.fineAssessed ? ` Overdue fine: $${res.data.fineAssessed.amount.toFixed(2)}` : ''}`
      });
      loadLoansTable();
    } catch (err) {
      setTableMessage({ type: 'error', text: err.friendlyMessage || 'Return failed' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Circulation Desk
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Scan barcodes or accession numbers to rapidly issue, return, and renew book copies.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="inline-flex p-1 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('issue')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'issue'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Quick Issue
          </button>
          <button
            onClick={() => setActiveTab('return')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'return'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Quick Return
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'loans'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Loans & Overdues
          </button>
        </div>
      </div>

      {/* TAB 1: QUICK ISSUE */}
      {activeTab === 'issue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <Barcode className="w-5 h-5 text-indigo-500" />
                  <span>Check Out / Issue Book Copy</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter or scan the physical copy barcode and member ID.
                </p>
              </div>

              {issueError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{issueError}</span>
                </div>
              )}

              {issueSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Book Issued Successfully!</p>
                    <p className="mt-0.5">
                      "{issueSuccess.book?.title}" (Copy: {issueSuccess.copy?.accessionNumber}) has been issued to{' '}
                      <strong>{issueSuccess.member?.name}</strong>. Due on{' '}
                      <strong>{new Date(issueSuccess.dueDate).toLocaleDateString()}</strong>.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
                {/* Copy Barcode Input */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Book Copy Barcode or Accession # *
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={issueBarcode}
                        onChange={(e) => setIssueBarcode(e.target.value)}
                        onBlur={handleLookupCopyForIssue}
                        placeholder="e.g. BC1727191102 or ACC-TEST-001"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLookupCopyForIssue}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                    >
                      Lookup
                    </button>
                  </div>
                </div>

                {/* Member ID Input */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Member ID or Email Address *
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={issueMemberId}
                        onChange={(e) => setIssueMemberId(e.target.value)}
                        onBlur={handleLookupMemberForIssue}
                        placeholder="e.g. LIB-2026-782103 or student@libraryverse.test"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLookupMemberForIssue}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                    >
                      Lookup
                    </button>
                  </div>
                </div>

                {/* Custom Due Date & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={customDueDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCustomDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                    <span className="text-[10px] text-slate-400">Defaults to 14 days standard loan</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Staff Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={issueNotes}
                      onChange={(e) => setIssueNotes(e.target.value)}
                      placeholder="e.g. Verified ID card presented"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={issueLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2"
                  >
                    {issueLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Confirm & Issue Book</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right sidebar: Live Previews */}
          <div className="space-y-4">
            {/* Copy Preview */}
            <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Physical Copy Details</span>
              </h4>
              {previewCopy ? (
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {previewCopy.book?.title}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Author: {previewCopy.book?.author}
                  </p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Accession #</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{previewCopy.accessionNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Shelf Location</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{previewCopy.shelfLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Status</span>
                      <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full inline-block ${
                        previewCopy.status === 'available'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {previewCopy.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Condition</span>
                      <span className="font-bold capitalize text-slate-700 dark:text-slate-200">{previewCopy.condition}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Enter a barcode above to preview book details.
                </p>
              )}
            </div>

            {/* Member Preview */}
            <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-indigo-500" />
                <span>Borrower Member Details</span>
              </h4>
              {previewMember ? (
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {previewMember.name}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">{previewMember.email}</p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Member ID</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{previewMember.membershipId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Account Status</span>
                      <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full inline-block ${
                        previewMember.membershipStatus === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {previewMember.membershipStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Borrow Limit</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{previewMember.maxBorrowLimit || 5} books</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Card Expiry</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {previewMember.membershipExpiry ? new Date(previewMember.membershipExpiry).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Enter member ID above to preview borrower profile.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUICK RETURN */}
      {activeTab === 'return' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-indigo-500" />
                <span>Return Book Copy</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Scan the barcode on the returned physical copy to instantly clear the loan.
              </p>
            </div>

            {returnError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{returnError}</span>
              </div>
            )}

            {returnSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <CheckCircle className="w-5 h-5" />
                  <span>Return Recorded Successfully!</span>
                </div>
                <p>
                  "{returnSuccess.loan?.book?.title}" has been returned by {returnSuccess.loan?.member?.name}.
                </p>
                {returnSuccess.fineAssessed && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Overdue Fine Assessed: ${returnSuccess.fineAssessed.amount.toFixed(2)} ({returnSuccess.fineAssessed.daysOverdue} days overdue).
                  </div>
                )}
                {returnSuccess.heldForReservation && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                    📌 RESERVATION ALERT: This copy has been placed on hold for a waiting reader. Please place it on the Hold Shelf!
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Scan / Enter Barcode or Accession # *
                </label>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={returnBarcode}
                    onChange={(e) => setReturnBarcode(e.target.value)}
                    placeholder="Scan barcode..."
                    required
                    autoFocus
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={returnLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2"
              >
                {returnLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Process Return</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: LOANS & OVERDUES TABLE */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLoansFilter('active')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  loansFilter === 'active'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Active Loans
              </button>
              <button
                onClick={() => setLoansFilter('overdue')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  loansFilter === 'overdue'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Overdue Loans
              </button>
              <button
                onClick={() => setLoansFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  loansFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All History
              </button>
            </div>

            <button
              onClick={loadLoansTable}
              className="text-xs text-indigo-500 hover:underline flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Table</span>
            </button>
          </div>

          {tableMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              tableMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{tableMessage.text}</span>
            </div>
          )}

          {/* Loans Table */}
          <div className="rounded-3xl glass-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Book & Copy</th>
                    <th className="px-4 py-3">Borrower Member</th>
                    <th className="px-4 py-3">Issued</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Circulation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loansLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        <span>Loading circulation records...</span>
                      </td>
                    </tr>
                  ) : loans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No loans found matching the current filter.
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => {
                      const isOverdue = new Date() > new Date(loan.dueDate) && loan.status === 'active';
                      const isLoading = actionLoadingId === loan._id;

                      return (
                        <tr key={loan._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center space-x-3">
                              {loan.book?.coverImage && (
                                <img
                                  src={loan.book.coverImage}
                                  alt={loan.book.title}
                                  className="w-8 h-12 object-cover rounded shadow flex-shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{loan.book?.title}</p>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  {loan.copy?.barcode || loan.copy?.accessionNumber}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{loan.member?.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{loan.member?.membershipId}</p>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                            {new Date(loan.issueDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className={`font-semibold ${isOverdue ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                              {new Date(loan.dueDate).toLocaleDateString()}
                              {isOverdue && (
                                <span className="block text-[10px] text-rose-500 font-bold">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              loan.status === 'returned'
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                : isOverdue || loan.status === 'overdue'
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {isOverdue ? 'Overdue' : loan.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {loan.status !== 'returned' && (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleRenewFromTable(loan._id)}
                                  disabled={isLoading || isOverdue}
                                  title="Renew 14 days"
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-[11px] disabled:opacity-40"
                                >
                                  Renew
                                </button>
                                <button
                                  onClick={() => handleReturnFromTable(loan.copy?.barcode, loan._id)}
                                  disabled={isLoading}
                                  title="Process Return"
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                                >
                                  Return
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CirculationDesk;
