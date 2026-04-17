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
  // === BREAKFAST (7) ===
  {
    id: 1,
    name: 'Oatmeal with berries and walnuts',
    meal: 'breakfast',
    time: '10 min',
    servings: 1,
    benefit: 'Rich in omega-3 fatty acids and antioxidants for blood vessel health',
    ingredients: [
      '50g rolled oats',
      '200ml water or plant milk',
      '1 handful of blueberries',
      '1 handful of raspberries',
      '1 tbsp chopped walnuts',
      '1 tsp honey',
      'Cinnamon to taste',
    ],
    steps: [
      'Cook the oats in water/milk for 5 minutes over medium-high heat.',
      'Pour into a bowl and add the berries.',
      'Top with walnuts, honey, and cinnamon.',
    ],
    tags: ['omega-3', 'antioxidants', 'fiber'],
  },
  {
    id: 2,
    name: 'Mediterranean omelet with spinach and feta',
    meal: 'breakfast',
    time: '15 min',
    servings: 1,
    benefit: 'Rich in folate and iron, helps with red blood cell production',
    ingredients: [
      '2 eggs',
      '1 handful of baby spinach',
      '30g feta cheese',
      '4-5 cherry tomatoes (halved)',
      '1 tbsp olive oil',
      'Salt, pepper',
    ],
    steps: [
      'Heat olive oil in a pan over medium-high heat.',
      'Add spinach and sauté for 1-2 minutes until wilted.',
      'Whisk eggs with a pinch of salt and pepper, pour over spinach.',
      'When the bottom is set, add feta and tomatoes to one half.',
      'Fold the omelet and cook for another 1-2 minutes.',
    ],
    tags: ['protein', 'folate', 'iron'],
  },
  {
    id: 3,
    name: 'Avocado toast with smoked salmon',
    meal: 'breakfast',
    time: '10 min',
    servings: 1,
    benefit: 'Omega-3 fatty acids improve cerebral blood flow',
    ingredients: [
      '2 slices whole grain bread',
      '1 ripe avocado',
      '60g smoked salmon',
      'Juice of half a lemon',
      'Chia seeds (optional)',
      'Salt, pepper, chili flakes',
    ],
    steps: [
      'Toast the bread.',
      'Mash the avocado with a fork, season with lemon juice, salt, and pepper.',
      'Spread avocado on the toast and top with smoked salmon.',
      'Sprinkle with chia seeds and chili flakes.',
    ],
    tags: ['omega-3', 'healthy fats', 'fiber'],
  },
  {
    id: 4,
    name: 'Banana, spinach, and flaxseed smoothie',
    meal: 'breakfast',
    time: '5 min',
    servings: 1,
    benefit: 'Hydration + folate + omega-3 in one meal — ideal for morning hydration',
    ingredients: [
      '1 banana',
      '1 handful of baby spinach',
      '1 tbsp ground flaxseed',
      '200ml plant milk (almond/oat)',
      '1 tsp honey',
    ],
    steps: [
      'Add all ingredients to a blender.',
      'Blend for 30-60 seconds until smooth.',
      'Serve immediately.',
    ],
    tags: ['hydration', 'omega-3', 'vitamins'],
  },
  {
    id: 5,
    name: 'Greek yogurt with walnuts, honey, and figs',
    meal: 'breakfast',
    time: '5 min',
    servings: 1,
    benefit: 'Calcium for bones, probiotics for immunity, walnuts for the brain',
    ingredients: [
      '200g Greek yogurt (full-fat)',
      '2 fresh figs (or 3 dried, sliced)',
      '1 tbsp mixed nuts',
      '1 tsp honey',
      'Sunflower seeds (optional)',
    ],
    steps: [
      'Pour the yogurt into a bowl.',
      'Slice the figs and arrange on top.',
      'Sprinkle with nuts and seeds and drizzle with honey.',
    ],
    tags: ['probiotics', 'calcium', 'antioxidants'],
  },
  {
    id: 6,
    name: 'Buckwheat pancakes with fruit',
    meal: 'breakfast',
    time: '20 min',
    servings: 2,
    benefit: 'Buckwheat is gluten-free and rich in rutin, which strengthens blood vessels',
    ingredients: [
      '100g buckwheat flour',
      '1 egg',
      '200ml milk',
      'Pinch of salt',
      'Olive oil for cooking',
      'Fresh fruit to serve (strawberries, blueberries)',
      'Honey or agave syrup',
    ],
    steps: [
      'Mix flour, egg, milk, and salt into a smooth batter.',
      'Heat a pan with a little olive oil.',
      'Cook thin pancakes on both sides (1-2 min per side).',
      'Serve with fruit and honey.',
    ],
    tags: ['gluten-free', 'rutin', 'energy'],
  },
  {
    id: 7,
    name: 'Shakshuka (eggs in tomato sauce)',
    meal: 'breakfast',
    time: '25 min',
    servings: 2,
    benefit: 'Lycopene from tomatoes protects blood vessels; protein from eggs aids recovery',
    ingredients: [
      '1 tbsp olive oil',
      '1 onion (sliced)',
      '1 bell pepper (sliced)',
      '400g canned tomatoes',
      '1 tsp cumin',
      '1 tsp paprika',
      '4 eggs',
      'Fresh parsley',
      'Salt, pepper',
    ],
    steps: [
      'Sauté onion and pepper in olive oil for 5 min.',
      'Add tomatoes, cumin, paprika, salt, and pepper. Cook for 10 min.',
      'Make 4 wells in the sauce and crack an egg into each.',
      'Cover and cook for 5-7 min until the whites are set.',
      'Sprinkle with parsley and serve with bread.',
    ],
    tags: ['lycopene', 'protein', 'vitamins'],
  },

  // === LUNCH (7) ===
  {
    id: 8,
    name: 'Quinoa salad with roasted vegetables',
    meal: 'lunch',
    time: '35 min',
    servings: 2,
    benefit: 'Complete protein + iron + magnesium — supports cerebral circulation',
    ingredients: [
      '150g quinoa',
      '1 zucchini (sliced)',
      '1 red bell pepper (sliced)',
      '1 eggplant (sliced)',
      '200g cherry tomatoes',
      '3 tbsp olive oil',
      'Juice of 1 lemon',
      '50g feta cheese',
      'Fresh mint and parsley',
      'Salt, pepper',
    ],
    steps: [
      'Cook quinoa according to package directions. Drain and cool.',
      'Toss vegetables with 2 tbsp olive oil, salt, and pepper.',
      'Roast at 200°C for 20 min.',
      'Mix quinoa with roasted vegetables.',
      'Season with lemon juice and the remaining oil.',
      'Top with feta and fresh herbs.',
    ],
    tags: ['protein', 'magnesium', 'fiber'],
  },
  {
    id: 9,
    name: 'Baked salmon with sweet potato and broccoli',
    meal: 'lunch',
    time: '30 min',
    servings: 2,
    benefit: 'The richest source of omega-3 DHA to protect brain blood vessels',
    ingredients: [
      '2 salmon fillets (150g each)',
      '2 medium sweet potatoes (cut into rounds)',
      '300g broccoli (florets)',
      '2 tbsp olive oil',
      '2 garlic cloves (minced)',
      'Juice of half a lemon',
      'Salt, pepper, thyme',
    ],
    steps: [
      'Preheat oven to 200°C.',
      'Spread sweet potatoes on a baking tray, drizzle with oil, season. Bake 10 min.',
      'Add broccoli and salmon (skin-side down) to the tray.',
      'Top salmon with garlic, lemon juice, and thyme.',
      'Bake for another 15 min.',
    ],
    tags: ['omega-3', 'vitamin D', 'antioxidants'],
  },
  {
    id: 10,
    name: 'Minestrone soup',
    meal: 'lunch',
    time: '40 min',
    servings: 4,
    benefit: 'Rich in fiber and antioxidants, low in sodium — regulates blood pressure',
    ingredients: [
      '2 tbsp olive oil',
      '1 onion, 2 carrots, 2 celery stalks (diced)',
      '2 garlic cloves',
      '400g canned tomatoes',
      '1L low-sodium chicken broth',
      '200g frozen green beans',
      '100g small pasta',
      '1 zucchini (diced)',
      'Fresh basil',
      'Parmesan to serve',
    ],
    steps: [
      'Sauté onion, carrots, and celery in olive oil for 5 min.',
      'Add garlic, sauté 1 min.',
      'Add tomatoes and broth. Bring to a boil.',
      'Add pasta, zucchini, and green beans. Cook 15 min.',
      'Season with salt and pepper, serve with basil and parmesan.',
    ],
    tags: ['fiber', 'low sodium', 'hydration'],
  },
  {
    id: 11,
    name: 'Grilled chicken with tabbouleh salad',
    meal: 'lunch',
    time: '30 min',
    servings: 2,
    benefit: 'Lean protein for recovery; bulgur for steady energy without sugar spikes',
    ingredients: [
      '2 chicken breasts',
      '100g bulgur',
      '1 large bunch of parsley (finely chopped)',
      '1/2 bunch of mint (finely chopped)',
      '3 tomatoes (diced)',
      '1 cucumber (diced)',
      '3 tbsp olive oil',
      'Juice of 1 lemon',
      'Salt, pepper, cumin',
    ],
    steps: [
      'Pour boiling water over bulgur, cover, and let sit for 15 min. Drain.',
      'Season chicken with salt, pepper, and cumin. Grill for 6-7 min per side.',
      'Mix bulgur with parsley, mint, tomatoes, and cucumber.',
      'Season with olive oil and lemon juice.',
      'Slice chicken and serve over tabbouleh.',
    ],
    tags: ['protein', 'fiber', 'vitamin C'],
  },
  {
    id: 12,
    name: 'Vegetable risotto with turmeric',
    meal: 'lunch',
    time: '35 min',
    servings: 2,
    benefit: 'Turmeric has anti-inflammatory properties that help protect blood vessels',
    ingredients: [
      '200g arborio rice',
      '1 onion (finely chopped)',
      '1 carrot (diced)',
      '100g peas',
      '100g mushrooms (sliced)',
      '750ml warm vegetable broth',
      '1 tsp turmeric',
      '2 tbsp olive oil',
      '30g parmesan',
      'Salt, pepper',
    ],
    steps: [
      'Sauté onion in olive oil for 3 min.',
      'Add rice, stir for 1 min.',
      'Add turmeric, then gradually add warm broth (one ladle at a time), stirring.',
      'When rice is halfway done, add carrot, mushrooms, and peas.',
      'Cook until rice is al dente (about 18 min total).',
      'Stir in parmesan, season with salt and pepper.',
    ],
    tags: ['anti-inflammatory', 'turmeric', 'fiber'],
  },
  {
    id: 13,
    name: 'Lentil dhal with naan bread',
    meal: 'lunch',
    time: '30 min',
    servings: 3,
    benefit: 'Lentils are rich in folate and iron — key for blood cell production',
    ingredients: [
      '200g red lentils',
      '1 onion (sliced)',
      '2 garlic cloves',
      '1 tbsp curry paste',
      '400ml coconut milk',
      '400ml water',
      '1 tbsp olive oil',
      'Fresh cilantro',
      'Naan bread to serve',
    ],
    steps: [
      'Sauté onion in olive oil for 3 min.',
      'Add garlic and curry paste, sauté for 1 min.',
      'Add lentils, coconut milk, and water.',
      'Simmer for 20 min until lentils are soft.',
      'Sprinkle with cilantro, serve with naan.',
    ],
    tags: ['folate', 'iron', 'plant protein'],
  },
  {
    id: 14,
    name: 'Pasta with tomato and sardine sauce',
    meal: 'lunch',
    time: '25 min',
    servings: 2,
    benefit: 'Sardines are rich in omega-3, vitamin D, and calcium',
    ingredients: [
      '200g whole grain pasta',
      '1 can of sardines in olive oil',
      '400g tomato passata',
      '2 garlic cloves (minced)',
      '1 tbsp capers',
      'Chili flakes (optional)',
      'Fresh parsley',
      'Salt, pepper',
    ],
    steps: [
      'Cook pasta according to package directions. Drain.',
      'In a pan, heat the oil from the sardine can with garlic for 1 min.',
      'Add passata, capers, and chili. Cook for 10 min.',
      'Add sardines (roughly broken up) and the pasta.',
      'Toss and sprinkle with parsley.',
    ],
    tags: ['omega-3', 'calcium', 'vitamin D'],
  },

  // === DINNER (6) ===
  {
    id: 15,
    name: 'Baked fish with Mediterranean vegetables',
    meal: 'dinner',
    time: '30 min',
    servings: 2,
    benefit: 'A light meal rich in protein and omega-3 — ideal dinner that doesn\'t strain circulation',
    ingredients: [
      '2 fillets of white fish (sea bass or sea bream, 150g each)',
      '1 zucchini (sliced)',
      '1 red bell pepper (sliced)',
      '200g cherry tomatoes',
      '1/2 red onion (sliced)',
      '50g olives',
      '3 tbsp olive oil',
      'Fresh rosemary and thyme',
      'Salt, pepper, lemon',
    ],
    steps: [
      'Preheat oven to 190°C.',
      'Spread vegetables on a tray, drizzle with oil, season.',
      'Bake 10 min.',
      'Place fish on the vegetables, drizzle with lemon juice.',
      'Bake for another 12-15 min until fish is done.',
    ],
    tags: ['omega-3', 'light meal', 'protein'],
  },
  {
    id: 16,
    name: 'Butternut squash soup with ginger',
    meal: 'dinner',
    time: '35 min',
    servings: 3,
    benefit: 'Beta-carotene from squash + anti-inflammatory ginger — a warm, light evening meal',
    ingredients: [
      '500g butternut squash (peeled, cubed)',
      '1 onion (sliced)',
      '2 cm fresh ginger (grated)',
      '600ml vegetable broth',
      '100ml coconut milk',
      '1 tbsp olive oil',
      'Salt, pepper, nutmeg',
      'Pumpkin seeds to serve',
    ],
    steps: [
      'Sauté onion in olive oil for 3 min.',
      'Add squash and ginger, sauté for 2 min.',
      'Add broth and simmer for 20 min until squash is soft.',
      'Blend with an immersion blender until smooth.',
      'Stir in coconut milk and season.',
      'Top with pumpkin seeds.',
    ],
    tags: ['beta-carotene', 'anti-inflammatory', 'light meal'],
  },
  {
    id: 17,
    name: 'Greek salad with grilled turkey',
    meal: 'dinner',
    time: '20 min',
    servings: 2,
    benefit: 'Low-calorie meal rich in protein and polyphenols from olive oil',
    ingredients: [
      '200g turkey breast fillet',
      '2 tomatoes (sliced)',
      '1 cucumber (sliced)',
      '1/2 red onion (sliced into rings)',
      '100g feta cheese',
      '50g Kalamata olives',
      '2 tbsp olive oil',
      'Oregano, salt, pepper',
      'Juice of half a lemon',
    ],
    steps: [
      'Season turkey with salt, pepper, and oregano.',
      'Grill or pan-fry for 5-6 min per side.',
      'Arrange vegetables on a plate.',
      'Add feta and olives.',
      'Slice turkey and place on the salad.',
      'Drizzle with olive oil and lemon juice.',
    ],
    tags: ['protein', 'polyphenols', 'light meal'],
  },
  {
    id: 18,
    name: 'Stuffed peppers with quinoa and vegetables',
    meal: 'dinner',
    time: '40 min',
    servings: 2,
    benefit: 'Plant protein + fiber — stabilizes blood sugar overnight',
    ingredients: [
      '4 bell peppers (tops cut off, cleaned)',
      '100g quinoa (cooked)',
      '1 zucchini (finely diced)',
      '100g mushrooms (sliced)',
      '1 onion (finely chopped)',
      '50g cheese (grated)',
      '1 tbsp olive oil',
      'Salt, pepper, smoked paprika',
    ],
    steps: [
      'Preheat oven to 180°C.',
      'Sauté onion, zucchini, and mushrooms in olive oil for 5 min.',
      'Mix with cooked quinoa and season.',
      'Stuff the peppers and top with cheese.',
      'Bake for 25 min until peppers are tender.',
    ],
    tags: ['plant protein', 'fiber', 'vitamins'],
  },
  {
    id: 19,
    name: 'Tuna salad with white beans and arugula',
    meal: 'dinner',
    time: '10 min',
    servings: 2,
    benefit: 'A quick, light meal rich in omega-3 and plant fiber',
    ingredients: [
      '1 can of tuna in olive oil (drained)',
      '1 can of white beans (drained and rinsed)',
      '2 handfuls of arugula',
      '1/2 red onion (thinly sliced)',
      '100g cherry tomatoes (halved)',
      '2 tbsp olive oil',
      'Juice of 1 lemon',
      'Salt, pepper',
    ],
    steps: [
      'Combine white beans, arugula, onion, and tomatoes in a bowl.',
      'Add tuna (roughly broken up).',
      'Season with olive oil, lemon, salt, and pepper.',
    ],
    tags: ['omega-3', 'fiber', 'quick meal'],
  },
  {
    id: 20,
    name: 'Creamy broccoli soup with almond milk',
    meal: 'dinner',
    time: '25 min',
    servings: 2,
    benefit: 'Broccoli is rich in vitamin K, which helps regulate blood clotting',
    ingredients: [
      '400g broccoli (florets)',
      '1 onion (sliced)',
      '1 garlic clove',
      '400ml vegetable broth',
      '100ml almond milk',
      '1 tbsp olive oil',
      'Salt, pepper, nutmeg',
      'Pumpkin seed oil to serve',
    ],
    steps: [
      'Sauté onion and garlic in olive oil for 3 min.',
      'Add broccoli and broth, simmer for 15 min.',
      'Blend with an immersion blender.',
      'Stir in almond milk and season.',
      'Serve with a few drops of pumpkin seed oil.',
    ],
    tags: ['vitamin K', 'antioxidants', 'light meal'],
  },
];

const mealLabels: Record<Meal, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
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
            <span className="flex items-center gap-1"><Users size={14} /> {recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}</span>
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
        {expanded ? 'Hide recipe' : 'Show recipe'}
        {expanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">Ingredients</h4>
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
            <h4 className="font-semibold text-neutral-800 mb-2">Preparation</h4>
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
        <h1 className="text-2xl font-bold text-neutral-900">Recipes</h1>
        <p className="text-neutral-500 mt-1">A Mediterranean diet adapted for moyamoya patients — rich in omega-3, antioxidants, and anti-inflammatory foods.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes or ingredients..."
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
              {m === 'all' ? 'All' : `${mealEmoji[m]} ${mealLabels[m]}`}
            </button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-primary-800">
          <strong>Why the Mediterranean diet?</strong> Research shows that a Mediterranean diet rich in omega-3 fatty acids,
          antioxidants, and anti-inflammatory foods helps maintain blood vessel health and improves cerebral circulation —
          which is especially important for moyamoya patients.
        </p>
      </div>

      {/* Recipe grid */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No recipes match your search.
          </div>
        ) : (
          filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
        )}
      </div>

      <p className="text-center text-xs text-neutral-400 mt-8">
        Recipes are for informational purposes only. Consult your doctor or nutritionist before making significant dietary changes.
      </p>
    </div>
  );
}
