import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingBag, Moon, Sun, Heart, X, Menu, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  view: 'search' | 'wishlist';
  setView: (v: 'search' | 'wishlist') => void;
  wishlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  view,
  setView,
  wishlistCount
}) => {
  return (
    <nav className="h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between shrink-0 z-50 border-b transition-colors sticky top-0 bg-white border-slate-100 shadow-sm">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group" onClick={() => setView('search')}>
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-600 rounded-lg sm:rounded-[14px] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-all duration-300">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tightest">PriceScout</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={() => setView(view === 'wishlist' ? 'search' : 'wishlist')}
          className={cn(
            "flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95",
            view === 'wishlist' 
              ? "bg-red-500 border-red-500 text-white shadow-red-500/10" 
              : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", view === 'wishlist' && "fill-current")} />
          <span className="hidden xs:inline">Wishlist</span>
          {wishlistCount > 0 && (
            <span className={cn(
              "min-w-[18px] h-4.5 rounded-full px-1 flex items-center justify-center text-[8px] sm:text-[9px]",
              view === 'wishlist' ? "bg-white text-red-500" : "bg-red-500 text-white"
            )}>
              {wishlistCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
