import React from 'react';
import { GENRES } from '../../utils/constants';

const Sidebar = ({ selectedGenre, onSelectGenre }) => {
  return (
    <aside className="w-full md:w-64 space-y-4">
      <div className="p-4 rounded-2xl glass-card border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
          Categories & Genres
        </h3>
        <div className="space-y-1">
          {GENRES.map((genre) => {
            const active = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => onSelectGenre(genre)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
