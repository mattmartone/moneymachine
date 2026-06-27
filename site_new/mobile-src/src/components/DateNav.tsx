import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CALENDAR_PIN = '7413';

interface DateNavProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
}

export function DateNav({ selectedDate, onDateChange }: DateNavProps) {
  const [pinUnlocked, setPinUnlocked] = useState(false);

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const shiftDate = (days: number) => {
    if (!pinUnlocked) {
      const entered = window.prompt('Enter PIN to change date');
      if (entered !== CALENDAR_PIN) return;
      setPinUnlocked(true);
    }
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    onDateChange(next);
  };

  return (
    <div className="flex md:hidden items-center justify-center gap-3 py-2 px-4">
      <button
        onClick={() => shiftDate(-1)}
        className="p-1.5 rounded-lg text-muted hover:text-gray-900 hover:bg-surface transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-semibold text-gray-700 tabular-nums min-w-[100px] text-center">
        {formatDate(selectedDate)}
      </span>
      <button
        onClick={() => shiftDate(1)}
        className="p-1.5 rounded-lg text-muted hover:text-gray-900 hover:bg-surface transition-colors"
        aria-label="Next day"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
