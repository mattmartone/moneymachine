import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { TheModel } from './components/TheModel';
import { PerformanceProof } from './components/PerformanceProof';
import { FreeSample } from './components/FreeSample';
import { Footer } from './components/Footer';
export function App() {
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
    </div>);

}