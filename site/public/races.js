// Saratoga — Saturday 6/7/2026 — Full Card (11 races)
// Parsed from DRF PDF (36 pages). Mike Beer analysis + consensus on final pages.
const RACES = [
    {
        number: 1,
        name: 'Alw 105000N1X — Inner Turf',
        distance: '1 1/16 Miles',
        surface: 'Turf (Inner)',
        postTime: '12:05 ET',
        purse: '$105,000',
        condition: 'ALW $105K N1X. F&M 3YO+ NY State-bred. Never Won $20,000 Other Than Maiden/Claiming/Starter Or Never Won Two Races.',
        beyerPar: 76,
        horses: [
            { number: 1, name: 'Considerate City', jockey: 'Ferraro James W', trainer: 'Davis D', notes: 'B.f.3. Sire: Temple City (Dynaformer). Life 5-1-1-1. $74,098. Beyer 77. D.Fst 0-0-0-0. Sar 0-0-0-0.' },
            { number: 2, name: 'All of It', jockey: 'Franco M', trainer: 'Clement Miquel', notes: 'Dk.b/br.f.3. Sire: Mendelssohn (Scat Daddy) $15,000. Life 1-1-0-0. $41,250. Beyer 76. 2026: 1-1-0-0 $41,250. Dam: Indys Lady (Take Charge Indy).' },
            { number: 3, name: 'Tahila', jockey: 'Gonzalez S', trainer: 'Kantarmaci Ilkay', notes: 'B.f.4. Sire: Union Rags (Dixie Union) $10,000. Life 14-1-3-4. $122,067. Beyer 65. 2026: 7-1-2-2 $77,390. Turf 7-0-2-5 $44,677.' },
            { number: 4, name: 'Boomington', jockey: 'Velazquez J R', trainer: 'Eaton & Thorne Inc', notes: 'Dk.b/br.f.3. Dam: Vernissage (Mizzen Mast). Life 3-1-0-1. $65,700. Beyer 67. 2025: 3-1-0-1 $65,700. Turf 3-1-0-1.' },
            { number: 5, name: 'Neshika', jockey: 'Prat F', trainer: 'Bilinski Jerry (NY)', notes: 'Dk.b/br.f.3. Sire: Twirling Candy (Candy Ride*Arg) $75,000. Dam: Kiss a Kiss (Broken Vow). Life 5-1-2-0. $80,538. Beyer 72. 2026: 1-0-1-0. 2025: 4-1-1-0 $64,138. Turf 4-1-1-0.' },
            { number: 6, name: 'Cosmic Candy Girl', jockey: 'Elliott C', trainer: 'Ryerson James T', notes: 'B.f.3. Sire: Twirling Candy (Candy Ride*Arg) $75,000. Dam: Evening Primrose*Ire (Galileo*Ire). Life 6-1-3-2. $124,069. Beyer 69. 2026: 2-0-0-2 $19,800. Turf 5-1-2-2 $105,000.' },
            { number: 7, name: 'Bertrille', jockey: 'Rivera D A', trainer: 'Baker Charlton', notes: 'B.m.5. Blinkers OFF. Life 24-3-0-1. $113,931. Beyer 76. 2026: 4-0-0-0 $1,760. 2025: 4-0-0-0 $31,698. Turf 6-0-2-1.' }
        ],
        mto: [
            { number: 8, name: 'On a Summer Day', jockey: 'Castellano J J', trainer: 'Castellano J J', notes: 'B.f.4. Sire: Summer Front (War Front) $5,000. Life 17-1-2-4. $103,676. Beyer 68. D.Fst 2-0-0-0. Turf 15-1-2-3.' },
            { number: 9, name: 'Bryant and Cooper', jockey: 'Lezcano J', trainer: 'Lezcano J', notes: 'B.f.4. Sire: McKinzie (Street Sense) $75,000. Life 5-2-0-0. $76,658. Beyer 73. Turf 4-2-0-1.' },
            { number: 10, name: 'Tongue Twister', jockey: 'Elliott C', trainer: 'Elliott C', notes: 'Ch.h.5. Sire: Get Stormy (Stormy Atlantic) $7,500. Life 16-3-4-2. $179,245. Beyer 79. Turf 16-3-4-2.' },
            { number: 11, name: 'Quick Power Nap', jockey: 'Silvera R', trainer: 'Silvera R', notes: 'Ch.m.7. Sire: Kantharos (Lion Heart) $10,000. Life 36-3-5-6. $210,324. Beyer 77. Turf 30-2-5-4.' }
        ],
        mikeBeers: ['Boomington', 'All of It', 'Considerate City'],
        consensus: ['Boomington (10)', 'Bryant and Cooper (5)', 'All of It (3)']
    },
    {
        number: 2,
        name: 'Md Sp Wt 100k — Turf',
        distance: '1 1/4 Miles',
        surface: 'Turf (Mellon)',
        postTime: '12:38 ET',
        purse: '$100,000',
        condition: 'MSW. F&M 3YO+ NY State-bred.',
        beyerPar: 71,
        skip: true,
        skipReason: 'Maiden race — no bet per rules',
        horses: [
            { number: 1, name: 'Force of Mischief', jockey: 'Rivera D A', trainer: 'Rodriguez Rudy R', notes: 'B.f.3. Sire: Honest Mischief. Life 1-0-0-0. $1,125. Beyer 34.' },
            { number: 2, name: 'New York Special', jockey: 'Zayas E J', trainer: 'Casse Mark', notes: 'Dk.b/br.f.3. Sire: Curlin (Smart Strike) $225,000. Life 1-0-1-0. $15,000. Beyer 58.' },
            { number: 3, name: 'No Tide', jockey: 'Antonacci Philip', trainer: 'Carmouche K', notes: 'Dk.b/br.f.3. Sire: No Nay Never (Scat Daddy) $317,500. FTS.' },
            { number: 4, name: 'Coach of the Year', jockey: 'Lezcano J', trainer: 'Weaver George', notes: 'B.f.3. Sire: Maxfield (Street Sense) $200,000. Life 2-0-1-0. $16,343. Beyer 66.' },
            { number: 5, name: 'No Need to Panic', jockey: 'Davis D', trainer: 'Micicli Michael', notes: 'B.f.3. Sire: McKinzie. Life 3-0-0-0. $5,743. Beyer 55.' },
            { number: 6, name: 'Saint Margaret', jockey: 'Elliott C', trainer: 'Ryerson James T', notes: 'B.f.3. Sire: Honest Mischief. Life 4-0-0-1. $19,100. Beyer 69.' }
        ],
        alsoEligible: [
            { number: 7, name: 'Soaring Spirit', notes: 'Dk.b/br.f.3. Sire: Nyquist. Life 1-0-1-0. $16,000. Beyer 65.' },
            { number: 8, name: 'Pelican Pride', notes: 'B.f.3. Life 1-0-0-1. $9,600. Beyer 65.' },
            { number: 9, name: 'Factory Setting', notes: 'B.f.4. Sire: McKinzie. Life 4-0-1-2. $37,163. Beyer 62.' },
            { number: 10, name: 'Amazing Gracer', notes: 'Dk.b/br.f.4. Life 4-0-1-0. $35,600. Beyer 70.' },
            { number: 11, name: 'Morning Prayer', notes: 'B.f.3. Life 3-0-1-0. $20,843. Beyer 65.' },
            { number: 12, name: 'Zap That Ghost', notes: 'B.f.4. FTS.' }
        ],
        mikeBeers: ['No Tide', 'New York Special', 'Zap That Ghost'],
        consensus: ['Amazing Gracer (7)', 'No Tide (5)', 'Soaring Spirit (5)']
    },
    {
        number: 3,
        name: 'OC 80k/C — Dirt',
        distance: '7 Furlongs',
        surface: 'Dirt',
        postTime: '1:11 ET',
        purse: '$125,000',
        condition: 'AOC $80K. F&M 3YO+. UP TO $21,750 NYSBFOA. Claiming Price $80,000.',
        beyerPar: null,
        horses: [
            { number: 1, name: "Limes Don't Lie", jockey: 'Velazquez J R', trainer: 'Davis D', notes: 'B.f.5. Sire: KEESEP23 $190,000. Life 5-2-0-3. $140,500. Beyer 86. D.Fst 5-2-0-3. 2025: 2-0-1-2. Sar 3-1-0-2.' },
            { number: 2, name: 'Roman Grace', jockey: 'Prat F', trainer: 'Fletcher Gray & Carolyn Gray (Ky)', notes: 'Ch.m.5. Sire: Munnings (Speightstown) $45,000. Life 10-3-2-2. $162,400. Beyer 79. D.Fst 8-2-2-2.' },
            { number: 3, name: 'Scottish Lassie', jockey: 'Prat F', trainer: 'Abreu Jorge R', notes: 'Dk.b/br.f.4. Sire: McKinzie (Street Sense) $75,000. Life 7-2-0-3. $735,760. Beyer 99. D.Fst 6-2-0-2. TOP EARNER in field.' },
            { number: 4, name: 'Midtown Lights', jockey: 'Civaci S', trainer: 'Civaci S', notes: 'Ch.m.6. Sire: Redesdale (Speightstown) $2,500. Life 27-6-4-7. $561,016. Beyer 82. D.Fst 18-5-2-5.' },
            { number: 5, name: 'Filly Freedom', jockey: 'Franco M', trainer: 'Franco M', notes: 'B.f.4. Sire: Constitution (Tapit) $110,000. Life 6-2-3-0. $151,250. Beyer 82. D.Fst 6-2-3-0. 2026: 2-1-1-0.' },
            { number: 6, name: 'Autumn Evening', jockey: 'Ortiz I Jr', trainer: 'Rodriguez J', notes: 'B.m.5. Sire: Malibu Moon (A.P. Indy) $35,000. Life 11-4-0-2. $280,420. Beyer 84. D.Fst 9-4-0-2. Turf 1-0-0-0.' }
        ],
        mikeBeers: ["Limes Don't Lie", 'Scottish Lassie', 'Autumn Evening'],
        consensus: ["Limes Don't Lie (13)", 'Filly Freedom (5)', 'Scottish Lassie (4)']
    },
    {
        number: 4,
        name: 'Poker–G3 — Inner Turf',
        distance: '1 Mile',
        surface: 'Turf (Inner)',
        postTime: '1:46 ET',
        purse: '$300,000',
        condition: 'THE POKER. Grade III. 4YO+ Inner Turf.',
        beyerPar: 101,
        horses: [
            { number: 1, name: 'Tarantino', jockey: 'Santana R Jr', trainer: 'Santana R Jr', notes: 'B.g.8. Sire: Pioneerof the Nile (Empire Maker) $110,000. Life 36-4-9-7. $573,764. Beyer 98. D.Fst 19-2-6-5. Turf 15-2-3-2.' },
            { number: 2, name: 'Zulu Kingdom (Ire)', jockey: 'Prat F', trainer: 'Brown Chad C', notes: 'B.r.4. Sire: Ten Sovereigns*Ire (No Nay Never) $19,300. Life 9-7-0-0. $1,236,637. Beyer 98. Turf 4-3-0-0. MULTIPLE G1 WINNER. Shook clear, held sway.' },
            { number: 3, name: 'Ridari (Fr)', jockey: 'Rodriguez J', trainer: 'Delzangles M', notes: 'B.c.4. Sire: Churchill*Ire (Galileo*Ire) $25,000. Life 9-3-1-2. $244,987. Beyer 90. French import. Multiple group placed.' },
            { number: 4, name: 'Capitol Hill', jockey: 'Alvarado J', trainer: 'Mott William I', notes: 'B.c.4. Sire: Into Mischief (Harlan Holiday) $250,000. Life 10-3-0-2. $243,532. Beyer 88. Turf 9-2-0-2.' },
            { number: 5, name: 'Pass the Hat', jockey: 'Velazquez J R', trainer: 'Velazquez J R', notes: 'Ch.h.5. Sire: KEESEP22 $300,000. Life 9-3-1-1. $179,280. Beyer 94. Turf 4-2-0-1.' },
            { number: 6, name: 'Multitask', jockey: 'Castellano J J', trainer: 'Jacobson David', notes: 'Dk.b/br.h.5. Sire: Candy Ride*Arg (Ride the Rails) $60,000. Life 18-4-5-3. $402,101. Beyer 94. D.Fst 7-1-1-2. Turf 4-0-2-0.' },
            { number: 7, name: 'Salamis', jockey: 'Franco M', trainer: 'Brown Chad C', notes: 'Dk.b/br.c.4. Sire: Speightstown (Gone West) $80,000. Life 7-3-0-2. $353,363. Beyer 91. Turf 6-3-0-2. GRADE 1 WINNER.' },
            { number: 8, name: 'Castle Chaos', jockey: 'Franco M', trainer: 'Kantarmaci Ilkay', notes: 'B.g.4. Sire: Palace Malice (Curlin) $22,000. Life 28-5-7-5. $599,952. Beyer 97. D.Fst 18-3-7-3. Turf 7-0-0-2. Multiple graded placed.' },
            { number: 9, name: 'Over and Ollie', jockey: 'Velazquez J R', trainer: 'Dutrow Richard E Jr', notes: 'Gr/ro.g.6. Sire: Cairo Prince (Pioneerof the Nile) $45,000. Life 19-5-3-0. $236,177. Beyer 97. Turf 6-2-1-0. NO RIDER listed.' },
            { number: 10, name: 'Ignite the Light', jockey: 'Velazquez J R', trainer: 'Dutrow Richard E Jr', notes: 'B.g.5. Sire: Into Mischief (Harlans Holiday) $250,000. Life 17-4-4-1. $292,975. Beyer 100. D.Fst 12-2-4-1. Turf 4-2-0-0. TOP BEYER IN FIELD. NO RIDER listed.' }
        ],
        mto: [
            { number: 11, name: "Sara's Shaman", notes: 'B.h.6. Life 28-4-4-5. $161,219. Beyer 92.' },
            { number: 12, name: 'Ambition', notes: 'B.h.5. Life 19-3-1-3. $206,683. Beyer 85.' }
        ],
        mikeBeers: ['Ridari', 'Capitol Hill', 'Zulu Kingdom'],
        consensus: ['Ridari (7)', 'Ignite the Light (5)', 'Pass the Hat (5)']
    },
    {
        number: 5,
        name: 'Alw 105000N1X — Turf Sprint',
        distance: '5½ Furlongs',
        surface: 'Turf (Mellon)',
        postTime: '2:20 ET',
        purse: '$105,000',
        condition: 'ALW $105K N1X. 3YO+ NY State-bred. Never Won $20,000 Other Than Maiden/Claiming/Starter Or Never Won Two Races.',
        beyerPar: 82,
        horses: [
            { number: 1, name: 'New York Scrappy', jockey: 'Gonzalez S', trainer: 'Kantarmaci Ilkay', notes: 'Dk.b/br.g.5. Sire: Silent Crown (Curlin) $110,000. Life 17-4-2-3. $178,445. Beyer 79. D.Fst 7-2-1-0. Turf 7-2-1-0.' },
            { number: 2, name: 'Salt Spartan', jockey: 'Rivera D A', trainer: 'Davis D', notes: 'Dk.b/br.g.4. Sire: Classic Empire. Life 8-1-0-1. $47,876. Beyer 76. D.Fst 4-0-0-0. Turf 2-1-0-0. Cross-entered R7.' },
            { number: 3, name: 'Gene and Jude', jockey: 'Prat F', trainer: 'Glen Hill Farm', notes: 'Ch.g.4. Sire: Kittens Joy (El Prado*Ire) $50,000. Life 9-2-1-2. $92,002. Beyer 78. D.Fst 6-1-0-1. Turf 2-0-1-0. Cross-entered R7.' },
            { number: 4, name: 'Mo Kreesa', jockey: 'Lezcano J', trainer: 'Kresa Gerald and Susan', notes: 'B.g.4. Sire: Mo Town (Uncle Mo) $7,500. Life 15-2-1-3. $107,353. Beyer 80. D.Fst 3-1-0-0. Turf 7-0-0-2. Cross-entered R7.' },
            { number: 5, name: 'B Provocateur', jockey: 'Silvera R', trainer: 'Rodriguez Rudy R', notes: 'B.r.3. Life 6-1-1-0. $60,650. Beyer 70. D.Fst 4-1-1-0. Turf 2-0-0-0.' },
            { number: 6, name: 'Rhyton', jockey: 'Franco M', trainer: 'Clement Miquel', notes: 'Ch.c.4. Life 1-1-0-0. $26,400. Beyer 76. Won debut. Only 1 start.' },
            { number: 7, name: 'Moonlight Drive', jockey: 'Davis D', trainer: 'Davis D', notes: 'Dk.b/br.c.3. Sire: Speightstown (Gone West) $80,000. Life 1-1-0-0. $41,250. Beyer 67. Won debut.' },
            { number: 8, name: 'On the Ledge', jockey: 'Prat F', trainer: 'Brown R C', notes: 'Ch.c.4. Sire: Majestic City (City Zip) $2,500. Life 12-3-1-3. $125,883. Beyer 83. D.Fst 8-2-1-2. Turf 2-0-1-0. TOP BEYER IN FIELD.' },
            { number: 9, name: 'Diliello', jockey: 'Santana R Jr', trainer: 'Santana R Jr', notes: 'B.r.3. Sire: Gift Box (Twirling Candy) $5,000. Life 6-1-3-1. $96,800. Beyer 65. D.Fst 6-1-3-1.' },
            { number: 10, name: 'Joker On Fire', jockey: 'Lezcano J', trainer: 'Levine Bruce', notes: 'Dk.b/br.g.4. Sire: Practical Joke (Into Mischief) $35,000. Life 10-1-2-0. $79,690. Beyer 82. D.Fst 7-0-0-0. Turf 2-0-1-0.' }
        ],
        alsoEligible: [
            { number: 11, name: 'Cristobal', notes: 'Ch.c.3. Life 4-1-0-1. $67,050. Beyer 64.' },
            { number: 12, name: 'Punto Forte', notes: 'Dk.b/br.c.3. Sire: Nyquist. Life 4-1-0-0. $37,400. Beyer 70.' },
            { number: 13, name: 'Stormy Birthday', notes: 'Ch.c.3. Life 4-1-0-1. $104,602. Beyer 75.' },
            { number: 14, name: 'Burning Bridges', notes: 'Ch.c.4. Life 4-1-2-0. $71,095. Beyer 73.' },
            { number: 15, name: 'Epitaph', notes: 'B.c.4. Life 17-2-2-2. $120,320. Beyer 74.' },
            { number: 16, name: 'My Life Story', notes: 'B.h.5. Life 22-3-3-3. $114,755. Beyer 77. Turf 17-2-1-3.' }
        ],
        mikeBeers: ['Moonlight Drive', "Truman's Commander", 'On the Ledge'],
        consensus: ['Diliello (5)', 'Moonlight Drive (5)', 'New York Scrappy (5)']
    },
    {
        number: 6,
        name: 'Md Sp Wt 115k — Dirt',
        distance: '5½ Furlongs',
        surface: 'Dirt',
        postTime: '2:54 ET',
        purse: '$115,000',
        condition: 'MSW. 2YO. 123 lbs. NYSBFOA.',
        beyerPar: 80,
        skip: true,
        skipReason: 'Maiden race — no bet per rules',
        mikeBeers: ['Booked (BEST BET)', 'Just a Holiday', 'Motawaali'],
        consensus: ['Booked (9)', 'Call Attendant (7)', "Georgie's Warrior (5)"],
        horses: [
            { number: 1, name: 'Blackjack', jockey: 'Zayas E J', trainer: 'Delgado Jorge', notes: 'B.c.2. Sire: American Freedom. FTS.' },
            { number: 2, name: "Jack's Golden Goal", jockey: 'Rivera D A', trainer: 'Matt Jackson & Family', notes: 'Ch.c.2. Sire: Omaha Beach (War Front) $75,000. FTS.' },
            { number: 3, name: 'Just a Holiday', jockey: 'Davis D', trainer: 'Ward Wesley A', notes: 'B.c.2. Sire: Justify (Scat Daddy) $200,000. FTS. 27-for-169 with 2YO FTS.' },
            { number: 4, name: 'Cut Down the Nets', jockey: 'Rodriguez J', trainer: 'Green Amelia J', notes: 'B.c.2. Sire: OBSMAR25 $110,000. FTS.' },
            { number: 5, name: 'Pinpoint', jockey: 'Pletcher Todd A', trainer: 'Pletcher Todd A', notes: 'B.c.2. Sire: KEESEP25 $300,000. FTS.' },
            { number: 6, name: 'Beach Sandals', jockey: 'Velazquez J R', trainer: 'Casse Mark', notes: 'Dk.b/br.c.2. Sire: Omaha Beach. Life 1-0-1-0. $24,000. Beyer 55.' },
            { number: 7, name: 'Uncleshane', jockey: 'Elliott C', trainer: 'Giddings Melanie', notes: 'Dk.b/br.c.2. Sire: Dancing Candy. Life 1-0-1-0. $17,000. Beyer 54.' },
            { number: 8, name: 'Motawaali', jockey: 'Alvarado J', trainer: 'Mott William I', notes: 'Dk.b/br.c.2. Sire: Life Is Good (Into Mischief) $250,000. FTS.' },
            { number: 9, name: 'Booked', jockey: 'Ortiz I Jr', trainer: 'Asmussen Steven M', notes: 'Dk.b/br.c.2. Sire: Yaupon (Uncle Mo) $60,000. Life 1-0-1-0. $17,520. Beyer 58. Asmussen at Saratoga.' },
            { number: 10, name: 'Call Attendant', jockey: 'Morley Thomas', trainer: 'Southern Comfort Farm', notes: 'Dk.b/br.c.2. Sire: Speakers Corner (Street Sense) $250,000. FTS.' },
            { number: 11, name: "Georgie's Warrior", jockey: 'Bridgmohan S X', trainer: 'Giddings Melanie', notes: 'Ch.c.2. Sire: Nashville (Speightstown) $12,500. FTS. Dam: Jojo Warrior (Pioneerof the Nile).' },
            { number: 12, name: 'Johnny Hockey', jockey: 'Silvera R', trainer: 'Arriaga Antonio', notes: 'Ch.c.2. Sire: Omaha Beach. FTS.' }
        ]
    },
    {
        number: 7,
        name: 'OC45k/SAL — Inner Turf',
        distance: '1 1/16 Miles',
        surface: 'Turf (Inner)',
        postTime: '3:29 ET',
        purse: '$78,000',
        condition: 'STARTER OPTIONAL CLAIMING. 3YO+ Started For Claiming $55K Or Less. Claiming Price $45,000 State Bred.',
        beyerPar: null,
        horses: [
            { number: 1, name: 'Complex Agenda', jockey: 'Santana R Jr', trainer: 'Morley Thomas', notes: 'B.g.4. Sire: Quality Road (Elusive Quality) $160,000. Life 7-1-1-0. $46,900. Beyer 80. Turf 5-1-0-0.' },
            { number: 2, name: 'Salt Spartan', jockey: 'Gomez J A', trainer: 'Davis D', notes: 'Dk.b/br.g.4. Sire: Classic Empire. Life 8-1-0-1. $47,876. Beyer 76. Turf 3-1-0-1. Cross-entered R5.' },
            { number: 3, name: 'Gene and Jude', jockey: 'Prat F', trainer: 'Glen Hill Farm', notes: 'Ch.g.4. Sire: Kittens Joy. Life 9-2-1-2. $92,002. Beyer 78. Cross-entered R5.' },
            { number: 4, name: 'Mo Kreesa', jockey: 'Lezcano J', trainer: 'Kresa Gerald and Susan', notes: 'B.g.4. Life 15-2-1-3. $107,353. Beyer 80. Turf 7-0-0-2. Cross-entered R5.' },
            { number: 5, name: 'Three Percent', jockey: 'Carmouche K', trainer: 'Rodriguez J', notes: 'Ch.g.5. Life 8-1-3-1. $50,665. Beyer 75. D.Fst 4-0-2-1. Turf 2-0-0-0.' },
            { number: 6, name: 'Bridle a Butterfly', jockey: 'Carmouche K', trainer: 'Glen Hill Farm (Ky)', notes: 'B.f.4. Life 12-2-3-1. $314,068. Beyer 83. Turf 5-1-0-1. Step slow,no kick. Previously trained by Stall Albert M Jr.' },
            { number: 7, name: 'Final Denile', jockey: 'Carrasco V R', trainer: 'De Paz Horacio B', notes: 'Dk.b/br.g.5. Sire: Mendelssohn (Scat Daddy) $15,000. Life 18-3-3-2. $153,621. Beyer 82. D.Fst 7-1-0-1. Turf 7-0-2-1.' },
            { number: 8, name: 'Swiss Army Knife', jockey: 'Franco M', trainer: 'Calument Farm (Ky)', notes: 'B.c.3. Sire: Practical Joke (Into Mischief) $75,000. Life 6-1-0-0. $31,512. Beyer 75. D.Fst 5-1-0-0. Turf 1-0-0-0.' }
        ],
        alsoEligible: [
            { number: 9, name: 'American Grant', notes: 'B.g.6. Life 24-2-0-3. $108,036. Beyer 86. Turf 17-1-0-3.' },
            { number: 10, name: 'Geostoblame', notes: 'B.g.3. Life 5-1-0-1. $27,550. Beyer 69.' },
            { number: 11, name: 'Rabaja', notes: 'Dk.b/br.g.5. Life 10-2-0-0. $97,887. Beyer 85. Turf 6-2-0-0.' },
            { number: 12, name: 'The Paddock Pastor', notes: 'B.g.5. Life 19-3-2-4. $174,800. Beyer 81. Turf 15-3-1-2.' }
        ],
        mikeBeers: ['Salt Spartan', 'The Paddock Pastor', 'Gene and Jude'],
        consensus: ['Salt Spartan (7)', 'Rabaja (5)', 'Willintoriskitall (5)']
    },
    {
        number: 8,
        name: 'Soaring Softly–G3 — Turf Sprint',
        distance: '5½ Furlongs',
        surface: 'Turf (Mellon)',
        postTime: '4:04 ET',
        purse: '$200,000',
        condition: 'THE SOARING SOFTLY. Grade III. Fillies 3YO. 124 lbs. Non-winners of Sweepstakes allowed 2 lbs.',
        beyerPar: null,
        horses: [
            { number: 1, name: 'Hen Party', jockey: 'Prat F', trainer: 'Harry Ebanit', notes: 'B.f.3. Sire: Into Mischief (Harlans Holiday) $250,000. Dam: Fair Maiden (Street Boss). Life 5-2-1-1. $145,849. Beyer 86. Turf 4-2-1-0. Synth 3-2-1-0. 2026: 3-1-1-1 $124,079.' },
            { number: 2, name: 'Flowerhouse (Ire)', jockey: 'Egan D', trainer: 'Clover Charlie', notes: 'B.f.3. Sire: Sturman*GB (Dutch Art*GB) $11,000. Life 9-1-2-1. $61,859. Beyer —. French form. Multiple placed in group company. Turf specialist.' },
            { number: 3, name: 'Cadenza', jockey: 'Franco M', trainer: 'Brown Chad C', notes: 'Ch.f.3. Sire: Charlatan (Speightstown) $25,000. Dam: Madalins Odyssey (Kittens Joy). Life 6-3-1-1. $236,487. Beyer 84. Turf 2-2-0-0. Big player. Kept on gamely to give Cadenza a scare.' },
            { number: 4, name: 'Slay the Day', jockey: 'Velazquez J R', trainer: 'Lynch Brian A', notes: 'B.f.3. Sire: Into Mischief (Harlans Holiday) $250,000. Life 6-3-2-0. $395,238. Beyer 92. D.Fst 3-1-1-0. Turf 3-2-1-0. TOP BEYER/EARNER. Won G3 last.' },
            { number: 5, name: 'Kingsolver', jockey: 'Prat F', trainer: 'Brown Chad C', notes: 'B.f.3. Life 5-2-1-0. $209,853. Beyer 71. Turf 2-1-0-0. Willintoriskitall winning connection.' },
            { number: 6, name: "Should've", jockey: 'Davis D', trainer: 'Ward Wesley A', notes: 'B.f.3. Sire: Not This Time (Giants Causeway) $250,000. Life 4-1-0-1. $128,125. Beyer 77. Turf 4-1-0-1.' },
            { number: 7, name: 'Alpenglow', jockey: 'Lezcano J', trainer: "D'Angelo Jose F", notes: 'B.f.3. Sire: OBSAPR25 $350,000. Sire: Charlatan (Speightstown). Life 4-1-0-0. $36,080. Beyer 77. Turf 2-0-0-0.' }
        ],
        mto: [
            { number: 8, name: 'Niche', notes: 'B.f.3. Sire: Yaupon (Uncle Mo) $60,000. Life 6-2-0-0. $85,380. Beyer 79. D.Fst 6-2-0-0. Entered For Main Track Only.' }
        ],
        mikeBeers: ['Hen Party', 'Niche', 'Slay the Day'],
        consensus: ['Hen Party (8)', 'Slay the Day (8)', 'Alpenglow (5)']
    },
    {
        number: 9,
        name: 'OC 20k/SAL16k — Dirt',
        distance: '6½ Furlongs',
        surface: 'Dirt',
        postTime: '4:39 ET',
        purse: '$52,000',
        condition: 'STARTER OPTIONAL CLAIMING. 4YO+ Started For Claiming $16,000 Or Less Since June 7, 2025 Or Claiming Price $20,000. NY Bred Claiming Price $25,000. 123 lbs.',
        beyerPar: 89,
        horses: [
            { number: 1, name: 'Gatsby', jockey: 'Kantarmaci Ilkay', trainer: 'Kantarmaci Ilkay', notes: 'B.g.8. Sire: Brethren (Distorted Humor) $4,000. Life 46-8-9-7. $518,040. Beyer 103. D.Fst 40-7-7-6. Sar 2-0-1-0. TOP BEYER IN FIELD.' },
            { number: 2, name: 'Quiet Wisdom', jockey: 'Zayas E J', trainer: 'Potts Wayne', notes: 'Gr/ro.g.5. Sire: Into Mischief (Harlans Holiday) $250,000. Life 25-3-5-6. $206,075. Beyer 83. D.Fst 19-3-3-4.' },
            { number: 3, name: 'Grayving', jockey: 'Jones Edwards E', trainer: 'Twin Creeks Farm (NY)', notes: 'Gr/ro.g.5. Life 42-10-8-6. $367,186. Beyer 84. D.Fst 30-7-6-6. Sar 3-0-0-1.' },
            { number: 4, name: 'Timaeus', jockey: 'Franco M', trainer: 'Gonzalez S', notes: 'Dk.b/br.g.6. Life 21-6-1-1. $197,100. Beyer 86. D.Fst 17-6-2-2.' },
            { number: 5, name: 'Mr Skylight', jockey: 'Franco M', trainer: 'Falcone R N Jr', notes: 'Ch.h.5. Life 15-4-1-3. $241,164. Beyer 88. D.Fst 11-3-1-1. Turf 1-0-0-0.' },
            { number: 6, name: 'Secured Landing', jockey: 'Carmouche K', trainer: 'Carmouche K', notes: 'Ch.g.6. Life 18-8-4-2. $215,570. Beyer 83. D.Fst 12-5-2-2.' },
            { number: 7, name: 'Private Desire', jockey: 'Zayas E J', trainer: 'Morley Thomas', notes: 'B.g.5. Sire: Constitution (Tapit) $110,000. Life 14-1-2-0. $140,275. Beyer 94. D.Fst 12-3-1-2. Beyer 94 — high figure.' },
            { number: 8, name: 'Principo', jockey: 'Castellano J J', trainer: 'Politi James (Ky)', notes: 'B.g.5. Life 30-4-5-5. $176,448. Beyer 87. D.Fst 23-3-3-3.' },
            { number: 9, name: 'Forgiving Spirit', jockey: 'Silvera R', trainer: 'Rodriguez Rudy R', notes: 'Ch.g.5. Sire: Shaman Ghost (Ghostzapper) $33,500. Life 39-7-6-4. $355,761. Beyer 90. D.Fst 12-2-4-0. Turf 20-3-2-4. Switching to dirt.' }
        ],
        mikeBeers: ['Forgiving Spirit', 'Gatsby', 'Private Desire'],
        consensus: ['Forgiving Spirit (7)', 'Private Desire (6)', 'Mr Skylight (5)']
    },
    {
        number: 10,
        name: 'Alw 105000N1X — Dirt',
        distance: '7 Furlongs',
        surface: 'Dirt',
        postTime: '5:14 ET',
        purse: '$105,000',
        condition: 'ALW $105K N1X. 3YO+ NY State-bred. Never Won $20,000 Other Than Maiden/Claiming/Starter Or Never Won Two Races.',
        beyerPar: 80,
        horses: [
            { number: 1, name: 'Toscano', jockey: 'Prat F', trainer: 'Maker Michael J', notes: 'B.g.5. Sire: Vino Rosso (Curlin) $7,500. Dam: Landed (Medaglia dOro). Life 10-2-3-1. $101,720. Beyer 81. D.Fst 6-1-3-0. Sar 3-0-1-0.' },
            { number: 2, name: 'Fireballin', jockey: 'Franco M', trainer: 'Maker Michael J', notes: 'B.g.4. Sire: KEESEP22 $300,000. Life 8-1-3-1. $101,240. Beyer 79. D.Fst 7-1-2-6. Turf 1-0-0-0.' },
            { number: 3, name: 'Hey Toby', jockey: 'Carmouche K', trainer: 'Weaver George', notes: 'Dk.b/br.g.5. Life 12-2-4-3. $100,945. Beyer 88. D.Fst 18-5-2-3.' },
            { number: 4, name: "You're Lookin Good", jockey: 'Gutierrez R', trainer: 'Green Amelia J', notes: 'B.g.5. Sire: Mendelssohn (Scat Daddy) $15,000. Life 7-1-0-1. $36,455. Beyer 62. D.Fst 2-1-0-1.' },
            { number: 5, name: 'Anyway', jockey: 'Rodriguez J', trainer: 'Rodriguez J', notes: 'Dk.b/br.c.3. Sire: Candy Ride*Arg (Ride the Rails) $80,000. Life 6-2-1-1. $92,500. Beyer 86. D.Fst 4-2-1-0.' },
            { number: 6, name: 'Bold Love', jockey: 'Santana R Jr', trainer: 'Summers Chad', notes: 'B.c.3. Sire: SARAUG24 $88,000. Life 6-1-1-1. $61,440. Beyer 82. D.Fst 2-0-1-1.' },
            { number: 7, name: "Leo's Reward", jockey: 'Rodriguez J', trainer: 'Donk David', notes: 'B.g.5. Sire: Leofric (Candy Ride*Arg) $5,000. Life 16-1-3-1. $144,128. Beyer 83. D.Fst 12-0-3-1. Turf 2-0-0-0.' },
            { number: 8, name: 'Mo for the King', jockey: 'Velazquez J R', trainer: 'Landry Harry L', notes: 'B.g.5. Sire: King for a Day (Uncle Mo) $5,000. Life 12-2-4-1. $124,771. Beyer 91. D.Fst 10-1-4-1. Sar 2-0-0-0.' },
            { number: 9, name: 'Sunday Boy', jockey: 'Elliott C', trainer: 'Elliott C', notes: 'B.g.4. Sire: Central Banker (Speightstown) $5,000. Life 12-1-8-2. $353,440. Beyer 74. D.Fst 5-1-2-1. Turf 6-0-6-1.' }
        ],
        alsoEligible: [
            { number: 10, name: 'Mozambique', notes: 'Br.g.4. Life 12-1-4-1. $100,255. Beyer 81.' },
            { number: 11, name: "Solomini's World", notes: 'Ch.c.4. Life 6-1-0-1. $29,240. Beyer 62.' },
            { number: 12, name: 'Long Pour', notes: 'Dk.b/br.c.4. Life 10-1-2-2. $110,009. Beyer 84.' },
            { number: 13, name: 'Oath of Omerta', notes: 'Ch.g.4. Life 17-2-1-3. $108,600. Beyer 73.' }
        ],
        mikeBeers: ['Bold Love', 'Long Pour', 'Fireballin'],
        consensus: ['Bold Love (5)', 'Sunday Boy (5)', 'Toscano (5)']
    },
    {
        number: 11,
        name: 'Md Sp Wt 100k — Dirt',
        distance: '6½ Furlongs',
        surface: 'Dirt',
        postTime: '5:49 ET',
        purse: '$100,000',
        condition: 'MSW. 3YO+ NY State-bred. 121 lbs; Older 126 lbs.',
        beyerPar: 78,
        skip: true,
        skipReason: 'Maiden race — no bet per rules',
        horses: [
            { number: 1, name: 'Ice House', jockey: 'Weaver George', trainer: 'Weaver George', notes: 'Gr/ro.c.3. Blinkers ON. Life 2-0-0-1. $13,800. Beyer 62.' },
            { number: 2, name: 'Bold Scholar', jockey: 'Giddings Melanie', trainer: 'Brown Road Racing', notes: 'Dk.b/br.c.2. FTS. Sire: Central Banker.' },
            { number: 3, name: 'Roadie', jockey: 'Carmouche K', trainer: 'Pletcher Todd A', notes: 'Ch.g.3. Sire: Distorted Humor $30,000. Life 1-0-0-0. $740. Beyer 26.' },
            { number: 4, name: 'King Farro', jockey: 'Santana R Jr', trainer: 'Falcone R N Jr', notes: 'B.g.3. Sire: King for a Day. Life 2-0-0-2. $19,200. Beyer 76.' },
            { number: 5, name: 'Hurricane Kaz', jockey: 'Rodriguez J', trainer: 'Kaz Hill Farm', notes: 'Dk.b/br.c.3. Life 8-0-2-2. $65,827. Beyer 73. D.Fst 8-0-2-2.' },
            { number: 6, name: 'Frankie Coffeecake', jockey: 'Gonzalez S', trainer: 'DeMasi Kathleen A', notes: 'Gr/ro.g.3. Life 3-0-2-0. $26,800. Beyer 68.' },
            { number: 7, name: 'Aristide Maillol', jockey: 'Lezcano J', trainer: 'Goichman Larry', notes: 'B.c.3. Life 3-0-0-0. $1,446. Beyer 62.' },
            { number: 8, name: 'Sultan Hassan', jockey: 'Santana R Jr', trainer: 'De Paz Horacio', notes: 'Dk.b/br.g.3. FTS. Sire: Cairo Prince.' },
            { number: 9, name: 'Bossofeverything', jockey: 'Zayas E J', trainer: 'Bond Harold James', notes: 'Dk.b/br.g.3. Sire: Lookin At Lucky (Smart Strike) $10,000. Life 1-0-0-1. $9,600. Beyer 63.' },
            { number: 10, name: 'Thundertaker', jockey: 'Elliott C', trainer: 'McGuire Kevin L', notes: 'Ch.g.3. Sire: Son of Thunder (Uncle Mo) $2,500. Life 1-0-1-0. $5,200. Beyer 52.' },
            { number: 11, name: 'Irish Goodbye', jockey: 'Franco M', trainer: 'Christoph Clement', notes: 'Gr/ro.c.3. Life 2-0-2-0. $30,000. Beyer 75.' },
            { number: 12, name: 'Imperial Anthem', jockey: 'Englehart Chris', trainer: 'Roll the Dice Thoroughbreds LLC', notes: 'Ch.c.3. Sire: Palace Malice (Curlin). FTS.' },
            { number: 13, name: 'Runcot', jockey: 'Silvera R', trainer: 'Bond Harold James', notes: 'Dk.b/br.c.3. Sire: Mendelssohn. FTS.' }
        ],
        mikeBeers: ['Aristide Maillol', 'Frankie Coffeecake', 'Irish Goodbye'],
        consensus: ['Aristide Maillol (5)', 'Ice House (5)', 'King Farro (5)']
    }
];

// === MIKE BEER ANALYSIS NOTES ===
// Best Bet: Booked (Race 6) — "figures tough in the second start back"
//
// R1: Boomington overmatched Grade 2 last, has forward. All of It sat nice trip on debut. Considerate City improving.
// R2: No Tide — sire No Nay Never (12% FTS, 13% turf routers). New York Special had speed to contest pace.
// R3: Limes Don't Lie — 2-time G1 winner returned, chased sharp. Scottish Lassie determined finisher. Autumn Evening returned from layoff.
// R4: Ridari scored group wins in France, finishing fast into late traffic. Zulu Kingdom wired Maker's Mile. Salamis can do it with or without lead.
// R5: Moonlight Drive impressive debut downstate. On the Ledge closed strongly. Joker On Fire earned 82 Beyer turf debut.
// R6: Booked — best Beyer was measured closing, tough in second start for Asmussen. Just a Holiday is half-sister to Grade 1 winner.
// R7: Salt Spartan pressed pace before layoff. The Paddock Pastor closed strongly into easy win. Gene and Jude closer needs right trip.
// R8: Slay the Day — 2 for 3 switching to turf, Beyers of 92 and 91. Hen Party had gate trouble turf debut. Should've used early speed.
// R9: Forgiving Spirit handles turf, switching back to dirt surface recently isn't negative. Gatsby has tons of back class. Private Desire earned 94 Beyer.
// R10: Bold Love handled surface switch, breaking maiden with good finish. Long Pour — earned tougher in dirt. Fireballin competitive.
// R11: Aristide Maillol pedigree to handle turf, improved behind wire-to-wire winner. Frankie Coffeecake wasn't aggressively ridden early. Irish Goodbye improved.
//
// === CONSENSUS SELECTIONS (5 pts 1st, 2 pts 2nd, 1 pt 3rd) ===
// R1:  Boomington (10), Bryant and Cooper (5), All of It (3)
// R2:  Amazing Gracer (7), No Tide (5), Soaring Spirit (5)
// R3:  Limes Don't Lie (13), Filly Freedom (5), Scottish Lassie (4)
// R4:  Ridari (7), Ignite the Light (5), Pass the Hat (5)
// R5:  Diliello (5), Moonlight Drive (5), New York Scrappy (5)
// R6:  Booked (9), Call Attendant (7), Georgie's Warrior (5)
// R7:  Salt Spartan (7), Rabaja (5), Willintoriskitall (5)
// R8:  Hen Party (8), Slay the Day (8), Alpenglow (5)
// R9:  Forgiving Spirit (7), Private Desire (6), Mr Skylight (5)
// R10: Bold Love (5), Sunday Boy (5), Toscano (5)
// R11: Aristide Maillol (5), Ice House (5), King Farro (5)
