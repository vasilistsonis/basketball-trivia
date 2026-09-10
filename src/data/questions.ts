import type { QuestionBankEntry } from '../types';
import { findSlot } from '../game/catalog';

// A self-contained starter bank ships inside the app. These text clues need no
// image download or database setup. Slot keys match the existing server bank.
// Keep IDs stable: append new questions rather than reordering existing rows.
type Entry = [slotKey: string, question: string, options: [string, string, string, string], correctIndex: number];

const entries: Entry[] = [
  ['geography-1', 'In which city do the Los Angeles Lakers play their home games?', ['New York', 'Los Angeles', 'Chicago', 'Houston'], 1],
  ['geography-1', 'The TD Garden is the home arena of which NBA team?', ['Boston Celtics', 'Brooklyn Nets', 'Philadelphia 76ers', 'Toronto Raptors'], 0],
  ['geography-1', 'Which NBA team plays in the city known as the Windy City?', ['Detroit Pistons', 'Indiana Pacers', 'Chicago Bulls', 'Milwaukee Bucks'], 2],
  ['geography-1', 'In which country is Panathinaikos basketball based?', ['Turkey', 'Spain', 'Greece', 'Italy'], 2],
  ['geography-2', 'Žalgiris Kaunas represents which country in the EuroLeague?', ['Latvia', 'Lithuania', 'Estonia', 'Poland'], 1],
  ['geography-2', 'Which Spanish city is home to Baskonia?', ['Valencia', 'Málaga', 'Vitoria-Gasteiz', 'Seville'], 2],
  ['geography-2', 'Partizan and Crvena zvezda are basketball rivals in which city?', ['Zagreb', 'Ljubljana', 'Belgrade', 'Sarajevo'], 2],
  ['geography-2', 'Which NBA team plays its home games in Salt Lake City?', ['Denver Nuggets', 'Utah Jazz', 'Phoenix Suns', 'Sacramento Kings'], 1],
  ['geography-3', 'Žalgirio Arena in Kaunas sits on an island in which river?', ['Danube', 'Nemunas', 'Vistula', 'Sava'], 1],
  ['geography-3', 'Fenerbahçe’s Ülker Sports Arena is in which Istanbul district?', ['Beşiktaş', 'Fatih', 'Ataşehir', 'Beyoğlu'], 2],
  ['geography-3', 'The Aleksandar Nikolić Hall, formerly Pionir Hall, is in which city?', ['Belgrade', 'Athens', 'Istanbul', 'Ljubljana'], 0],
  ['geography-3', 'Which city hosted the 2019 EuroLeague Final Four at the Fernando Buesa Arena?', ['Madrid', 'Berlin', 'Vitoria-Gasteiz', 'Milan'], 2],

  ['history-1', 'How many NBA championships did Michael Jordan win with the Chicago Bulls?', ['4', '5', '6', '7'], 2],
  ['history-1', 'Which city hosted the 1992 Olympics, where the original Dream Team won gold?', ['Atlanta', 'Barcelona', 'Seoul', 'Sydney'], 1],
  ['history-1', 'Who invented the game of basketball in 1891?', ['James Naismith', 'John Wooden', 'Red Auerbach', 'William Morgan'], 0],
  ['history-1', 'Which team won the 2023 NBA championship?', ['Miami Heat', 'Boston Celtics', 'Denver Nuggets', 'Golden State Warriors'], 2],
  ['history-2', 'Which team defeated the Miami Heat in the 2011 NBA Finals?', ['San Antonio Spurs', 'Dallas Mavericks', 'Los Angeles Lakers', 'Oklahoma City Thunder'], 1],
  ['history-2', 'Which team became the first to overcome a 3–1 deficit in the NBA Finals, in 2016?', ['Cleveland Cavaliers', 'Boston Celtics', 'Miami Heat', 'Toronto Raptors'], 0],
  ['history-2', 'Who was named Finals MVP when the Detroit Pistons won the 2004 NBA title?', ['Ben Wallace', 'Richard Hamilton', 'Chauncey Billups', 'Rasheed Wallace'], 2],
  ['history-2', 'Which country won the men’s basketball gold medal at the 2004 Athens Olympics?', ['United States', 'Spain', 'Argentina', 'Lithuania'], 2],
  ['history-3', 'Which club won the 1999 EuroLeague title with Tyus Edney at point guard?', ['Žalgiris Kaunas', 'Virtus Bologna', 'Olympiacos', 'Maccabi Tel Aviv'], 0],
  ['history-3', 'Who hit the decisive late floater for Olympiacos in the 2012 EuroLeague final?', ['Vassilis Spanoulis', 'Georgios Printezis', 'Kostas Sloukas', 'Acie Law'], 1],
  ['history-3', 'Which club won the 2017 EuroLeague title under coach Željko Obradović?', ['Real Madrid', 'CSKA Moscow', 'Fenerbahçe', 'Panathinaikos'], 2],
  ['history-3', 'Who was the EuroLeague Final Four MVP when Real Madrid won the 2018 title?', ['Sergio Llull', 'Luka Dončić', 'Rudy Fernández', 'Facundo Campazzo'], 1],

  ['logo-1', 'Which NBA team’s emblem features a red bull’s head?', ['Chicago Bulls', 'Houston Rockets', 'Miami Heat', 'Atlanta Hawks'], 0],
  ['logo-1', 'Which NBA team’s logo shows a basketball passing through a flaming hoop?', ['Phoenix Suns', 'Miami Heat', 'Portland Trail Blazers', 'Orlando Magic'], 1],
  ['logo-1', 'Which NBA team is associated with a leprechaun spinning a basketball?', ['New York Knicks', 'Brooklyn Nets', 'Boston Celtics', 'Milwaukee Bucks'], 2],
  ['logo-1', 'A green three-leaf clover is a key symbol of which Greek basketball club?', ['Olympiacos', 'AEK Athens', 'Panathinaikos', 'Aris'], 2],
  ['logo-2', 'Which NBA team’s original 1995 logo featured a purple dinosaur dribbling a basketball?', ['Toronto Raptors', 'Memphis Grizzlies', 'Charlotte Hornets', 'Orlando Magic'], 0],
  ['logo-2', 'Which NBA team is known for its red-and-black pinwheel logo?', ['Houston Rockets', 'Portland Trail Blazers', 'Atlanta Hawks', 'Chicago Bulls'], 1],
  ['logo-2', 'Which NBA team’s primary emblem features a pelican above a basketball?', ['Atlanta Hawks', 'Charlotte Hornets', 'New Orleans Pelicans', 'Memphis Grizzlies'], 2],
  ['logo-2', 'Which NBA team’s identity features a musical note with a basketball at its base?', ['Utah Jazz', 'Denver Nuggets', 'Sacramento Kings', 'Indiana Pacers'], 0],

  ['missing-1', '1996 Bulls: Ron Harper, Michael Jordan, Scottie Pippen, Dennis Rodman and which starting center?', ['Horace Grant', 'Luc Longley', 'Bill Wennington', 'Toni Kukoč'], 1],
  ['missing-1', '2017 Warriors: Stephen Curry, Klay Thompson, Kevin Durant, ___ and Zaza Pachulia.', ['Andre Iguodala', 'Draymond Green', 'Harrison Barnes', 'Shaun Livingston'], 1],
  ['missing-1', '2008 Celtics: Rajon Rondo, Ray Allen, Paul Pierce, Kevin Garnett and which starting center?', ['Kendrick Perkins', 'Al Horford', 'Glen Davis', 'Leon Powe'], 0],
  ['missing-1', '2019 Raptors in the Finals: Kyle Lowry, Danny Green, Kawhi Leonard, Pascal Siakam and ___?', ['Serge Ibaka', 'Marc Gasol', 'Jonas Valančiūnas', 'Chris Boucher'], 1],
  ['missing-2', '2004 Pistons: Chauncey Billups, Richard Hamilton, ___, Rasheed Wallace and Ben Wallace.', ['Tayshaun Prince', 'Mehmet Okur', 'Corliss Williamson', 'Lindsey Hunter'], 0],
  ['missing-2', '2010 Lakers: Derek Fisher, Kobe Bryant, Ron Artest, ___ and Andrew Bynum.', ['Pau Gasol', 'Lamar Odom', 'Luke Walton', 'Shannon Brown'], 0],
  ['missing-2', '2011 Mavericks in the Finals: Jason Kidd, ___, Shawn Marion, Dirk Nowitzki and Tyson Chandler.', ['Jason Terry', 'DeShawn Stevenson', 'Caron Butler', 'Vince Carter'], 1],
  ['missing-2', '2023 Nuggets: Jamal Murray, Kentavious Caldwell-Pope, Michael Porter Jr., ___ and Nikola Jokić.', ['Bruce Brown', 'Aaron Gordon', 'Jeff Green', 'Christian Braun'], 1],
  ['missing-3', 'The 2002 Kings’ usual starters were Mike Bibby, Doug Christie, Peja Stojaković, Chris Webber and ___?', ['Vlade Divac', 'Brad Miller', 'Scott Pollard', 'Hedo Türkoğlu'], 0],
  ['missing-3', 'The 2007 Suns’ usual starters were Steve Nash, Raja Bell, Shawn Marion, Amar’e Stoudemire and ___?', ['Leandro Barbosa', 'Grant Hill', 'Boris Diaw', 'Joe Johnson'], 2],
  ['missing-3', 'The 2009 Magic’s usual starting five: Jameer Nelson, Courtney Lee, Hedo Türkoğlu, ___ and Dwight Howard.', ['Rashard Lewis', 'Mickaël Piétrus', 'Ryan Anderson', 'Brandon Bass'], 0],
  ['missing-3', 'The 2000 Pacers’ usual starting five: Mark Jackson, Reggie Miller, Jalen Rose, Dale Davis and ___?', ['Antonio Davis', 'Rik Smits', 'Jeff Foster', 'Sam Perkins'], 1],

  ['player-1', 'Drafted in 1984. Chicago Bulls and Washington Wizards. Six NBA championships and five MVP awards. Who is he?', ['Magic Johnson', 'Michael Jordan', 'Larry Bird', 'Hakeem Olajuwon'], 1],
  ['player-1', 'Drafted 13th in 1996. Played his entire NBA career for the Lakers. Five NBA titles. Known as the Black Mamba.', ['Tim Duncan', 'Dirk Nowitzki', 'Kobe Bryant', 'Paul Pierce'], 2],
  ['player-1', 'First pick in 1997. Spent his entire NBA career with San Antonio and won five championships.', ['Tim Duncan', 'Kevin Garnett', 'Karl Malone', 'David Robinson'], 0],
  ['player-1', 'Four NBA titles. Three straight Finals MVP awards from 2000 to 2002. Known as Shaq.', ['Shaquille O’Neal', 'Dwight Howard', 'Alonzo Mourning', 'Hakeem Olajuwon'], 0],
  ['player-2', 'Canadian point guard. Played for Phoenix, Dallas and the Lakers. Won back-to-back MVP awards in 2005 and 2006.', ['Chauncey Billups', 'Steve Nash', 'Jason Kidd', 'Chris Paul'], 1],
  ['player-2', 'Born in Germany. Played 21 NBA seasons for Dallas. Won the 2011 championship and Finals MVP.', ['Steve Nash', 'Dirk Nowitzki', 'Detlef Schrempf', 'Dennis Schröder'], 1],
  ['player-2', 'Born in Argentina. Played for Virtus Bologna and San Antonio. Four NBA titles and Olympic gold in 2004.', ['Luis Scola', 'Manu Ginóbili', 'Andrés Nocioni', 'Fabricio Oberto'], 1],
  ['player-2', 'Born in Barcelona. Played for Memphis, the Lakers, Chicago and San Antonio. Won NBA titles in 2009 and 2010.', ['Ricky Rubio', 'Marc Gasol', 'Pau Gasol', 'Juan Carlos Navarro'], 2],
  ['player-3', 'Greek guard. Won EuroLeague titles with Panathinaikos in 2007, 2009 and 2011. Six EuroLeague Best Defender awards.', ['Nick Calathes', 'Dimitris Diamantidis', 'Vassilis Spanoulis', 'Kostas Sloukas'], 1],
  ['player-3', 'Spanish guard. Played for Barcelona and the Memphis Grizzlies. Nicknamed La Bomba. EuroLeague MVP in 2009.', ['Pau Gasol', 'Rudy Fernández', 'Juan Carlos Navarro', 'Ricky Rubio'], 2],
  ['player-3', 'Born in Menorca. Joined Real Madrid in 2007. EuroLeague MVP in 2017 and scorer of the winning basket in the 2023 final.', ['Miloš Teodosić', 'Sergio Rodríguez', 'Sergio Llull', 'Nando de Colo'], 2],
  ['player-3', 'Serbian forward. Won EuroLeague titles with Panathinaikos and Barcelona. MVP of the 1998 FIBA World Championship.', ['Peja Stojaković', 'Dejan Bodiroga', 'Vlade Divac', 'Miloš Teodosić'], 1],
];

export const BUNDLED_QUESTIONS: readonly QuestionBankEntry[] = entries.map(([slotKey, question, options, correctIndex], index) => {
  const slot = findSlot(slotKey);
  if (!slot) throw new Error(`Unknown bundled question slot: ${slotKey}`);
  return { id: -(index + 1), category: slot.category, slotKey, points: slot.points, question, options, correctIndex };
});
