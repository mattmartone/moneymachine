import React, { Children, Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  ListChecks,
  Sparkles,
  TrendingDown,
  Ban,
  Flag,
  Trophy,
  Activity as ActivityIcon } from
'lucide-react';
type ActivityType =
'card_loaded' |
'analysis' |
'odds' |
'scratch' |
'result' |
'win';
interface ActivityEvent {
  id: string;
  time: string;
  type: ActivityType;
  title: string;
  detail?: string;
  // For result events: the finishing order (program numbers).
  order?: number[];
  // A short emphasized payout/price chip, e.g. "+$72" or "40-1".
  highlight?: string;
  // Material money moments get a tinted card treatment.
  big?: boolean;
}
// The day's running log written in plain English, newest first. Material money
// moments (big-priced winners, exacta hits, net swings) are flagged `big`.
const activity: ActivityEvent[] = [
{
  id: 'a1',
  time: '4:52 PM',
  type: 'win',
  title: 'Banner day on the board',
  detail:
  "We're closing the card up $25,000 net — the biggest single-day haul of the meet. Fading the chalk paid off across the board.",
  highlight: '+$25,000 net',
  big: true
},
{
  id: 'a2',
  time: '4:31 PM',
  type: 'win',
  title: 'Longshot lands in AQU R6',
  detail:
  'Ironclad came home at 40-1 — the double bet hit hard and carried the afternoon. Exactly the spot we hammered.',
  highlight: '40-1 winner',
  big: true
},
{
  id: 'a3',
  time: '3:18 PM',
  type: 'win',
  title: 'Exacta cashes in AQU R4',
  detail:
  'Our key over the field came in. The $1 exacta paid $72 — clean value off the pace read.',
  highlight: '+$72 exacta',
  big: true
},
{
  id: 'a4',
  time: '2:18 PM',
  type: 'result',
  title: 'AQU R2 came back chalky',
  detail:
  'Favorite held on. No ticket for us here — small pass, on to the next.',
  order: [3, 6, 1]
},
{
  id: 'a5',
  time: '2:04 PM',
  type: 'odds',
  title: 'Big drift on the favorite in AQU R3',
  detail:
  'Chalk #4 drifted from 5/2 out to 9/2 in the last few minutes. Value opened up underneath and we leaned in.'
},
{
  id: 'a6',
  time: '1:47 PM',
  type: 'scratch',
  title: '#6 scratched in AQU R3',
  detail:
  "Taken off the board. No impact on us — it wasn't in any of our tickets."
},
{
  id: 'a7',
  time: '1:32 PM',
  type: 'result',
  title: 'AQU R1 in the books',
  detail: 'Our number ran second — just missed. Live and learn.',
  order: [7, 4, 2]
},
{
  id: 'a8',
  time: '1:10 PM',
  type: 'odds',
  title: 'Morning tote refreshed on AQU R1',
  detail: 'Live odds came in and the board firmed up. Picks held.'
},
{
  id: 'a9',
  time: '12:40 PM',
  type: 'analysis',
  title: 'Analysis posted for the full card',
  detail: 'Pace thesis and vulnerability notes went up on all 6 races.'
},
{
  id: 'a10',
  time: '12:15 PM',
  type: 'card_loaded',
  title: "Today's card loaded",
  detail: '6 races across AQU pulled in and ready to scan.'
}];

const config: Record<
  ActivityType,
  {
    icon: React.ElementType;
    tint: string;
    bg: string;
  }> =
{
  card_loaded: {
    icon: ListChecks,
    tint: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  analysis: {
    icon: Sparkles,
    tint: 'text-primary',
    bg: 'bg-primary/10'
  },
  odds: {
    icon: TrendingDown,
    tint: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  scratch: {
    icon: Ban,
    tint: 'text-muted',
    bg: 'bg-app'
  },
  result: {
    icon: Flag,
    tint: 'text-success',
    bg: 'bg-success/10'
  },
  win: {
    icon: Trophy,
    tint: 'text-success',
    bg: 'bg-success/15'
  }
};
export function History() {
  return (
    <div className="pb-24 min-h-screen bg-app">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <ActivityIcon size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
              Activity
            </h1>
            <p className="text-xs text-muted font-medium leading-tight">
              A running, plain-English log of today's card
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-6">
        <div className="relative">
          {/* Vertical rail behind the event nodes */}
          <div
            className="absolute top-3 bottom-3 w-px bg-border"
            style={{
              left: '19px'
            }}
            aria-hidden="true" />
          

          <motion.ol
            className="space-y-5"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {
                opacity: 0
              },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.06
                }
              }
            }}>
            
            {activity.map((event) => {
              const { icon: Icon, tint, bg } = config[event.type];
              return (
                <motion.li
                  key={event.id}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 12
                    },
                    visible: {
                      opacity: 1,
                      y: 0
                    }
                  }}
                  className="relative flex gap-4">
                  
                  {/* Node */}
                  <div
                    className={`relative z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-app ${bg} ${tint}`}>
                    
                    <Icon size={16} />
                  </div>

                  {/* Body — material money moments get a tinted card */}
                  <div
                    className={`flex-1 min-w-0 ${event.big ? 'bg-success/5 border border-success/20 rounded-xl p-3 -mt-0.5' : 'pt-0.5'}`}>
                    
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-sm font-bold text-gray-900 leading-snug">
                        {event.title}
                      </h2>
                      <span className="shrink-0 text-[11px] font-semibold text-muted tabular-nums">
                        {event.time}
                      </span>
                    </div>

                    {event.highlight &&
                    <span className="mt-1.5 inline-flex items-center rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success tabular-nums">
                        {event.highlight}
                      </span>
                    }

                    {event.detail &&
                    <p className="mt-1.5 text-xs text-muted leading-relaxed">
                        {event.detail}
                      </p>
                    }

                    {event.order &&
                    <div className="mt-2 flex items-center gap-1.5">
                        {event.order.map((num, i) =>
                      <Fragment key={num}>
                            <span
                          className={`flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold tabular-nums ${i === 0 ? 'bg-success/15 text-success' : 'bg-app border border-border text-gray-700'}`}>
                          
                              {num}
                            </span>
                            {i < event.order!.length - 1 &&
                        <span
                          className="text-muted/50 text-xs"
                          aria-hidden="true">
                          
                                ›
                              </span>
                        }
                          </Fragment>
                      )}
                        <span className="ml-1 text-[10px] uppercase tracking-wider font-semibold text-muted">
                          Finish
                        </span>
                      </div>
                    }
                  </div>
                </motion.li>);

            })}
          </motion.ol>

          {/* End cap */}
          <div className="relative flex gap-4 mt-5">
            <div className="relative z-10 shrink-0 w-10 flex justify-center">
              <div className="w-2 h-2 rounded-full bg-border" />
            </div>
            <p className="text-xs text-muted/70 font-medium pt-px">
              Start of day
            </p>
          </div>
        </div>
      </main>
    </div>);

}