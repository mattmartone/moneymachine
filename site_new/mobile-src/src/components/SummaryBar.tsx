import React, { useEffect, useState } from 'react';
import { Race } from '../data';
import {
  Menu,
  X,
  CalendarDays,
  Activity,
  Settings as SettingsIcon,
  LogOut,
  Timer } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
export function SummaryBar({ compact = false, races = [] }: {compact?: boolean; races?: Race[];}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [perfNet, setPerfNet] = useState<number>(0);

  useEffect(() => {
    fetch('/api/lab/performance', { headers: { Authorization: 'Bearer public' } })
      .then((r) => r.json())
      .then((data) => {
        if (data.performance) setPerfNet(data.performance.net || 0);
      })
      .catch(() => {});
  }, [races]);

  const net = perfNet;
  const isPositive = net > 0;
  const isNegative = net < 0;
  // Next post countdown — lives in the header so it doesn't compete with the nav.
  const nextRace =
  races.find((r) => r.status === 'live') ??
  races.find((r) => r.status === 'upcoming');
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 23);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return (
    <>
      <div
        className={`bg-surface/90 backdrop-blur-md border-b border-border px-4 transition-[padding] duration-200 ${compact ? 'py-2.5' : 'py-4'}`}>
        
        <div className="max-w-md md:max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="text-gray-900 hover:text-primary transition-colors focus:outline-none p-1 -ml-1 rounded-lg hover:bg-app"
                aria-label="Open menu">
                
                <Menu size={24} />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-gray-900">
                Fade the Chalk
              </h1>
            </div>
            {/* Desktop spacer to keep the right side aligned when brand is hidden */}
            <div className="hidden md:block" />

            <div className="flex items-center gap-2 bg-app border border-border px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                Net
              </span>
              <span
                className={`text-sm font-bold tabular-nums leading-none ${isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-gray-900'}`}>
                
                {net === 0 ? '$0' : `${net >= 0 ? '+' : '-'}$${Math.abs(net).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Next post countdown row — collapses away once the user scrolls */}
          <AnimatePresence initial={false}>
            {nextRace && !compact &&
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
                marginTop: 0
              }}
              animate={{
                height: 'auto',
                opacity: 1,
                marginTop: 12
              }}
              exit={{
                height: 0,
                opacity: 0,
                marginTop: 0
              }}
              transition={{
                duration: 0.2,
                ease: 'easeInOut'
              }}
              className="overflow-hidden">
              
                <div className="flex items-center justify-between gap-3 bg-app border border-border rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="bg-primary/10 p-1.5 rounded-lg text-primary shrink-0">
                      <Timer size={15} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted leading-none mb-1">
                        Next Post
                      </span>
                      <span className="text-sm font-semibold text-gray-900 leading-none truncate">
                        {nextRace.track} R{nextRace.raceNumber}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-lg tabular-nums tracking-tight text-primary shrink-0">
                    {minutes.toString().padStart(2, '0')}:
                    {seconds.toString().padStart(2, '0')}
                  </span>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen &&
        <>
            <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
          
            <motion.div
            initial={{
              x: '-100%'
            }}
            animate={{
              x: 0
            }}
            exit={{
              x: '-100%'
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200
            }}
            className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-surface border-r border-border z-[70] flex flex-col shadow-2xl">
            
              <div className="p-4 border-b border-border flex justify-between items-center bg-app/50">
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-muted hover:text-gray-900 bg-surface rounded-full border border-border shadow-sm transition-colors">
                
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                <NavLink
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-app'}`
                }>
                
                  <CalendarDays size={18} />
                  Race Day
                </NavLink>

                <div className="my-4 border-t border-border pt-4 space-y-2">
                  <p className="px-4 text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
                    More
                  </p>
                  <NavLink
                  to="/history"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-app'}`
                  }>
                  
                    <Activity size={18} />
                    Activity
                  </NavLink>
                  <NavLink
                  to="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-app'}`
                  }>
                  
                    <SettingsIcon size={18} />
                    Account
                  </NavLink>
                </div>
              </nav>

              <div className="p-4 border-t border-border">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-semibold text-danger hover:bg-danger/10 transition-colors">
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>
    </>);

}