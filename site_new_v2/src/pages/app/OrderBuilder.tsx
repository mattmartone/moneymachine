import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const TRACKS = [
'Belmont Park',
'Churchill Downs',
'Saratoga',
'Santa Anita',
'Gulfstream Park'];

// Active strategies available for order (retired ones excluded)
const STRATEGIES = [
{
  code: 'VULN-FAVE',
  name: 'Spot the Vulnerable Favorite'
},
{
  code: 'TRIP',
  name: 'Troubled Trip'
},
{
  code: 'S1',
  name: 'Elite Jockey on Bomb'
},
{
  code: 'S2',
  name: 'Late Tote Action'
},
{
  code: 'S4',
  name: 'Hot Barn at a Price'
},
{
  code: 'S5',
  name: 'Distance Stretch-out'
},
{
  code: 'S6',
  name: 'Best Last-Race Beyer'
},
{
  code: 'S9',
  name: 'Earnings Leader'
}];

const RACES = [
'1',
'2',
'3',
'4',
'5',
'6',
'7',
'8',
'9',
'10',
'11',
'12',
'All Races'];

export function OrderBuilder() {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [track, setTrack] = useState(TRACKS[0]);
  const [selectedRaces, setSelectedRaces] = useState<string[]>(['All Races']);
  const [selectedStrats, setSelectedStrats] = useState<string[]>(['Alpha-7']);
  const [stratQuery, setStratQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>(
    'idle'
  );
  // Simple pricing: $5 per strategy per race (All races = 10 races for pricing)
  const raceCount = selectedRaces.includes('All Races') ?
  10 :
  selectedRaces.length;
  const stratCount = selectedStrats.length;
  const price = raceCount * stratCount * 5;
  const filteredStrategies = useMemo(() => {
    const q = stratQuery.trim().toLowerCase();
    if (!q) return STRATEGIES;
    return STRATEGIES.filter(
      (s) =>
      s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [stratQuery]);
  const handleRaceToggle = (r: string) => {
    if (r === 'All Races') {
      setSelectedRaces(['All Races']);
      return;
    }
    let newRaces = selectedRaces.filter((x) => x !== 'All Races');
    if (newRaces.includes(r)) {
      newRaces = newRaces.filter((x) => x !== r);
    } else {
      newRaces.push(r);
    }
    if (newRaces.length === 0) newRaces = ['All Races'];
    setSelectedRaces(newRaces);
  };
  const handleStratToggle = (code: string) => {
    let newStrats = [...selectedStrats];
    if (newStrats.includes(code)) {
      newStrats = newStrats.filter((x) => x !== code);
    } else {
      newStrats.push(code);
    }
    setSelectedStrats(newStrats);
  };
  const handleSelectAllStrats = (e: React.MouseEvent) => {
    e.preventDefault();
    // Select all currently visible (filtered) strategies, merged with existing selection
    const visibleCodes = filteredStrategies.map((s) => s.code);
    const allSelected = visibleCodes.every((c) => selectedStrats.includes(c));
    if (allSelected) {
      // Deselect the visible ones
      setSelectedStrats(selectedStrats.filter((c) => !visibleCodes.includes(c)));
    } else {
      setSelectedStrats(
        Array.from(new Set([...selectedStrats, ...visibleCodes]))
      );
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert('Please select a date.');
      return;
    }
    if (selectedStrats.length === 0) {
      alert('Please select at least one strategy.');
      return;
    }
    setStatus('processing');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        navigate('/app'); // Back to dashboard
      }, 3000);
    }, 1500);
  };
  if (status === 'success') {
    return (
      <div className="p-8 bg-[#e6ffe6] border-4 border-[#008000] text-center shadow-[6px_6px_0px_0px_rgba(0,128,0,1)]">
        <h2 className="font-serif text-3xl font-bold text-[#008000] mb-4">
          ORDER CONFIRMED!
        </h2>
        <p className="font-serif text-xl text-black mb-4">
          Your payment of ${price}.00 was successful.
        </p>
        <p className="font-sans font-bold text-lg text-black">
          Reports will be emailed to you 30 minutes before post time.
        </p>
        <p className="font-mono text-sm mt-8 text-gray-600">
          Redirecting to dashboard...
        </p>
      </div>);

  }
  const allVisibleSelected =
  filteredStrategies.length > 0 &&
  filteredStrategies.every((s) => selectedStrats.includes(s.code));
  return (
    <div>
      <div className="bg-[#000080] text-white font-bold p-1 px-2 mb-6">
        <span>Order Builder — Configure Your Report</span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        
        {/* Each step on its own full-width row */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="block font-sans font-bold mb-2">
              1. SELECT DATE:
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border-2 border-gray-400 shadow-inset font-mono"
              required />
            
          </div>

          <div>
            <label className="block font-sans font-bold mb-2">
              2. SELECT TRACK:
            </label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="w-full p-2 border-2 border-gray-400 shadow-inset font-mono bg-white">
              
              {TRACKS.map((t) =>
              <option key={t} value={t}>
                  {t}
                </option>
              )}
            </select>
          </div>

          <div>
            <label className="block font-sans font-bold mb-2">
              3. SELECT RACES:
            </label>
            <div className="flex flex-wrap gap-2 p-2 border-2 border-gray-400 shadow-inset bg-gray-100 max-h-32 overflow-y-auto">
              {RACES.map((r) =>
              <button
                key={r}
                type="button"
                onClick={() => handleRaceToggle(r)}
                className={`px-2 py-1 font-mono text-sm border border-black ${selectedRaces.includes(r) ? 'bg-[#000080] text-white shadow-inset' : 'bg-white shadow-outset'}`}>
                
                  {r}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Strategies — own full-width row */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <label className="font-sans font-bold" htmlFor="strat-search">
              4. SELECT STRATEGIES:
            </label>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-gray-600">
                {selectedStrats.length} selected
              </span>
              <a
                href="#"
                onClick={handleSelectAllStrats}
                className="web-link text-sm font-bold">
                
                {allVisibleSelected ? 'Clear all' : 'Select all'}
              </a>
            </div>
          </div>

          {/* Quick search */}
          <input
            id="strat-search"
            type="text"
            value={stratQuery}
            onChange={(e) => setStratQuery(e.target.value)}
            placeholder="Quick search strategies…"
            className="w-full p-2 mb-2 border-2 border-gray-400 shadow-inset font-mono bg-white focus:bg-[#ffffcc] outline-none"
            aria-label="Search strategies" />
          

          {/* Scrollable list — one strategy per row */}
          <div className="border-2 border-gray-400 shadow-inset bg-gray-100 max-h-56 overflow-y-auto divide-y divide-gray-300">
            {filteredStrategies.length === 0 ?
            <div className="p-4 text-center font-serif italic text-gray-500">
                No strategies match “{stratQuery}”.
              </div> :

            filteredStrategies.map((s) => {
              const checked = selectedStrats.includes(s.code);
              return (
                <label
                  key={s.code}
                  className={`flex items-center gap-3 px-3 py-2 font-mono cursor-pointer hover:bg-[#ffffcc] ${checked ? 'bg-[#fffbe0]' : ''}`}>
                  
                    <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleStratToggle(s.code)}
                    className="w-4 h-4 shrink-0" />
                  
                    <span className="font-bold text-[#000080]">{s.code}</span>
                    <span className="text-gray-700 truncate">— {s.name}</span>
                  </label>);

            })
            }
          </div>
        </div>

        {/* Pricing & Submit */}
        <div className="border-t-2 border-black pt-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-[#ffffcc] p-4 shadow-inset">
          <div>
            <div className="font-sans font-bold text-sm text-gray-600 mb-1">
              ORDER TOTAL:
            </div>
            <div className="font-mono text-4xl font-bold text-web-green">
              ${price}.00
            </div>
            <div className="font-serif text-xs text-gray-600 mt-1">
              ({raceCount} races × {stratCount} strategies × $5)
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'processing'}
            className="px-8 py-4 bg-web-gray font-sans font-bold text-xl text-black border-2 border-white border-r-black border-b-black shadow-outset active:shadow-inset active:pt-4.5 active:pl-8.5 cursor-pointer disabled:opacity-70">
            
            {status === 'processing' ? 'PROCESSING...' : 'PAY & SUBMIT ORDER'}
          </button>
        </div>
      </form>
    </div>);

}