import { jsPDF } from 'jspdf';

export interface OrderReport {
  id: string;
  date: string;
  track: string;
  races: string;
  strategies: string;
}

const SAMPLE_PICKS = [
{
  race: 'RACE 4 - MAIDEN CLAIMING - 6F (DIRT)',
  strat: 'Alpha-7 [HOT SIGNAL]',
  pick: '#3 Silver Charm',
  line: 'Win Prob: 34.2%  |  Fair Odds: 2-1  |  M/L: 5-1',
  rec: 'STRONG PLAY (Overlay)'
},
{
  race: 'RACE 8 - ALLOWANCE - 1 MILE (TURF)',
  strat: 'Gamma-3 [STABLE]',
  pick: '#7 Turf Monster',
  line: 'Win Prob: 22.5%  |  Fair Odds: 7-2  |  M/L: 3-1',
  rec: 'VALUE PLAY (Overlay)'
},
{
  race: 'RACE 11 - GRADED STAKES - 1 1/4M (DIRT)',
  strat: 'Omega-1 [HOT SIGNAL]',
  pick: '#5 Longshot Larry',
  line: 'Win Prob: 18.0%  |  Fair Odds: 9-2  |  M/L: 15-1',
  rec: 'VALUE PLAY (Massive Overlay)'
}];


export function generateReportPdf(order: OrderReport) {
  const doc = new jsPDF();

  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  doc.text('FADE THE CHALK - OFFICIAL TIP SHEET', 20, 20);

  doc.setFont('courier', 'normal');
  doc.setFontSize(11);
  doc.text(`ORDER: ${order.id}`, 20, 30);
  doc.text(`RACE DAY: ${order.date}  |  TRACK: ${order.track}`, 20, 36);
  doc.text(`RACES: ${order.races}  |  STRATEGIES: ${order.strategies}`, 20, 42);
  doc.text('--------------------------------------------------', 20, 48);

  let y = 60;
  SAMPLE_PICKS.forEach((p) => {
    doc.setFont('courier', 'bold');
    doc.text(p.race, 20, y);
    doc.setFont('courier', 'normal');
    doc.text(`Active Strategy: ${p.strat}`, 20, y + 5);
    doc.text(`Top Pick: ${p.pick}`, 20, y + 10);
    doc.text(p.line, 20, y + 15);
    doc.text(`Recommendation: ${p.rec}`, 20, y + 20);
    y += 33;
  });

  doc.text('--------------------------------------------------', 20, y);
  doc.setFont('courier', 'italic');
  doc.setFontSize(9);
  doc.text('* Past performance is not indicative of future results.', 20, y + 8);
  doc.text('* For entertainment purposes only. Play responsibly.', 20, y + 13);
  doc.text('(c) 2026 Fade the Chalk', 20, y + 18);

  doc.save(`FadeTheChalk_${order.id}.pdf`);
}