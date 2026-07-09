import { replaceQuestions } from './db.js';

interface QuestionRow {
  category: string;
  slot_key: string;
  points: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
}

const questions: QuestionRow[] = [
  // ═══════════════════════════════════════════════════════════════
  // ─── GEOGRAPHY 1pt ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'In which city do the Lakers play their home games?', option_a: 'New York', option_b: 'Los Angeles', option_c: 'Chicago', option_d: 'Houston', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'The TD Garden is the home arena of which NBA team?', option_a: 'Boston Celtics', option_b: 'Brooklyn Nets', option_c: 'Philadelphia 76ers', option_d: 'Toronto Raptors', correct_index: 0 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'Which NBA team plays in the city known as "The Windy City"?', option_a: 'Detroit Pistons', option_b: 'Indiana Pacers', option_c: 'Chicago Bulls', option_d: 'Milwaukee Bucks', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'In which country is Euroleague team Panathinaikos based?', option_a: 'Turkey', option_b: 'Spain', option_c: 'Greece', option_d: 'Italy', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'Real Madrid basketball plays its home games in which city?', option_a: 'Barcelona', option_b: 'Madrid', option_c: 'Valencia', option_d: 'Seville', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'In which city does Fenerbahçe basketball play?', option_a: 'Ankara', option_b: 'Istanbul', option_c: 'Izmir', option_d: 'Antalya', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'Madison Square Garden is home to which NBA team?', option_a: 'Brooklyn Nets', option_b: 'New York Knicks', option_c: 'Philadelphia 76ers', option_d: 'Boston Celtics', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'FC Barcelona basketball is based in which country?', option_a: 'Portugal', option_b: 'France', option_c: 'Spain', option_d: 'Italy', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'In which city do the Golden State Warriors play?', option_a: 'Los Angeles', option_b: 'Sacramento', option_c: 'San Francisco', option_d: 'Oakland', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'Olympiacos basketball is based in which country?', option_a: 'Italy', option_b: 'Greece', option_c: 'Turkey', option_d: 'Serbia', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'The Crypto.com Arena is home to which two NBA teams?', option_a: 'Lakers & Clippers', option_b: 'Nets & Knicks', option_c: 'Warriors & Kings', option_d: 'Bulls & Bucks', correct_index: 0 },
  { category: 'geography', slot_key: 'geography-1', points: 1, question: 'ALBA Berlin plays in which European capital?', option_a: 'Vienna', option_b: 'Berlin', option_c: 'Munich', option_d: 'Prague', correct_index: 1 },

  // ─── GEOGRAPHY 2pt ─────────────────────────────────────────────
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'What is the name of the arena where the Golden State Warriors play?', option_a: 'Crypto.com Arena', option_b: 'Chase Center', option_c: 'Madison Square Garden', option_d: 'Barclays Center', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'The Raptors are the only NBA team based in which country?', option_a: 'Mexico', option_b: 'Canada', option_c: 'United Kingdom', option_d: 'Australia', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'Which US state has the most NBA teams?', option_a: 'Texas', option_b: 'New York', option_c: 'California', option_d: 'Florida', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'The Stark Arena is the home of which Euroleague team?', option_a: 'Crvena Zvezda', option_b: 'Partizan', option_c: 'Olympiacos', option_d: 'Anadolu Efes', correct_index: 0 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'In which city is the Palau Blaugrana located?', option_a: 'Madrid', option_b: 'Barcelona', option_c: 'Milan', option_d: 'Athens', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'CSKA Moscow plays basketball in which country?', option_a: 'Ukraine', option_b: 'Belarus', option_c: 'Russia', option_d: 'Poland', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'The WiZink Center is the home arena of which Euroleague team?', option_a: 'FC Barcelona', option_b: 'Real Madrid', option_c: 'Valencia Basket', option_d: 'Baskonia', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'Maccabi Tel Aviv plays in which country?', option_a: 'Lebanon', option_b: 'Israel', option_c: 'Jordan', option_d: 'Egypt', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'In which Italian city does Olimpia Milano play their home games?', option_a: 'Rome', option_b: 'Turin', option_c: 'Milan', option_d: 'Naples', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'The Euroleague Final Four 2019 was held in which city?', option_a: 'Belgrade', option_b: 'Vitoria-Gasteiz', option_c: 'Istanbul', option_d: 'Berlin', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'AS Monaco basketball plays in which principality/country?', option_a: 'France', option_b: 'Monaco', option_c: 'Italy', option_d: 'Spain', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-2', points: 2, question: 'The Mediolanum Forum is the arena for which Euroleague team?', option_a: 'Virtus Bologna', option_b: 'Olimpia Milano', option_c: 'Fenerbahçe', option_d: 'Bayern Munich', correct_index: 1 },

  // ─── GEOGRAPHY 3pt ─────────────────────────────────────────────
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'Which NBA arena is located at 1601 Biscayne Boulevard?', option_a: 'Amway Center', option_b: 'Kaseya Center', option_c: 'Smoothie King Center', option_d: 'State Farm Arena', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'Before relocating to OKC, the Thunder franchise was based in which city?', option_a: 'Vancouver', option_b: 'Seattle', option_c: 'St. Louis', option_d: 'Kansas City', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'Which team played home games in the Alamodome before the AT&T Center?', option_a: 'Dallas Mavericks', option_b: 'Houston Rockets', option_c: 'San Antonio Spurs', option_d: 'Memphis Grizzlies', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'The OAKA Arena in Athens is primarily the home of which Euroleague team?', option_a: 'Olympiacos', option_b: 'Panathinaikos', option_c: 'AEK Athens', option_d: 'PAOK', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'In which city was the very first Euroleague Final Four held (1988)?', option_a: 'Barcelona', option_b: 'Ghent', option_c: 'Athens', option_d: 'Rome', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'Žalgiris Kaunas plays in which country?', option_a: 'Latvia', option_b: 'Lithuania', option_c: 'Estonia', option_d: 'Poland', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'The Sinan Erdem Dome used for Euroleague Final Fours is in which city?', option_a: 'Ankara', option_b: 'Athens', option_c: 'Istanbul', option_d: 'Belgrade', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'Which arena hosted the 2023 Euroleague Final Four?', option_a: 'Štark Arena, Belgrade', option_b: 'Lanxess Arena, Cologne', option_c: 'O2 Arena, London', option_d: 'Kaunas Arena', correct_index: 0 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'Baskonia is based in which Spanish city?', option_a: 'Bilbao', option_b: 'San Sebastián', option_c: 'Vitoria-Gasteiz', option_d: 'Pamplona', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'The Peace and Friendship Stadium (SEF) in Piraeus is home to which team?', option_a: 'Panathinaikos', option_b: 'Olympiacos', option_c: 'AEK Athens', option_d: 'PAOK', correct_index: 1 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'Which Euroleague team plays at the Ulker Sports Arena?', option_a: 'Galatasaray', option_b: 'Anadolu Efes', option_c: 'Fenerbahçe', option_d: 'Beşiktaş', correct_index: 2 },
  { category: 'geography', slot_key: 'geography-3', points: 3, question: 'The 2024 Euroleague Final Four was hosted in which city?', option_a: 'Berlin', option_b: 'Kaunas', option_c: 'Istanbul', option_d: 'Belgrade', correct_index: 0 },

  // ═══════════════════════════════════════════════════════════════
  // ─── HISTORY 1pt ───────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  { category: 'history', slot_key: 'history-1', points: 1, question: 'Who holds the record for the most career points in NBA history?', option_a: 'Kareem Abdul-Jabbar', option_b: 'Karl Malone', option_c: 'LeBron James', option_d: 'Kobe Bryant', correct_index: 2 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'Which team won the first ever NBA Championship in 1947?', option_a: 'Philadelphia Warriors', option_b: 'Boston Celtics', option_c: 'New York Knicks', option_d: 'Minneapolis Lakers', correct_index: 0 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'How many championships did Michael Jordan win?', option_a: '4', option_b: '5', option_c: '6', option_d: '7', correct_index: 2 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'Which team has won the most Euroleague titles?', option_a: 'CSKA Moscow', option_b: 'Real Madrid', option_c: 'Panathinaikos', option_d: 'Maccabi Tel Aviv', correct_index: 1 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'Which NBA team has won the most championships overall?', option_a: 'Los Angeles Lakers', option_b: 'Boston Celtics', option_c: 'Golden State Warriors', option_d: 'Chicago Bulls', correct_index: 1 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'Which player is known as "The Greek Freak"?', option_a: 'Nikola Jokić', option_b: 'Giannis Antetokounmpo', option_c: 'Luka Dončić', option_d: 'Rudy Gobert', correct_index: 1 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'Luka Dončić played for which Euroleague team before the NBA?', option_a: 'FC Barcelona', option_b: 'Fenerbahçe', option_c: 'Real Madrid', option_d: 'CSKA Moscow', correct_index: 2 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'Who is the NBA logo modeled after?', option_a: 'Michael Jordan', option_b: 'Jerry West', option_c: 'Wilt Chamberlain', option_d: 'Larry Bird', correct_index: 1 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'How many teams currently compete in the NBA?', option_a: '28', option_b: '30', option_c: '32', option_d: '26', correct_index: 1 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'The Euroleague modern format features how many teams in the regular season?', option_a: '16', option_b: '18', option_c: '20', option_d: '24', correct_index: 1 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'Nikola Jokić plays for which NBA team?', option_a: 'Sacramento Kings', option_b: 'Denver Nuggets', option_c: 'Indiana Pacers', option_d: 'Utah Jazz', correct_index: 1 },
  { category: 'history', slot_key: 'history-1', points: 1, question: 'Which country has produced the most NBA #1 draft picks from Europe?', option_a: 'Spain', option_b: 'France', option_c: 'Italy', option_d: 'Greece', correct_index: 0 },

  // ─── HISTORY 2pt ───────────────────────────────────────────────
  { category: 'history', slot_key: 'history-2', points: 2, question: 'In what year was the three-point line introduced in the NBA?', option_a: '1977', option_b: '1979', option_c: '1981', option_d: '1984', correct_index: 1 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'Who scored 100 points in a single NBA game?', option_a: 'Wilt Chamberlain', option_b: 'Elgin Baylor', option_c: 'Jerry West', option_d: 'Oscar Robertson', correct_index: 0 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'Which team completed a 73-9 regular season record in 2015-16?', option_a: 'Chicago Bulls', option_b: 'San Antonio Spurs', option_c: 'Golden State Warriors', option_d: 'Los Angeles Lakers', correct_index: 2 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'Which player won the Euroleague MVP in 2018 while playing for Real Madrid?', option_a: 'Sergio Llull', option_b: 'Luka Dončić', option_c: 'Facundo Campazzo', option_d: 'Anthony Randolph', correct_index: 1 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'Panathinaikos won back-to-back Euroleague titles in which years?', option_a: '1996 & 1997', option_b: '2000 & 2001', option_c: '2007 & 2008', option_d: '2009 & 2010', correct_index: 1 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'Which team did Obradović coach to win the 2017 Euroleague?', option_a: 'Real Madrid', option_b: 'Fenerbahçe', option_c: 'CSKA Moscow', option_d: 'Panathinaikos', correct_index: 1 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'Who is the all-time leading scorer in Euroleague history?', option_a: 'Juan Carlos Navarro', option_b: 'Vassilis Spanoulis', option_c: 'Felipe Reyes', option_d: 'Kyle Hines', correct_index: 1 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'In the 2003 NBA Draft, which European player was selected #2 overall?', option_a: 'Andrea Bargnani', option_b: 'Darko Miličić', option_c: 'Dirk Nowitzki', option_d: 'Pau Gasol', correct_index: 1 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'Which team did Dimitris Diamantidis spend his career with?', option_a: 'Olympiacos', option_b: 'Panathinaikos', option_c: 'AEK Athens', option_d: 'CSKA Moscow', correct_index: 1 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'CSKA Moscow won the Euroleague in 2019 by defeating which team in the final?', option_a: 'Real Madrid', option_b: 'Fenerbahçe', option_c: 'Anadolu Efes', option_d: 'FC Barcelona', correct_index: 2 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'Olympiacos won back-to-back Euroleague titles in which years?', option_a: '2010 & 2011', option_b: '2012 & 2013', option_c: '2015 & 2016', option_d: '2005 & 2006', correct_index: 1 },
  { category: 'history', slot_key: 'history-2', points: 2, question: 'Which NBA player holds the record for most career assists?', option_a: 'Magic Johnson', option_b: 'John Stockton', option_c: 'Jason Kidd', option_d: 'Steve Nash', correct_index: 1 },

  // ─── HISTORY 3pt ───────────────────────────────────────────────
  { category: 'history', slot_key: 'history-3', points: 3, question: 'Who was the first player drafted out of high school in the modern era (1995)?', option_a: 'Kobe Bryant', option_b: 'Kevin Garnett', option_c: 'LeBron James', option_d: 'Dwight Howard', correct_index: 1 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'Which player won NBA MVP awards in three different decades?', option_a: 'Kareem Abdul-Jabbar', option_b: 'LeBron James', option_c: 'Tim Duncan', option_d: 'Michael Jordan', correct_index: 0 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'In the 1969 Finals, Bill Russell\'s Celtics beat which team in his final season?', option_a: 'Los Angeles Lakers', option_b: 'New York Knicks', option_c: 'Philadelphia 76ers', option_d: 'Milwaukee Bucks', correct_index: 0 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'Which coach has won the most Euroleague titles?', option_a: 'Ettore Messina', option_b: 'Željko Obradović', option_c: 'Pablo Laso', option_d: 'Dimitris Itoudis', correct_index: 1 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'Maccabi Tel Aviv shocked basketball by beating which team in the 2004 Euroleague Final?', option_a: 'Real Madrid', option_b: 'CSKA Moscow', option_c: 'FC Barcelona', option_d: 'Virtus Bologna', correct_index: 0 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'Who scored 49 points in a single Euroleague game in 2014, a record at the time?', option_a: 'Shane Larkin', option_b: 'Keith Langford', option_c: 'Alexey Shved', option_d: 'Brad Wanamaker', correct_index: 2 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'Which team won the inaugural modern-format Euroleague in 2000-01?', option_a: 'Real Madrid', option_b: 'Kinder Bologna (Virtus)', option_c: 'Panathinaikos', option_d: 'CSKA Moscow', correct_index: 1 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'Vassilis Spanoulis won the Final Four MVP how many times?', option_a: '2', option_b: '3', option_c: '4', option_d: '1', correct_index: 1 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'Which Euroleague team won three consecutive titles from 2006 to 2008?', option_a: 'Real Madrid', option_b: 'Panathinaikos', option_c: 'CSKA Moscow', option_d: 'FC Barcelona', correct_index: 2 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'In 2021, which team won the Euroleague after a historic comeback in the Final?', option_a: 'FC Barcelona', option_b: 'Anadolu Efes', option_c: 'CSKA Moscow', option_d: 'Olympiacos', correct_index: 1 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'How many Euroleague titles has Željko Obradović won as head coach?', option_a: '7', option_b: '8', option_c: '9', option_d: '6', correct_index: 2 },
  { category: 'history', slot_key: 'history-3', points: 3, question: 'Shane Larkin scored 49 points in a 2020 Euroleague game for which team?', option_a: 'Fenerbahçe', option_b: 'Anadolu Efes', option_c: 'Real Madrid', option_d: 'Bayern Munich', correct_index: 1 },

  // ═══════════════════════════════════════════════════════════════
  // ─── LOGO 1pt ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which team\'s logo features a shamrock / clover?', option_a: 'Milwaukee Bucks', option_b: 'Boston Celtics', option_c: 'Indiana Pacers', option_d: 'Minnesota Timberwolves', correct_index: 1 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which team\'s logo features a large red bull?', option_a: 'Houston Rockets', option_b: 'Toronto Raptors', option_c: 'Chicago Bulls', option_d: 'Miami Heat', correct_index: 2 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which team\'s logo features a flaming basketball going through a hoop?', option_a: 'Phoenix Suns', option_b: 'Miami Heat', option_c: 'Portland Trail Blazers', option_d: 'Indiana Pacers', correct_index: 1 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which Euroleague team\'s logo features a green trefoil/shamrock?', option_a: 'Olimpia Milano', option_b: 'Panathinaikos', option_c: 'Žalgiris Kaunas', option_d: 'Maccabi Tel Aviv', correct_index: 1 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which team has a red and white striped logo with a star?', option_a: 'CSKA Moscow', option_b: 'Olympiacos', option_c: 'Crvena Zvezda', option_d: 'Bayern Munich', correct_index: 2 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'A yellow and blue Star of David is part of which team\'s logo?', option_a: 'Hapoel Jerusalem', option_b: 'Maccabi Tel Aviv', option_c: 'Maccabi Haifa', option_d: 'Hapoel Tel Aviv', correct_index: 1 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which NBA team\'s logo features an orange and blue basketball with a skyline?', option_a: 'Phoenix Suns', option_b: 'New York Knicks', option_c: 'Orlando Magic', option_d: 'OKC Thunder', correct_index: 1 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which team uses a red army star in its crest?', option_a: 'Olympiacos', option_b: 'Crvena Zvezda', option_c: 'CSKA Moscow', option_d: 'Bayern Munich', correct_index: 2 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which NBA team\'s logo is a purple and gold crown?', option_a: 'Sacramento Kings', option_b: 'Cleveland Cavaliers', option_c: 'LA Clippers', option_d: 'Charlotte Hornets', correct_index: 0 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which team\'s logo features a horse on a red and blue crest?', option_a: 'CSKA Moscow', option_b: 'FC Barcelona', option_c: 'Olimpia Milano', option_d: 'Real Madrid', correct_index: 0 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which Euroleague team\'s logo features a white laurel wreath on red?', option_a: 'Panathinaikos', option_b: 'Olympiacos', option_c: 'ALBA Berlin', option_d: 'Anadolu Efes', correct_index: 1 },
  { category: 'logo', slot_key: 'logo-1', points: 1, question: 'Which NBA team has a trident-topped W on a navy background?', option_a: 'Washington Wizards', option_b: 'Indiana Pacers', option_c: 'Golden State Warriors', option_d: 'Brooklyn Nets', correct_index: 2 },

  // ─── LOGO 2pt ──────────────────────────────────────────────────
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'Which team\'s retro logo features a leprechaun with a top hat, monocle and cane?', option_a: 'Boston Celtics', option_b: 'New York Knicks', option_c: 'Philadelphia 76ers', option_d: 'Brooklyn Nets', correct_index: 0 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'Which team\'s original 1995 logo featured a purple dinosaur dribbling?', option_a: 'Charlotte Hornets', option_b: 'Memphis Grizzlies', option_c: 'Toronto Raptors', option_d: 'Orlando Magic', correct_index: 2 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'Which Euroleague team\'s logo features a green knight on horseback (Vytis)?', option_a: 'Panathinaikos', option_b: 'Žalgiris Kaunas', option_c: 'Darüşşafaka', option_d: 'Unicaja', correct_index: 1 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'Which Turkish team has a yellow canary in its logo?', option_a: 'Galatasaray', option_b: 'Fenerbahçe', option_c: 'Anadolu Efes', option_d: 'Beşiktaş', correct_index: 1 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'EA7 Emporio Armani is the sponsor name on which Euroleague team?', option_a: 'Real Madrid', option_b: 'FC Barcelona', option_c: 'Olimpia Milano', option_d: 'Virtus Bologna', correct_index: 2 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'Which NBA team has a 1990s logo showing a pinwheel in red, black and white?', option_a: 'Houston Rockets', option_b: 'Portland Trail Blazers', option_c: 'Atlanta Hawks', option_d: 'Toronto Raptors', correct_index: 1 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'Which team\'s crest includes red and blue stripes from its city\'s football club?', option_a: 'Anadolu Efes', option_b: 'Bayern Munich', option_c: 'FC Barcelona', option_d: 'AS Monaco', correct_index: 2 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'Which NBA team\'s logo features a pelican holding a basketball in its beak?', option_a: 'New Orleans Pelicans', option_b: 'Atlanta Hawks', option_c: 'Charlotte Hornets', option_d: 'Memphis Grizzlies', correct_index: 0 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'Which Euroleague team from Germany has a bear associated with its city?', option_a: 'ALBA Berlin', option_b: 'Bayern Munich', option_c: 'Brose Bamberg', option_d: 'ratiopharm Ulm', correct_index: 0 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'Virtus Bologna\'s logo is predominantly which color?', option_a: 'Red', option_b: 'Green', option_c: 'Black', option_d: 'Blue', correct_index: 2 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'Which team\'s logo includes a blue crown and a red shield?', option_a: 'Sacramento Kings', option_b: 'Real Madrid', option_c: 'Cleveland Cavaliers', option_d: 'Charlotte Hornets', correct_index: 1 },
  { category: 'logo', slot_key: 'logo-2', points: 2, question: 'AS Monaco basketball has primary colors of red and which other?', option_a: 'Blue', option_b: 'Gold', option_c: 'White', option_d: 'Black', correct_index: 2 },

  // ═══════════════════════════════════════════════════════════════
  // ─── GUESS WHO'S MISSING 2pt (Slot 1) ─────────────────────────
  // ═══════════════════════════════════════════════════════════════
  { category: 'guess-whos-missing', slot_key: 'missing-1', points: 2, question: '1996 Bulls starting 5: Harper, Jordan, Pippen, Rodman, and ___?', option_a: 'Horace Grant', option_b: 'Luc Longley', option_c: 'Bill Wennington', option_d: 'Toni Kukoč', correct_index: 1 },
  { category: 'guess-whos-missing', slot_key: 'missing-1', points: 2, question: '2001 Lakers: Fisher, Kobe, Fox, ___, Shaq. Who is missing?', option_a: 'Robert Horry', option_b: 'Horace Grant', option_c: 'Lamar Odom', option_d: 'Ron Harper', correct_index: 1 },
  { category: 'guess-whos-missing', slot_key: 'missing-1', points: 2, question: '2008 Celtics: Rondo, Allen, Pierce, Garnett, and ___. Starting C?', option_a: 'Kendrick Perkins', option_b: 'Al Horford', option_c: 'Glen Davis', option_d: 'Leon Powe', correct_index: 0 },
  { category: 'guess-whos-missing', slot_key: 'missing-1', points: 2, question: '2013 Heat: Chalmers, Wade, LeBron, ___, Bosh. Who\'s missing?', option_a: 'Shane Battier', option_b: 'Ray Allen', option_c: 'Udonis Haslem', option_d: 'Mike Miller', correct_index: 0 },
  { category: 'guess-whos-missing', slot_key: 'missing-1', points: 2, question: '2017 Warriors: Curry, Klay, KD, ___, Zaza. Who\'s missing?', option_a: 'Andre Iguodala', option_b: 'Draymond Green', option_c: 'Harrison Barnes', option_d: 'Shaun Livingston', correct_index: 1 },
  { category: 'guess-whos-missing', slot_key: 'missing-1', points: 2, question: '2016 Cavs Finals: Kyrie, JR Smith, LeBron, ___, Tristan Thompson.', option_a: 'Kevin Love', option_b: 'Richard Jefferson', option_c: 'Iman Shumpert', option_d: 'Channing Frye', correct_index: 0 },
  { category: 'guess-whos-missing', slot_key: 'missing-1', points: 2, question: '2012 Olympiacos EL champs: Spanoulis, Printezis, ___, Hines, Vougioukas.', option_a: 'Acie Law', option_b: 'Kyle Hines', option_c: 'Kostas Papanikolaou', option_d: 'Pero Antić', correct_index: 2 },
  { category: 'guess-whos-missing', slot_key: 'missing-1', points: 2, question: '2019 Raptors: Lowry, Green, Kawhi, Siakam, and ___?', option_a: 'Serge Ibaka', option_b: 'Marc Gasol', option_c: 'Jonas Valanciunas', option_d: 'Chris Boucher', correct_index: 1 },
  { category: 'guess-whos-missing', slot_key: 'missing-1', points: 2, question: '2004 Pistons: Billups, Rip, ___, Rasheed Wallace, Ben Wallace.', option_a: 'Tayshaun Prince', option_b: 'Mehmet Okur', option_c: 'Corliss Williamson', option_d: 'Lindsey Hunter', correct_index: 0 },
  { category: 'guess-whos-missing', slot_key: 'missing-1', points: 2, question: '2021 Bucks champs: Jrue, Khris, ___, Giannis, Brook Lopez.', option_a: 'P.J. Tucker', option_b: 'Pat Connaughton', option_c: 'Bobby Portis', option_d: 'Donte DiVincenzo', correct_index: 0 },

  // ─── GUESS WHO'S MISSING 2pt (Slot 2) ─────────────────────────
  { category: 'guess-whos-missing', slot_key: 'missing-2', points: 2, question: '2014 Spurs: Parker, Green, Kawhi, ___, Duncan. Who?', option_a: 'Boris Diaw', option_b: 'Tiago Splitter', option_c: 'Matt Bonner', option_d: 'Manu Ginóbili', correct_index: 1 },
  { category: 'guess-whos-missing', slot_key: 'missing-2', points: 2, question: '2016 Warriors: Curry, Klay, ___, Draymond, Bogut. Who?', option_a: 'Andre Iguodala', option_b: 'Kevin Durant', option_c: 'Harrison Barnes', option_d: 'Shaun Livingston', correct_index: 2 },
  { category: 'guess-whos-missing', slot_key: 'missing-2', points: 2, question: '1992 Dream Team gold medal starters: MJ, Pippen, ___, Malone, Ewing.', option_a: 'Larry Bird', option_b: 'Magic Johnson', option_c: 'Charles Barkley', option_d: 'Chris Mullin', correct_index: 2 },
  { category: 'guess-whos-missing', slot_key: 'missing-2', points: 2, question: '2005 Maccabi EL Final: A. Parker, Bynum, ___, Baston, Vujčić.', option_a: 'Derrick Sharp', option_b: 'David Blu', option_c: 'Šarūnas Jasikevičius', option_d: 'Tal Burstein', correct_index: 2 },
  { category: 'guess-whos-missing', slot_key: 'missing-2', points: 2, question: '2021 Efes EL champs: Micić, Larkin, ___, Dunston, Pleiss. SF?', option_a: 'James Anderson', option_b: 'Krunoslav Simon', option_c: 'Adrien Moerman', option_d: 'Rodrigue Beaubois', correct_index: 1 },
  { category: 'guess-whos-missing', slot_key: 'missing-2', points: 2, question: '2010 Lakers: Fisher, Kobe, Artest, ___, Bynum. Who?', option_a: 'Pau Gasol', option_b: 'Lamar Odom', option_c: 'Luke Walton', option_d: 'Shannon Brown', correct_index: 0 },
  { category: 'guess-whos-missing', slot_key: 'missing-2', points: 2, question: '2019 CSKA EL champs: De Colo, Clyburn, ___, Hines, Hunter.', option_a: 'Sergio Rodriguez', option_b: 'Daniel Hackett', option_c: 'Nikola Milutinov', option_d: 'Alec Peters', correct_index: 0 },
  { category: 'guess-whos-missing', slot_key: 'missing-2', points: 2, question: '2011 Mavericks: Kidd, ___, Marion, Dirk, Tyson Chandler.', option_a: 'Jason Terry', option_b: 'DeShawn Stevenson', option_c: 'Caron Butler', option_d: 'Vince Carter', correct_index: 1 },
  { category: 'guess-whos-missing', slot_key: 'missing-2', points: 2, question: '2017 Fenerbahçe EL champs: ___, Bogdanović, Datome, Vesely, Udoh. PG?', option_a: 'Kostas Sloukas', option_b: 'Bobby Dixon', option_c: 'Scottie Wilbekin', option_d: 'Brad Wanamaker', correct_index: 0 },
  { category: 'guess-whos-missing', slot_key: 'missing-2', points: 2, question: '2023 Real Madrid EL: Causeur, Hezonja, Yabusele, Tavares, ___. PG?', option_a: 'Sergio Llull', option_b: 'Facundo Campazzo', option_c: 'Thomas Heurtel', option_d: 'Sergio Rodriguez', correct_index: 1 },

  // ═══════════════════════════════════════════════════════════════
  // ─── GUESS THE PLAYER (CV) 3pt – Slot 1 ───────────────────────
  // ═══════════════════════════════════════════════════════════════
  { category: 'guess-the-player', slot_key: 'player-1', points: 3, question: 'CV: Drafted 1984. Bulls (1984-93, 95-98), Wizards (01-03). 6× Champ, 5× MVP.', option_a: 'Magic Johnson', option_b: 'Michael Jordan', option_c: 'Larry Bird', option_d: 'Hakeem Olajuwon', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-1', points: 3, question: 'CV: Drafted 1996 #13. One franchise 1996-2016. 5× Champ, 1× MVP, 18× All-Star. Mamba.', option_a: 'Tim Duncan', option_b: 'Dirk Nowitzki', option_c: 'Kobe Bryant', option_d: 'Paul Pierce', correct_index: 2 },
  { category: 'guess-the-player', slot_key: 'player-1', points: 3, question: 'CV: Undrafted. Phoenix, NY Knicks (×2), Dallas. 2× MVP. Canadian PG.', option_a: 'Chauncey Billups', option_b: 'Steve Nash', option_c: 'Jason Kidd', option_d: 'Chris Paul', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-1', points: 3, question: 'CV: Born Greece. Entire career Olympiacos. EL champ 2012 & 2013. All-time EL top scorer.', option_a: 'Dimitris Diamantidis', option_b: 'Vassilis Spanoulis', option_c: 'Georgios Printezis', option_d: 'Kostas Sloukas', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-1', points: 3, question: 'CV: Born Serbia. Partizan, PAO, Real Madrid. Never NBA. 2002 FIBA World Cup MVP.', option_a: 'Predrag Stojaković', option_b: 'Dejan Bodiroga', option_c: 'Vlade Divac', option_d: 'Miloš Teodosić', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-1', points: 3, question: 'CV: Born Barcelona. NBA: Memphis, Lakers, Bulls, Spurs. 2× NBA champ. Also FC Barcelona.', option_a: 'Ricky Rubio', option_b: 'Marc Gasol', option_c: 'Pau Gasol', option_d: 'Juan Carlos Navarro', correct_index: 2 },
  { category: 'guess-the-player', slot_key: 'player-1', points: 3, question: 'CV: Born Greece. Panathinaikos 2000-2016. EL MVP 2007. Best Euro guard of his era.', option_a: 'Nick Calathes', option_b: 'Dimitris Diamantidis', option_c: 'Vassilis Spanoulis', option_d: 'Kostas Sloukas', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-1', points: 3, question: 'CV: Born Germany. Drafted 1998. 21 seasons Dallas. 1× Champ (2011), Finals MVP.', option_a: 'Steve Nash', option_b: 'Dirk Nowitzki', option_c: 'Detlef Schrempf', option_d: 'Dennis Schröder', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-1', points: 3, question: 'CV: Born Lithuania. Žalgiris & Barcelona. Never NBA. 1999 F4 MVP. Later became coach.', option_a: 'Arvydas Sabonis', option_b: 'Šarūnas Jasikevičius', option_c: 'Ramūnas Šiškauskas', option_d: 'Paulius Jankūnas', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-1', points: 3, question: 'CV: Born Spain. Entire career FC Barcelona (1997-2018). EL 2003, 2010 champ. Never NBA.', option_a: 'Pau Gasol', option_b: 'Rudy Fernández', option_c: 'Juan Carlos Navarro', option_d: 'Ricky Rubio', correct_index: 2 },

  // ─── GUESS THE PLAYER (CV) 3pt – Slot 2 ───────────────────────
  { category: 'guess-the-player', slot_key: 'player-2', points: 3, question: 'CV: Drafted 2003 #1. Cleveland (×2), Miami, LA Lakers. 4× Champ, 4× MVP.', option_a: 'Dwyane Wade', option_b: 'Carmelo Anthony', option_c: 'LeBron James', option_d: 'Chris Bosh', correct_index: 2 },
  { category: 'guess-the-player', slot_key: 'player-2', points: 3, question: 'CV: Drafted 1997 #1. Spurs 1997-2016. 5× Champ, 2× MVP. U.S. Virgin Islands.', option_a: 'Tim Duncan', option_b: 'Kevin Garnett', option_c: 'Karl Malone', option_d: 'Dirk Nowitzki', correct_index: 0 },
  { category: 'guess-the-player', slot_key: 'player-2', points: 3, question: 'CV: Drafted 1995 #5. Minnesota, Boston, Brooklyn. 1× Champ, 1× MVP. "Big Ticket."', option_a: 'Paul Pierce', option_b: 'Rasheed Wallace', option_c: 'Kevin Garnett', option_d: 'Jermaine O\'Neal', correct_index: 2 },
  { category: 'guess-the-player', slot_key: 'player-2', points: 3, question: 'CV: Born Slovenia. Real Madrid youth. EL champ 2018 (youngest F4 MVP). Dallas #3 pick 2018.', option_a: 'Goran Dragić', option_b: 'Luka Dončić', option_c: 'Bogdan Bogdanović', option_d: 'Dario Šarić', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-2', points: 3, question: 'CV: Born Argentina. Virtus Bologna → Spurs (2002-18). 4× NBA Champ. Olympic gold 2004.', option_a: 'Luis Scola', option_b: 'Manu Ginóbili', option_c: 'Andrés Nocioni', option_d: 'Fabricio Oberto', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-2', points: 3, question: 'CV: Born Nigeria/Greece. Draft 2013 #15. Milwaukee entire career. 2× MVP, Champ 2021.', option_a: 'Joel Embiid', option_b: 'Giannis Antetokounmpo', option_c: 'Pascal Siakam', option_d: 'Bam Adebayo', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-2', points: 3, question: 'CV: Born France. Cholet → Spurs (2001-18). 4× NBA Champ. Euro-step pioneer.', option_a: 'Boris Diaw', option_b: 'Tony Parker', option_c: 'Nicolas Batum', option_d: 'Rudy Gobert', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-2', points: 3, question: 'CV: Born Serbia. Mega → Denver (2015-). 3× MVP, Champ 2023. "The Joker."', option_a: 'Nikola Vučević', option_b: 'Nikola Jokić', option_c: 'Boban Marjanović', option_d: 'Domantas Sabonis', correct_index: 1 },
  { category: 'guess-the-player', slot_key: 'player-2', points: 3, question: 'CV: Born Montenegro. Budućnost → Partizan → CSKA → Real Madrid. EL MVP 2016. PG.', option_a: 'Miloš Teodosić', option_b: 'Sergio Rodriguez', option_c: 'Sergio Llull', option_d: 'Nando De Colo', correct_index: 2 },
  { category: 'guess-the-player', slot_key: 'player-2', points: 3, question: 'CV: NBA: Orlando, Houston, LA Lakers, Miami, Boston. 4× Champ, 3× Finals MVP. "Shaq."', option_a: 'Shaquille O\'Neal', option_b: 'Dwight Howard', option_c: 'Alonzo Mourning', option_d: 'Hakeem Olajuwon', correct_index: 0 },
];

export async function seedQuestions(log = true) {
  await replaceQuestions(questions);
  const total = questions.length;

  if (!log) return total;

  console.log(`✅ Seeded Supabase database with ${total} questions`);

  const breakdown = questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.slot_key] = (counts[question.slot_key] || 0) + 1;
    return counts;
  }, {});

  console.log('\n📊 Breakdown by slot:');
  for (const [slotKey, count] of Object.entries(breakdown).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`   ${slotKey}: ${count} questions`);
  }

  return total;
}

if (process.argv[1]?.includes('seed.')) {
  seedQuestions().catch(console.error);
}
