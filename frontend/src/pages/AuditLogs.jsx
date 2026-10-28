import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter,
  Clock,
  UserCircle,
  Monitor
} from 'lucide-react';
import { auditService } from '../services/auditService';
import toast from '../utils/toast';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditService.getAuditLogs({
        action: actionFilter || undefined,
        limit: 100
      });
      const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setLogs(items);
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const logList = Array.isArray(logs) ? logs : [];
  const filteredLogs = logList.filter((l) => {
    const q = searchQuery.toLowerCase();
    const actorName = l.actor?.name?.toLowerCase() || '';
    const action = l.action?.toLowerCase() || '';
    const entity = l.entityType?.toLowerCase() || '';
    const details = JSON.stringify(l.details || {}).toLowerCase();
    return actorName.includes(q) || action.includes(q) || entity.includes(q) || details.includes(q);
  });

  const getActionBadgeColor = (action) => {
    if (action.includes('issued')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (action.includes('returned')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (action.includes('fine')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (action.includes('role') || action.includes('deleted')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          System Security & Audit Trail
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Immutable event log tracking administrative modifications, circulation transactions, and fee waivers.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs by actor, action, entity, or metadata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Actions</option>
            <option value="loan_issued">Book Issued</option>
            <option value="loan_returned">Book Returned</option>
            <option value="loan_renewed">Loan Renewed</option>
            <option value="fine_paid">Fine Collected</option>
            <option value="fine_waived">Fine Waived</option>
            <option value="fine_assessed">Penalty Assessed</option>
            <option value="copy_created">Copy Added</option>
            <option value="member_created">Member Enrolled</option>
            <option value="role_changed">Role Modified</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading audit records...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">No matching audit logs recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                        <UserCircle className="w-4 h-4 text-indigo-500" />
                        {log.actor?.name || 'System'}
                      </div>
                      <div className="text-xs uppercase font-semibold text-gray-400">{log.role || 'System'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-700 dark:text-gray-300 capitalize">{log.entityType}</span>
                      {log.entityId && (
                        <span className="block text-[11px] text-gray-400 font-mono truncate max-w-[120px]">
                          {log.entityId}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Audit Entry Inspection
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-400">Action:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-400">Actor:</span>
                <span className="text-gray-900 dark:text-white font-medium">{selectedLog.actor?.name} ({selectedLog.role})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-400">Entity:</span>
                <span className="text-gray-900 dark:text-white font-mono">{selectedLog.entityType} ({selectedLog.entityId})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-400">Timestamp:</span>
                <span className="text-gray-900 dark:text-white">{new Date(selectedLog.createdAt).toUTCString()}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Payload Details:</span>
                <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
