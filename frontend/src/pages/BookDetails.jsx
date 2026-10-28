import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Hash,
  ArrowLeft,
  Bookmark,
  AlertCircle,
  Plus,
  MapPin,
  Building,
  CheckCircle,
  Layers
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { fetchBookById } from '../services/bookService';
import { fetchCopiesByBook, createCopy, bulkCreateCopies, updateCopy } from '../services/copyService';
import { createReservation } from '../services/reservationService';
import { useAuth } from '../hooks/useAuth';
import toast from '../utils/toast';

const BookDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reservation & Copy Management
  const [reserving, setReserving] = useState(false);
  const [showAddCopyModal, setShowAddCopyModal] = useState(false);
  const [copyForm, setCopyForm] = useState({
    accessionNumber: '',
    barcode: '',
    shelfLocation: '',
    condition: 'new',
    price: 25
  });
  const [bulkCount, setBulkCount] = useState(1);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [savingCopy, setSavingCopy] = useState(false);

  const loadBookDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookRes, copiesRes] = await Promise.all([
        fetchBookById(id),
        fetchCopiesByBook(id).catch(() => ({ data: [] }))
      ]);
      setBook(bookRes.data);
      setCopies(copiesRes.data || []);
    } catch (err) {
      setError(err.friendlyMessage || 'Book not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleReserve = async () => {
    if (!user) {
      toast.error('Please sign in to reserve books');
      return;
    }
    try {
      setReserving(true);
      await createReservation(book._id);
      toast.success('Book reserved successfully! You will be notified when a copy is ready.');
      loadBookDetails();
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Failed to place reservation');
    } finally {
      setReserving(false);
    }
  };

  const handleAddCopy = async (e) => {
    e.preventDefault();
    try {
      setSavingCopy(true);
      if (isBulkMode) {
        await bulkCreateCopies({
          bookId: book._id,
          count: Number(bulkCount),
          shelfLocation: copyForm.shelfLocation,
          condition: copyForm.condition,
          price: Number(copyForm.price)
        });
        toast.success(`Successfully added ${bulkCount} physical copies`);
      } else {
        await createCopy({
          book: book._id,
          accessionNumber: copyForm.accessionNumber || undefined,
          barcode: copyForm.barcode || undefined,
          shelfLocation: copyForm.shelfLocation,
          condition: copyForm.condition,
          price: Number(copyForm.price)
        });
        toast.success('Physical copy added successfully');
      }
      setShowAddCopyModal(false);
      setCopyForm({ accessionNumber: '', barcode: '', shelfLocation: '', condition: 'new', price: 25 });
      loadBookDetails();
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Failed to add copy');
    } finally {
      setSavingCopy(false);
    }
  };

  const handleUpdateCopyStatus = async (copyId, newStatus) => {
    try {
      await updateCopy(copyId, { status: newStatus });
      toast.success(`Copy status updated to ${newStatus}`);
      loadBookDetails();
    } catch (err) {
      toast.error(err.friendlyMessage || err.message || 'Failed to update copy status');
    }
  };

  if (loading) {
    return <LoadingSpinner label="Opening library catalog entry..." />;
  }

  if (error || !book) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 rounded-3xl glass-card border border-rose-500/20 text-rose-500 dark:text-rose-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-400" />
          <h2 className="text-xl font-bold">{error || 'Book not found'}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            The requested book may have been removed from the catalog.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const availableCount = book.availableCopies ?? copies.filter(c => c.status === 'available').length;
  const issuedCount = book.issuedCopies ?? copies.filter(c => c.status === 'issued').length;
  const reservedCount = book.reservedCopies ?? copies.filter(c => c.status === 'reserved').length;
  const totalCount = book.totalCopies ?? copies.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fadeIn w-full">
      {/* Breadcrumb back */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Main Book Card Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cover Column */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden glass-card border border-slate-200 dark:border-slate-800 shadow-2xl relative group">
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-950/80 backdrop-blur-md text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-md">
              {book.genre || book.category || 'General'}
            </div>
          </div>
        </div>

        {/* Details Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                availableCount > 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
              }`}>
                <CheckCircle className="w-3.5 h-3.5" />
                {availableCount > 0 ? `${availableCount} Copies Available` : 'All Copies In Circulation / Reserved'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {book.title}
            </h1>
            <p className="text-base sm:text-lg font-medium text-indigo-600 dark:text-indigo-300">
              By {book.author}
            </p>
          </div>

          {/* Key Metrics Chips */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            {book.category && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Category: {book.category}</span>
              </div>
            )}

            {book.publisher && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                <Building className="w-4 h-4 text-slate-400" />
                <span>Publisher: {book.publisher}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>{book.pageCount} Pages</span>
            </div>

            {book.publishedYear && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Published {book.publishedYear}</span>
              </div>
            )}

            {book.isbn && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                <Hash className="w-4 h-4 text-slate-400" />
                <span>ISBN: {book.isbn}</span>
              </div>
            )}

            {book.shelfLocation && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span>Default Shelf: {book.shelfLocation}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Synopsis & Catalogue Summary
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {book.description}
            </p>
          </div>

          {/* Quick Action Bar for Member */}
          <div className="pt-2 flex items-center gap-3">
            {user ? (
              <button
                onClick={handleReserve}
                disabled={reserving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
              >
                <Bookmark className="w-4 h-4" />
                <span>{reserving ? 'Placing Hold...' : 'Place Reservation / Hold'}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
              >
                <span>Sign in to reserve books</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Physical Copies & Library Circulation Section */}
      <section className="p-6 rounded-3xl glass-card border border-indigo-500/20 space-y-6 shadow-xl shadow-indigo-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Physical Inventory & Copy Availability
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time accession barcodes, shelf locations, and circulation status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Member Reserve Button */}
            {user && (
              <button
                onClick={handleReserve}
                disabled={reserving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
              >
                <Bookmark className="w-4 h-4" />
                <span>{reserving ? 'Reserving...' : 'Reserve This Title'}</span>
              </button>
            )}

            {/* Librarian / Admin Add Copy Button */}
            {(user?.role === 'admin' || user?.role === 'librarian') && (
              <button
                onClick={() => setShowAddCopyModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Physical Copy</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Availability Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Copies</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {totalCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Available</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {availableCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 text-center">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Checked Out</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
              {issuedCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-center">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Reserved</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {reservedCount}
            </span>
          </div>
        </div>

        {/* Copies Table */}
        {copies.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No physical copy records cataloged for this title yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Accession #</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3">Shelf Location</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Status</th>
                  {(user?.role === 'admin' || user?.role === 'librarian') && (
                    <th className="px-4 py-3 text-right">Staff Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {copies.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {c.accessionNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400">
                      {c.barcode}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {c.shelfLocation || book.shelfLocation || 'Main Stack'}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                      {c.condition || 'good'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          c.status === 'available'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : c.status === 'issued'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            : c.status === 'reserved'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        }`}
                      >
                        {c.status?.toUpperCase()}
                      </span>
                    </td>
                    {(user?.role === 'admin' || user?.role === 'librarian') && (
                      <td className="px-4 py-3 text-right">
                        <select
                          value={c.status}
                          onChange={(e) => handleUpdateCopyStatus(c._id, e.target.value)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="available">Available</option>
                          <option value="issued" disabled>Issued (Circulation)</option>
                          <option value="reserved" disabled>Reserved</option>
                          <option value="damaged">Damaged</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add Copy Modal */}
      {showAddCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              Add Physical Copy Record
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add individual or bulk barcoded copies for "{book.title}".
            </p>

            <form onSubmit={handleAddCopy} className="mt-4 space-y-4">
              <div className="flex items-center gap-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsBulkMode(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    !isBulkMode ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow' : 'text-slate-500'
                  }`}
                >
                  Single Copy
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkMode(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    isBulkMode ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow' : 'text-slate-500'
                  }`}
                >
                  Bulk Add
                </button>
              </div>

              {isBulkMode ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Number of Copies to Generate
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={bulkCount}
                    onChange={(e) => setBulkCount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Accession Number (Leave blank for auto-generation)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ACC-2026-0042"
                      value={copyForm.accessionNumber}
                      onChange={(e) => setCopyForm({ ...copyForm, accessionNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Barcode (Leave blank for auto-generation)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BC-12345678"
                      value={copyForm.barcode}
                      onChange={(e) => setCopyForm({ ...copyForm, barcode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Shelf Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Floor 2, Stack B-4"
                  value={copyForm.shelfLocation}
                  onChange={(e) => setCopyForm({ ...copyForm, shelfLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Condition
                  </label>
                  <select
                    value={copyForm.condition}
                    onChange={(e) => setCopyForm({ ...copyForm, condition: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Replacement Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={copyForm.price}
                    onChange={(e) => setCopyForm({ ...copyForm, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCopyModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCopy}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  {savingCopy ? 'Saving...' : 'Add Copy Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetails;
