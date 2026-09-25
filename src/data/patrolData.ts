export interface PatrolLeader {
  name: string;
  period: string;
  isCurrent?: boolean;
}

export const PATROL_TESTAMENT = {
  title: 'Testament',
  text1:
    'Patrula Cormoran s-a născut în 2002 din dorința de a forma caractere, nu doar cercetași. Aici am învățat că adevărata putere nu stă în forță, ci în curaj, loialitate și prietenie. Drumul cercetășesc nu este mereu ușor, dar este unul care te învață să mergi drept, să ai grijă de cei de lângă tine și să lași lumea puțin mai bună decât ai găsit-o.',
  text2:
    'Indiferent cine veți fi și unde vă va purta viața, să nu uitați spiritul Cormoranului: ager și neînfricat – cu mintea limpede, inima curajoasă și privirea mereu înainte. Rămâneți uniți, respectați natura, ajutați fără a aștepta ceva în schimb și nu renunțați atunci când este greu.',
  text3: 'Cormoranul nu zboară singur și nu se teme de furtună. La fel să fiți și voi!',
  author: 'Andrei Moldovan, Fondatorul Patrulei Cormoran',
};

export const PATROL_HISTORY = {
  title: 'Scurt istoric',
  paragraph1:
    'Ideea înființării patrulei Cormoran a apărut după tabăra de vară de la Săcuieu-Vlădeasa din 2002. Numele patrulei a fost ales de Andrei Moldovan, care a creat și steagul patrulei.',
  paragraph2:
    'Data oficială a înființării patrulei poate fi considerată 5 octombrie 2002, atunci când a avut loc deschiderea de an.',
};

export const PATROL_LEADERS: PatrolLeader[] = [
  { name: 'Matei Oltean', period: '2025–2028', isCurrent: true },
  { name: 'Bogdan Maier', period: '2023–2025' },
  { name: 'Ștefan Goia', period: '2021–2023' },
  { name: 'Marcu Hruban', period: '2020–2021' },
  { name: 'Marian Farcaș', period: '2020' },
  { name: 'Victor Borodi-Rus', period: '2018–2020' },
  { name: 'Teiu Boilă', period: '2017–2018' },
  { name: 'Mihai Radu', period: '2016–2017' },
  { name: 'Iosif Sechelea', period: '2013–2016' },
  { name: 'Andrei Boilă', period: '2012–2013' },
  { name: 'Paul Suciu', period: '2010–2012' },
  { name: 'Cătă Dorneanu', period: '2009–2010' },
  { name: 'Alin Baciu', period: '2007–2009' },
  { name: 'Ciprian Dobocan', period: '2005–2007' },
  { name: 'Mihai Moruțan', period: '2003–2005' },
  { name: 'Andrei Moldovan', period: '2002–2003' },
];

export const SCOUT_LAWS: string[] = [
  'Cercetașul consideră o onoare faptul că i se acordă încredere.',
  'Cercetașul este loial patriei, părinților, șefilor și subordonaților săi.',
  'Cercetașul își ajută aproapele în orice împrejurare.',
  'Cercetașul este prietenul tuturor și fratele oricărui alt cercetaș.',
  'Cercetașul este politicos, generos și manierat.',
  'Cercetașul vede în natură creația Dumnezeu, iubește plantele și animalele.',
  'Cercetașul ascultă cu promptitudine și nu face nimic pe jumătate.',
  'Cercetașul este stăpân pe sine, surâde și cântă la greu.',
  'Cercetașul este chibzuit și econom.',
  'Cercetașul este curat în gânduri, vorbe și fapte.',
];

export const SCOUT_PRINCIPLES: string[] = [
  'Datoria cercetaşului începe acasă.',
  'Cercetaşul este fidel patriei sale.',
  'Fiu al creștinătății, cercetaşul este mândru de credinţa sa, el se străduie ca Împărăţia lui Dumnezeu să domnească în inima lui şi în lumea întreagă.',
];

export const SCOUT_VIRTUES: string[] = [
  'sinceritate',
  'devotament',
  'curăție',
];

export interface TrailInfo {
  name: string;
  colorHex: string;
  accentBorder: string;
  badgeBg: string;
  text: string;
}

export const SCOUT_TRAILS: TrailInfo[] = [
  {
    name: 'albă',
    colorHex: '#e2e8f0',
    accentBorder: 'border-slate-300/30',
    badgeBg: 'bg-slate-200 text-slate-900',
    text: 'spiritualitate, viață creștină, comportare generală',
  },
  {
    name: 'galbenă',
    colorHex: '#facc15',
    accentBorder: 'border-yellow-400/30',
    badgeBg: 'bg-yellow-400 text-slate-950',
    text: 'spirit cercetăşesc, spirit civic - lege, principii, promisiune, clase, viață cotidiană, istoria cercetăşiei',
  },
  {
    name: 'roșie',
    colorHex: '#ef4444',
    accentBorder: 'border-red-500/30',
    badgeBg: 'bg-red-600 text-white',
    text: 'prim ajutor, sport, sănătate, spirit de sacrificiu, tărie de caracter',
  },
  {
    name: 'albastră',
    colorHex: '#38bdf8',
    accentBorder: 'border-sky-400/30',
    badgeBg: 'bg-sky-500 text-slate-950',
    text: 'orientare, topografie, transmisiuni, cod morse, animație,',
  },
  {
    name: 'verde',
    colorHex: '#22c55e',
    accentBorder: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-600 text-white',
    text: 'tabără, tehnici de campism, construcții, focuri, bucătărie, intendență, naturalistică',
  },
];

export const PROMISE_SONG = {
  title: 'Cântecul promisiunii',
  strophes: [
    [
      'În fata voastră-mi dau acum',
      'Cuvântul de onor',
      'Și vreau să fiu demn de el',
      'Şi de-al meu Salvator.',
    ],
    [
      'Tu calea justă, dreaptă',
      'Arată-mi de sus,',
      'Primeşte-mi Promisiunea',
      'Domnul meu Isus.',
    ],
    [
      'Voi face-a Ta voință,',
      'Doamne, de acum,',
      'Şi țării jur credință',
      'În al meu drum.',
    ],
  ],
};

export const PROMISE_TEXT = {
  title: 'Textul promisiunii',
  text: 'Promit, pe onoarea mea, cu ajutorul harului lui Dumnezeu, să servesc din toate puterile mele, pe Dumnezeu, Biserica şi Patria, să-mi ajut aproapele în orice împrejurare și să respect legea cercetaşilor.',
};

export const BROTHERHOOD_MOTTO = {
  title: 'Cel mare îl ajută pe cel mic',
  paragraph1:
    'Această deviză, afișată la începutul proiectului nostru educativ, este valoarea fundamentală a cercetășiei.',
  paragraph2:
    'Protejarea tinerilor care ne sunt încredințați este o responsabilitate împărtășită de toți. Cercetașii Munților pun protecția copilului în centrul proiectului lor.',
};

export const SCOUT_SPIRIT = {
  title: 'Spiritul',
  paragraph1:
    'Cercetașii Munților propun o pedagogie a creșterii personale. Prin viața în natură, joc și responsabilitate, îi ajutăm pe tineri să devină adulți activi.',
  paragraph2:
    'Stilul nostru se caracterizează prin simplitate, naturalețe și entuziasm. O aventură trăită într-un spirit familial puternic.',
};
