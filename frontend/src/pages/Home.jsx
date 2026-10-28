import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Library,
  Sparkles,
  TrendingUp,
  Compass,
  Plus,
  Search,
  BookOpen,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import BookGrid from '../components/books/BookGrid';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { fetchBooks, fetchFeaturedBooks, createBook } from '../services/bookService';
import { useAuth } from '../hooks/useAuth';
import { GENRES } from '../utils/constants';

const Home = () => {
  const { user } = useAuth();

  // Books state
  const [books, setBooks] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  // Add Book modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingBook, setSubmittingBook] = useState(false);
  const [modalError, setModalError] = useState('');
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    genre: 'Fiction',
    isbn: '',
    publisher: '',
    shelfLocation: 'Main Stack A-1',
    description: '',
    pageCount: '',
    publishedYear: new Date().getFullYear(),
    coverImage: '',
    totalCopies: 1
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [booksRes, featuredRes] = await Promise.all([
        fetchBooks({ genre: selectedGenre, search: searchTerm, sort: sortBy }),
        fetchFeaturedBooks().catch(() => ({ data: [] }))
      ]);

      setBooks(booksRes.data?.books || booksRes.data || []);
      setFeaturedBooks(featuredRes.data || []);
    } catch (err) {
      setError(err.friendlyMessage || 'Unable to load library catalog. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenre, searchTerm, sortBy]);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author || !newBook.description || !newBook.pageCount) {
      setModalError('Please complete all required fields.');
      return;
    }

    setSubmittingBook(true);
    setModalError('');
    try {
      await createBook({
        ...newBook,
        pageCount: Number(newBook.pageCount),
        publishedYear: Number(newBook.publishedYear),
        totalCopies: Number(newBook.totalCopies || 1)
      });
      setIsModalOpen(false);
      setNewBook({
        title: '',
        author: '',
        genre: 'Fiction',
        isbn: '',
        publisher: '',
        shelfLocation: 'Main Stack A-1',
        description: '',
        pageCount: '',
        publishedYear: new Date().getFullYear(),
        coverImage: '',
        totalCopies: 1
      });
      await loadData();
    } catch (err) {
      setModalError(err.friendlyMessage || 'Failed to catalog book. Please check fields.');
    } finally {
      setSubmittingBook(false);
    }
  };

  return (
    <div className="flex-1 pb-16 space-y-12 animate-fadeIn">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-indigo-950/20 via-slate-900/40 to-slate-950 rounded-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 dark:text-indigo-300 border border-indigo-500/20 backdrop-blur-md">
              <Library className="w-3.5 h-3.5 text-indigo-400" />
              <span>Smart Library Management & Circulation System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Instant Access to the{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                Institutional Catalog
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Search library books, track real-time physical copy availability, place hold reservations, and manage returns and circulation seamlessly.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#discovery-section"
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Browse Catalog</span>
              </a>

              {user && (
                <Link
                  to="/my-library"
                  className="px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-semibold text-sm border border-slate-700/80 transition-all flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>My Borrowed Books</span>
                </Link>
              )}

              {(user?.role === 'admin' || user?.role === 'librarian') && (
                <>
                  <Link
                    to="/circulation"
                    className="px-5 py-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-300 font-semibold text-sm border border-emerald-500/30 transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Circulation Desk</span>
                  </Link>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 font-semibold text-sm border border-indigo-500/30 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catalog New Title</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books Spotlight */}
      {featuredBooks.length > 0 && !searchTerm && selectedGenre === 'All' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Featured In Catalog</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Selected recommendations</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredBooks.slice(0, 6).map((book) => (
              <Link
                key={book._id}
                to={`/books/${book._id}`}
                className="group flex flex-col rounded-2xl glass-card border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all transform hover:-translate-y-1"
              >
                <div className="aspect-[3/4] relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-950/80 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>{book.availableCopies ?? 1} Available</span>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-500 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Discovery Section */}
      <section id="discovery-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Library Catalog</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Search books by title, author, ISBN or category</p>
          </div>

          {/* Search Bar & Sorter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, author, ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="rating">Top Rated</option>
              <option value="newest">Newest Acquisition</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Genre Pill Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {GENRES.map((genre) => {
            const active = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-100 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>

        {/* Book Grid Content */}
        {loading ? (
          <LoadingSpinner label="Searching library catalog..." />
        ) : error ? (
          <div className="p-8 text-center rounded-2xl glass-card border border-rose-500/20 text-rose-500 dark:text-rose-300 space-y-3">
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <BookGrid books={books} />
        )}
      </section>

      {/* Add Book Modal for Staff */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Catalog a New Book Record">
        {modalError && (
          <div className="p-3 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
            {modalError}
          </div>
        )}
        <form onSubmit={handleCreateBook} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Book Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Introduction to Algorithms"
              value={newBook.title}
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Author *</label>
              <input
                type="text"
                required
                placeholder="e.g. Thomas H. Cormen"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Category / Genre *</label>
              <select
                value={newBook.genre}
                onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              >
                {GENRES.filter((g) => g !== 'All').map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">ISBN</label>
              <input
                type="text"
                placeholder="e.g. 978-0262033848"
                value={newBook.isbn}
                onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Publisher</label>
              <input
                type="text"
                placeholder="e.g. MIT Press"
                value={newBook.publisher}
                onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Shelf Location</label>
              <input
                type="text"
                placeholder="Floor 2, Stack A-1"
                value={newBook.shelfLocation}
                onChange={(e) => setNewBook({ ...newBook, shelfLocation: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Page Count *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="450"
                value={newBook.pageCount}
                onChange={(e) => setNewBook({ ...newBook, pageCount: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Initial Physical Copies</label>
              <input
                type="number"
                min="1"
                max="50"
                value={newBook.totalCopies}
                onChange={(e) => setNewBook({ ...newBook, totalCopies: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Cover Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={newBook.coverImage}
              onChange={(e) => setNewBook({ ...newBook, coverImage: e.target.value })}
              className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description & Summary *</label>
            <textarea
              rows="3"
              required
              placeholder="Synopsis of this title..."
              value={newBook.description}
              onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submittingBook}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {submittingBook ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cataloging Book & Generating Barcodes...</span>
              </>
            ) : (
              <span>Catalog Book Into Library</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Home;
