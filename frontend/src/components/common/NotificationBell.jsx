import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  BookOpen,
  Bookmark,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../../services/notificationService';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'loan_issued':
    case 'loan_renewed':
      return <BookOpen className="w-4 h-4 text-indigo-400" />;
    case 'loan_returned':
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'loan_due_soon':
      return <Clock className="w-4 h-4 text-amber-400" />;
    case 'loan_overdue':
      return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    case 'reservation_available':
    case 'reservation_fulfilled':
      return <Bookmark className="w-4 h-4 text-teal-400" />;
    case 'fine_assessed':
    case 'fine_paid':
    case 'fine_waived':
      return <DollarSign className="w-4 h-4 text-emerald-400" />;
    case 'membership_updated':
      return <ShieldCheck className="w-4 h-4 text-sky-400" />;
    default:
      return <Bell className="w-4 h-4 text-indigo-400" />;
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const NotificationBell = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const panelRef = useRef(null);

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const data = await fetchUnreadCount();
      setUnreadCount(data.data?.unreadCount || 0);
    } catch (e) {
      // Non-fatal
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications(1, 20);
      setNotifications(data.data?.items || []);
      setUnreadCount(data.data?.unreadCount || 0);
    } catch (err) {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnreadCount();
  }, [user]);

  // Real-time socket event listener for personal library notifications
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_user_room', user._id);

    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, user]);

  // Click outside to close panel
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await deleteNotification(id);
      const target = notifications.find((n) => n._id === id);
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      // ignore
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    setIsOpen(false);

    // Smart LMS routing
    if (notif.referenceType === 'Book' && notif.referenceId) {
      navigate(`/books/${notif.referenceId}`);
    } else if (notif.referenceType === 'Fine') {
      navigate(`/fines`);
    } else {
      navigate(`/my-library`);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-all border border-slate-200/80 dark:border-slate-800"
        title="Library Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-bold text-white bg-rose-500 rounded-full shadow-md shadow-rose-500/40 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Library Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-xs text-rose-500 px-4">
                {error}
                <button
                  onClick={loadNotifications}
                  className="block mx-auto mt-2 text-indigo-500 underline"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No notifications at this time.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Due-date reminders, hold reservation alerts, and issue/return confirmations will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 flex items-start space-x-3 cursor-pointer transition-colors group ${
                    notif.isRead
                      ? 'bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      : 'bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      {getNotificationIcon(notif.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold truncate text-slate-900 dark:text-slate-100">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2 whitespace-nowrap">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                        className="p-1 hover:text-indigo-500 rounded text-slate-400"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif._id, e)}
                      title="Delete notification"
                      className="p-1 hover:text-rose-500 rounded text-slate-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
