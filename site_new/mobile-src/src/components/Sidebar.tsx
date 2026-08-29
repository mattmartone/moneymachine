import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  Sparkles,
  Activity,
  TrendingUp,
  Search,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight } from
'lucide-react';
function MiniCalendar({ selectedDate, onDateChange }: { selectedDate: string; onDateChange: (d: string) => void }) {
  const [year, month] = selectedDate.split('-').map(Number);
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfWeek }, () => null);

  const selectedDay = year === viewYear && month === viewMonth ? parseInt(selectedDate.split('-')[2]) : null;

  const prev = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const next = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day: number) => {
    const d = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (d === selectedDate) return;
    onDateChange(d);
  };

  const monthName = new Date(viewYear, viewMonth - 1).toLocaleString('en-US', { month: 'short' });

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} className="p-1 rounded hover:bg-app text-muted"><ChevronLeft size={14} /></button>
        <span className="text-xs font-semibold text-gray-700">{monthName} {viewYear}</span>
        <button onClick={next} className="p-1 rounded hover:bg-app text-muted"><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <span key={i} className="text-[9px] font-semibold text-muted py-1">{d}</span>
        ))}
        {blanks.map((_, i) => <span key={`b${i}`} />)}
        {days.map((day) => (
          <button
            key={day}
            onClick={() => selectDay(day)}
            className={`text-xs py-1 rounded-md transition-colors ${
              day === selectedDay
                ? 'bg-primary text-white font-bold'
                : 'text-gray-700 hover:bg-app font-medium'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Sidebar({
  onOpenBetBuilder,
  selectedDate,
  onDateChange


}: {onOpenBetBuilder: () => void; selectedDate?: string; onDateChange?: (date: string) => void;}) {
  return (
    <div className="hidden md:flex flex-col w-64 bg-surface border-r border-border h-screen fixed left-0 top-0 shrink-0 z-40">
      <div className="p-6 border-b border-border">
        <img src="/mobile/ftc-logo.png" alt="Fade the Chalk" className="w-full object-contain" />
        {selectedDate && onDateChange && (
          <MiniCalendar selectedDate={selectedDate} onDateChange={onDateChange} />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="px-4 text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
          Race Day
        </p>
        <NavLink
          to="/"
          className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-app'}`
          }>

          <CalendarDays size={18} />
          Commission
        </NavLink>
        <NavLink
          to="/saratoga"
          className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-app'}`
          }>

          <CalendarDays size={18} />
          Saratoga
        </NavLink>

        <div className="my-4 border-t border-border pt-4 space-y-2">
          <p className="px-4 text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
            More
          </p>
          <NavLink
            to="/performance"
            className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-app'}`
            }>
            <TrendingUp size={18} />
            Performance
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-app'}`
            }>
            <SettingsIcon size={18} />
            Account
          </NavLink>
        </div>
      </nav>

    </div>);

}