import React, { useEffect, useState, useRef, Children, Fragment } from 'react';
import { SummaryBar } from '../components/SummaryBar';
import { RaceCard } from '../components/RaceCard';
import { FeaturedVideo } from '../components/FeaturedVideo';
import { DateNav } from '../components/DateNav';
import { mockRaces, Race, fetchRaces } from '../data';
import { motion } from 'framer-motion';
// A race is "run" once it's settled or dropped; live/upcoming are still ahead.
const isConcluded = (race: Race) =>
race.status === 'hit' || race.status === 'miss' || race.status === 'dropped';
interface HourGroup {
  hour: string; // numeric hour, e.g. "1"
  period: string; // "AM" | "PM"
  races: Race[];
}
// Group races into hour blocks based on their post time (e.g. "1:05 PM" -> "1 PM").
// mockRaces is already ordered by post time, so groups stay chronological.
function groupRacesByHour(races: Race[]): HourGroup[] {
  const groups: HourGroup[] = [];
  for (const race of races) {
    const [time, period] = race.postTime.split(' ');
    const hour = time.split(':')[0];
    const last = groups[groups.length - 1];
    if (last && last.hour === hour && last.period === period) {
      last.races.push(race);
    } else {
      groups.push({
        hour,
        period,
        races: [race]
      });
    }
  }
  return groups;
}
// Sticky tag on the header/content seam. Shows the date in the center and lets
// you jump to Upcoming (left) or Results (right) by tapping either label.
function SectionTag({
  section,
  date,
  onUpcoming,
  onResults





}: {section: 'results' | 'upcoming';date: string;onUpcoming: () => void;onResults: () => void;}) {
  const base =
  'text-xs font-bold uppercase tracking-widest transition-colors rounded-md px-1 py-0.5 -mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';
  return (
    <div className="bg-app/90 backdrop-blur-md border-b border-border">
      <div className="max-w-md md:max-w-4xl mx-auto grid grid-cols-3 items-center py-2 px-4">
        <button
          type="button"
          onClick={onUpcoming}
          className={`${base} justify-self-start ${section === 'upcoming' ? 'text-gray-900' : 'text-muted/40 hover:text-muted'}`}>
          
          Upcoming
        </button>
        <span className="justify-self-center text-[11px] font-semibold uppercase tracking-wider text-muted tabular-nums">
          {date}
        </span>
        <button
          type="button"
          onClick={onResults}
          className={`${base} justify-self-end ${section === 'results' ? 'text-gray-900' : 'text-muted/40 hover:text-muted'}`}>
          
          Results
        </button>
      </div>
    </div>);

}
export function Today({ selectedDate, onDateChange }: { selectedDate?: string; onDateChange?: (date: string) => void }) {
  const [races, setRaces] = useState<Race[]>(mockRaces);

  useEffect(() => {
    fetchRaces(selectedDate).then((fetched) => {
      setRaces(fetched);
    });
  }, [selectedDate]);

  const [viewTab, setViewTab] = useState<'upcoming' | 'settled'>('upcoming');
  const [pickType, setPickType] = useState<'all' | 'commission' | 'capo'>('all');

  const allRaces = races.filter((r) => {
    if (pickType === 'all') return r.conviction === 'COMMISSION' || r.conviction === 'DROPPED' || r.conviction === 'HIGH' || r.conviction === 'CAPO';
    if (pickType === 'commission') return r.conviction === 'COMMISSION' || r.conviction === 'DROPPED';
    return r.conviction === 'HIGH' || r.conviction === 'CAPO';
  });

  const isPostTimePassed = (r: Race) => {
    if (r.postTime === '—') return false;
    const [time, period] = r.postTime.split(' ');
    const [h, m] = time.split(':').map(Number);
    let hours = h;
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return (hours * 60 + m) <= nowMinutes;
  };

  const filteredRaces = viewTab === 'upcoming'
    ? allRaces.filter((r) => r.status === 'upcoming' || (r.status === 'dropped' && !isPostTimePassed(r)))
    : [...allRaces.filter((r) => r.status === 'hit' || r.status === 'miss' || r.status === 'live' || (r.status === 'dropped' && isPostTimePassed(r)))].reverse();

  const hourGroups = groupRacesByHour(filteredRaces);
  const firstUpcoming = filteredRaces.find((r) => !isConcluded(r));
  const dividerBeforeId = firstUpcoming?.id;
  const hasResults = allRaces.some(isConcluded);
  const headerRef = useRef<HTMLDivElement>(null);
  const boundaryRef = useRef<HTMLDivElement>(null);
  const [section, setSection] = useState<'results' | 'upcoming'>(
    hasResults ? 'results' : 'upcoming'
  );
  // Once the user scrolls past the top, condense the header to reclaim space.
  const [scrolled, setScrolled] = useState(false);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const scrollToResults = () =>
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  const scrollToUpcoming = () =>
  boundaryRef.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    // No boundary (all run, or all upcoming) -> section is fixed.
    if (!dividerBeforeId || !hasResults) return;
    const update = () => {
      if (!boundaryRef.current || !headerRef.current) return;
      const threshold = headerRef.current.offsetHeight;
      const top = boundaryRef.current.getBoundingClientRect().top;
      setSection(top <= threshold + 4 ? 'upcoming' : 'results');
    };
    update();
    window.addEventListener('scroll', update, {
      passive: true
    });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [dividerBeforeId, hasResults]);
  return (
    <div className="pb-24">
      {/* Sticky header */}
      <div ref={headerRef} className="sticky top-0 z-20 shadow-sm">
        <SummaryBar compact={scrolled} races={allRaces} />
      </div>

      {selectedDate && onDateChange && (
        <DateNav selectedDate={selectedDate} onDateChange={onDateChange} />
      )}

      {selectedDate && ['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28'].includes(selectedDate) && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-[11px] text-red-700 font-medium">
            ⚠ Data integrity issue — bets for this date were corrupted during the 7/3 pipeline migration. What's shown here may not reflect actual Commission picks.
          </p>
        </div>
      )}

      <main className="p-4 max-w-md md:max-w-4xl mx-auto">
        <FeaturedVideo />

        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold tracking-tight">Today's Card</h2>
          <span className="text-xs text-muted font-medium">
            Updated: 1:45 PM
          </span>
        </div>


        {/* Upcoming / Settled tabs */}
        <div className="flex gap-1 bg-app border border-border rounded-xl p-1 mb-6">
          <button
            onClick={() => setViewTab('upcoming')}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${viewTab === 'upcoming' ? 'bg-surface text-gray-900 shadow-sm' : 'text-muted hover:text-gray-700'}`}>
            Upcoming
          </button>
          <button
            onClick={() => setViewTab('settled')}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${viewTab === 'settled' ? 'bg-surface text-gray-900 shadow-sm' : 'text-muted hover:text-gray-700'}`}>
            Results
          </button>
        </div>

        {/* Pick type toggle */}
        <div className="flex gap-1 bg-app border border-border rounded-xl p-1 mb-3">
          <button
            onClick={() => setPickType('commission')}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${pickType === 'commission' ? 'bg-surface text-gray-900 shadow-sm' : 'text-muted hover:text-gray-700'}`}>
            Commission
          </button>
          <button
            onClick={() => setPickType('capo')}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${pickType === 'capo' ? 'bg-surface text-gray-900 shadow-sm' : 'text-muted hover:text-gray-700'}`}>
            Capo
          </button>
          <button
            onClick={() => setPickType('all')}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${pickType === 'all' ? 'bg-surface text-gray-900 shadow-sm' : 'text-muted hover:text-gray-700'}`}>
            All
          </button>
        </div>

        {/* Timeline: hour markers sit on a background rail, races sit on top */}
        <div className="relative">
          {/* Continuous vertical rail behind the hour nodes — hidden on mobile */}
          <div
            className="absolute top-2 bottom-2 w-px bg-border hidden md:block"
            style={{
              left: '23px'
            }}
            aria-hidden="true" />


          <motion.div
            className="space-y-8 md:space-y-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {
                opacity: 0
              },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}>

            {hourGroups.map((group) =>
            <section
              key={`${group.hour}-${group.period}`}
              className="relative md:pl-16">

                {/* Hour marker: separator row on mobile, absolute left column on desktop */}
                <div className="flex items-center gap-3 mb-3 select-none md:absolute md:left-0 md:top-0 md:flex-col md:items-center md:w-12 md:mb-0 md:gap-0">
                  <span className="text-xl font-bold leading-none text-slate-300 tabular-nums md:text-3xl">
                    {group.hour}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 md:mt-0.5">
                    {group.period}
                  </span>
                  <span className="flex-1 h-px bg-border md:hidden" />
                </div>

                {/* Races sitting on top of the timeline for this hour block */}
                <div className="space-y-3">
                  {group.races.map((race) =>
                <Fragment key={race.id}>
                      {race.id === dividerBeforeId &&
                  // Invisible seam used to flip the sticky section tag.
                  <div
                    ref={boundaryRef}
                    className="scroll-mt-32"
                    aria-hidden="true" />

                  }
                      <motion.div
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 16
                      },
                      visible: {
                        opacity: 1,
                        y: 0
                      }
                    }}>

                        <RaceCard race={race} />
                      </motion.div>
                    </Fragment>
                )}
                </div>
              </section>
            )}
          </motion.div>
        </div>
        {selectedDate === '2026-07-24' && (
        <div className="flex justify-center py-6">
          <a href="/monmouth?date=2026-07-24&race=1" className="bg-surface border border-border text-gray-900 font-bold text-sm px-5 py-3 rounded-xl shadow-soft hover:bg-app transition-colors">
            Monmouth Park — At the Track
          </a>
        </div>
        )}
      </main>
    </div>);

}