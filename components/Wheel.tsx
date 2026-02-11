import React, { useRef, useState, useEffect } from 'react';

interface WheelProps {
  items: number[];
  selected: number;
  onSelect: (value: number) => void;
  formatItem?: (item: number) => string;
}

const ITEM_HEIGHT = 40; // Slightly smaller for better fit in mobile forms
const VISIBLE_ITEMS = 5;

const Wheel: React.FC<WheelProps> = ({ items, selected, onSelect, formatItem }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync scroll position with selected prop (e.g. initial load or external change)
  useEffect(() => {
    if (wheelRef.current && !isUserScrolling.current) {
      const index = items.indexOf(selected);
      if (index !== -1) {
        const targetScroll = index * ITEM_HEIGHT;
        // Check if we are already close enough (avoid micro-adjustments/loops)
        if (Math.abs(wheelRef.current.scrollTop - targetScroll) > 1) {
          wheelRef.current.scrollTop = targetScroll;
          setScrollTop(targetScroll);
        }
      }
    }
  }, [selected, items]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScroll = e.currentTarget.scrollTop;
    setScrollTop(currentScroll);

    // Mark as user scrolling to prevent useEffect from fighting back
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    
    // Set a timeout to clear the scrolling flag
    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 150);

    // Calculate index
    const index = Math.round(currentScroll / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const item = items[clampedIndex];

    if (item !== undefined && item !== selected) {
      onSelect(item);
    }
  };

  const getItemStyle = (index: number) => {
    const centerIndex = scrollTop / ITEM_HEIGHT;
    const distance = Math.abs(index - centerIndex);

    // Visual transformations
    const scale = distance < 0.5 ? 1.0 : 0.9;
    const opacity = distance < 0.5 ? 1 : 0.4;
    const rotateX = distance < 0.5 ? 0 : (index > centerIndex ? 25 : -25);
    
    return {
      opacity,
      transform: `perspective(500px) rotateX(${rotateX}deg) scale(${scale})`,
      fontWeight: distance < 0.5 ? 600 : 400,
      color: distance < 0.5 ? '#1e3a8a' : '#9ca3af', // Blue-900 for selected
      transition: 'transform 0.1s, opacity 0.1s, color 0.1s',
    };
  };

  return (
    <div 
      className="relative w-full" 
      style={{ height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px` }}
    >
      {/* Selection Area Highlight */}
      <div
        className="absolute left-0 right-0 pointer-events-none border-t border-b border-blue-100 bg-blue-50/30"
        style={{
          top: `${ITEM_HEIGHT * 2}px`,
          height: `${ITEM_HEIGHT}px`,
          zIndex: 10
        }}
      />

      {/* Scroll Container with Snap */}
      <div
        ref={wheelRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll no-scrollbar snap-y snap-mandatory relative z-20 overscroll-contain"
        style={{
           WebkitOverflowScrolling: 'touch', 
        }}
      >
        <div 
           style={{ 
             paddingTop: `${ITEM_HEIGHT * 2}px`, 
             paddingBottom: `${ITEM_HEIGHT * 2}px` 
           }}
        >
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center justify-center snap-center cursor-pointer select-none"
              style={{
                height: `${ITEM_HEIGHT}px`,
                ...getItemStyle(index),
              }}
              onClick={() => {
                 if (wheelRef.current) {
                   wheelRef.current.scrollTo({
                     top: index * ITEM_HEIGHT,
                     behavior: 'smooth'
                   });
                 }
              }}
            >
              {formatItem ? formatItem(item) : item}
            </div>
          ))}
        </div>
      </div>

      {/* Gradient Fades */}
      <div
        className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white via-white/90 to-transparent pointer-events-none z-30"
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-30"
      />
    </div>
  );
};

export default Wheel;