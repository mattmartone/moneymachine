import React, { useState } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { Today } from './pages/Today';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Performance } from './pages/Performance';
import { Research } from './pages/Research';
import { BetBuilder } from './pages/BetBuilder';
import { TrackCard } from './pages/TrackCard';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { BetBuilderOverlay } from './components/BetBuilderOverlay';
import { ThemeProvider } from './components/ThemeProvider';
import { SiteModal } from './components/SiteModal';
export function App() {
  const [isBetBuilderOpen, setIsBetBuilderOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const todayStr = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || todayStr);
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSearchParams({ date });
  };
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-app text-gray-900 selection:bg-primary/20 selection:text-primary font-sans md:pl-64">
        <Sidebar onOpenBetBuilder={() => setIsBetBuilderOpen(true)} selectedDate={selectedDate} onDateChange={handleDateChange} />
        <div className="w-full">
          <Routes>
            <Route path="/" element={<Today selectedDate={selectedDate} onDateChange={handleDateChange} />} />
            <Route path="/saratoga" element={<Today selectedDate={selectedDate} onDateChange={handleDateChange} track="Saratoga" />} />
            <Route path="/gulfstream" element={<Today selectedDate={selectedDate} onDateChange={handleDateChange} track="Gulfstream Park" />} />
            <Route path="/monmouth" element={<Today selectedDate={selectedDate} onDateChange={handleDateChange} track="Monmouth Park" />} />
            <Route path="/prairie-meadows" element={<Today selectedDate={selectedDate} onDateChange={handleDateChange} track="Prairie Meadows" />} />
            <Route path="/history" element={<History />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/research" element={<Research />} />
            <Route path="/bet-builder" element={<BetBuilder />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
        <BottomNav onOpenBetBuilder={() => setIsBetBuilderOpen(true)} />
        <BetBuilderOverlay
          isOpen={isBetBuilderOpen}
          onClose={() => setIsBetBuilderOpen(false)} />
        <SiteModal />
      </div>
    </ThemeProvider>);

}