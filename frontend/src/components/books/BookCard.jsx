import React from 'react';
import { Link } from 'react-router-dom';
import { Star, BookOpen } from 'lucide-react';

const BookCard = ({ book }) => {
  return (
    <Link
      to={`/books/${book._id}`}
      className="group relative flex flex-col rounded-2xl glass-card border border-slate-800 overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
        <img
          src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30">
          {book.genre}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between space-y-2">
        <div>
          <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
            {book.title}
          </h3>
          <p className="text-xs text-slate-400 font-medium line-clamp-1">{book.author}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-1 text-amber-400 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{book.rating || 4.5}</span>
            <span className="text-slate-500 font-normal">({book.numReviews || 12})</span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>{book.pageCount}p</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BookCard;
