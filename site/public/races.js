// Saratoga — Friday 6/6/2026 — Full Card (14 races)
const RACES = [
    {
        number: 1,
        name: 'Maiden Special Weight $115K',
        distance: '7 Furlongs',
        surface: 'Dirt',
        postTime: '11:00 ET',
        purse: '$115,000',
        condition: 'MSW. Fillies/Mares 3YO+. 121 lbs; Older 126 lbs. NYSBFOA.',
        horses: [
            { number: 1, name: 'Three Shot Sheryl', ml: '15/1', jockey: 'Rodriguez J', trainer: 'Green Amelia', notes: 'Sire: Tactics (Tapit). Life 0-0-0. FTS group.' },
            { number: 2, name: "My Gun's Loaded", ml: '15/1', jockey: 'Franco M', trainer: 'Brown Chad C', notes: 'Sire: Gun Runner. KEESEP24 $650K. Previously trained by Asmussen.' },
            { number: 3, name: 'Pippa Adds', ml: '5/1', jockey: 'Ortiz I Jr', trainer: 'Pletcher Todd A', notes: 'Sire: Yaupon (Uncle Mo). Life 0-0-0.' },
            { number: 4, name: 'Cold Spell', ml: '3/5', jockey: 'Velazquez J R', trainer: 'Ward Wesley A', notes: 'Sire: Gun Runner. Life 1-0-1. $21,725. Beyer 97.' },
            { number: 5, name: 'Fusion', ml: '10/1', jockey: 'Prat F', trainer: 'Brown Chad C', notes: 'Sire: Into Mischief. Life 1-1-0. $12,800. Beyer 58.' },
            { number: 6, name: 'Nakoma', ml: '10/1', jockey: 'Zayas E J', trainer: 'Antonucci Jena M', notes: 'Sire: Vekoma. Life 1-0-1. $10,200. Beyer 71.' },
            { number: 7, name: 'Crowning Glory', ml: '4/1', jockey: 'Alvarado J', trainer: 'Mott William I', notes: 'Sire: Uncle Mo. Life 0-0-0. Dam: Close Hatches.' },
            { number: 8, name: 'My Sherrona', ml: '50/1', jockey: 'Saez L', trainer: 'Mott William I', notes: 'Sire: Not This Time. Life 8-4-1. $70,100. Beyer 78.' }
        ]
    },
    {
        number: 2,
        name: 'OC 80k/C — Allowance Optional Claiming',
        distance: '7 Furlongs',
        surface: 'Dirt',
        postTime: '11:37 ET',
        purse: '$125,000',
        condition: 'AOC $80K. 3YO+. Claiming Price $80,000. NYSBFOA.',
        horses: [
            { number: 1, name: 'Paradise Valley', ml: '12/1', jockey: 'Gonzalez S', trainer: 'Kantarmaci Ilkay', notes: 'Life 27-8-7-4. $308,400. Beyer 90. D.Fst 22-7-6-3.' },
            { number: 2, name: 'Unlimitedpotential', ml: '30/1', jockey: 'Davis D', trainer: 'Davis D', notes: 'Life 25-7-4-5. $393,917. Beyer 93. D.Fst 21-6-4-4.' },
            { number: 3, name: 'Life and Times', ml: '5/5', jockey: 'Prat F', trainer: 'Pletcher Todd A', notes: 'Life 4-2-0-2. $159,700. Beyer 104. D.Fst 4-2-0-2. Won 2 of 2 in 2026.' },
            { number: 4, name: 'Incentive Pay', ml: '5/1', jockey: 'Franco M', trainer: 'Brown Chad C', notes: 'Life 4-2-0-2. $146,610. Beyer 92. D.Fst 3-2-0-1.' },
            { number: 5, name: "I'm a Cutie Pie", ml: '30/1', jockey: 'Rodriguez J', trainer: 'Rodriguez J', notes: 'Life 32-7-6. $314,245. Beyer 77. D.Fst 23-6-4-4.' },
            { number: 6, name: 'Chatter', ml: '4/1', jockey: 'Ortiz J L', trainer: 'Ortiz J L', notes: 'Life 9-1-4-1. $128,700. Beyer 86. D.Fst 6-1-3-1.' },
            { number: 7, name: 'Contrary Thinking', ml: '8/1', jockey: 'Rodriguez J', trainer: 'Brown Chad C', notes: 'Life 9-2-0-1. $220,360. Beyer 95. D.Fst 2-0-0-1.' },
            { number: 8, name: 'Commuted', ml: '6/1', jockey: 'Santana R Jr', trainer: 'Kantarmaci Ilkay', notes: 'Life 16-7-2-0. $355,465. Beyer 99. D.Fst 0-0-0-0.' },
            { number: 9, name: 'Senior Officer', ml: '2/1', jockey: 'Ortiz I Jr', trainer: 'Cox Brad H', notes: 'Life 4-2-2-0. $133,048. Beyer 96. D.Fst 4-2-2-0. Cox/Ortiz.' }
        ]
    },
    {
        number: 3,
        name: 'OC 80k/C — Inner Turf',
        distance: '1¼ Miles',
        surface: 'Turf (Inner)',
        postTime: '12:15 ET',
        purse: '$125,000',
        condition: 'AOC $80K. 3YO+ Inner Turf. Claiming Price $80,000. NYSBFOA.',
        horses: [
            { number: 1, name: 'Ejtimaa', ml: '12/1', jockey: 'Ortiz I Jr', trainer: 'Dini Mike', notes: 'Life 17-7-0-3. $148,114. Beyer 91. Turf 10-3-0-3.' },
            { number: 2, name: 'Signator', ml: '10/1', jockey: 'Franco M', trainer: 'Franco M', notes: 'Life 22-5-1-2. $342,450. Beyer 94. D.Fst 10-1-1-1.' },
            { number: 3, name: 'Ciao Chuck', ml: '20/1', jockey: 'Saez L', trainer: 'Saez L', notes: 'Life 12-2-3-2. $192,015. Beyer 94. Turf 9-2-2-2.' },
            { number: 4, name: "Two's a Crowd", ml: '10/1', jockey: 'Lezcano J', trainer: 'Lezcano J', notes: 'Life 20-5-1-2. $199,229. Beyer 86. D.Fst 7-2-0-2. Turf 7-2-1-2.' },
            { number: 5, name: 'Bonus Move', ml: '15/1', jockey: 'Lopez P', trainer: 'Parks Investment Group', notes: 'Life 17-2-1-4. $148,790. Beyer 96. Turf 3-0-1-0.' },
            { number: 6, name: 'Tenacious Leader', ml: '5/1', jockey: 'Velazquez J R', trainer: 'Pletcher Todd A', notes: 'Life 7-2-2-0. $280,530. Beyer 87. D.Fst 3-1-0-0. Turf 4-1-2-0.' },
            { number: 7, name: 'Son of a Birch', ml: '8/1', jockey: 'Carmouche K', trainer: 'Carmouche K', notes: 'Life 22-3-3-6. $256,035. Beyer 93. Turf 21-2-3-6.' },
            { number: 8, name: 'Intellect (Fr)', ml: '6/5', jockey: 'Prat F', trainer: 'Brown Chad C', notes: 'Life 14-7-3. $355,465. Beyer 99. Turf 14-3-7-3.' },
            { number: 9, name: 'Candytown', ml: '4/1', jockey: 'Ortiz I Jr', trainer: 'Pletcher Todd A', notes: 'Life 7-2-2-0. $120,885. Beyer 88. Turf 1-0-1-0.' },
            { number: 10, name: 'Ranger Battalion', ml: '5/2', jockey: 'Ortiz I Jr', trainer: 'Rice Linda', notes: 'MTO. Life 16-4-2-2. $229,310. Beyer 85. D.Fst 9-2-1-2.' },
            { number: 11, name: 'Le Gris', ml: '3/1', jockey: 'No Rider', trainer: 'Rodriguez R', notes: 'MTO. Life 23-4-3-3. $251,590. Beyer 94. D.Fst 10-6-1-2.' },
            { number: 12, name: 'Otello', ml: '8/1', jockey: 'Franco M', trainer: 'Franco M', notes: 'MTO. Life 17-4-1-4. $337,773. Beyer 88. Turf 1-0-0-0.' },
            { number: 13, name: "Sara's Shaman", ml: '20/1', jockey: 'Gonzalez S', trainer: 'Gonzalez S', notes: 'MTO. Life 28-4-4-5. $161,219. Beyer 92. D.Fst 15-2-2-1.' },
            { number: 14, name: 'Big Blue Line', ml: '6/1', jockey: 'No Rider', trainer: 'No Rider', notes: 'MTO. Life 37-6-8-3. $470,804. Beyer 96. D.Fst 21-4-5-1.' },
            { number: 15, name: 'Castle Chaos', ml: '8/1', jockey: 'No Rider', trainer: 'Kantarmaci Ilkay', notes: 'MTO. Life 28-5-7-5. $599,952. Beyer 97. D.Fst 18-3-7-3.' }
        ]
    },
    {
        number: 4,
        name: 'OC 55k/N1X — Fillies/Mares',
        distance: '6½ Furlongs',
        surface: 'Dirt',
        postTime: '12:53 ET',
        purse: '$120,000',
        condition: 'AOC $55K. F&M 3YO+. Claiming Price $55,000. NYSBFOA.',
        horses: [
            { number: 1, name: 'P Mutter Pickle', ml: '6/1', jockey: 'Franco M', trainer: 'Franco M', notes: 'Life 9-3-1-1. $166,698. Beyer 87. D.Fst 8-3-1-1.' },
            { number: 2, name: 'Naive Melody', ml: '3/1', jockey: 'Davis D', trainer: 'Davis D', notes: 'Life 4-3-0-1. $141,500. Beyer 84. D.Fst 3-2-0-1.' },
            { number: 3, name: 'Steer Clear', ml: '7/2', jockey: 'Ortiz I Jr', trainer: 'Pletcher Todd A', notes: 'Life 3-1-1-0. $99,000. Beyer 72. D.Fst 3-1-1-0.' },
            { number: 4, name: 'Speightful Lily', ml: '6/1', jockey: 'Prat F', trainer: 'Abreu Jorge R', notes: 'Life 7-3-2-1. $181,550. Beyer 95. D.Fst 4-1-1-1.' },
            { number: 5, name: "I'm a Cutie Pie", ml: '30/1', jockey: 'Rodriguez J', trainer: 'Rodriguez J', notes: 'Duplicate name from R2? Verify.' },
            { number: 6, name: 'Chatter', ml: '4/1', jockey: 'Ortiz J L', trainer: 'Joseph S A Jr', notes: 'Life 9-1-4-1. $128,700. Beyer 86.' },
            { number: 7, name: 'Helen\'s Revenge', ml: '8/1', jockey: 'Lezcano J', trainer: 'Lezcano J', notes: 'Life 13-6-1-1. $229,830. Beyer 81. D.Fst 11-6-1-1.' },
            { number: 8, name: 'Coach Albert Lady', ml: '12/1', jockey: 'Castellano J J', trainer: 'Castellano J J', notes: 'Life 16-4-2-2. $66,470. Beyer 78. D.Fst 8-1-2-1.' },
            { number: 9, name: 'Mila Candy', ml: '30/1', jockey: 'Gonzalez S', trainer: 'Kantarmaci Ilkay', notes: 'Life 10-1-2-0. $91,683. Beyer 81. D.Fst 5-0-2-0.' },
            { number: 10, name: 'Spectacular Grey', ml: '12/1', jockey: 'Saez L', trainer: 'Pletcher Todd A', notes: 'Life 2-1-0-0. $33,500. Beyer 54. D.Fst 1-1-0-0.' }
        ]
    },
    {
        number: 5,
        name: 'Alw 120000N1X — Turf Fillies',
        distance: '1-1/16 Miles',
        surface: 'Turf (Inner)',
        postTime: '1:31 ET',
        purse: '$120,000',
        condition: 'ALW $120K/N1X. F&M 3YO+. Inner Turf. Non-Starters for $40K claiming in last 5.',
        horses: [
            { number: 1, name: 'Etawa (Ire)', ml: '6/1', jockey: 'Castellano J J', trainer: 'Dermot K Weld', notes: 'Life 8-1-1-3. $35,070. Beyer 79. Turf 6-1-0-2.' },
            { number: 2, name: 'Eponine (Ire)', ml: '5/2', jockey: 'Ortiz I Jr', trainer: 'Attard Kevin', notes: 'Life 7-2-2-1. $119,704. Beyer 80. Turf 4-2-0-1.' },
            { number: 3, name: 'Carmenista (Arg)', ml: '6/1', jockey: 'Santana R Jr', trainer: 'De Paz Horacio', notes: 'Life 8-1-3-1. $19,876. Turf 6-1-3-1.' },
            { number: 4, name: 'Sonja Henie', ml: '10/1', jockey: 'Lezcano J', trainer: 'Lezcano J', notes: 'Life 10-1-2-1. $49,471. Beyer 77. Turf 9-1-2-1.' },
            { number: 5, name: 'Starship Athena', ml: '20/1', jockey: 'Alvarado J', trainer: 'Forging Oaks Farm', notes: 'Life 3-1-0-0. $21,895. Beyer 74.' },
            { number: 6, name: "Curlin's Angel", ml: '5/1', jockey: 'Zayas E J', trainer: 'Parkland Thoroughbreds', notes: 'Life 4-1-0-1. $74,800. Beyer 82. Turf 3-1-0-1.' },
            { number: 7, name: 'Tiznow Mama', ml: '7/2', jockey: 'Geroux F', trainer: 'Summers Chad', notes: 'Life 9-3-0-0. $52,023. Beyer 79. Turf 5-2-0-0.' },
            { number: 8, name: "Scarlett's Halo", ml: '5/1', jockey: 'Prat F', trainer: 'Stonestrings Farm', notes: 'Life 6-1-0-3. $86,370. Beyer 79. Turf 4-0-0-2.' },
            { number: 9, name: 'Marketplaceofideas (GB)', ml: '5/2', jockey: 'Davis D', trainer: 'Davis D', notes: 'Life 4-1-1-1. $54,030. Beyer 76. Turf 2-1-1-1.' },
            { number: 10, name: 'Imperatrice', ml: '5/1', jockey: 'Ortiz J L', trainer: 'Don Alberto Corporation', notes: 'Life 8-1-0-1. $54,385. Beyer 69.' },
            { number: 11, name: "Y'allreadyforthis", ml: '50/1', jockey: 'Pletcher Todd A', trainer: 'Springland Farm', notes: 'MTO. Life 1-0-0-0. $54,385. Beyer 69.' },
            { number: 12, name: 'Kadena', ml: '12/1', jockey: 'No Rider', trainer: 'Stonestreet Thoroughbred Holdings', notes: 'MTO. Life 14-4-2-0. $168,668. Beyer 79. Turf 10-3-2-2.' },
            { number: 13, name: 'Brunch With Amy', ml: '4/1', jockey: 'Carmouche K', trainer: 'Rice Linda', notes: 'Life 17-2-3-4. $147,769. Beyer 76. Turf 13-2-3-4.' },
            { number: 14, name: 'Sparkling Mama', ml: '10/1', jockey: 'Franco M', trainer: 'Bobby Jones Equine', notes: 'Life 8-2-1-1. $110,500. Beyer 69.' },
            { number: 15, name: 'Soundbite', ml: '6/1', jockey: 'Carmouche K', trainer: 'Nerin Michelle', notes: 'Life 17-3-5-1. $197,204. Beyer 82. Turf 7-3-2-0.' }
        ]
    },
    {
        number: 6,
        name: 'Alw 120000N1X',
        distance: '6½ Furlongs',
        surface: 'Dirt',
        postTime: '2:09 ET',
        purse: '$120,000',
        condition: 'ALW $120K/N1X. 3YO. Non-Starters for $40K claiming.',
        horses: [
            { number: 1, name: 'Playa Del Mar', ml: '6/1', jockey: 'Rice Linda', trainer: 'Rice Linda', notes: 'Life 10-3-1-2. $156,713. Beyer 98. D.Fst 8-3-0-1.' },
            { number: 2, name: 'Village Person', ml: '20/1', jockey: 'Carmouche K', trainer: 'Carmouche K', notes: 'Life 4-3-1-0. $170,300. Beyer 82. D.Fst 4-3-1-0.' },
            { number: 3, name: 'Buttah', ml: '3/1', jockey: 'Castellano J J', trainer: 'Castellano J J', notes: 'Life 18-3-5-1. $305,048. Beyer 88. D.Fst 17-3-5-1.' },
            { number: 4, name: 'Yo Banana Boy', ml: '20/1', jockey: 'Santana R Jr', trainer: 'De Paz Horacio', notes: 'Life 19-3-5-2. $256,439. Beyer 92. D.Fst 16-2-5-2.' },
            { number: 5, name: 'Local Knowledge', ml: '5/1', jockey: 'Davis D', trainer: 'Pletcher Todd A', notes: 'Life 1-1-0-0. $62,233. Beyer 94. D.Fst 1-1-0-0.' },
            { number: 6, name: 'Caldo Candy', ml: '10/1', jockey: 'Ortiz I Jr', trainer: 'Abreu Jorge R', notes: 'Life 15-3-3-2. $241,158. Beyer 90. D.Fst 11-2-3-1.' },
            { number: 7, name: 'Brightling Bullet', ml: '15/1', jockey: 'Rodriguez J', trainer: 'Clement Christophe', notes: 'Life 2-1-0-1. $49,250. Beyer 86. D.Fst 2-1-0-1.' },
            { number: 8, name: 'Sea Strike', ml: '4/1', jockey: 'Prat F', trainer: 'Lesley Campie & River Oak Farm', notes: 'Life 1-1-0-0. $44,000. Beyer 83. D.Fst 1-1-0-0.' },
            { number: 9, name: "Mary's Lad (Ire)", ml: '8/1', jockey: 'Ortiz J L', trainer: 'Beckman D Whitworth', notes: 'Life 6-2-1-0. $88,713. Beyer 84. D.Fst 1-1-0-0.' },
            { number: 10, name: 'Imagine John', ml: '10/1', jockey: 'Zayas E J', trainer: 'Zayas E J', notes: 'Life 7-1-1-3. $108,273. Beyer 76. D.Fst 7-1-1-3.' },
            { number: 11, name: 'Brazenly', ml: '5/1', jockey: 'Lezcano J', trainer: 'Walden William', notes: 'Life 44-4-1-1. $363,302. Beyer 94. D.Fst 27-2-8-8.' },
            { number: 12, name: 'Trust Fund', ml: '30/1', jockey: 'Rodriguez J', trainer: 'Davis D', notes: 'Life 17-5-2-3. $306,297. Beyer 87. D.Fst 12-4-0-2.' },
            { number: 13, name: 'Strategicoperation', ml: '50/1', jockey: 'Rivera D A', trainer: 'Arriaga Antonio', notes: 'Life 1-1-0-0. $12,300. Beyer 69.' },
            { number: 14, name: 'Gun Range', ml: '8/1', jockey: 'Saez L', trainer: 'Ward Wesley A', notes: 'Life 1-1-0-0. $64,790. Beyer 80. D.Fst 1-1-0-0.' }
        ]
    },
    {
        number: 7,
        name: 'Just A Game — G1 (Turf)',
        distance: '1 Mile',
        surface: 'Turf (Inner)',
        postTime: '2:47 ET',
        purse: '$500,000',
        condition: 'G1. THE JUST A GAME. F&M 4YO+. Inner Turf. Grade I.',
        horses: [
            { number: 1, name: 'Classic Q', ml: '6/1', jockey: 'Velazquez J R', trainer: 'Velazquez J R', notes: 'Life 14-4-3-1. $1,074,865. Beyer 94. Turf 14-4-3-1.' },
            { number: 2, name: 'Sandtrap (Ire)', ml: '12/1', jockey: 'Franco M', trainer: 'Franco M', notes: 'Life 3-2-1-0. $86,071. Beyer 82. Turf 3-2-1-0.' },
            { number: 3, name: 'Segesta', ml: '7/5', jockey: 'Prat F', trainer: 'Prat F', notes: 'Life 12-5-4-0. $1,446,781. Beyer 98. Turf 12-5-4-0.' },
            { number: 4, name: 'Mandanaba (Fr)', ml: '9/2', jockey: 'Lecoeuvre C', trainer: 'Lecoeuvre C', notes: 'Life 6-3-0-1. $222,488. French import. Turf 6-3-0-1.' },
            { number: 5, name: 'And One More Time', ml: '5/2', jockey: 'Castellano J J', trainer: 'Castellano J J', notes: 'Life 8-4-1-0. $427,172. Beyer 92. Turf 6-3-0-0.' },
            { number: 6, name: 'Fast Market', ml: '20/1', jockey: 'Davis D', trainer: 'Davis D', notes: 'Life 12-3-3-1. $236,913. Beyer 93. D.Fst 3-0-1-1.' },
            { number: 7, name: 'Buttercream Babe', ml: '15/1', jockey: 'Saez L', trainer: 'Saez L', notes: 'Life 17-3-2-5. $508,147. Beyer 89. Turf 15-3-2-5.' },
            { number: 8, name: 'Deep Satin', ml: '12/1', jockey: 'Ortiz I Jr', trainer: 'Ortiz I Jr', notes: 'Life 11-3-4-0. $418,940. Beyer 96. Turf 11-3-4-0. Sar: 3-2-1-0.' }
        ]
    },
    {
        number: 8,
        name: 'True North — G3',
        distance: '6½ Furlongs',
        surface: 'Dirt',
        postTime: '3:25 ET',
        purse: '$400,000',
        condition: 'G3. THE TRUE NORTH. 4YO+. 124 lbs. Grade III.',
        horses: [
            { number: 1, name: 'Acoustic Ave', ml: '30/1', jockey: 'Rice Linda', trainer: 'Rice Linda', notes: 'Life 32-9-8-6. $846,700. Beyer 100. D.Fst 23-8-6-5.' },
            { number: 2, name: 'Imagination', ml: '5/2', jockey: 'Prat F', trainer: 'Prat F', notes: 'Life 16-4-6-2. $2,191,450. Beyer 105. D.Fst 15-4-6-2.' },
            { number: 3, name: 'Bentornato', ml: '1/5', jockey: 'Ortiz I Jr', trainer: "D'Angelo Jose F", notes: 'Life 12-7-3-2. $2,722,100. Beyer 110. D.Fst 11-6-3-2.' },
            { number: 4, name: 'Listenupshance', ml: '4/1', jockey: 'Jaramillo E', trainer: 'Run Fast Racing', notes: 'Life 11-3-3-2. $150,570. Beyer 93. D.Fst 7-2-3-1.' },
            { number: 5, name: 'Deterministic', ml: '5/1', jockey: 'Carmouche K', trainer: 'Carmouche K', notes: 'Life 14-4-3-1. $2,084,765. Beyer 101. Turf 9-6-2-1.' },
            { number: 6, name: "Book'em Danno", ml: '2/1', jockey: 'Lopez P', trainer: 'Lopez P', notes: 'Life 17-10-4-1. $1,915,425. Beyer 111. D.Fst 15-9-4-1.' },
            { number: 7, name: 'Be You', ml: '12/1', jockey: 'Velazquez J R', trainer: 'Pletcher Todd A', notes: 'Life 14-4-2-6. $336,940. Beyer 97. D.Fst 12-3-1-2.' },
            { number: 8, name: 'Illuminare', ml: '15/1', jockey: 'Saez L', trainer: 'Emcee Stable', notes: 'Life 8-5-0-0. $151,838. Beyer 96. D.Fst 7-5-0-0.' },
            { number: 9, name: 'Pentathlon', ml: '12/1', jockey: 'Davis D', trainer: 'Phipps Stable', notes: 'Life 18-5-1-4. $391,732. Beyer 96. D.Fst 16-4-1-4.' }
        ]
    },
    {
        number: 9,
        name: 'Jaipur — G1 (Turf Sprint)',
        distance: '5½ Furlongs',
        surface: 'Turf',
        postTime: '4:13 ET',
        purse: '$500,000',
        condition: 'G1. THE JAIPUR. 3YO+. Turf. Grade I.',
        horses: [
            { number: 1, name: 'Governor Sam', ml: '15/1', jockey: 'Lopez P', trainer: 'Stonestrings Farm', notes: 'Life 14-5-1-3. $818,848. Beyer 94. Turf 12-4-1-2.' },
            { number: 2, name: 'Bold Journey', ml: '30/1', jockey: 'Alvarado J', trainer: 'Mott William I', notes: 'Life 35-8-1-4. $4,107,077. Beyer 100. Turf 30-8-1-5.' },
            { number: 3, name: 'Litigation', ml: '7/2', jockey: 'Geroux F', trainer: 'Geroux F', notes: 'Life 12-6-1-1. $489,151. Beyer 102. Turf 9-5-1-1. Dstk 6-1-0-1.' },
            { number: 4, name: 'Works for Me', ml: '8/1', jockey: 'Prat F', trainer: 'Prat F', notes: 'Life 18-6-4-3. $477,203. Beyer 99. Turf 7-3-1-1.' },
            { number: 5, name: 'Reef Runner', ml: '4/1', jockey: 'Castellano J J', trainer: 'Pletcher Todd A', notes: 'Life 24-8-5-5. $1,902,500. Beyer 100. Turf 14-7-3-3.' },
            { number: 6, name: 'Ag Bullet', ml: '3/1', jockey: 'Velazquez J R', trainer: 'Velazquez J R', notes: 'Life 17-8-1-3. $2,977,228. Beyer 106. Turf 14-7-1-3.' },
            { number: 7, name: 'Clock Tower', ml: '10/1', jockey: 'Davis D', trainer: 'Davis D', notes: 'Life 10-3-1-3. $350,938. Beyer 90. D.Fst 2-0-1-0. Turf 7-3-0-2.' },
            { number: 8, name: 'John the Beer Man', ml: '20/1', jockey: 'Carmouche K', trainer: 'Carmouche K', notes: 'Life 5-3-1-0. $148,750. Beyer 100. Turf 3-1-0-0.' },
            { number: 9, name: 'Twenty Six Black', ml: '12/1', jockey: 'Santana R Jr', trainer: 'Cimbora Jr', notes: 'Life 18-7-5-2. $657,310. Beyer 100. D.Fst 0-0-0-0. Turf 18-7-5-2.' },
            { number: 10, name: 'My Boy Prince', ml: '50/1', jockey: 'Ortiz I Jr', trainer: 'Ortiz I Jr', notes: 'Life 24-9-6-2. $1,478,400. Beyer 101. Turf(347) 17-5-3-2.' }
        ]
    },
    {
        number: 10,
        name: 'Woody Stephens — G1',
        distance: '7 Furlongs',
        surface: 'Dirt',
        postTime: '4:52 ET',
        purse: '$500,000',
        condition: 'G1. THE WOODY STEPHENS. 3YO. 124 lbs. Grade I.',
        horses: [
            { number: 1, name: 'Gilded Bandit', ml: '3/1', jockey: 'Alvarado J', trainer: 'Mott William I', notes: 'Life 3-2-0-0. $139,954. Beyer 93. D.Fst 3-2-0-0.' },
            { number: 2, name: 'Obliteration', ml: '30/1', jockey: 'Velazquez J R', trainer: 'Asmussen Steven M', notes: 'Life 9-4-4-0. $983,550. Beyer 96. D.Fst 6-4-2-0.' },
            { number: 3, name: 'Six Speed', ml: '12/1', jockey: 'Ortiz I Jr', trainer: 'Ortiz I Jr', notes: 'Life 6-3-1-1. $402,183. Beyer 72. D.Fst 6-3-1-1.' },
            { number: 4, name: 'Listenupshance', ml: '4/1', jockey: 'Prat F', trainer: 'Prat F', notes: 'Life 11-3-3-2. $150,570. Beyer 93. D.Fst 7-2-3-1. Turf 4-1-0-1.' },
            { number: 5, name: 'Solitude Dude', ml: '5/1', jockey: 'Carmouche K', trainer: 'Carmouche K', notes: 'Life 5-4-0-1. $296,970. Beyer 97. D.Fst 5-4-0-1.' },
            { number: 6, name: 'Book\'em Danno', ml: '2/1', jockey: 'Lopez P', trainer: 'Lopez P', notes: 'Life 17-10-4-1. $1,915,425. Beyer 111. D.Fst 15-9-4-1.' },
            { number: 7, name: 'Rhetorical', ml: '8/1', jockey: 'Ortiz J L', trainer: 'Ortiz J L', notes: 'Life 9-6-0-2. $1,806,730. Beyer 107. D.Fst 0-0-0-0. Turf 6-6-0-2.' },
            { number: 8, name: 'One Stripe (SAf)', ml: '20/1', jockey: 'Lerena G', trainer: 'Lerena G', notes: 'Life 14-7-3-0. $546,038. Beyer 97. D.Fst 0-0-0-0.' },
            { number: 9, name: 'Battle of Normandy', ml: '20/1', jockey: 'Saez L', trainer: 'Saez L', notes: 'Life 17-5-5-2. $714,395. Beyer 98. Turf 16-5-5-2.' }
        ]
    },
    {
        number: 11,
        name: 'Metropolitan Handicap — G1',
        distance: '1 Mile',
        surface: 'Dirt',
        postTime: '5:32 ET',
        purse: '$1,000,000',
        condition: 'G1. THE METROPOLITAN HANDICAP. 4YO+. Grade I. Handicap.',
        horses: [
            { number: 1, name: 'Nysos', ml: '30/1', jockey: 'Prat F', trainer: 'Prat F', notes: 'Life 9-7-2-0. $4,738,500. Beyer 108. D.Fst 8-7-1-0.' },
            { number: 2, name: 'Saudi Crown', ml: '6/1', jockey: 'Ortiz I Jr', trainer: 'Ortiz I Jr', notes: 'Life 18-9-3-3. $3,686,508. Beyer 106. D.Fst 15-8-1-1. Turf 3-1-2-2.' },
            { number: 3, name: 'Rated by Merit', ml: '10/1', jockey: 'Davis D', trainer: 'Davis D', notes: 'Life 6-5-0-0. $486,750. Beyer 106. D.Fst 6-5-0-0.' },
            { number: 4, name: 'Knightsbridge', ml: '7/2', jockey: 'Alvarado J', trainer: 'Alvarado J', notes: 'Life 9-6-1-1. $513,155. Beyer 112. D.Fst 8-5-1-1.' },
            { number: 5, name: 'Journalism', ml: '5/2', jockey: 'Ortiz J L', trainer: 'Ortiz J L', notes: 'Life 12-6-3-2. $4,470,755. Beyer 108. D.Fst 10-6-1-2.' },
            { number: 6, name: 'Deterministic', ml: '4/1', jockey: 'Velazquez J R', trainer: 'Carmouche K', notes: 'Life 14-4-3-1. $2,084,765. Beyer 101. D.Fst 3-1-0-0. Turf 9-2-1-8.' },
            { number: 7, name: 'Commandment', ml: '15/1', jockey: 'Saez L', trainer: 'Cox Brad H', notes: 'Life 6-4-0-0. $1,017,339. Beyer 101. D.Fst 6-4-0-0.' }
        ]
    },
    {
        number: 12,
        name: 'Manhattan — G1 (Turf)',
        distance: '1⅜ Miles',
        surface: 'Turf',
        postTime: '6:11 ET',
        purse: '$1,000,000',
        condition: 'G1. THE RESORTS WORLD CASINO MANHATTAN. 4YO+. Turf. Grade I.',
        horses: [
            { number: 1, name: 'Tiz Dashing', ml: '30/1', jockey: 'Castellano J J', trainer: 'Castellano J J', notes: 'Life 12-3-2-3. $414,292. Beyer 96. Turf 12-3-2-3.' },
            { number: 2, name: 'Test Score', ml: '12/1', jockey: 'Franco M', trainer: 'Franco M', notes: 'Life 14-5-3-3. $2,015,025. Beyer 97. D.Fst 0-0-0-0. Turf 14-5-3-3.' },
            { number: 3, name: 'Make Me King (Fr)', ml: '3/1', jockey: 'Ortiz J L', trainer: 'Al Jehan HAI', notes: 'Life 29-7-3-6. $1,325,121. Beyer 101. Turf 25-6-2-6.' },
            { number: 4, name: 'Integration', ml: '2/1', jockey: 'Velazquez J R', trainer: 'Velazquez J R', notes: 'Life 17-6-4-3. $1,806,075. Beyer 102. Turf 17-6-4-3.' },
            { number: 5, name: 'Deterministic', ml: '5/1', jockey: 'Carmouche K', trainer: 'Carmouche K', notes: 'Life 14-4-3-1. $2,084,765. Beyer 101. Turf 9-6-2-1.' },
            { number: 6, name: 'Bright Picture (Fr)', ml: '3/1', jockey: 'Prat F', trainer: 'Prat F', notes: 'Life 12-7-2-1. $433,998. French import. Turf(315) 11-6-2-1.' },
            { number: 7, name: 'Rhetorical', ml: '8/1', jockey: 'Ortiz J L', trainer: 'Ortiz I Jr', notes: 'Life 9-6-0-2. $1,806,730. Beyer 107. Turf 6-6-0-2.' },
            { number: 8, name: 'One Stripe (SAf)', ml: '20/1', jockey: 'Lerena G', trainer: 'Lerena G', notes: 'Life 14-7-3-0. $546,038. Beyer 97.' },
            { number: 9, name: 'Battle of Normandy', ml: '20/1', jockey: 'Saez L', trainer: 'Saez L', notes: 'Life 17-5-5-2. $714,395. Beyer 98. Turf 16-5-5-2.' }
        ]
    },
    {
        number: 13,
        name: 'Belmont Stakes — G1',
        distance: '1¼ Miles',
        surface: 'Dirt',
        postTime: '7:04 ET',
        purse: '$2,000,000',
        condition: 'G1. THE BELMONT STAKES. 3YO. 1¼ Miles. Grade I.',
        horses: [
            { number: 1, name: 'Vitruvian Man', ml: '12/1', jockey: 'Fresu A', trainer: "O'Neill Doug", notes: 'Life 6-1-1-2. $142,345. Beyer 86. D.Fst 2-1-0-1. Turf 2-0-1-1.' },
            { number: 2, name: 'Powershift', ml: '12/1', jockey: 'Saez L', trainer: 'Juddmonte', notes: 'Life 3-1-1-0. $81,896. Beyer 96. Turf 2-1-1-0.' },
            { number: 3, name: 'Winnebago (Ire)', ml: '20/1', jockey: 'Marin S', trainer: 'Clement Christophe', notes: 'Life 9-2-3-1. $62,984. Beyer 84. Turf 8-1-1-1.' },
            { number: 4, name: 'First Call Bob', ml: '30/1', jockey: 'Ortiz I Jr', trainer: 'Lochlow Farm', notes: 'Life 3-1-0-0. $49,280. Beyer 85.' },
            { number: 5, name: 'Renegade', ml: '4/1', jockey: 'Prat F', trainer: 'Pletcher Todd A', notes: 'Life 6-2-3-1. $1,952,500. Beyer 98. D.Fst 6-2-3-1.' },
            { number: 6, name: 'Chief Wallabee', ml: '5/1', jockey: 'Alvarado J', trainer: 'Alvarado J', notes: 'Life 4-1-1-1. $466,600. Beyer 100. D.Fst 4-1-1-1.' },
            { number: 7, name: 'Ottinho', ml: '20/1', jockey: 'Davis D', trainer: 'Brown Chad C', notes: 'Life 4-1-1-2. $324,700. Beyer 89. D.Fst 4-1-1-2.' },
            { number: 8, name: 'Emerging Market', ml: '8/1', jockey: 'Prat F', trainer: 'Stonestrings Farm', notes: 'Life 3-2-0-0. $618,880. Beyer 97. D.Fst 3-2-0-0.' },
            { number: 9, name: 'Golden Tempo', ml: '5/2', jockey: 'Ortiz J L', trainer: 'Ortiz J L', notes: 'Life 5-3-0-2. $3,433,000. Beyer 95. D.Fst 5-3-0-2.' }
        ]
    },
    {
        number: 14,
        name: 'Alw 120000N1X — Inner Turf',
        distance: '1 Mile',
        surface: 'Turf (Inner)',
        postTime: '8:02 ET',
        purse: '$120,000',
        condition: 'ALW $120K/N1X. 3YO+. Inner Turf. Non-Starters for $40K claiming.',
        horses: [
            { number: 1, name: 'Double Act', ml: '15/1', jockey: 'Lezcano J', trainer: 'Mott William I', notes: 'Life 6-1-0-3. $82,900. Beyer 77. Turf 1-1-0-0.' },
            { number: 2, name: 'Noble Factor', ml: '20/1', jockey: 'Saez L', trainer: 'Hillcroft Farm', notes: 'Life 16-4-6-3. $107,995. Beyer 86. Turf 4-1-0-0.' },
            { number: 3, name: 'Imperatrice', ml: '8/1', jockey: 'Lopez P', trainer: 'Rivera D A', notes: 'Life 8-1-0-1. $54,385. Beyer 69.' },
            { number: 4, name: 'Kadena', ml: '12/1', jockey: 'Abreu Fernando', trainer: 'Stonestreet Thoroughbred Holdings', notes: 'Life 14-4-2-0. $168,668. Beyer 79. Turf 10-3-2-2.' },
            { number: 5, name: 'Favorable Scenario', ml: '4/1', jockey: 'Prat F', trainer: 'Brown Chad C', notes: 'Life 5-1-1-1. $85,850. Beyer 86. Turf 3-1-1-0.' },
            { number: 6, name: 'Blown Cover', ml: '15/1', jockey: 'Rodriguez J', trainer: 'Rodriguez Rudy R', notes: 'Life 20-4-4-2. $189,267. Beyer 86.' },
            { number: 7, name: 'Tiz Trouble', ml: '12/1', jockey: 'Alvarado J', trainer: 'Alvarado J', notes: 'Life 1-1-0-0. $39,000. Beyer 65.' },
            { number: 8, name: 'Elnajd', ml: '5/1', jockey: 'Ortiz I Jr', trainer: 'Shadwell Farm', notes: 'Life 3-1-2-0. $69,900. Beyer 91. D.Fst 3-1-2-0.' },
            { number: 9, name: "Griffin's Wharf", ml: '6/1', jockey: 'Velazquez J R', trainer: 'Stonestrings Farm', notes: 'Life 12-1-1-4. $152,400. Beyer 76. Turf 8-1-1-4.' },
            { number: 10, name: 'Outrunner', ml: '5/1', jockey: 'Lopez P', trainer: 'Duarte J', notes: 'Life 6-1-2-2. $147,050. Beyer 85. Turf 6-1-2-2.' },
            { number: 11, name: "Rambling' Wreck", ml: '30/1', jockey: 'Franco M', trainer: 'Bowden L', notes: 'Life 24-4-4-2. $467,645. Beyer 92.' },
            { number: 12, name: 'Sounds Like a Plan', ml: '8/1', jockey: 'Santana R Jr', trainer: 'Santana R Jr', notes: 'Life 11-1-1-0. $54,305.' },
            { number: 13, name: 'Fortune Seller', ml: '30/1', jockey: 'Ortiz I Jr', trainer: 'Rice Kevin', notes: 'Life 23-4-2-4. $142,209. Beyer 82. Turf 7-1-1-0.' }
        ]
    }
];

// --- RULES (Hard Gates) ---
// These gate whether we bet at all. Toggled on/off in Strategy tab.
const RULES = [
    { id: 'R1', name: 'Win never the favorite', description: 'Win bet is never the chalk. We find value — the fav goes in exotics only.', active: true },
    { id: 'R2', name: 'Win must be 7/2+', description: 'Win bet must be at least 7/2 odds. If our pick moves below that, pivot.', active: true },
    { id: 'R3', name: 'Trifecta minimum 4 horses', description: 'No 3-horse tri boxes (0/6 day one). Need width — 4 or 5 horse boxes.', active: true },
    { id: 'R4', name: 'Fav always in exotics', description: 'The favorite is always included in exacta and trifecta — they hit the board too often to exclude.', active: true },
    { id: 'R5', name: 'Scratches require full rebuild', description: 'Don\'t just remove — re-evaluate pace, bias, and who benefits from the scratch.', active: true },
    { id: 'R6', name: 'Tri must include exacta horses', description: 'Trifecta box ALWAYS contains the same horses as the exacta box. Never split them. (Added 5/30 — Mike\'s Mistake)', active: true },
    { id: 'R7', name: 'No short fields', description: 'Never bet a race with 5 or fewer horses. Fave is obvious, payouts tiny, no value. Skip entirely.', active: true },
    { id: 'R8', name: 'No maiden races', description: 'Never bet maiden claiming or maiden special weight. Form is too unreliable. No exceptions.', active: true },
    { id: 'R9', name: 'Sit out inside lone speed fave', description: 'Pass when fave is post 1-3 AND E style AND only speed in race. Exception: other E horses present = pace duel = proceed.', active: true },
    { id: 'R10', name: 'Exclude fave from exacta on sharp class drop', description: 'If the favorite has a sharp class drop, exclude from exacta — it may be vulnerable.', active: true },
    { id: 'R11', name: 'Double stake on vulnerable fave in long field', description: '10+ horses AND fave confirmed vulnerable = $100 win instead of $50. Long field alone not enough.', active: true }
];

// --- BOLOs (Scoring Signals) ---
// Weighted signals scored against each horse. Toggled on/off in Strategy tab.
const SIGNALS = [
    { id: 'B1', name: 'Elite jockey on bomb', weight: 3, description: 'Top-3 meet rider chooses a >12/1 horse over shorter-priced mounts. They know something.', active: true,
      detection: 'Identify the top-5 jockeys at the current meet by win count. If any top-5 jockey is riding a horse whose ML or live odds is 12/1 or higher, this signal FIRES (+3).',
      dataStatus: 'green', dataNote: 'Jockey name and ML odds are always in the DRF data.' },
    { id: 'B2', name: 'Late tote action', weight: 3, description: 'Horse drops 3+ points from ML by post time. Sharp money = information.', active: true,
      detection: 'Compare LIVE ODDS to ML odds. If live odds are 3+ points shorter than ML (e.g., ML 8/1 → Live 5/1), FIRES (+3). If no live odds entered, CANNOT evaluate.',
      dataStatus: 'yellow', dataNote: 'Requires live odds entered manually before execution.' },
    { id: 'B3', name: 'Odds drift on quality', weight: 2, description: 'Was fav or co-fav on ML, now drifted to 4/1+. Form didn\'t change, just money flow. Gift.', active: true,
      detection: 'Check if horse was ML favorite. Then check LIVE ODDS — if drifted to 4/1+, FIRES (+2). Requires live odds.',
      dataStatus: 'yellow', dataNote: 'Requires live odds entered manually.' },
    { id: 'B4', name: 'Hot barn at a price', weight: 2, description: 'Trainer win% >15% at meet running a horse at >6/1. Barn cashing regardless of perception.', active: true,
      detection: 'Read trainer pct from stats. If pct >= .15 AND horse ML is 6/1+, FIRES (+2).',
      dataStatus: 'green', dataNote: 'Trainer win% and ML are both in DRF data.' },
    { id: 'B5', name: 'Distance stretch to sire sweet spot', weight: 2, description: 'Horse getting their sire\'s optimal distance for the first time. Pedigree unlocking.', active: true,
      detection: 'Check sire name and race distance. If sire progeny peak at today\'s distance AND horse has never run this far, FIRES (+2).',
      dataStatus: 'yellow', dataNote: 'Sire is in DRF. Sire distance stats require general knowledge.' },
    { id: 'B6', name: 'Best Beyer in field', weight: 1, description: 'Highest speed figure among live starters. Proven fastest horse in here.', active: true,
      detection: 'Horse with the single highest Beyer figure among live starters gets this signal FIRED (+1).',
      dataStatus: 'green', dataNote: 'Beyer figures are in the DRF data.' },
    { id: 'B7', name: 'Blinkers change', weight: 1, description: 'Trainer making an equipment move = intent. Something different today.', active: true,
      detection: 'Look for blinker equipment change (adding or removing). Any change FIRES (+1).',
      dataStatus: 'green', dataNote: 'Blinker changes are noted in DRF program data.' },
    { id: 'B9', name: 'Earnings leader in class', weight: 1, description: 'Most $ earned among starters at this class level. Proven they belong.', active: true,
      detection: 'Horse with highest lifetime earnings among live starters gets FIRED (+1).',
      dataStatus: 'green', dataNote: 'Lifetime earnings are in DRF life record.' },
    { id: 'B10', name: 'First-timer + expensive pedigree', weight: 1, description: 'FTS with $100K+ stud fee or purchase price. Connections expect a run.', active: true,
      detection: 'If horse has 0 starts AND stud fee >= $100K OR purchase price >= $100K, FIRES (+1).',
      dataStatus: 'green', dataNote: 'FTS status, sire fee, and purchase price are in DRF data.' },
    { id: 'B11', name: 'Good jockey / good trainer on bad horse', weight: 2, description: 'Top connections on a horse the public has dismissed (8/1+). They see something.', active: true,
      detection: 'If BOTH jockey AND trainer are top-tier but horse is 8/1+, FIRES (+2).',
      dataStatus: 'green', dataNote: 'Jockey, trainer, and ML odds are in DRF data.' },
    { id: 'B12', name: 'Blinkers + Elite Jockey', weight: 2, description: 'Equipment change + top-5 meet jockey at any odds. Strong intent signal.', active: true,
      detection: 'Blinkers change AND top-5 jockey = FIRES (+2). No odds threshold.',
      dataStatus: 'green', dataNote: 'Added 5/31 — McCann (R8 winner) had this pattern at 6/1.' },
    { id: 'B13', name: 'Highest Speed Rating at a price', weight: 2, description: 'DRF-tagged "Highest Speed Rating" at 8/1+. Fastest horse the public is underlaying.', active: true,
      detection: 'If DRF tags horse "Highest Speed Rating" AND odds are 8/1+, FIRES (+2).',
      dataStatus: 'green', dataNote: 'Added 5/31 — Culture War (R10 winner) was HSR at 12/1.' },
    { id: 'B14', name: 'Beat the vulnerable favorite', weight: 3, description: 'Fave is set up to fail (inside closer in big field, speed in pace duel, closer with no pace). Back the horse whose style profits from same scenario.', active: true,
      detection: 'Tag running styles (E/E-P/P/S). Map pace (count E horses). If fave is: closer/presser inside (post 1-3) in 10+ field, OR speed (E) in pace duel (2+ E horses), OR closer (S) with no pace to run into — tag VULNERABLE. Then score the horse whose style benefits from that scenario highest. FIRES (+3).',
      dataStatus: 'green', dataNote: 'Added 6/6. Running style from PPs, post position, pace map from field.' },
    { id: 'B15', name: 'Troubled-trip angle', weight: 2, description: 'Horse with genuine trouble last out (blocked/steadied/checked/bumped) that was running well before trouble. Underbet next time, especially if today setup is cleaner.', active: true,
      detection: 'Read comment line of last race. Look for: blocked, steadied, checked, bumped, boxed, shuffled back, fanned wide. Confirm horse was in contention before trouble. If today post is better or pace suits style, FIRES (+2).',
      dataStatus: 'green', dataNote: 'Added 6/6. Comment line and position calls are in DRF PPs.' },
    { id: 'B16', name: 'Recent life', weight: 1, description: 'Ran within 30 days AND showed something: in contention, closing, trouble-excused, figure uptick. Prefer these over stale form.', active: true,
      detection: 'Last race within 30 days AND one of: within 2-3 lengths at any call, closed ground late, wide trip (4+ wide), checked/blocked in comments, Beyer >= prior start. FIRES (+1). Over 45 days = NOT recent life regardless.',
      dataStatus: 'green', dataNote: 'Added 6/6. Last race date, positions, comments, Beyers all in DRF.' },
    { id: 'B17', name: 'Exclude fave from exacta (vulnerability trigger)', weight: 0, description: 'Leave fave OUT of exacta when: (A) fave inside post 1-3 AND not E style, OR (B) fave is E in pace duel / S in lone-speed race. Conviction play — fire only when strong.', active: true,
      detection: 'Trigger A: Fave post 1-3 AND style is E/P, P, or S (not E). Trigger B: Fave is E AND 2+ other E horses, OR fave is S AND only 1 E horse (lone speed). When either fires, EXCLUDE fave from exacta and key non-faves whose style benefits. Weight 0 = does not add to score, but modifies bet construction.',
      dataStatus: 'green', dataNote: 'Added 6/6. Post position, running style, pace map from field.' }
];

// --- SKILL FILTERS (checked during Phase 2, not scored but gate/flag horses) ---
const SKILL_FILTERS = [
    { id: 'SF1', name: 'Layoff + no workouts', type: 'hard-skip', description: 'Skip any horse 90+ days off with no/sparse works. Exception: sharp workout pattern = fresh angle.', active: true },
    { id: 'SF2', name: 'Sharp class drop', type: 'yellow-flag', description: 'Drop + negatives (poor last, layoff, jockey downgrade) = avoid. Drop + positives (good works, hot trainer) = can play at lower confidence.', active: true }
];

// --- HISTORY (all prior sessions) ---
const HISTORY = [
    {
        date: '2026-05-30',
        track: 'Churchill Downs',
        races: 9,
        racesRange: 'R3-R11',
        record: '1W-8L',
        wagered: 912,
        collected: 402.95,
        pl: -509.05,
        roi: -55.8,
        startingBankroll: 1057.40,
        endingBankroll: 548.35,
        highlights: [
            'R10: WIN #6 Original Sin at ~6/1 — $321 collected on $50 bet!',
            'R5: Exacta Box 4/7/8 hit — collected $62',
            'R8: Exacta Box 2/3/7 hit — collected $19.95'
        ],
        misses: [
            'R3: #7 Brave Pilot won at 8/1 — not in any of our tickets',
            'R7: #8 Sweet Treasure (Cox/Ortiz I Jr) won — should have keyed that combo',
            'R8: Mike\'s Mistake — tri bet as 2/4/7 instead of 2/3/7. Cost us $78.64',
            'R10: Exacta missed by one — #5 Who Dey (12/1) snuck into 2nd',
            'R11: Coal Battle (our win pick) never fired; Lagynos (fav) won'
        ],
        lessons: [
            'Original Sin WIN validates the value thesis — 15/1 ML, Walsh 16%, signals flagged it',
            'NEW RULE R6: Trifecta box must ALWAYS include the exacta horses',
            'Cox/Ortiz I Jr = automatic inclusion in exotics',
            'Mike\'s Mistake cost $78.64'
        ]
    },
    {
        date: '2026-05-24',
        track: 'Churchill Downs',
        races: 6,
        racesRange: 'R5-R10',
        record: '2W-4L',
        wagered: 554,
        collected: 611.40,
        pl: 57.40,
        roi: 10.4,
        startingBankroll: 1000,
        endingBankroll: 1057.40,
        highlights: [
            'R5: Exacta #3/#10 paid $204.70 on $10 box',
            'R6: Exacta #15/#6 paid $75 on $30 — S2+S3',
            'R8: Win+Exacta Anna\'s Promise +$227.70 — S4 hot barn + drift'
        ],
        misses: ['R9: Hillandale 20/1 — Ortiz J L (S1+S5=5pts). Should have been in exotics.'],
        lessons: [
            'S2 (late tote) is highest conviction',
            'Trifecta 3-horse box too tight (0/6). Need 4+.',
            'Never ignore jockey+pedigree combo on bombs',
            'Earnings mean nothing in claimers'
        ]
    }
];

const LIFETIME_STARTING_BANKROLL = 1000;
const LIFETIME_PRIOR_PL = -451.65;
