// Churchill Downs — Saturday 5/31/2026 — Full Card (10 races)
const RACES = [
    {
        number: 1,
        name: 'Claiming $20,000',
        distance: '6 Furlongs',
        surface: 'Dirt',
        postTime: '12:45 ET',
        purse: '$50,000',
        condition: 'CLM $20K. 3YO+ Fillies/Mares. 120 lbs; Older 125.',
        horses: [
            { number: 1, name: 'Moroder', ml: '4/1', jockey: 'Ortiz Jr Irad', trainer: 'Hamm Timothy E', notes: 'B.g(12,12,24) 4 (May) KEESEP23 $15,000. Sire: Runhappy (Super Saver) $7,500. Dam: Do the Dance. Life 8-2-1-1 $44,760. 2026: 4-2-0-1 $37,860. D.Fst 8-2-1-1. Beyer par 74. ORTIZ JR (141 38 26 19.27). Trainer Hamm Timothy (6 1 1 0 .17). Last 3 races: 14May26-6Tp fst 6f won by 4x; 23Apr26-6Tp fst 5½f won $4.47; 7Feb26-2Tam fst 6f 3rd. Back-to-back wins at Turfway Park. Gold;Black Inverted Chevron $20K claim.' },
            { number: 2, name: 'Aerate', ml: '9/5', jockey: 'Asmussen Keith J', trainer: 'Asmussen Steven M', notes: 'B.f. 4 (Jan). Sire: Candy Ride*Arg (Ride the Rails) $60,000. Dam: Duru (Broken Vow). Life 7-2-0-0 $37,860. 2026: 4-2-0-0 $37,860. D.Fst 12-1-2-1 $55,166. Beyer 72. ASMUSSEN K J (22 5 3 2 .23). Trainer Asmussen Steven M (63 11 8 7 .17). Royal Blue/White Halves. $20K claim. Last: 8May26-3CD fst 7f won; 19Apr26-10P fst 6f 2nd; 18Mar26-6OP fst 6f won. Co-favorite.' },
            { number: 3, name: 'Homie', ml: '12/1', jockey: 'Torres Jaime A', trainer: 'Cano Williams', notes: 'Dk.b/br g(01.26,23) 4 (May). Sire: Mendelssohn (Scat Daddy) $15,000. Dam: Fishing*GB (Dansili*GB). Life 7-2-0-0 $37,118. 2026: 5-2-0-0 $7,756. D.Fst: 0-0-0-0. Beyer 70. TORRES J A (53 4 5 8 .08). Trainer Cano Williams (2 0 0 1 .00). Teal/White Belt. $20K claim. Last: 14May26-6Tp fst 6½f 1st; 10Apr26-8Tp fst 6f 2nd. 2 wins at Turfway, first time CD dirt. Previously all synthetic/turf racing.' },
            { number: 4, name: 'Shadow Coast', ml: '5/2', jockey: 'Saez Luis', trainer: 'Crichton Rohan G', notes: 'B.c. 4 (Apr) OBSOPN24 $145,000. Sire: West Coast (Flatter) $5,000. Dam: Barryspepper (Quality Road). Life 14-2-0-2 $108,724. 2026: 3-1-0-1 $26,806. D.Fst 9-1-0-2 $37,660. Beyer 75. SAEZ L (101 17 12 13 .17). Trainer Crichton Rohan G (15 2 1 2 .13). Pink/Pink Cap. $20K claim. FAV. HIGHEST SPEED RATING. Last: 22Apr26-5Kee fst 6f 4th; 25Mar26-8CD fst 6f won; 28Jan26-5Tam fst 6f 4th. $145K purchase, class dropper from allowance level.' },
            { number: 5, name: 'Gallo De Fuego', ml: '9/2', jockey: 'Saez Gabriel', trainer: 'Roberts Joe B', notes: 'Dk.b/br g(01.27,23) 5 (Apr). Sire: Into Mischief (Harlan\'s Holiday) $250,000. Dam: Special Vintage (Domaino). Life 14-2-1-3 $88,501. 2026: 7-1-1-0 $29,926. D.Fst 6-0-1-3 $25,375. Beyer 72. SAEZ G (49 1 5 4 .02). Trainer Roberts Joe B (6 0 0 2 .00). Red/Black Diamonds. $20K claim. Last: 28Apr26-2Kee fst 7f 7th; 28Feb26-5FG fst 6f 4th; 15Feb26-3FG fst 5½f 6th. Into Mischief sire but 0-for-6 on dirt fast. Dropping in class.' },
            { number: 6, name: 'League Of Legends', ml: '6/1', jockey: 'Arrieta Francisco', trainer: 'Morse Randy L', notes: 'B.g(08,08,20) 8 (May) KEESEP18 $12,000. Sire: Atreides (Medaglia d\'Oro) $2,800. Dam: Fine Insticts (Tale of the Cat). Life 14-1-4-3 $50,015. 2026: 4-0-0-2 $10,415. D.Fst 8-1-0-2 $31,620. Beyer 64. ARRIETA F (29 3 4 1 .10). Trainer Morse Randy L (9 0 1 3 .00). Blue/White Hoops. $20K claim. Last: 18May26-5CD slys 6f 5th; 10Apr26-7Kee fst 6f 3rd; 18Mar26-5OP fst 6f 6th. 8-year-old, minor form. Trainer 0% wins at meet.' }
        ]
    },
    {
        number: 2,
        name: 'Claiming $30,000',
        distance: '1 Mile',
        surface: 'Dirt',
        postTime: '1:15 ET',
        purse: '$62,000',
        condition: 'CLM $30K. Fillies/Mares 3YO+. 120 lbs; Older 126.',
        horses: [
            { number: 1, name: "Quinn's Promise", ml: '9/5', jockey: 'Lanerie Corey J', trainer: 'Romans Dale L', notes: 'Life 11-1-0-4, $92K. Beyer 67. FAV. Prometheuslfld.' },
            { number: 2, name: 'Fresh Out', ml: '15/1', jockey: 'Esquivel Emmanuel', trainer: 'McPeek Kenneth G', notes: 'Life 6-1-0-0, $37K. Violence. McPeek 16%.' },
            { number: 3, name: "Don't Be Salty", ml: '3/1', jockey: 'Ortiz Jr Irad', trainer: 'Sharp Joe', notes: 'Life 5-1-1-1, $19K. Audible (Into Mischief). ORTIZ JR. Sharp 16%. FIRST TIME BLINKERS. Highest Speed Rating.' },
            { number: 4, name: 'Fermi', ml: '9/2', jockey: 'Carrasco Victor R', trainer: 'Sweezey J K', notes: 'Life 8-2-1-1, $39K. Modernist (Uncle Mo).' },
            { number: 5, name: 'Galatina', ml: '6/1', jockey: 'Asmussen Keith J', trainer: 'Asmussen Steven M', notes: 'Life 13-1-2-3, $73K. Vino Rosso. Asmussen 16%.' },
            { number: 6, name: 'Belle Ofthe Dance', ml: '4/1', jockey: 'Ortiz Jose L', trainer: 'De Paz Horacio', notes: 'Life 7-1-0-1, $54K. Honor A.P.' },
            { number: 7, name: 'State Charmer', ml: '10/1', jockey: 'Saez Luis', trainer: 'Hamm Timothy E', notes: 'Life 4-1-1-0, $32K. Silver State (Hard Spun).' }
        ]
    },
    {
        number: 3,
        name: 'Claiming $16,000',
        distance: '1 Mile',
        surface: 'Dirt',
        postTime: '1:44 ET',
        purse: '$36,000',
        condition: 'CLM $16K. 3YO+. 120 lbs; Older 126.',
        horses: [
            { number: 1, name: 'Hardtoblame', ml: '8/1', jockey: 'Rosado Johan', trainer: 'Asmussen Steven M', notes: 'Life 8-1-0-1, $42K. Hard Spun. Asmussen 16%. Trainer Uplift. Beyer 73.' },
            { number: 2, name: 'Fast Joker', ml: '7/2', jockey: 'Morales Edgar', trainer: 'Hartman Chris A', notes: 'Life 14-1-0-3, $50K. Practical Joke. Highest Speed Rating. Beyer 73.' },
            { number: 3, name: "Stefan's Title", ml: '4/1', jockey: 'Ortiz Jose L', trainer: 'Pitts Helen', notes: 'Life 5-1-0-0, $14K. Cloud Computing (Maclean\'s Music).' },
            { number: 4, name: 'Whiskey Shot', ml: '9/2', jockey: 'Asmussen Keith J', trainer: 'Asmussen Steven M', notes: 'Life 5-1-0-1, $81K. Gun Runner. Asmussen 16%. Trainer Uplift. Beyer 75.' },
            { number: 5, name: 'Romantic Lead', ml: '6/1', jockey: 'Gaffalione Tyler', trainer: 'Foster Eric N', notes: 'Life 19-1-4-2, $52K. Union Rags.' },
            { number: 6, name: 'Il Cavallino', ml: '9/5', jockey: 'Saez Gabriel', trainer: 'Sweezey J K', notes: 'Life 6-0-0-2, $57K. OBSMAR24 $46K. FAV. Best In Class. Beyer 73.' },
            { number: 7, name: 'Bagg O Time', ml: '15/1', jockey: 'Graham James', trainer: 'Vance Thomas D', notes: 'Life 10-1-0-2, $35K. Vino Rosso. Beyer 56.' }
        ]
    },
    {
        number: 4,
        name: 'Claiming $16,000',
        distance: '6 Furlongs',
        surface: 'Dirt',
        postTime: '2:14 ET',
        purse: '$55,000',
        condition: 'CLM $16K. 4YO+. 123 lbs.',
        horses: [
            { number: 1, name: 'Illini', ml: '20/1', jockey: 'Cedillo Abel', trainer: 'Vanden Berg Brittany A', notes: 'Life 19-5-3-1, $79K. Heart to Heart. Beyer 80.' },
            { number: 2, name: 'Lord Majesty', ml: '5/2', jockey: 'Mendoza Amir', trainer: 'David Carlos A', notes: 'Life 15-4-3-2, $92K. Lord Nelson. FAV. Trainer Uplift. Beyer 75.' },
            { number: 3, name: 'Forty Love', ml: '6/1', jockey: 'Saez Luis', trainer: 'Hernandez Jr Sandino R', notes: 'SCRATCHED.' },
            { number: 4, name: 'Upturned Brim', ml: '9/2', jockey: 'Concepcion Axel', trainer: 'Cano Williams', notes: 'Life 23-3-8-5, $98K. Competitive Edge. Highest Speed Rating. Beyer 80.' },
            { number: 5, name: 'Sawyer Fox', ml: '10/1', jockey: 'Elliott Jane', trainer: 'Catalano Wayne M', notes: 'Life 12-4-2-0, $109K.' },
            { number: 6, name: 'Raising Kane', ml: '12/1', jockey: 'Asmussen Keith J', trainer: 'Asmussen Steven M', notes: 'Life 19-3-1-2, $89K. Girvin. Asmussen 16%. Trainer Uplift.' },
            { number: 7, name: 'Bebedouro', ml: '3/1', jockey: 'Gaffalione Tyler', trainer: 'Sharp Joe', notes: 'Life 22-3-1-3, $137K. Fell Swoop. Sharp 16%. Trainer Uplift. Beyer 79.' },
            { number: 8, name: 'Top Gun Tommy', ml: '4/1', jockey: 'Torres Cristian A', trainer: 'Shorter Aaron', notes: 'Life 47-13-14-7, $495K. Mineshaft. Beyer 94. Massive earnings.' }
        ],
        scratches: [3]
    },
    {
        number: 5,
        name: 'Starter Allowance',
        distance: '1 Mile',
        surface: 'Dirt',
        postTime: '2:46 ET',
        purse: '$62,000',
        condition: 'Alw 30000s. Starter Allowance. 3YO+. 126 lbs.',
        horses: [
            { number: 1, name: 'Baytown Bruiser', ml: '9/5', jockey: 'Geroux Florent', trainer: 'King Barry L', notes: 'Life 23-2-5-2, $144K. Preservationist. FAV. Highest Speed Rating. Beyer NA.' },
            { number: 2, name: "You Ain't Poppn", ml: '6/1', jockey: 'Torres Jaime A', trainer: 'Bahena Ismael', notes: 'Life 6-2-1-0, $34K.' },
            { number: 3, name: 'Admiral Hall', ml: '7/2', jockey: 'Gaffalione Tyler', trainer: 'Jacobson David', notes: 'Life 3-1-0-1, $34K. War Front. Hot Trainer (Jacobson). Beyer 76.' },
            { number: 4, name: 'Guardian', ml: '5/2', jockey: 'Pauly Summer', trainer: 'Jacobson David', notes: 'SCRATCHED. Constitution. Trainer Uplift + Hot Trainer.' },
            { number: 5, name: 'Truly Legit', ml: '4/1', jockey: 'Concepcion Axel', trainer: 'Tomlinson Michael A', notes: 'Life 14-2-1-3, $63K. Authentic (Into Mischief). Beyer 71.' },
            { number: 6, name: 'Versed', ml: '12/1', jockey: 'Morales Edgar', trainer: 'Brownfield III Claude L', notes: 'Life 10-2-2-3, $81K. Volatile (Violence). Beyer 56.' }
        ],
        scratches: [4]
    },
    {
        number: 6,
        name: 'Maiden Claiming $12,500',
        distance: '1 Mile',
        surface: 'Dirt',
        postTime: '3:19 ET',
        purse: '$35,000',
        condition: 'MCL $12,500. Maidens 3YO+. 118 lbs; Older 125.',
        horses: [
            { number: 1, name: 'Carson', ml: '7/2', jockey: 'Beschizza Adam', trainer: 'Catalano Wayne M', notes: 'Life 2-0-1-0, $9K. Hard Spun. FAV. Beyer 60.' },
            { number: 2, name: 'Punkin Boy', ml: '12/1', jockey: 'Villarreal Oscar', trainer: 'McCall III William P', notes: 'Life 6-0-0-2, $8K. Brody\'s Cause.' },
            { number: 3, name: 'Mountain Grandeur', ml: '10/1', jockey: 'Bejarano Rafael', trainer: 'Foley Gregory D', notes: 'Life 4-0-0-1, $9K.' },
            { number: 4, name: 'Tlahuicole', ml: '30/1', jockey: 'Aragon Rolando', trainer: 'Werre Danny', notes: 'SCRATCHED.' },
            { number: 5, name: 'Paired', ml: '8/1', jockey: 'Machado Luan', trainer: 'Jacobson David', notes: 'Life 3-0-0-0, $3K. Hot Trainer. Highest Speed Rating.' },
            { number: 6, name: 'Big Nelson', ml: '20/1', jockey: 'Sheehy Danny', trainer: 'King Barry L', notes: 'Life 6-0-0-0, $4K. Lord Nelson.' },
            { number: 7, name: 'Turn And Run', ml: '15/1', jockey: 'Morales Edgar', trainer: 'Sweezey J K', notes: 'SCRATCHED.' },
            { number: 8, name: 'Spring St. Dreamer', ml: '20/1', jockey: 'Cedillo Abel', trainer: 'Shirer Matt A', notes: 'Life 3-0-0-0, $3K. Always Dreaming.' },
            { number: 9, name: 'Vino Dominus', ml: '9/2', jockey: 'Torres Cristian A', trainer: 'Drury Jr Thomas', notes: 'Life 7-2-0-1, $27K. Special Vintage (Domaino). Beyer 70.' },
            { number: 10, name: 'Tims', ml: '6/1', jockey: 'Esquivel Emmanuel', trainer: 'Santamaria Carlos', notes: 'Life 9-3-0-3, $26K. Beyer 52.' },
            { number: 11, name: 'Whatever', ml: '5/1', jockey: 'Carrasco Victor R', trainer: 'McGee Paul J', notes: 'Life 8-0-0-4, $19K. Lookin at Lucky. Beyer 43.' },
            { number: 12, name: 'Chasing Gray', ml: '10/1', jockey: 'Torres Jaime A', trainer: 'Forster Grant T', notes: 'Life 4-0-0-0, $2K. Knicks Go.' }
        ],
        scratches: [4, 7]
    },
    {
        number: 7,
        name: 'Allowance $141K — Turf',
        distance: '5½ Furlongs',
        surface: 'Turf',
        postTime: '3:51 ET',
        purse: '$141,000',
        condition: 'Alw 141000C. Fillies 3YO. Turf. 122 lbs.',
        horses: [
            { number: 1, name: 'Beach Heist', ml: '2/1', jockey: 'Prat Flavien', trainer: 'Walden William', notes: 'Life 2-1-0-1, $82K. Omaha Beach. Prat + Walden 30%. FAV. Beyer NA.' },
            { number: 2, name: 'Omaha Bay', ml: '12/1', jockey: 'Hernandez Jr Brian J', trainer: 'Wilkes Ian R', notes: 'Life 3-1-0-0, $56K. Star Actress.' },
            { number: 3, name: "Should've", ml: '6/1', jockey: 'Mendoza Amir', trainer: 'Ward Wesley A', notes: 'SCRATCHED.' },
            { number: 4, name: 'Snappy Comeback', ml: '15/1', jockey: 'Saez Luis', trainer: "D'Angelo Jose F", notes: 'Life 5-2-0-0, $136K. Vapour. Beyer 24.' },
            { number: 5, name: 'Snow Face Princess', ml: '12/1', jockey: 'Geroux Florent', trainer: 'Asmussen Steven M', notes: 'Life 6-2-1-0, $35K. Asmussen 16%.' },
            { number: 6, name: 'Sapphire Beach (Ire)', ml: '5/2', jockey: 'Ortiz Jose L', trainer: 'Arnold II George R', notes: 'Life 6-2-2-0, $189K. No Nay Never. Beyer NA.' },
            { number: 7, name: 'Mony Mony', ml: '4/1', jockey: 'Ortiz Jr Irad', trainer: 'Sharp Joe', notes: 'Life 7-3-0-1, $197K. Munnings. ORTIZ JR + Sharp 16%. Highest Speed Rating.' },
            { number: 8, name: 'Secret Hideaway (Ire)', ml: '8/1', jockey: 'Gaffalione Tyler', trainer: 'Walsh Brendan P', notes: 'Life 6-1-1-0, $58K. Starspangledbanner. Walsh 16%. FIRST TIME BLINKERS. Beyer 71.' }
        ],
        scratches: [3]
    },
    {
        number: 8,
        name: 'Maiden Special Weight $120K',
        distance: '6½ Furlongs',
        surface: 'Dirt',
        postTime: '4:23 ET',
        purse: '$120,000',
        condition: 'MSW. 3YO+. 118 lbs; Older 124. Horses That Have Not Started For Less Than $50,000.',
        horses: [
            { number: 1, name: 'Max Is Him', ml: '15/1', jockey: 'Garcia Martin', trainer: 'Romans Dale L', notes: 'Life 0-0-0-0. FTS. McKinzie. Beyer 85.' },
            { number: 2, name: 'McCann', ml: '6/1', jockey: 'Ortiz Jr Irad', trainer: 'Weaver George', notes: 'Life 1-0-0-0, $1.4K. Mitole. ORTIZ JR. FIRST TIME BLINKERS. Beyer 54.' },
            { number: 3, name: 'Impractical', ml: '15/1', jockey: 'Concepcion Axel', trainer: 'Beckman D Whitworth', notes: 'Life 4-0-0-1, $16K. Practical Joke (Into Mischief). Beyer 73.' },
            { number: 4, name: 'Hawkeye State', ml: '6/1', jockey: 'Bejarano Rafael', trainer: 'Ashford Tristan', notes: 'Life 2-0-0-0, $33K. Rock Your World. Beyer 70.' },
            { number: 5, name: 'Native Brew', ml: '10/1', jockey: 'Hernandez Jr Brian J', trainer: 'Asmussen Steven M', notes: 'SCRATCHED. Asmussen.' },
            { number: 6, name: 'Bigtimetimmyjim', ml: '20/1', jockey: 'Lanerie Corey J', trainer: 'Briley Lonnie', notes: 'Life 0-0-0-0. FTS. Beyer NA.' },
            { number: 7, name: 'Civic Charm', ml: '8/1', jockey: 'Alvarado Junior', trainer: 'Mott William I', notes: 'Life 1-0-0-0, $3.4K. Constitution (Tapit). Mott! Beyer 62.' },
            { number: 8, name: 'Delancey Street', ml: '12/1', jockey: 'Gaffalione Tyler', trainer: 'Casse Norm W', notes: 'Life 0-0-0-0. FTS. Street Sense. Casse.' },
            { number: 9, name: 'Gadget Play', ml: '8/1', jockey: 'Saez Luis', trainer: 'Stall Jr Albert M', notes: 'Life 0-0-0-0. FTS. Into Mischief (Harlan\'s Holiday). $250K.' },
            { number: 10, name: 'Study', ml: '5/1', jockey: 'Curtis Ben', trainer: 'McCarthy Michael W', notes: 'Life 0-0-0-0. FTS. Independence Hall (Constitution). McCarthy! Hot Trainer.' },
            { number: 11, name: 'Campobasso', ml: '4/1', jockey: 'Prat Flavien', trainer: 'Baffert Bob', notes: 'Life 0-0-0-0. FTS. Street Sense. Prat + Baffert. FAV. Best In Class.' },
            { number: 12, name: 'Interrogator', ml: '15/1', jockey: 'Asmussen Keith J', trainer: 'Asmussen Steven M', notes: 'Life 1-0-0-0, $1.4K. Omaha Beach. Asmussen 16%. Beyer 25.' }
        ],
        scratches: [5]
    },
    {
        number: 9,
        name: 'Allowance OC $125K/N1X',
        distance: '1 Mile',
        surface: 'Dirt',
        postTime: '4:56 ET',
        purse: '$127,000',
        condition: 'AOC $125K/N1X. 3YO. 122 lbs. KTDF.',
        horses: [
            { number: 1, name: 'Lighter', ml: '15/1', jockey: 'Gaffalione Tyler', trainer: 'Brisset Rodolphe', notes: 'Life 1-1-0-0, $19K. Constitution (Tapit). Beyer NA.' },
            { number: 2, name: 'Gun Range', ml: '9/2', jockey: 'Alvarado Junior', trainer: 'Ward Wesley A', notes: 'SCRATCHED.' },
            { number: 3, name: 'Western Warrior', ml: '20/1', jockey: 'Ortiz Jose L', trainer: 'Casse Mark E', notes: 'Life 8-3-0-0, $112K. Essential Quality (Tapit). Beyer 77.' },
            { number: 4, name: 'Rebel Instinct', ml: '3/1', jockey: 'Ortiz Jr Irad', trainer: 'Cox Brad H', notes: 'Life 2-1-1-0, $64K. Into Mischief (Harlan\'s Holiday). FAV. ORTIZ JR + Cox. Hot Trainer. Beyer 85.' },
            { number: 5, name: 'Envision', ml: '12/1', jockey: 'Prat Flavien', trainer: 'Walden William', notes: 'SCRATCHED. Prat + Walden.' },
            { number: 6, name: 'Memory', ml: '4/1', jockey: 'Garcia Martin', trainer: 'Baffert Bob', notes: 'Life 3-1-0-0, $44K. Uncle Mo (Indian Charlie). Baffert. Highest Speed Rating. Beyer 93.' },
            { number: 7, name: 'Blue Forty Two', ml: '20/1', jockey: 'Gutierrez Mario', trainer: 'Sells Rachel', notes: 'Life 9-1-3-3, $108K. Audible (Into Mischief). Beyer 83.' },
            { number: 8, name: 'Noble Affair', ml: '10/1', jockey: 'Geroux Florent', trainer: 'Asmussen Steven M', notes: 'Life 4-1-1-2, $77K. Vekoma. Asmussen 16%. Beyer 77.' },
            { number: 9, name: 'Biloba', ml: '20/1', jockey: 'Bejarano Rafael', trainer: 'Moquett Ron', notes: 'Life 4-1-3-0, $131K. Essential Quality (Tapit). Beyer 80.' },
            { number: 10, name: 'I Did I Did', ml: '15/1', jockey: 'Hernandez Jr Brian J', trainer: 'Maker Michael J', notes: 'Life 8-1-2-0, $140K. Curlin (Smart Strike). Maker! Hot Trainer. Beyer 75.' },
            { number: 11, name: 'Prize Pick', ml: '6/1', jockey: 'Saez Luis', trainer: 'Lynch Brian A', notes: 'Life 6-1-1-1, $107K. Tiz the Law (Constitution). Beyer 80.' },
            { number: 12, name: 'J J Grey', ml: '12/1', jockey: 'Esquivel Emmanuel', trainer: 'McPeek Kenneth G', notes: 'SCRATCHED. McPeek.' },
            { number: 13, name: 'Volendam', ml: 'AE', jockey: 'Curtis B', trainer: 'Maker Michael J', notes: 'SCRATCHED. Also Eligible.' }
        ],
        scratches: [2, 5, 12, 13]
    },
    {
        number: 10,
        name: 'Maiden Claiming $50,000 — Turf',
        distance: '1 Mile',
        surface: 'Turf',
        postTime: '5:27 ET',
        purse: '$67,000',
        condition: 'MCL $50K. Maidens 3YO+. 118 lbs; Older 125. Turf.',
        horses: [
            { number: 1, name: 'Timestream', ml: '8/1', jockey: 'Ortiz Jr Irad', trainer: 'Asmussen Steven M', notes: 'Life 3-0-0-0, $3.5K. Not This Time. ORTIZ JR + Asmussen 16%. Beyer 80.' },
            { number: 2, name: 'Both Sides Of Bad', ml: '4/1', jockey: 'Torres Jaime A', trainer: 'Pitts Helen', notes: 'Life 8-0-2-1, $22K. Medaglia d\'Oro. Beyer 55.' },
            { number: 3, name: 'Thespian', ml: '15/1', jockey: 'Antongeorgi III William', trainer: 'Harty Eoin G', notes: 'Life 3-0-0-0, $1.3K. Acting Class (Distorted Humor). FIRST TIME BLINKERS. Beyer 53.' },
            { number: 4, name: 'Culture War', ml: '12/1', jockey: 'Alvarado Junior', trainer: 'Medina Robert', notes: 'Life 9-0-1-1, $55K. War of Will (War Front). Highest Speed Rating. Beyer 69.' },
            { number: 5, name: 'Champagne Liberal', ml: '15/1', jockey: 'Cedillo Abel', trainer: 'Von Hemel Donnie K', notes: 'Life 0-0-0-0. FTS.' },
            { number: 6, name: 'Barracks', ml: '10/1', jockey: 'Esquivel Emmanuel', trainer: 'McPeek Kenneth G', notes: 'Life 0-0-0-0. FTS. McPeek 16%.' },
            { number: 7, name: 'Power Of Will', ml: '20/1', jockey: 'Cannon Declan', trainer: 'Esler Nicholas', notes: 'Life 0-0-0-0. FTS.' },
            { number: 8, name: 'West Of East Texas', ml: '20/1', jockey: 'Concepcion Axel', trainer: 'Danner Kelsey', notes: 'Life 0-0-0-0. FTS.' },
            { number: 9, name: 'Fly Guy Mick', ml: '6/1', jockey: 'Saez Luis', trainer: 'Bogle Fergus', notes: 'Life 0-0-0-0. FTS. Saez.' },
            { number: 10, name: 'Hill Country', ml: '20/1', jockey: 'Graham James', trainer: 'Desormeaux J K', notes: 'Life 0-0-0-0. FTS.' },
            { number: 11, name: 'Happy Prince', ml: '5/2', jockey: 'Gaffalione Tyler', trainer: 'Casse Mark E', notes: 'Life 4-0-0-1-2, $49K. FAV. Casse. Best In Class. Beyer 80.' },
            { number: 12, name: 'Mckinsense', ml: '10/1', jockey: 'Bejarano Rafael', trainer: 'Morse Randy L', notes: 'SCRATCHED.' }
        ],
        scratches: [12]
    }
];

// RULES
const RULES = [
    { id: 'R1', name: 'Win never the favorite', description: 'Win bet is never the chalk. We find value — the fav goes in exotics only.', active: true },
    { id: 'R2', name: 'Win must be 7/2+', description: 'Win bet must be at least 7/2 odds. If our pick moves below that, pivot.', active: true },
    { id: 'R3', name: 'Trifecta minimum 4 horses', description: 'No 3-horse tri boxes (0/6 day one). Need width — 4 or 5 horse boxes.', active: true },
    { id: 'R4', name: 'Fav always in exotics', description: 'The favorite is always included in exacta and trifecta — they hit the board too often to exclude.', active: true },
    { id: 'R5', name: 'Scratches require full rebuild', description: 'Don\'t just remove — re-evaluate pace, bias, and who benefits from the scratch.', active: true },
    { id: 'R6', name: 'Tri must include exacta horses', description: 'Trifecta box ALWAYS contains the same horses as the exacta box. Never split them. (Added 5/30 — Mike\'s Mistake)', active: true }
];

// BOLOs — Be On the Lookout. Weighted scoring signals.
const SIGNALS = [
    { id: 'B1', name: 'Elite jockey on bomb', weight: 3, description: 'Top-3 meet rider chooses a >12/1 horse over shorter-priced mounts. They know something.', active: true,
      detection: 'Identify the top-5 jockeys at the current meet by win count from their stats (format: "JOCKEY NAME (starts wins 2nds 3rds pct)"). Top riders include Ortiz Jr, Prat, Saez L, Gaffalione, Ortiz JL. If any top-5 jockey is riding a horse whose ML or live odds is 12/1 or higher, this signal FIRES (+3).',
      dataStatus: 'green', dataNote: 'Jockey name and ML odds are always in the DRF data.' },
    { id: 'B2', name: 'Late tote action', weight: 3, description: 'Horse drops 3+ points from ML by post time. Sharp money = information.', active: true,
      detection: 'Compare the LIVE ODDS field (if entered) to the ML odds. If live odds are 3+ points shorter than ML (e.g., ML 8/1 → Live 5/1), this signal FIRES (+3). If no live odds entered, this signal CANNOT be evaluated.',
      dataStatus: 'yellow', dataNote: 'Requires live odds entered manually before execution. Not available from DRF PDF alone.' },
    { id: 'B3', name: 'Odds drift on quality', weight: 2, description: 'Was fav or co-fav on ML, now drifted to 4/1+. Form didn\'t change, just money flow. Gift.', active: true,
      detection: 'Check if horse was ML favorite or co-favorite (lowest/tied-lowest ML in field). Then check LIVE ODDS — if live odds have drifted to 4/1 or higher, this signal FIRES (+2). Requires live odds to evaluate drift.',
      dataStatus: 'yellow', dataNote: 'Requires live odds entered manually. ML is in DRF but drift requires live comparison.' },
    { id: 'B4', name: 'Hot barn at a price', weight: 2, description: 'Trainer win% >15% at meet running a horse at >6/1. Barn cashing regardless of perception.', active: true,
      detection: 'In the trainer stats (format: "Trainer Name (starts wins 2nds 3rds pct)"), read the pct value (last number, e.g. .17 = 17%). If pct >= .15 AND the horse ML or live odds is 6/1 or higher, this signal FIRES (+2).',
      dataStatus: 'green', dataNote: 'Trainer win% and ML are both in DRF data.' },
    { id: 'B5', name: 'Distance stretch to sire sweet spot', weight: 2, description: 'Horse getting their sire\'s optimal distance for the first time. Pedigree unlocking.', active: true,
      detection: 'Check the sire name and the race distance. Research the sire\'s progeny stats — if this sire\'s winners peak at today\'s distance AND the horse has never run this distance before (check past race distances in running lines), this signal FIRES (+2). Common examples: Candy Ride progeny excel at 9f+, Into Mischief at 7f-8.5f.',
      dataStatus: 'yellow', dataNote: 'Sire is in DRF data. Sire distance stats require general knowledge. Horse distance history is in running lines but may be truncated.' },
    { id: 'B6', name: 'Best Beyer in field', weight: 1, description: 'Highest speed figure among live starters. Proven fastest horse in here.', active: true,
      detection: 'Find the Beyer Speed Figure for each horse (listed as "Beyer XX" in notes or extracted from past performance lines). The horse with the single highest Beyer figure among live starters gets this signal FIRED (+1).',
      dataStatus: 'green', dataNote: 'Beyer figures are in the DRF data for each horse.' },
    { id: 'B7', name: 'Blinkers change', weight: 1, description: 'Trainer making an equipment move = intent. Something different today.', active: true,
      detection: 'Look for "FIRST TIME BLINKERS", "Blinkers ON", or "Blinkers OFF" notation in the horse data. Any blinker equipment change (adding or removing) triggers this signal FIRES (+1).',
      dataStatus: 'green', dataNote: 'Blinker changes are noted in DRF program data.' },
    { id: 'B8', name: 'Track bias alignment', weight: 1, description: 'Horse\'s running style (speed/stalker/closer) matches today\'s track pattern.', active: true,
      detection: 'Determine each horse\'s running style from their past race descriptions (pressed/led = speed, stalked/tracked = stalker, rallied/closed = closer). Then check if today\'s early race results favor a particular style. If the horse\'s style matches the emerging bias, FIRE (+1). If no races run yet today, cannot evaluate.',
      dataStatus: 'red', dataNote: 'Requires observation of today\'s early race results. Not available from DRF PDF or before races begin. Toggle off for early races.' },
    { id: 'B9', name: 'Earnings leader in class', weight: 1, description: 'Most $ earned among starters at this class level. Proven they belong.', active: true,
      detection: 'Parse lifetime earnings from each horse (format: "$XX,XXX" or "$XXK" in life stats). The horse with the highest lifetime earnings among live starters gets this signal FIRED (+1). Note: In claimers, high earnings can mean inconsistency — use with context.',
      dataStatus: 'green', dataNote: 'Lifetime earnings are in DRF life record for every horse.' },
    { id: 'B10', name: 'First-timer + expensive pedigree', weight: 1, description: 'FTS with $100K+ stud fee or purchase price. Connections paid up and expect a run.', active: true,
      detection: 'Check if horse has 0 lifetime starts (Life: 0-0-0-0 or "FTS"). If yes, check sire stud fee (listed after sire name, e.g. "$250,000") or auction purchase price (e.g. "KEESEP23 $150,000"). If stud fee >= $100K OR purchase price >= $100K, this signal FIRES (+1).',
      dataStatus: 'green', dataNote: 'FTS status, sire fee, and purchase price are all in DRF data.' },
    { id: 'B11', name: 'Good jockey / good trainer on bad horse', weight: 2, description: 'Top connections on a horse the public has dismissed. They see something the market doesn\'t.', active: true,
      detection: 'Identify top-tier jockeys (Ortiz Jr, Prat, Saez L, Gaffalione, Ortiz JL) and top-tier trainers (Cox, Baffert, Asmussen, Walsh, Walden, McPeek, Pletcher, Maker, McCarthy, Sharp, Jacobson). If BOTH jockey AND trainer are top-tier but the horse is 8/1 or higher, the public is dismissing a horse that elite connections chose to run. FIRES (+2).',
      dataStatus: 'green', dataNote: 'Jockey name, trainer name, and ML odds are all in DRF data.' },
    { id: 'B12', name: 'Blinkers + Elite Jockey', weight: 2, description: 'Equipment change (blinkers on/off) combined with a top-5 meet jockey at any odds. Trainer making a move AND elite rider chose this mount = strong intent signal.', active: true,
      detection: 'Check for blinkers change (FIRST TIME BLINKERS, Blinkers ON, or Blinkers OFF). If present, check if the jockey is a top-5 meet rider (Ortiz Jr, Prat, Saez L, Gaffalione, Ortiz JL). If BOTH conditions met at ANY odds, this signal FIRES (+2). No odds threshold — the combo itself is the edge.',
      dataStatus: 'green', dataNote: 'Blinker changes and jockey names are both in DRF data. Added 5/31 — McCann (R8 winner) had this exact pattern at 6/1.' },
    { id: 'B13', name: 'Highest Speed Rating at a price', weight: 2, description: 'DRF-tagged "Highest Speed Rating" horse at 8/1 or higher. The fastest horse in the field that the public is underlaying.', active: true,
      detection: 'Look for "Highest Speed Rating" notation in the DRF data (separate from Beyer figure). If tagged AND the horse is 8/1 or higher on ML or live odds, this signal FIRES (+2). Different from B6 (best Beyer) — this captures DRF\'s own speed assessment on an underlaid horse.',
      dataStatus: 'green', dataNote: 'Highest Speed Rating tag is in DRF program data. Added 5/31 — Culture War (R10 winner) was HSR at 12/1.' }
];

// Lifetime history (all prior sessions)
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
            'R8: Mike\'s Mistake — tri bet as 2/4/7 instead of 2/3/7. Race came in 2-3-7. $1 tri paid $19.66. Cost us $78.64 (would have been $19.66 × $4 = $78.64)',
            'R10: Exacta missed by one — #5 Who Dey (12/1) snuck into 2nd over #3 Hit Show',
            'R11: Coal Battle (our win pick) never fired; Lagynos (fav) won'
        ],
        lessons: [
            'Original Sin WIN validates the value thesis — 15/1 ML, Walsh 16%, signals flagged it',
            'NEW RULE R6: Trifecta box must ALWAYS include the exacta horses. Never split them.',
            'Cox/Ortiz I Jr = automatic inclusion in exotics',
            'Mike\'s Mistake cost $78.64 — the tri would have paid $19.66×$4 if horses matched the exacta'
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
const LIFETIME_PRIOR_PL = -451.65; // 57.40 from day 1, -509.05 from day 2
