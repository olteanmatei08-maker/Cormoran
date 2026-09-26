export interface BrevetItem {
  id: string;
  title: string;
  category: string;
  badgeCode: string;
  summary: string;
  probes: string[];
}

export const CARNET_BREVETE_CATEGORIES: {
  id: string;
  name: string;
  color: string;
  brevets: BrevetItem[];
}[] = [
  {
    id: 'misiune',
    name: 'Brevet Special',
    color: '#8b5cf6',
    brevets: [
      {
        id: 'brevet-misiune',
        title: 'Brevet „Misiune”',
        category: 'Special',
        badgeCode: 'MIS',
        summary: 'Singurul brevet ce poate fi acordat înainte de Clasa a II-a: aducerea unui prieten în cercetășie și sprijinirea lui până la Promisiune.',
        probes: [
          'Ajuți un prieten să cunoască cercetășia („a aduce pe cineva în cercetășie”).',
          'Noul-venit confirmă prin rămânerea în trupă și prin depunerea Promisiunii de Cercetaș.',
        ],
      },
    ],
  },
  {
    id: 'viata-crestina',
    name: 'I. Viața Creștină',
    color: '#3b82f6',
    brevets: [
      {
        id: 'brevet-liturghist',
        title: 'Brevet de Liturghist',
        category: 'Viața Creștină',
        badgeCode: 'LIT',
        summary: 'Aprofundarea spiritului și desfășurării Sfintei Liturghii și coordonarea momentelor liturgice în tabără.',
        probes: [
          'Cunoștințe aprofundate despre spiritul și părțile Sfintei Liturghii ca jertfă euharistică.',
          'Coordonarea participării cercetașilor la liturghie (atitudini corporale, cântări).',
          'Cunoașterea veșmintelor și a obiectelor bisericești.',
          'Pregătirea unei liturghii: alegerea cântecelor, pregătirea Apostolului și a răspunsurilor.',
          'Cunoașterea celor 7 Sacramente și a sărbătorilor anului bisericesc.',
          'Organizarea unui joc sau veghe spirituală pe baza Evangheliei.',
        ],
      },
      {
        id: 'brevet-evanghelist',
        title: 'Brevet de Evanghelist',
        category: 'Viața Creștină',
        badgeCode: 'EVG',
        summary: 'Cunoașterea solidă a doctrinei creștine și aprofundarea Noului Testament.',
        probes: [
          'Cunoștințe solide legate de doctrina creștină și simbolul Apostolilor (Crezul).',
          'Capacitatea de a explica motivele credinței în Cristos și în Biserică.',
          'Carnet religios cu reflecții personale, lecturi și pregătirea probelor patrulei.',
          'Studierea unui sacrament și explicarea ceremoniilor sale unui tânăr novice.',
        ],
      },
      {
        id: 'brevet-cititor-texte-sacre',
        title: 'Brevet de Cititor de texte sacre',
        category: 'Viața Creștină',
        badgeCode: 'CTS',
        summary: 'Proclamarea demnă a Sfintei Scripturi cu dicție, intonație și rugăciune interioară.',
        probes: [
          'Citirea cu voce tare și inteligibilă, respectând regulile de dicție și punctuație.',
          'Proclamarea lentă și pe ton potrivit a unui text sacru.',
          'Cunoștințe generale despre Scriptură ca și Cuvânt al lui Dumnezeu și relația Vechiul-Noul Testament.',
          'Obiceiul zilnic de a medita pasaje din Sfânta Scriptură.',
        ],
      },
    ],
  },
  {
    id: 'viata-natura',
    name: 'II. Viața în Natură',
    color: '#10b981',
    brevets: [
      {
        id: 'brevet-campism',
        title: 'Brevet de Campism',
        category: 'Viața în Natură',
        badgeCode: 'CMP',
        summary: 'Maeștrii instalării taberei, ai focului în orice condiții și ai protecției naturii.',
        probes: [
          'Organizarea rucsacului și a logisticii complete a patrulei.',
          'Alegerea amplasamentului ideal pentru tabără (pantă, vânt, sol, apă, lemne).',
          'Campare de minimum 25 de nopți cumulat cu igienă impecabilă.',
          'Aprinderea focului pe orice vreme (inclusiv ploaie/vânt) cu maximum 3 chibrite.',
          'Construirea unui rastel și a unui adăpost exclusiv din materiale naturale.',
          'Tehnologii de purificare a apei și lăsarea locului fără nicio urmă la plecare.',
        ],
      },
      {
        id: 'brevet-bucatar',
        title: 'Brevet de Bucătar',
        category: 'Viața în Natură',
        badgeCode: 'BUC',
        summary: 'Meniuri complete și echilibrate pe vatră ridicată sau la jar.',
        probes: [
          'Pornirea și alimentarea focurilor specifice: grătar, vânătoresc, indian, piramidal.',
          'Organizarea bucătăriei de patrulă: masa de lucru, vatra ridicată, suport vase.',
          'Coordonarea intendenței pentru 5 zile de tabără sau 2 weekenduri în bugetul patrulei.',
          'Pregătirea a 4 rețete vânătorești fără ustensile (carne în jar, ouă în cartof, frigărui).',
          'Construirea și utilizarea unui cuptor de tabără.',
        ],
      },
      {
        id: 'brevet-bucatar-munte',
        title: 'Brevet de Bucătar Saint-Bernard (de munte)',
        category: 'Viața în Natură',
        badgeCode: 'STB',
        summary: 'Gătit la altitudine, topirea zăpezii pentru apă potabilă și refaceri energetice.',
        probes: [
          'Colectarea apei potabile de la zăpada topită.',
          'Carnet cu rețete montane și gastronomie specifică muntelui.',
          'Gătit și aprindere de foc pe zăpadă, cuptor pe bază de pietre.',
          'Calculul rațiilor calorice și a greutății sacului de merinde pentru expediții lungi.',
        ],
      },
      {
        id: 'brevet-fochist',
        title: 'Brevet de Fochist',
        category: 'Viața în Natură',
        badgeCode: 'FOC',
        summary: 'Expertiza esențelor lemnoase, cremene, archet și prevenirea incendiilor.',
        probes: [
          'Cunoașterea a cel puțin 8 tipuri de focuri și a lemnului adecvat.',
          'Respectarea strictă a normelor P.S.I. și stingerea fără urme.',
          'Aprinderea focului pe ploaie în maxim 10 minute și menținerea lui.',
          'Aprinderea focului cu cremene, archet sau maximum 2 chibrite.',
          'Construirea focului hexagonal de veghe solemnă.',
        ],
      },
      {
        id: 'brevet-inginer-constructor',
        title: 'Brevet de Inginer Constructor',
        category: 'Viața în Natură',
        badgeCode: 'ING',
        summary: 'Construcții mărețe de pionierism: foișoare, catarge, turnuri și poduri.',
        probes: [
          'Calculul înălțimilor și diametrelor copacilor de la distanță.',
          'Planurile și machetele construcțiilor de patrulă (proporții, geometrie, forțe).',
          'Stăpânirea a 15 noduri și a îmbinărilor specifice pionierismului.',
          'Coordonarea echipei de cercetași în ridicarea porții, turnului sau podului.',
          'Tăierea și fasonarea arborilor uscați cu respectarea securității.',
        ],
      },
      {
        id: 'brevet-arhitect',
        title: 'Brevet de Arhitect',
        category: 'Viața în Natură',
        badgeCode: 'ARH',
        summary: 'Planuri cotate, desen arhitectural și armonia construcțiilor tradiționale.',
        probes: [
          'Regulile desenului tehnic și arhitectural cu instrumente de precizie.',
          'Studiul stilurilor arhitecturale istorice și al caselor tradiționale din zonă.',
          'Calculul volumelor, suprafețelor și rezistenței materialelor.',
          'Realizarea machetei detaliate a unui proiect cercetășesc.',
        ],
      },
      {
        id: 'brevet-cursa-orientare',
        title: 'Brevet Cursă de Orientare',
        category: 'Viața în Natură',
        badgeCode: 'ORI',
        summary: 'Stăpânirea hărții de orientare sportivă și a azimuturilor în teren variat.',
        probes: [
          'Orientare pe teren necunoscut cu hartă, busolă și determinarea Stelei Polare.',
          'Calculul declinației magnetice și al unghiurilor de marș.',
          'Pregătirea și arbitrarea unui traseu cu posturi de control pentru patrulă.',
        ],
      },
      {
        id: 'brevet-raider',
        title: 'Brevet de Raider',
        category: 'Viața în Natură',
        badgeCode: 'RAI',
        summary: 'Parcurgerea raidurilor aspre de anduranță în autonomie completă.',
        probes: [
          'Echipament de raid impecabil și minimalist.',
          'Parcurgerea unui traseu de 15 km (2/3 zi, 1/3 noapte) doar după busolă.',
          'Bivuac vânătoresc nocturn și meditație solicitată de Curtea de Onoare.',
        ],
      },
      {
        id: 'brevet-sanitar',
        title: 'Brevet de Sanitar',
        category: 'Viața în Natură',
        badgeCode: 'SAN',
        summary: 'Paza vieții și a sănătății fraților de patrulă.',
        probes: [
          'Alcătuirea și administrarea responsabilă a trusei de prim-ajutor.',
          'Intervenție promptă în caz de fracturi, hemoragii, arsuri, insolații și șoc.',
          'Realizarea celor 3 tipuri de targă și a bandajelor speciale (spic de grâu).',
          'Organizarea unui exercițiu de simulare a unui accident cu patrula.',
        ],
      },
      {
        id: 'brevet-prim-ajutor-munte',
        title: 'Brevet de Prim-ajutor la munte',
        category: 'Viața în Natură',
        badgeCode: 'MNT',
        summary: 'Protocoale speciale pentru hipotermie, degerături, rău de altitudine și epuizare.',
        probes: [
          'Prevenirea și tratarea hipotermiei, degerăturilor și arsurilor solare de creastă.',
          'Imobilizarea fracturilor în teren accidentat și tehnici de evacuare montană.',
          'Conduita în caz de avalanșă și mușcătură de viperă.',
        ],
      },
      {
        id: 'brevet-mesager',
        title: 'Brevet de Mesager',
        category: 'Viața în Natură',
        badgeCode: 'MSG',
        summary: 'Transmiterea discretă și rapidă a informațiilor pe orice teren.',
        probes: [
          'Parcurgerea unui traseu acvatic (50m) transportând un document uscat.',
          'Alergare 60m în 10 sec și 1km în 3min 52sec.',
          'Transmiterea verbală fidelă a unui mesaj de 25 cuvinte prin teren accidentat.',
          'Montarea unei linii de transmisie de 300m.',
        ],
      },
      {
        id: 'brevet-transmisionist',
        title: 'Brevet de Transmisionist',
        category: 'Viața în Natură',
        badgeCode: 'TRS',
        summary: 'Codul Morse și semaforul la mare distanță.',
        probes: [
          'Transmisie și recepție Morse cu stegulețe (20 litere/min).',
          'Transmisie cu lanterna (15 litere/min) și fluierul (16 litere/min).',
          'Transmisie radio cu stații de emisie-recepție.',
          'Susținerea unui atelier practic de Morse pentru patrulă.',
        ],
      },
      {
        id: 'brevet-intendent',
        title: 'Brevet de Intendent',
        category: 'Viața în Natură',
        badgeCode: 'INT',
        summary: 'Gestiunea resurselor, meniurilor, achizițiilor și conservării hranei.',
        probes: [
          'Calculul rațiilor nutriționale pe persoană și pe patrulă.',
          'Bugetarea completă a ieșirilor de weekend pe timp de 3 luni.',
          'Conservarea optimă a alimentelor în tabere lungi de vară.',
        ],
      },
    ],
  },
  {
    id: 'sport',
    name: 'III. Sport & Anduranță',
    color: '#ef4444',
    brevets: [
      {
        id: 'brevet-atlet',
        title: 'Brevet de Atlet',
        category: 'Sport',
        badgeCode: 'ATL',
        summary: 'Performanță fizică pe parcursul Hebert și testul Cooper.',
        probes: [
          'Parcurs Hebert complet în timp de top.',
          'Natație 50m liber și cățărare pe coardă 3m.',
          'Testul Cooper: alergare de cel puțin 2800m în 12 minute.',
          'Cunoașterea exercițiilor din Școala Alergării.',
        ],
      },
      {
        id: 'brevet-sport-echipa',
        title: 'Brevet de Sport de Echipă',
        category: 'Sport',
        badgeCode: 'ECH',
        summary: 'Fair-play exemplar și conducerea jocurilor colective.',
        probes: [
          'Arbitraj oficial conform regulamentului.',
          'Conduită exemplară fără penalizări pe durata a 5 meciuri.',
          'Organizarea a 3 jocuri sportive de echipă pentru trupă.',
        ],
      },
      {
        id: 'brevet-ciclist',
        title: 'Brevet de Ciclist',
        category: 'Sport',
        badgeCode: 'CIC',
        summary: 'Întreținerea bicicletei și expediții pe două roți de peste 50 km.',
        probes: [
          'Repararea penelor, lanțului, frânelor și luminilor.',
          'Respectarea strictă a codului rutier.',
          'Parcurgerea unui traseu de minim 50 km cu obiectiv clar.',
        ],
      },
      {
        id: 'brevet-alpinist',
        title: 'Brevet de Alpinist',
        category: 'Sport',
        badgeCode: 'ALP',
        summary: 'Cățărare pe stâncă, asigurare la ham, colțari, piolet și rapel.',
        probes: [
          'Stăpânirea ritmului de mers pe creste montane.',
          'Asigurare în coardă, amaraje, utilizarea pioletului și colțarilor.',
          'Coborâre în rapel și efectuarea a 4 trasee în 4 anotimpuri.',
        ],
      },
    ],
  },
  {
    id: 'oameni',
    name: 'IV. Descoperirea Oamenilor',
    color: '#f59e0b',
    brevets: [
      {
        id: 'brevet-explorator',
        title: 'Brevet de Explorator',
        category: 'Descoperirea Oamenilor',
        badgeCode: 'EXP',
        summary: 'Cunoașterea așezărilor, meșteșugurilor și tradițiilor locale în raiduri lungi.',
        probes: [
          'Echipament complet de explorator (hartă, busolă, curbimetru, carnet, cameră).',
          'Explorare de 3-4 zile (pe jos, barcă sau bicicletă) cu bivuac nocturn.',
          'Anchete sociologice, interviuri cu bătrânii satelor și caiet de explorare ilustrat.',
        ],
      },
      {
        id: 'brevet-jurnalist',
        title: 'Brevet de Jurnalist',
        category: 'Descoperirea Oamenilor',
        badgeCode: 'JUR',
        summary: 'Redactarea cronicilor de tabără, a revistei de trupă și a Cărții de Aur.',
        probes: [
          'Dactilografierea și machetarea corectă a articolelor.',
          'Editarea unui ziar de trupă sau patrulă.',
          'Scrierea de relatări captivante pentru Cartea de Aur.',
        ],
      },
      {
        id: 'brevet-topograf',
        title: 'Brevet de Topograf',
        category: 'Descoperirea Oamenilor',
        badgeCode: 'TOP',
        summary: 'Citirea hărților militare și realizarea profilelor altimetrice de teren.',
        probes: [
          'Estimarea distanțelor cu ochiul liber și confecționarea mirei.',
          'Trusă completă de topografie cu hârtie milimetrică și curvimetru.',
          'Realizarea profilelor de pantă după curbe de nivel și a machetelor în relief.',
        ],
      },
      {
        id: 'brevet-fotograf',
        title: 'Brevet de Fotograf',
        category: 'Descoperirea Oamenilor',
        badgeCode: 'FTO',
        summary: 'Fotografie de natură, compoziție, lumină și arhivă vizuală.',
        probes: [
          'Stăpânirea timpului de expunere, diafragmei și sensibilității ISO.',
          'Realizarea unei panorame foto și a unei serii de 20 de fotografii artistice.',
          'Inițierea unui frate mai mic în arta fotografică.',
        ],
      },
      {
        id: 'brevet-interpret',
        title: 'Brevet de Interpret',
        category: 'Descoperirea Oamenilor',
        badgeCode: 'INT',
        summary: 'Fluență într-o limbă străină și relații cercetășești internaționale.',
        probes: [
          'Conversație fluentă într-o limbă străină și traducerea rapidă a unui text.',
          'Citirea unei cărți și rezumarea ei în limba respectivă.',
          'Joc bilingv sau ghidarea unui oaspete străin.',
        ],
      },
    ],
  },
  {
    id: 'natura',
    name: 'V. Descoperirea Naturii',
    color: '#059669',
    brevets: [
      {
        id: 'brevet-meteorolog',
        title: 'Brevet de Meteorolog montan',
        category: 'Descoperirea Naturii',
        badgeCode: 'MET',
        summary: 'Prognoza vremii după cer, vânturi, barometru și nivologie.',
        probes: [
          'Structura atmosferei și variația temperaturii cu altitudinea.',
          'Recunoașterea norilor și a semnelor locale de schimbare a vremii.',
          'Nivologie: formarea zăpezii, metamorfoza cristalelor și riscul de avalanșă.',
          'Instalarea unui post meteo cu termometru, barometru și pluviometru.',
        ],
      },
      {
        id: 'brevet-astronom',
        title: 'Brevet de Astronom',
        category: 'Descoperirea Naturii',
        badgeCode: 'AST',
        summary: 'Harta cerului nocturn, identificarea constelațiilor și cadranul solar.',
        probes: [
          'Mișcarea astrelor, Steaua Polară și axa cerească.',
          'Identificarea marilor constelații de vară și iarnă (Ursa Mare, Orion, Cassiopeea).',
          'Construirea unui cadran solar și utilizarea unei lunete simple.',
        ],
      },
      {
        id: 'brevet-padurar',
        title: 'Brevet de Pădurar',
        category: 'Descoperirea Naturii',
        badgeCode: 'PAD',
        summary: 'Pază, silvicultură, cubaj și plantarea copacilor.',
        probes: [
          'Studiul esențelor dominante din pădure și densitatea arborilor.',
          'Determinarea cubajului a 5 arbori de talii diferite.',
          'Plantarea a cel puțin unui arbore anual și curățarea crengilor uscate.',
          'Colecție documentată de 25 de frunze și scoarțe.',
        ],
      },
      {
        id: 'brevet-botanist',
        title: 'Brevet de Botanist',
        category: 'Descoperirea Naturii',
        badgeCode: 'BOT',
        summary: 'Ierbare științifice, plante medicinale și ciuperci comestibile.',
        probes: [
          'Recunoașterea a 10 arbori/arbuști în orice anotimp.',
          'Identificarea a 5 plante comestibile și a 5 medicinale.',
          'Confecționarea unui ierbar cu 30 de plante etichetate științific.',
        ],
      },
      {
        id: 'brevet-naturalistica',
        title: 'Brevet de Naturalistică',
        category: 'Descoperirea Naturii',
        badgeCode: 'NAT',
        summary: 'Urme de animale, amprente în ghips și observarea faunei sălbatice.',
        probes: [
          'Recunoașterea a 8 urme de animale și turnarea lor în ghips.',
          'Recunoașterea cântecului a 16 păsări din România.',
          'Urmărirea urmelor de lup, vulpe, urs sau cerb.',
        ],
      },
    ],
  },
  {
    id: 'expresie',
    name: 'VI. Expresie & Animație',
    color: '#ec4899',
    brevets: [
      {
        id: 'brevet-animator',
        title: 'Brevet de Animator',
        category: 'Expresie',
        badgeCode: 'ANM',
        summary: 'Coordonarea focurilor de tabără, a jocurilor și a curbei veghii.',
        probes: [
          'Cunoașterea pe de rost a 20 de cântece cercetășești.',
          'Organizarea unei veghi de patrulă de 30 de minute cu succes deplin.',
          'Stăpânirea curbei veghii (trecerea de la joc la reculegere și rugăciune).',
        ],
      },
      {
        id: 'brevet-muzician',
        title: 'Brevet de Muzician',
        category: 'Expresie',
        badgeCode: 'MUZ',
        summary: 'Acompaniament la chitară/fluier și dirijarea canoanelor la veghe.',
        probes: [
          'Interpretarea fluentă la un instrument (chitară, fluier, acordeon etc.).',
          'Acompanierea cântecelor liturgice și de veghe ale trupei.',
          'Învățarea trupei a unui cântec nou pe două voci.',
        ],
      },
      {
        id: 'brevet-actor',
        title: 'Brevet de Actor & Marionetist',
        category: 'Expresie',
        badgeCode: 'ACT',
        summary: 'Scenete dramatice, umbre chinezești și teatru de păpuși la veghe.',
        probes: [
          'Mimă expresivă, grimase și joc actoricesc controlat.',
          'Construirea a 3 marionete din materiale naturale și realizarea unui spectacol.',
          'Punerea în scenă a unui fragment de teatru istoric sau biblic.',
        ],
      },
    ],
  },
];
