import React from 'react';
import { BookOpen, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-slate-300">LibraryVerse</span>
            <span className="text-xs text-slate-500">Smart Library Management System © 2026</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-slate-400">
            <span>Automated Circulation, Inventory & Patron Management</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
