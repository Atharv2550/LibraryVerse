import React from 'react';
import BookCard from './BookCard';
import { BookX } from 'lucide-react';

const BookGrid = ({ books = [] }) => {
  if (!books.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl glass-card border border-slate-800">
        <BookX className="w-12 h-12 text-slate-500 mb-3" />
        <h3 className="text-lg font-semibold text-slate-200">No books found</h3>
        <p className="text-sm text-slate-400">Try adjusting your search filters or add a new book to the library.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {books.map((book) => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
  );
};

export default BookGrid;
