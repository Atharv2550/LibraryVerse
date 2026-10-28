import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  BookOpen, 
  Users, 
  Clock, 
  Banknote, 
  AlertCircle,
  CheckCircle2,
  FileDown
} from 'lucide-react';
import { libraryReportService } from '../services/libraryReportService';
import toast from '../utils/toast';

const LibraryReports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState(null);

  // Date filters for CSV
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await libraryReportService.getAnalyticsOverview();
      setAnalytics(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = async (type) => {
    try {
      setExportingType(type);
      await libraryReportService.exportReportCsv(type, {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });
      toast.success(`${type.toUpperCase()} report exported successfully`);
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Export failed');
    } finally {
      setExportingType(null);
    }
  };

  const kpis = analytics?.kpis || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Library Analytics & Reports Engine
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time institutional metrics, circulation trends, inventory tracking and CSV data exports.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Total Titles</span>
            <BookOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{kpis.totalTitles || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cataloged book records</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Physical Copies</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              {kpis.availableCopies || 0} Avail
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{kpis.totalCopies || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {kpis.issuedCopies || 0} on loan, {kpis.damagedOrLost || 0} damaged/lost
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Active Members</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{kpis.activeMembers || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Authorized cardholders</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Circulation Load</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{kpis.activeLoans || 0}</p>
          <p className="text-xs text-red-500 font-semibold mt-1">
            {kpis.overdueLoans || 0} currently overdue
          </p>
        </div>
      </div>

      {/* CSV Export Desk */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileDown className="w-5 h-5 text-indigo-500" />
            Institutional CSV Data Reports
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Export structured CSV datasets for audits, accreditation, inventory reconciliation, and annual reports.
          </p>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Filter Date Range:</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Export Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          <button
            onClick={() => handleExport('loans')}
            disabled={exportingType === 'loans'}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition group text-center"
          >
            <Download className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition" />
            <span className="font-semibold text-sm text-gray-900 dark:text-white mt-2">Circulation Loans</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">All issues, returns, renewals</span>
          </button>

          <button
            onClick={() => handleExport('overdue')}
            disabled={exportingType === 'overdue'}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition group text-center"
          >
            <Download className="w-6 h-6 text-red-600 group-hover:scale-110 transition" />
            <span className="font-semibold text-sm text-gray-900 dark:text-white mt-2">Overdue Report</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Delinquent borrowers & fines</span>
          </button>

          <button
            onClick={() => handleExport('inventory')}
            disabled={exportingType === 'inventory'}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition group text-center"
          >
            <Download className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition" />
            <span className="font-semibold text-sm text-gray-900 dark:text-white mt-2">Copy Inventory</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Accession & barcode audit</span>
          </button>

          <button
            onClick={() => handleExport('fines')}
            disabled={exportingType === 'fines'}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition group text-center"
          >
            <Download className="w-6 h-6 text-amber-600 group-hover:scale-110 transition" />
            <span className="font-semibold text-sm text-gray-900 dark:text-white mt-2">Fines & Collections</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paid receipts and fee waivers</span>
          </button>

          <button
            onClick={() => handleExport('members')}
            disabled={exportingType === 'members'}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition group text-center"
          >
            <Download className="w-6 h-6 text-purple-600 group-hover:scale-110 transition" />
            <span className="font-semibold text-sm text-gray-900 dark:text-white mt-2">Member Directory</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cardholders, statuses, limits</span>
          </button>
        </div>
      </div>

      {/* Analytics Visual Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Borrowed Books */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between mb-4">
            <span>Most Borrowed Titles</span>
            <span className="text-xs text-gray-400 font-normal">All-time circulation</span>
          </h2>

          {analytics?.mostBorrowed?.length > 0 ? (
            <div className="space-y-3">
              {analytics.mostBorrowed.map((item, idx) => (
                <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <span className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.author} • {item.genre}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-xs">
                      {item.borrowCount} loans
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No borrowing data recorded yet.</p>
          )}
        </div>

        {/* Popular Categories */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between mb-4">
            <span>Inventory by Category / Genre</span>
            <span className="text-xs text-gray-400 font-normal">Title & Copy Distribution</span>
          </h2>

          {analytics?.popularCategories?.length > 0 ? (
            <div className="space-y-3">
              {analytics.popularCategories.map((cat) => (
                <div key={cat._id || 'general'} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <span>{cat._id || 'General'}</span>
                    <span>{cat.count} titles • {cat.totalCopies} copies</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (cat.count / (kpis.totalTitles || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No category distribution data.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryReports;
