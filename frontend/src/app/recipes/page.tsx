'use client';

import { useState } from 'react';
import { Clock, Users, ChevronDown, ChevronUp, Search } from 'lucide-react';

type Meal = 'breakfast' | 'lunch' | 'dinner';

interface Recipe {
  id: number;
  name: string;
  meal: Meal;
  time: string;
  servings: number;
  benefit: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
}

const RECIPES: Recipe[] = [
  // === DORUČAK (7) ===
  {
    id: 1,
    name: 'Zobena kaša s bobičastim voćem i orasima',
    meal: 'breakfast',
    time: '10 min',
    servings: 1,
    benefit: 'Bogata omega-3 masnim kiselinama i antioksidansima za zdravlje krvnih žila',
    ingredients: [
      '50g zobenih pahuljica',
      '200ml vode ili biljnog mlijeka',
      '1 šaka borovnica',
      '1 šaka malina',
      '1 žlica oraha (nasjeckanog)',
      '1 žličica meda',
      'Cimet po želji',
    ],
    steps: [
      'Zobene pahuljice kuhajte u vodi/mlijeku 5 min na srednje jakoj vatri.',
      'Prelijte u zdjelicu, dodajte bobičasto voće.',
      'Pospite orasima, medom i cimetom.',
    ],
    tags: ['omega-3', 'antioksidansi', 'vlakna'],
  },
  {
    id: 2,
    name: 'Mediteranski omlet sa špinatom i fetom',
    meal: 'breakfast',
    time: '15 min',
    servings: 1,
    benefit: 'Bogat folatom i željezom, pomaže u proizvodnji crvenih krvnih stanica',
    ingredients: [
      '2 jaja',
      '1 šaka mladog špinata',
      '30g feta sira',
      '4-5 cherry rajčica (prepolovljenih)',
      '1 žlica maslinovog ulja',
      'Sol, papar',
    ],
    steps: [
      'Zagrijte maslinovo ulje u tavi na srednje jakoj vatri.',
      'Dodajte špinat, pirjajte 1-2 minute dok ne spadne.',
      'Umutite jaja s malo soli i papra, prelijte špinat.',
      'Kad se dno stisne, dodajte fetu i rajčice na jednu polovicu.',
      'Preklopite omlet, kuhajte još 1-2 minute.',
    ],
    tags: ['proteini', 'folat', 'željezo'],
  },
  {
    id: 3,
    name: 'Avokado tost s dimljenim lososom',
    meal: 'breakfast',
    time: '10 min',
    servings: 1,
    benefit: 'Omega-3 masne kiseline poboljšavaju cerebralni protok krvi',
    ingredients: [
      '2 kriške integralnog kruha',
      '1 zreli avokado',
      '60g dimljenog lososa',
      'Sok od pola limuna',
      'Sjemenke čije (opcionalno)',
      'Sol, papar, crvene papričice',
    ],
    steps: [
      'Prepecite kruh.',
      'Zdrobite avokado vilicom, začinite limunovim sokom, solju i paprom.',
      'Namažite avokado na tost, stavite dimljeni losos.',
      'Pospite sjemenkama čije i crvenim papričicama.',
    ],
    tags: ['omega-3', 'zdrave masti', 'vlakna'],
  },
  {
    id: 4,
    name: 'Smoothie od banane, špinata i lanenih sjemenki',
    meal: 'breakfast',
    time: '5 min',
    servings: 1,
    benefit: 'Hidracija + folat + omega-3 u jednom obroku — idealno za jutarnju hidrataciju',
    ingredients: [
      '1 banana',
      '1 šaka mladog špinata',
      '1 žlica mljevenih lanenih sjemenki',
      '200ml biljnog mlijeka (bademovo/zobreno)',
      '1 žličica meda',
    ],
    steps: [
      'Sve sastojke stavite u blender.',
      'Miksajte 30-60 sekundi dok ne bude glatko.',
      'Poslužite odmah.',
    ],
    tags: ['hidracija', 'omega-3', 'vitamini'],
  },
  {
    id: 5,
    name: 'Grčki jogurt s orasima, medom i smokvama',
    meal: 'breakfast',
    time: '5 min',
    servings: 1,
    benefit: 'Kalcij za kosti, probiotici za imunitet, orasi za mozak',
    ingredients: [
      '200g grčkog jogurta (punomasnog)',
      '2 svježe smokve (ili 3 suhe, narezane)',
      '1 žlica mješavine orašastih plodova',
      '1 žličica meda',
      'Sjemenke suncokreta (opcionalno)',
    ],
    steps: [
      'Prelijte jogurt u zdjelicu.',
      'Narežite smokve, rasporedite po vrhu.',
      'Pospite orasima, sjemenkama i prelijte medom.',
    ],
    tags: ['probiotici', 'kalcij', 'antioksidansi'],
  },
  {
    id: 6,
    name: 'Palačinke od heljde s voćem',
    meal: 'breakfast',
    time: '20 min',
    servings: 2,
    benefit: 'Heljda je bez glutena, bogata rutinom koji jača krvne žile',
    ingredients: [
      '100g heljdinog brašna',
      '1 jaje',
      '200ml mlijeka',
      'Prstohvat soli',
      'Maslinovo ulje za pečenje',
      'Svježe voće za posluživanje (jagode, borovnice)',
      'Med ili agavin sirup',
    ],
    steps: [
      'Pomiješajte brašno, jaje, mlijeko i sol u glatko tijesto.',
      'Zagrijte tavu s malo maslinovog ulja.',
      'Pecite tanke palačinke s obje strane (1-2 min po strani).',
      'Poslužite s voćem i medom.',
    ],
    tags: ['bez glutena', 'rutin', 'energija'],
  },
  {
    id: 7,
    name: 'Shakshuka (jaja u umaku od rajčice)',
    meal: 'breakfast',
    time: '25 min',
    servings: 2,
    benefit: 'Likopen iz rajčice štiti krvne žile, proteini iz jaja za oporavak',
    ingredients: [
      '1 žlica maslinovog ulja',
      '1 luk (narezan)',
      '1 paprika (narezana)',
      '400g konzerviranih rajčica',
      '1 žličica kumina',
      '1 žličica paprike',
      '4 jaja',
      'Svježi peršin',
      'Sol, papar',
    ],
    steps: [
      'Na maslinovom ulju pirjajte luk i papriku 5 min.',
      'Dodajte rajčice, kumin, papriku, sol i papar. Kuhajte 10 min.',
      'Žlicom napravite 4 udubine u umaku, razbijte po jaje u svaku.',
      'Poklopite, kuhajte 5-7 min dok se bjelanjci ne stisnu.',
      'Pospite peršinom i poslužite s kruhom.',
    ],
    tags: ['likopen', 'proteini', 'vitamini'],
  },

  // === RUČAK (7) ===
  {
    id: 8,
    name: 'Salata od quinoe s pečenim povrćem',
    meal: 'lunch',
    time: '35 min',
    servings: 2,
    benefit: 'Kompletan protein + željezo + magnezij — podržava cerebralnu cirkulaciju',
    ingredients: [
      '150g quinoe',
      '1 tikvica (narezana)',
      '1 crvena paprika (narezana)',
      '1 patlidžan (narezan)',
      '200g cherry rajčica',
      '3 žlice maslinovog ulja',
      'Sok od 1 limuna',
      '50g feta sira',
      'Svježa menta i peršin',
      'Sol, papar',
    ],
    steps: [
      'Kuhajte quinou prema uputama na pakiranju. Ocijedite i ohladite.',
      'Povrće izmiješajte s 2 žlice maslinovog ulja, solju i paprom.',
      'Pecite na 200°C 20 min.',
      'Pomiješajte quinou s pečenim povrćem.',
      'Začinite limunovim sokom i preostalim uljem.',
      'Pospite fetom i svježim biljem.',
    ],
    tags: ['proteini', 'magnezij', 'vlakna'],
  },
  {
    id: 9,
    name: 'Pečeni losos s batatom i brokulom',
    meal: 'lunch',
    time: '30 min',
    servings: 2,
    benefit: 'Najbogatiji izvor omega-3 DHA za zaštitu moždanih krvnih žila',
    ingredients: [
      '2 fileta lososa (po 150g)',
      '2 srednja batata (narezana na kolutiće)',
      '300g brokule (razdijeljene na cvjetiće)',
      '2 žlice maslinovog ulja',
      '2 režnja češnjaka (nasjeckanog)',
      'Sok od pola limuna',
      'Sol, papar, timijan',
    ],
    steps: [
      'Zagrijte pećnicu na 200°C.',
      'Batate rasporedite na pleh, pokapajte uljem, posolite. Pecite 10 min.',
      'Dodajte brokulu i lososa (kožom dolje) na pleh.',
      'Lososa namažite češnjakom, limunovim sokom i timijanom.',
      'Pecite još 15 min.',
    ],
    tags: ['omega-3', 'vitamin D', 'antioksidansi'],
  },
  {
    id: 10,
    name: 'Minestrone juha',
    meal: 'lunch',
    time: '40 min',
    servings: 4,
    benefit: 'Bogata vlaknima i antioksidansima, niska razina natrija — regulira krvni tlak',
    ingredients: [
      '2 žlice maslinovog ulja',
      '1 luk, 2 mrkve, 2 stabljike celera (narezano)',
      '2 režnja češnjaka',
      '400g konzerviranih rajčica',
      '1L pilećeg temeljca (niski natrij)',
      '200g zelenog graha (smrznutog)',
      '100g makarona (male)',
      '1 tikvica (narezana)',
      'Svježi bosiljak',
      'Parmezan za posluživanje',
    ],
    steps: [
      'Na maslinovom ulju pirjajte luk, mrkve i celer 5 min.',
      'Dodajte češnjak, pirjajte 1 min.',
      'Dodajte rajčice, temeljac. Zakuhajte.',
      'Dodajte tjesteninu, tikvicu i grašak. Kuhajte 15 min.',
      'Začinite solju i paprom, poslužite s bosiljkom i parmezanom.',
    ],
    tags: ['vlakna', 'niski natrij', 'hidracija'],
  },
  {
    id: 11,
    name: 'Piletina na žaru s tabbouleh salatom',
    meal: 'lunch',
    time: '30 min',
    servings: 2,
    benefit: 'Nemasni proteini za oporavak, bulgur za stabilnu energiju bez šećernih skokova',
    ingredients: [
      '2 pileća prsa',
      '100g bulgura',
      '1 veliki svežanj peršina (sitno nasjeckan)',
      '1/2 svežnja mente (sitno nasjeckana)',
      '3 rajčice (narezane na kockice)',
      '1 krastavac (narezan na kockice)',
      '3 žlice maslinovog ulja',
      'Sok od 1 limuna',
      'Sol, papar, kumin',
    ],
    steps: [
      'Bulgur prelijte vrelom vodom, poklopite, ostavite 15 min. Ocijedite.',
      'Piletinu začinite solju, paprom i kuminom. Ispecite na žaru 6-7 min po strani.',
      'Pomiješajte bulgur s peršinom, mentom, rajčicama i krastavcem.',
      'Začinite maslinovim uljem i limunovim sokom.',
      'Narežite piletinu, poslužite na tabbouleh salati.',
    ],
    tags: ['proteini', 'vlakna', 'vitamin C'],
  },
  {
    id: 12,
    name: 'Rižoto od povrća s kurkumom',
    meal: 'lunch',
    time: '35 min',
    servings: 2,
    benefit: 'Kurkuma ima protuupalna svojstva koja pomažu zaštiti krvne žile',
    ingredients: [
      '200g arborio riže',
      '1 luk (sitno narezan)',
      '1 mrkva (narezana na kockice)',
      '100g graška',
      '100g šampinjona (narezanih)',
      '750ml povrtnog temeljca (toplog)',
      '1 žličica kurkume',
      '2 žlice maslinovog ulja',
      '30g parmezana',
      'Sol, papar',
    ],
    steps: [
      'Na maslinovom ulju pirjajte luk 3 min.',
      'Dodajte rižu, miješajte 1 min.',
      'Dodajte kurkumu, zatim postupno dodajte topli temeljac (šalicu po šalicu), miješajte.',
      'Kada je riža upola gotova, dodajte mrkvu, šampinjone i grašak.',
      'Kuhajte dok riža ne bude al dente (oko 18 min ukupno).',
      'Umiješajte parmezan, začinite solju i paprom.',
    ],
    tags: ['protuupalno', 'kurkuma', 'vlakna'],
  },
  {
    id: 13,
    name: 'Leća dhal s naan kruhom',
    meal: 'lunch',
    time: '30 min',
    servings: 3,
    benefit: 'Leća je bogata folatom i željezom — ključno za proizvodnju krvnih stanica',
    ingredients: [
      '200g crvene leće',
      '1 luk (narezan)',
      '2 režnja češnjaka',
      '1 žlica curry paste',
      '400ml kokosovog mlijeka',
      '400ml vode',
      '1 žlica maslinovog ulja',
      'Svježi korijandar',
      'Naan kruh za posluživanje',
    ],
    steps: [
      'Na maslinovom ulju pirjajte luk 3 min.',
      'Dodajte češnjak i curry pastu, pirjajte 1 min.',
      'Dodajte leću, kokosovo mlijeko i vodu.',
      'Kuhajte 20 min dok leća ne bude mekana.',
      'Pospite korijandrom, poslužite s naan kruhom.',
    ],
    tags: ['folat', 'željezo', 'biljni proteini'],
  },
  {
    id: 14,
    name: 'Pasta s umakom od rajčice i sardina',
    meal: 'lunch',
    time: '25 min',
    servings: 2,
    benefit: 'Sardine su bogate omega-3, vitaminom D i kalcijem',
    ingredients: [
      '200g pune integralne tjestenine',
      '1 konzerva sardina u maslinovom ulju',
      '400g passate od rajčice',
      '2 režnja češnjaka (nasjeckanog)',
      '1 žlica kapara',
      'Crvene papričice (opcionalno)',
      'Svježi peršin',
      'Sol, papar',
    ],
    steps: [
      'Kuhajte tjesteninu prema uputama. Ocijedite.',
      'U tavi zagrijte ulje iz konzerve sardina s češnjakom 1 min.',
      'Dodajte passatu, kapare i papričice. Kuhajte 10 min.',
      'Dodajte sardine (grubo izlomljene) i tjesteninu.',
      'Promiješajte, pospite peršinom.',
    ],
    tags: ['omega-3', 'kalcij', 'vitamin D'],
  },

  // === VEČERA (6) ===
  {
    id: 15,
    name: 'Pečena riba s mediteranskim povrćem',
    meal: 'dinner',
    time: '30 min',
    servings: 2,
    benefit: 'Lagan obrok bogat proteinima i omega-3 — idealan za večeru bez opterećenja cirkulacije',
    ingredients: [
      '2 fileta bijele ribe (brancin ili orada, po 150g)',
      '1 tikvica (narezana)',
      '1 crvena paprika (narezana)',
      '200g cherry rajčica',
      '1/2 crvenog luka (narezan)',
      '50g maslina',
      '3 žlice maslinovog ulja',
      'Svježi ružmarin i timijan',
      'Sol, papar, limun',
    ],
    steps: [
      'Zagrijte pećnicu na 190°C.',
      'Povrće rasporedite na pleh, pokapajte uljem, začinite.',
      'Pecite 10 min.',
      'Ribu stavite na povrće, pokapajte limunovim sokom.',
      'Pecite još 12-15 min dok riba ne bude gotova.',
    ],
    tags: ['omega-3', 'lagan obrok', 'proteini'],
  },
  {
    id: 16,
    name: 'Juha od butternut tikve s đumbirom',
    meal: 'dinner',
    time: '35 min',
    servings: 3,
    benefit: 'Beta-karoten iz tikve + protuupalni đumbir — topao, lagan obrok za večer',
    ingredients: [
      '500g butternut tikve (ogulite, narežite na kocke)',
      '1 luk (narezan)',
      '2 cm svježeg đumbira (naribanog)',
      '600ml povrtnog temeljca',
      '100ml kokosovog mlijeka',
      '1 žlica maslinovog ulja',
      'Sol, papar, muškatni oraščić',
      'Bučine sjemenke za posluživanje',
    ],
    steps: [
      'Na maslinovom ulju pirjajte luk 3 min.',
      'Dodajte tikvu i đumbir, pirjajte 2 min.',
      'Dodajte temeljac, kuhajte 20 min dok tikva ne omekša.',
      'Izblendajte štapnim mikserom do glatke kreme.',
      'Umiješajte kokosovo mlijeko, začinite.',
      'Pospite bučinim sjemenkama.',
    ],
    tags: ['beta-karoten', 'protuupalno', 'lagan obrok'],
  },
  {
    id: 17,
    name: 'Grčka salata s puretinom na žaru',
    meal: 'dinner',
    time: '20 min',
    servings: 2,
    benefit: 'Niskokalorični obrok bogat proteinima, polifenolima iz maslinovog ulja',
    ingredients: [
      '200g purećeg fileta',
      '2 rajčice (narezane)',
      '1 krastavac (narezan)',
      '1/2 crvenog luka (narezan u prstenove)',
      '100g feta sira',
      '50g kalamata maslina',
      '2 žlice maslinovog ulja',
      'Origano, sol, papar',
      'Sok od pola limuna',
    ],
    steps: [
      'Puretinu začinite solju, paprom i origanom.',
      'Ispecite na žaru ili tavi 5-6 min po strani.',
      'Rasporedite povrće na tanjur.',
      'Dodajte fetu i masline.',
      'Narežite puretinu, stavite na salatu.',
      'Prelijte maslinovim uljem i limunovim sokom.',
    ],
    tags: ['proteini', 'polifenoli', 'lagan obrok'],
  },
  {
    id: 18,
    name: 'Punjena paprika s kvinojom i povrćem',
    meal: 'dinner',
    time: '40 min',
    servings: 2,
    benefit: 'Biljni proteini + vlakna — stabilizira šećer u krvi kroz noć',
    ingredients: [
      '4 paprike (izrezati gornji dio, očistiti)',
      '100g quinoe (kuhane)',
      '1 tikvica (sitno narezana)',
      '100g šampinjona (narezanih)',
      '1 luk (sitno narezan)',
      '50g sira (naribani)',
      '1 žlica maslinovog ulja',
      'Sol, papar, dimljena paprika',
    ],
    steps: [
      'Zagrijte pećnicu na 180°C.',
      'Na maslinovom ulju pirjajte luk, tikvicu i šampinjone 5 min.',
      'Pomiješajte s kuhanom quinoom, začinite.',
      'Napunite paprike, pospite sirom.',
      'Pecite 25 min dok paprike ne omekšaju.',
    ],
    tags: ['biljni proteini', 'vlakna', 'vitamini'],
  },
  {
    id: 19,
    name: 'Tuna salata s bijelim grahom i rukolom',
    meal: 'dinner',
    time: '10 min',
    servings: 2,
    benefit: 'Brz i lagan obrok bogat omega-3 i biljnim vlaknima',
    ingredients: [
      '1 konzerva tune u maslinovom ulju (ocijeđena)',
      '1 konzerva bijelog graha (ocijeđena i isprana)',
      '2 šake rukole',
      '1/2 crvenog luka (tenko narezan)',
      '100g cherry rajčica (prepolovljenih)',
      '2 žlice maslinovog ulja',
      'Sok od 1 limuna',
      'Sol, papar',
    ],
    steps: [
      'Pomiješajte bijeli grah, rukolu, luk i rajčice u zdjeli.',
      'Dodajte tunu (grubo izlomljenu).',
      'Začinite maslinovim uljem, limunom, solju i paprom.',
    ],
    tags: ['omega-3', 'vlakna', 'brz obrok'],
  },
  {
    id: 20,
    name: 'Krem juha od brokule s bademovim mlijekom',
    meal: 'dinner',
    time: '25 min',
    servings: 2,
    benefit: 'Brokula je bogata vitaminom K koji pomaže u regulaciji koagulacije krvi',
    ingredients: [
      '400g brokule (razdijeljene na cvjetiće)',
      '1 luk (narezan)',
      '1 režanj češnjaka',
      '400ml povrtnog temeljca',
      '100ml bademovog mlijeka',
      '1 žlica maslinovog ulja',
      'Sol, papar, muškatni oraščić',
      'Bučino ulje za posluživanje',
    ],
    steps: [
      'Na maslinovom ulju pirjajte luk i češnjak 3 min.',
      'Dodajte brokulu i temeljac, kuhajte 15 min.',
      'Izblendajte štapnim mikserom.',
      'Umiješajte bademovo mlijeko, začinite.',
      'Poslužite s par kapi bučinog ulja.',
    ],
    tags: ['vitamin K', 'antioksidansi', 'lagan obrok'],
  },
];

const mealLabels: Record<Meal, string> = {
  breakfast: 'Doručak',
  lunch: 'Ručak',
  dinner: 'Večera',
};

const mealEmoji: Record<Meal, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
};

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{mealEmoji[recipe.meal]}</span>
            <span className="badge bg-primary-50 text-primary-700 text-xs">{mealLabels[recipe.meal]}</span>
          </div>
          <h3 className="font-semibold text-neutral-900 text-lg">{recipe.name}</h3>
          <p className="text-sm text-primary-600 mt-1">{recipe.benefit}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
            <span className="flex items-center gap-1"><Clock size={14} /> {recipe.time}</span>
            <span className="flex items-center gap-1"><Users size={14} /> {recipe.servings} {recipe.servings === 1 ? 'porcija' : 'porcije'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {recipe.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="btn-ghost w-full mt-4 text-sm"
      >
        {expanded ? 'Sakrij recept' : 'Prikaži recept'}
        {expanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">Sastojci</h4>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-neutral-700 flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  {ing}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">Priprema</h4>
            <ol className="space-y-2">
              {recipe.steps.map((s, i) => (
                <li key={i} className="text-sm text-neutral-700 flex items-start gap-3">
                  <span className="bg-primary-100 text-primary-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecipesPage() {
  const [filter, setFilter] = useState<Meal | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = RECIPES.filter((r) => {
    if (filter !== 'all' && r.meal !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Recepti</h1>
        <p className="text-neutral-500 mt-1">Mediteranska prehrana prilagođena moyamoya pacijentima — bogata omega-3, antioksidansima i protuupalnim namirnicama.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraži recepte ili sastojke..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'breakfast', 'lunch', 'dinner'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === m
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {m === 'all' ? 'Svi' : `${mealEmoji[m]} ${mealLabels[m]}`}
            </button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-primary-800">
          <strong>Zašto mediteranska prehrana?</strong> Istraživanja pokazuju da mediteranska prehrana bogata omega-3 masnim kiselinama,
          antioksidansima i protuupalnim namirnicama pomaže u održavanju zdravlja krvnih žila i poboljšava cerebralnu cirkulaciju —
          što je posebno važno za moyamoya pacijente.
        </p>
      </div>

      {/* Recipe grid */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            Nema recepata koji odgovaraju pretrazi.
          </div>
        ) : (
          filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
        )}
      </div>

      <p className="text-center text-xs text-neutral-400 mt-8">
        Recepti su informativnog karaktera. Konzultirajte svog liječnika ili nutricionistu prije značajnih promjena u prehrani.
      </p>
    </div>
  );
}
