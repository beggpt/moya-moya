'use client';

import { useState } from 'react';
import { Clock, Users, ChevronDown, ChevronUp, Search, Fish, Beef, Salad } from 'lucide-react';

type Meal = 'breakfast' | 'lunch' | 'dinner';
type DietType = 'fish' | 'meat' | 'veggies';

interface Recipe {
  id: number;
  name: string;
  meal: Meal;
  dietType: DietType;
  image: string;
  time: string;
  servings: number;
  benefit: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
}

const RECIPES: Recipe[] = [
  // === BREAKFAST ===
  {
    id: 1,
    name: 'Oatmeal with berries and walnuts',
    meal: 'breakfast',
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&h=300&fit=crop',
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
    dietType: 'fish',
    image: 'https://images.unsplash.com/photo-1603046891744-76e6300f82ef?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=400&h=300&fit=crop',
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

  // === LUNCH ===
  {
    id: 8,
    name: 'Quinoa salad with roasted vegetables',
    meal: 'lunch',
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
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
    dietType: 'fish',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
    time: '40 min',
    servings: 4,
    benefit: 'Rich in fiber and antioxidants, low in sodium — regulates blood pressure',
    ingredients: [
      '2 tbsp olive oil',
      '1 onion, 2 carrots, 2 celery stalks (diced)',
      '2 garlic cloves',
      '400g canned tomatoes',
      '1L low-sodium vegetable broth',
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
    dietType: 'meat',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
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
    dietType: 'fish',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
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

  // === DINNER ===
  {
    id: 15,
    name: 'Baked fish with Mediterranean vegetables',
    meal: 'dinner',
    dietType: 'fish',
    image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&h=300&fit=crop',
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
    dietType: 'meat',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1625944525533-473f1b3d9684?w=400&h=300&fit=crop',
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
    dietType: 'fish',
    image: 'https://images.unsplash.com/photo-1604497181015-76590d828b92?w=400&h=300&fit=crop',
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
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=400&h=300&fit=crop',
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

  // === NEW RECIPES (21-30) ===
  {
    id: 21,
    name: 'Greek-style grilled sardines with lemon',
    meal: 'lunch',
    dietType: 'fish',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=300&fit=crop',
    time: '20 min',
    servings: 2,
    benefit: 'Small oily fish deliver the highest omega-3 per gram with minimal mercury exposure',
    ingredients: [
      '8 fresh sardines (cleaned)',
      '2 lemons (1 juiced, 1 sliced)',
      '3 tbsp olive oil',
      '2 garlic cloves (minced)',
      'Fresh oregano and parsley',
      'Sea salt and black pepper',
    ],
    steps: [
      'Pat sardines dry and season inside and out with salt and pepper.',
      'Mix olive oil, lemon juice, and garlic; brush onto sardines.',
      'Heat a grill or grill pan to medium-high.',
      'Grill sardines 3-4 min per side until skin is crisp.',
      'Serve with lemon slices and fresh herbs.',
    ],
    tags: ['omega-3', 'vitamin D', 'low mercury'],
  },
  {
    id: 22,
    name: 'Lentil and spinach soup',
    meal: 'dinner',
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1547308283-b941e719dbdb?w=400&h=300&fit=crop',
    time: '35 min',
    servings: 4,
    benefit: 'Iron + folate combination supports healthy red blood cell production and oxygen delivery',
    ingredients: [
      '200g brown or green lentils',
      '200g fresh spinach',
      '1 onion (diced)',
      '2 carrots (diced)',
      '3 garlic cloves (minced)',
      '1.2L low-sodium vegetable broth',
      '1 tsp cumin',
      '1 tsp smoked paprika',
      '2 tbsp olive oil',
      'Juice of 1 lemon',
      'Salt, pepper',
    ],
    steps: [
      'Rinse lentils thoroughly.',
      'Sauté onion and carrot in olive oil for 5 min.',
      'Add garlic, cumin, and paprika; sauté 1 min.',
      'Add lentils and broth; simmer 25 min until lentils are tender.',
      'Stir in spinach and cook 2 min until wilted.',
      'Finish with lemon juice and season to taste.',
    ],
    tags: ['iron', 'folate', 'plant protein'],
  },
  {
    id: 23,
    name: 'Whole grain pasta with grilled chicken and pesto',
    meal: 'lunch',
    dietType: 'meat',
    image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop',
    time: '30 min',
    servings: 2,
    benefit: 'Lean protein + whole grains + basil pesto rich in antioxidants and healthy fats',
    ingredients: [
      '200g whole grain pasta',
      '2 chicken breasts',
      '4 tbsp homemade or low-sodium basil pesto',
      '150g cherry tomatoes (halved)',
      '2 tbsp olive oil',
      '30g pine nuts (toasted)',
      'Fresh basil leaves',
      'Salt, pepper, Italian herbs',
    ],
    steps: [
      'Season chicken with salt, pepper, and Italian herbs.',
      'Grill chicken 6-7 min per side; let rest, then slice.',
      'Cook pasta until al dente; reserve 100ml of pasta water.',
      'Toss pasta with pesto, adding pasta water to loosen.',
      'Add cherry tomatoes and sliced chicken.',
      'Top with pine nuts and fresh basil.',
    ],
    tags: ['protein', 'whole grain', 'antioxidants'],
  },
  {
    id: 24,
    name: 'Baked cod with Mediterranean vegetables',
    meal: 'dinner',
    dietType: 'fish',
    image: 'https://images.unsplash.com/photo-1580959375944-abd7e991f971?w=400&h=300&fit=crop',
    time: '35 min',
    servings: 2,
    benefit: 'Lean white fish with essential amino acids and minerals — easy to digest at dinner',
    ingredients: [
      '2 cod fillets (180g each)',
      '1 zucchini (sliced)',
      '1 yellow bell pepper (sliced)',
      '200g cherry tomatoes',
      '1 fennel bulb (sliced)',
      '3 tbsp olive oil',
      '2 garlic cloves (minced)',
      'Juice of 1 lemon',
      'Fresh dill and thyme',
      'Salt, pepper',
    ],
    steps: [
      'Preheat oven to 200°C.',
      'Toss vegetables with 2 tbsp olive oil, garlic, salt, and pepper.',
      'Spread on a baking tray and roast 15 min.',
      'Season cod with salt, pepper, and thyme; place over vegetables.',
      'Drizzle with remaining oil and lemon juice.',
      'Bake 12-15 min until cod flakes easily. Garnish with dill.',
    ],
    tags: ['lean protein', 'B12', 'selenium'],
  },
  {
    id: 25,
    name: 'Chickpea and roasted vegetable bowl',
    meal: 'lunch',
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
    time: '40 min',
    servings: 2,
    benefit: 'Plant protein + fiber + polyphenols stabilize blood sugar and reduce inflammation',
    ingredients: [
      '1 can chickpeas (drained and rinsed)',
      '1 sweet potato (cubed)',
      '1 red onion (wedged)',
      '1 zucchini (cubed)',
      '150g cherry tomatoes',
      '3 tbsp olive oil',
      '1 tsp smoked paprika',
      '1 tsp cumin',
      '2 tbsp tahini',
      'Juice of 1 lemon',
      'Fresh parsley',
      'Salt, pepper',
    ],
    steps: [
      'Preheat oven to 200°C.',
      'Toss vegetables and chickpeas with 2 tbsp olive oil, paprika, cumin, salt, and pepper.',
      'Roast on a tray for 25-30 min, stirring once.',
      'Whisk tahini with lemon juice, 2 tbsp water, and a pinch of salt.',
      'Arrange roasted vegetables in bowls, drizzle with tahini dressing.',
      'Garnish with parsley.',
    ],
    tags: ['fiber', 'plant protein', 'anti-inflammatory'],
  },
  {
    id: 26,
    name: 'Herb-crusted chicken breast with quinoa',
    meal: 'dinner',
    dietType: 'meat',
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop',
    time: '35 min',
    servings: 2,
    benefit: 'Lean protein supports muscle recovery; quinoa provides complete amino acids and magnesium',
    ingredients: [
      '2 chicken breasts',
      '150g quinoa',
      '2 tbsp Dijon mustard',
      '3 tbsp chopped fresh herbs (parsley, rosemary, thyme)',
      '3 tbsp whole grain breadcrumbs',
      '2 tbsp olive oil',
      '1 lemon (zested and juiced)',
      '200ml low-sodium chicken broth',
      'Salt, pepper',
    ],
    steps: [
      'Preheat oven to 190°C.',
      'Cook quinoa in chicken broth until liquid is absorbed (about 15 min).',
      'Brush chicken with mustard; press herb-breadcrumb mixture onto top.',
      'Drizzle with olive oil and place on a lined tray.',
      'Bake 22-25 min until chicken reaches 74°C internal temperature.',
      'Fluff quinoa with lemon zest and juice. Serve chicken over quinoa.',
    ],
    tags: ['lean protein', 'magnesium', 'whole grain'],
  },
  {
    id: 27,
    name: 'Avocado chickpea salad',
    meal: 'lunch',
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1604497181015-76590d828b92?w=400&h=300&fit=crop',
    time: '10 min',
    servings: 2,
    benefit: 'Monounsaturated fats from avocado + plant protein — heart-healthy and filling',
    ingredients: [
      '1 can chickpeas (drained and rinsed)',
      '1 ripe avocado (cubed)',
      '150g cherry tomatoes (halved)',
      '1/2 cucumber (diced)',
      '1/4 red onion (finely diced)',
      '2 tbsp olive oil',
      'Juice of 1 lemon',
      'Fresh cilantro or parsley',
      'Salt, pepper, cumin',
    ],
    steps: [
      'Combine chickpeas, tomatoes, cucumber, and onion in a bowl.',
      'Whisk olive oil, lemon juice, cumin, salt, and pepper.',
      'Pour dressing over salad and gently toss.',
      'Add avocado and fresh herbs just before serving.',
    ],
    tags: ['healthy fats', 'fiber', 'quick meal'],
  },
  {
    id: 28,
    name: 'Mediterranean tuna bowl',
    meal: 'lunch',
    dietType: 'fish',
    image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400&h=300&fit=crop',
    time: '15 min',
    servings: 2,
    benefit: 'Omega-3 + whole grains + vegetables — a balanced bowl for brain and vessel health',
    ingredients: [
      '150g cooked farro or brown rice',
      '1 can tuna in olive oil (drained)',
      '1 cup mixed greens',
      '100g cherry tomatoes (halved)',
      '1/2 cucumber (sliced)',
      '50g Kalamata olives',
      '50g feta cheese (crumbled)',
      '1/4 red onion (thinly sliced)',
      '3 tbsp olive oil',
      'Juice of 1 lemon',
      'Dried oregano, salt, pepper',
    ],
    steps: [
      'Divide farro between two bowls.',
      'Top with mixed greens, tomatoes, cucumber, olives, and onion.',
      'Flake tuna over the top.',
      'Sprinkle with feta and oregano.',
      'Whisk olive oil and lemon juice; drizzle over bowls.',
    ],
    tags: ['omega-3', 'whole grain', 'balanced'],
  },
  {
    id: 29,
    name: 'Lamb kebab with tabbouleh (moderate red meat)',
    meal: 'dinner',
    dietType: 'meat',
    image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&h=300&fit=crop',
    time: '40 min',
    servings: 2,
    benefit: 'Lean lamb provides iron and B12 — enjoy in moderation (once every 1-2 weeks) alongside vegetables',
    ingredients: [
      '300g lean lamb (cubed)',
      '1 tbsp olive oil',
      '1 tsp cumin',
      '1 tsp smoked paprika',
      '2 garlic cloves (minced)',
      '100g bulgur',
      '1 large bunch parsley (chopped)',
      '1/2 bunch mint (chopped)',
      '2 tomatoes (diced)',
      '1 cucumber (diced)',
      '3 tbsp olive oil',
      'Juice of 1 lemon',
      'Salt, pepper',
    ],
    steps: [
      'Marinate lamb with olive oil, cumin, paprika, garlic, salt, and pepper for 20 min.',
      'Soak bulgur in boiling water for 15 min; drain.',
      'Thread lamb onto skewers.',
      'Grill kebabs 3-4 min per side for medium.',
      'Combine bulgur, parsley, mint, tomatoes, and cucumber.',
      'Dress with olive oil and lemon juice. Serve kebabs over tabbouleh.',
    ],
    tags: ['iron', 'B12', 'moderate red meat'],
  },
  {
    id: 30,
    name: 'Ratatouille',
    meal: 'dinner',
    dietType: 'veggies',
    image: 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=400&h=300&fit=crop',
    time: '50 min',
    servings: 4,
    benefit: 'A classic vegetable medley loaded with polyphenols, lycopene, and fiber — deeply anti-inflammatory',
    ingredients: [
      '1 eggplant (cubed)',
      '2 zucchini (sliced)',
      '1 red bell pepper (sliced)',
      '1 yellow bell pepper (sliced)',
      '1 onion (sliced)',
      '4 tomatoes (diced) or 400g canned',
      '4 garlic cloves (minced)',
      '4 tbsp olive oil',
      '1 tbsp tomato paste',
      'Fresh thyme and basil',
      'Salt, pepper',
    ],
    steps: [
      'Heat 2 tbsp olive oil; sauté eggplant until golden. Remove.',
      'Add remaining oil, sauté onion and peppers for 5 min.',
      'Add garlic and tomato paste, cook 1 min.',
      'Add tomatoes, zucchini, and return eggplant.',
      'Add thyme, season; simmer covered 30 min, stirring occasionally.',
      'Finish with fresh basil before serving.',
    ],
    tags: ['polyphenols', 'lycopene', 'anti-inflammatory'],
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

const dietLabels: Record<DietType, string> = {
  fish: 'Fish',
  meat: 'Meat',
  veggies: 'Veggies',
};

const dietBadgeClasses: Record<DietType, string> = {
  fish: 'bg-blue-500 text-white',
  meat: 'bg-amber-500 text-white',
  veggies: 'bg-green-500 text-white',
};

function DietIcon({ type, size = 14 }: { type: DietType; size?: number }) {
  if (type === 'fish') return <Fish size={size} />;
  if (type === 'meat') return <Beef size={size} />;
  return <Salad size={size} />;
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card hover:shadow-md transition-shadow overflow-hidden p-0">
      {/* Image */}
      <div className="relative">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="h-40 w-full object-cover"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            img.src = `https://source.unsplash.com/400x300/?${encodeURIComponent(recipe.name.split(' ')[0])}`;
          }}
        />
        <div className={`absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-md ${dietBadgeClasses[recipe.dietType]}`}>
          <DietIcon type={recipe.dietType} size={12} />
          {dietLabels[recipe.dietType]}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
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
    </div>
  );
}

export default function RecipesPage() {
  const [filter, setFilter] = useState<Meal | 'all'>('all');
  const [dietFilter, setDietFilter] = useState<DietType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = RECIPES.filter((r) => {
    if (filter !== 'all' && r.meal !== filter) return false;
    if (dietFilter !== 'all' && r.dietType !== dietFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Recipes</h1>
        <p className="text-neutral-500 mt-1">A Mediterranean diet adapted for moyamoya patients — rich in omega-3, antioxidants, and anti-inflammatory foods.</p>
      </div>

      {/* Search + Meal filter */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
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

      {/* Diet filter (subtle, smaller) */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs font-medium text-neutral-500 mr-1">Diet:</span>
        {(['all', 'fish', 'meat', 'veggies'] as const).map((d) => {
          const active = dietFilter === d;
          return (
            <button
              key={d}
              onClick={() => setDietFilter(d)}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all border ${
                active
                  ? d === 'fish'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : d === 'meat'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : d === 'veggies'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-neutral-800 text-white border-neutral-800'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {d !== 'all' && <DietIcon type={d} size={12} />}
              {d === 'all' ? 'All' : dietLabels[d]}
            </button>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-primary-800">
          <strong>Why the Mediterranean diet?</strong> Research shows that a Mediterranean diet rich in omega-3 fatty acids,
          antioxidants, and anti-inflammatory foods helps maintain blood vessel health and improves cerebral circulation —
          which is especially important for moyamoya patients. Prioritize fish (2-3x/week), legumes, and vegetables; keep red meat occasional.
        </p>
      </div>

      {/* Recipe grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 text-neutral-500">
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
