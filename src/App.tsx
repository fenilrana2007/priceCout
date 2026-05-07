/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertCircle, ShoppingBag, Heart, X, TrendingDown, Sparkles, TrendingUp, ShoppingCart, ExternalLink, Search, Trash2, Star, ChevronDown, Store } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { EmptyState } from './components/EmptyState';
import { Product } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('priceScoutHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | 'best_deal'>('best_deal');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('All Stores');
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('priceScoutWishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<'search' | 'wishlist'>('search');
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'info'; action?: () => void }[]>([]);

  const [activeDropdown, setActiveDropdown] = useState<'sort' | 'store' | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Add notification helper
  const addNotification = (message: string, type: 'success' | 'info' = 'info', action?: () => void) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type, action }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  useEffect(() => {
    // Force light mode
    document.documentElement.classList.remove('dark');
  }, []);

  const saveToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const newHistory = [searchTerm, ...history.filter(h => h !== searchTerm)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('priceScoutHistory', JSON.stringify(newHistory));
  };

  const handleSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    saveToHistory(searchTerm);
    setView('search');
    setQuery(searchTerm);
    setActiveDropdown(null);

    // Initial scroll to show loading state in results area
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    try {
      const response = await axios.get(`https://pricecout.onrender.com/api/search?q=${encodeURIComponent(searchTerm)}`);
      setResults(response.data.results);
      if (response.data.results.length === 0) {
        setError('No sales listings found for this product. We filtered out rental results.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch deals. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [history]);

  const toggleWishlist = (product: Product) => {
    const exists = wishlist.find(p => p.id === product.id);
    let newWishlist;
    if (exists) {
      newWishlist = wishlist.filter(p => p.id !== product.id);
    } else {
      newWishlist = [...wishlist, product];
    }
    setWishlist(newWishlist);
    localStorage.setItem('priceScoutWishlist', JSON.stringify(newWishlist));
  };

  const uniqueRetailersList = useMemo(() => {
    const list = Array.from(new Set(results.map(r => r.source))).sort();
    return ['All Stores', ...list];
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      return selectedRetailer === 'All Stores' || r.source === selectedRetailer;
    });
  }, [results, selectedRetailer]);

  const sortedResults = useMemo(() => {
    const items = [...filteredResults];
    switch (sortBy) {
      case 'price_asc': return items.sort((a, b) => a.price_numeric - b.price_numeric);
      case 'price_desc': return items.sort((a, b) => b.price_numeric - a.price_numeric);
      case 'rating': return items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'best_deal': 
        const avg = results.length > 0 ? results.reduce((a, b) => a + b.price_numeric, 0) / results.length : 0;
        return items.sort((a, b) => {
          const scoreA = (avg / a.price_numeric) * 0.7 + ((a.rating || 0) / 5) * 0.3;
          const scoreB = (avg / b.price_numeric) * 0.7 + ((b.rating || 0) / 5) * 0.3;
          return scoreB - scoreA;
        });
      default: return items;
    }
  }, [filteredResults, sortBy, results]);

  const currentAvg = useMemo(() => {
    if (results.length === 0) return 0;
    return results.reduce((acc, curr) => acc + curr.price_numeric, 0) / results.length;
  }, [results]);

  return (
    <div className="flex flex-col h-screen transition-colors duration-300 selection:bg-blue-100 bg-slate-50 text-slate-900">
      <Navbar 
        view={view}
        setView={setView}
        wishlistCount={wishlist.length}
      />

      {/* Mobile-style Notification Toast System - Centered Top */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              onClick={() => n.action?.()}
              className={cn(
                "px-5 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border backdrop-blur-md cursor-pointer pointer-events-auto flex items-center gap-4 group transition-all active:scale-95",
                n.type === 'success' 
                  ? "bg-emerald-600/90 border-emerald-500 text-white" 
                  : "bg-white/90 border-slate-200 text-slate-900"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                n.type === 'success' ? "bg-emerald-500" : "bg-blue-500"
              )}>
                {n.type === 'success' ? <TrendingDown className="w-5 h-5 text-white" /> : <ShoppingBag className="w-5 h-5 text-white" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-0.5">Notification</p>
                <p className="text-sm font-bold leading-tight line-clamp-2">{n.message}</p>
              </div>
              {n.action && (
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </div>
              )}
              {/* Progress Bar */}
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-full mx-4"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
          {/* Hero Search Section */}
          <section className="px-5 md:px-12 py-8 md:py-16 bg-white border-b border-slate-100">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 md:mb-10 text-center lg:text-left">
                <h2 className="text-3xl md:text-6xl font-black tracking-tightest mb-3 md:mb-4 leading-tight">
                  Find the <span className="text-blue-600 underline decoration-4 md:decoration-8 decoration-blue-500/10">Best Price</span><br className="hidden md:block" />
                  Across the Web.
                </h2>
                <p className="text-slate-500 text-base md:text-xl font-medium">Scouting 50+ stores in real-time to save you money.</p>
              </div>

              <div className="relative group max-w-2xl mx-auto lg:mx-0">
                <Search className="w-5 h-5 md:w-6 md:h-6 text-slate-400 absolute left-5 md:left-6 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="What's on your list?"
                  className="w-full h-14 md:h-20 pl-12 md:pl-16 pr-32 md:pr-40 bg-slate-100 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-[20px] md:rounded-[24px] text-base md:text-xl font-black outline-none transition-all shadow-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                />
                <button 
                  onClick={() => handleSearch(query)}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 h-10 md:h-14 px-5 md:px-8 bg-blue-600 text-white rounded-[14px] md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                >
                  Search
                </button>
              </div>

              {history.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-3 items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2">Recent searches</span>
                  {history.map((h, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSearch(h)}
                      className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-full text-xs font-bold transition-colors border border-transparent hover:border-blue-200"
                    >
                      {h}
                    </button>
                  ))}
                  <button onClick={() => setHistory([])} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </section>

          <div ref={resultsRef} className="p-6 md:p-10 flex flex-col gap-10 scroll-mt-20">
            <header className="flex flex-col gap-6 md:gap-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div>
                  {view === 'wishlist' ? (
                    <>
                      <h1 className="text-3xl md:text-4xl font-black tracking-tightest">My Wishlist</h1>
                      <p className="text-slate-500 mt-1 md:mt-2 flex items-center gap-2 text-xs md:text-sm">
                        <Heart className="w-4 h-4 text-red-500 fill-current" />
                        Tracking {wishlist.length} saved products
                      </p>
                    </>
                  ) : results.length > 0 ? (
                    <>
                      <h1 className="text-3xl md:text-4xl font-black tracking-tightest">Search Results</h1>
                      <div className="flex items-center gap-3 md:gap-4 mt-1 md:mt-2">
                        <span className="px-2.5 py-1 bg-blue-600 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                          {results.length} Matches
                        </span>
                        <p className="text-slate-500 text-xs md:text-sm">
                          for <span className="font-bold text-slate-900 underline decoration-blue-500/30">"{query}"</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="py-2 md:py-4">
                       <h1 className="text-lg md:text-xl font-black tracking-widest text-slate-300 uppercase italic">Trending Deals</h1>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Removed filters button */}
                </div>
              </div>

              {/* Enhanced Selection Toolbar */}
              {results.length > 0 && view === 'search' && (
                <div className="flex flex-wrap items-center gap-4 py-6 border-y border-slate-100 px-1">
                   {/* Store Dropdown */}
                   <div className="relative">
                     <button 
                       onClick={() => setActiveDropdown(activeDropdown === 'store' ? null : 'store')}
                       className={cn(
                         "flex items-center gap-3 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all",
                         activeDropdown === 'store' ? "border-blue-600 bg-blue-50 text-blue-600" : "bg-white border-slate-100 text-slate-500"
                       )}
                     >
                       <Store className="w-4 h-4" />
                       {selectedRetailer}
                       <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", activeDropdown === 'store' && "rotate-180")} />
                     </button>
                     <AnimatePresence>
                       {activeDropdown === 'store' && (
                         <>
                           <div className="fixed inset-0 z-[60]" onClick={() => setActiveDropdown(null)} />
                           <motion.div 
                             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                             className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[70] py-2 max-h-64 overflow-y-auto custom-scrollbar"
                           >
                             {uniqueRetailersList.map(store => (
                               <button 
                                 key={store}
                                 onClick={() => { setSelectedRetailer(store); setActiveDropdown(null); }}
                                 className={cn(
                                   "w-full text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors",
                                   selectedRetailer === store ? "text-blue-600 bg-blue-50/50" : "text-slate-500"
                                 )}
                               >
                                 {store}
                               </button>
                             ))}
                           </motion.div>
                         </>
                       )}
                     </AnimatePresence>
                   </div>

                   {/* Sort Dropdown */}
                   <div className="relative">
                     <button 
                       onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
                       className={cn(
                         "flex items-center gap-3 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all",
                         activeDropdown === 'sort' ? "border-blue-600 bg-blue-50 text-blue-600" : "bg-white border-slate-100 text-slate-500"
                       )}
                     >
                       <Star className="w-4 h-4" />
                       {sortBy === 'best_deal' && 'Recommended'}
                       {sortBy === 'price_asc' && 'Lowest Price'}
                       {sortBy === 'price_desc' && 'Highest Price'}
                       {sortBy === 'rating' && 'Top Rated'}
                       <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", activeDropdown === 'sort' && "rotate-180")} />
                     </button>
                     <AnimatePresence>
                       {activeDropdown === 'sort' && (
                         <>
                           <div className="fixed inset-0 z-[60]" onClick={() => setActiveDropdown(null)} />
                           <motion.div 
                             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                             className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[70] py-2"
                           >
                              {[
                                { id: 'best_deal', label: 'Recommended', icon: Sparkles },
                                { id: 'price_asc', label: 'Lowest Price', icon: TrendingDown },
                                { id: 'price_desc', label: 'Highest Price', icon: TrendingUp },
                                { id: 'rating', label: 'Top Rated', icon: Star }
                              ].map(opt => (
                                <button 
                                  key={opt.id}
                                  onClick={() => { setSortBy(opt.id as any); setActiveDropdown(null); }}
                                  className={cn(
                                    "w-full text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center justify-between",
                                    sortBy === opt.id ? "text-blue-600 bg-blue-50/50" : "text-slate-500"
                                  )}
                                >
                                  {opt.label}
                                  <opt.icon className="w-3 h-3" />
                                </button>
                              ))}
                           </motion.div>
                         </>
                       )}
                     </AnimatePresence>
                   </div>
                </div>
              )}
            </header>

            <AnimatePresence mode="wait">
              {loading && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center py-20"
                >
                   <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-blue-600/20 rounded-full animate-ping absolute"></div>
                      <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative" />
                   </div>
                   <p className="font-black text-xs uppercase tracking-[0.5em] text-slate-400">Deep Scouting...</p>
                </motion.div>
              )}

              {error && !loading && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="bg-red-50 p-8 rounded-[3rem] mb-6 border border-red-100 shadow-inner">
                    <AlertCircle className="w-16 h-16 text-red-500" />
                  </div>
                  <h3 className="text-3xl font-black mb-3 italic">Oops! Something went wrong</h3>
                  <p className="text-slate-500 max-w-sm mx-auto font-bold text-lg leading-relaxed">{error}</p>
                  <button 
                    onClick={() => handleSearch(query)}
                    className="mt-10 px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}

              {!loading && !error && (view === 'search' ? sortedResults : wishlist).length === 0 && (
                <EmptyState onSuggest={handleSearch} />
              )}

              {!loading && !error && (view === 'search' ? sortedResults : wishlist).length > 0 && (
                <motion.div 
                  layout
                  className={cn(
                    "grid gap-8 pb-32 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
                  )}
                >
                  {(view === 'search' ? sortedResults : wishlist).map((product, index) => (
                    <ProductCard 
                      key={`${product.id}-${index}`} 
                      id={`product-${product.id}`}
                      product={product} 
                      isBestPrice={index === 0 && (sortBy === 'best_deal' || sortBy === 'price_asc')}
                      onToggleWishlist={toggleWishlist}
                      isWishlisted={!!wishlist.find(p => p.id === product.id)}
                      avgPrice={currentAvg}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

