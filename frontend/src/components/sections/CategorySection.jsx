import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, animate } from 'framer-motion';
import { Link } from 'react-router-dom';

const categories = [
  { label: 'Soft Toys', img: 'https://plus.unsplash.com/premium_vector-1732761041055-b5cd5b4a82b7?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { label: 'Kids Puzzle', img: 'https://plus.unsplash.com/premium_vector-1727264696290-c2dd2d226378?q=80&w=1112&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { label: 'Indoor & Outdoor', img: 'https://images.unsplash.com/vector-1774596267025-f6aecd37a689?q=80&w=1077&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { label: 'Musical Toys', img: 'https://plus.unsplash.com/premium_vector-1770403124887-26326dc77452?q=80&w=1151&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { label: 'Baby Rattles', img: 'https://plus.unsplash.com/premium_vector-1728402578566-5532c28d45a1?q=80&w=1121&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
];

const marqueeItems = [
  'GET FREE SHIPPING ON ORDERS ₹999+ ACROSS INDIA',
  'GET A ₹500 GIFT CARD ON PURCHASE OF ₹10,000',
  'HURRY UP OFFER RUNNING FOR A LIMITED TIME ONLY',
  'GET 20% OFF ON YOUR FIRST ORDER',
];

export function CategorySection() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  
  // 3 sets for infinite bidirectional wrapping
  const items = [...categories, ...categories, ...categories];
  
  const x = useMotionValue(0);
  const [cardsPerView, setCardsPerView] = useState(5);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const updateCardsView = () => {
      const perView = window.innerWidth < 1024 ? 2 : 5;
      setCardsPerView(perView);
      
      // Center the slider at the start of the middle set (index 5)
      const cardWidth = window.innerWidth / perView;
      x.set(-(cardWidth * 5));
    };

    updateCardsView();
    window.addEventListener('resize', updateCardsView);
    return () => window.removeEventListener('resize', updateCardsView);
  }, []);

  // Seamless Looping Listener: Teleports between sets invisibly
  useEffect(() => {
    return x.on('change', (latest) => {
      const cardWidth = window.innerWidth / cardsPerView;
      const setWidth = cardWidth * 5;
      
      // Reset if we move past the boundaries of the middle set
      if (latest > -setWidth) {
        x.set(latest - setWidth);
      } else if (latest < -(setWidth * 2)) {
        x.set(latest + setWidth);
      }
    });
  }, [cardsPerView]);

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    const cardWidth = window.innerWidth / cardsPerView;
    const currentX = x.get();
    
    // Snap to the closest card slot with professional easing
    const targetX = Math.round(currentX / cardWidth) * cardWidth;
    
    animate(x, targetX, {
      type: 'spring',
      stiffness: 300,
      damping: 30
    });
  };

  return (
    <section className="bg-[#FDF4E6] py-4 md:py-8 lg:py-10 overflow-hidden select-none">
      <div className="relative w-full" ref={containerRef}>
        <motion.div 
          ref={trackRef}
          className="flex cursor-grab active:cursor-grabbing"
          drag="x"
          style={{ x }}
          dragConstraints={{ left: -10000, right: 10000 }}
          dragElastic={0.05}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
        >
          {items.map((cat, i) => {
            const isHigh = i % 2 !== 0;
            
            return (
              <div 
                key={i}
                // STRICT PERCENTAGE WIDTHS: No fractional cards (2 on mobile, 5 on desktop)
                style={{ flex: `0 0 ${100 / cardsPerView}%` }}
                className={`px-2 md:px-3 lg:px-4 transition-all duration-700 ${isHigh ? 'mt-10 md:mt-14 lg:mt-20' : 'mt-0'}`}
              >
                <Link 
                  to={`/collections/${cat.label.toLowerCase().replaceAll(' ', '-')}`}
                  className="block group"
                  draggable={false}
                  onClick={(e) => {
                    if (isDragging) e.preventDefault();
                  }}
                >
                  <div className="relative bg-[#F9EAD3] p-4 md:p-6 lg:p-8 rounded-[24px] border-[2px] border-dashed border-[#333]/15 group-hover:border-[#E84949] transition-all duration-300">
                    <div className="aspect-square overflow-hidden rounded-[20px] bg-white mb-5 shadow-inner border border-black/5 pointer-events-none">
                      <img
                        src={cat.img}
                        alt={cat.label}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                      />
                    </div>
                    <h3 className="text-[12px] md:text-[14px] lg:text-[17px] font-bold text-[#333] text-center font-grandstander group-hover:text-[#E84949] transition-colors duration-300 pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis">
                      {cat.label}
                    </h3>
                  </div>
                </Link>
              </div>
            );
          })}
        </motion.div>
      </div>

      <div className="mt-12 bg-[#F47522] py-4 md:py-5 overflow-hidden flex items-center border-y border-white/5 shadow-inner">
        <motion.div 
          animate={{ x: ["-50%", 0] }}
          transition={{ repeat: Infinity, duration: 50, ease: 'linear' }}
          className="flex whitespace-nowrap w-max"
        >
          {/* We repeat the exact same set of items many times to ensure a perfect 50% translation loop */}
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <div key={i} className="flex items-center gap-6 text-white font-bold text-[12px] md:text-[14px] lg:text-[16px] tracking-[0.1em] uppercase pr-12 md:pr-20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span>{item}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
