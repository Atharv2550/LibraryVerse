import React from 'react';
import { Link } from 'react-router-dom';
import { BookX, Home, Compass } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center p-8 rounded-3xl glass-card border border-slate-800 space-y-6 shadow-2xl animate-fadeIn">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <BookX className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-indigo-400">404 Error</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Chapter Not Found</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The page you are looking for may have been moved, removed, or never existed in the library.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Back to Discovery</span>
          </Link>
          <Link
            to="/clubs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Clubs</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
