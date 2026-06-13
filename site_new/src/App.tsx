import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { TheModel } from './components/TheModel';
import { PerformanceProof } from './components/PerformanceProof';
import { FreeSample } from './components/FreeSample';
import { Footer } from './components/Footer';
import { Verify } from './pages/Verify';
import { Onboard } from './pages/Onboard';
import { Reports } from './pages/Reports';
import { Strategies } from './pages/Strategies';
import { Contact } from './pages/Contact';
import { Users } from './pages/Users';
import { Board } from './pages/Board';
import { Post } from './pages/Post';
import { Submit } from './pages/Submit';
import { AdminSubmissions } from './pages/AdminSubmissions';
import { Leaderboard } from './pages/Leaderboard';
import { Lab } from './pages/Lab';
import { MemberDetail } from './pages/MemberDetail';
import { Shop } from './pages/Shop';
import { Db } from './pages/Db';
import { Races } from './pages/Races';
import { Today } from './pages/Today';
import { RaceDetail } from './pages/RaceDetail';

function Landing() {
  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container">
        <Header />
        <main>
          <Hero />
          <hr className="web-hr" />
          <HowItWorks />
          <hr className="web-hr" />
          <TheModel />
          <hr className="web-hr" />
          <PerformanceProof />
          <hr className="web-hr" />
          <FreeSample />
        </main>
        <hr className="web-hr" />
        <Footer />
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/onboard" element={<Onboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/board" element={<Board />} />
        <Route path="/board/:id" element={<Post />} />
        <Route path="/lab" element={<Lab />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin/submissions" element={<AdminSubmissions />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<MemberDetail />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/today" element={<Today />} />
        <Route path="/today/:raceId" element={<RaceDetail />} />
        <Route path="/races" element={<Races />} />
        <Route path="/db" element={<Db />} />
      </Routes>
    </BrowserRouter>
  );
}
