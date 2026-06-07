import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
export function FreeSample() {
  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF();
      // Big diagonal SAMPLE watermark (drawn first so content sits on top)
      doc.setFont('courier', 'bold');
      doc.setFontSize(90);
      doc.setTextColor(225, 225, 225);
      doc.text('SAMPLE', 105, 160, {
        align: 'center',
        angle: 35
      });
      doc.setTextColor(0, 0, 0);
      // Retro monospace font style
      doc.setFont('courier', 'bold');
      doc.setFontSize(18);
      doc.text('FADE THE CHALK - SAMPLE TIP SHEET', 20, 20);
      doc.setFont('courier', 'normal');
      doc.setFontSize(12);
      doc.text('BELMONT DAY 2026 - SAMPLE CARD', 20, 30);
      doc.text('--------------------------------------------------', 20, 35);
      doc.setFontSize(10);
      doc.text(
        'This is exactly what our premium members receive every morning.',
        20,
        45
      );
      doc.text(
        'You pay for the signals; you get the exact win probabilities,',
        20,
        50
      );
      doc.text(
        'fair value odds, and the active strategy recommendations.',
        20,
        55
      );
      doc.text('--------------------------------------------------', 20, 65);
      // Race 1
      doc.setFont('courier', 'bold');
      doc.text('RACE 4 - MAIDEN CLAIMING - 6 FURLONGS (DIRT)', 20, 75);
      doc.setFont('courier', 'normal');
      doc.text('Active Strategy: Alpha-7 [HOT SIGNAL]', 20, 80);
      doc.text('Top Pick: #3 Silver Charm', 20, 85);
      doc.text(
        'Win Prob: 34.2%  |  Fair Odds: 2-1  |  Morning Line: 5-1',
        20,
        90
      );
      doc.text('Recommendation: STRONG PLAY (Overlay)', 20, 95);
      // Race 2
      doc.setFont('courier', 'bold');
      doc.text('RACE 8 - ALLOWANCE OPTIONAL CLAIMING - 1 MILE (TURF)', 20, 110);
      doc.setFont('courier', 'normal');
      doc.text('Active Strategy: Gamma-3 [STABLE]', 20, 115);
      doc.text('Top Pick: #7 Turf Monster', 20, 120);
      doc.text(
        'Win Prob: 22.5%  |  Fair Odds: 7-2  |  Morning Line: 3-1',
        20,
        125
      );
      doc.text('Recommendation: PASS (Underlay)', 20, 130);
      // Race 3
      doc.setFont('courier', 'bold');
      doc.text('RACE 11 - THE BELMONT STAKES - 1 1/2 MILES (DIRT)', 20, 145);
      doc.setFont('courier', 'normal');
      doc.text('Active Strategy: Omega-1 [HOT SIGNAL]', 20, 150);
      doc.text('Top Pick: #5 Longshot Larry', 20, 155);
      doc.text(
        'Win Prob: 18.0%  |  Fair Odds: 9-2  |  Morning Line: 15-1',
        20,
        160
      );
      doc.text('Recommendation: VALUE PLAY (Massive Overlay)', 20, 165);
      doc.text('--------------------------------------------------', 20, 180);
      doc.setFont('courier', 'italic');
      doc.text(
        '* Past performance is not indicative of future results.',
        20,
        190
      );
      doc.text('* For entertainment purposes only. Play responsibly.', 20, 195);
      doc.text(
        'Join the waitlist at fadethechalk.com for daily picks.',
        20,
        205
      );
      doc.save('FadeTheChalk_Belmont2026_Sample.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the sample PDF. Please try again.');
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };
  return (
    <section id="free-sample" className="py-4">
      <div className="bg-[#ffffcc] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto relative">
        {/* Retro "FREE" Badge */}
        <div className="absolute -top-4 -right-4 bg-web-red text-white font-sans font-bold text-xl px-4 py-2 border-2 border-black transform rotate-12 animate-blink shadow-outset">
          FREE!
        </div>

        <h2 className="font-serif text-3xl font-bold text-black mb-4 uppercase text-center border-b-2 border-black pb-2">
          See What You Get.
        </h2>

        <div className="font-serif text-lg mb-6 space-y-4 text-center">
          <p>
            Curious what a winning tip sheet looks like?
            <strong> Download our actual card from Belmont Day 2026.</strong>
          </p>
          <p className="text-gray-800">
            This is exactly what our premium members receive every morning. You
            pay for the signals; you get the exact win probabilities, fair value
            odds, and the active strategy recommendations.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center bg-white border-2 border-black p-4 mb-6 shadow-inset">
          <div className="font-mono text-sm text-gray-600 mb-2">PREVIEW:</div>
          <pre className="font-mono text-xs md:text-sm text-black bg-gray-100 p-2 border border-gray-300 w-full overflow-x-auto">
            {`RACE 4 - MAIDEN CLAIMING
Active Strategy: Alpha-7 [HOT SIGNAL]
Top Pick: #3 Silver Charm
Win Prob: 34.2% | Fair Odds: 2-1`}
          </pre>
        </div>

        <div className="text-center">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-8 py-3 bg-web-gray font-sans font-bold text-lg text-black border-2 border-black shadow-outset active:shadow-inset active:pt-3.5 active:pl-8.5 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 mx-auto">
            
            {isDownloading ? 'GENERATING PDF...' : 'DOWNLOAD SAMPLE (PDF)'}
          </button>
          <p className="font-sans text-xs text-gray-600 mt-2">
            File size: ~12KB. Requires Adobe Acrobat Reader.
          </p>
        </div>
      </div>
    </section>);

}