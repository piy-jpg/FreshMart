// SabjiHub - Master Application Logic (Multi-page shared engine)

// Master Vegetable Catalog (16 Distinct Items)
const allVegetablesData = [
  {
    id: 'tomato',
    name: 'Fresh Tomato',
    hindiName: 'देसी टमाटर',
    categories: ['all', 'organic', 'seasonal'],
    rating: 4.8,
    reviewsCount: 245,
    badge: 'Farm Fresh',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 45,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=85',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1200&q=85', title: 'Tomatoes in woven basket' },
      { url: 'https://images.unsplash.com/photo-1546470427-e26264be0b11?auto=format&fit=crop&w=1200&q=85', title: 'Close-up of fresh red tomatoes' },
      { url: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=1200&q=85', title: 'Vine-ripened tomatoes on farm' },
      { url: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=1200&q=85', title: 'Packed in breathable eco-kraft box' }
    ],
    description: 'Fresh, naturally ripened tomatoes carefully selected for quality, freshness and everyday cooking. Plucked at 4 AM from local organic farms.',
    origin: 'Kolar Organic Farms, Karnataka',
    weights: [
      { label: '250 g', price: 3, originalPrice: 16, discount: '81% OFF', savings: 13 },
      { label: '500 g', price: 6, originalPrice: 28, discount: '78% OFF', savings: 22 },
      { label: '1 kg', price: 10, originalPrice: 50, discount: '80% OFF', savings: 40 },
      { label: '2 kg', price: 19, originalPrice: 100, discount: '81% OFF', savings: 81 },
      { label: '5 kg', price: 45, originalPrice: 240, discount: '81% OFF', savings: 195 }
    ],
    selectedWeightIndex: 2 // default 1 kg
  },
  {
    id: 'potato',
    name: 'Fresh Potato',
    hindiName: 'पहाड़ी आलू',
    categories: ['all', 'root', 'organic'],
    rating: 4.7,
    reviewsCount: 612,
    badge: 'Kitchen Essential',
    badgeType: 'fresh',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=700&q=80',
    description: 'Crisp, earthy, nutrient-packed Pahadi potatoes with thin skin, low sugar, and firm texture.',
    origin: 'Hassan Mountain Valley',
    weights: [
      { label: '1 kg', price: 35, originalPrice: 50, discount: '30% OFF' },
      { label: '2 kg', price: 65, originalPrice: 100, discount: '35% OFF' },
      { label: '500 g', price: 20, originalPrice: 28, discount: '28% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'onion',
    name: 'Fresh Onion',
    hindiName: 'नासिक प्याज',
    categories: ['all', 'root'],
    rating: 4.8,
    reviewsCount: 890,
    badge: 'Bestseller',
    badgeType: 'bestseller',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=700&q=80',
    description: 'Firm, pungent, top-grade Nashik red onions sorted by size with no rotting or moisture.',
    origin: 'Nashik, Maharashtra',
    weights: [
      { label: '1 kg', price: 45, originalPrice: 65, discount: '30% OFF' },
      { label: '2 kg', price: 85, originalPrice: 130, discount: '34% OFF' },
      { label: '500 g', price: 25, originalPrice: 35, discount: '28% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'capsicum',
    name: 'Green Capsicum',
    hindiName: 'हरी शिमला मिर्च',
    categories: ['all', 'exotic'],
    rating: 4.6,
    reviewsCount: 310,
    badge: 'Hydroponic Fresh',
    badgeType: 'fresh',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=700&q=80',
    description: 'Crisp, thick-walled bell peppers packed with vitamins A & C, hand-plucked with glossy skin.',
    origin: 'Hosur Polyhouse Farms',
    weights: [
      { label: '500 g', price: 80, originalPrice: 110, discount: '27% OFF' },
      { label: '250 g', price: 42, originalPrice: 58, discount: '27% OFF' },
      { label: '1 kg', price: 150, originalPrice: 220, discount: '31% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'carrot',
    name: 'Fresh Carrot',
    hindiName: 'देशी गाजर',
    categories: ['all', 'root', 'organic'],
    rating: 4.7,
    reviewsCount: 345,
    badge: 'Sweet & Crunchy',
    badgeType: 'fresh',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=700&q=80',
    description: 'Vibrant sweet orange carrots washed thoroughly; ideal for fresh salads, juices, and halwa.',
    origin: 'Malur Organic Fields',
    weights: [
      { label: '1 kg', price: 60, originalPrice: 85, discount: '29% OFF' },
      { label: '500 g', price: 32, originalPrice: 45, discount: '28% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    hindiName: 'फूल गोभी',
    categories: ['all', 'seasonal'],
    rating: 4.8,
    reviewsCount: 275,
    badge: 'Ozone Washed',
    badgeType: 'fresh',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=700&q=80',
    description: 'Dense, clean, spot-free creamy white florets protected by fresh protective green outer leaves.',
    origin: 'Ooty Hills, Nilgiris',
    weights: [
      { label: '1 piece (~500g)', price: 45, originalPrice: 65, discount: '30% OFF' },
      { label: '2 pieces (~1kg)', price: 85, originalPrice: 130, discount: '34% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'broccoli',
    name: 'Fresh Broccoli',
    hindiName: 'हरी ब्रोकली',
    categories: ['all', 'exotic'],
    rating: 4.6,
    reviewsCount: 198,
    badge: 'Superfood',
    badgeType: 'fresh',
    inStock: true,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=700&q=80',
    description: 'Dark green crisp broccoli heads loaded with antioxidants, potassium, and dietary fibre.',
    origin: 'Nilgiris Highlands',
    weights: [
      { label: '500 g', price: 90, originalPrice: 130, discount: '30% OFF' },
      { label: '250 g', price: 48, originalPrice: 70, discount: '31% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'spinach',
    name: 'Spinach',
    hindiName: 'ताज़ा पालक',
    categories: ['all', 'leafy', 'organic'],
    rating: 4.9,
    reviewsCount: 520,
    badge: 'Harvested Today',
    badgeType: 'bestseller',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=700&q=80',
    description: 'Tender baby spinach leaves with rich iron and minerals, pesticide-free and root-trimmed.',
    origin: 'Doddaballapur Hydroponics',
    weights: [
      { label: '1 bunch (250g)', price: 25, originalPrice: 38, discount: '34% OFF' },
      { label: '2 bunches (500g)', price: 45, originalPrice: 76, discount: '40% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'greenpeas',
    name: 'Green Peas',
    hindiName: 'हरी मटर',
    categories: ['all', 'seasonal', 'exotic'],
    rating: 4.7,
    reviewsCount: 380,
    badge: 'Sweet & Pod-Fresh',
    badgeType: 'fresh',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=700&q=80',
    description: 'Plump, sweet green peas inside crisp fresh pods. High in protein and natural sugars.',
    origin: 'Solan Valley, Himachal',
    weights: [
      { label: '500 g', price: 100, originalPrice: 140, discount: '28% OFF' },
      { label: '1 kg', price: 190, originalPrice: 280, discount: '32% OFF' },
      { label: '250 g', price: 55, originalPrice: 75, discount: '26% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'ladyfinger',
    name: 'Lady Finger',
    hindiName: 'ताज़ा भिंडी',
    categories: ['all', 'seasonal'],
    rating: 4.8,
    reviewsCount: 410,
    badge: 'Tender & Fresh',
    badgeType: 'fresh',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?auto=format&fit=crop&w=700&q=80',
    description: 'Slender, snap-fresh green okra (bhindi) with no fibrous toughness. Great for kurkuri bhindi.',
    origin: 'Chikkaballapur Farms',
    weights: [
      { label: '500 g', price: 55, originalPrice: 75, discount: '26% OFF' },
      { label: '250 g', price: 30, originalPrice: 40, discount: '25% OFF' },
      { label: '1 kg', price: 100, originalPrice: 150, discount: '33% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'brinjal',
    name: 'Brinjal',
    hindiName: 'बैंगन (भर्ता)',
    categories: ['all', 'seasonal'],
    rating: 4.6,
    reviewsCount: 220,
    badge: 'Glossy & Seedless',
    badgeType: 'fresh',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=700&q=80',
    description: 'Round purple bharta brinjals with glossy skin and minimal seeds, roasted to perfection.',
    origin: 'Mysuru Organic belt',
    weights: [
      { label: '1 kg', price: 45, originalPrice: 65, discount: '30% OFF' },
      { label: '500 g', price: 25, originalPrice: 35, discount: '28% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    hindiName: 'देशी खीरा',
    categories: ['all', 'seasonal', 'organic'],
    rating: 4.7,
    reviewsCount: 315,
    badge: 'Hydrating',
    badgeType: 'fresh',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=700&q=80',
    description: 'Crisp, refreshing seedless cucumbers loaded with water content. Ideal for salads and raita.',
    origin: 'Anekal Polyhouse',
    weights: [
      { label: '1 kg', price: 40, originalPrice: 58, discount: '31% OFF' },
      { label: '500 g', price: 22, originalPrice: 30, discount: '26% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'greenchilli',
    name: 'Green Chilli',
    hindiName: 'तीखी हरी मिर्च',
    categories: ['all', 'herbs'],
    rating: 4.8,
    reviewsCount: 460,
    badge: 'Spicy & Pungent',
    badgeType: 'bestseller',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=700&q=80',
    description: 'Dark green pungent chillies that impart authentic spicy zest to daily Indian tadkas.',
    origin: 'Guntur, Andhra Pradesh',
    weights: [
      { label: '250 g', price: 30, originalPrice: 45, discount: '33% OFF' },
      { label: '100 g', price: 15, originalPrice: 20, discount: '25% OFF' },
      { label: '500 g', price: 55, originalPrice: 90, discount: '38% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'coriander',
    name: 'Coriander',
    hindiName: 'हरा धनिया',
    categories: ['all', 'leafy', 'herbs', 'organic'],
    rating: 4.9,
    reviewsCount: 780,
    badge: 'Super Aromatic',
    badgeType: 'bestseller',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=700&q=80',
    description: 'Intensely fragrant fresh green coriander leaves, harvested at dawn with trimmed clean roots.',
    origin: 'Anekal Organic Farm',
    weights: [
      { label: '1 bunch (100g)', price: 20, originalPrice: 30, discount: '33% OFF' },
      { label: '2 bunches (200g)', price: 36, originalPrice: 60, discount: '40% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'ginger',
    name: 'Ginger',
    hindiName: 'ताज़ा अदरक',
    categories: ['all', 'root'],
    rating: 4.7,
    reviewsCount: 390,
    badge: 'Spicy & Juicy',
    badgeType: 'fresh',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=700&q=80',
    description: 'Aromatic, plump, thin-skinned ginger with high gingerol content. Ideal for chai and curries.',
    origin: 'Wayanad, Kerala',
    weights: [
      { label: '250 g', price: 80, originalPrice: 110, discount: '27% OFF' },
      { label: '100 g', price: 35, originalPrice: 50, discount: '30% OFF' },
      { label: '500 g', price: 150, originalPrice: 220, discount: '31% OFF' }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'garlic',
    name: 'Garlic',
    hindiName: 'देशी लहसुन',
    categories: ['all', 'root'],
    rating: 4.8,
    reviewsCount: 512,
    badge: 'Bestseller',
    badgeType: 'bestseller',
    inStock: true,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=700&q=80',
    description: 'Dry, firm, large white garlic cloves with intense medicinal and culinary pungency.',
    origin: 'Mandsaur, Madhya Pradesh',
    weights: [
      { label: '250 g', price: 120, originalPrice: 160, discount: '25% OFF' },
      { label: '100 g', price: 55, originalPrice: 70, discount: '21% OFF' },
      { label: '500 g', price: 230, originalPrice: 320, discount: '28% OFF' }
    ],
    selectedWeightIndex: 0
  }
,
  {
    id: 'cabbage',
    name: 'Fresh Cabbage',
    hindiName: 'पत्ता गोभी',
    categories: ["all","organic","leafy"],
    rating: 4.8,
    reviewsCount: 165,
    badge: 'Farm Fresh',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 140,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1551893478-d726eaf0442c?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1551893478-d726eaf0442c?auto=format&fit=crop&w=700&q=80', title: 'Fresh Cabbage Farm View' }
    ],
    description: 'Crisp, tightly layered green cabbage head fresh from Nilgiri slopes. Perfect for stir-fries, salads, and sabzi.',
    origin: 'Ooty Nilgiri Hills, Tamil Nadu',
    weights: [
      {
            "label": "500 g",
            "price": 15,
            "originalPrice": 20,
            "discount": "25% OFF",
            "savings": 5
      },
      {
            "label": "1 pc (~700g)",
            "price": 28,
            "originalPrice": 36,
            "discount": "22% OFF",
            "savings": 8
      },
      {
            "label": "2 pcs (~1.4kg)",
            "price": 52,
            "originalPrice": 72,
            "discount": "28% OFF",
            "savings": 20
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'bottlegourd',
    name: 'Bottle Gourd (Lauki)',
    hindiName: 'ताज़ा लौकी / घिया',
    categories: ["all","organic","daily"],
    rating: 4.7,
    reviewsCount: 142,
    badge: 'Detox Fresh',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 120,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=700&q=80', title: 'Bottle Gourd (Lauki) Farm View' }
    ],
    description: 'Tender, seedless, nutrient-dense green bottle gourd. Ideal for low-calorie curries, dal, and fresh morning juice.',
    origin: 'Malur Riverbed Farms, Karnataka',
    weights: [
      {
            "label": "500 g",
            "price": 20,
            "originalPrice": 25,
            "discount": "20% OFF",
            "savings": 5
      },
      {
            "label": "1 pc (~1kg)",
            "price": 35,
            "originalPrice": 45,
            "discount": "22% OFF",
            "savings": 10
      },
      {
            "label": "2 pcs (~2kg)",
            "price": 65,
            "originalPrice": 90,
            "discount": "28% OFF",
            "savings": 25
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'bittergourd',
    name: 'Bitter Gourd (Karela)',
    hindiName: 'हरा करेला',
    categories: ["all","organic","daily"],
    rating: 4.6,
    reviewsCount: 118,
    badge: 'Farm Fresh',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 110,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1628773822503-930a8449c2d1?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1628773822503-930a8449c2d1?auto=format&fit=crop&w=700&q=80', title: 'Bitter Gourd (Karela) Farm View' }
    ],
    description: 'Fresh dark-green serrated bitter gourd with potent antioxidant properties. Great for bharwan karela and crispy fry.',
    origin: 'Doddaballapur Farms, Karnataka',
    weights: [
      {
            "label": "250 g",
            "price": 12,
            "originalPrice": 16,
            "discount": "25% OFF",
            "savings": 4
      },
      {
            "label": "500 g",
            "price": 23,
            "originalPrice": 30,
            "discount": "23% OFF",
            "savings": 7
      },
      {
            "label": "1 kg",
            "price": 44,
            "originalPrice": 58,
            "discount": "24% OFF",
            "savings": 14
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'radish',
    name: 'White Radish (Mooli)',
    hindiName: 'देसी सफ़ेद मूली',
    categories: ["all","organic","root"],
    rating: 4.7,
    reviewsCount: 135,
    badge: 'Farm Crisp',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 150,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=700&q=80', title: 'White Radish (Mooli) Farm View' }
    ],
    description: 'Crunchy, peppery white radish roots with fresh green edible tops. Freshly harvested for parathas and salad.',
    origin: 'Hosur Agro Fields, Tamil Nadu',
    weights: [
      {
            "label": "500 g",
            "price": 14,
            "originalPrice": 18,
            "discount": "22% OFF",
            "savings": 4
      },
      {
            "label": "1 kg",
            "price": 26,
            "originalPrice": 35,
            "discount": "26% OFF",
            "savings": 9
      },
      {
            "label": "2 kg",
            "price": 48,
            "originalPrice": 70,
            "discount": "31% OFF",
            "savings": 22
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'beetroot',
    name: 'Fresh Beetroot (Chukandar)',
    hindiName: 'लाल चुकंदर',
    categories: ["all","organic","root"],
    rating: 4.8,
    reviewsCount: 156,
    badge: 'Iron Rich',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 130,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1526346698789-224a79ed0881?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1526346698789-224a79ed0881?auto=format&fit=crop&w=700&q=80', title: 'Fresh Beetroot (Chukandar) Farm View' }
    ],
    description: 'Sweet, ruby-red, iron-rich beetroots with smooth skin. Excellent for healthy detox juices and salads.',
    origin: 'Ooty Valley Farms, Tamil Nadu',
    weights: [
      {
            "label": "250 g",
            "price": 11,
            "originalPrice": 14,
            "discount": "21% OFF",
            "savings": 3
      },
      {
            "label": "500 g",
            "price": 20,
            "originalPrice": 26,
            "discount": "23% OFF",
            "savings": 6
      },
      {
            "label": "1 kg",
            "price": 38,
            "originalPrice": 50,
            "discount": "24% OFF",
            "savings": 12
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'frenchbeans',
    name: 'French Beans',
    hindiName: 'ताज़ा हरी बीन्स',
    categories: ["all","organic","daily"],
    rating: 4.8,
    reviewsCount: 168,
    badge: 'Tender Pick',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 115,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=700&q=80', title: 'French Beans Farm View' }
    ],
    description: 'Slender, tender, fiber-rich stringless green beans picked at prime tenderness. Ideal for sabzis and pulav.',
    origin: 'Kolar Hillside Farms, Karnataka',
    weights: [
      {
            "label": "250 g",
            "price": 14,
            "originalPrice": 18,
            "discount": "22% OFF",
            "savings": 4
      },
      {
            "label": "500 g",
            "price": 25,
            "originalPrice": 34,
            "discount": "26% OFF",
            "savings": 9
      },
      {
            "label": "1 kg",
            "price": 48,
            "originalPrice": 65,
            "discount": "26% OFF",
            "savings": 17
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'methi',
    name: 'Fresh Methi (Fenugreek)',
    hindiName: 'ताज़ा हरी मेथी',
    categories: ["all","organic","leafy"],
    rating: 4.9,
    reviewsCount: 210,
    badge: 'Harvest 4 AM',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 160,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80', title: 'Fresh Methi (Fenugreek) Farm View' }
    ],
    description: 'Fragrant, fresh, clean green methi leaves freshly bundled at 4 AM. Perfect for methi thepla, parathas, and aloo methi.',
    origin: 'Malur Greens Cluster, Karnataka',
    weights: [
      {
            "label": "1 bunch (~200g)",
            "price": 12,
            "originalPrice": 16,
            "discount": "25% OFF",
            "savings": 4
      },
      {
            "label": "2 bunches (~400g)",
            "price": 22,
            "originalPrice": 30,
            "discount": "27% OFF",
            "savings": 8
      },
      {
            "label": "4 bunches (~800g)",
            "price": 40,
            "originalPrice": 60,
            "discount": "33% OFF",
            "savings": 20
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'mint',
    name: 'Fresh Mint (Pudina)',
    hindiName: 'देसी हरा पुदीना',
    categories: ["all","organic","herbs"],
    rating: 4.8,
    reviewsCount: 185,
    badge: 'Aromatic Pick',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 180,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&w=700&q=80', title: 'Fresh Mint (Pudina) Farm View' }
    ],
    description: 'Intensely fragrant, cooling mint leaves with zero pesticide residue. Essential for mint chutney, mocktails, and raita.',
    origin: 'Kanakapura Organic Farm, Karnataka',
    weights: [
      {
            "label": "1 bunch (~100g)",
            "price": 8,
            "originalPrice": 12,
            "discount": "33% OFF",
            "savings": 4
      },
      {
            "label": "2 bunches (~200g)",
            "price": 15,
            "originalPrice": 22,
            "discount": "32% OFF",
            "savings": 7
      },
      {
            "label": "4 bunches (~400g)",
            "price": 28,
            "originalPrice": 44,
            "discount": "36% OFF",
            "savings": 16
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'curryleaves',
    name: 'Fresh Curry Leaves',
    hindiName: 'ताज़ा कढ़ी पत्ता',
    categories: ["all","organic","herbs"],
    rating: 4.9,
    reviewsCount: 195,
    badge: 'Direct Farm',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 190,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=700&q=80', title: 'Fresh Curry Leaves Farm View' }
    ],
    description: 'Deep-green, aromatic curry leaves packed with natural essential oils for authentic tadka tempering.',
    origin: 'Salem Heritage Farms, Tamil Nadu',
    weights: [
      {
            "label": "1 bunch (~50g)",
            "price": 7,
            "originalPrice": 10,
            "discount": "30% OFF",
            "savings": 3
      },
      {
            "label": "2 bunches (~100g)",
            "price": 12,
            "originalPrice": 18,
            "discount": "33% OFF",
            "savings": 6
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'springonion',
    name: 'Spring Onion (Scallions)',
    hindiName: 'हरा पत्ता प्याज़',
    categories: ["all","organic","leafy"],
    rating: 4.7,
    reviewsCount: 128,
    badge: 'Fresh Crisp',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 140,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=700&q=80', title: 'Spring Onion (Scallions) Farm View' }
    ],
    description: 'Crisp green stalks with tender scallion bulbs. Adds crisp flavor and color to fried rice, noodles, and stir-fry.',
    origin: 'Devanahalli Farms, Karnataka',
    weights: [
      {
            "label": "1 bunch (~250g)",
            "price": 14,
            "originalPrice": 19,
            "discount": "26% OFF",
            "savings": 5
      },
      {
            "label": "2 bunches (~500g)",
            "price": 26,
            "originalPrice": 36,
            "discount": "28% OFF",
            "savings": 10
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'sweetcorn',
    name: 'Sweet Corn (American Bhutta)',
    hindiName: 'मीठा अमेरिकन भुट्टा',
    categories: ["all","organic","seasonal"],
    rating: 4.9,
    reviewsCount: 176,
    badge: 'Sweet & Juicy',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 130,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=700&q=80', title: 'Sweet Corn (American Bhutta) Farm View' }
    ],
    description: 'Plump, golden-yellow sweet corn cobs in natural husk. Naturally sweet, juicy, and delicious boiled or roasted.',
    origin: 'Chikkaballapur Farms, Karnataka',
    weights: [
      {
            "label": "2 pcs",
            "price": 30,
            "originalPrice": 40,
            "discount": "25% OFF",
            "savings": 10
      },
      {
            "label": "4 pcs",
            "price": 56,
            "originalPrice": 80,
            "discount": "30% OFF",
            "savings": 24
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'pumpkin',
    name: 'Yellow Pumpkin (Kaddu)',
    hindiName: 'मीठा देसी कद्दू',
    categories: ["all","organic","daily"],
    rating: 4.7,
    reviewsCount: 115,
    badge: 'Farm Direct',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 110,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1506917728037-b6fb01c4e69b?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1506917728037-b6fb01c4e69b?auto=format&fit=crop&w=700&q=80', title: 'Yellow Pumpkin (Kaddu) Farm View' }
    ],
    description: 'Naturally ripened golden-fleshed pumpkin with mild sweetness and high beta-carotene content. Great for kaddu ki sabzi and sambar.',
    origin: 'Mandya Organic Farmers, Karnataka',
    weights: [
      {
            "label": "500 g cut",
            "price": 16,
            "originalPrice": 22,
            "discount": "27% OFF",
            "savings": 6
      },
      {
            "label": "1 kg cut",
            "price": 30,
            "originalPrice": 42,
            "discount": "28% OFF",
            "savings": 12
      },
      {
            "label": "2 kg cut",
            "price": 58,
            "originalPrice": 84,
            "discount": "31% OFF",
            "savings": 26
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'ridgegourd',
    name: 'Ridge Gourd (Turai)',
    hindiName: 'ताज़ा तोरई / तुरई',
    categories: ["all","organic","daily"],
    rating: 4.6,
    reviewsCount: 104,
    badge: 'Tender Green',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 110,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?auto=format&fit=crop&w=700&q=80', title: 'Ridge Gourd (Turai) Farm View' }
    ],
    description: 'Fresh ribbed ridge gourd, tender inside with high dietary fiber and easy digestibility.',
    origin: 'Doddaballapur Farms, Karnataka',
    weights: [
      {
            "label": "250 g",
            "price": 12,
            "originalPrice": 15,
            "discount": "20% OFF",
            "savings": 3
      },
      {
            "label": "500 g",
            "price": 22,
            "originalPrice": 28,
            "discount": "21% OFF",
            "savings": 6
      },
      {
            "label": "1 kg",
            "price": 40,
            "originalPrice": 52,
            "discount": "23% OFF",
            "savings": 12
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'spongegourd',
    name: 'Sponge Gourd (Gilki / Nenua)',
    hindiName: 'ताज़ा गिलकी / नेनुआ',
    categories: ["all","organic","daily"],
    rating: 4.7,
    reviewsCount: 98,
    badge: 'Farm Fresh',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 105,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=700&q=80', title: 'Sponge Gourd (Gilki / Nenua) Farm View' }
    ],
    description: 'Smooth-skinned, tender sponge gourd that cooks quickly with natural mild sweetness.',
    origin: 'Ramanagara Farms, Karnataka',
    weights: [
      {
            "label": "250 g",
            "price": 10,
            "originalPrice": 13,
            "discount": "23% OFF",
            "savings": 3
      },
      {
            "label": "500 g",
            "price": 19,
            "originalPrice": 25,
            "discount": "24% OFF",
            "savings": 6
      },
      {
            "label": "1 kg",
            "price": 36,
            "originalPrice": 48,
            "discount": "25% OFF",
            "savings": 12
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'pointedgourd',
    name: 'Pointed Gourd (Parwal)',
    hindiName: 'देसी हरा परवल',
    categories: ["all","organic","seasonal"],
    rating: 4.8,
    reviewsCount: 112,
    badge: 'Desi Choice',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 95,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=700&q=80', title: 'Pointed Gourd (Parwal) Farm View' }
    ],
    description: 'Farm-fresh striped pointed gourd with firm texture, ideal for potol korma, aloo parwal, and stuffed delicacies.',
    origin: 'Varanasi Green Collective, Uttar Pradesh',
    weights: [
      {
            "label": "250 g",
            "price": 15,
            "originalPrice": 20,
            "discount": "25% OFF",
            "savings": 5
      },
      {
            "label": "500 g",
            "price": 28,
            "originalPrice": 38,
            "discount": "26% OFF",
            "savings": 10
      },
      {
            "label": "1 kg",
            "price": 52,
            "originalPrice": 70,
            "discount": "26% OFF",
            "savings": 18
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'ivygourd',
    name: 'Ivy Gourd (Kundru / Tindora)',
    hindiName: 'छोटा कुंदरू / टिंडोरा',
    categories: ["all","organic","daily"],
    rating: 4.7,
    reviewsCount: 130,
    badge: 'Crunchy Pick',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 120,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=700&q=80', title: 'Ivy Gourd (Kundru / Tindora) Farm View' }
    ],
    description: 'Crispy green tindora/kundru, seedless and crunchy. Cook with mild spices for a delicious dry side dish.',
    origin: 'Tumkur Riverbed Farms, Karnataka',
    weights: [
      {
            "label": "250 g",
            "price": 11,
            "originalPrice": 15,
            "discount": "26% OFF",
            "savings": 4
      },
      {
            "label": "500 g",
            "price": 20,
            "originalPrice": 27,
            "discount": "25% OFF",
            "savings": 7
      },
      {
            "label": "1 kg",
            "price": 38,
            "originalPrice": 50,
            "discount": "24% OFF",
            "savings": 12
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'arbi',
    name: 'Taro Root (Arbi / Ghuiya)',
    hindiName: 'देसी अरबी / घुइयां',
    categories: ["all","organic","root"],
    rating: 4.8,
    reviewsCount: 108,
    badge: 'Farm Fresh',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 110,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=700&q=80', title: 'Taro Root (Arbi / Ghuiya) Farm View' }
    ],
    description: 'Firm, starchy colocasia/arbi corms. Boils soft and fries into delicious crispy golden arbi tuk.',
    origin: 'Mysore Heritage Farms, Karnataka',
    weights: [
      {
            "label": "250 g",
            "price": 12,
            "originalPrice": 16,
            "discount": "25% OFF",
            "savings": 4
      },
      {
            "label": "500 g",
            "price": 22,
            "originalPrice": 29,
            "discount": "24% OFF",
            "savings": 7
      },
      {
            "label": "1 kg",
            "price": 42,
            "originalPrice": 55,
            "discount": "23% OFF",
            "savings": 13
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'suran',
    name: 'Elephant Foot Yam (Suran)',
    hindiName: 'देसी जिमीकंद / सूरन',
    categories: ["all","organic","root"],
    rating: 4.7,
    reviewsCount: 94,
    badge: 'Nutrient Rich',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 100,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1587049352851-8d4e8913ac61?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1587049352851-8d4e8913ac61?auto=format&fit=crop&w=700&q=80', title: 'Elephant Foot Yam (Suran) Farm View' }
    ],
    description: 'Hearty, nutrient-rich elephant foot yam corm. Excellent for curries, festive vegetable bakes, and yam fry.',
    origin: 'Ratnagiri Agro Cluster, Maharashtra',
    weights: [
      {
            "label": "500 g cut",
            "price": 24,
            "originalPrice": 32,
            "discount": "25% OFF",
            "savings": 8
      },
      {
            "label": "1 kg cut",
            "price": 46,
            "originalPrice": 62,
            "discount": "25% OFF",
            "savings": 16
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'drumstick',
    name: 'Moringa (Drumstick)',
    hindiName: 'ताज़ा सहजन फली',
    categories: ["all","organic","daily"],
    rating: 4.9,
    reviewsCount: 180,
    badge: 'Superfood',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 120,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=700&q=80', title: 'Moringa (Drumstick) Farm View' }
    ],
    description: 'Tender green moringa drumsticks filled with soft pulp and aromatic flavor. Essential for South Indian sambar.',
    origin: 'Dindigul Farm Collective, Tamil Nadu',
    weights: [
      {
            "label": "250 g",
            "price": 14,
            "originalPrice": 18,
            "discount": "22% OFF",
            "savings": 4
      },
      {
            "label": "500 g",
            "price": 26,
            "originalPrice": 35,
            "discount": "25% OFF",
            "savings": 9
      },
      {
            "label": "1 kg",
            "price": 48,
            "originalPrice": 65,
            "discount": "26% OFF",
            "savings": 17
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'mushroom',
    name: 'Fresh Button Mushroom',
    hindiName: 'सफ़ेद बटन मशरूम',
    categories: ["all","organic","seasonal"],
    rating: 4.9,
    reviewsCount: 205,
    badge: 'Clean Punnet',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 130,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80', title: 'Fresh Button Mushroom Farm View' }
    ],
    description: 'Clean, plump, snow-white button mushrooms packed in breathable punnets. Rich in vitamin D and plant protein.',
    origin: 'Ooty Temperature-Controlled Farm, Tamil Nadu',
    weights: [
      {
            "label": "1 pack (200g)",
            "price": 55,
            "originalPrice": 75,
            "discount": "26% OFF",
            "savings": 20
      },
      {
            "label": "2 packs (400g)",
            "price": 102,
            "originalPrice": 150,
            "discount": "32% OFF",
            "savings": 48
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'rawbanana',
    name: 'Raw Green Banana',
    hindiName: 'कच्चा हरा केला',
    categories: ["all","organic","seasonal"],
    rating: 4.7,
    reviewsCount: 110,
    badge: 'Farm Fresh',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 140,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=700&q=80', title: 'Raw Green Banana Farm View' }
    ],
    description: 'Firm, green plantain bananas. Great for making South Indian vazhakkai poriyal, banana chips, and koftas.',
    origin: 'Pollachi Green Groves, Tamil Nadu',
    weights: [
      {
            "label": "500 g (~3 pcs)",
            "price": 16,
            "originalPrice": 22,
            "discount": "27% OFF",
            "savings": 6
      },
      {
            "label": "1 kg (~6 pcs)",
            "price": 30,
            "originalPrice": 40,
            "discount": "25% OFF",
            "savings": 10
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'rawpapaya',
    name: 'Raw Green Papaya',
    hindiName: 'कच्चा हरा पपीता',
    categories: ["all","organic","seasonal"],
    rating: 4.8,
    reviewsCount: 96,
    badge: 'Enzyme Rich',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 115,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=700&q=80', title: 'Raw Green Papaya Farm View' }
    ],
    description: 'Crisp green unripened papaya loaded with natural papain enzyme. Wonderful for som tum salads, sambar, and chutneys.',
    origin: 'Hassan Organic Orchard, Karnataka',
    weights: [
      {
            "label": "1 pc (~700g-1kg)",
            "price": 34,
            "originalPrice": 45,
            "discount": "24% OFF",
            "savings": 11
      },
      {
            "label": "2 pcs (~1.8kg)",
            "price": 62,
            "originalPrice": 90,
            "discount": "31% OFF",
            "savings": 28
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'greenzucchini',
    name: 'Exotic Green Zucchini',
    hindiName: 'हरी विदेशी ज़ुकिनी',
    categories: ["all","organic","seasonal"],
    rating: 4.8,
    reviewsCount: 124,
    badge: 'Hydroponic',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 90,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=700&q=80', title: 'Exotic Green Zucchini Farm View' }
    ],
    description: 'Tender, dark-green European zucchini with shiny skin and crisp flesh. Perfect for grilling, pastas, and stir-fries.',
    origin: 'Nilgiri Hydroponic Cluster, Tamil Nadu',
    weights: [
      {
            "label": "250 g",
            "price": 18,
            "originalPrice": 24,
            "discount": "25% OFF",
            "savings": 6
      },
      {
            "label": "500 g",
            "price": 34,
            "originalPrice": 45,
            "discount": "24% OFF",
            "savings": 11
      },
      {
            "label": "1 kg",
            "price": 65,
            "originalPrice": 85,
            "discount": "23% OFF",
            "savings": 20
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'yellowzucchini',
    name: 'Exotic Yellow Zucchini',
    hindiName: 'पीली विदेशी ज़ुकिनी',
    categories: ["all","organic","seasonal"],
    rating: 4.8,
    reviewsCount: 98,
    badge: 'Gourmet Gold',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 85,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=700&q=80', title: 'Exotic Yellow Zucchini Farm View' }
    ],
    description: 'Vibrant sunshine-yellow zucchini with mild sweet nutty taste. Adds stunning gourmet visual appeal to dishes.',
    origin: 'Nilgiri Hydroponic Cluster, Tamil Nadu',
    weights: [
      {
            "label": "250 g",
            "price": 20,
            "originalPrice": 26,
            "discount": "23% OFF",
            "savings": 6
      },
      {
            "label": "500 g",
            "price": 38,
            "originalPrice": 50,
            "discount": "24% OFF",
            "savings": 12
      },
      {
            "label": "1 kg",
            "price": 70,
            "originalPrice": 95,
            "discount": "26% OFF",
            "savings": 25
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'sweetpotato',
    name: 'Sweet Potato (Shakarkand)',
    hindiName: 'मीठा शकरकंद',
    categories: ["all","organic","root"],
    rating: 4.8,
    reviewsCount: 145,
    badge: 'Complex Carb',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 130,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=700&q=80', title: 'Sweet Potato (Shakarkand) Farm View' }
    ],
    description: 'Nutritious red-skinned sweet potato roots with naturally sweet orange-cream flesh. Excellent boiled, roasted, or chaat.',
    origin: 'Belgaum Red Soil Farms, Karnataka',
    weights: [
      {
            "label": "250 g",
            "price": 12,
            "originalPrice": 16,
            "discount": "25% OFF",
            "savings": 4
      },
      {
            "label": "500 g",
            "price": 22,
            "originalPrice": 30,
            "discount": "26% OFF",
            "savings": 8
      },
      {
            "label": "1 kg",
            "price": 42,
            "originalPrice": 58,
            "discount": "27% OFF",
            "savings": 16
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'turnip',
    name: 'White Turnip (Shalgam)',
    hindiName: 'सफ़ेद गुलाबी शलजम',
    categories: ["all","organic","root"],
    rating: 4.7,
    reviewsCount: 88,
    badge: 'Valley Pick',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 100,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=700&q=80', title: 'White Turnip (Shalgam) Farm View' }
    ],
    description: 'Tender white turnips with purple-blushed tops. Sweet with a mild peppery undertone, great for winter stews and pickles.',
    origin: 'Shimla Valley Produce, Himachal Pradesh',
    weights: [
      {
            "label": "250 g",
            "price": 10,
            "originalPrice": 14,
            "discount": "28% OFF",
            "savings": 4
      },
      {
            "label": "500 g",
            "price": 19,
            "originalPrice": 26,
            "discount": "26% OFF",
            "savings": 7
      },
      {
            "label": "1 kg",
            "price": 36,
            "originalPrice": 48,
            "discount": "25% OFF",
            "savings": 12
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'ashgourd',
    name: 'Ash Gourd (Petha / Safed Kaddu)',
    hindiName: 'सफ़ेद पेठा / भुआ',
    categories: ["all","organic","daily"],
    rating: 4.8,
    reviewsCount: 132,
    badge: 'Pranic Juice',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 110,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1506917728037-b6fb01c4e69b?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1506917728037-b6fb01c4e69b?auto=format&fit=crop&w=700&q=80', title: 'Ash Gourd (Petha / Safed Kaddu) Farm View' }
    ],
    description: 'Ash-coated cooling winter melon loaded with alkaline hydration. Famous for morning pranic juice and Kerala olan.',
    origin: 'Palakkad Organic Collective, Kerala',
    weights: [
      {
            "label": "500 g cut",
            "price": 17,
            "originalPrice": 23,
            "discount": "26% OFF",
            "savings": 6
      },
      {
            "label": "1 kg cut",
            "price": 32,
            "originalPrice": 44,
            "discount": "27% OFF",
            "savings": 12
      },
      {
            "label": "2 kg cut",
            "price": 60,
            "originalPrice": 85,
            "discount": "29% OFF",
            "savings": 25
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'clusterbeans',
    name: 'Cluster Beans (Gawar Phali)',
    hindiName: 'देसी ग्वार फली',
    categories: ["all","organic","daily"],
    rating: 4.7,
    reviewsCount: 92,
    badge: 'Fiber Rich',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 105,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=700&q=80', title: 'Cluster Beans (Gawar Phali) Farm View' }
    ],
    description: 'Young, tender cluster bean pods with earthy aroma. Excellent source of soluble fiber for everyday healthy sabzi.',
    origin: 'Bagalkot Agro Farms, Karnataka',
    weights: [
      {
            "label": "250 g",
            "price": 12,
            "originalPrice": 16,
            "discount": "25% OFF",
            "savings": 4
      },
      {
            "label": "500 g",
            "price": 22,
            "originalPrice": 29,
            "discount": "24% OFF",
            "savings": 7
      },
      {
            "label": "1 kg",
            "price": 42,
            "originalPrice": 56,
            "discount": "25% OFF",
            "savings": 14
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'redcabbage',
    name: 'Exotic Red Cabbage',
    hindiName: 'लाल / जामुनी पत्ता गोभी',
    categories: ["all","organic","leafy"],
    rating: 4.8,
    reviewsCount: 116,
    badge: 'Antioxidant',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 95,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1551893478-d726eaf0442c?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1551893478-d726eaf0442c?auto=format&fit=crop&w=700&q=80', title: 'Exotic Red Cabbage Farm View' }
    ],
    description: 'Stunning deep-purple cabbage heads loaded with 10x more anthocyanin antioxidants than green cabbage. Ideal for gourmet slaws.',
    origin: 'Ooty Valley Farms, Tamil Nadu',
    weights: [
      {
            "label": "1 pc (~500g)",
            "price": 56,
            "originalPrice": 75,
            "discount": "25% OFF",
            "savings": 19
      },
      {
            "label": "2 pcs (~1kg)",
            "price": 106,
            "originalPrice": 150,
            "discount": "29% OFF",
            "savings": 44
      }
],
    selectedWeightIndex: 0
  },
  {
    id: 'babycorn',
    name: 'Fresh Tender Baby Corn',
    hindiName: 'ताज़ा क्रंची बेबी कॉर्न',
    categories: ["all","organic","seasonal"],
    rating: 4.9,
    reviewsCount: 164,
    badge: 'Tender Sweet',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 125,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=700&q=80',
    gallery: [
      { url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=700&q=80', title: 'Fresh Tender Baby Corn Farm View' }
    ],
    description: 'Tender, crisp miniature corn ears peeled fresh and packed in hygienic trays. Ready for stir-fries, manchurian, and pizza toppings.',
    origin: 'Kolar Greenhouse Hub, Karnataka',
    weights: [
      {
            "label": "1 pack (200g)",
            "price": 50,
            "originalPrice": 68,
            "discount": "26% OFF",
            "savings": 18
      },
      {
            "label": "2 packs (400g)",
            "price": 94,
            "originalPrice": 136,
            "discount": "31% OFF",
            "savings": 42
      }
],
    selectedWeightIndex: 0
  }
];

const combosData = [
  {
    id: 'combo-daily',
    name: 'Daily Essentials Basket',
    hindiName: 'दैनिक सब्जी टोकरी',
    itemCount: 5,
    itemsList: 'Tomato (1kg), Potato (1kg), Onion (1kg), Green Chilli (100g), Coriander (1 bunch)',
    originalPrice: 215,
    offerPrice: 149,
    savings: 'Save ₹66 (31% OFF)',
    badge: 'Popular Everyday',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'combo-family',
    name: 'Family Vegetable Basket',
    hindiName: 'परिवार सम्पूर्ण बास्केट',
    itemCount: 9,
    itemsList: 'Tomato, Potato, Onion, Cauliflower, Capsicum, Carrot, Peas, Palak, Dhaniya (Total 10kg)',
    originalPrice: 580,
    offerPrice: 399,
    savings: 'Save ₹181 (31% OFF)',
    badge: 'Best Value For Family',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'combo-greens',
    name: 'Healthy Greens & Salad Basket',
    hindiName: 'हेल्दी ग्रीन्स बास्केट',
    itemCount: 6,
    itemsList: 'Spinach, Broccoli, Cucumber, Capsicum, Carrot, Fresh Coriander',
    originalPrice: 360,
    offerPrice: 249,
    savings: 'Save ₹111 (31% OFF)',
    badge: '100% Detox & Organic',
    image: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=700&q=80'
  }
];

// Master Fruit Catalog (16 Distinct Orchard Items)
const allFruitsData = [
  {
    id: 'mango',
    name: 'Alphonso Mango (Hapus)',
    hindiName: 'रत्नागिरी हापुस आम',
    categories: ['all', 'tropical', 'organic', 'seasonal'],
    rating: 4.9,
    reviewsCount: 312,
    badge: 'Ratnagiri Fresh',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 65,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=85',
    description: 'Direct from Devgad and Ratnagiri coastal orchards. Sweet, fragrant saffron pulp ripened naturally without artificial carbide.',
    origin: 'Ratnagiri, Maharashtra',
    weights: [
      { label: '500 g', price: 180, originalPrice: 220, discount: '18% OFF', savings: 40 },
      { label: '1 kg', price: 340, originalPrice: 420, discount: '19% OFF', savings: 80 },
      { label: '2 kg', price: 650, originalPrice: 840, discount: '22% OFF', savings: 190 },
      { label: '1 Dozen', price: 980, originalPrice: 1300, discount: '24% OFF', savings: 320 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'apple',
    name: 'Shimla Royal Apple',
    hindiName: 'शिमला सेब',
    categories: ['all', 'apples', 'seasonal'],
    rating: 4.8,
    reviewsCount: 268,
    badge: 'Himalayan Crisp',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 80,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=85',
    description: 'High-altitude mountain apples harvested from Kotgarh slopes. Crisp, juicy texture with natural mountain blush and high pectin.',
    origin: 'Kotgarh, Shimla, Himachal Pradesh',
    weights: [
      { label: '500 g', price: 95, originalPrice: 120, discount: '20% OFF', savings: 25 },
      { label: '1 kg', price: 180, originalPrice: 230, discount: '21% OFF', savings: 50 },
      { label: '2 kg', price: 340, originalPrice: 460, discount: '26% OFF', savings: 120 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'banana',
    name: 'Robusta Yelakki Banana',
    hindiName: 'इलायची केला',
    categories: ['all', 'tropical', 'organic'],
    rating: 4.7,
    reviewsCount: 420,
    badge: 'Daily Energy',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 120,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=85',
    description: 'Naturally ripened Karnataka Yelakki bananas with small aromatic pods and intensely sweet flavor. Rich in potassium and fiber.',
    origin: 'Nanjangud, Mysore, Karnataka',
    weights: [
      { label: '500 g', price: 40, originalPrice: 50, discount: '20% OFF', savings: 10 },
      { label: '1 kg', price: 75, originalPrice: 95, discount: '21% OFF', savings: 20 },
      { label: '2 kg', price: 140, originalPrice: 190, discount: '26% OFF', savings: 50 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'orange',
    name: 'Nagpur Sweet Orange (Santra)',
    hindiName: 'नागपुर संतरा',
    categories: ['all', 'citrus', 'seasonal'],
    rating: 4.8,
    reviewsCount: 195,
    badge: 'Vitamin C Rich',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 70,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=900&q=85',
    description: 'Juicy, fragrant Nagpur oranges packed with pulpy citrus juice and natural Vitamin C. Perfect for morning fresh juicing.',
    origin: 'Nagpur Orchards, Maharashtra',
    weights: [
      { label: '1 kg', price: 85, originalPrice: 110, discount: '22% OFF', savings: 25 },
      { label: '2 kg', price: 160, originalPrice: 220, discount: '27% OFF', savings: 60 },
      { label: '3 kg', price: 230, originalPrice: 330, discount: '30% OFF', savings: 100 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'pomegranate',
    name: 'Sindhuri Pomegranate (Anar)',
    hindiName: 'सिंदूरी अनार',
    categories: ['all', 'organic', 'seasonal'],
    rating: 4.9,
    reviewsCount: 230,
    badge: 'Superfood',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 55,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=85',
    description: 'Deep crimson ruby seeds rich in polyphenols and natural antioxidants. Plucked at peak sweetness from Solapur orchards.',
    origin: 'Solapur, Maharashtra',
    weights: [
      { label: '500 g', price: 110, originalPrice: 140, discount: '21% OFF', savings: 30 },
      { label: '1 kg', price: 210, originalPrice: 270, discount: '22% OFF', savings: 60 },
      { label: '2 kg', price: 399, originalPrice: 540, discount: '26% OFF', savings: 141 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'papaya',
    name: 'Sweet Red Lady Papaya',
    hindiName: 'रेड लेडी पपीता',
    categories: ['all', 'tropical', 'organic'],
    rating: 4.6,
    reviewsCount: 164,
    badge: 'Gut Health',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 40,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=900&q=85',
    description: 'Golden-orange sweet papayas with thick sweet flesh and digestive papain enzymes. Tree-ripened with zero chemical sprays.',
    origin: 'Chikkaballapur, Karnataka',
    weights: [
      { label: '1 pc (approx 1 kg)', price: 65, originalPrice: 85, discount: '23% OFF', savings: 20 },
      { label: '2 pcs (approx 2.2 kg)', price: 120, originalPrice: 170, discount: '29% OFF', savings: 50 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'grapes_green',
    name: 'Sonaka Seedless Green Grapes',
    hindiName: 'सोनाका हरे अंगूर',
    categories: ['all', 'berries', 'seasonal'],
    rating: 4.7,
    reviewsCount: 188,
    badge: 'Farm Crisp',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 60,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=900&q=85',
    description: 'Crisp, elongated green grapes from Nashik vineyards. Thin skin, burst of sweet floral juice with zero seeds.',
    origin: 'Nashik Vineyards, Maharashtra',
    weights: [
      { label: '500 g', price: 70, originalPrice: 90, discount: '22% OFF', savings: 20 },
      { label: '1 kg', price: 135, originalPrice: 180, discount: '25% OFF', savings: 45 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'grapes_black',
    name: 'Sharad Seedless Black Grapes',
    hindiName: 'काले अंगूर',
    categories: ['all', 'berries'],
    rating: 4.8,
    reviewsCount: 142,
    badge: 'Antioxidant Boost',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 45,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=900&q=85',
    description: 'Dark purple to black crisp grapes with velvety natural bloom. Deep honeyed sweetness packed with anthocyanins.',
    origin: 'Sangli, Maharashtra',
    weights: [
      { label: '500 g', price: 80, originalPrice: 105, discount: '23% OFF', savings: 25 },
      { label: '1 kg', price: 155, originalPrice: 210, discount: '26% OFF', savings: 55 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'mosambi',
    name: 'Juicy Sweet Lime (Mosambi)',
    hindiName: 'मीठी मौसमी',
    categories: ['all', 'citrus'],
    rating: 4.7,
    reviewsCount: 175,
    badge: 'Hydration Choice',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 90,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=900&q=85',
    description: 'Thin-skinned juicy mosambi with mild, low-acid sweetness. Essential for immunity and daily natural rejuvenation.',
    origin: 'Jalna Citrus Orchards, Maharashtra',
    weights: [
      { label: '1 kg', price: 75, originalPrice: 95, discount: '21% OFF', savings: 20 },
      { label: '2 kg', price: 140, originalPrice: 190, discount: '26% OFF', savings: 50 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'strawberry',
    name: 'Mahabaleshwar Sweet Strawberry',
    hindiName: 'महाबलेश्वर स्ट्रॉबेरी',
    categories: ['all', 'berries', 'seasonal'],
    rating: 4.9,
    reviewsCount: 280,
    badge: 'Valley Fresh',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 35,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=900&q=85',
    description: 'Sun-ripened red strawberries hand-picked from foggy Mahabaleshwar hills. Fragrant, tender, and irresistibly sweet.',
    origin: 'Mahabaleshwar, Maharashtra',
    weights: [
      { label: '1 Box (250 g)', price: 90, originalPrice: 120, discount: '25% OFF', savings: 30 },
      { label: '2 Boxes (500 g)', price: 170, originalPrice: 240, discount: '29% OFF', savings: 70 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'dragonfruit',
    name: 'Organic Red Dragon Fruit',
    hindiName: 'कमलम / ड्रैगन फ्रूट',
    categories: ['all', 'tropical', 'organic'],
    rating: 4.8,
    reviewsCount: 110,
    badge: 'Exotic Harvest',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 30,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=900&q=85',
    description: 'Vibrant magenta skin with ruby red inside pulp. Mildly sweet, refreshing crunch with dietary fiber and prebiotics.',
    origin: 'Tumakuru Organic Farm, Karnataka',
    weights: [
      { label: '1 pc (approx 350 g)', price: 85, originalPrice: 110, discount: '22% OFF', savings: 25 },
      { label: '2 pcs (approx 700 g)', price: 160, originalPrice: 220, discount: '27% OFF', savings: 60 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'guava',
    name: 'Allahabad Safeda Sweet Guava',
    hindiName: 'इलाहाबादी सफेदा अमरूद',
    categories: ['all', 'apples', 'organic'],
    rating: 4.7,
    reviewsCount: 155,
    badge: 'High Fiber',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 50,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1536511135898-752b047514d7?auto=format&fit=crop&w=900&q=85',
    description: 'Firm white flesh with sweet creamy flavor and edible soft seeds. Harvested at dawn from local pesticide-free groves.',
    origin: 'Mandya Agro Farm, Karnataka',
    weights: [
      { label: '500 g', price: 45, originalPrice: 60, discount: '25% OFF', savings: 15 },
      { label: '1 kg', price: 85, originalPrice: 120, discount: '29% OFF', savings: 35 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'watermelon',
    name: 'Kiran Sweet Striped Watermelon',
    hindiName: 'किरण मीठा तरबूज',
    categories: ['all', 'berries', 'seasonal'],
    rating: 4.8,
    reviewsCount: 205,
    badge: 'Summer Chill',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 45,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=85',
    description: 'Crisp ruby red interior with high sugar brix level. 92% natural hydrating electrolytes with minimal seeds.',
    origin: 'Ramanagara, Karnataka',
    weights: [
      { label: '1 pc (2.5 - 3 kg)', price: 89, originalPrice: 120, discount: '25% OFF', savings: 31 },
      { label: '1 pc (4 - 4.5 kg)', price: 139, originalPrice: 180, discount: '22% OFF', savings: 41 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'kiwi',
    name: 'Ziro Valley Green Kiwi Pack',
    hindiName: 'हरा कीवी',
    categories: ['all', 'citrus'],
    rating: 4.7,
    reviewsCount: 118,
    badge: 'Immunity Punch',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 40,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=900&q=85',
    description: 'Zesty green kiwis bursting with actinidin enzymes and Vitamin C. Sourced sustainably from Indian foothill farms.',
    origin: 'Ziro Valley, Arunachal Pradesh',
    weights: [
      { label: '3 Pcs Pack', price: 85, originalPrice: 110, discount: '22% OFF', savings: 25 },
      { label: '6 Pcs Pack', price: 160, originalPrice: 220, discount: '27% OFF', savings: 60 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'tender_coconut',
    name: 'Fresh Tender Coconut (Bonda)',
    hindiName: 'ताज़ा डाभ नारियल पानी',
    categories: ['all', 'tropical', 'organic'],
    rating: 4.9,
    reviewsCount: 380,
    badge: 'Pure Electrolytes',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 110,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?auto=format&fit=crop&w=900&q=85',
    description: 'Directly harvested from Karnataka tall palms. Filled with sweet cooling mineral water (350-400ml) and thin malai.',
    origin: 'Maddur, Mandya, Karnataka',
    weights: [
      { label: '1 Pc', price: 55, originalPrice: 70, discount: '21% OFF', savings: 15 },
      { label: '2 Pcs Pack', price: 105, originalPrice: 140, discount: '25% OFF', savings: 35 },
      { label: '4 Pcs Family Pack', price: 199, originalPrice: 280, discount: '28% OFF', savings: 81 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'pineapple',
    name: 'Vazhakulam Sweet Queen Pineapple',
    hindiName: 'मीठा अनानास',
    categories: ['all', 'tropical'],
    rating: 4.7,
    reviewsCount: 135,
    badge: 'Aromatic & Sweet',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 35,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=900&q=85',
    description: 'GI-tagged Vazhakulam sweet pineapple. Golden sweet flesh with pleasant tanginess and natural bromelain enzyme.',
    origin: 'Vazhakulam, Kerala',
    weights: [
      { label: '1 pc (approx 900 g)', price: 79, originalPrice: 105, discount: '24% OFF', savings: 26 },
      { label: '2 pcs (approx 1.8 kg)', price: 149, originalPrice: 210, discount: '29% OFF', savings: 61 }
    ],
    selectedWeightIndex: 0
  }
];

// Fruit Combos & Baskets
const fruitCombosData = [
  {
    id: 'fruit-combo-vitality',
    name: 'Morning Vitality Fruit Basket',
    hindiName: 'मॉर्निंग वाइटैलिटी फ्रूट बास्केट',
    itemCount: 5,
    itemsList: 'Alphonso Mango (500g), Shimla Apple (500g), Yelakki Banana (500g), Nagpur Orange (1kg), Green Grapes (500g)',
    originalPrice: 450,
    offerPrice: 349,
    savings: 'Save ₹101 (22% OFF)',
    badge: 'Chef Curated',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'fruit-combo-family',
    name: 'Daily Family Nutrition Fruit Box',
    hindiName: 'पारिवारिक फल पोषण बॉक्स',
    itemCount: 8,
    itemsList: 'Shimla Apple (1kg), Robusta Banana (1kg), Nagpur Orange (1kg), Papaya (1 pc), Pomegranate (500g), Guava (500g)',
    originalPrice: 590,
    offerPrice: 449,
    savings: 'Save ₹141 (24% OFF)',
    badge: 'Best Family Value',
    image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'fruit-combo-immunity',
    name: 'Immunity Booster Citrus & Antioxidant Pack',
    hindiName: 'इम्युनिटी बूस्टर फ्रूट पैक',
    itemCount: 5,
    itemsList: 'Nagpur Orange (1kg), Juicy Mosambi (1kg), Kiwi (3 pcs pack), Pomegranate (500g), Black Grapes (500g)',
    originalPrice: 510,
    offerPrice: 399,
    savings: 'Save ₹111 (22% OFF)',
    badge: '100% Vitamin C',
    image: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=700&q=80'
  }
];

// -------------------------------------------------------------
// GROCERY & PANTRY DATASET (16 Essential Kitchen Staples)
// -------------------------------------------------------------
const allGroceryData = [
  {
    id: 'organic_toor_dal',
    name: 'Unpolished Organic Toor Dal',
    hindiName: 'देसी अरहर / तुअर दाल',
    categories: ['all', 'dals', 'organic'],
    rating: 4.8,
    reviewsCount: 312,
    badge: 'Unpolished',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 85,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?auto=format&fit=crop&w=900&q=85',
    description: 'Traditional unpolished split pigeon peas naturally sun-dried in Latur. Zero chemical polishing, rich in natural plant protein and dietary fiber.',
    origin: 'Latur, Maharashtra',
    weights: [
      { label: '500 g', price: 84, originalPrice: 105, discount: '20% OFF', savings: 21 },
      { label: '1 kg', price: 160, originalPrice: 205, discount: '22% OFF', savings: 45 },
      { label: '2 kg', price: 310, originalPrice: 410, discount: '24% OFF', savings: 100 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'sharbati_atta',
    name: 'Stone-Ground MP Sharbati Whole Wheat Atta',
    hindiName: 'एमपी शरबती चक्की आटा',
    categories: ['all', 'grains', 'organic'],
    rating: 4.9,
    reviewsCount: 428,
    badge: 'Stone Ground',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 120,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
    description: '100% whole grain MP Sharbati wheat slow ground on natural stone chakki. Retains wholesome germ and bran for softest golden rotis.',
    origin: 'Sehore, Madhya Pradesh',
    weights: [
      { label: '1 kg', price: 58, originalPrice: 72, discount: '19% OFF', savings: 14 },
      { label: '5 kg', price: 265, originalPrice: 345, discount: '23% OFF', savings: 80 },
      { label: '10 kg', price: 510, originalPrice: 690, discount: '26% OFF', savings: 180 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'mustard_oil',
    name: 'Wood-Pressed Kacchi Ghani Mustard Oil',
    hindiName: 'कच्ची घानी सरसों का तेल',
    categories: ['all', 'oils', 'organic'],
    rating: 4.8,
    reviewsCount: 265,
    badge: 'Wood Pressed',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 50,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=85',
    description: 'Traditional kolhu cold-pressed oil from organic yellow mustard seeds. Pungent aroma with high smoke point, zero chemical solvents.',
    origin: 'Bharatpur, Rajasthan',
    weights: [
      { label: '500 ml', price: 115, originalPrice: 145, discount: '21% OFF', savings: 30 },
      { label: '1 L', price: 220, originalPrice: 285, discount: '23% OFF', savings: 65 },
      { label: '5 L Can', price: 1050, originalPrice: 1390, discount: '24% OFF', savings: 340 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'desi_cow_ghee',
    name: 'Bilona A2 Desi Gir Cow Cultured Ghee',
    hindiName: 'बिलोना ए२ देसी गाय का घी',
    categories: ['all', 'oils', 'organic'],
    rating: 4.9,
    reviewsCount: 390,
    badge: 'Vedic Bilona',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 45,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=900&q=85',
    description: 'Hand-churned from curd of free-grazing indigenous Gir cows over firewood. Golden granular texture with rich nutty aroma and butyric acid.',
    origin: 'Malnad Pastures, Karnataka',
    weights: [
      { label: '250 ml', price: 349, originalPrice: 425, discount: '18% OFF', savings: 76 },
      { label: '500 ml', price: 675, originalPrice: 840, discount: '20% OFF', savings: 165 },
      { label: '1 L Glass Jar', price: 1299, originalPrice: 1650, discount: '21% OFF', savings: 351 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'basmati_rice',
    name: 'Royal Aged Himalayan Basmati Rice',
    hindiName: 'शाही पुराना बासमती चावल',
    categories: ['all', 'grains'],
    rating: 4.7,
    reviewsCount: 230,
    badge: '2 Years Aged',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 90,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=85',
    description: 'Naturally aged for 24 months in Himalayan foothills. Extra-long slender grains that elongate to double their length with exquisite fragrance.',
    origin: 'Dehradun Valley, Uttarakhand',
    weights: [
      { label: '1 kg', price: 115, originalPrice: 145, discount: '21% OFF', savings: 30 },
      { label: '5 kg Bag', price: 540, originalPrice: 720, discount: '25% OFF', savings: 180 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'moong_dal',
    name: 'Organic Split Green Moong Dal',
    hindiName: 'छिलका वाली मूंग दाल',
    categories: ['all', 'dals', 'organic'],
    rating: 4.8,
    reviewsCount: 175,
    badge: 'Easy Digest',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 65,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=900&q=85',
    description: 'Light on the stomach and rich in iron. Unpolished split green gram harvested naturally in Gulbarga drylands.',
    origin: 'Gulbarga, Karnataka',
    weights: [
      { label: '500 g', price: 75, originalPrice: 95, discount: '21% OFF', savings: 20 },
      { label: '1 kg', price: 145, originalPrice: 185, discount: '22% OFF', savings: 40 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'raw_honey',
    name: '100% Pure Raw Wild Forest Honey',
    hindiName: 'जंगली प्राकृतिक शहद',
    categories: ['all', 'sweeteners', 'organic'],
    rating: 4.9,
    reviewsCount: 295,
    badge: 'Unprocessed',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 40,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=85',
    description: 'Ethically collected from wild multi-floral apiaries in Western Ghats. Unpasteurized, unfiltered, rich in bee pollen and digestive enzymes.',
    origin: 'Coorg Forests, Karnataka',
    weights: [
      { label: '250 g', price: 175, originalPrice: 220, discount: '20% OFF', savings: 45 },
      { label: '500 g Glass Jar', price: 330, originalPrice: 425, discount: '22% OFF', savings: 95 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'haldi_powder',
    name: 'Salem High-Curcumin Golden Turmeric',
    hindiName: 'सेलम शुद्ध हल्दी पाउडर',
    categories: ['all', 'spices', 'organic'],
    rating: 4.9,
    reviewsCount: 320,
    badge: '5%+ Curcumin',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 110,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=85',
    description: 'Naturally sun-dried Salem turmeric fingers slow-pulverized to protect active curcumin compounds and vibrant deep golden color.',
    origin: 'Salem, Tamil Nadu',
    weights: [
      { label: '200 g', price: 55, originalPrice: 70, discount: '21% OFF', savings: 15 },
      { label: '500 g', price: 130, originalPrice: 175, discount: '26% OFF', savings: 45 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'kashmiri_chilli',
    name: 'Stemless Kashmiri Degi Mirch Powder',
    hindiName: 'कश्मीरी लाल मिर्च पाउडर',
    categories: ['all', 'spices'],
    rating: 4.8,
    reviewsCount: 210,
    badge: 'Rich Red Color',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 75,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=85',
    description: 'Gives rich appetizing ruby crimson color to gravies with pleasant gentle warmth. 100% pure dried chillies with zero artificial dyes.',
    origin: 'Pampore, Kashmir',
    weights: [
      { label: '100 g', price: 65, originalPrice: 85, discount: '24% OFF', savings: 20 },
      { label: '250 g', price: 150, originalPrice: 200, discount: '25% OFF', savings: 50 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'jeera_cumin',
    name: 'Fragrant Unpolished Cumin Seeds (Jeera)',
    hindiName: 'साबुत जीरा (उंझा)',
    categories: ['all', 'spices'],
    rating: 4.7,
    reviewsCount: 195,
    badge: 'High Essential Oil',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 80,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=900&q=85',
    description: 'Aromatic whole cumin seeds from Unjha Mandi. Intense warm earthy fragrance essential for daily Indian tadkas and curries.',
    origin: 'Unjha, Gujarat',
    weights: [
      { label: '100 g', price: 50, originalPrice: 65, discount: '23% OFF', savings: 15 },
      { label: '250 g', price: 120, originalPrice: 160, discount: '25% OFF', savings: 40 },
      { label: '500 g', price: 230, originalPrice: 310, discount: '26% OFF', savings: 80 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'organic_jaggery',
    name: 'Chemical-Free Kolhapuri Natural Jaggery',
    hindiName: 'कोल्हापुरी शुद्ध गुड़',
    categories: ['all', 'sweeteners', 'organic'],
    rating: 4.8,
    reviewsCount: 224,
    badge: 'No Soda / Sulphur',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 70,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=900&q=85',
    description: 'Traditional dark unrefined sugarcane jaggery boiled in iron vats. No chemical bleaching, naturally rich in iron and vital minerals.',
    origin: 'Kolhapur, Maharashtra',
    weights: [
      { label: '500 g', price: 45, originalPrice: 60, discount: '25% OFF', savings: 15 },
      { label: '1 kg Block', price: 85, originalPrice: 115, discount: '26% OFF', savings: 30 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'groundnut_oil',
    name: 'Cold-Pressed Mara Chekku Groundnut Oil',
    hindiName: 'कच्ची घानी मूंगफली तेल',
    categories: ['all', 'oils'],
    rating: 4.7,
    reviewsCount: 185,
    badge: 'Heart Healthy',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 55,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=900&q=85',
    description: 'Extracted using wooden pestle from prime Saurashtra peanuts without artificial heat. Distinct sweet nutty taste perfect for everyday Indian cooking.',
    origin: 'Saurashtra, Gujarat',
    weights: [
      { label: '1 L', price: 235, originalPrice: 299, discount: '21% OFF', savings: 64 },
      { label: '5 L Can', price: 1120, originalPrice: 1450, discount: '23% OFF', savings: 330 }
    ],
    selectedWeightIndex: 0
  },
  {
    id: 'chana_dal',
    name: 'Unpolished Desi Chana Dal',
    hindiName: 'देसी चना दाल',
    categories: ['all', 'dals', 'organic'],
    rating: 4.7,
    reviewsCount: 160,
    badge: 'Zero Polish',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 65,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?auto=format&fit=crop&w=900&q=85',
    description: 'Wholesome split Bengal gram from Bikaner farms. Packed with soluble fiber, ideal for puran poli, tadka dals, and dry curries.',
    origin: 'Bikaner, Rajasthan',
    weights: [
      { label: '500 g', price: 62, originalPrice: 80, discount: '23% OFF', savings: 18 },
      { label: '1 kg', price: 118, originalPrice: 155, discount: '24% OFF', savings: 37 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'california_almonds',
    name: 'Premium Royal California Almonds (Badam)',
    hindiName: 'कैलिफोर्निया बादाम गिरी',
    categories: ['all', 'dryfruits'],
    rating: 4.9,
    reviewsCount: 360,
    badge: 'Jumbo Size',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 50,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=900&q=85',
    description: 'Hand-sorted, sweet, crunchy almonds with uniform size and zero oil extraction. High in Vitamin E, magnesium, and healthy fats.',
    origin: 'Orchard Select',
    weights: [
      { label: '250 g', price: 215, originalPrice: 280, discount: '23% OFF', savings: 65 },
      { label: '500 g', price: 410, originalPrice: 550, discount: '25% OFF', savings: 140 },
      { label: '1 kg Pack', price: 790, originalPrice: 1080, discount: '27% OFF', savings: 290 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'w320_cashews',
    name: 'Jumbo W320 Mangalore Whole Cashews (Kaju)',
    hindiName: 'साबुत काजू (W320)',
    categories: ['all', 'dryfruits'],
    rating: 4.8,
    reviewsCount: 280,
    badge: 'Grade W320',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 45,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1569420067664-5089307d91d1?auto=format&fit=crop&w=900&q=85',
    description: 'Flawless whole white cashew nuts sorted in Mangalore. Naturally sweet, buttery crunch for festive sweets, gravies, and healthy snacking.',
    origin: 'Mangalore, Karnataka',
    weights: [
      { label: '250 g', price: 245, originalPrice: 320, discount: '23% OFF', savings: 75 },
      { label: '500 g', price: 470, originalPrice: 620, discount: '24% OFF', savings: 150 },
      { label: '1 kg Pack', price: 899, originalPrice: 1200, discount: '25% OFF', savings: 301 }
    ],
    selectedWeightIndex: 1
  },
  {
    id: 'pink_rock_salt',
    name: 'Mineral-Rich Himalayan Pink Rock Salt',
    hindiName: 'सेंधा नमक (पिंक सॉल्ट)',
    categories: ['all', 'spices'],
    rating: 4.8,
    reviewsCount: 190,
    badge: '84 Minerals',
    badgeType: 'fresh',
    inStock: true,
    stockCount: 100,
    isNew: false,
    image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=900&q=85',
    description: 'Pure unrefined crystalline pink salt hand-mined from ancient seabed deposits. Contains natural calcium, potassium, and magnesium.',
    origin: 'Himalayan Foothills',
    weights: [
      { label: '1 kg Pouch', price: 48, originalPrice: 65, discount: '26% OFF', savings: 17 },
      { label: '2 kg Pack', price: 90, originalPrice: 125, discount: '28% OFF', savings: 35 }
    ],
    selectedWeightIndex: 0
  }
];

// Curated Grocery & Pantry Combos
const groceryCombosData = [
  {
    id: 'pantry-combo-monthly',
    name: 'Monthly Essential Family Kitchen Kit',
    hindiName: 'मासिक पारिवारिक रसोई किट',
    itemCount: 8,
    itemsList: 'Sharbati Atta (5kg), Himalayan Basmati (5kg), Toor Dal (1kg), Mustard Oil (1L), Moong Dal (1kg), Turmeric (200g), Jeera (250g), Pink Salt (1kg)',
    originalPrice: 1480,
    offerPrice: 1199,
    savings: 'Save ₹281 (19% OFF)',
    badge: 'Complete Kitchen Box',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'pantry-combo-dals',
    name: 'Complete Protein Organic Dal Trio',
    hindiName: 'शुद्ध दाल तिकड़ी पैक',
    itemCount: 3,
    itemsList: 'Unpolished Toor Dal (1kg), Green Moong Dal (1kg), Desi Chana Dal (1kg)',
    originalPrice: 545,
    offerPrice: 419,
    savings: 'Save ₹126 (23% OFF)',
    badge: 'High Plant Protein',
    image: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'pantry-combo-oils',
    name: 'Cold-Pressed Wood Chekku Cooking Oil Duo',
    hindiName: 'कच्ची घानी कुकिंग ऑयल पैक',
    itemCount: 2,
    itemsList: 'Wood-Pressed Yellow Mustard Oil (1L) + Wood-Pressed Groundnut Oil (1L)',
    originalPrice: 584,
    offerPrice: 449,
    savings: 'Save ₹135 (23% OFF)',
    badge: 'Heart Care Oils',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80'
  }
];

// LocalStorage Persistence State with dual-key FreshMart / SabjiHub compatibility
function loadStoredState(key, fallback) {
  try {
    const altKey = key.startsWith('sabjihub_') ? key.replace('sabjihub_', 'freshmart_') : key.replace('freshmart_', 'sabjihub_');
    const item = localStorage.getItem(key) || localStorage.getItem(altKey);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveStoredState(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    const altKey = key.startsWith('sabjihub_') ? key.replace('sabjihub_', 'freshmart_') : key.replace('freshmart_', 'sabjihub_');
    localStorage.setItem(altKey, serialized);
  } catch (e) {}
}

// Global Application State
let cart = loadStoredState('sabjihub_cart', {});
let wishlist = loadStoredState('sabjihub_wishlist', []);
let savedLoc = null;
try {
  const rawLoc = localStorage.getItem('sabjihub_location');
  if (rawLoc) savedLoc = JSON.parse(rawLoc);
} catch (e) {}
let currentCity = (savedLoc && savedLoc.shortAddress) || loadStoredState('sabjihub_city', 'Garhi, Noida');
let currentPincode = (savedLoc && savedLoc.postalCode) || loadStoredState('sabjihub_pincode', '201301');
let currentDeliveryETA = loadStoredState('sabjihub_eta', '20 mins');
let isGPSLiveLocation = loadStoredState('sabjihub_is_gps', false);
let appliedCoupon = loadStoredState('sabjihub_coupon', null);

// Product Details Specific State (for Fresh Tomato)
let detailSelectedWeightIndex = 2; // Default 1 kg (₹40)
let detailQuantity = 1;
let currentGalleryImageIndex = 0;

// Filter State for Shop Page
let filterState = {
  category: 'all',
  maxPrice: 250,
  minRating: 0,
  onlyInStock: false,
  onlyOffers: false,
  sortBy: 'popular',
  searchQuery: ''
};

// Filter State for Fruits Orchard Page
let fruitFilterState = {
  category: 'all',
  maxPrice: 1000,
  minRating: 0,
  onlyInStock: false,
  onlyOffers: false,
  sortBy: 'popular',
  searchQuery: ''
};

// Filter State for Grocery & Pantry Page
let groceryFilterState = {
  category: 'all',
  maxPrice: 2000,
  minRating: 0,
  onlyInStock: false,
  onlyOffers: false,
  sortBy: 'popular',
  searchQuery: ''
};

// -------------------------------------------------------------
// UNIFIED MASTER CATALOG & PRODUCT NORMALIZATION (57 PRODUCTS)
// -------------------------------------------------------------
window.__suspendedProductIds = new Set();

function isProductSuspended(id) {
  if (!id || !window.__suspendedProductIds) return false;
  const clean = String(id).replace(/^prod_/, '');
  return window.__suspendedProductIds.has(id) ||
         window.__suspendedProductIds.has('prod_' + clean) ||
         window.__suspendedProductIds.has(clean);
}
window.isProductSuspended = isProductSuspended;

function normalizeCatalogProduct(p, type) {
  if (!p) return null;
  const weights = (p.weights && p.weights.length > 0) ? p.weights : [
    {
      label: p.itemCount ? `${p.itemCount} Items Combo` : '1 Pack',
      price: p.offerPrice || p.price || 0,
      originalPrice: p.originalPrice || (p.offerPrice || p.price || 0),
      discount: p.savings ? (p.savings.split('(')[1]?.replace(')', '') || 'Value Combo') : 'Special Offer'
    }
  ];
  return {
    ...p,
    catalogType: p.catalogType || type,
    selectedWeightIndex: p.selectedWeightIndex || 0,
    weights,
    rating: p.rating || '4.9',
    reviewsCount: p.reviewsCount || 140,
    origin: p.origin || 'FreshMart Direct Farm Cooperative',
    badge: p.badge || '100% Farm Fresh',
    badgeType: p.badgeType || 'bestseller',
    description: p.description || p.itemsList || `${p.name} - Fresh harvest quality checked and delivered in 90 minutes.`,
    gallery: p.gallery || [
      { url: p.image, title: p.name + ' - Main View' },
      { url: p.image, title: p.name + ' - Fresh Harvest' },
      { url: p.image, title: p.name + ' - Quality Packaging' },
      { url: p.image, title: p.name + ' - Farm Direct' }
    ]
  };
}

function getAllCatalogProducts() {
  return [
    ...allVegetablesData.map(p => normalizeCatalogProduct(p, 'vegetables')),
    ...combosData.map(p => normalizeCatalogProduct(p, 'vegetables')),
    ...allFruitsData.map(p => normalizeCatalogProduct(p, 'fruits')),
    ...fruitCombosData.map(p => normalizeCatalogProduct(p, 'fruits')),
    ...allGroceryData.map(p => normalizeCatalogProduct(p, 'grocery')),
    ...groceryCombosData.map(p => normalizeCatalogProduct(p, 'grocery'))
  ];
}
window.getAllCatalogProducts = getAllCatalogProducts;

// Unified Product Lookup Helper (Across all 57 products & Combos)
function findAnyProduct(productId) {
  if (!productId) return null;
  const cleanId = String(productId).trim();
  const all = getAllCatalogProducts();
  return (
    all.find(p => p.id === cleanId) ||
    all.find(p => p.id === 'prod_' + cleanId) ||
    all.find(p => ('prod_' + p.id) === cleanId) ||
    all.find(p => p.id.replace(/^prod_/, '') === cleanId.replace(/^prod_/, '')) ||
    null
  );
}
window.findAnyProduct = findAnyProduct;

// Universal Storefront Product Card Renderer
function renderProductCardHtml(product) {
  if (!product) return '';
  const p = normalizeCatalogProduct(product, product.catalogType || 'vegetables');
  const activeWeight = p.weights[p.selectedWeightIndex || 0] || p.weights[0];
  const cartKey = `${p.id}-${p.selectedWeightIndex || 0}`;
  const inCartQty = cart[cartKey] ? cart[cartKey].qty : 0;
  const isWishlisted = wishlist.includes(p.id);
  const detailLink = `product-details.html?id=${encodeURIComponent(p.id)}`;
  const isSuspended = (window.__suspendedProductIds && window.__suspendedProductIds.has(p.id)) || p.status === 'SUSPENDED';

  return `
    <div class="product-card group bg-white rounded-3xl p-4 sm:p-5 border border-emerald-900/5 shadow-soft shadow-card-hover flex flex-col justify-between relative transition-all duration-300">
      <div class="flex items-center justify-between gap-2 mb-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isSuspended 
            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
            : p.badgeType === 'bestseller' 
              ? 'bg-amber-100 text-amber-900 border border-amber-300/60' 
              : 'badge-fresh'
        }">
          <span class="w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-rose-500' : p.badgeType === 'bestseller' ? 'bg-amber-500' : 'bg-emerald-600'} animate-pulse"></span>
          ${isSuspended ? 'Temporarily Suspended' : p.badge}
        </span>

        <div class="flex items-center gap-1.5">
          <button 
            onclick="toggleWishlist('${p.id}', event)" 
            class="w-8 h-8 rounded-xl bg-stone-50 hover:bg-red-50 flex items-center justify-center transition-colors text-stone-400 hover:text-red-500"
            title="Add to Wishlist"
          >
            <svg class="w-4 h-4 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-stone-400'}" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          <div class="flex items-center gap-1 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-100 text-xs font-semibold text-emerald-800">
            <span class="text-amber-500">★</span>
            <span>${p.rating}</span>
          </div>
        </div>
      </div>

      <a href="${detailLink}" class="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-stone-50 mb-4 img-zoom-container flex items-center justify-center block">
        <img 
          src="${p.image}" 
          alt="${p.name}" 
          loading="lazy"
          class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div class="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium text-white/90">
          🌱 ${p.origin.split(',')[0]}
        </div>
        ${activeWeight.discount ? `
          <div class="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
            ${activeWeight.discount}
          </div>
        ` : ''}

        <div class="quick-actions-bar absolute inset-x-3 bottom-10 flex justify-center">
          <button 
            type="button"
            onclick="event.preventDefault(); openQuickView('${p.id}')" 
            class="px-4 py-2 bg-white/95 hover:bg-white text-emerald-950 font-bold text-xs rounded-xl shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all"
          >
            <span>Quick View</span>
          </button>
        </div>
      </a>

      <div class="flex-1">
        <a href="${detailLink}">
          <h3 class="font-bold text-base sm:text-lg text-emerald-950 group-hover:text-emerald-700 transition-colors">
            ${p.name}
          </h3>
        </a>
        <p class="text-xs text-emerald-700/80 font-medium mb-1.5">${p.hindiName}</p>
        <p class="text-xs text-stone-500 line-clamp-2 mb-3 leading-relaxed">
          ${p.description}
        </p>

        <div class="mb-4">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-emerald-900/60 mb-1.5 flex items-center justify-between">
            <span>Select Quantity</span>
            <span class="text-emerald-700 font-bold">${activeWeight.label}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${p.weights.map((w, idx) => `
              <button 
                onclick="selectProductWeight('${p.id}', ${idx})" 
                class="weight-chip px-2.5 py-1 rounded-xl text-xs font-semibold ${
                  idx === (p.selectedWeightIndex || 0) ? 'active' : 'bg-stone-50 text-stone-700'
                }"
              >
                ${w.label}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="pt-3 border-t border-emerald-950/5 flex items-center justify-between mt-auto">
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-xl sm:text-2xl font-black text-emerald-950">₹${activeWeight.price}</span>
            ${activeWeight.originalPrice > activeWeight.price ? `<span class="text-xs text-stone-400 line-through">₹${activeWeight.originalPrice}</span>` : ''}
          </div>
          <span class="text-[10px] text-emerald-600 font-semibold block">Inclusive of all taxes</span>
        </div>

        <div class="min-w-[100px] flex justify-end">
          ${isSuspended ? `
            <span class="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-400 text-xs font-bold border border-stone-200">
              Unavailable
            </span>
          ` : inCartQty === 0 ? `
            <button 
              onclick="addToCart('${p.id}', ${p.selectedWeightIndex || 0})" 
              class="btn-primary flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-95"
            >
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>ADD</span>
            </button>
          ` : `
            <div class="inline-flex items-center bg-emerald-800 text-white rounded-xl shadow-md shadow-emerald-800/20 overflow-hidden">
              <button 
                onclick="updateCartItemQty('${cartKey}', -1)" 
                class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 transition-colors"
              >
                −
              </button>
              <span class="w-7 sm:w-8 text-center text-xs sm:text-sm font-black">${inCartQty}</span>
              <button 
                onclick="updateCartItemQty('${cartKey}', 1)" 
                class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 transition-colors"
              >
                +
              </button>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}
window.renderProductCardHtml = renderProductCardHtml;

async function syncStorefrontCatalogWithBackend() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) return;
    const products = await res.json();
    if (Array.isArray(products)) {
      window.__suspendedProductIds.clear();
      const backendMap = new Map();
      products.forEach(p => {
        const cleanId = (p.storefrontId || p.id).replace(/^prod_/, '');
        backendMap.set(cleanId, p);
        backendMap.set(p.id, p);
        if (p.status === 'SUSPENDED') {
          window.__suspendedProductIds.add(p.id);
          window.__suspendedProductIds.add(cleanId);
        }
      });

      const updateList = (list) => {
        if (!Array.isArray(list)) return;
        list.forEach(item => {
          const bp = backendMap.get(item.id) || backendMap.get('prod_' + item.id);
          if (bp) {
            const effectivePrice = bp.price !== undefined ? Number(bp.price) : (bp.sellingPrice !== undefined ? Number(bp.sellingPrice) : undefined);
            const effectiveMrp = bp.mrp !== undefined ? Number(bp.mrp) : (bp.originalPrice !== undefined ? Number(bp.originalPrice) : undefined);

            if (effectivePrice !== undefined) {
              item.price = effectivePrice;
              item.sellingPrice = effectivePrice;
            }
            if (effectiveMrp !== undefined) {
              item.mrp = effectiveMrp;
              item.originalPrice = effectiveMrp;
            }

            if (bp.name) item.name = bp.name;
            if (bp.hindiName !== undefined) item.hindiName = bp.hindiName;
            if (bp.image) item.image = bp.image;
            if (bp.description !== undefined) item.description = bp.description;
            if (bp.farmer || bp.origin) item.origin = bp.farmer || bp.origin;
            if (bp.badge) item.badge = bp.badge;
            if (bp.badgeType) item.badgeType = bp.badgeType;
            if (bp.categories) item.categories = bp.categories;
            if (bp.stock !== undefined) {
              item.stockCount = bp.stock;
              item.inStock = bp.stock > 0 && bp.status !== 'SUSPENDED' && bp.status !== 'OUT_OF_STOCK';
            }

            // Direct sync of weights array if available
            if (Array.isArray(bp.weights) && bp.weights.length > 0) {
              item.weights = JSON.parse(JSON.stringify(bp.weights));
            } else if (Array.isArray(bp.variants) && bp.variants.length > 0) {
              item.weights = bp.variants.map(v => ({
                label: v.weightLabel || v.label || bp.unit || '1 pack',
                price: Number(v.price),
                originalPrice: Number(v.mrp || v.originalPrice || v.price),
                discount: (v.mrp && v.mrp > v.price) ? `${Math.round(((v.mrp - v.price)/v.mrp)*100)}% OFF` : 'Best Value'
              }));
            }

            // GUARANTEE: Ensure the primary/selected unit has the exact effective price and MRP
            if (Array.isArray(item.weights) && item.weights.length > 0) {
              const bpUnit = (bp.unit || '').toLowerCase().trim();
              let matched = item.weights.find(w => (w.label || '').toLowerCase().trim() === bpUnit);
              if (!matched && item.selectedWeightIndex !== undefined && item.weights[item.selectedWeightIndex]) {
                matched = item.weights[item.selectedWeightIndex];
              }
              if (!matched) matched = item.weights[0];
              if (matched && effectivePrice !== undefined) {
                matched.price = effectivePrice;
                if (effectiveMrp !== undefined) matched.originalPrice = effectiveMrp;
                if (effectiveMrp && effectiveMrp > effectivePrice) {
                  matched.discount = `${Math.round(((effectiveMrp - effectivePrice)/effectiveMrp)*100)}% OFF`;
                  matched.savings = effectiveMrp - effectivePrice;
                }
              }

              // Also ensure selected weight index has effectivePrice if it matches bpUnit
              if (item.selectedWeightIndex !== undefined && item.weights[item.selectedWeightIndex]) {
                const sel = item.weights[item.selectedWeightIndex];
                if (bpUnit && (sel.label || '').toLowerCase().trim() === bpUnit) {
                  sel.price = effectivePrice;
                  if (effectiveMrp !== undefined) sel.originalPrice = effectiveMrp;
                }
              }
            }
          }
        });
      };

      if (typeof allVegetablesData !== 'undefined') updateList(allVegetablesData);
      if (typeof combosData !== 'undefined') updateList(combosData);
      if (typeof allFruitsData !== 'undefined') updateList(allFruitsData);
      if (typeof fruitCombosData !== 'undefined') updateList(fruitCombosData);
      if (typeof allGroceryData !== 'undefined') updateList(allGroceryData);
      if (typeof groceryCombosData !== 'undefined') updateList(groceryCombosData);

      // Dynamically add any newly created backend products not yet in static data
      const knownIds = new Set([
        ...(typeof allVegetablesData !== 'undefined' ? allVegetablesData.map(p => p.id) : []),
        ...(typeof combosData !== 'undefined' ? combosData.map(p => p.id) : []),
        ...(typeof allFruitsData !== 'undefined' ? allFruitsData.map(p => p.id) : []),
        ...(typeof fruitCombosData !== 'undefined' ? fruitCombosData.map(p => p.id) : []),
        ...(typeof allGroceryData !== 'undefined' ? allGroceryData.map(p => p.id) : []),
        ...(typeof groceryCombosData !== 'undefined' ? groceryCombosData.map(p => p.id) : [])
      ]);

      let addedNew = false;
      products.forEach(p => {
        const cleanId = (p.storefrontId || p.id).replace(/^prod_/, '');
        if (!knownIds.has(cleanId) && !knownIds.has(p.id)) {
          const cat = (p.category || '').toLowerCase();
          const targetArray = cat.includes('fruit') 
            ? (typeof allFruitsData !== 'undefined' ? allFruitsData : null)
            : cat.includes('groc') || cat.includes('pant')
              ? (typeof allGroceryData !== 'undefined' ? allGroceryData : null)
              : (typeof allVegetablesData !== 'undefined' ? allVegetablesData : null);

          if (targetArray) {
            targetArray.push({
              id: cleanId,
              name: p.name,
              hindiName: p.hindiName || '',
              categories: p.categories || ['all'],
              rating: p.rating || 4.8,
              reviewsCount: p.reviewsCount || 100,
              badge: p.badge || 'Fresh',
              badgeType: p.badgeType || 'bestseller',
              inStock: p.stock > 0 && p.status !== 'SUSPENDED' && p.status !== 'OUT_OF_STOCK',
              stockCount: p.stock || 0,
              isNew: true,
              image: p.image,
              description: p.description,
              origin: p.farmer || 'FreshMart Partner Farm',
              weights: p.weights || (p.variants && p.variants.length > 0 ? p.variants.map(v => ({
                label: v.weightLabel || v.label || p.unit || '1 pack',
                price: v.price || p.price,
                originalPrice: v.mrp || p.mrp,
                discount: (v.mrp && v.mrp > v.price) ? `${Math.round(((v.mrp - v.price)/v.mrp)*100)}% OFF` : 'Best Value'
              })) : [{ label: p.unit || '1 unit', price: p.price, originalPrice: p.mrp, discount: 'Best Value' }]),
              selectedWeightIndex: 0
            });
            knownIds.add(cleanId);
            knownIds.add(p.id);
            addedNew = true;
          }
        }
      });

      // ALWAYS re-render active storefront screens on sync so live prices take effect immediately!
      if (document.getElementById('veg-products-grid')) {
        if (typeof applyFiltersAndRender === 'function') applyFiltersAndRender();
        else if (typeof applyVegetableFiltersAndRender === 'function') applyVegetableFiltersAndRender();
      }
      if (document.getElementById('fruit-products-grid') && typeof applyFruitFiltersAndRender === 'function') {
        applyFruitFiltersAndRender();
      }
      if (document.getElementById('grocery-products-grid') && typeof applyGroceryFiltersAndRender === 'function') {
        applyGroceryFiltersAndRender();
      }
      if (document.getElementById('offers-products-grid') && typeof applyOffersFiltersAndRender === 'function') {
        applyOffersFiltersAndRender();
      }
      if (document.getElementById('products-grid') && typeof initHomePage === 'function') {
        initHomePage();
      }

      if (document.getElementById('product-details-page') && typeof currentDetailProduct !== 'undefined' && currentDetailProduct) {
        const fresh = findAnyProduct(currentDetailProduct.id);
        if (fresh) currentDetailProduct = fresh;
        populateProductDetailsDOM(currentDetailProduct);
        if (typeof updateDetailPricingUI === 'function') updateDetailPricingUI();
      }
      if (typeof updateCartUI === 'function') {
        updateCartUI();
      }
      if (typeof updateStorefrontSubnavs === 'function') {
        updateStorefrontSubnavs();
      }
    }
  } catch (e) {}
}

// -------------------------------------------------------------
// REAL-TIME STOREFRONT SUB-NAVBARS & CATEGORY BADGE SYNCHRONIZATION
// -------------------------------------------------------------
function updateGlobalNavBadges() {
  const vegCount = (typeof allVegetablesData !== 'undefined') 
    ? allVegetablesData.filter(v => !isProductSuspended(v.id)).length 
    : 0;
  const fruitCount = (typeof allFruitsData !== 'undefined') 
    ? allFruitsData.filter(v => !isProductSuspended(v.id)).length 
    : 0;
  const groceryCount = (typeof allGroceryData !== 'undefined') 
    ? allGroceryData.filter(v => !isProductSuspended(v.id)).length 
    : 0;

  // Update sidebar & header sub-navigation link badges
  document.querySelectorAll('a[href*="vegetables.html"]').forEach(a => {
    const badge = a.querySelector('span:last-child');
    if (badge && /fresh/i.test(badge.textContent)) {
      badge.textContent = `${vegCount} Fresh`;
    }
  });

  document.querySelectorAll('a[href*="fruits.html"]').forEach(a => {
    const badge = a.querySelector('span:last-child');
    if (badge && /orchard/i.test(badge.textContent)) {
      badge.textContent = `${fruitCount} Orchard`;
    }
  });

  document.querySelectorAll('a[href*="grocery.html"]').forEach(a => {
    const badge = a.querySelector('span:last-child');
    if (badge && /pantry/i.test(badge.textContent)) {
      badge.textContent = `${groceryCount} Pantry`;
    }
  });

  // Standalone badge spans across DOM
  document.querySelectorAll('span').forEach(sp => {
    if (sp.children.length === 0) {
      const text = sp.textContent.trim();
      if (/^\d+\s+Fresh$/i.test(text)) {
        sp.textContent = `${vegCount} Fresh`;
      } else if (/^\d+\s+Orchard$/i.test(text)) {
        sp.textContent = `${fruitCount} Orchard`;
      } else if (/^\d+\s+Pantry$/i.test(text)) {
        sp.textContent = `${groceryCount} Pantry`;
      }
    }
  });
}
window.updateGlobalNavBadges = updateGlobalNavBadges;

let homeActiveCategory = 'all';

window.setCategoryFilter = function(category) {
  homeActiveCategory = category;
  document.querySelectorAll('.category-tab').forEach(btn => {
    if (btn.dataset.category === category) {
      btn.classList.add('active', 'bg-emerald-800', 'text-white');
      btn.classList.remove('bg-white', 'text-stone-700');
    } else {
      btn.classList.remove('active', 'bg-emerald-800', 'text-white');
      btn.classList.add('bg-white', 'text-stone-700');
    }
  });
  renderHomeProductGrid();
};

function updateHomeCategoryCounts() {
  const allProds = (typeof getAllCatalogProducts === 'function' ? getAllCatalogProducts() : []).filter(p => !isProductSuspended(p.id));
  const counts = {
    all: allProds.length,
    vegetables: allProds.filter(p => p.catalogType === 'vegetables').length,
    leafy: allProds.filter(p => (p.categories && p.categories.includes('leafy')) || (p.name && /palak|methi|spinach|coriander|mint|lettuce/i.test(p.name))).length,
    herbs: allProds.filter(p => (p.categories && (p.categories.includes('herbs') || p.categories.includes('root'))) || (p.name && /ginger|garlic|chilli|herb|root|onion|potato/i.test(p.name))).length
  };

  const labels = {
    all: 'All Produce',
    vegetables: 'Vegetables',
    leafy: 'Leafy Greens',
    herbs: 'Herbs & Roots'
  };

  document.querySelectorAll('.category-tab').forEach(btn => {
    const cat = btn.dataset.category;
    if (cat && counts[cat] !== undefined) {
      btn.innerHTML = `<span>${labels[cat] || cat}</span> <span class="ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${btn.classList.contains('active') ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'} font-mono">${counts[cat]}</span>`;
    }
  });
}
window.updateHomeCategoryCounts = updateHomeCategoryCounts;

function updateStorefrontSubnavs() {
  try {
    if (typeof updateCategoryCounts === 'function') updateCategoryCounts();
    if (typeof updateFruitCategoryCounts === 'function') updateFruitCategoryCounts();
    if (typeof updateGroceryCategoryCounts === 'function') updateGroceryCategoryCounts();
    if (typeof updateOffersCategoryCounts === 'function') updateOffersCategoryCounts();
    if (typeof updateGlobalNavBadges === 'function') updateGlobalNavBadges();
    if (typeof updateHomeCategoryCounts === 'function') updateHomeCategoryCounts();
  } catch (err) {
    console.warn('updateStorefrontSubnavs error', err);
  }
}
window.updateStorefrontSubnavs = updateStorefrontSubnavs;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('product-details-page')) {
    initProductDetailsPage();
  } else if (document.getElementById('veg-products-grid')) {
    initVegetablesPage();
  } else if (document.getElementById('fruit-products-grid')) {
    initFruitsPage();
  } else if (document.getElementById('grocery-products-grid')) {
    initGroceryPage();
  } else if (document.getElementById('offers-products-grid')) {
    initOffersPage();
  } else if (document.getElementById('products-grid')) {
    initHomePage();
  }

  updateCartUI();
  updateWishlistBadges();
  updateHeaderLocationUI();
  updateStorefrontSubnavs();
  initScrollAnimations();
  if (window.lucide) window.lucide.createIcons();
  setupGlobalListeners();
  initGlobalOrderSSE();
  syncStorefrontCatalogWithBackend();

  // Check URL params for direct live tracking (e.g. ?trackOrder=SJH10248)
  const urlParams = new URLSearchParams(window.location.search);
  const trackParam = urlParams.get('trackOrder');
  if (trackParam) {
    setTimeout(() => openTrackOrderModal(trackParam), 300);
  }
  const openTabParam = urlParams.get('openTab') || urlParams.get('tab') || urlParams.get('view');
  if (openTabParam === 'orders' || openTabParam === 'myorders') {
    setTimeout(() => {
      if (typeof window.openAccountDashboard === 'function') {
        window.openAccountDashboard('orders');
      }
    }, 400);
  }
});

// Global Server-Sent Events Listener for Live Tracking & Catalog Updates
function initGlobalOrderSSE() {
  try {
    const sse = new EventSource('/api/events');
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ORDER_UPDATED' || data.type === 'ORDER_CREATED') {
          const updatedOrder = data.payload;
          const targetId = updatedOrder?.orderId || updatedOrder?.id;

          // 1. Live refresh tracking modal if active
          const trackingModal = document.getElementById('track-order-modal');
          if (trackingModal && trackingModal.classList.contains('active') && (targetId === activeTrackingOrderId || updatedOrder?.id === activeTrackingOrderId)) {
            renderTrackOrderModalContent(activeTrackingOrderId);
          }

          // 2. Live refresh customer account dashboard orders if open
          const dashModal = document.getElementById('account-dashboard-modal');
          if (dashModal && !dashModal.classList.contains('hidden') && typeof window.loadDashboardOrders === 'function') {
            window.loadDashboardOrders();
          }

          // 3. Show live notification toast if order belongs to user's device/session
          try {
            const rawHist = localStorage.getItem('sabjihub_order_history') || '[]';
            const hist = JSON.parse(rawHist);
            const activeId = localStorage.getItem('sabjihub_active_order_id');
            const isMyOrder = (Array.isArray(hist) && (hist.includes(targetId) || hist.includes(updatedOrder?.id))) ||
                              activeId === targetId || activeId === updatedOrder?.id;

            if (isMyOrder && data.type === 'ORDER_UPDATED') {
              const statusName = (updatedOrder.status || updatedOrder.orderStatus || '').replace(/_/g, ' ');
              if (typeof window.showToast === 'function') {
                window.showToast(`🚚 Order #${targetId} is now ${statusName}!`, 'info');
              }
            }
          } catch (e) {}
        } else if (data.type === 'PRODUCT_UPDATED' || data.type === 'STOCK_UPDATED') {
          const prod = data.payload?.product || data.payload;
          if (prod && (prod.id || prod.storefrontId)) {
            const cleanId = (prod.storefrontId || prod.id).replace(/^prod_/, '');
            
            // Live suspension status
            if (prod.status === 'SUSPENDED') {
              window.__suspendedProductIds.add(prod.id);
              window.__suspendedProductIds.add(cleanId);
            } else {
              window.__suspendedProductIds.delete(prod.id);
              window.__suspendedProductIds.delete(cleanId);
            }

            let found = false;
            // In-memory catalog update
            const updateItem = (item) => {
              if (item.id === cleanId || item.id === prod.id || item.id === 'prod_' + cleanId) {
                found = true;
                const effectivePrice = prod.price !== undefined ? Number(prod.price) : (prod.sellingPrice !== undefined ? Number(prod.sellingPrice) : undefined);
                const effectiveMrp = prod.mrp !== undefined ? Number(prod.mrp) : (prod.originalPrice !== undefined ? Number(prod.originalPrice) : undefined);

                if (effectivePrice !== undefined) {
                  item.price = effectivePrice;
                  item.sellingPrice = effectivePrice;
                }
                if (effectiveMrp !== undefined) {
                  item.mrp = effectiveMrp;
                  item.originalPrice = effectiveMrp;
                }

                if (prod.name) item.name = prod.name;
                if (prod.hindiName !== undefined) item.hindiName = prod.hindiName;
                if (prod.image) item.image = prod.image;
                if (prod.description !== undefined) item.description = prod.description;
                if (prod.farmer || prod.origin) item.origin = prod.farmer || prod.origin;
                if (prod.badge) item.badge = prod.badge;
                if (prod.badgeType) item.badgeType = prod.badgeType;
                if (prod.categories) item.categories = prod.categories;
                if (prod.stock !== undefined) {
                  item.stockCount = prod.stock;
                  item.inStock = prod.stock > 0 && prod.status !== 'SUSPENDED' && prod.status !== 'OUT_OF_STOCK';
                }

                // Direct sync of weights array if available
                if (Array.isArray(prod.weights) && prod.weights.length > 0) {
                  item.weights = JSON.parse(JSON.stringify(prod.weights));
                } else if (Array.isArray(prod.variants) && prod.variants.length > 0) {
                  item.weights = prod.variants.map(v => ({
                    label: v.weightLabel || v.label || prod.unit || '1 pack',
                    price: Number(v.price),
                    originalPrice: Number(v.mrp || v.originalPrice || v.price),
                    discount: (v.mrp && v.mrp > v.price) ? `${Math.round(((v.mrp - v.price)/v.mrp)*100)}% OFF` : 'Best Value'
                  }));
                }

                // Ensure matching unit or selected weight has the effective price
                if (Array.isArray(item.weights) && item.weights.length > 0) {
                  const prodUnit = (prod.unit || '').toLowerCase().trim();
                  let matched = item.weights.find(w => (w.label || '').toLowerCase().trim() === prodUnit);
                  if (!matched && item.selectedWeightIndex !== undefined && item.weights[item.selectedWeightIndex]) {
                    matched = item.weights[item.selectedWeightIndex];
                  }
                  if (!matched) matched = item.weights[0];
                  if (matched && effectivePrice !== undefined) {
                    matched.price = effectivePrice;
                    if (effectiveMrp !== undefined) matched.originalPrice = effectiveMrp;
                    if (effectiveMrp && effectiveMrp > effectivePrice) {
                      matched.discount = `${Math.round(((effectiveMrp - effectivePrice)/effectiveMrp)*100)}% OFF`;
                      matched.savings = effectiveMrp - effectivePrice;
                    }
                  }
                  if (item.selectedWeightIndex !== undefined && item.weights[item.selectedWeightIndex]) {
                    const sel = item.weights[item.selectedWeightIndex];
                    if (prodUnit && (sel.label || '').toLowerCase().trim() === prodUnit) {
                      sel.price = effectivePrice;
                      if (effectiveMrp !== undefined) sel.originalPrice = effectiveMrp;
                    }
                  }
                }
              }
            };

            const scanArray = (arr) => { if (Array.isArray(arr)) arr.forEach(updateItem); };
            if (typeof allVegetablesData !== 'undefined') scanArray(allVegetablesData);
            if (typeof combosData !== 'undefined') scanArray(combosData);
            if (typeof allFruitsData !== 'undefined') scanArray(allFruitsData);
            if (typeof fruitCombosData !== 'undefined') scanArray(fruitCombosData);
            if (typeof allGroceryData !== 'undefined') scanArray(allGroceryData);
            if (typeof groceryCombosData !== 'undefined') scanArray(groceryCombosData);

            if (!found && prod.name) {
              const cat = (prod.category || '').toLowerCase();
              const targetArray = cat.includes('fruit') 
                ? (typeof allFruitsData !== 'undefined' ? allFruitsData : null)
                : cat.includes('groc') || cat.includes('pant')
                  ? (typeof allGroceryData !== 'undefined' ? allGroceryData : null)
                  : (typeof allVegetablesData !== 'undefined' ? allVegetablesData : null);

              if (targetArray) {
                targetArray.push({
                  id: cleanId,
                  name: prod.name,
                  hindiName: prod.hindiName || '',
                  categories: prod.categories || ['all'],
                  rating: prod.rating || 4.8,
                  reviewsCount: prod.reviewsCount || 100,
                  badge: prod.badge || 'Fresh',
                  badgeType: prod.badgeType || 'bestseller',
                  inStock: prod.stock > 0 && prod.status !== 'SUSPENDED' && prod.status !== 'OUT_OF_STOCK',
                  stockCount: prod.stock || 0,
                  isNew: true,
                  image: prod.image,
                  description: prod.description,
                  origin: prod.farmer || 'FreshMart Partner Farm',
                  weights: prod.weights || (prod.variants && prod.variants.length > 0 ? prod.variants.map(v => ({
                    label: v.weightLabel || v.label || prod.unit || '1 pack',
                    price: v.price || prod.price,
                    originalPrice: v.mrp || prod.mrp,
                    discount: (v.mrp && v.mrp > v.price) ? `${Math.round(((v.mrp - v.price)/v.mrp)*100)}% OFF` : 'Best Value'
                  })) : [{ label: prod.unit || '1 unit', price: prod.price, originalPrice: prod.mrp, discount: 'Best Value' }]),
                  selectedWeightIndex: 0
                });
              }
            }

            // Re-render live storefront grids
            if (document.getElementById('veg-products-grid')) {
              if (typeof applyFiltersAndRender === 'function') applyFiltersAndRender();
              else if (typeof applyVegetableFiltersAndRender === 'function') applyVegetableFiltersAndRender();
            } else if (document.getElementById('fruit-products-grid') && typeof applyFruitFiltersAndRender === 'function') {
              applyFruitFiltersAndRender();
            } else if (document.getElementById('grocery-products-grid') && typeof applyGroceryFiltersAndRender === 'function') {
              applyGroceryFiltersAndRender();
            } else if (document.getElementById('offers-products-grid') && typeof applyOffersFiltersAndRender === 'function') {
              applyOffersFiltersAndRender();
            } else if (document.getElementById('products-grid') && typeof initHomePage === 'function') {
              initHomePage();
            }

            // Product Details Live Refresh
            if (document.getElementById('product-details-page') && typeof currentDetailProduct !== 'undefined' && currentDetailProduct) {
              if (currentDetailProduct.id === cleanId || currentDetailProduct.id === prod.id || ('prod_' + currentDetailProduct.id) === prod.id) {
                const fresh = findAnyProduct(cleanId) || findAnyProduct(prod.id);
                if (fresh) currentDetailProduct = fresh;
                populateProductDetailsDOM(currentDetailProduct);
                if (typeof updateDetailPricingUI === 'function') updateDetailPricingUI();
              }
            }

            // Refresh Cart UI if price changed
            if (typeof updateCartUI === 'function') {
              updateCartUI();
            }

            // Real-time storefront subnavs and category counters update
            if (typeof updateStorefrontSubnavs === 'function') {
              updateStorefrontSubnavs();
            }
          }
        } else if (data.type === 'PRODUCT_DELETED') {
          const delId = data.payload?.id;
          const cleanId = (data.payload?.storefrontId || delId || '').replace(/^prod_/, '');
          const removeItem = (arr) => {
            if (!Array.isArray(arr)) return;
            const idx = arr.findIndex(p => p.id === cleanId || p.id === delId || p.id === 'prod_' + cleanId);
            if (idx !== -1) arr.splice(idx, 1);
          };
          if (typeof allVegetablesData !== 'undefined') removeItem(allVegetablesData);
          if (typeof allFruitsData !== 'undefined') removeItem(allFruitsData);
          if (typeof allGroceryData !== 'undefined') removeItem(allGroceryData);

          if (document.getElementById('veg-products-grid')) {
            if (typeof applyFiltersAndRender === 'function') applyFiltersAndRender();
            else if (typeof applyVegetableFiltersAndRender === 'function') applyVegetableFiltersAndRender();
          } else if (document.getElementById('fruit-products-grid') && typeof applyFruitFiltersAndRender === 'function') {
            applyFruitFiltersAndRender();
          } else if (document.getElementById('grocery-products-grid') && typeof applyGroceryFiltersAndRender === 'function') {
            applyGroceryFiltersAndRender();
          } else if (document.getElementById('offers-products-grid') && typeof applyOffersFiltersAndRender === 'function') {
            applyOffersFiltersAndRender();
          } else if (document.getElementById('products-grid') && typeof initHomePage === 'function') {
            initHomePage();
          }

          // Real-time storefront subnavs and category counters update
          if (typeof updateStorefrontSubnavs === 'function') {
            updateStorefrontSubnavs();
          }
        }
      } catch (e) {}
    };

    sse.onerror = () => {
      sse.close();
      setTimeout(initGlobalOrderSSE, 5000);
    };
  } catch (e) {
    setTimeout(initGlobalOrderSSE, 8000);
  }
}

// Background auto-refresh to keep storefront catalog 100% live
setInterval(() => {
  if (!document.hidden && typeof syncStorefrontCatalogWithBackend === 'function') {
    syncStorefrontCatalogWithBackend();
  }
}, 25000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && typeof syncStorefrontCatalogWithBackend === 'function') {
    syncStorefrontCatalogWithBackend();
  }
});


// Update Wishlist Header Badges
function updateWishlistBadges() {
  const badgeEls = document.querySelectorAll('.wishlist-count-badge');
  badgeEls.forEach(el => {
    el.textContent = wishlist.length;
    if (wishlist.length > 0) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

// Setup Global Event Listeners
function setupGlobalListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      closeLocationModal();
      closeSearchModal();
      closeQuickViewModal();
      closeFilterSheet();
      closeLightbox();
      closeReviewModal();
      hideHeaderSearchDropdown();
      closeNotifications();
      closeTrackOrderModal();
      closeMobileSidebar();
    }
    // ⌘K or Ctrl+K shortcut to focus header search
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const input = document.getElementById('header-inline-search');
      if (input) {
        input.focus();
        showHeaderSearchDropdown();
      } else {
        openSearchModal();
      }
    }
  });

  // Close search suggestions and notifications on click outside
  document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
      hideHeaderSearchDropdown();
    }

    const notifBtn = document.getElementById('notif-btn');
    const notifPopover = document.getElementById('notifications-popover');
    if (notifPopover && notifBtn && !notifBtn.contains(e.target) && !notifPopover.contains(e.target)) {
      closeNotifications();
    }
  });
}

// Mobile Sidebar Drawer Controls
window.openMobileSidebar = function() {
  const sidebar = document.getElementById('mobile-sidebar-drawer');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  if (sidebar && overlay) {
    overlay.classList.remove('hidden');
    sidebar.classList.remove('-translate-x-full');
    document.body.style.overflow = 'hidden';
  }
};

window.closeMobileSidebar = function() {
  const sidebar = document.getElementById('mobile-sidebar-drawer');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

// Notification Popover Controls
window.toggleNotifications = function() {
  const popover = document.getElementById('notifications-popover');
  if (popover) {
    if (typeof closeUserProfilePopover === 'function') closeUserProfilePopover();
    popover.classList.toggle('active');
  }
};

window.closeNotifications = function() {
  const popover = document.getElementById('notifications-popover');
  if (popover) {
    popover.classList.remove('active');
  }
};

window.markAllNotificationsRead = function() {
  const badge = document.getElementById('notif-badge');
  if (badge) badge.classList.add('hidden');
  const heading = document.getElementById('notif-heading');
  if (heading) heading.textContent = 'Notifications (0 New)';
  const notifList = document.getElementById('notifications-list');
  if (notifList) {
    notifList.innerHTML = `
      <div class="py-8 text-center">
        <span class="text-3xl mb-2 block">🌿</span>
        <p class="font-bold text-xs text-emerald-950">You're all caught up!</p>
        <p class="text-[11px] text-stone-500 mt-1">No new unread harvest or order alerts.</p>
      </div>
    `;
  }
  showToast('All notifications marked as read', 'info');
};

window.handleNotificationClick = function(type) {
  closeNotifications();
  if (type === 'harvest') {
    const dealsSec = document.getElementById('todays-deals') || document.getElementById('products');
    if (dealsSec) {
      dealsSec.scrollIntoView({ behavior: 'smooth' });
    }
    showToast('Showing today\'s 4:00 AM fresh harvest!', 'info');
  } else if (type === 'tracking') {
    openTrackOrderModal();
  } else if (type === 'coupon') {
    copyCouponCode('FIRST100');
    openCartDrawer();
  }
};

// User Profile Popover Controls
window.toggleUserProfilePopover = function() {
  const popover = document.getElementById('user-profile-popover');
  if (popover) {
    if (typeof closeNotifications === 'function') closeNotifications();
    popover.classList.toggle('active');
  }
};

window.closeUserProfilePopover = function() {
  const popover = document.getElementById('user-profile-popover');
  if (popover) {
    popover.classList.remove('active');
  }
};

// Order Tracking Modal Controls & Live Dynamic Renderer
let activeTrackingOrderId = 'SJH10248';

window.openTrackOrderModal = async function(orderId) {
  const modal = document.getElementById('track-order-modal');
  if (!modal) return;

  if (orderId) {
    activeTrackingOrderId = orderId;
  } else {
    activeTrackingOrderId = localStorage.getItem('sabjihub_active_order_id') || 'SJH10248';
  }

  modal.classList.add('open', 'active');
  document.body.style.overflow = 'hidden';

  await renderTrackOrderModalContent(activeTrackingOrderId);
};

window.closeTrackOrderModal = function() {
  const modal = document.getElementById('track-order-modal');
  if (modal) {
    modal.classList.remove('open', 'active');
    document.body.style.overflow = '';
  }
};

window.renderTrackOrderModalContent = async function(orderId) {
  const modalBox = document.querySelector('#track-order-modal .modal-box');
  if (!modalBox) return;

  let order = null;
  try {
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.ok) {
      order = await res.json();
    }
  } catch (e) {
    console.warn('Could not fetch order from API, using fallback data', e);
  }

  // Fallback seed order if offline
  if (!order) {
    order = {
      orderId: orderId || 'SJH10248',
      orderStatus: 'OUT_FOR_DELIVERY',
      estimatedDeliveryTime: '28 Mins',
      deliveryOtp: '4821',
      items: [
        { name: 'Pahadi Potato', weightLabel: '1 kg', qty: 1 },
        { name: 'Nashik Onion', weightLabel: '1 kg', qty: 1 },
        { name: 'Fresh Tomato', weightLabel: '1 kg', qty: 1 }
      ],
      deliveryPartnerName: 'Ramesh K. (EV Pilot #42)',
      deliveryPartnerPhone: '+91 98765 43210',
      hubName: 'Indiranagar Central Hub',
      timeline: [
        { status: 'CONFIRMED', title: 'Order Confirmed', time: '06:30 AM', desc: 'Verified and queued.' },
        { status: 'ACCEPTED_BY_HUB', title: 'Plucked at Dawn', time: '06:45 AM', desc: 'Plucked from Kolar farms.' },
        { status: 'QUALITY_CHECK', title: 'Ozone Sanitized & QC Cleared', time: '07:15 AM', desc: 'Passed 5-point quality check.' },
        { status: 'PACKED', title: 'Packed in Zero-Plastic Eco Bag', time: '07:25 AM', desc: 'Sealed for EV transport.' },
        { status: 'OUT_FOR_DELIVERY', title: 'Out for Delivery in EV', time: '07:40 AM', desc: 'Courier Ramesh is 2.1 km away.' }
      ]
    };
  }

  const isDelivered = order.orderStatus === 'DELIVERED';
  const isCancelled = order.orderStatus === 'CANCELLED';

  modalBox.innerHTML = `
    <!-- Modal Header -->
    <div class="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
          ${isDelivered ? '🎉' : '🚚'}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-base sm:text-lg text-emerald-950">${isDelivered ? 'Order Delivered!' : 'Live Order Tracking'}</h3>
            ${!isDelivered && !isCancelled ? '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>' : ''}
          </div>
          <p class="text-xs text-stone-500">Order ID: <strong class="font-mono text-emerald-900">#${order.orderId}</strong> • ${order.items?.length || 3} Items</p>
        </div>
      </div>
      <button onclick="closeTrackOrderModal()" class="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    ${isDelivered ? `
      <!-- DELIVERED CELEBRATION & RATING CARD -->
      <div class="p-5 rounded-3xl bg-emerald-50 border border-emerald-300 text-center mb-6 space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-2xl shadow-md">
          ✓
        </div>
        <div>
          <h4 class="font-heading font-black text-lg text-emerald-950">Delivered Successfully!</h4>
          <p class="text-xs text-stone-600 mt-0.5">Handed over at Indiranagar • Verified via OTP</p>
        </div>

        <!-- 5-Star Rating Widget -->
        <div class="bg-white p-4 rounded-2xl border border-emerald-200/80 text-left space-y-3">
          <div>
            <span class="text-xs font-bold text-emerald-950 block">Rate Delivery Partner (${order.deliveryPartnerName || 'Ramesh K.'})</span>
            <div class="flex gap-1 mt-1 text-xl text-amber-400 cursor-pointer" id="delivery-star-rating">
              <span onclick="setRating('delivery', 1)">★</span>
              <span onclick="setRating('delivery', 2)">★</span>
              <span onclick="setRating('delivery', 3)">★</span>
              <span onclick="setRating('delivery', 4)">★</span>
              <span onclick="setRating('delivery', 5)">★</span>
            </div>
          </div>
          <div>
            <span class="text-xs font-bold text-emerald-950 block">Rate Produce Freshness</span>
            <div class="flex gap-1 mt-1 text-xl text-amber-400 cursor-pointer" id="produce-star-rating">
              <span onclick="setRating('produce', 1)">★</span>
              <span onclick="setRating('produce', 2)">★</span>
              <span onclick="setRating('produce', 3)">★</span>
              <span onclick="setRating('produce', 4)">★</span>
              <span onclick="setRating('produce', 5)">★</span>
            </div>
          </div>
          <button onclick="submitOrderRating('${order.id || order.orderId}')" class="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors">
            Submit Rating & Feedback
          </button>
        </div>

        <button onclick="reorderItems('${order.id || order.orderId}')" class="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2">
          <span>🔄 Reorder These Items</span>
        </button>
      </div>
    ` : `
      <!-- ACTIVE DELIVERY OTP CARD -->
      <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 mb-5 flex items-center justify-between shadow-2xs">
        <div>
          <span class="text-[10px] uppercase font-black text-emerald-800 tracking-wider block">YOUR DELIVERY OTP</span>
          <span class="text-3xl font-mono font-black text-emerald-950 tracking-[0.2em]">${order.deliveryOtp || '4821'}</span>
        </div>
        <p class="text-[11px] text-emerald-900/90 text-right max-w-[210px] font-medium leading-tight">
          Share this 4-digit code with your EV courier after receiving your fresh vegetables.
        </p>
      </div>

      <!-- ETA Card -->
      <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-800 text-white mb-5 shadow-md">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-emerald-300 uppercase tracking-wider">Estimated Delivery</span>
          <span class="text-xs font-mono bg-white/10 px-2 py-0.5 rounded-full font-bold">⚡ Express 90-Min</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl sm:text-4xl font-black text-white">${order.estimatedDeliveryTime || '28 Mins'}</span>
          <span class="text-xs text-emerald-200">Remaining</span>
        </div>
        <div class="w-full h-2 bg-emerald-950/60 rounded-full overflow-hidden mt-3">
          <div class="h-full bg-gradient-to-r from-emerald-400 to-amber-300 ${getProgressWidth(order.orderStatus)} rounded-full transition-all duration-500"></div>
        </div>
      </div>

      <!-- Clean Visual Route Map (SVG) -->
      <div class="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 mb-5 relative overflow-hidden">
        <div class="flex items-center justify-between text-xs mb-2">
          <span class="font-bold text-emerald-950 flex items-center gap-1.5">
            <span>🗺️</span> Transit Route: Hub → Doorstep
          </span>
          <span class="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
            EV Pilot on Live Route
          </span>
        </div>
        <svg class="w-full h-16" viewBox="0 0 400 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Road Line -->
          <path d="M 20 30 Q 120 10, 200 30 T 380 30" stroke="#a7f3d0" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 6" />
          <path d="M 20 30 Q 120 10, 200 30" stroke="#059669" stroke-width="4" stroke-linecap="round" />
          <!-- Hub Dot -->
          <circle cx="20" cy="30" r="10" fill="#047857" />
          <text x="14" y="34" fill="white" font-size="10" font-weight="bold">H</text>
          <!-- Rider Position (Animated) -->
          <circle cx="200" cy="30" r="14" fill="#10b981" class="animate-pulse" />
          <text x="194" y="34" fill="white" font-size="12">🛵</text>
          <!-- Customer Pin -->
          <circle cx="380" cy="30" r="10" fill="#d97706" />
          <text x="374" y="34" fill="white" font-size="10" font-weight="bold">📍</text>
        </svg>
        <div class="flex justify-between text-[10px] text-stone-500 font-semibold px-1">
          <span>${order.hubName || 'Indiranagar Hub'}</span>
          <span class="text-emerald-800 font-bold">2.1 km away (~18m)</span>
          <span>${order.deliveryAddress?.city || 'Indiranagar'}</span>
        </div>
      </div>

      <!-- Timeline Steps -->
      <div class="space-y-4 mb-5 relative pl-2">
        <div class="absolute left-6 top-3 bottom-3 w-0.5 bg-emerald-200"></div>

        <!-- 1. Plucked at Dawn / Confirmed -->
        <div class="flex items-start gap-4 relative z-10">
          <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
            ✓
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-xs sm:text-sm text-emerald-950">Plucked at Dawn</h4>
              <span class="text-[10px] text-stone-400 font-mono">04:00 AM</span>
            </div>
            <p class="text-[11px] text-stone-500">Harvested from certified kisan fields in Kolar, Karnataka.</p>
          </div>
        </div>

        <!-- 2. Ozone Sanitized & QC -->
        <div class="flex items-start gap-4 relative z-10">
          <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
            ✓
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-xs sm:text-sm text-emerald-950">Ozone Washed & Eco-Packed</h4>
              <span class="text-[10px] text-stone-400 font-mono">07:15 AM</span>
            </div>
            <p class="text-[11px] text-stone-500">Bubble-washed with ozonated water; placed in zero-plastic kraft carriers.</p>
          </div>
        </div>

        <!-- 3. Out for Delivery in EV -->
        <div class="flex items-start gap-4 relative z-10">
          <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-emerald-600/30 animate-pulse shrink-0 ring-4 ring-emerald-100">
            🛵
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-xs sm:text-sm text-emerald-700">Out for Delivery in EV</h4>
              <span class="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-1.5 rounded">Active Now</span>
            </div>
            <p class="text-[11px] text-stone-600">Dispatched from Indiranagar Hub. Courier Ramesh is 2.1 km away.</p>
          </div>
        </div>

        <!-- 4. Doorstep Delivery & Handover -->
        <div class="flex items-start gap-4 relative z-10">
          <div class="w-8 h-8 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center text-xs font-bold shrink-0">
            📍
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-xs sm:text-sm text-stone-500">Doorstep Delivery (OTP Handover)</h4>
            </div>
            <p class="text-[11px] text-stone-400">${order.deliveryAddress?.city || 'Indiranagar, Bengaluru'}</p>
          </div>
        </div>
      </div>

      <!-- Courier Partner Info Card -->
      <div class="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <img class="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-600/30" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Courier" />
          <div>
            <h5 class="font-bold text-xs sm:text-sm text-emerald-950">${order.deliveryPartnerName || 'Ramesh K. (EV Pilot #42)'}</h5>
            <p class="text-[10px] text-emerald-700 font-medium">★ 4.9 • 1,240 deliveries completed</p>
          </div>
        </div>
        <div class="flex gap-2">
          <a href="tel:${order.deliveryPartnerPhone || '+919876543210'}" class="px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors">
            📞 Call
          </a>
          <button onclick="showToast('Connecting to EV Pilot Ramesh K. via Live Chat...', 'info')" class="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-800 text-xs font-bold hover:bg-stone-300 transition-colors">
            💬 Chat
          </button>
        </div>
      </div>
    `}
  `;

  if (window.lucide) window.lucide.createIcons();
};

function getProgressWidth(status) {
  switch (status) {
    case 'CONFIRMED': return 'w-1/6';
    case 'ACCEPTED_BY_HUB': return 'w-2/6';
    case 'PICKING': return 'w-3/6';
    case 'QUALITY_CHECK': return 'w-4/6';
    case 'PACKED':
    case 'READY_FOR_PICKUP':
    case 'PICKED_UP': return 'w-5/6';
    case 'OUT_FOR_DELIVERY': return 'w-11/12';
    case 'DELIVERED': return 'w-full';
    default: return 'w-3/4';
  }
}

window.setRating = function(type, stars) {
  showToast(`Rated ${type} ${stars} Stars!`, 'success');
};

window.submitOrderRating = async function(orderId) {
  try {
    await fetch(`/api/orders/${orderId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryRating: 5, productRating: 5, feedback: 'Great fresh produce!' })
    });
    showToast('Thank you for your rating! ₹20 FreshMart Cash added to your wallet.', 'success');
    closeTrackOrderModal();
  } catch (e) {
    showToast('Rating submitted!', 'success');
    closeTrackOrderModal();
  }
};

window.reorderItems = function(orderId) {
  showToast('Items added back to your Basket!', 'success');
  closeTrackOrderModal();
  openCartDrawer();
};



// -------------------------------------------------------------
// PRODUCT DETAILS PAGE LOGIC (DYNAMIC ACROSS ALL 57 CATALOG ITEMS)
// -------------------------------------------------------------
let currentDetailProduct = null;

function initProductDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pid = urlParams.get('id');
  currentDetailProduct = (pid && findAnyProduct(pid)) || allVegetablesData[0];
  detailSelectedWeightIndex = currentDetailProduct.selectedWeightIndex || 0;
  detailQuantity = 1;

  populateProductDetailsDOM(currentDetailProduct);
  updateDetailPricingUI();
  renderRelatedProducts();
  renderRecentlyViewed();
}

function populateProductDetailsDOM(prod) {
  if (!prod) return;
  
  // Document Title
  document.title = `${prod.name} - FreshMart Farm Fresh`;

  // Breadcrumbs
  const breadcrumbCat = document.getElementById('detail-breadcrumb-cat');
  if (breadcrumbCat) {
    const isFruit = prod.catalogType === 'fruits';
    const isGrocery = prod.catalogType === 'grocery';
    breadcrumbCat.href = isFruit ? 'fruits.html' : isGrocery ? 'grocery.html' : 'vegetables.html';
    breadcrumbCat.textContent = isFruit ? 'Fruits' : isGrocery ? 'Grocery & Pantry' : 'Vegetables';
  }
  const breadcrumbName = document.getElementById('detail-breadcrumb-name');
  if (breadcrumbName) breadcrumbName.textContent = prod.name;

  // Main Image & Lightbox
  const mainImg = document.getElementById('detail-main-img');
  if (mainImg) {
    mainImg.src = prod.image;
    mainImg.alt = prod.name;
  }
  const lightboxImg = document.getElementById('lightbox-main-img');
  if (lightboxImg) lightboxImg.src = prod.image;

  // Origin and Badges
  const farmBadge = document.getElementById('detail-farm-badge');
  if (farmBadge) farmBadge.textContent = `🌱 ${prod.origin || 'FreshMart Partner Farm'}`;

  const freshnessBadge = document.getElementById('detail-freshness-badge');
  if (freshnessBadge) {
    freshnessBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> ${prod.badge || 'Fresh Today (4 AM)'}`;
  }

  const badgePill = document.getElementById('detail-badge-pill');
  if (badgePill) {
    badgePill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-600"></span> ${prod.badge || 'Farm Fresh'}`;
  }

  const originTag = document.getElementById('detail-origin-tag');
  if (originTag) originTag.textContent = prod.origin ? `100% Desi Organic • ${prod.origin}` : '100% Desi Organic';

  // Title and subtitle
  const titleEl = document.getElementById('detail-product-title');
  if (titleEl) titleEl.textContent = prod.name;

  const subtitleEl = document.getElementById('detail-product-subtitle');
  if (subtitleEl) subtitleEl.textContent = `${prod.hindiName} • Direct from Farmers`;

  // Rating & Reviews
  const ratingEl = document.getElementById('detail-rating-val');
  if (ratingEl) ratingEl.textContent = prod.rating || '4.8';

  const reviewsEl = document.getElementById('detail-reviews-val');
  if (reviewsEl) reviewsEl.textContent = prod.reviewsCount || '180';

  // Description
  const descEl = document.getElementById('detail-product-description');
  if (descEl) descEl.textContent = prod.description || `${prod.name} naturally grown and quality-checked for freshness and everyday cooking.`;

  // Thumbnails
  const thumbContainer = document.getElementById('detail-thumbnails-container');
  if (thumbContainer) {
    const galleryItems = (prod.gallery && prod.gallery.length > 0) ? prod.gallery : [
      { url: prod.image, title: prod.name + ' - Overview' },
      { url: prod.image, title: prod.name + ' - Fresh Harvest' },
      { url: prod.image, title: prod.name + ' - Quality Pack' },
      { url: prod.image, title: prod.name + ' - Farm Direct' }
    ];
    thumbContainer.innerHTML = galleryItems.map((g, idx) => `
      <button 
        onclick="setDetailGalleryImage(${idx})" 
        class="thumb-btn ${idx === 0 ? 'active' : ''} rounded-2xl overflow-hidden aspect-square border-2 border-transparent transition-all bg-stone-100"
      >
        <img src="${g.url}" alt="${g.title}" class="w-full h-full object-cover" />
      </button>
    `).join('');
  }

  // Weight Selection Buttons
  const weightsContainer = document.getElementById('detail-weights-container');
  if (weightsContainer && prod.weights) {
    weightsContainer.innerHTML = prod.weights.map((w, idx) => `
      <button onclick="selectDetailWeight(${idx})" class="detail-weight-btn weight-chip p-2.5 rounded-2xl text-center ${idx === detailSelectedWeightIndex ? 'active' : 'bg-stone-50 text-stone-700'}">
        <span class="font-bold text-xs sm:text-sm block">${w.label}</span>
        <span class="text-[11px] font-semibold opacity-80">₹${w.price}</span>
      </button>
    `).join('');
  }

  // Wishlist Button
  const wishlistBtn = document.getElementById('detail-wishlist-btn');
  if (wishlistBtn) {
    wishlistBtn.onclick = (e) => toggleWishlist(prod.id, e);
    const isWishlisted = wishlist.includes(prod.id);
    const svg = wishlistBtn.querySelector('svg');
    if (svg) {
      if (isWishlisted) {
        svg.classList.add('fill-red-500', 'text-red-500');
      } else {
        svg.classList.remove('fill-red-500', 'text-red-500');
      }
    }
  }

  // Suspended Check
  const isSuspended = (window.__suspendedProductIds && window.__suspendedProductIds.has(prod.id)) || prod.status === 'SUSPENDED';
  const addBtn = document.getElementById('detail-add-btn');
  const mobAddBtn = document.getElementById('mob-sticky-add-btn');
  const stockIndicator = document.getElementById('detail-stock-indicator');
  
  if (isSuspended) {
    if (stockIndicator) {
      stockIndicator.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> <span class="text-rose-800 font-bold">Temporarily Suspended</span>`;
      stockIndicator.className = 'flex items-center gap-1.5 text-xs text-rose-800 font-semibold bg-rose-50 px-3 py-2 rounded-2xl border border-rose-200';
    }
    if (addBtn) {
      addBtn.disabled = true;
      addBtn.classList.add('opacity-50', 'cursor-not-allowed');
      addBtn.innerHTML = `<span>Temporarily Suspended</span>`;
    }
    if (mobAddBtn) {
      mobAddBtn.disabled = true;
      mobAddBtn.textContent = 'Unavailable';
    }
  } else {
    if (addBtn) {
      addBtn.disabled = false;
      addBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      addBtn.innerHTML = `<i data-lucide="shopping-bag" class="w-5 h-5"></i><span>Add to Cart</span>`;
      if (window.lucide) lucide.createIcons();
    }
    if (mobAddBtn) {
      mobAddBtn.disabled = false;
      mobAddBtn.textContent = 'Add to Cart';
    }
  }
}

// Select Weight in Product Details
window.selectDetailWeight = function(weightIndex) {
  detailSelectedWeightIndex = weightIndex;
  
  // Highlight active button
  document.querySelectorAll('.detail-weight-btn').forEach((btn, idx) => {
    if (idx === weightIndex) {
      btn.classList.add('active');
      btn.classList.remove('bg-stone-50', 'text-stone-700');
    } else {
      btn.classList.remove('active');
      btn.classList.add('bg-stone-50', 'text-stone-700');
    }
  });

  updateDetailPricingUI();
};

// Change Detail Quantity
window.changeDetailQty = function(delta) {
  const newQty = detailQuantity + delta;
  if (newQty < 1) return;
  
  detailQuantity = newQty;
  
  const qtyDisplay = document.getElementById('detail-qty-val');
  if (qtyDisplay) qtyDisplay.textContent = detailQuantity;

  // Stock status check
  const isSuspended = currentDetailProduct && ((window.__suspendedProductIds && window.__suspendedProductIds.has(currentDetailProduct.id)) || currentDetailProduct.status === 'SUSPENDED');
  const stockIndicator = document.getElementById('detail-stock-indicator');
  if (stockIndicator && !isSuspended) {
    if (detailQuantity >= 10) {
      stockIndicator.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> <span class="text-amber-800 font-bold">Only 3 left at this quantity</span>`;
    } else {
      stockIndicator.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> <span class="text-emerald-800 font-semibold">In stock (Plucked at 4 AM)</span>`;
    }
  }

  updateDetailPricingUI();
};

// Update Price Displays (Main + Mobile Sticky Bar)
function updateDetailPricingUI() {
  const prod = currentDetailProduct || allVegetablesData[0];
  const activeWeight = (prod.weights && prod.weights[detailSelectedWeightIndex]) || (prod.weights && prod.weights[0]) || { price: 40, originalPrice: 50, label: '1 kg' };
  const linePrice = activeWeight.price * detailQuantity;
  const origPrice = activeWeight.originalPrice || activeWeight.price;
  const lineOriginalPrice = origPrice * detailQuantity;
  const lineSavings = Math.max(0, lineOriginalPrice - linePrice);

  const priceVal = document.getElementById('detail-price-val');
  const origPriceVal = document.getElementById('detail-original-price-val');
  const discountBadge = document.getElementById('detail-discount-badge');
  const savingsVal = document.getElementById('detail-savings-val');
  const weightLabelVal = document.getElementById('detail-weight-label-val');

  if (priceVal) priceVal.textContent = `₹${linePrice}`;
  if (origPriceVal) origPriceVal.textContent = `₹${lineOriginalPrice}`;
  if (discountBadge) {
    if (activeWeight.discount) {
      discountBadge.textContent = activeWeight.discount;
      discountBadge.classList.remove('hidden');
    } else if (lineSavings > 0) {
      discountBadge.textContent = `${Math.round((lineSavings / lineOriginalPrice) * 100)}% OFF`;
      discountBadge.classList.remove('hidden');
    } else {
      discountBadge.classList.add('hidden');
    }
  }
  if (savingsVal) savingsVal.textContent = `You save ₹${lineSavings}`;
  if (weightLabelVal) weightLabelVal.textContent = `/ ${activeWeight.label}`;

  const mobStickyPrice = document.getElementById('mobile-sticky-price');
  if (mobStickyPrice) {
    mobStickyPrice.innerHTML = `₹${linePrice} <span class="text-[11px] font-normal text-stone-400 block -mt-1">/ ${activeWeight.label}</span>`;
  }
}

// Gallery Thumbnail Switcher
window.setDetailGalleryImage = function(index) {
  currentGalleryImageIndex = index;
  const prod = currentDetailProduct || allVegetablesData[0];
  const galleryItems = (prod.gallery && prod.gallery.length > 0) ? prod.gallery : [
    { url: prod.image, title: prod.name }
  ];
  const selectedImage = galleryItems[index] || galleryItems[0];

  const mainImg = document.getElementById('detail-main-img');
  const lightboxImg = document.getElementById('lightbox-main-img');
  const captionEl = document.getElementById('lightbox-caption');

  if (mainImg) {
    mainImg.src = selectedImage.url;
    mainImg.alt = selectedImage.title || prod.name;
  }
  if (lightboxImg) lightboxImg.src = selectedImage.url;
  if (captionEl) captionEl.textContent = selectedImage.title || prod.name;

  document.querySelectorAll('.thumb-btn').forEach((btn, idx) => {
    if (idx === index) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
};

// Fullscreen Lightbox
window.openLightbox = function() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.classList.add('overflow-hidden');
  }
};

window.closeLightbox = function() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
  }
};

// Delivery PIN Code Checker
window.checkDeliveryPincode = function() {
  const input = document.getElementById('pincode-input');
  const resultBox = document.getElementById('pincode-result');
  if (!input || !resultBox) return;

  const pin = input.value.trim();
  if (pin.length !== 6 || isNaN(pin)) {
    resultBox.classList.remove('hidden');
    resultBox.className = 'mt-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold';
    resultBox.innerHTML = `⚠️ Please enter a valid 6-digit Indian PIN code.`;
    return;
  }

  resultBox.classList.remove('hidden');
  resultBox.className = 'mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950';
  resultBox.innerHTML = `
    <div class="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      ✓ Delivery available at ${pin}
    </div>
    <div class="text-[11px] text-stone-600">
      Estimated delivery: <strong class="text-emerald-950 font-bold">Today, 6:00 PM – 9:00 PM</strong>
    </div>
    <div class="text-[10px] text-emerald-700 font-semibold mt-1">
      Free delivery on orders above ₹299 (90 mins slot)
    </div>
  `;
};

// Add to Cart from Detail Page
window.addDetailProductToCart = function() {
  const prod = currentDetailProduct || allVegetablesData[0];
  if ((window.__suspendedProductIds && window.__suspendedProductIds.has(prod.id)) || prod.status === 'SUSPENDED') {
    showToast('This item is temporarily suspended from the farm catalog.', 'error');
    return;
  }
  const weight = (prod.weights && prod.weights[detailSelectedWeightIndex]) || (prod.weights && prod.weights[0]) || { price: 40, originalPrice: 50, label: '1 pack' };
  const cartKey = `${prod.id}-${detailSelectedWeightIndex}`;

  if (cart[cartKey]) {
    cart[cartKey].qty += detailQuantity;
  } else {
    cart[cartKey] = {
      productId: prod.id,
      name: prod.name,
      hindiName: prod.hindiName,
      weightIndex: detailSelectedWeightIndex,
      weightLabel: weight.label,
      price: weight.price,
      originalPrice: weight.originalPrice || weight.price,
      image: prod.image,
      qty: detailQuantity
    };
  }

  saveStoredState('sabjihub_cart', cart);
  updateCartUI();

  // Trigger button feedback
  const addBtn = document.getElementById('detail-add-btn');
  const mobAddBtn = document.getElementById('mob-sticky-add-btn');

  if (addBtn) {
    const originalText = addBtn.innerHTML;
    addBtn.innerHTML = `<span>✓ Added to Basket (${cart[cartKey].qty})</span>`;
    addBtn.classList.add('bg-emerald-800');
    setTimeout(() => {
      addBtn.innerHTML = originalText;
      addBtn.classList.remove('bg-emerald-800');
    }, 2000);
  }

  if (mobAddBtn) {
    mobAddBtn.textContent = '✓ Added!';
    setTimeout(() => mobAddBtn.textContent = 'Add to Cart', 2000);
  }

  showToast(`Added ${detailQuantity} × ${prod.name} (${weight.label}) to basket! 🧺`, 'success');
};

// Buy Now from Detail Page
window.buyNowDetailProduct = function() {
  addDetailProductToCart();
  openCartDrawer();
};

// Tab Switching Logic
window.switchProductTab = function(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-content-panel').forEach(panel => {
    if (panel.id === `tab-panel-${tabName}`) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  });
};

// Add Frequently Bought Together Bundle
window.addBundleToCart = function() {
  const tomato = allVegetablesData[0];
  const onion = allVegetablesData[2];
  const coriander = allVegetablesData[13];

  // 1kg Tomato
  const tKey = `${tomato.id}-2`;
  cart[tKey] = cart[tKey] || {
    productId: tomato.id,
    name: tomato.name,
    hindiName: tomato.hindiName,
    weightLabel: '1 kg',
    price: 36, // bundle special discounted
    originalPrice: 50,
    image: tomato.image,
    qty: 0
  };
  cart[tKey].qty += 1;

  // 1kg Onion
  const oKey = `${onion.id}-0`;
  cart[oKey] = cart[oKey] || {
    productId: onion.id,
    name: onion.name,
    hindiName: onion.hindiName,
    weightLabel: '1 kg',
    price: 38,
    originalPrice: 65,
    image: onion.image,
    qty: 0
  };
  cart[oKey].qty += 1;

  // 1 bunch Coriander
  const cKey = `${coriander.id}-0`;
  cart[cKey] = cart[cKey] || {
    productId: coriander.id,
    name: coriander.name,
    hindiName: coriander.hindiName,
    weightLabel: '1 bunch',
    price: 15,
    originalPrice: 30,
    image: coriander.image,
    qty: 0
  };
  cart[cKey].qty += 1;

  saveStoredState('sabjihub_cart', cart);
  updateCartUI();
  showToast('🎉 Trio Cooking Bundle (Tomato + Onion + Dhaniya) added! You saved ₹16!', 'success');
  openCartDrawer();
};

// Review Modal Handlers
window.openReviewModal = function() {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.classList.add('overflow-hidden');
  }
};

window.closeReviewModal = function() {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
  }
};

window.submitReview = function(e) {
  if (e) e.preventDefault();
  closeReviewModal();
  showToast('⭐ Thank you! Your verified review has been submitted for approval.', 'success');
};

// Render Related Products ("You May Also Like")
function renderRelatedProducts() {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  const current = window.currentDetailProduct;
  const currentCat = current ? (current.catalogType || 'vegetables') : 'vegetables';
  const allProds = getAllCatalogProducts();

  // Find products in same category excluding current product, fallback to any catalog product
  let items = allProds.filter(v => v.id !== (current && current.id) && v.catalogType === currentCat);
  if (items.length < 6) {
    const extra = allProds.filter(v => v.id !== (current && current.id) && !items.some(it => it.id === v.id));
    items = items.concat(extra);
  }
  items = items.slice(0, 6);

  container.innerHTML = items.map(product => {
    const p = normalizeCatalogProduct(product, product.catalogType || currentCat);
    const activeWeight = p.weights[p.selectedWeightIndex || 0] || p.weights[0];
    const cartKey = `${p.id}-${p.selectedWeightIndex || 0}`;
    const inCartQty = cart[cartKey] ? cart[cartKey].qty : 0;
    const isWishlisted = wishlist.includes(p.id);
    const detailLink = `product-details.html?id=${encodeURIComponent(p.id)}`;

    return `
      <div class="product-card group bg-white rounded-3xl p-4 border border-emerald-900/5 shadow-soft shadow-card-hover flex flex-col justify-between relative transition-all duration-300">
        <div class="flex items-center justify-between mb-2">
          <span class="badge-fresh text-[10px] px-2 py-0.5 rounded-full font-bold">100% Fresh</span>
          <button onclick="toggleWishlist('${p.id}', event)" class="w-7 h-7 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 hover:text-red-500">
            <svg class="w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <a href="${detailLink}" class="relative w-full h-36 rounded-2xl overflow-hidden bg-stone-50 mb-3 img-zoom-container block">
          <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div class="quick-actions-bar absolute inset-x-2 bottom-3 flex justify-center">
            <button type="button" onclick="event.preventDefault(); openQuickView('${p.id}')" class="px-3 py-1 bg-white text-emerald-950 font-bold text-[10px] rounded-lg shadow-sm">Quick View</button>
          </div>
        </a>

        <div class="flex-1">
          <a href="${detailLink}" class="block">
            <h4 class="font-bold text-sm text-emerald-950 truncate group-hover:text-emerald-700 transition-colors">${p.name}</h4>
          </a>
          <span class="text-[11px] text-emerald-700 font-semibold block mb-1">${p.hindiName}</span>
          <div class="flex items-center gap-1 text-[11px] text-amber-500 font-bold mb-3">
            <span>★ ${p.rating}</span>
            <span class="text-stone-400 font-normal">(${p.reviewsCount})</span>
          </div>
        </div>

        <div class="pt-2 border-t border-emerald-900/5 flex items-center justify-between mt-auto">
          <div>
            <span class="text-base font-black text-emerald-950">₹${activeWeight.price}</span>
            <span class="text-[10px] text-stone-400 block">${activeWeight.label}</span>
          </div>
          <div>
            ${inCartQty === 0 ? `
              <button onclick="addToCart('${p.id}', ${p.selectedWeightIndex || 0})" class="btn-primary px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs">
                ADD +
              </button>
            ` : `
              <div class="inline-flex items-center bg-emerald-800 text-white rounded-xl shadow-xs overflow-hidden">
                <button onclick="updateCartItemQty('${cartKey}', -1)" class="w-6 h-6 flex items-center justify-center font-bold text-xs hover:bg-emerald-700">−</button>
                <span class="w-5 text-center text-xs font-bold">${inCartQty}</span>
                <button onclick="updateCartItemQty('${cartKey}', 1)" class="w-6 h-6 flex items-center justify-center font-bold text-xs hover:bg-emerald-700">+</button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
  if (window.lucide) window.lucide.createIcons();
}

// Render Recently Viewed Products
function renderRecentlyViewed() {
  const container = document.getElementById('recently-viewed-container');
  if (!container) return;

  const allProds = getAllCatalogProducts();
  const recent = [allProds[1], allProds[20] || allProds[2], allProds[39] || allProds[3], allProds[4]].filter(Boolean);

  container.innerHTML = recent.map(product => {
    const p = normalizeCatalogProduct(product, product.catalogType || 'vegetables');
    const w = p.weights[0];
    const detailLink = `product-details.html?id=${encodeURIComponent(p.id)}`;
    return `
      <a href="${detailLink}" class="min-w-[170px] sm:min-w-[200px] bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex items-center gap-3 hover:border-emerald-300 transition-colors group">
        <img src="${p.image}" class="w-14 h-14 rounded-xl object-cover" alt="${p.name}" />
        <div class="flex-1 min-w-0">
          <h5 class="font-bold text-xs text-emerald-950 truncate group-hover:text-emerald-700">${p.name}</h5>
          <span class="text-[10px] text-stone-500 block">₹${w.price} / ${w.label}</span>
          <button type="button" onclick="event.preventDefault(); event.stopPropagation(); addToCart('${p.id}', 0);" class="text-[10px] text-emerald-700 font-bold hover:underline mt-0.5">
            + Add
          </button>
        </div>
      </a>
    `;
  }).join('');
}

// -------------------------------------------------------------
// HOMEPAGE LOGIC (for index.html)
// -------------------------------------------------------------
function initHomePage() {
  updateStorefrontSubnavs();
  renderHomeProductGrid();
  renderTodaysDeals();
}

// Render "🔥 Today's Best Deals" Section
function renderTodaysDeals() {
  const container = document.getElementById('todays-deals-grid');
  if (!container) return;

  const allProds = getAllCatalogProducts();
  const dealCandidates = ['tomato', 'apple', 'prod_atta', 'onion', 'mango', 'combo-daily'];
  let dealsItems = allProds.filter(v => dealCandidates.includes(v.id));
  if (dealsItems.length < 6) {
    dealsItems = allProds.slice(0, 6);
  }

  container.innerHTML = dealsItems.map(product => {
    const p = normalizeCatalogProduct(product, product.catalogType || 'vegetables');
    const activeWeight = p.weights[p.selectedWeightIndex || 0] || p.weights[0];
    const cartKey = `${p.id}-${p.selectedWeightIndex || 0}`;
    const inCartQty = cart[cartKey] ? cart[cartKey].qty : 0;
    const isWishlisted = wishlist.includes(p.id);
    const detailLink = `product-details.html?id=${encodeURIComponent(p.id)}`;

    return `
      <div class="deal-card group bg-white rounded-3xl p-4 border border-emerald-900/10 shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between relative">
        <!-- Top Badge & Wishlist -->
        <div class="flex items-center justify-between gap-2 mb-2.5">
          <span class="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-amber-500 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
            <span>🔥</span>
            <span>${activeWeight.discount || 'DEAL'}</span>
          </span>

          <button 
            onclick="toggleWishlist('${p.id}', event)" 
            class="w-7 h-7 rounded-xl bg-stone-50 hover:bg-red-50 flex items-center justify-center transition-colors text-stone-400 hover:text-red-500"
            title="Add to Wishlist"
          >
            <svg class="w-4 h-4 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-stone-400'}" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <!-- Product Image -->
        <a href="${detailLink}" class="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden bg-stone-50 mb-3 img-zoom-container flex items-center justify-center block">
          <img 
            src="${p.image}" 
            alt="${p.name}" 
            loading="lazy" 
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute bottom-1.5 left-1.5 bg-emerald-950/70 backdrop-blur-xs text-[10px] font-semibold text-emerald-200 px-2 py-0.5 rounded-md">
            ${activeWeight.label}
          </div>
        </a>

        <!-- Content -->
        <div class="flex-1">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">${p.badge}</span>
            <div class="flex items-center gap-0.5 text-xs font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded">
              <span class="text-amber-500">★</span>
              <span>${p.rating}</span>
            </div>
          </div>

          <a href="${detailLink}">
            <h4 class="font-bold text-sm sm:text-base text-emerald-950 group-hover:text-emerald-700 transition-colors line-clamp-1">
              ${p.name}
            </h4>
          </a>
          <p class="text-[11px] text-stone-500 mb-3 line-clamp-1">${p.hindiName} • Direct Farm Harvest</p>
        </div>

        <!-- Price & Add Button -->
        <div class="pt-2 border-t border-emerald-950/5 flex items-center justify-between mt-auto">
          <div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-lg sm:text-xl font-black text-emerald-950">₹${activeWeight.price}</span>
              <span class="text-xs text-stone-400 line-through">₹${activeWeight.originalPrice}</span>
            </div>
          </div>

          <div class="min-w-[80px] flex justify-end">
            ${inCartQty === 0 ? `
              <button 
                onclick="addToCart('${p.id}', ${p.selectedWeightIndex || 0})" 
                class="btn-primary flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs shadow-sm shadow-emerald-700/20 active:scale-95"
              >
                <span>ADD</span>
                <span class="text-sm leading-none">+</span>
              </button>
            ` : `
              <div class="inline-flex items-center bg-emerald-800 text-white rounded-xl shadow-xs overflow-hidden border border-emerald-700">
                <button 
                  onclick="updateCartItemQty('${cartKey}', -1)" 
                  class="stepper-btn w-6 sm:w-7 h-7 sm:h-8 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 active:bg-emerald-900"
                >
                  −
                </button>
                <span class="w-6 sm:w-7 text-center text-xs font-black text-white select-none">
                  ${inCartQty}
                </span>
                <button 
                  onclick="updateCartItemQty('${cartKey}', 1)" 
                  class="stepper-btn w-6 sm:w-7 h-7 sm:h-8 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 active:bg-emerald-900"
                >
                  +
                </button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}


function renderHomeProductGrid() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  const allProds = getAllCatalogProducts().filter(p => !isProductSuspended(p.id));
  let homeItems;
  if (homeActiveCategory === 'vegetables') {
    homeItems = allProds.filter(p => p.catalogType === 'vegetables');
  } else if (homeActiveCategory === 'leafy') {
    homeItems = allProds.filter(p => (p.categories && p.categories.includes('leafy')) || (p.name && /palak|methi|spinach|coriander|mint|lettuce/i.test(p.name)));
  } else if (homeActiveCategory === 'herbs') {
    homeItems = allProds.filter(p => (p.categories && (p.categories.includes('herbs') || p.categories.includes('root'))) || (p.name && /ginger|garlic|chilli|herb|root|onion|potato/i.test(p.name)));
  } else {
    const featuredIds = ['tomato', 'potato', 'onion', 'spinach', 'apple', 'mango', 'prod_atta', 'prod_oil'];
    homeItems = allProds.filter(p => featuredIds.includes(p.id));
    if (homeItems.length < 8) {
      homeItems = allProds.slice(0, 8);
    }
  }

  container.innerHTML = homeItems.map(product => {
    const p = normalizeCatalogProduct(product, product.catalogType || 'vegetables');
    const activeWeight = p.weights[p.selectedWeightIndex || 0] || p.weights[0];
    const cartKey = `${p.id}-${p.selectedWeightIndex || 0}`;
    const inCartQty = cart[cartKey] ? cart[cartKey].qty : 0;
    const isWishlisted = wishlist.includes(p.id);
    const detailLink = `product-details.html?id=${encodeURIComponent(p.id)}`;

    return `
      <div class="product-card group bg-white rounded-3xl p-4 sm:p-5 border border-emerald-900/5 shadow-soft shadow-card-hover flex flex-col justify-between relative transition-all duration-300">
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            p.badgeType === 'bestseller' 
              ? 'bg-amber-100 text-amber-900 border border-amber-300/60' 
              : 'badge-fresh'
          }">
            <span class="w-1.5 h-1.5 rounded-full ${p.badgeType === 'bestseller' ? 'bg-amber-500' : 'bg-emerald-600'} animate-pulse"></span>
            ${p.badge}
          </span>

          <div class="flex items-center gap-1.5">
            <button 
              onclick="toggleWishlist('${p.id}', event)" 
              class="w-8 h-8 rounded-xl bg-stone-50 hover:bg-red-50 flex items-center justify-center transition-colors text-stone-400 hover:text-red-500"
              title="Add to Wishlist"
            >
              <svg class="w-4 h-4 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-stone-400'}" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>

            <div class="flex items-center gap-1 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-100 text-xs font-semibold text-emerald-800">
              <span class="text-amber-500">★</span>
              <span>${p.rating}</span>
            </div>
          </div>
        </div>

        <a href="${detailLink}" class="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-stone-50 mb-4 img-zoom-container flex items-center justify-center block">
          <img 
            src="${p.image}" 
            alt="${p.name}" 
            loading="lazy"
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium text-white/90">
            🌱 ${p.origin.split(',')[0]}
          </div>
          ${activeWeight.discount ? `
            <div class="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
              ${activeWeight.discount}
            </div>
          ` : ''}

          <div class="quick-actions-bar absolute inset-x-3 bottom-10 flex justify-center">
            <button 
              type="button"
              onclick="event.preventDefault(); openQuickView('${p.id}')" 
              class="px-4 py-2 bg-white/95 hover:bg-white text-emerald-950 font-bold text-xs rounded-xl shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all"
            >
              <span>Quick View</span>
            </button>
          </div>
        </a>

        <div class="flex-1">
          <a href="${detailLink}">
            <h3 class="font-bold text-base sm:text-lg text-emerald-950 group-hover:text-emerald-700 transition-colors">
              ${p.name}
            </h3>
          </a>
          <p class="text-xs text-emerald-700/80 font-medium mb-1.5">${p.hindiName}</p>
          <p class="text-xs text-stone-500 line-clamp-2 mb-3 leading-relaxed">
            ${p.description}
          </p>

          <div class="mb-4">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-emerald-900/60 mb-1.5 flex items-center justify-between">
              <span>Select Quantity</span>
              <span class="text-emerald-700 font-bold">${activeWeight.label}</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${p.weights.map((w, idx) => `
                <button 
                  onclick="selectProductWeight('${p.id}', ${idx})" 
                  class="weight-chip px-2.5 py-1 rounded-xl text-xs font-semibold ${
                    idx === (p.selectedWeightIndex || 0) ? 'active' : 'bg-stone-50 text-stone-700'
                  }"
                >
                  ${w.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-emerald-950/5 flex items-center justify-between mt-auto">
          <div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl sm:text-2xl font-black text-emerald-950">₹${activeWeight.price}</span>
              <span class="text-xs text-stone-400 line-through">₹${activeWeight.originalPrice}</span>
            </div>
            <span class="text-[10px] text-emerald-700 font-bold">
              Save ₹${activeWeight.originalPrice - activeWeight.price}
            </span>
          </div>

          <div class="min-w-[90px] flex justify-end">
            ${inCartQty === 0 ? `
              <button 
                onclick="addToCart('${p.id}', ${p.selectedWeightIndex || 0})" 
                class="btn-primary flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm shadow-emerald-700/20 active:scale-95"
              >
                <span>ADD</span>
                <span class="text-base leading-none">+</span>
              </button>
            ` : `
              <div class="inline-flex items-center bg-emerald-800 text-white rounded-xl shadow-xs overflow-hidden border border-emerald-700">
                <button 
                  onclick="updateCartItemQty('${cartKey}', -1)" 
                  class="stepper-btn w-7 sm:w-8 h-8 sm:h-9 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 active:bg-emerald-900"
                >
                  −
                </button>
                <span class="w-7 sm:w-8 text-center text-xs sm:text-sm font-black text-white select-none">
                  ${inCartQty}
                </span>
                <button 
                  onclick="updateCartItemQty('${cartKey}', 1)" 
                  class="stepper-btn w-7 sm:w-8 h-8 sm:h-9 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 active:bg-emerald-900"
                >
                  +
                </button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

}

// -------------------------------------------------------------
// SHOP VEGETABLES PAGE LOGIC (for vegetables.html)
// -------------------------------------------------------------
function initVegetablesPage() {
  updateStorefrontSubnavs();
  renderCombosSection();
  applyFiltersAndRender();
}

function updateCategoryCounts() {
  const activeVeg = (typeof allVegetablesData !== 'undefined') 
    ? allVegetablesData.filter(v => !isProductSuspended(v.id)) 
    : [];
  const activeCombos = (typeof combosData !== 'undefined') 
    ? combosData.filter(v => !isProductSuspended(v.id)) 
    : [];

  const counts = {
    all: activeVeg.length,
    leafy: activeVeg.filter(v => v.categories && v.categories.includes('leafy')).length,
    root: activeVeg.filter(v => v.categories && v.categories.includes('root')).length,
    herbs: activeVeg.filter(v => v.categories && v.categories.includes('herbs')).length,
    exotic: activeVeg.filter(v => v.categories && v.categories.includes('exotic')).length,
    seasonal: activeVeg.filter(v => v.categories && v.categories.includes('seasonal')).length,
    organic: activeVeg.filter(v => v.categories && v.categories.includes('organic')).length,
    combos: activeCombos.length
  };

  Object.keys(counts).forEach(cat => {
    const el = document.getElementById(`count-${cat}`);
    if (el) el.textContent = counts[cat];
  });
}

function renderCombosSection() {
  const container = document.getElementById('combos-grid');
  if (!container) return;

  container.innerHTML = combosData.map(combo => {
    const inCart = cart[combo.id] ? cart[combo.id].qty : 0;

    return `
      <div class="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-900/10 shadow-soft shadow-card-hover flex flex-col justify-between relative group">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              ⭐ ${combo.badge}
            </span>
            <span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              ${combo.itemCount} Fresh Items
            </span>
          </div>

          <div class="w-full h-44 rounded-2xl overflow-hidden mb-4 img-zoom-container relative bg-stone-50">
            <img src="${combo.image}" alt="${combo.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute bottom-2 right-2 bg-emerald-800 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-sm">
              ${combo.savings}
            </div>
          </div>

          <h3 class="font-heading font-black text-lg text-emerald-950 mb-0.5">${combo.name}</h3>
          <p class="text-xs text-emerald-700 font-semibold mb-2">${combo.hindiName}</p>
          <p class="text-xs text-stone-600 leading-relaxed mb-4">
            Includes: <span class="font-medium text-stone-700">${combo.itemsList}</span>
          </p>
        </div>

        <div class="pt-4 border-t border-emerald-900/5 flex items-center justify-between mt-auto">
          <div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-emerald-950">₹${combo.offerPrice}</span>
              <span class="text-xs text-stone-400 line-through">₹${combo.originalPrice}</span>
            </div>
            <span class="text-[10px] text-emerald-600 font-bold block">Special Bundle Offer</span>
          </div>

          <div>
            ${inCart === 0 ? `
              <button 
                onclick="addComboToCart('${combo.id}')" 
                class="btn-primary px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md"
              >
                <span>Add Basket</span>
                <span>+</span>
              </button>
            ` : `
              <div class="inline-flex items-center bg-emerald-800 text-white rounded-xl shadow-md overflow-hidden">
                <button onclick="updateCartItemQty('${combo.id}', -1)" class="w-8 h-8 flex items-center justify-center font-bold hover:bg-emerald-700">−</button>
                <span class="w-7 text-center text-xs font-bold">${inCart}</span>
                <button onclick="updateCartItemQty('${combo.id}', 1)" class="w-8 h-8 flex items-center justify-center font-bold hover:bg-emerald-700">+</button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.addComboToCart = function(comboId) {
  const combo = combosData.find(c => c.id === comboId);
  if (!combo) return;

  if (cart[combo.id]) {
    cart[combo.id].qty += 1;
  } else {
    cart[combo.id] = {
      productId: combo.id,
      name: combo.name,
      hindiName: combo.hindiName,
      weightLabel: `${combo.itemCount} Fresh Items Pack`,
      price: combo.offerPrice,
      originalPrice: combo.originalPrice,
      image: combo.image,
      qty: 1
    };
  }

  saveStoredState('sabjihub_cart', cart);
  updateCartUI();
  renderCombosSection();
  showToast(`Added ${combo.name} to basket! 🧺`, 'success');
};

window.setCategory = function(cat) {
  filterState.category = cat;
  
  document.querySelectorAll('.sidebar-cat-btn').forEach(btn => {
    if (btn.dataset.category === cat) {
      btn.classList.add('bg-emerald-700', 'text-white', 'shadow-sm');
      btn.classList.remove('text-stone-700', 'hover:bg-emerald-50');
    } else {
      btn.classList.remove('bg-emerald-700', 'text-white', 'shadow-sm');
      btn.classList.add('text-stone-700', 'hover:bg-emerald-50');
    }
  });

  document.querySelectorAll('.mobile-cat-chip').forEach(chip => {
    if (chip.dataset.category === cat) {
      chip.classList.add('bg-emerald-700', 'text-white');
      chip.classList.remove('bg-stone-100', 'text-stone-700');
    } else {
      chip.classList.remove('bg-emerald-700', 'text-white');
      chip.classList.add('bg-stone-100', 'text-stone-700');
    }
  });

  document.querySelectorAll('.veg-nav-cat-btn').forEach(btn => {
    const isCombo = btn.dataset.category === 'combos';
    const badge = btn.querySelector('span:last-child');
    if (btn.dataset.category === cat) {
      btn.className = `veg-nav-cat-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isCombo ? 'bg-amber-600 text-white shadow-xs' : 'bg-emerald-700 text-white shadow-xs'} transition-all whitespace-nowrap active:scale-95 shrink-0`;
      if (badge) badge.className = 'text-[10px] px-1.5 py-0.2 rounded-full bg-white/25 font-mono';
    } else {
      btn.className = `veg-nav-cat-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isCombo ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/60' : 'text-stone-700 bg-white/80 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200/60'} transition-all whitespace-nowrap active:scale-95 shrink-0`;
      if (badge) badge.className = `text-[10px] px-1.5 py-0.2 rounded-full ${isCombo ? 'bg-amber-200 text-amber-900' : 'bg-stone-100 text-stone-500'} font-mono`;
    }
  });

  applyFiltersAndRender();
};

window.handlePriceFilterChange = function(val) {
  filterState.maxPrice = parseInt(val, 10);
  const display = document.getElementById('price-slider-display');
  const displayMob = document.getElementById('price-slider-display-mob');
  if (display) display.textContent = `Up to ₹${filterState.maxPrice}`;
  if (displayMob) displayMob.textContent = `Up to ₹${filterState.maxPrice}`;
  applyFiltersAndRender();
};

window.handleRatingFilterChange = function(rating) {
  filterState.minRating = parseFloat(rating);
  applyFiltersAndRender();
};

window.handleAvailabilityFilter = function(checkbox) {
  const isChecked = typeof checkbox === 'boolean' ? checkbox : checkbox.checked;
  filterState.onlyInStock = isChecked;
  document.querySelectorAll('.veg-filter-stock-cb').forEach(cb => {
    cb.checked = isChecked;
  });
  applyFiltersAndRender();
};

window.handleOffersFilter = function(checkbox) {
  const isChecked = typeof checkbox === 'boolean' ? checkbox : checkbox.checked;
  filterState.onlyOffers = isChecked;
  document.querySelectorAll('.veg-filter-offers-cb').forEach(cb => {
    cb.checked = isChecked;
  });
  applyFiltersAndRender();
};

window.handleSortChange = function(sortBy) {
  filterState.sortBy = sortBy;
  const sortSelect = document.getElementById('sort-selector');
  if (sortSelect) sortSelect.value = sortBy;
  const sortSelectMob = document.getElementById('sort-selector-mob');
  if (sortSelectMob) sortSelectMob.value = sortBy;
  applyFiltersAndRender();
};

window.resetAllFilters = function() {
  filterState = {
    category: 'all',
    maxPrice: 250,
    minRating: 0,
    onlyInStock: false,
    onlyOffers: false,
    sortBy: 'popular',
    searchQuery: ''
  };

  // Uncheck all availability & offer checkboxes across page
  document.querySelectorAll('.veg-filter-stock-cb').forEach(cb => {
    cb.checked = false;
  });
  document.querySelectorAll('.veg-filter-offers-cb').forEach(cb => {
    cb.checked = false;
  });

  // Reset price slider
  const slider = document.getElementById('price-range-slider');
  if (slider) slider.value = 250;
  const sliderMob = document.getElementById('price-range-slider-mob');
  if (sliderMob) sliderMob.value = 250;
  const display = document.getElementById('price-slider-display');
  if (display) display.textContent = 'Up to ₹250';
  const displayMob = document.getElementById('price-slider-display-mob');
  if (displayMob) displayMob.textContent = 'Up to ₹250';

  // Reset sort selectors
  const sortSelect = document.getElementById('sort-selector');
  if (sortSelect) sortSelect.value = 'popular';
  const sortSelectMob = document.getElementById('sort-selector-mob');
  if (sortSelectMob) sortSelectMob.value = 'popular';

  // Clear search inputs
  const headerSearch = document.getElementById('header-inline-search');
  if (headerSearch) headerSearch.value = '';
  const searchModalInput = document.getElementById('search-modal-input');
  if (searchModalInput) searchModalInput.value = '';

  // Reset categories and render
  setCategory('all');
  closeFilterSheet();

  if (typeof showToast === 'function') {
    showToast('Filters & sort reset to default 🥬', 'info');
  }
};

function applyFiltersAndRender() {
  const container = document.getElementById('veg-products-grid');
  if (!container) return;

  let filtered = [...allVegetablesData];

  if (filterState.category !== 'all') {
    if (filterState.category === 'combos') {
      const comboSec = document.getElementById('combos-section');
      if (comboSec) comboSec.scrollIntoView({ behavior: 'smooth' });
      return;
    } else {
      filtered = filtered.filter(v => v.categories.includes(filterState.category));
    }
  }

  filtered = filtered.filter(v => {
    const currentPrice = v.weights[v.selectedWeightIndex].price;
    return currentPrice <= filterState.maxPrice;
  });

  if (filterState.minRating > 0) {
    filtered = filtered.filter(v => v.rating >= filterState.minRating);
  }

  if (filterState.onlyInStock) {
    filtered = filtered.filter(v => v.inStock === true);
  }

  if (filterState.onlyOffers) {
    filtered = filtered.filter(v => {
      const w = v.weights[v.selectedWeightIndex];
      return Boolean(w.discount && w.discount.length > 0);
    });
  }

  if (filterState.searchQuery) {
    const q = filterState.searchQuery.toLowerCase();
    filtered = filtered.filter(v => 
      v.name.toLowerCase().includes(q) ||
      v.hindiName.toLowerCase().includes(q) ||
      (v.description && v.description.toLowerCase().includes(q))
    );
  }

  switch (filterState.sortBy) {
    case 'price-low-high':
      filtered.sort((a, b) => {
        const priceA = a.weights[a.selectedWeightIndex].price;
        const priceB = b.weights[b.selectedWeightIndex].price;
        return priceA - priceB || a.name.localeCompare(b.name);
      });
      break;
    case 'price-high-low':
      filtered.sort((a, b) => {
        const priceA = a.weights[a.selectedWeightIndex].price;
        const priceB = b.weights[b.selectedWeightIndex].price;
        return priceB - priceA || a.name.localeCompare(b.name);
      });
      break;
    case 'best-rated':
    case 'rating':
      filtered.sort((a, b) => (b.rating - a.rating) || (b.reviewsCount - a.reviewsCount));
      break;
    case 'newest':
      filtered.sort((a, b) => {
        if (b.isNew !== a.isNew) return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        return (b.stockCount || 0) - (a.stockCount || 0) || a.name.localeCompare(b.name);
      });
      break;
    case 'popular':
    default:
      filtered.sort((a, b) => (b.reviewsCount - a.reviewsCount) || (b.rating - a.rating));
      break;
  }

  // Active filter detection
  const isFiltered = Boolean(
    filterState.category !== 'all' ||
    filterState.onlyInStock ||
    filterState.onlyOffers ||
    filterState.maxPrice < 250 ||
    filterState.minRating > 0 ||
    filterState.searchQuery ||
    filterState.sortBy !== 'popular'
  );

  // Update product count label
  const countEl = document.getElementById('showing-products-count');
  if (countEl) {
    const total = allVegetablesData.length;
    if (filtered.length === total && !isFiltered) {
      countEl.innerHTML = `Showing all <strong>${total}</strong> vegetables`;
    } else if (filtered.length === total) {
      countEl.innerHTML = `Showing <strong>${total}</strong> vegetables`;
    } else if (filtered.length === 1) {
      countEl.innerHTML = `Showing <strong>1</strong> of ${total} vegetables`;
    } else {
      countEl.innerHTML = `Showing <strong>${filtered.length}</strong> of ${total} vegetables`;
    }
  }

  // Update Reset button appearance
  const resetBtn = document.getElementById('veg-reset-filters-btn');
  if (resetBtn) {
    if (isFiltered) {
      resetBtn.className = "text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-red-50 hover:text-red-700 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-all border border-emerald-300 shadow-xs cursor-pointer shrink-0";
      resetBtn.innerHTML = `<i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Reset <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>`;
    } else {
      resetBtn.className = "text-xs text-stone-400 hover:text-emerald-700 underline ml-1 inline-flex items-center gap-1 font-medium transition-colors cursor-pointer shrink-0";
      resetBtn.innerHTML = `<i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Reset`;
    }
  }

  // Sync checkboxes visual state
  document.querySelectorAll('.veg-filter-stock-cb').forEach(cb => {
    cb.checked = Boolean(filterState.onlyInStock);
  });
  document.querySelectorAll('.veg-filter-offers-cb').forEach(cb => {
    cb.checked = Boolean(filterState.onlyOffers);
  });

  // Sync sort selects visual state
  const sortSelect = document.getElementById('sort-selector');
  if (sortSelect && sortSelect.value !== filterState.sortBy) {
    sortSelect.value = filterState.sortBy;
  }
  const sortSelectMob = document.getElementById('sort-selector-mob');
  if (sortSelectMob && sortSelectMob.value !== filterState.sortBy) {
    sortSelectMob.value = filterState.sortBy;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-3xl p-8 border border-emerald-900/5 shadow-soft">
        <span class="text-4xl mb-3 block">🥦</span>
        <h3 class="font-heading font-black text-xl text-emerald-950 mb-1">No Vegetables Match Your Filters</h3>
        <p class="text-xs text-stone-500 max-w-sm mx-auto mb-6">
          Try expanding your price range, relaxing the rating filter, or choosing "All Vegetables".
        </p>
        <button onclick="resetAllFilters()" class="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold">
          Reset All Filters
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(product => {
    const activeWeight = product.weights[product.selectedWeightIndex];
    const cartKey = `${product.id}-${product.selectedWeightIndex}`;
    const inCartQty = cart[cartKey] ? cart[cartKey].qty : 0;
    const isWishlisted = wishlist.includes(product.id);
    const detailLink = `product-details.html?id=${encodeURIComponent(product.id)}`;

    return `
      <div class="product-card group bg-white rounded-3xl p-3.5 sm:p-5 border border-emerald-900/5 shadow-soft shadow-card-hover flex flex-col justify-between relative transition-all duration-300">
        
        <div class="flex items-center justify-between gap-1.5 mb-2.5">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
            product.badgeType === 'bestseller' 
              ? 'bg-amber-100 text-amber-900 border border-amber-300/60' 
              : 'badge-fresh'
          }">
            <span class="w-1.5 h-1.5 rounded-full ${product.badgeType === 'bestseller' ? 'bg-amber-500' : 'bg-emerald-600'} animate-pulse"></span>
            ${product.badge}
          </span>

          <button 
            onclick="toggleWishlist('${product.id}', event)" 
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-stone-50 hover:bg-red-50 flex items-center justify-center transition-colors text-stone-400 hover:text-red-500 ${isWishlisted ? 'text-red-500 heart-pop' : ''}"
            title="Wishlist"
          >
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-400'}" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <a href="${detailLink}" class="relative w-full h-36 sm:h-48 rounded-2xl overflow-hidden bg-stone-50 mb-3 img-zoom-container flex items-center justify-center block">
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            loading="lazy"
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute bottom-1.5 left-1.5 bg-black/45 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium text-white/90">
            🌱 ${product.origin.split(',')[0]}
          </div>

          ${activeWeight.discount ? `
            <div class="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[9px] sm:text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm">
              ${activeWeight.discount}
            </div>
          ` : ''}

          <div class="quick-actions-bar absolute inset-x-2 bottom-8 hidden sm:flex justify-center">
            <button 
              type="button"
              onclick="event.preventDefault(); openQuickView('${product.id}')" 
              class="px-3 py-1.5 bg-white/95 hover:bg-white text-emerald-950 font-bold text-[11px] rounded-xl shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all"
            >
              <span>Quick View</span>
            </button>
          </div>
        </a>

        <div class="flex-1">
          <a href="${detailLink}">
            <h3 class="font-bold text-sm sm:text-base text-emerald-950 group-hover:text-emerald-700 transition-colors truncate">
              ${product.name}
            </h3>
          </a>
          
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] text-emerald-700 font-semibold">${product.hindiName}</span>
            <div class="flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded">
              <span class="text-amber-500">★</span>
              <span>${product.rating}</span>
              <span class="text-stone-400 font-normal">(${product.reviewsCount})</span>
            </div>
          </div>

          <p class="text-[11px] text-stone-500 line-clamp-1 mb-2.5">
            ${product.description}
          </p>

          <div class="flex items-center gap-2 text-[10px] text-emerald-800 font-medium mb-3">
            <span class="inline-flex items-center gap-0.5">✓ Farm Fresh</span>
            <span class="inline-flex items-center gap-0.5">✓ Ozone Clean</span>
          </div>

          <div class="mb-3">
            <div class="flex flex-wrap gap-1">
              ${product.weights.map((w, idx) => `
                <button 
                  onclick="selectVegWeight('${product.id}', ${idx})" 
                  class="weight-chip px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-semibold ${
                    idx === product.selectedWeightIndex ? 'active' : 'bg-stone-50 text-stone-700'
                  }"
                >
                  ${w.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pt-2.5 border-t border-emerald-950/5 flex items-center justify-between mt-auto">
          <div>
            <div class="flex items-baseline gap-1">
              <span class="text-lg sm:text-xl font-black text-emerald-950">₹${activeWeight.price}</span>
              <span class="text-[10px] sm:text-xs text-stone-400 line-through">₹${activeWeight.originalPrice}</span>
            </div>
            <span class="text-[9px] text-emerald-600 font-semibold block leading-none">per ${activeWeight.label}</span>
          </div>

          <div class="min-w-[75px] sm:min-w-[90px] flex justify-end">
            ${inCartQty === 0 ? `
              <button 
                onclick="addToCart('${product.id}', ${product.selectedWeightIndex})" 
                class="btn-primary flex items-center justify-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs shadow-sm shadow-emerald-700/20 active:scale-95"
              >
                <span>ADD</span>
                <span>+</span>
              </button>
            ` : `
              <div class="inline-flex items-center bg-emerald-800 text-white rounded-xl shadow-xs overflow-hidden border border-emerald-700">
                <button 
                  onclick="updateCartItemQty('${cartKey}', -1)" 
                  class="stepper-btn w-6 sm:w-7 h-7 sm:h-8 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 active:bg-emerald-900"
                >
                  −
                </button>
                <span class="w-6 sm:w-7 text-center text-xs font-black text-white select-none">
                  ${inCartQty}
                </span>
                <button 
                  onclick="updateCartItemQty('${cartKey}', 1)" 
                  class="stepper-btn w-6 sm:w-7 h-7 sm:h-8 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 active:bg-emerald-900"
                >
                  +
                </button>
              </div>
            `}
          </div>
        </div>

      </div>
    `;
  }).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
  if (typeof init3DCardTilt === 'function') {
    init3DCardTilt();
  }
}

window.selectVegWeight = function(productId, weightIndex) {
  const prod = allVegetablesData.find(p => p.id === productId);
  if (prod) {
    prod.selectedWeightIndex = weightIndex;
    applyFiltersAndRender();
  }
};

window.selectFruitWeight = function(productId, weightIndex) {
  const prod = allFruitsData.find(p => p.id === productId);
  if (prod) {
    prod.selectedWeightIndex = weightIndex;
    applyFruitFiltersAndRender();
  }
};

window.selectGroceryWeight = function(productId, weightIndex) {
  const prod = allGroceryData.find(p => p.id === productId);
  if (prod) {
    prod.selectedWeightIndex = weightIndex;
    applyGroceryFiltersAndRender();
  }
};

window.selectProductWeight = function(productId, weightIndex) {
  const prod = findAnyProduct(productId);
  if (prod) {
    prod.selectedWeightIndex = weightIndex;
    renderHomeProductGrid();
  }
};

window.applyVegetableFiltersAndRender = applyFiltersAndRender;

// -------------------------------------------------------------
// SHOP FRUITS PAGE LOGIC (for fruits.html)
// -------------------------------------------------------------
function initFruitsPage() {
  updateStorefrontSubnavs();
  renderFruitCombosSection();
  applyFruitFiltersAndRender();
}

function updateFruitCategoryCounts() {
  const activeFruits = (typeof allFruitsData !== 'undefined') 
    ? allFruitsData.filter(v => !isProductSuspended(v.id)) 
    : [];
  const activeCombos = (typeof fruitCombosData !== 'undefined') 
    ? fruitCombosData.filter(v => !isProductSuspended(v.id)) 
    : [];

  const counts = {
    all: activeFruits.length,
    citrus: activeFruits.filter(v => v.categories && v.categories.includes('citrus')).length,
    tropical: activeFruits.filter(v => v.categories && v.categories.includes('tropical')).length,
    apples: activeFruits.filter(v => v.categories && v.categories.includes('apples')).length,
    berries: activeFruits.filter(v => v.categories && v.categories.includes('berries')).length,
    organic: activeFruits.filter(v => v.categories && v.categories.includes('organic')).length,
    seasonal: activeFruits.filter(v => v.categories && v.categories.includes('seasonal')).length,
    combos: activeCombos.length
  };

  Object.keys(counts).forEach(cat => {
    const el = document.getElementById(`fruit-count-${cat}`);
    if (el) el.textContent = counts[cat];
  });
}

function renderFruitCombosSection() {
  const container = document.getElementById('fruit-combos-grid');
  if (!container) return;

  container.innerHTML = fruitCombosData.map(combo => {
    const inCart = cart[combo.id] ? cart[combo.id].qty : 0;

    return `
      <div class="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-900/10 shadow-soft shadow-card-hover flex flex-col justify-between relative group">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              ⭐ ${combo.badge}
            </span>
            <span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              ${combo.itemCount} Fresh Items
            </span>
          </div>

          <div class="w-full h-44 rounded-2xl overflow-hidden mb-4 img-zoom-container relative bg-stone-50">
            <img src="${combo.image}" alt="${combo.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute bottom-2 right-2 bg-emerald-800 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-sm">
              ${combo.savings}
            </div>
          </div>

          <h3 class="font-heading font-black text-lg text-emerald-950 mb-0.5">${combo.name}</h3>
          <p class="text-xs text-amber-800 font-semibold mb-2">${combo.hindiName}</p>
          <p class="text-xs text-stone-600 leading-relaxed mb-4">
            Includes: <span class="font-medium text-stone-700">${combo.itemsList}</span>
          </p>
        </div>

        <div class="pt-4 border-t border-stone-100 flex items-center justify-between">
          <div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl sm:text-2xl font-black text-emerald-950">₹${combo.offerPrice}</span>
              <span class="text-xs text-stone-400 line-through">₹${combo.originalPrice}</span>
            </div>
            <span class="text-[10px] text-emerald-700 font-semibold">Orchard Curated Box</span>
          </div>

          <div>
            ${inCart === 0 ? `
              <button 
                onclick="addFruitComboToCart('${combo.id}')" 
                class="btn-primary px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md"
              >
                <span>Add Basket</span>
                <span>+</span>
              </button>
            ` : `
              <div class="inline-flex items-center bg-emerald-800 text-white rounded-xl shadow-md overflow-hidden">
                <button onclick="updateCartItemQty('${combo.id}', -1)" class="w-8 h-8 flex items-center justify-center font-bold hover:bg-emerald-700">−</button>
                <span class="w-7 text-center text-xs font-bold">${inCart}</span>
                <button onclick="updateCartItemQty('${combo.id}', 1)" class="w-8 h-8 flex items-center justify-center font-bold hover:bg-emerald-700">+</button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.addFruitComboToCart = function(comboId) {
  const combo = fruitCombosData.find(c => c.id === comboId);
  if (!combo) return;

  if (cart[combo.id]) {
    cart[combo.id].qty += 1;
  } else {
    cart[combo.id] = {
      productId: combo.id,
      name: combo.name,
      hindiName: combo.hindiName,
      weightLabel: `${combo.itemCount} Orchard Items Pack`,
      price: combo.offerPrice,
      originalPrice: combo.originalPrice,
      image: combo.image,
      qty: 1
    };
  }

  saveStoredState('sabjihub_cart', cart);
  updateCartUI();
  renderFruitCombosSection();
  showToast(`Added ${combo.name} to basket! 🧺`, 'success');
};

window.setFruitCategory = function(cat) {
  fruitFilterState.category = cat;

  document.querySelectorAll('.fruit-nav-cat-btn').forEach(btn => {
    const isCombo = btn.dataset.category === 'combos';
    const badge = btn.querySelector('span:last-child');
    if (btn.dataset.category === cat) {
      btn.className = `fruit-nav-cat-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isCombo ? 'bg-amber-600 text-white shadow-xs' : 'bg-emerald-700 text-white shadow-xs'} transition-all whitespace-nowrap active:scale-95 shrink-0`;
      if (badge) badge.className = 'text-[10px] px-1.5 py-0.2 rounded-full bg-white/25 font-mono';
    } else {
      btn.className = `fruit-nav-cat-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isCombo ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/60' : 'text-stone-700 bg-white/80 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200/60'} transition-all whitespace-nowrap active:scale-95 shrink-0`;
      if (badge) badge.className = `text-[10px] px-1.5 py-0.2 rounded-full ${isCombo ? 'bg-amber-200 text-amber-900' : 'bg-stone-100 text-stone-500'} font-mono`;
    }
  });

  if (cat === 'combos') {
    const comboSec = document.getElementById('fruit-combos-section');
    if (comboSec) comboSec.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  applyFruitFiltersAndRender();
};

window.handleFruitAvailabilityFilter = function(checkbox) {
  const isChecked = typeof checkbox === 'boolean' ? checkbox : checkbox.checked;
  fruitFilterState.onlyInStock = isChecked;
  document.querySelectorAll('.fruit-filter-stock-cb').forEach(cb => {
    cb.checked = isChecked;
  });
  applyFruitFiltersAndRender();
};

window.handleFruitOffersFilter = function(checkbox) {
  const isChecked = typeof checkbox === 'boolean' ? checkbox : checkbox.checked;
  fruitFilterState.onlyOffers = isChecked;
  document.querySelectorAll('.fruit-filter-offers-cb').forEach(cb => {
    cb.checked = isChecked;
  });
  applyFruitFiltersAndRender();
};

function applyFruitFiltersAndRender() {
  const container = document.getElementById('fruit-products-grid');
  if (!container) return;

  let filtered = [...allFruitsData];

  if (fruitFilterState.category !== 'all') {
    filtered = filtered.filter(v => v.categories.includes(fruitFilterState.category));
  }

  if (fruitFilterState.onlyInStock) {
    filtered = filtered.filter(v => v.inStock === true);
  }

  if (fruitFilterState.onlyOffers) {
    filtered = filtered.filter(v => {
      const w = v.weights[v.selectedWeightIndex];
      return Boolean(w.discount && w.discount.length > 0);
    });
  }

  if (fruitFilterState.searchQuery) {
    const q = fruitFilterState.searchQuery.toLowerCase();
    filtered = filtered.filter(v => 
      v.name.toLowerCase().includes(q) ||
      v.hindiName.toLowerCase().includes(q) ||
      (v.description && v.description.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-3xl p-8 border border-emerald-900/5 shadow-soft">
        <span class="text-4xl mb-3 block">🍎</span>
        <h3 class="font-heading font-black text-xl text-emerald-950 mb-1">No Fruits Match Your Selection</h3>
        <p class="text-xs text-stone-500 max-w-sm mx-auto mb-6">
          Try choosing "All Fruits" or clearing the active filters.
        </p>
        <button onclick="setFruitCategory('all')" class="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold">
          View All Orchard Fruits
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(product => {
    const activeWeight = product.weights[product.selectedWeightIndex];
    const cartKey = `${product.id}-${product.selectedWeightIndex}`;
    const inCartQty = cart[cartKey] ? cart[cartKey].qty : 0;
    const isWishlisted = wishlist.includes(product.id);
    const detailLink = `product-details.html?id=${encodeURIComponent(product.id)}`;

    return `
      <div class="product-card group bg-white rounded-3xl p-3.5 sm:p-5 border border-emerald-900/5 shadow-soft shadow-card-hover flex flex-col justify-between relative transition-all duration-300">
        
        <div class="flex items-center justify-between gap-1.5 mb-2.5">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
            product.badgeType === 'bestseller' 
              ? 'bg-amber-100 text-amber-900 border border-amber-300/60' 
              : 'badge-fresh'
          }">
            <span class="w-1.5 h-1.5 rounded-full ${product.badgeType === 'bestseller' ? 'bg-amber-500' : 'bg-emerald-600'} animate-pulse"></span>
            ${product.badge}
          </span>

          <button 
            onclick="toggleWishlist('${product.id}', event)" 
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-stone-50 hover:bg-red-50 flex items-center justify-center transition-colors text-stone-400 hover:text-red-500 ${isWishlisted ? 'text-red-500 heart-pop' : ''}"
            title="Wishlist"
          >
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-400'}" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <a href="${detailLink}" class="relative w-full h-36 sm:h-48 rounded-2xl overflow-hidden bg-stone-50 mb-3 img-zoom-container flex items-center justify-center block">
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            loading="lazy" 
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute bottom-1.5 left-1.5 bg-black/45 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium text-white/90">
            🌱 ${product.origin.split(',')[0]}
          </div>

          ${activeWeight.discount ? `
            <div class="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[9px] sm:text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm">
              ${activeWeight.discount}
            </div>
          ` : ''}

          <div class="quick-actions-bar absolute inset-x-2 bottom-8 hidden sm:flex justify-center">
            <button 
              type="button"
              onclick="event.preventDefault(); openQuickView('${product.id}')" 
              class="px-3 py-1.5 bg-white/95 hover:bg-white text-emerald-950 font-bold text-[11px] rounded-xl shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all"
            >
              <span>Quick View</span>
            </button>
          </div>
        </a>

        <div class="flex-1">
          <a href="${detailLink}">
            <h3 class="font-bold text-sm sm:text-base text-emerald-950 group-hover:text-emerald-700 transition-colors truncate">
              ${product.name}
            </h3>
          </a>
          
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] text-amber-800 font-semibold">${product.hindiName}</span>
            <div class="flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded">
              <span class="text-amber-500">★</span>
              <span>${product.rating}</span>
              <span class="text-stone-400 font-normal">(${product.reviewsCount})</span>
            </div>
          </div>

          <p class="text-[11px] text-stone-500 line-clamp-1 mb-2.5">
            ${product.description}
          </p>

          <div class="flex items-center gap-2 text-[10px] text-emerald-800 font-medium mb-3">
            <span class="inline-flex items-center gap-0.5">✓ Naturally Ripened</span>
            <span class="inline-flex items-center gap-0.5">✓ Zero Carbide</span>
          </div>

          <div class="mb-3">
            <div class="flex flex-wrap gap-1">
              ${product.weights.map((w, idx) => `
                <button 
                  onclick="selectFruitWeight('${product.id}', ${idx})" 
                  class="weight-chip px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-semibold ${
                    idx === product.selectedWeightIndex ? 'active' : 'bg-stone-50 text-stone-700'
                  }"
                >
                  ${w.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pt-2.5 border-t border-emerald-950/5 flex items-center justify-between mt-auto">
          <div>
            <div class="flex items-baseline gap-1">
              <span class="text-lg sm:text-xl font-black text-emerald-950">₹${activeWeight.price}</span>
              <span class="text-[10px] sm:text-xs text-stone-400 line-through">₹${activeWeight.originalPrice}</span>
            </div>
            <span class="text-[9px] text-emerald-600 font-semibold block leading-none">per ${activeWeight.label}</span>
          </div>

          <div class="min-w-[75px] sm:min-w-[90px] flex justify-end">
            ${inCartQty === 0 ? `
              <button 
                onclick="addToCart('${product.id}', ${product.selectedWeightIndex})" 
                class="btn-primary flex items-center justify-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs shadow-sm shadow-emerald-700/20 active:scale-95"
              >
                <span>ADD</span>
                <span>+</span>
              </button>
            ` : `
              <div class="inline-flex items-center bg-emerald-800 text-white rounded-xl shadow-xs overflow-hidden border border-emerald-700">
                <button 
                  onclick="updateCartItemQty('${cartKey}', -1)" 
                  class="stepper-btn w-6 sm:w-7 h-7 sm:h-8 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 active:bg-emerald-900"
                >
                  −
                </button>
                <span class="w-6 sm:w-7 text-center text-xs font-black text-white select-none">
                  ${inCartQty}
                </span>
                <button 
                  onclick="updateCartItemQty('${cartKey}', 1)" 
                  class="stepper-btn w-6 sm:w-7 h-7 sm:h-8 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 active:bg-emerald-900"
                >
                  +
                </button>
              </div>
            `}
          </div>
        </div>

      </div>
    `;
  }).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
  if (typeof init3DCardTilt === 'function') {
    init3DCardTilt();
  }
}

// -------------------------------------------------------------
// SHOP GROCERY & PANTRY PAGE LOGIC (for grocery.html)
// -------------------------------------------------------------
function initGroceryPage() {
  updateStorefrontSubnavs();
  renderGroceryCombosSection();
  applyGroceryFiltersAndRender();
}

function updateGroceryCategoryCounts() {
  const activeGrocery = (typeof allGroceryData !== 'undefined') 
    ? allGroceryData.filter(v => !isProductSuspended(v.id)) 
    : [];
  const activeCombos = (typeof groceryCombosData !== 'undefined') 
    ? groceryCombosData.filter(v => !isProductSuspended(v.id)) 
    : [];

  const counts = {
    all: activeGrocery.length,
    dals: activeGrocery.filter(v => v.categories && v.categories.includes('dals')).length,
    grains: activeGrocery.filter(v => v.categories && v.categories.includes('grains')).length,
    oils: activeGrocery.filter(v => v.categories && v.categories.includes('oils')).length,
    spices: activeGrocery.filter(v => v.categories && v.categories.includes('spices')).length,
    sweeteners: activeGrocery.filter(v => v.categories && v.categories.includes('sweeteners')).length,
    dryfruits: activeGrocery.filter(v => v.categories && v.categories.includes('dryfruits')).length,
    combos: activeCombos.length
  };

  Object.keys(counts).forEach(cat => {
    const el = document.getElementById(`grocery-count-${cat}`);
    if (el) el.textContent = counts[cat];
  });
}

function renderGroceryCombosSection() {
  const container = document.getElementById('grocery-combos-grid');
  if (!container) return;

  container.innerHTML = groceryCombosData.map(combo => {
    const inCart = cart[combo.id] ? cart[combo.id].qty : 0;

    return `
      <div class="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-900/10 shadow-soft shadow-card-hover flex flex-col justify-between relative group">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300/60">
              ⭐ ${combo.badge}
            </span>
            <span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              ${combo.itemCount} Pantry Staples
            </span>
          </div>

          <div class="w-full h-44 rounded-2xl overflow-hidden mb-4 img-zoom-container relative bg-stone-50">
            <img src="${combo.image}" alt="${combo.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute bottom-2 right-2 bg-emerald-800 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-sm">
              ${combo.savings}
            </div>
          </div>

          <h3 class="font-heading font-black text-lg text-emerald-950 mb-0.5">${combo.name}</h3>
          <p class="text-xs text-amber-800 font-semibold mb-2">${combo.hindiName}</p>
          <p class="text-xs text-stone-600 leading-relaxed mb-4">
            Includes: <span class="font-medium text-stone-700">${combo.itemsList}</span>
          </p>
        </div>

        <div class="pt-4 border-t border-stone-100 flex items-center justify-between">
          <div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl sm:text-2xl font-black text-emerald-950">₹${combo.offerPrice}</span>
              <span class="text-xs text-stone-400 line-through">₹${combo.originalPrice}</span>
            </div>
            <span class="text-[10px] text-emerald-700 font-semibold">Curated Pantry Kit</span>
          </div>

          <div>
            ${inCart === 0 ? `
              <button 
                onclick="addGroceryComboToCart('${combo.id}')" 
                class="btn-primary px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md"
              >
                <span>Add Kit</span>
                <span>+</span>
              </button>
            ` : `
              <div class="inline-flex items-center bg-emerald-800 text-white rounded-xl shadow-md overflow-hidden">
                <button onclick="updateCartItemQty('${combo.id}', -1)" class="w-8 h-8 flex items-center justify-center font-bold hover:bg-emerald-700">−</button>
                <span class="w-7 text-center text-xs font-bold">${inCart}</span>
                <button onclick="updateCartItemQty('${combo.id}', 1)" class="w-8 h-8 flex items-center justify-center font-bold hover:bg-emerald-700">+</button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.addGroceryComboToCart = function(comboId) {
  const combo = groceryCombosData.find(c => c.id === comboId);
  if (!combo) return;

  if (cart[combo.id]) {
    cart[combo.id].qty += 1;
  } else {
    cart[combo.id] = {
      productId: combo.id,
      name: combo.name,
      hindiName: combo.hindiName,
      weightLabel: `${combo.itemCount} Pantry Items Kit`,
      price: combo.offerPrice,
      originalPrice: combo.originalPrice,
      image: combo.image,
      qty: 1
    };
  }

  saveStoredState('sabjihub_cart', cart);
  updateCartUI();
  renderGroceryCombosSection();
  showToast(`Added ${combo.name} to basket! 🧺`, 'success');
};

window.setGroceryCategory = function(cat) {
  groceryFilterState.category = cat;

  document.querySelectorAll('.grocery-nav-cat-btn').forEach(btn => {
    const isCombo = btn.dataset.category === 'combos';
    const badge = btn.querySelector('span:last-child');
    if (btn.dataset.category === cat) {
      btn.className = `grocery-nav-cat-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isCombo ? 'bg-amber-600 text-white shadow-xs' : 'bg-emerald-700 text-white shadow-xs'} transition-all whitespace-nowrap active:scale-95 shrink-0`;
      if (badge) badge.className = 'text-[10px] px-1.5 py-0.2 rounded-full bg-white/25 font-mono';
    } else {
      btn.className = `grocery-nav-cat-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isCombo ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/60' : 'text-stone-700 bg-white/80 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200/60'} transition-all whitespace-nowrap active:scale-95 shrink-0`;
      if (badge) badge.className = `text-[10px] px-1.5 py-0.2 rounded-full ${isCombo ? 'bg-amber-200 text-amber-900' : 'bg-stone-100 text-stone-500'} font-mono`;
    }
  });

  if (cat === 'combos') {
    const comboSec = document.getElementById('grocery-combos-section');
    if (comboSec) comboSec.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  applyGroceryFiltersAndRender();
};

window.handleGroceryAvailabilityFilter = function(checkbox) {
  const isChecked = typeof checkbox === 'boolean' ? checkbox : checkbox.checked;
  groceryFilterState.onlyInStock = isChecked;
  document.querySelectorAll('.grocery-filter-stock-cb').forEach(cb => {
    cb.checked = isChecked;
  });
  applyGroceryFiltersAndRender();
};

window.handleGroceryOffersFilter = function(checkbox) {
  const isChecked = typeof checkbox === 'boolean' ? checkbox : checkbox.checked;
  groceryFilterState.onlyOffers = isChecked;
  document.querySelectorAll('.grocery-filter-offers-cb').forEach(cb => {
    cb.checked = isChecked;
  });
  applyGroceryFiltersAndRender();
};

function applyGroceryFiltersAndRender() {
  const container = document.getElementById('grocery-products-grid');
  if (!container) return;

  let filtered = [...allGroceryData];

  if (groceryFilterState.category !== 'all') {
    filtered = filtered.filter(v => v.categories.includes(groceryFilterState.category));
  }

  if (groceryFilterState.onlyInStock) {
    filtered = filtered.filter(v => v.inStock === true);
  }

  if (groceryFilterState.onlyOffers) {
    filtered = filtered.filter(v => {
      const w = v.weights[v.selectedWeightIndex];
      return Boolean(w.discount && w.discount.length > 0);
    });
  }

  if (groceryFilterState.searchQuery) {
    const q = groceryFilterState.searchQuery.toLowerCase();
    filtered = filtered.filter(v => 
      v.name.toLowerCase().includes(q) ||
      v.hindiName.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-3xl p-8 border border-emerald-900/5 shadow-soft">
        <span class="text-4xl mb-3 block">🌾</span>
        <h3 class="font-heading font-black text-xl text-emerald-950 mb-1">No Grocery Staples Found</h3>
        <p class="text-xs text-stone-500 max-w-sm mx-auto mb-6">
          Try selecting another category like Dals, Oils, Atta, or Ghee.
        </p>
        <button onclick="setGroceryCategory('all')" class="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold">
          View All Grocery Items
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(product => {
    const activeWeight = product.weights[product.selectedWeightIndex];
    const cartKey = `${product.id}-${product.selectedWeightIndex}`;
    const inCartQty = cart[cartKey] ? cart[cartKey].qty : 0;
    const isWishlisted = wishlist.includes(product.id);
    const detailLink = `product-details.html?id=${encodeURIComponent(product.id)}`;

    return `
      <div class="product-card group bg-white rounded-3xl p-3.5 sm:p-5 border border-emerald-900/5 shadow-soft shadow-card-hover flex flex-col justify-between relative transition-all duration-300">
        
        <div class="flex items-center justify-between gap-1.5 mb-2.5">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
            product.badgeType === 'bestseller' 
              ? 'bg-amber-100 text-amber-900 border border-amber-300/60' 
              : 'badge-fresh'
          }">
            <span class="w-1.5 h-1.5 rounded-full ${product.badgeType === 'bestseller' ? 'bg-amber-500' : 'bg-emerald-600'} animate-pulse"></span>
            ${product.badge}
          </span>

          <button 
            onclick="toggleWishlist('${product.id}', event)" 
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-stone-50 hover:bg-red-50 flex items-center justify-center transition-colors text-stone-400 hover:text-red-500 ${isWishlisted ? 'text-red-500 heart-pop' : ''}"
            title="Wishlist"
          >
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-400'}" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <a href="${detailLink}" class="relative w-full h-36 sm:h-48 rounded-2xl overflow-hidden bg-stone-50 mb-3 img-zoom-container flex items-center justify-center block">
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            loading="lazy" 
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute bottom-1.5 left-1.5 bg-black/45 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium text-white/90">
            🌱 ${product.origin.split(',')[0]}
          </div>

          ${activeWeight.discount ? `
            <div class="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[9px] sm:text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm">
              ${activeWeight.discount}
            </div>
          ` : ''}

          <div class="quick-actions-bar absolute inset-x-2 bottom-8 hidden sm:flex justify-center">
            <button 
              type="button" 
              onclick="event.preventDefault(); openQuickView('${product.id}')" 
              class="px-3 py-1.5 bg-white/95 hover:bg-white text-emerald-950 font-bold text-[11px] rounded-xl shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all"
            >
              <span>Quick View</span>
            </button>
          </div>
        </a>

        <div class="flex-1">
          <a href="${detailLink}">
            <h3 class="font-bold text-sm sm:text-base text-emerald-950 group-hover:text-emerald-700 transition-colors truncate">
              ${product.name}
            </h3>
          </a>
          
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] text-amber-800 font-semibold">${product.hindiName}</span>
            <div class="flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded">
              <span class="text-amber-500">★</span>
              <span>${product.rating}</span>
              <span class="text-stone-400 font-normal">(${product.reviewsCount})</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-1 mb-3">
            ${product.weights.map((w, idx) => `
              <button 
                type="button"
                onclick="selectGroceryWeight('${product.id}', ${idx})" 
                class="px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                  idx === product.selectedWeightIndex 
                    ? 'bg-emerald-800 text-white shadow-xs' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }"
              >
                ${w.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="pt-2 sm:pt-3 border-t border-stone-100 flex items-center justify-between gap-1 mt-auto">
          <div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-base sm:text-lg font-black text-emerald-950">₹${activeWeight.price}</span>
              ${activeWeight.originalPrice ? `
                <span class="text-[11px] sm:text-xs text-stone-400 line-through">₹${activeWeight.originalPrice}</span>
              ` : ''}
            </div>
            <span class="text-[9px] text-emerald-600 font-semibold block leading-none">per ${activeWeight.label}</span>
          </div>

          <div class="min-w-[75px] sm:min-w-[90px] flex justify-end">
            ${inCartQty === 0 ? `
              <button 
                onclick="addToCart('${product.id}', ${product.selectedWeightIndex})" 
                class="btn-primary flex items-center justify-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs shadow-sm shadow-emerald-700/20 active:scale-95"
              >
                <span>ADD</span>
                <span>+</span>
              </button>
            ` : `
              <div class="inline-flex items-center bg-emerald-800 text-white rounded-xl shadow-xs overflow-hidden border border-emerald-700">
                <button 
                  onclick="updateCartItemQty('${cartKey}', -1)" 
                  class="stepper-btn w-6 sm:w-7 h-7 sm:h-8 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 active:bg-emerald-900"
                >
                  −
                </button>
                <span class="w-6 sm:w-7 text-center text-xs font-black text-white select-none">
                  ${inCartQty}
                </span>
                <button 
                  onclick="updateCartItemQty('${cartKey}', 1)" 
                  class="stepper-btn w-6 sm:w-7 h-7 sm:h-8 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 active:bg-emerald-900"
                >
                  +
                </button>
              </div>
            `}
          </div>
        </div>

      </div>
    `;
  }).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
  if (typeof init3DCardTilt === 'function') {
    init3DCardTilt();
  }
}

// -------------------------------------------------------------
// SHOP TODAY'S OFFERS PAGE LOGIC (for offers.html)
// -------------------------------------------------------------
let offersFilterState = {
  category: 'all',
  onlyInStock: false,
  onlyMaxDiscount: false,
  searchQuery: ''
};

function getOffersCatalog() {
  const offerVegIds = ['tomato', 'potato', 'onion', 'spinach', 'broccoli', 'capsicum', 'cauliflower', 'ladyfinger', 'coriander', 'greenchilli', 'ginger', 'carrot'];
  const offerFruitIds = ['mango', 'apple', 'orange', 'banana', 'strawberry', 'pomegranate', 'watermelon', 'guava', 'kiwi', 'papaya'];
  const offerGroceryIds = ['organic_toor_dal', 'sharbati_atta', 'mustard_oil', 'raw_honey', 'haldi_powder', 'chana_dal', 'w320_cashews', 'desi_cow_ghee'];

  const vegs = allVegetablesData.filter(v => offerVegIds.includes(v.id)).map(v => ({ ...v, catalogType: 'vegetables' }));
  const fruits = allFruitsData.filter(f => offerFruitIds.includes(f.id)).map(f => ({ ...f, catalogType: 'fruits' }));
  const groceries = allGroceryData.filter(g => offerGroceryIds.includes(g.id)).map(g => ({ ...g, catalogType: 'grocery' }));

  return [...vegs, ...fruits, ...groceries];
}

function initOffersPage() {
  initOffersCountdownTimer();
  updateStorefrontSubnavs();
  renderOffersCombos();
  applyOffersFiltersAndRender();
}

function initOffersCountdownTimer() {
  const timerEl = document.getElementById('offers-countdown-timer');
  if (!timerEl) return;

  function updateTimer() {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const diff = endOfDay - now;
    if (diff <= 0) {
      timerEl.textContent = '00h : 00m : 00s';
      return;
    }
    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
    const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
    timerEl.textContent = `${hours}h : ${minutes}m : ${seconds}s`;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

function updateOffersCategoryCounts() {
  const allItems = (typeof getOffersCatalog === 'function' ? getOffersCatalog() : []).filter(i => !isProductSuspended(i.id));
  const countAll = allItems.length;
  const countVeg = allItems.filter(i => i.catalogType === 'vegetables').length;
  const countFruit = allItems.filter(i => i.catalogType === 'fruits').length;
  const countGrocery = allItems.filter(i => i.catalogType === 'grocery').length;
  const countUnder49 = allItems.filter(i => {
    const w = i.weights && i.weights[i.selectedWeightIndex || 0];
    return w && w.price <= 49;
  }).length;
  const countUnder99 = allItems.filter(i => {
    const w = i.weights && i.weights[i.selectedWeightIndex || 0];
    return w && w.price <= 99;
  }).length;
  const combosCount = typeof combosData !== 'undefined' ? combosData.filter(v => !isProductSuspended(v.id)).length : 4;

  if (document.getElementById('offers-count-all')) document.getElementById('offers-count-all').textContent = countAll;
  if (document.getElementById('offers-count-vegetables')) document.getElementById('offers-count-vegetables').textContent = countVeg;
  if (document.getElementById('offers-count-fruits')) document.getElementById('offers-count-fruits').textContent = countFruit;
  if (document.getElementById('offers-count-grocery')) document.getElementById('offers-count-grocery').textContent = countGrocery;
  if (document.getElementById('offers-count-under49')) document.getElementById('offers-count-under49').textContent = countUnder49;
  if (document.getElementById('offers-count-under99')) document.getElementById('offers-count-under99').textContent = countUnder99;
  if (document.getElementById('offers-count-combos')) document.getElementById('offers-count-combos').textContent = combosCount;
}

window.setOffersFilterCategory = function(cat) {
  offersFilterState.category = cat;

  document.querySelectorAll('.offers-nav-cat-btn').forEach(btn => {
    const isCombo = btn.dataset.category === 'combos';
    if (btn.dataset.category === cat) {
      btn.className = `offers-nav-cat-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isCombo ? 'bg-amber-600 text-white shadow-xs' : 'bg-emerald-700 text-white shadow-xs'} transition-all whitespace-nowrap active:scale-95 shrink-0`;
    } else {
      btn.className = `offers-nav-cat-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isCombo ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/60' : 'text-stone-700 bg-white/80 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200/60'} transition-all whitespace-nowrap active:scale-95 shrink-0`;
    }
  });

  applyOffersFiltersAndRender();
};

window.handleOffersAvailabilityFilter = function(checkbox) {
  offersFilterState.onlyInStock = checkbox.checked;
  applyOffersFiltersAndRender();
};

window.handleOffersMaxDiscountFilter = function(checkbox) {
  offersFilterState.onlyMaxDiscount = checkbox.checked;
  applyOffersFiltersAndRender();
};

window.selectOffersWeight = function(productId, weightIndex) {
  const prod = findAnyProduct(productId);
  if (prod) {
    prod.selectedWeightIndex = weightIndex;
    applyOffersFiltersAndRender();
  }
};

function renderOffersCombos() {
  const container = document.getElementById('offers-combos-grid');
  if (!container) return;

  const selectedCombos = [
    combosData[0], // Daily Essentials Basket
    combosData[1], // Family Vegetable Basket
    fruitCombosData[0], // Morning Vitality Fruit Basket
    groceryCombosData[0] // Monthly Essential Family Kitchen Kit
  ];

  container.innerHTML = selectedCombos.map(combo => {
    const isCarted = cart[combo.id] && cart[combo.id].qty > 0;
    const qty = isCarted ? cart[combo.id].qty : 0;

    return `
      <div class="group bg-white rounded-3xl p-4 sm:p-5 border border-amber-900/10 shadow-soft hover:shadow-card-hover flex flex-col justify-between relative transition-all duration-300">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              <span>🔥</span>
              <span>${combo.badge || 'MEGA COMBO'}</span>
            </span>
            <span class="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              ${combo.itemCount} Varieties
            </span>
          </div>

          <div class="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-stone-50 mb-3 img-zoom-container flex items-center justify-center block">
            <img 
              src="${combo.image}" 
              alt="${combo.name}" 
              loading="lazy"
              class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-[10px] font-bold text-amber-300 px-2.5 py-0.5 rounded-lg">
              ${combo.savings}
            </div>
          </div>

          <h3 class="font-heading font-black text-sm sm:text-base text-emerald-950 mb-0.5 group-hover:text-amber-800 transition-colors">
            ${combo.name}
          </h3>
          <p class="text-[11px] text-stone-500 font-semibold mb-2 line-clamp-1">${combo.hindiName}</p>
          <p class="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3">${combo.itemsList}</p>
        </div>

        <div class="pt-3 border-t border-stone-100">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div>
              <span class="text-[10px] text-stone-400 block line-through">MRP ₹${combo.originalPrice}</span>
              <div class="flex items-baseline gap-1.5">
                <span class="text-base sm:text-lg font-black text-emerald-950">₹${combo.offerPrice}</span>
                <span class="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">${combo.savings}</span>
              </div>
            </div>
          </div>

          ${isCarted ? `
            <div class="flex items-center justify-between bg-emerald-50 rounded-2xl p-1 border border-emerald-200">
              <button 
                onclick="updateCartItemQty('${combo.id}', -1)"
                class="w-8 h-8 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 font-black flex items-center justify-center shadow-2xs active:scale-95 transition-all text-base"
              >
                -
              </button>
              <span class="font-mono font-bold text-xs text-emerald-950 px-2">${qty} in basket</span>
              <button 
                onclick="updateCartItemQty('${combo.id}', 1)"
                class="w-8 h-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center justify-center shadow-2xs active:scale-95 transition-all text-base"
              >
                +
              </button>
            </div>
          ` : `
            <button 
              onclick="addComboToCart('${combo.id}')"
              class="w-full btn-primary py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
            >
              <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
              <span>Add Bundle to Basket</span>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function applyOffersFiltersAndRender() {
  const container = document.getElementById('offers-products-grid');
  if (!container) return;

  let filtered = getOffersCatalog();

  if (offersFilterState.category === 'vegetables') {
    filtered = filtered.filter(p => p.catalogType === 'vegetables');
  } else if (offersFilterState.category === 'fruits') {
    filtered = filtered.filter(p => p.catalogType === 'fruits');
  } else if (offersFilterState.category === 'grocery') {
    filtered = filtered.filter(p => p.catalogType === 'grocery');
  } else if (offersFilterState.category === 'under49') {
    filtered = filtered.filter(p => {
      const w = p.weights[p.selectedWeightIndex];
      return w && w.price <= 49;
    });
  } else if (offersFilterState.category === 'under99') {
    filtered = filtered.filter(p => {
      const w = p.weights[p.selectedWeightIndex];
      return w && w.price <= 99;
    });
  } else if (offersFilterState.category === 'combos') {
    const comboSec = document.getElementById('offers-combos-section');
    if (comboSec) comboSec.scrollIntoView({ behavior: 'smooth' });
  }

  if (offersFilterState.onlyInStock) {
    filtered = filtered.filter(p => p.inStock === true);
  }

  if (offersFilterState.onlyMaxDiscount) {
    filtered = filtered.filter(p => {
      const w = p.weights[p.selectedWeightIndex];
      if (!w || !w.originalPrice) return false;
      const discountPct = Math.round(((w.originalPrice - w.price) / w.originalPrice) * 100);
      return discountPct >= 30;
    });
  }

  if (offersFilterState.searchQuery) {
    const q = offersFilterState.searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.hindiName.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-3xl p-8 border border-amber-900/10 shadow-soft">
        <span class="text-4xl mb-3 block">🏷️</span>
        <h3 class="font-heading font-black text-xl text-emerald-950 mb-1">No Offers Found</h3>
        <p class="text-xs text-stone-500 max-w-sm mx-auto mb-6">
          Try resetting your filters or selecting a different deal category.
        </p>
        <button onclick="setOffersFilterCategory('all')" class="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold">
          View All Today's Offers
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(product => {
    const activeWeight = product.weights[product.selectedWeightIndex];
    const cartKey = `${product.id}-${product.selectedWeightIndex}`;
    const inCartQty = cart[cartKey] ? cart[cartKey].qty : 0;
    const isWishlisted = wishlist.includes(product.id);
    const savingsAmount = activeWeight.originalPrice ? (activeWeight.originalPrice - activeWeight.price) : 0;
    const discountPct = activeWeight.originalPrice ? Math.round((savingsAmount / activeWeight.originalPrice) * 100) : 20;

    const detailLink = `product-details.html?id=${encodeURIComponent(product.id)}`;

    return `
      <div class="product-card group bg-white rounded-3xl p-3.5 sm:p-5 border border-amber-900/10 shadow-soft hover:shadow-card-hover flex flex-col justify-between relative transition-all duration-300">
        <div>
          <!-- Top Badge & Wishlist -->
          <div class="flex items-center justify-between gap-1.5 mb-2.5">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs">
              <span>🔥</span>
              <span>${discountPct}% OFF</span>
            </span>

            <button 
              onclick="toggleWishlist('${product.id}', event)" 
              class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-stone-50 hover:bg-red-50 flex items-center justify-center transition-colors text-stone-400 hover:text-red-500 ${isWishlisted ? 'text-red-500' : ''}"
              title="Wishlist"
            >
              <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-400'}" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          <!-- Product Image -->
          <a href="${detailLink}" class="relative w-full h-36 sm:h-48 rounded-2xl overflow-hidden bg-stone-50 mb-3 img-zoom-container flex items-center justify-center block">
            <img 
              src="${product.image}" 
              alt="${product.name}" 
              loading="lazy"
              class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded-md">
              Save ₹${savingsAmount}
            </div>
          </a>

          <!-- Rating & Origin -->
          <div class="flex items-center justify-between gap-1 text-[10px] sm:text-xs text-stone-500 mb-1">
            <div class="flex items-center gap-1 font-semibold text-emerald-950">
              <span class="text-amber-500">★</span>
              <span>${product.rating}</span>
              <span class="text-stone-400">(${product.reviewsCount})</span>
            </div>
            <span class="truncate max-w-[110px] text-stone-400">${product.origin ? product.origin.split(',')[0] : 'Farm Direct'}</span>
          </div>

          <!-- Title & Hindi Subtitle -->
          <a href="${detailLink}" class="block group-hover:text-amber-800 transition-colors">
            <h3 class="font-heading font-bold text-sm sm:text-base text-emerald-950 line-clamp-1">
              ${product.name}
            </h3>
            <p class="text-[10px] sm:text-xs text-stone-500 font-medium line-clamp-1 mb-2">
              ${product.hindiName}
            </p>
          </a>

          <!-- Weight Selector Chips -->
          <div class="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 mb-3">
            ${product.weights.map((w, idx) => `
              <button 
                type="button"
                onclick="selectOffersWeight('${product.id}', ${idx})" 
                class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                  idx === product.selectedWeightIndex 
                    ? 'bg-amber-600 text-white shadow-2xs' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
                }"
              >
                ${w.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Price & Add to Cart -->
        <div class="pt-2 sm:pt-2.5 border-t border-stone-100">
          <div class="flex items-baseline gap-1.5 mb-2.5">
            <span class="text-base sm:text-lg font-black text-emerald-950">
              ₹${activeWeight.price}
            </span>
            ${activeWeight.originalPrice ? `
              <span class="text-xs text-stone-400 line-through">
                ₹${activeWeight.originalPrice}
              </span>
              <span class="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                ${activeWeight.discount || `${discountPct}% OFF`}
              </span>
            ` : ''}
          </div>

          ${inCartQty > 0 ? `
            <div class="flex items-center justify-between bg-emerald-50 rounded-2xl p-1 border border-emerald-200">
              <button 
                onclick="updateCartItemQty('${cartKey}', -1)"
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center shadow-2xs active:scale-95 transition-all text-base"
              >
                -
              </button>
              <span class="font-mono font-bold text-xs text-emerald-950 px-2">${inCartQty}</span>
              <button 
                onclick="updateCartItemQty('${cartKey}', 1)"
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center shadow-2xs active:scale-95 transition-all text-base"
              >
                +
              </button>
            </div>
          ` : `
            <button 
              onclick="addToCart('${product.id}', ${product.selectedWeightIndex})" 
              class="w-full btn-primary py-2 sm:py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
            >
              <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
              <span>Add to Basket</span>
            </button>
          `}
        </div>

      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// -------------------------------------------------------------
// WISHLIST LOGIC
// -------------------------------------------------------------
window.toggleWishlist = function(productId, event) {
  if (event) event.stopPropagation();

  const prod = findAnyProduct(productId);
  if (!prod) return;

  const idx = wishlist.indexOf(productId);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast(`Removed ${prod.name} from Wishlist`, 'info');
  } else {
    wishlist.push(productId);
    showToast(`❤️ Added ${prod.name} to your Wishlist!`, 'success');
  }

  saveStoredState('sabjihub_wishlist', wishlist);
  updateWishlistBadges();

  if (document.getElementById('veg-products-grid')) {
    applyFiltersAndRender();
  } else if (document.getElementById('fruit-products-grid')) {
    applyFruitFiltersAndRender();
  } else if (document.getElementById('grocery-products-grid')) {
    applyGroceryFiltersAndRender();
  } else if (document.getElementById('offers-products-grid')) {
    applyOffersFiltersAndRender();
  } else if (document.getElementById('products-grid')) {
    renderHomeProductGrid();
    if (document.getElementById('todays-deals-grid')) renderTodaysDeals();
  } else if (document.getElementById('product-details-page')) {
    renderRelatedProducts();
  }
};

// -------------------------------------------------------------
// QUICK VIEW MODAL LOGIC
// -------------------------------------------------------------
let quickViewActiveProduct = null;
let quickViewQty = 1;

window.openQuickView = function(productId) {
  const prod = findAnyProduct(productId);
  if (!prod) return;

  quickViewActiveProduct = prod;
  quickViewQty = 1;

  const modal = document.getElementById('quick-view-modal');
  const content = document.getElementById('quick-view-content');
  if (!modal || !content) return;

  renderQuickViewModalContent();
  modal.classList.add('open');
  document.body.classList.add('overflow-hidden');
};

function renderQuickViewModalContent() {
  const prod = quickViewActiveProduct;
  const content = document.getElementById('quick-view-content');
  if (!prod || !content) return;

  const activeWeight = prod.weights[prod.selectedWeightIndex];
  const isWishlisted = wishlist.includes(prod.id);

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <div class="relative rounded-3xl overflow-hidden bg-stone-50 aspect-square">
        <img src="${prod.image}" alt="${prod.name}" class="w-full h-full object-cover" />
        <div class="absolute top-3 left-3 bg-emerald-900/80 text-white px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md">
          🌱 ${prod.origin}
        </div>
        ${activeWeight.discount ? `
          <div class="absolute top-3 right-3 bg-amber-500 text-emerald-950 font-black text-xs px-3 py-1 rounded-full shadow-md">
            ${activeWeight.discount}
          </div>
        ` : ''}
      </div>

      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="badge-fresh px-3 py-1 rounded-full text-xs font-bold">100% Quality Inspected</span>
          <button onclick="toggleWishlist('${prod.id}')" class="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 hover:text-red-500">
            <svg class="w-5 h-5 ${isWishlisted ? 'text-red-500 fill-red-500' : ''}" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <h2 class="font-heading font-black text-2xl text-emerald-950">${prod.name}</h2>
        <p class="text-sm text-emerald-700 font-semibold mb-3">${prod.hindiName}</p>

        <div class="flex items-center gap-3 mb-4">
          <div class="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900">
            <span class="text-amber-500">★</span>
            <span>${prod.rating}</span>
            <span class="text-stone-400 font-normal">(${prod.reviewsCount} reviews)</span>
          </div>
          <span class="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> In Stock Today
          </span>
        </div>

        <p class="text-xs text-stone-600 leading-relaxed mb-5">
          ${prod.description}
        </p>

        <div class="mb-5">
          <label class="block text-xs font-bold uppercase tracking-wider text-emerald-900/70 mb-2">Available Weights</label>
          <div class="flex flex-wrap gap-2">
            ${prod.weights.map((w, idx) => `
              <button 
                onclick="setQuickViewWeight(${idx})" 
                class="weight-chip px-3 py-1.5 rounded-xl text-xs font-bold ${
                  idx === prod.selectedWeightIndex ? 'active' : 'bg-stone-50 text-stone-700'
                }"
              >
                ${w.label} (₹${w.price})
              </button>
            `).join('')}
          </div>
        </div>

        <div class="flex items-baseline gap-2 mb-6">
          <span class="text-3xl font-black text-emerald-950">₹${activeWeight.price * quickViewQty}</span>
          <span class="text-sm text-stone-400 line-through">₹${activeWeight.originalPrice * quickViewQty}</span>
          <span class="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
            Save ₹${(activeWeight.originalPrice - activeWeight.price) * quickViewQty}
          </span>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="flex items-center bg-stone-100 rounded-2xl border border-stone-200 p-1">
            <button onclick="changeQuickViewQty(-1)" class="w-10 h-10 flex items-center justify-center font-bold text-stone-700 hover:bg-white rounded-xl transition-colors">−</button>
            <span class="w-10 text-center font-black text-sm text-emerald-950">${quickViewQty}</span>
            <button onclick="changeQuickViewQty(1)" class="w-10 h-10 flex items-center justify-center font-bold text-stone-700 hover:bg-white rounded-xl transition-colors">+</button>
          </div>

          <button 
            onclick="addQuickViewToCart()" 
            class="flex-1 btn-primary py-3 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md"
          >
            <span>Add to Basket</span>
          </button>

          <button 
            onclick="addQuickViewToCart(); closeQuickViewModal(); openCartDrawer();" 
            class="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-emerald-950 font-black text-sm shadow-md transition-colors"
          >
            Buy Now
          </button>
        </div>

      </div>
    </div>
  `;
}

window.setQuickViewWeight = function(idx) {
  if (quickViewActiveProduct) {
    quickViewActiveProduct.selectedWeightIndex = idx;
    renderQuickViewModalContent();
  }
};

window.changeQuickViewQty = function(delta) {
  quickViewQty = Math.max(1, quickViewQty + delta);
  renderQuickViewModalContent();
};

window.addQuickViewToCart = function() {
  if (!quickViewActiveProduct) return;
  const prod = quickViewActiveProduct;
  const weight = prod.weights[prod.selectedWeightIndex];
  const cartKey = `${prod.id}-${prod.selectedWeightIndex}`;

  if (cart[cartKey]) {
    cart[cartKey].qty += quickViewQty;
  } else {
    cart[cartKey] = {
      productId: prod.id,
      name: prod.name,
      hindiName: prod.hindiName,
      weightIndex: prod.selectedWeightIndex,
      weightLabel: weight.label,
      price: weight.price,
      originalPrice: weight.originalPrice,
      image: prod.image,
      qty: quickViewQty
    };
  }

  saveStoredState('sabjihub_cart', cart);
  updateCartUI();
  if (document.getElementById('veg-products-grid')) applyFiltersAndRender();
  if (document.getElementById('products-grid')) renderHomeProductGrid();
  showToast(`Added ${quickViewQty} × ${prod.name} (${weight.label}) to basket! 🥬`, 'success');
  closeQuickViewModal();
};

window.closeQuickViewModal = function() {
  const modal = document.getElementById('quick-view-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
  }
};

// -------------------------------------------------------------
// MOBILE FILTER SHEET CONTROLS
// -------------------------------------------------------------
window.openFilterSheet = function() {
  const backdrop = document.getElementById('filter-sheet-backdrop');
  const sheet = document.getElementById('filter-sheet-content');
  if (backdrop && sheet) {
    backdrop.classList.add('open');
    sheet.classList.add('open');
    document.body.classList.add('overflow-hidden');
  }
};

window.closeFilterSheet = function() {
  const backdrop = document.getElementById('filter-sheet-backdrop');
  const sheet = document.getElementById('filter-sheet-content');
  if (backdrop && sheet) {
    backdrop.classList.remove('open');
    sheet.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
  }
};

// -------------------------------------------------------------
// CART SYSTEM (SHARED ACROSS ALL PAGES)
// -------------------------------------------------------------
window.addToCart = function(productId, weightIndex) {
  const prod = findAnyProduct(productId);
  if (!prod) return;

  const weight = prod.weights[weightIndex];
  const cartKey = `${prod.id}-${weightIndex}`;

  if (cart[cartKey]) {
    cart[cartKey].qty += 1;
  } else {
    cart[cartKey] = {
      productId: prod.id,
      name: prod.name,
      hindiName: prod.hindiName,
      weightIndex: weightIndex,
      weightLabel: weight.label,
      price: weight.price,
      originalPrice: weight.originalPrice,
      image: prod.image,
      qty: 1
    };
  }

  saveStoredState('sabjihub_cart', cart);
  updateCartUI();

  if (document.getElementById('veg-products-grid')) {
    applyFiltersAndRender();
  } else if (document.getElementById('fruit-products-grid')) {
    applyFruitFiltersAndRender();
  } else if (document.getElementById('grocery-products-grid')) {
    applyGroceryFiltersAndRender();
  } else if (document.getElementById('offers-products-grid')) {
    applyOffersFiltersAndRender();
  } else if (document.getElementById('products-grid')) {
    renderHomeProductGrid();
    if (document.getElementById('todays-deals-grid')) renderTodaysDeals();
  } else if (document.getElementById('product-details-page')) {
    renderRelatedProducts();
  }

  showToast(`Added ${prod.name} (${weight.label}) to basket! 🧺`, 'success');
};

window.updateCartItemQty = function(cartKey, delta) {
  if (!cart[cartKey]) return;

  cart[cartKey].qty += delta;
  if (cart[cartKey].qty <= 0) {
    delete cart[cartKey];
    showToast('Item removed from basket', 'info');
  }

  saveStoredState('sabjihub_cart', cart);
  updateCartUI();

  if (document.getElementById('veg-products-grid')) {
    applyFiltersAndRender();
    renderCombosSection();
  } else if (document.getElementById('fruit-products-grid')) {
    applyFruitFiltersAndRender();
    renderFruitCombosSection();
  } else if (document.getElementById('grocery-products-grid')) {
    applyGroceryFiltersAndRender();
    renderGroceryCombosSection();
  } else if (document.getElementById('offers-products-grid')) {
    applyOffersFiltersAndRender();
    renderOffersCombos();
  } else if (document.getElementById('products-grid')) {
    renderHomeProductGrid();
    if (document.getElementById('todays-deals-grid')) renderTodaysDeals();
  } else if (document.getElementById('product-details-page')) {
    renderRelatedProducts();
  }
};

function updateCartUI() {
  const cartKeys = Object.keys(cart);
  let totalCount = 0;
  let subtotal = 0;
  let originalSubtotal = 0;

  cartKeys.forEach(k => {
    const item = cart[k];
    totalCount += item.qty;
    subtotal += item.price * item.qty;
    originalSubtotal += item.originalPrice * item.qty;
  });

  let discount = appliedCoupon ? 100 : 0;
  if (discount > subtotal) discount = subtotal;

  const freeDeliveryThreshold = 199;
  const deliveryFee = (subtotal >= freeDeliveryThreshold || totalCount === 0) ? 0 : 30;
  const grandTotal = Math.max(0, subtotal - discount + deliveryFee);
  const totalSavings = (originalSubtotal - subtotal) + discount;

  // Header badges & Bottom bar badges
  const badgeEls = document.querySelectorAll('.cart-count-badge');
  badgeEls.forEach(el => {
    el.textContent = totalCount;
    if (totalCount > 0) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  const cartTotalEls = document.querySelectorAll('.cart-header-total');
  cartTotalEls.forEach(el => {
    el.textContent = `₹${subtotal}`;
  });

  const cartStatusEls = document.querySelectorAll('.header-cart-status');
  cartStatusEls.forEach(el => {
    if (totalCount === 0) {
      el.textContent = '₹0';
    } else {
      el.textContent = `${totalCount} item${totalCount > 1 ? 's' : ''} · ₹${subtotal}`;
    }
  });

  // Basket CTA bounce animation
  const cartCtaBtns = document.querySelectorAll('.cart-cta-button');
  cartCtaBtns.forEach(btn => {
    btn.classList.remove('basket-bounce');
    void btn.offsetWidth;
    btn.classList.add('basket-bounce');
  });

  // Render Drawer Items
  const drawerList = document.getElementById('cart-items-list');
  const emptyState = document.getElementById('cart-empty-state');
  const drawerFooter = document.getElementById('cart-drawer-footer');

  if (totalCount === 0) {
    if (drawerList) drawerList.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (drawerFooter) drawerFooter.classList.add('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    if (drawerFooter) drawerFooter.classList.remove('hidden');

    if (drawerList) {
      drawerList.innerHTML = cartKeys.map(k => {
        const item = cart[k];
        return `
          <div class="flex items-center gap-3 p-3 bg-stone-50/80 rounded-2xl border border-emerald-900/5">
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover bg-white shadow-xs" />
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-sm text-emerald-950 truncate">${item.name}</h4>
              <p class="text-[11px] text-emerald-700/80 font-medium">${item.weightLabel}</p>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span class="text-sm font-black text-emerald-950">₹${item.price * item.qty}</span>
                <span class="text-xs text-stone-400 line-through">₹${item.originalPrice * item.qty}</span>
              </div>
            </div>
            <div class="flex items-center bg-white rounded-xl shadow-xs border border-emerald-950/10">
              <button onclick="updateCartItemQty('${k}', -1)" class="w-7 h-7 flex items-center justify-center font-bold text-stone-600 hover:bg-emerald-50 rounded-l-xl">−</button>
              <span class="w-6 text-center text-xs font-bold text-emerald-950">${item.qty}</span>
              <button onclick="updateCartItemQty('${k}', 1)" class="w-7 h-7 flex items-center justify-center font-bold text-stone-600 hover:bg-emerald-50 rounded-r-xl">+</button>
            </div>
          </div>
        `;
      }).join('');
    }

    const progressEl = document.getElementById('delivery-progress-bar');
    const msgEl = document.getElementById('delivery-progress-msg');
    if (progressEl && msgEl) {
      if (subtotal >= freeDeliveryThreshold) {
        progressEl.style.width = '100%';
        msgEl.innerHTML = '🎉 You unlocked <span class="text-emerald-700 font-bold">FREE Instant Delivery</span>!';
      } else {
        const diff = freeDeliveryThreshold - subtotal;
        const pct = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
        progressEl.style.width = `${pct}%`;
        msgEl.innerHTML = `Add <span class="font-bold text-emerald-700">₹${diff}</span> more for <span class="font-bold">FREE Delivery</span>`;
      }
    }

    const subtotalEl = document.getElementById('cart-subtotal-val');
    const deliveryFeeEl = document.getElementById('cart-delivery-val');
    const grandTotalEl = document.getElementById('cart-grand-total-val');
    const savingsEl = document.getElementById('cart-savings-val');
    const discountRow = document.getElementById('cart-discount-row');
    const discountVal = document.getElementById('cart-discount-val');

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (deliveryFeeEl) deliveryFeeEl.textContent = deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`;
    if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal}`;
    if (savingsEl) savingsEl.textContent = `₹${totalSavings}`;

    if (appliedCoupon && discountRow && discountVal) {
      discountRow.classList.remove('hidden');
      discountVal.textContent = `- ₹${discount}`;
    } else if (discountRow) {
      discountRow.classList.add('hidden');
    }
  }
}

// Drawer Controls
window.openCartDrawer = function() {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  const drawer = document.getElementById('cart-drawer-content');
  if (backdrop && drawer) {
    backdrop.classList.add('open');
    drawer.classList.add('open');
    document.body.classList.add('overflow-hidden');
  }
};

window.closeCartDrawer = function() {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  const drawer = document.getElementById('cart-drawer-content');
  if (backdrop && drawer) {
    backdrop.classList.remove('open');
    drawer.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
  }
};

// Coupon Handling
window.applyCouponCode = function(code) {
  if (!code) {
    const input = document.getElementById('cart-coupon-input');
    code = input ? input.value.trim().toUpperCase() : '';
  }

  if (code === 'FIRST100') {
    appliedCoupon = 'FIRST100';
    saveStoredState('sabjihub_coupon', appliedCoupon);
    updateCartUI();
    showToast('🎉 ₹100 discount applied to your basket!', 'success');
  } else {
    showToast('Invalid coupon code. Try FIRST100 for ₹100 OFF', 'warning');
  }
};

window.copyPromoCode = function(code) {
  navigator.clipboard.writeText(code).then(() => {
    appliedCoupon = code;
    saveStoredState('sabjihub_coupon', appliedCoupon);
    updateCartUI();
    showToast(`Code "${code}" copied and auto-applied! ₹100 OFF`, 'success');
  }).catch(() => {
    appliedCoupon = code;
    saveStoredState('sabjihub_coupon', appliedCoupon);
    updateCartUI();
    showToast(`Coupon ${code} applied! ₹100 OFF`, 'success');
  });
};

// ============================================================================
// BLINKIT-STYLE LIVE LOCATION CAPTURE & DARK STORE MAPPING ENGINE
// ============================================================================

const SABJIHUB_DARK_STORES = [
  { 
    id: 'hub-indiranagar', 
    name: 'Indiranagar Central Dark Store', 
    lat: 12.9716, 
    lon: 77.6412, 
    pincodes: ['560038', '560008', '560075', '560001', '560025', '560017'], 
    locality: 'Indiranagar, Bengaluru', 
    minETA: '10 mins' 
  },
  { 
    id: 'hub-koramangala', 
    name: 'Koramangala South Express Hub', 
    lat: 12.9352, 
    lon: 77.6245, 
    pincodes: ['560034', '560095', '560047', '560030', '560029', '560068'], 
    locality: 'Koramangala, Bengaluru', 
    minETA: '12 mins' 
  },
  { 
    id: 'hub-hsr', 
    name: 'HSR Layout Fast Hub (Sector 4)', 
    lat: 12.9121, 
    lon: 77.6446, 
    pincodes: ['560102', '560068', '560100', '560037'], 
    locality: 'HSR Layout, Bengaluru', 
    minETA: '12 mins' 
  },
  { 
    id: 'hub-whitefield', 
    name: 'Whitefield Tech Park Dark Store', 
    lat: 12.9698, 
    lon: 77.7500, 
    pincodes: ['560066', '560048', '560037', '560087'], 
    locality: 'Whitefield, Bengaluru', 
    minETA: '15 mins' 
  },
  { 
    id: 'hub-mumbai', 
    name: 'Bandra West Linking Road Hub', 
    lat: 19.0596, 
    lon: 72.8295, 
    pincodes: ['400050', '400051', '400052'], 
    locality: 'Bandra West, Mumbai', 
    minETA: '15 mins' 
  },
  { 
    id: 'hub-gurugram', 
    name: 'DLF Phase 5 Cyber Hub Store', 
    lat: 28.4595, 
    lon: 77.0266, 
    pincodes: ['122002', '122001', '122003'], 
    locality: 'DLF Phase 5, Gurugram', 
    minETA: '15 mins' 
  }
];

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Location Modal & UI (Synced with window.sabjihubLocation)
function updateHeaderLocationUI() {
  const loc = (window.sabjihubLocation && window.sabjihubLocation.locationService) 
    ? window.sabjihubLocation.locationService.getLocation() 
    : null;
  const subline = (loc && loc.shortAddress) || currentCity || 'Garhi, Noida';
  const etaText = (loc && window.sabjihubLocation.calculateDeliveryTime(loc)) || currentDeliveryETA || '20 mins';
  const headline = `Delivery in ${etaText}`;
  const cityName = subline.split(',')[0].trim();

  // Desktop header displays
  document.querySelectorAll('.header-delivery-headline').forEach(el => {
    el.textContent = headline;
  });
  document.querySelectorAll('.header-location-subline').forEach(el => {
    el.textContent = subline;
  });
  document.querySelectorAll('.header-location-city').forEach(el => {
    el.textContent = cityName;
  });

  // Mobile header displays
  document.querySelectorAll('.header-delivery-headline-mobile').forEach(el => {
    el.textContent = `⚡ ${etaText}`;
  });
  document.querySelectorAll('.header-location-subline-mobile').forEach(el => {
    el.textContent = subline;
  });

  // Legacy header location display if exists
  const headerLoc = document.getElementById('header-location-display');
  if (headerLoc) {
    headerLoc.innerHTML = `
      <span class="font-bold text-emerald-950 block leading-tight truncate">${subline}</span>
      <span class="text-[10px] text-emerald-600 font-medium">⚡ ${headline} ▾</span>
    `;
  }

  // Active location in modal
  const modalCurrentLoc = document.getElementById('modal-current-location-text');
  if (modalCurrentLoc) {
    modalCurrentLoc.textContent = subline;
  }
  const modalCurrentEta = document.getElementById('modal-current-location-eta');
  if (modalCurrentEta) {
    modalCurrentEta.textContent = `⚡ ${etaText}`;
  }
}

window.openLocationModal = function() {
  if (window.sabjihubLocation && typeof window.sabjihubLocation.openModal === 'function') {
    window.sabjihubLocation.openModal();
    return;
  }
  const modal = document.getElementById('location-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.classList.add('overflow-hidden');
    updateHeaderLocationUI();
  }
};

window.closeLocationModal = function() {
  const modal = document.getElementById('location-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
  }
};

window.selectLocation = function(city, pin, eta = '12 mins', fullAddress = '', isGps = false) {
  currentCity = city;
  currentPincode = pin;
  currentDeliveryETA = eta;
  isGPSLiveLocation = isGps;

  saveStoredState('sabjihub_city', currentCity);
  saveStoredState('sabjihub_pincode', currentPincode);
  saveStoredState('sabjihub_eta', currentDeliveryETA);
  saveStoredState('sabjihub_is_gps', isGPSLiveLocation);

  updateHeaderLocationUI();

  showToast(
    isGps 
      ? `📍 GPS Location captured: ${city} (⚡ Delivery in ${eta})` 
      : `Delivery location set to ${city} (⚡ Delivery in ${eta})`, 
    'success'
  );
};

// Live GPS detection like Blinkit
window.detectLiveGPSLocation = function() {
  const btn = document.getElementById('detect-gps-btn');
  const banner = document.getElementById('gps-status-banner');

  if (!navigator.geolocation) {
    if (banner) {
      banner.className = 'p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5';
      banner.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 text-rose-600 shrink-0"></i><span>Geolocation is not supported in this browser. Please select an area below.</span>';
      if (window.lucide) window.lucide.createIcons();
    }
    showToast('Geolocation is not supported by your browser', 'warning');
    return;
  }

  // Active Radar Scanning State
  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-90');
    btn.innerHTML = `
      <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-600 text-white shadow-xs shrink-0">
        <span class="absolute inset-0 rounded-2xl bg-emerald-400 animate-ping opacity-75"></span>
        <i data-lucide="loader-2" class="w-5 h-5 animate-spin relative z-10"></i>
      </div>
      <div class="text-left flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="font-black text-xs sm:text-sm text-emerald-950 block">Detecting your location...</span>
          <span class="px-1.5 py-0.2 rounded-md bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">Scanning</span>
        </div>
        <span class="text-[11px] text-emerald-700 font-medium block truncate">Acquiring GPS coordinates & dark store hub...</span>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  if (banner) {
    banner.className = 'p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5';
    banner.innerHTML = `
      <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0"></div>
      <span class="font-medium">Locking onto live satellite GPS fix & calculating nearest FreshMart hub...</span>
    `;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Find closest dark store
      let nearestHub = SABJIHUB_DARK_STORES[0];
      let minDistance = 999999;

      for (const hub of SABJIHUB_DARK_STORES) {
        const dist = calculateHaversineDistance(lat, lon, hub.lat, hub.lon);
        if (dist < minDistance) {
          minDistance = dist;
          nearestHub = hub;
        }
      }

      // Calculate ETA
      let calculatedETA = '12 mins';
      if (minDistance <= 2.5) {
        calculatedETA = '10 mins';
      } else if (minDistance <= 5.5) {
        calculatedETA = '12 mins';
      } else if (minDistance <= 9.0) {
        calculatedETA = '15 mins';
      } else {
        calculatedETA = '20 mins';
      }

      let detectedLocality = nearestHub.locality;
      let detectedPin = nearestHub.pincodes[0];

      // Try reverse geocoding with 2500ms abort timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const localPart = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village || addr.subdistrict;
          const cityPart = addr.city || addr.town || addr.state_district || 'Bengaluru';
          if (localPart) {
            detectedLocality = `${localPart}, ${cityPart}`;
          } else {
            detectedLocality = `${cityPart}`;
          }
          if (addr.postcode) {
            detectedPin = addr.postcode.trim().slice(0, 6);
          }
        }
      } catch (e) {
        console.log('Reverse geocoding unavailable or offline, using nearest hub mapping:', nearestHub.locality);
      }

      // Restore button UI with success state
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-90');
        btn.innerHTML = `
          <div class="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-600 text-white shadow-xs shrink-0">
            <i data-lucide="check" class="w-5 h-5"></i>
          </div>
          <div class="text-left flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-black text-xs sm:text-sm text-emerald-950 block">GPS Captured!</span>
              <span class="px-1.5 py-0.2 rounded-md bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider">Active</span>
            </div>
            <span class="text-[11px] text-emerald-700 font-medium block truncate">${detectedLocality} • ${calculatedETA}</span>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }

      if (banner) {
        banner.className = 'p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between';
        banner.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-base">⚡</span>
            <div>
              <p class="font-black text-emerald-950">Nearest Hub: ${nearestHub.name}</p>
              <p class="text-[11px] text-emerald-800">Distance: ~${minDistance.toFixed(1)} km • Guaranteed Delivery in <strong>${calculatedETA}</strong></p>
            </div>
          </div>
          <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 shrink-0">GPS Locked</span>
        `;
      }

      // Save and apply detected location
      saveStoredState('sabjihub_coords', { lat, lon });
      selectLocation(detectedLocality, detectedPin, calculatedETA, detectedLocality, true);

      // Close modal smoothly after brief feedback
      setTimeout(() => {
        closeLocationModal();
      }, 800);
    },
    (err) => {
      console.warn('GPS location error:', err);
      let errMsg = 'Location access denied or unavailable.';
      if (err.code === 1) {
        errMsg = 'Location permission was denied. Please allow location access in your browser or select an area below.';
      } else if (err.code === 2) {
        errMsg = 'Position unavailable. Please pick a locality from the list below.';
      } else if (err.code === 3) {
        errMsg = 'GPS request timed out. Please pick your locality from below.';
      }

      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-90');
        btn.innerHTML = `
          <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <span class="absolute inset-0 rounded-2xl bg-emerald-400 animate-ping opacity-40"></span>
            <i data-lucide="crosshair" class="w-5 h-5 relative z-10"></i>
          </div>
          <div class="text-left flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-black text-xs sm:text-sm text-emerald-950 block">Detect my location</span>
              <span class="px-1.5 py-0.2 rounded-md bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider">GPS Live</span>
            </div>
            <span class="text-[11px] text-emerald-700/90 font-medium block truncate">Using GPS sensor • Instant Dark Store nearest hub mapping</span>
          </div>
          <i data-lucide="chevron-right" class="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0"></i>
        `;
        if (window.lucide) window.lucide.createIcons();
      }

      if (banner) {
        banner.className = 'p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5';
        banner.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 shrink-0"></i><span>${errMsg}</span>`;
        if (window.lucide) window.lucide.createIcons();
      }

      showToast(errMsg, 'warning');
    },
    {
      enableHighAccuracy: true,
      timeout: 7000,
      maximumAge: 30000
    }
  );
};

// Filter popular localities in modal
window.handleLocationSearch = function(query) {
  const q = (query || '').toLowerCase().trim();
  const list = document.getElementById('popular-localities-list');
  if (!list) return;

  const items = list.querySelectorAll('.locality-item');
  let matchedCount = 0;

  items.forEach(item => {
    const text = (item.getAttribute('data-search') || item.textContent).toLowerCase();
    if (!q || text.includes(q)) {
      item.classList.remove('hidden');
      matchedCount++;
    } else {
      item.classList.add('hidden');
    }
  });

  const emptyMsg = document.getElementById('locality-search-empty');
  if (emptyMsg) {
    if (matchedCount === 0 && q) {
      emptyMsg.classList.remove('hidden');
    } else {
      emptyMsg.classList.add('hidden');
    }
  }
};

// Search Dropdown & Suggestions Helpers
window.showHeaderSearchDropdown = function() {
  const dd = document.getElementById('header-search-suggestions');
  if (dd) {
    dd.classList.add('active');
    const input = document.getElementById('header-inline-search');
    handleHeaderInlineSearch(input ? input.value : '');
  }
};

window.hideHeaderSearchDropdown = function() {
  setTimeout(() => {
    const dd = document.getElementById('header-search-suggestions');
    if (dd) dd.classList.remove('active');
  }, 220);
};

window.handleHeaderInlineSearch = function(val) {
  const dd = document.getElementById('header-search-suggestions');
  if (dd) dd.classList.add('active');

  const resultsContainer = document.getElementById('header-search-results');
  if (!resultsContainer) return;

  const query = (val || '').trim().toLowerCase();

  // If empty, render popular search tags
  if (!query) {
    resultsContainer.innerHTML = `
      <div class="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 mb-2 flex items-center justify-between">
        <span>Popular Searches</span>
        <span class="text-emerald-700 font-bold">🌱 All 57 Farm Items</span>
      </div>
      <div class="grid grid-cols-2 gap-1 text-xs">
        <button onclick="quickSearchSelect('Tomato')" class="text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 font-medium flex items-center gap-2 transition-colors">
          <span>🍅</span><span>Tomato</span>
        </button>
        <button onclick="quickSearchSelect('Alphonso Mango')" class="text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 font-medium flex items-center gap-2 transition-colors">
          <span>🥭</span><span>Alphonso Mango</span>
        </button>
        <button onclick="quickSearchSelect('Sharbati Atta')" class="text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 font-medium flex items-center gap-2 transition-colors">
          <span>🌾</span><span>Sharbati Atta</span>
        </button>
        <button onclick="quickSearchSelect('Shimla Apple')" class="text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 font-medium flex items-center gap-2 transition-colors">
          <span>🍎</span><span>Shimla Apple</span>
        </button>
        <button onclick="quickSearchSelect('Raw Honey')" class="text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 font-medium flex items-center gap-2 transition-colors">
          <span>🍯</span><span>Raw Honey</span>
        </button>
        <button onclick="quickSearchSelect('Organic Toor Dal')" class="text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 font-medium flex items-center gap-2 transition-colors">
          <span>🥣</span><span>Toor Dal</span>
        </button>
      </div>
    `;
    return;
  }

  const allProduce = getAllCatalogProducts();
  const matches = allProduce.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.hindiName.toLowerCase().includes(query) ||
    (p.categories && p.categories.some(c => c.toLowerCase().includes(query))) ||
    (p.description && p.description.toLowerCase().includes(query))
  );

  if (matches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="py-6 text-center text-xs">
        <span class="text-2xl mb-1 block">🔍</span>
        <p class="font-bold text-emerald-950">No produce matches "${query}"</p>
        <p class="text-[11px] text-stone-400 mt-0.5">Try searching tomato, mango, apple, atta, dal, or combo</p>
      </div>
    `;
    return;
  }

  resultsContainer.innerHTML = `
    <div class="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 mb-1.5 flex items-center justify-between">
      <span>Matching Produce (${matches.length})</span>
      <span class="text-emerald-700 font-mono text-[9px]">Press Enter to view all</span>
    </div>
    <div class="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      ${matches.map(p => {
        const norm = normalizeCatalogProduct(p, p.catalogType || 'vegetables');
        const w = norm.weights[0] || { label: '1 unit', price: 99 };
        const detailLink = `product-details.html?id=${encodeURIComponent(norm.id)}`;
        return `
          <div class="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100 group">
            <a href="${detailLink}" onclick="hideHeaderSearchDropdown();" class="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
              <img src="${norm.image}" class="w-9 h-9 rounded-lg object-cover shrink-0" alt="${norm.name}"/>
              <div class="truncate">
                <span class="font-bold text-xs text-emerald-950 block leading-tight group-hover:text-emerald-700">${norm.name}</span>
                <span class="text-[10px] text-stone-400">${norm.hindiName} • ${w.label} <strong class="text-emerald-800">₹${w.price}</strong></span>
              </div>
            </a>
            <button 
              type="button" 
              onclick="event.stopPropagation(); addToCart('${norm.id}', 0); hideHeaderSearchDropdown(); showToast('Added ${norm.name} to Basket!', 'success');" 
              class="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs shrink-0 transition-all active:scale-95"
            >
              + Add
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

window.executeHeaderSearch = function(query) {
  const term = (query || '').trim();
  hideHeaderSearchDropdown();
  if (!term) return;

  if (document.getElementById('veg-products-grid')) {
    filterState.searchQuery = term;
    applyFiltersAndRender();
    document.getElementById('veg-products-grid')?.scrollIntoView({ behavior: 'smooth' });
  } else if (document.getElementById('fruit-products-grid')) {
    fruitFilterState.searchQuery = term;
    applyFruitFiltersAndRender();
    document.getElementById('fruit-products-grid')?.scrollIntoView({ behavior: 'smooth' });
  } else if (document.getElementById('grocery-products-grid')) {
    groceryFilterState.searchQuery = term;
    applyGroceryFiltersAndRender();
    document.getElementById('grocery-products-grid')?.scrollIntoView({ behavior: 'smooth' });
  } else if (document.getElementById('offers-products-grid')) {
    offersFilterState.searchQuery = term;
    applyOffersFiltersAndRender();
    document.getElementById('offers-products-grid')?.scrollIntoView({ behavior: 'smooth' });
  } else if (document.getElementById('products-grid')) {
    const prodSec = document.getElementById('products');
    if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth' });
    
    // Filter index products-grid dynamically across all 57 items
    const filtered = getAllCatalogProducts().filter(p => 
      p.name.toLowerCase().includes(term.toLowerCase()) || 
      p.hindiName.toLowerCase().includes(term.toLowerCase()) ||
      (p.categories && p.categories.some(c => c.toLowerCase().includes(term.toLowerCase()))) ||
      (p.description && p.description.toLowerCase().includes(term.toLowerCase()))
    );
    const grid = document.getElementById('products-grid');
    if (grid && filtered.length > 0) {
      grid.innerHTML = filtered.map(renderProductCardHtml).join('');
      if (window.lucide) lucide.createIcons();
      showToast(`Showing ${filtered.length} matches for "${term}"`, 'info');
    } else {
      showToast(`No exact items for "${term}". Showing all produce.`, 'info');
    }
  } else {
    window.location.href = `vegetables.html`;
  }
};

window.quickSearchSelect = function(term) {
  const input = document.getElementById('header-inline-search');
  if (input) input.value = term;
  executeHeaderSearch(term);
};

// Wishlist Drawer Controls & Rendering
window.openWishlistDrawer = function() {
  const backdrop = document.getElementById('wishlist-drawer-backdrop');
  const drawer = document.getElementById('wishlist-drawer-content');
  if (backdrop && drawer) {
    renderWishlistDrawer();
    backdrop.classList.add('open');
    drawer.classList.add('open');
    document.body.classList.add('overflow-hidden');
  }
};

window.closeWishlistDrawer = function() {
  const backdrop = document.getElementById('wishlist-drawer-backdrop');
  const drawer = document.getElementById('wishlist-drawer-content');
  if (backdrop && drawer) {
    backdrop.classList.remove('open');
    drawer.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
  }
};

window.renderWishlistDrawer = function() {
  const listEl = document.getElementById('wishlist-items-list');
  const emptyEl = document.getElementById('wishlist-empty-state');
  const footerEl = document.getElementById('wishlist-drawer-footer');
  if (!listEl) return;

  const savedProducts = getAllCatalogProducts().filter(p => wishlist.includes(p.id));

  if (savedProducts.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (footerEl) footerEl.classList.add('hidden');
    listEl.innerHTML = '';
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');
  if (footerEl) footerEl.classList.remove('hidden');

  listEl.innerHTML = savedProducts.map(product => {
    const p = normalizeCatalogProduct(product, product.catalogType || 'vegetables');
    const w = p.weights[p.selectedWeightIndex || 0] || p.weights[0];
    const detailLink = `product-details.html?id=${encodeURIComponent(p.id)}`;
    return `
      <div class="flex items-center gap-3 p-3 bg-stone-50/80 rounded-2xl border border-stone-100 hover:border-emerald-200 transition-all">
        <a href="${detailLink}" onclick="closeWishlistDrawer();" class="shrink-0">
          <img src="${p.image}" class="w-14 h-14 rounded-xl object-cover" alt="${p.name}"/>
        </a>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <a href="${detailLink}" onclick="closeWishlistDrawer();" class="truncate">
              <h4 class="font-bold text-xs sm:text-sm text-emerald-950 truncate hover:text-emerald-700">${p.name}</h4>
            </a>
            <button onclick="toggleWishlist('${p.id}'); renderWishlistDrawer();" class="text-stone-400 hover:text-red-500 transition-colors p-1" title="Remove from Wishlist">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <span class="text-[11px] text-stone-500">${w.label} • <strong class="text-emerald-950">₹${w.price}</strong></span>
          <div class="mt-1.5 flex items-center justify-between">
            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">In Stock</span>
            <button onclick="moveWishlistItemToCart('${p.id}', ${p.selectedWeightIndex || 0})" class="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1">
              <span>+ Add</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
};

window.moveWishlistItemToCart = function(id, weightIndex) {
  addToCart(id, weightIndex);
  const idx = wishlist.indexOf(id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    saveStoredState('sabjihub_wishlist', wishlist);
    updateWishlistBadges();
  }
  renderWishlistDrawer();
  showToast('Item moved to your fresh basket!', 'success');
};

window.moveAllWishlistToCart = function() {
  if (wishlist.length === 0) return;
  wishlist.forEach(id => {
    addToCart(id, 0);
  });
  wishlist = [];
  saveStoredState('sabjihub_wishlist', wishlist);
  updateWishlistBadges();
  renderWishlistDrawer();
  closeWishlistDrawer();
  openCartDrawer();
  showToast('All saved items moved to basket!', 'success');
};

window.clearAllWishlist = function() {
  wishlist = [];
  saveStoredState('sabjihub_wishlist', wishlist);
  updateWishlistBadges();
  renderWishlistDrawer();
  showToast('Wishlist cleared.', 'info');
};

// Custom Location Pincode Validator
window.applyCustomLocation = function() {
  const input = document.getElementById('location-modal-search') || document.getElementById('custom-pincode-input');
  const val = input ? input.value.trim() : '';
  if (!val) {
    showToast('Please enter a valid locality or pincode', 'warning');
    return;
  }
  const loc = {
    pincode: val.length === 6 && /^\d+$/.test(val) ? val : '110001',
    area: val.length === 6 && /^\d+$/.test(val) ? `Pincode ${val}` : val,
    city: 'New Delhi',
    eta: '10 mins'
  };
  saveStoredState('sabjihub_location', loc);
  updateLocationHeader(loc);
  closeLocationModal();
  showToast(`Delivering to ${loc.area} in 10 mins!`, 'success');
};

// Search Modal
window.openSearchModal = function() {
  const modal = document.getElementById('search-modal');
  const input = document.getElementById('search-modal-input');
  if (modal) {
    modal.classList.add('open');
    document.body.classList.add('overflow-hidden');
    if (input) {
      setTimeout(() => input.focus(), 150);
      handleLiveSearch(input.value);
    }
  }
};

window.closeSearchModal = function() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
  }
};

window.handleLiveSearch = function(query) {
  const listEl = document.getElementById('search-results-list');
  if (!listEl) return;

  query = (query || '').trim().toLowerCase();
  
  const allProds = getAllCatalogProducts();
  const matches = allProds.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.hindiName.toLowerCase().includes(query) ||
    (p.categories && p.categories.some(c => c.toLowerCase().includes(query))) ||
    (p.description && p.description.toLowerCase().includes(query))
  );

  if (matches.length === 0) {
    listEl.innerHTML = `
      <div class="py-12 text-center">
        <p class="text-3xl mb-2">🥕</p>
        <p class="font-bold text-emerald-950">No vegetables found for "${query}"</p>
        <p class="text-xs text-stone-500 mt-1">Try searching for tomato, potato, spinach, or capsicum</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = matches.map(prod => {
    const p = normalizeCatalogProduct(prod, prod.catalogType || 'vegetables');
    const w = p.weights[0] || { label: '1 unit', price: 99 };
    const link = `product-details.html?id=${encodeURIComponent(p.id)}`;
    return `
      <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100">
        <a href="${link}" class="flex items-center gap-3 flex-1 min-w-0">
          <img src="${p.image}" class="w-12 h-12 rounded-xl object-cover" alt="${p.name}"/>
          <div class="truncate">
            <h4 class="font-bold text-sm text-emerald-950">${p.name} <span class="text-xs text-emerald-700 font-normal">(${p.hindiName})</span></h4>
            <span class="text-xs text-stone-500">${w.label} • ₹${w.price}</span>
          </div>
        </a>
        <button 
          onclick="addToCart('${p.id}', 0); closeSearchModal();" 
          class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          Add +
        </button>
      </div>
    `;
  }).join('');
};

// Toast Notifications
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-950 text-white' : (type === 'warning' ? 'bg-amber-800 text-white' : 'bg-stone-900 text-white');
  
  toast.className = `toast-notice flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border border-white/10 text-xs sm:text-sm font-semibold pointer-events-auto ${bgClass}`;
  toast.innerHTML = `
    <span class="text-emerald-400">✓</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2800);
};

// Checkout Navigation
window.proceedToCheckout = function() {
  saveStoredState('sabjihub_cart', cart);
  saveStoredState('sabjihub_coupon', appliedCoupon);
  closeCartDrawer();
  window.location.href = 'checkout.html';
};


// Scroll reveal animations
function initScrollAnimations() {
  const stickyHeader = document.getElementById('sticky-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      stickyHeader?.classList.add('navbar-scrolled', 'py-2');
      stickyHeader?.classList.remove('py-3.5');
    } else {
      stickyHeader?.classList.remove('navbar-scrolled', 'py-2');
      stickyHeader?.classList.add('py-3.5');
    }
  }, { passive: true });
}

// Global outside-click dismissals for Popovers and Search Dropdown
document.addEventListener('click', function(e) {
  // Search dropdown outside click
  const searchContainer = document.querySelector('.search-container');
  if (searchContainer && !searchContainer.contains(e.target)) {
    hideHeaderSearchDropdown();
  }

  // Notifications popover outside click
  const notifPopover = document.getElementById('notifications-popover');
  const notifBtn = document.getElementById('notif-btn');
  if (notifPopover && notifPopover.classList.contains('active')) {
    if (!notifPopover.contains(e.target) && notifBtn && !notifBtn.contains(e.target)) {
      closeNotifications();
    }
  }

  // User profile popover outside click
  const userPopover = document.getElementById('user-profile-popover');
  const userBtn = document.getElementById('user-profile-btn');
  if (userPopover && userPopover.classList.contains('active')) {
    if (!userPopover.contains(e.target) && userBtn && !userBtn.contains(e.target)) {
      closeUserProfilePopover();
    }
  }
});

// Global Keyboard Shortcut: ⌘K or Ctrl+K to search, and Escape to close any modal/drawer/popover
document.addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('header-inline-search');
    if (searchInput && window.innerWidth >= 640) {
      searchInput.focus();
      searchInput.select();
      showHeaderSearchDropdown();
      handleHeaderInlineSearch(searchInput.value);
    } else {
      openSearchModal();
    }
  }

  if (e.key === 'Escape') {
    hideHeaderSearchDropdown();
    closeNotifications();
    closeUserProfilePopover();
    closeWishlistDrawer();
    closeCartDrawer();
    closeLocationModal();
    closeSearchModal();
    closeTrackOrderModal();
    if (typeof closeQuickView === 'function') closeQuickView();
  }
});

// ========================================================
// 3D INTERACTIVE TILT & PARALLAX ENGINE
// ========================================================
function init3DCardTilt() {
  const tiltSelectors = '.card-3d-tilt, .category-card, .product-card, #farm-dispatch-card';

  // Mousemove 3D tilt tracking with specular reflection
  document.addEventListener('mousemove', function(e) {
    if (!window.matchMedia('(hover: hover)').matches) return;

    const target = e.target.closest(tiltSelectors);
    if (!target) return;

    // Check if card has glare element, create if missing
    let glare = target.querySelector('.card-3d-glare');
    if (!glare && (target.classList.contains('card-3d-tilt') || target.id === 'farm-dispatch-card')) {
      glare = document.createElement('div');
      glare.className = 'card-3d-glare';
      target.appendChild(glare);
    }

    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const maxTilt = target.dataset.tiltMax ? parseFloat(target.dataset.tiltMax) : 8;
    const rotateX = -((y - centerY) / centerY) * maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    target.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;

    if (glare) {
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.28) 0%, transparent 60%)`;
      glare.style.opacity = '1';
    }
  });

  // Smooth reset on mouseout
  document.addEventListener('mouseout', function(e) {
    const target = e.target.closest(tiltSelectors);
    if (target && (!e.relatedTarget || !target.contains(e.relatedTarget))) {
      target.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      const glare = target.querySelector('.card-3d-glare');
      if (glare) glare.style.opacity = '0';
    }
  });

  // Hero Section Interactive 3D Depth Parallax
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    heroSection.addEventListener('mousemove', function(e) {
      if (!window.matchMedia('(hover: hover)').matches) return;
      const rect = heroSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const bgImg = heroSection.querySelector('.absolute.inset-0.z-0 img');
      if (bgImg) {
        bgImg.style.transform = `scale(1.08) translate3d(${(-x * 14).toFixed(1)}px, ${(-y * 14).toFixed(1)}px, 0)`;
      }

      const floatingElements = heroSection.querySelectorAll('.hero-3d-floating');
      floatingElements.forEach((el, idx) => {
        const factor = (idx + 1) * 16;
        el.style.transform = `translate3d(${(x * factor).toFixed(1)}px, ${(y * factor).toFixed(1)}px, 20px)`;
      });
    });

    heroSection.addEventListener('mouseleave', function() {
      const bgImg = heroSection.querySelector('.absolute.inset-0.z-0 img');
      if (bgImg) {
        bgImg.style.transform = 'scale(1.05) translate3d(0, 0, 0)';
      }
    });
  }
}

// Auto-initialize 3D tilt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init3DCardTilt);
} else {
  init3DCardTilt();
}
