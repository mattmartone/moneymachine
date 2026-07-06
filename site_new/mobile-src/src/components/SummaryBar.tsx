import React, { useEffect, useState } from 'react';
import { Race } from '../data';
import {
  Menu,
  X,
  CalendarDays,
  Activity,
  TrendingUp,
  Search,
  Settings as SettingsIcon,
  LogOut,
  Timer } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
export function SummaryBar({ compact = false, races = [] }: {compact?: boolean; races?: Race[];}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Include settled races (hit/miss) plus live races (post time passed, money committed).
  // Exclude upcoming (future, not yet at risk) and dropped ($0 stakes).
  const activeRaces = races.filter((r) => r.status === 'hit' || r.status === 'miss' || r.status === 'live');
  const net = activeRaces.reduce((acc, r) => acc + (r.collected - r.totalStake), 0);
  // Wagered = total committed for the day (all races with stake > 0, regardless of status)
  const totalWagered = races.filter((r) => r.totalStake > 0).reduce((acc, r) => acc + r.totalStake, 0);
  const isPositive = net > 0;
  const isNegative = net < 0;
  // Next post countdown — lives in the header so it doesn't compete with the nav.
  const nextRace =
  races.find((r) => r.status === 'live') ??
  races.find((r) => r.status === 'upcoming');
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const calc = () => {
      if (!nextRace?.postTime || nextRace.postTime === '—') return 0;
      const now = new Date();
      const parts = nextRace.postTime.split(' ');
      if (parts.length < 2) return 0;
      const [time, period] = parts;
      const [h, m] = time.split(':').map(Number);
      let hours = h;
      if (period === 'PM' && h !== 12) hours += 12;
      if (period === 'AM' && h === 12) hours = 0;
      const postDate = new Date(now);
      postDate.setHours(hours, m, 0, 0);
      const diff = Math.floor((postDate.getTime() - now.getTime()) / 1000);
      return diff > 0 ? diff : 0;
    };
    setTimeLeft(calc());
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [nextRace?.postTime]);
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

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-app border border-border px-3 py-1.5 rounded-full shadow-sm">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                  Wagered
                </span>
                <span className="text-sm font-bold tabular-nums leading-none text-gray-900">
                  ${totalWagered.toFixed(0)}
                </span>
              </div>
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
          </div>

          {/* Next post countdown row — collapses away once the user scrolls or all races done */}
          <AnimatePresence initial={false}>
            {nextRace && !compact && timeLeft > 0 &&
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
                  to="/performance"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-app'}`
                  }>
                    <TrendingUp size={18} />
                    Performance
                  </NavLink>
                  <NavLink
                  to="/research"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-app'}`
                  }>
                    <Search size={18} />
                    Research
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