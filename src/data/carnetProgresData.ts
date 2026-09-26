export interface ProgresSection {
  id: string;
  title: string;
  badgeColor: string;
  description: string;
  poteci: {
    name: string;
    color: string;
    items: {
      type: 'MIBP' | 'Personalizată';
      category?: string;
      requirements: string[];
    }[];
  }[];
}

export const CARNET_PROGRES_DATA: {
  title: string;
  subtitle: string;
  publisher: string;
  introduction: string[];
  sections: ProgresSection[];
} = {
  title: 'Carnet de Progres pentru Cercetași și Cercetașe',
  subtitle: 'Poteci și Probe: Promisiune, Clasa a II-a, Clasa I',
  publisher: 'Asociația Cercetașii Munților (ACM)',
  introduction: [
    'Acest carnet îți este adresat pentru a te însoți în progresul tău, propunându-ți pentru fiecare nivel de progres în parte (Promisiune, Clasa a II-a, Clasa I) niște repere concrete pentru a înainta și a deveni un bun cercetaș.',
    'Pentru fiecare nivel există un minimum de cunoștințe și competențe pe care trebuie să le cunoască orice cercetaș din lume! Acest nivel minimum se numește MINIMUM INTERNAȚIONAL BADEN-POWELL (MIBP).',
    'Pe urmă este prezentat un set de exemple de probe personalizate. Dintre acestea, împreună cu șeful tău de patrulă, vei alege probele ce corespund cel mai bine nevoii tale de formare.',
    'Adu-ți aminte că un cercetaș nu face nimic pe jumătate. Toate probele trebuie să fie parcurse conform cu stilul cercetășesc: tot ceea ce faci trebuie să fie practic, estetic și calitativ.',
  ],
  sections: [
    {
      id: 'promisiunea',
      title: 'Promisiunea de Cercetaș (Aspirant)',
      badgeColor: '#2563eb',
      description: 'Perioada de observare și descoperire (3-6 luni), la sfârșitul căreia depui Promisiunea solemnă și primești eșarfa.',
      poteci: [
        {
          name: 'Probe MIBP de Aspirant',
          color: 'blue',
          items: [
            {
              type: 'MIBP',
              category: 'În patrula ta',
              requirements: [
                'În cadrul patrulei tale, ești primitor, generos și bun cu toți.',
                'Cunoști semnificația steagului și a strigătului de patrulă. Cunoști modul de viață al animalului patrulei.',
                'Preiei responsabilități în patrulă.',
              ],
            },
            {
              type: 'MIBP',
              category: 'Totdeauna gata!',
              requirements: [
                'Cunoști legea și principiile, poți să le explici.',
                'Porți uniforma cu mândrie și știi la ce te angajează! Cunoști semnificația uniformei și a însemnelor.',
                'Cunoști semnificația salutului cercetășesc.',
                'Te străduiești să faci Fapta Bună în fiecare zi!',
                'Îți faci patul zilnic, camera ta este în ordine.',
                'Îți faci igiena în fiecare zi, dimineața și seara (te schimbi complet înainte de a intra în sacul de dormit).',
                'Ai mereu cele 5 obiecte cu tine.',
                'Cunoști semnalele Morse principale folosite pentru anunțuri (intendență, careu, coborârea steagurilor s.a).',
                'Ești mereu curat, cu hainele în ordine, în uniformă impecabilă.',
                'Ești punctual la activități (ajungi la ora fixată).',
              ],
            },
            {
              type: 'MIBP',
              category: 'Viața cercetășească & Credință',
              requirements: [
                'Știi cine este Baden-Powell.',
                'Cunoști Cântecul Promisiunii.',
                'Îți faci rucsacul pentru o ieșire cu noapte inclusă singur: echilibrat și fără lucruri inutile.',
                'Ai un carnet de cântece de care ai grijă.',
                'Ți-ai început carnetul de vânătoare.',
                'Știi să legi două sfori între ele (nod plat).',
                'Meditezi la Promisiunea ta o jumătate de oră în fața focului de veghe, singur.',
                'Cunoști rugăciunile „Tatăl nostru”, „Născătoare de Dumnezeu”, „Crezul”.',
                'Te străduiești să te rogi zilnic și cunoști Rugăciunea Cercetașului.',
              ],
            },
          ],
        },
        {
          name: 'Probe Personalizate de Aspirant',
          color: 'emerald',
          items: [
            {
              type: 'Personalizată',
              category: 'Spiritualitate & Spirit civic',
              requirements: [
                'Urmărești liturghia cu ajutorul carnetului de liturghie.',
                'Prin lectură, descoperi viața unui sfânt și povestești patrulei despre el.',
                'Știi când s-a înființat Asociația Cercetașii Munților.',
                'Îți ajuți întotdeauna părinții la treburile casnice și frații mai mici.',
                'Te ocupi cu atenție de bunul mers al situației tale școlare.',
                'Te implici în cel puțin două acțiuni de ecologizare.',
              ],
            },
            {
              type: 'Personalizată',
              category: 'Bivuac, Tehnici & Aventură',
              requirements: [
                'Aprinzi un foc și îl întreții conform regulilor de siguranță.',
                'Știi să faci nodurile: plat, cabestan, scaun, pescar și le cunoști utilitatea.',
                'Îți faci Nodul Promisiunii.',
                'La un joc Kim recunoști 70% din obiecte.',
                'Cunoști semnele de pistă și poți urmări un traseu până la capăt.',
                'Știi să găsești Nordul cu ajutorul Stelei Polare.',
                'Parcurgi un raid de 6-12 ore cu un alt cercetaș, cu echipament complet.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'clasa-2',
      title: 'Clasa a II-a (Stâlpul Patrulei)',
      badgeColor: '#10b981',
      description: 'Un cercetaș de clasa a II-a este sigur pe sine, pilon de sprijin în patrulă și gata de dăruire.',
      poteci: [
        {
          name: 'Poteca Albă: Spiritualitate',
          color: 'slate',
          items: [
            {
              type: 'MIBP',
              requirements: [
                'Discuție cu preotul despre progresul spiritual: liturghie, rugăciune, spovadă, sacramente.',
                'Prezinți exemple ale legăturii dintre Legea cercetașilor și textele Scripturii.',
                'Citești o Evanghelie completă.',
                'Pregătești și animi o parte dintr-o veghe plecând de la Noul Testament.',
                'Cunoști sărbătorile anului liturgic și le transmiți patrulei.',
                'Știi să faci liniște în natură pentru a-l asculta pe Dumnezeu.',
              ],
            },
          ],
        },
        {
          name: 'Poteca Galbenă: Spirit Civic și Cercetășesc',
          color: 'amber',
          items: [
            {
              type: 'MIBP',
              requirements: [
                'Ajuți un aspirant să înțeleagă Legea și principiile.',
                'Cunoști 3 personalități marcante ale cercetășiei mondiale.',
                'Cunoști și poți cânta cântecul „Doamna Cercetașilor”.',
                'Cunoști tresele și însemnele de pe uniformă.',
                'Cunoști semnificația ceremonialului de ridicare a drapelului.',
                'Pregătești un joc cu 10 momente importante din istoria României.',
              ],
            },
          ],
        },
        {
          name: 'Poteca Roșie: Sport și Prim-Ajutor',
          color: 'red',
          items: [
            {
              type: 'MIBP',
              requirements: [
                'Participi pe deplin la un mare joc cu fair-play și cunoștințe tehnice.',
                'Te inițiezi în tehnici de prim-ajutor: hemoragii, insolație, arsuri, fracturi, PAI.',
                'Respecți igiena corporală riguroasă și practici regulat activitate fizică.',
                'Poți alerga 20 de minute continuu sau înoți 400 m.',
                'Cunoști termenii de septic și aseptic și numerele naționale de urgență.',
              ],
            },
          ],
        },
        {
          name: 'Poteca Albastră: Aventură & Expresie',
          color: 'sky',
          items: [
            {
              type: 'MIBP',
              requirements: [
                'Te orientezi cu harta, o înnordezi și calculezi distanțe pe baza semnelor convenționale.',
                'Ghidezi patrula cu busola pe un traseu dat.',
                'Realizezi un crochiu topografic și un crochiu panoramic.',
                'Cunoști codul Morse (cifrare, descifrare) și transmiți cu fluierul/lanterna.',
                'Prezinți un personaj la veghe folosind umbre chinezești sau marionete.',
              ],
            },
          ],
        },
        {
          name: 'Poteca Verde: Campism',
          color: 'emerald',
          items: [
            {
              type: 'MIBP',
              requirements: [
                'Ai campat minimum 10 nopți la cort cu aprecierea șefilor.',
                'Știi să utilizezi un topor și un fierăstrău și te ocupi de întreținerea lor.',
                'Pui în aplicare focurile: de veghe, de gătit, polinezian.',
                'Identifici 5 rășinoase și 10 foioase și cunoști puterea lor calorică.',
                'Raidul de Clasa a II-a: minim 10 ore, până la 20 km cu hartă și busolă.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'clasa-1',
      title: 'Clasa I (Liderul și Animatorul)',
      badgeColor: '#dc2626',
      description: 'Cercetașul de elită: animator, pedagog, organizator și model viu pentru toată trupa.',
      poteci: [
        {
          name: 'Poteca Albă: Spiritualitate Aprofundată',
          color: 'slate',
          items: [
            {
              type: 'MIBP',
              requirements: [
                'Cunoaștere elementară a misterelor de credință (Treimea, Întruparea, Mântuirea).',
                'Ai citit toate cele 4 Evanghelii.',
                'Poți explica pe scurt fiecare dintre cele 7 sacramente ale Bisericii.',
                'Corelezi fiecare Lege cercetășească cu pasaje din Noul Testament.',
                'CDO a validat rolul tău în pregătirea promisiunii unui membru din patrulă.',
              ],
            },
          ],
        },
        {
          name: 'Poteca Galbenă: Civism & Europa',
          color: 'amber',
          items: [
            {
              type: 'MIBP',
              requirements: [
                'Cunoști marile momente istorice ale țării și le transmiți trupei prin scenete.',
                'Cunoști instituțiile europene și rădăcinile creștine ale continentului.',
                'Organizezi un mare joc sau o veghe dedicată istoriei și culturii.',
                'Înțelegi funcționarea instituțiilor democratice și a administrației locale.',
              ],
            },
          ],
        },
        {
          name: 'Poteca Roșie: Sport, Prim-Ajutor & Serviciu',
          color: 'red',
          items: [
            {
              type: 'MIBP',
              requirements: [
                'Înoți 100m craul continuu și tractezi un manechin 50m pentru simulare salvare.',
                'Ai obținut atestarea competențelor de prim-ajutor prin examen.',
                'Știi conduita PAI: Protejează, Alertează, Intervine.',
                'Demonstrezi spirit de cavalerism și pui în practică Legea a 3-a prin serviciu comunitar.',
              ],
            },
          ],
        },
        {
          name: 'Poteca Albastră: Explorare, Transmisiuni & Artă',
          color: 'sky',
          items: [
            {
              type: 'MIBP',
              requirements: [
                'Explorare de 2 zile cu alți 2 cercetași: traseu, masă vânătorească, raport ilustrat.',
                'Punct de stație cu triangulație și coordonarea unei curse de orientare.',
                'Transmisiuni Morse complete în cadență normală, zi și noapte.',
                'Organizezi și coordonezi integral o veghe solemnă de trupă.',
              ],
            },
          ],
        },
        {
          name: 'Poteca Verde: Pionierism & Campism Avansat',
          color: 'emerald',
          items: [
            {
              type: 'MIBP',
              requirements: [
                'Ai campat cel puțin 30 de zile cumulat cu apreciere excelentă.',
                'Stăpânești tehnica lemnului: îmbinări la 45°, chertări, cuie de lemn, burghiu.',
                'Construiești adăpost de tip colibă fără prelată, capabil să reziste la intemperii.',
                'Supervizezi și pregătești o masă caldă pentru patrulă în mai puțin de o oră.',
                'Raidul de Clasa I: 24-36 de ore singur în natură, cu bivuac vânătoresc.',
              ],
            },
          ],
        },
      ],
    },
  ],
};
