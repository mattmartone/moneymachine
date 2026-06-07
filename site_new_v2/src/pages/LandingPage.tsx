import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { TheModel } from '../components/TheModel';
import { PerformanceProof } from '../components/PerformanceProof';
import { FreeSample } from '../components/FreeSample';
import { Footer } from '../components/Footer';
export function LandingPage() {
  return (
    <div className="min-h-screen font-serif p-2 md:p-4 bg-web-gray">
      <div className="web-container bg-web-paper border-2 border-black p-4 md:p-8 my-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-4xl mx-auto">
        <Header />
        <main>
          <Hero />
          <hr className="web-hr border-t-2 border-web-darkgray border-b-2 border-b-white my-6" />
          <HowItWorks />
          <hr className="web-hr border-t-2 border-web-darkgray border-b-2 border-b-white my-6" />
          <TheModel />
          <hr className="web-hr border-t-2 border-web-darkgray border-b-2 border-b-white my-6" />
          <PerformanceProof />
          <hr className="web-hr border-t-2 border-web-darkgray border-b-2 border-b-white my-6" />
          <FreeSample />
        </main>
        <hr className="web-hr border-t-2 border-web-darkgray border-b-2 border-b-white my-6" />
        <Footer />
      </div>
    </div>);

}