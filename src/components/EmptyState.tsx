import React from 'react';
import { motion } from 'motion/react';
import { TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  onSuggest: (q: string) => void;
}

const trending = ['iPhone 15', 'AirPods Pro', 'ASUS ROG Ally', 'Nintendo Switch', 'iPad Pro M4'];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSuggest }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center min-h-[400px]"
    >
      <div className="relative mb-10">
         <div className="w-24 h-24 bg-blue-600/10 rounded-[2rem] rotate-12 absolute -inset-2"></div>
         <div className="w-24 h-24 border rounded-[2.5rem] flex items-center justify-center shadow-lg relative z-10 bg-white border-slate-100">
            <TrendingDown className="w-10 h-10 text-blue-600" />
         </div>
      </div>
      
      <h2 className="text-3xl font-black tracking-tightest mb-4">Compare & Save</h2>
      <p className="text-slate-500 font-medium max-w-[280px] text-center text-sm leading-relaxed mb-12">
        Find the absolute lowest price across major stores in seconds.
      </p>

      <div className="w-full max-w-xl">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-6">Trending Searches</h4>
        <div className="flex flex-wrap justify-center gap-2">
          {trending.map(t => (
            <button 
              key={t}
              onClick={() => onSuggest(t)}
              className="px-5 py-2.5 rounded-xl border text-[11px] font-bold transition-all active:scale-95 bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:text-blue-600"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
