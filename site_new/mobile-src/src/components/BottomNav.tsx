import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
export function BottomNav({
  onOpenBetBuilder


}: {onOpenBetBuilder?: () => void;}) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-t border-border pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
      <div className="max-w-md mx-auto flex justify-between items-center h-16 px-8 relative">
        <NavLink
          to="/"
          className={({ isActive }) =>
          `flex flex-col items-center justify-center h-full gap-1 transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-gray-900'}`
          }>
          
          <CalendarDays size={20} />
          <span className="text-[10px] font-semibold tracking-wider uppercase">
            Race Day
          </span>
        </NavLink>

        {/* Center FAB for AI Bet Builder */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-5">
          <motion.button
            whileTap={{
              scale: 0.92
            }}
            onClick={onOpenBetBuilder}
            className="bg-primary text-white p-3.5 rounded-full shadow-float flex items-center justify-center border-4 border-surface focus:outline-none"
            aria-label="Open AI Bet Builder">
            
            <Sparkles size={22} />
          </motion.button>
        </div>

        <NavLink
          to="/history"
          className={({ isActive }) =>
          `flex flex-col items-center justify-center h-full gap-1 transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-gray-900'}`
          }>
          
          <Activity size={20} />
          <span className="text-[10px] font-semibold tracking-wider uppercase">
            Activity
          </span>
        </NavLink>
      </div>
    </div>);

}