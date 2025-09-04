import React from 'react';

interface CornerRibbonProps {
  text: string;
  className?: string; // additional tailwind classes for text/background if desired
  bgClass?: string;   // e.g., 'bg-primary-500'
  textClass?: string; // e.g., 'text-white'
}

// A polished diagonal corner ribbon for cards. Place inside a relatively positioned parent.
export const CornerRibbon: React.FC<CornerRibbonProps> = ({
  text,
  className = '',
  bgClass = 'bg-primary-500',
  textClass = 'text-white',
}) => {
  return (
    <div className="pointer-events-none select-none absolute top-0 right-0">
      <span
        className={`relative inline-block ${bgClass} ${textClass} shadow-lg ring-2 ring-white/10 dark:ring-black/20 uppercase tracking-wider text-[10px] md:text-xs font-extrabold px-8 py-1 ${className}`}
        style={{
          transform: 'translate(35%, -40%) rotate(45deg)',
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default CornerRibbon;
