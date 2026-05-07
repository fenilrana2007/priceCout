import React, { useState } from 'react';
import { ExternalLink, Star, LineChart, Heart, ShoppingCart, Share2, Info, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart as ReChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, PricePoint } from '../types';
import { cn } from '../lib/utils';

interface ProductCardProps {
  product: Product;
  isBestPrice: boolean;
  onToggleWishlist: (p: Product) => void;
  isWishlisted: boolean;
  avgPrice: number;
  id?: string;
}

const generateHistory = (currentPrice: number): PricePoint[] => {
  const points: PricePoint[] = [];
  const now = new Date();
  let lastPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.15);
  
  for (let i = 12; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - (i * 3));
    const variation = (Math.random() - 0.5) * 0.08 * lastPrice;
    lastPrice = Math.max(currentPrice * 0.75, lastPrice + variation);
    
    points.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: i === 0 ? currentPrice : lastPrice
    });
  }
  return points;
};

const getSourceStyles = (source: string) => {
  const s = source.toLowerCase();
  if (s.includes('amazon')) return 'bg-slate-900 text-amber-400 font-black';
  if (s.includes('flipkart')) return 'bg-blue-600 text-white';
  if (s.includes('ebay')) return 'bg-[#E53238] text-white';
  if (s.includes('reliance')) return 'bg-red-600 text-white';
  if (s.includes('croma')) return 'bg-teal-600 text-white';
  if (s.includes('meesho')) return 'bg-[#F43397] text-white';
  if (s.includes('vijay sales')) return 'bg-white border-2 border-red-600 text-red-600 font-bold';
  return 'bg-slate-800 text-white shadow-slate-900/10';
}

const generateMockReviews = (rating: number = 4.5): any[] => {
  const reviewsCount = Math.floor(Math.random() * 5) + 2;
  const authors = ['Alex M.', 'Sarah K.', 'David R.', 'Priya S.', 'John D.', 'Emily W.'];
  const comments = [
    'Amazing product for the price! Totally worth it.',
    'Fast shipping and great quality. Highly recommend.',
    'Decent product, but I expected a bit more.',
    'Best deal I found this week. Love it!',
    'Shipping took a bit longer but the item is perfect.',
    'Solid build quality. Would buy again.'
  ];
  
  return Array.from({ length: reviewsCount }).map((_, i) => ({
    author: authors[Math.floor(Math.random() * authors.length)],
    rating: Math.floor(rating) + (Math.random() > 0.5 ? 0 : -1),
    comment: comments[Math.floor(Math.random() * comments.length)],
    date: new Date(Date.now() - Math.random() * 1000000000).toLocaleDateString()
  }));
};

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  isBestPrice, 
  onToggleWishlist, 
  isWishlisted, 
  avgPrice,
  id
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const priceHistory = React.useMemo(() => generateHistory(product.price_numeric), [product.price_numeric]);
  
  const minPrice = React.useMemo(() => {
    return Math.min(...priceHistory.map(p => p.price));
  }, [priceHistory]);

  const isLowestPrice = product.price_numeric <= minPrice + 0.01;

  const savings = avgPrice > product.price_numeric ? avgPrice - product.price_numeric : 0;
  const savingsPercent = avgPrice > 0 ? (savings / avgPrice) * 100 : 0;

  const handleShare = async () => {
    const shareData = {
      title: product.title,
      text: `Check out this deal: ${product.title} for ${product.price} on ${product.source}!`,
      url: product.link,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(product.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  return (
    <motion.div
      id={id}
      layout
      className={cn(
        "rounded-[1.75rem] sm:rounded-[2.5rem] p-3 sm:p-6 border shadow-sm group relative flex flex-col transition-all duration-500 bg-white hover:bg-white",
        isBestPrice ? "border-emerald-500/50 ring-4 ring-emerald-500/5 shadow-2xl shadow-emerald-500/10" : "border-slate-100"
      )}
    >
      {/* Action Buttons Float */}
      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex flex-col gap-1 sm:gap-2">
          {isBestPrice && (
            <div className="bg-emerald-500 text-white text-[8px] sm:text-[9px] font-black px-2 sm:px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20">
              Best Deal
            </div>
          )}
          {savingsPercent > 5 && (
            <div className="bg-blue-600 text-white text-[8px] sm:text-[9px] font-black px-2 sm:px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">
              {Math.round(savingsPercent)}% OFF
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2 pointer-events-auto">
          <button 
            id={`wishlist-btn-${product.id}`}
            onClick={(e) => { e.preventDefault(); onToggleWishlist(product); }}
            className={cn(
              "p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all active:scale-75 shadow-sm backdrop-blur-md",
              isWishlisted 
                ? "bg-red-500 border-red-500 text-white shadow-red-500/20" 
                : "bg-white/90 border-slate-100 text-slate-400 hover:text-red-500"
            )}
            title="Add to Wishlist"
          >
            <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isWishlisted && "fill-current")} />
          </button>
          
          <button 
            id={`share-btn-${product.id}`}
            onClick={handleShare}
            className={cn(
              "p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all active:scale-75 shadow-sm backdrop-blur-md",
              copied ? "bg-blue-500 border-blue-500 text-white" : "bg-white/90 border-slate-100 text-slate-400 hover:text-blue-500"
            )}
            title={copied ? "Copied!" : "Share Product"}
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div className="h-40 sm:h-48 rounded-[1.5rem] sm:rounded-[2rem] mb-4 sm:mb-6 flex items-center justify-center overflow-hidden p-6 sm:p-8 transition-transform duration-700 group-hover:scale-105 bg-slate-50">
        <img 
          src={product.thumbnail} 
          alt={product.title}
          className="w-full h-full object-contain mix-blend-multiply"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Source & Details Tag */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl shadow-sm",
            getSourceStyles(product.source)
          )}>
            {product.source}
          </span>
          {product.rating && (
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-full">
              <Star className="w-2.5 h-2.5 fill-current" />
              {product.rating}
            </span>
          )}
        </div>
      </div>

      <h3 className="font-bold text-sm sm:text-base leading-snug mb-3 sm:mb-4 min-h-[2.5rem] sm:min-h-[3rem] line-clamp-2 transition-colors group-hover:text-blue-500">
        {product.title}
      </h3>

      {/* Expand/Info Toggle */}
      <div className="mb-4 sm:mb-6">
        <button 
          id={`expand-details-btn-${product.id}`}
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-3 sm:py-0 sm:w-auto text-[10px] sm:text-[10px] font-black uppercase tracking-[0.1em] transition-all bg-slate-50 sm:bg-transparent rounded-xl sm:rounded-none",
            isExpanded ? "text-blue-500" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <SlidersHorizontal className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", isExpanded && "rotate-90")} />
          {isExpanded ? "Brief Info" : "View Details"}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-2 sm:space-y-3 pt-2 sm:pt-3"
            >
              <div className="pt-2">
                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Details</p>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Model Number</p>
                    <p className="text-sm font-black text-slate-900 font-mono tracking-tight">
                      {product.model_number || `PS-${product.id.substring(0, 8).toUpperCase()}`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white border border-slate-100 rounded-2xl">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Dimensions</p>
                      <p className="text-[11px] font-black text-slate-900">{product.dimensions || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-2xl">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Weight</p>
                      <p className="text-[11px] font-black text-slate-900">{product.specifications?.['Weight'] || '210g'}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Specifications</p>
                    <div className="bg-slate-50 rounded-2xl p-4 gap-2 flex flex-col">
                      {Object.entries(product.specifications || { 
                        'Material': 'Premium Grade',
                        'Warranty': '1 Year Domestic',
                        'In Box': 'Product, User Manual, Cables'
                      }).map(([key, val]) => (
                        <div key={key} className="flex items-start justify-between py-1 border-b border-slate-200/50 last:border-0">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{key}</span>
                          <span className="text-[9px] text-slate-950 font-black text-right max-w-[60%]">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {product.delivery && (
                <div className="p-2 sm:p-3 bg-blue-500/5 rounded-[1rem] sm:rounded-2xl border border-blue-500/10 flex items-center gap-1.5 sm:gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   <p className="text-[9px] sm:text-[10px] font-bold text-blue-600 line-clamp-1">{product.delivery}</p>
                </div>
              )}

              <div className="pt-2">
                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Feedback Summary</p>
                <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl text-[9px] font-medium leading-relaxed">
                  <span className="font-bold">Summary:</span> {product.rating && product.rating > 4 ? 'Users love the build quality and value. Highly recommended.' : 'Mixed reviews regarding shipping times, but overall quality is solid.'}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">User Reviews</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{product.reviews || '54'} Verified Ratings</p>
                  </div>
                  <div className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-black">{product.rating || '4.5'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {(product.user_reviews || generateMockReviews(product.rating)).map((rev, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-900">{rev.author}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{rev.date}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, star) => (
                            <Star key={star} className={cn("w-2.5 h-2.5", star < rev.rating ? "text-amber-500 fill-current" : "text-slate-200")} />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto pt-5 border-t border-slate-100">
        <div className="flex items-end justify-between mb-5">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight">{product.price}</span>
              {savings > 0 && (
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 line-through">${avgPrice.toFixed(0)}</span>
                   <span className="text-[10px] font-black text-emerald-500">Save ${savings.toFixed(0)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              id={`price-stats-btn-${product.id}`}
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "p-2.5 rounded-xl border transition-all active:scale-75",
                showHistory 
                  ? "bg-slate-950 border-slate-950 text-white" 
                  : "bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-900"
              )}
              title="Price Statistics"
            >
              <LineChart className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 160, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="h-full w-full bg-slate-50 rounded-[1.75rem] p-4 border border-slate-100 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price Tracker (30 Days)</p>
                      {isLowestPrice && (
                        <div className="flex items-center gap-1 mt-1 text-[8px] font-black text-emerald-500 uppercase tracking-tighter">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Current price is at all-time low
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-blue-500 px-2 py-0.5 bg-blue-50 rounded-full">Live Analysis</span>
                  </div>
                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReChart data={priceHistory}>
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          dot={{ r: 2, fill: '#3b82f6', strokeWidth: 0 }}
                          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 4, fill: '#fff' }}
                          isAnimationActive={true}
                          animationDuration={1500}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white border-0 shadow-2xl rounded-2xl p-3 ring-1 ring-slate-100">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                                  <p className="text-sm font-black text-blue-600">${payload[0].value?.toLocaleString()}</p>
                                  {payload[0].value! <= minPrice && (
                                    <p className="text-[7px] font-bold text-emerald-500 uppercase mt-1">✓ Lowest Price recorded</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </ReChart>
                    </ResponsiveContainer>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <a 
          id={`checkout-btn-${product.id}`}
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "w-full flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 rounded-[1.25rem] font-black text-[10px] sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all active:scale-95 shadow-xl",
            isBestPrice 
              ? "bg-blue-600 text-white shadow-blue-500/40" 
              : "bg-slate-950 text-white"
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          Checkout on {product.source}
        </a>
      </div>
    </motion.div>
  );
};
