import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ label = 'Loading BookVerse...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      <span className="text-sm font-medium text-slate-400">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
