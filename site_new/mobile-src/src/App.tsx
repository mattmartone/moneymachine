import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Today } from './pages/Today';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Performance } from './pages/Performance';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { BetBuilderOverlay } from './components/BetBuilderOverlay';
import { ThemeProvider } from './components/ThemeProvider';
export function App() {
  const [isBetBuilderOpen, setIsBetBuilderOpen] = useState(false);
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const todayStr = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-app text-gray-900 selection:bg-primary/20 selection:text-primary font-sans md:pl-64">
        <Sidebar onOpenBetBuilder={() => setIsBetBuilderOpen(true)} selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <div className="w-full">
          <Routes>
            <Route path="/" element={<Today selectedDate={selectedDate} />} />
            <Route path="/history" element={<History />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
        <BottomNav onOpenBetBuilder={() => setIsBetBuilderOpen(true)} />
        <BetBuilderOverlay
          isOpen={isBetBuilderOpen}
          onClose={() => setIsBetBuilderOpen(false)} />
        
      </div>
    </ThemeProvider>);

}