/**
 * StorePulse - LocalStorage & Data Persistence Manager
 * Handles default local shop catalog, store profile, and CRUD storage operations.
 */

const STORAGE_KEYS = {
  INVENTORY: 'storepulse_inventory_v1',
  PROFILE: 'storepulse_profile_v1',
  CART: 'storepulse_cart_v1',
  THEME: 'storepulse_theme_v1',
  SERVICES: 'storepulse_services_v1',
  SERVICE_BOOKINGS: 'storepulse_bookings_v1'
};

// Default Store Profile
const DEFAULT_PROFILE = {
  shopName: "Local Buddy - SuperStore & Services",
  tagline: "Your Friendly Neighborhood Buddy for Daily Essentials, Medicines, Tools & Home Services",
  ownerName: "Rajesh Sharma",
  phone: "+91 98765 43210",
  whatsappNumber: "919876543210", // No spaces or symbols for wa.me API
  upiId: "localbuddy@upi",
  address: "Shop #12-14, Sunrise Commercial Complex, Main Market Road, Ward 4",
  openingHours: "7:30 AM - 10:30 PM (Open 7 Days)",
  currency: "₹",
  minFreeDelivery: 299,
  deliveryAvailable: true
};

// Comprehensive inventory catalog covering all daily & local mart essentials
const INITIAL_INVENTORY = [
  // ==========================================
  // 1. DAILY USES & GROCERIES
  // ==========================================
  {
    id: "prod_001",
    name: "Tata Sampann Unpolished Toor Dal",
    category: "Daily Uses & Groceries",
    sku: "GROC-DAL-001",
    costPrice: 142,
    sellingPrice: 175,
    stock: 28,
    unit: "1 kg Pack",
    lowStockThreshold: 8,
    expiry: "2026-11-20",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
    description: "Rich in natural protein, unpolished toor dal sourced from certified farms.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_002",
    name: "Fortune Sunlite Refined Sunflower Oil",
    category: "Daily Uses & Groceries",
    sku: "GROC-OIL-002",
    costPrice: 118,
    sellingPrice: 145,
    stock: 14,
    unit: "1 Litre Pouch",
    lowStockThreshold: 6,
    expiry: "2026-10-15",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60",
    description: "Light and healthy refined sunflower oil enriched with Vitamins A & D.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_003",
    name: "Aashirvaad Shudh Chakki Atta",
    category: "Daily Uses & Groceries",
    sku: "GROC-ATT-003",
    costPrice: 220,
    sellingPrice: 260,
    stock: 4, // LOW STOCK!
    unit: "5 kg Bag",
    lowStockThreshold: 6,
    expiry: "2026-10-30",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=60",
    description: "100% whole wheat grain atta ground carefully in traditional chakki for soft rotis.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_004",
    name: "Daawat Rozana Gold Basmati Rice",
    category: "Daily Uses & Groceries",
    sku: "GROC-RIC-004",
    costPrice: 85,
    sellingPrice: 110,
    stock: 35,
    unit: "1 kg Pack",
    lowStockThreshold: 10,
    expiry: "2027-01-10",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
    description: "Aromatic long-grain basmati rice perfect for everyday wholesome pulao and biryani.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_005",
    name: "Amul Pasteurised Salted Butter",
    category: "Daily Uses & Groceries",
    sku: "DAIR-BUT-005",
    costPrice: 235,
    sellingPrice: 275,
    stock: 3, // LOW STOCK!
    unit: "500g Block",
    lowStockThreshold: 5,
    expiry: "2026-10-05",
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=60",
    description: "Utterly butterly delicious fresh Amul pure pasteurised cream butter.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_006",
    name: "Amul Taaza Homogenised Toned Milk",
    category: "Daily Uses & Groceries",
    sku: "DAIR-MLK-006",
    costPrice: 62,
    sellingPrice: 72,
    stock: 18,
    unit: "1 Litre Tetra",
    lowStockThreshold: 8,
    expiry: "2026-09-28",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60",
    description: "Pure toned milk UHT treated with long shelf life. No boiling needed.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_007",
    name: "Britannia 100% Whole Wheat Brown Bread",
    category: "Daily Uses & Groceries",
    sku: "DAIR-BRD-007",
    costPrice: 38,
    sellingPrice: 50,
    stock: 0, // OUT OF STOCK!
    unit: "400g Loaf",
    lowStockThreshold: 5,
    expiry: "2026-09-18",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60",
    description: "Fiber-rich whole wheat soft brown bread baked fresh daily for healthy breakfasts.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_008",
    name: "Tata Tea Gold Leaf Premium Blend",
    category: "Daily Uses & Groceries",
    sku: "BEVG-TEA-008",
    costPrice: 260,
    sellingPrice: 310,
    stock: 16,
    unit: "500g Carton",
    lowStockThreshold: 5,
    expiry: "2027-04-10",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60",
    description: "Unique blend of fine Assam CTC teas with gently rolled fragrant long leaves.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_009",
    name: "Nescafe Classic Instant Coffee Jar",
    category: "Daily Uses & Groceries",
    sku: "BEVG-COF-009",
    costPrice: 175,
    sellingPrice: 210,
    stock: 9,
    unit: "100g Glass Jar",
    lowStockThreshold: 4,
    expiry: "2027-03-30",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
    description: "100% pure roasted Robusta coffee beans with signature rich aroma and taste.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_010",
    name: "Haldiram's Nagpur Aloo Bhujia",
    category: "Daily Uses & Groceries",
    sku: "SNAK-BHU-010",
    costPrice: 82,
    sellingPrice: 105,
    stock: 45,
    unit: "400g Family Pack",
    lowStockThreshold: 10,
    expiry: "2027-01-20",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60",
    description: "Crispy, spicy potato and gram flour extruded savory snack for teatime.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_011",
    name: "Surf Excel Easy Wash Detergent Powder",
    category: "Daily Uses & Groceries",
    sku: "CLEN-SRF-011",
    costPrice: 125,
    sellingPrice: 149,
    stock: 20,
    unit: "1 kg Polybag",
    lowStockThreshold: 5,
    expiry: "2027-12-31",
    image: "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=500&auto=format&fit=crop&q=60",
    description: "Superfine powder that dissolves rapidly and eliminates stubborn dirt with ease.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_012",
    name: "Vim Dishwash Gel Lemon Anti-Smell",
    category: "Daily Uses & Groceries",
    sku: "CLEN-VIM-012",
    costPrice: 135,
    sellingPrice: 165,
    stock: 12,
    unit: "750ml Bottle",
    lowStockThreshold: 4,
    expiry: "2027-08-20",
    image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop&q=60",
    description: "Power of 100 lemons cuts through burnt grease without leaving white powdery residue.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },

  // ==========================================
  // 2. ELECTRONICS & GADGETS
  // ==========================================
  {
    id: "prod_013",
    name: "boAt Bassheads Fast Braided Type-C Cable",
    category: "Electronics & Gadgets",
    sku: "ELEC-CAB-101",
    costPrice: 140,
    sellingPrice: 249,
    stock: 30,
    unit: "1.5 Meter Cable",
    lowStockThreshold: 6,
    expiry: null,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60",
    description: "Rugged nylon-braided fast charging USB-C sync & charge cable with 3A power delivery.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_014",
    name: "Portronics 20W Dual Port Fast Wall Charger",
    category: "Electronics & Gadgets",
    sku: "ELEC-CHG-102",
    costPrice: 290,
    sellingPrice: 499,
    stock: 15,
    unit: "Piece (Box)",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60",
    description: "Dual output USB-A & Type-C PD 20W superfast compact wall adapter with surge protection.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_015",
    name: "Noise Buds VS102 Wireless TWS Bluetooth Earbuds",
    category: "Electronics & Gadgets",
    sku: "ELEC-EAR-103",
    costPrice: 850,
    sellingPrice: 1299,
    stock: 8,
    unit: "Piece with Charging Case",
    lowStockThreshold: 3,
    expiry: null,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60",
    description: "50 hours total playtime, Tru Bass technology, IPX5 water resistance with fast Instacharge.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_016",
    name: "Mi 10,000mAh Pocket Pro Power Bank (22.5W)",
    category: "Electronics & Gadgets",
    sku: "ELEC-POW-104",
    costPrice: 820,
    sellingPrice: 1199,
    stock: 5, // LOW STOCK!
    unit: "Piece",
    lowStockThreshold: 6,
    expiry: null,
    image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=500&auto=format&fit=crop&q=60",
    description: "Ultra-compact pocket size, 22.5W ultra-fast two-way charging with triple output ports.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_017",
    name: "Havells 4-Way Universal Surge Protector Strip",
    category: "Electronics & Gadgets",
    sku: "ELEC-EXT-105",
    costPrice: 360,
    sellingPrice: 550,
    stock: 12,
    unit: "2 Meter Extension",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
    description: "Heavy duty 4-socket spike guard with master safety switch and thermal overload cutoff.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_018",
    name: "Duracell Ultra Alkaline AA Batteries (Pack of 4)",
    category: "Electronics & Gadgets",
    sku: "ELEC-BAT-106",
    costPrice: 120,
    sellingPrice: 180,
    stock: 25,
    unit: "Blister Pack of 4",
    lowStockThreshold: 8,
    expiry: "2031-12-31",
    image: "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=500&auto=format&fit=crop&q=60",
    description: "Longest lasting alkaline batteries with Powercheck indicator for toys, remotes and clocks.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_019",
    name: "SanDisk Cruzer Blade 64GB USB Flash Drive",
    category: "Electronics & Gadgets",
    sku: "ELEC-USB-107",
    costPrice: 280,
    sellingPrice: 420,
    stock: 18,
    unit: "Piece",
    lowStockThreshold: 5,
    expiry: null,
    image: "https://images.unsplash.com/photo-1626218174358-7769486c4b79?w=500&auto=format&fit=crop&q=60",
    description: "Ultra-compact and portable USB flash drive with secure access file encryption.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_020",
    name: "Foldable Desktop Phone & Tablet Stand",
    category: "Electronics & Gadgets",
    sku: "ELEC-STN-108",
    costPrice: 95,
    sellingPrice: 199,
    stock: 22,
    unit: "Piece",
    lowStockThreshold: 5,
    expiry: null,
    image: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=500&auto=format&fit=crop&q=60",
    description: "Anti-slip aluminum core angle-adjustable cradle for desk video calls and studying.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },

  // ==========================================
  // 3. BEAUTY & PERSONAL CARE
  // ==========================================
  {
    id: "prod_021",
    name: "Himalaya Purifying Neem Face Wash",
    category: "Beauty & Personal Care",
    sku: "BEAU-FAS-201",
    costPrice: 120,
    sellingPrice: 160,
    stock: 24,
    unit: "150ml Tube",
    lowStockThreshold: 6,
    expiry: "2027-08-15",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60",
    description: "Soap-free herbal formulation enriched with Neem and Turmeric to cleanse and prevent acne.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_022",
    name: "Nivea Soft Light Moisturising Cream with Vitamin E",
    category: "Beauty & Personal Care",
    sku: "BEAU-MOI-202",
    costPrice: 175,
    sellingPrice: 240,
    stock: 16,
    unit: "200ml Jar",
    lowStockThreshold: 5,
    expiry: "2027-06-20",
    image: "https://images.unsplash.com/photo-1608248597359-58b16fa71358?w=500&auto=format&fit=crop&q=60",
    description: "Non-greasy light formula with Jojoba Oil and Vitamin E for deeply refreshed soft skin.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_023",
    name: "The Derma Co 1% Hyaluronic Sunscreen Aqua Gel SPF 50",
    category: "Beauty & Personal Care",
    sku: "BEAU-SUN-203",
    costPrice: 310,
    sellingPrice: 449,
    stock: 10,
    unit: "50g Pump",
    lowStockThreshold: 4,
    expiry: "2027-07-10",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=60",
    description: "Broad spectrum PA++++ protection with zero white cast, lightweight and non-sticky.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_024",
    name: "Parachute 100% Pure Coconut Hair Oil",
    category: "Beauty & Personal Care",
    sku: "BEAU-OIL-204",
    costPrice: 105,
    sellingPrice: 135,
    stock: 20,
    unit: "300ml Bottle",
    lowStockThreshold: 5,
    expiry: "2027-11-01",
    image: "https://images.unsplash.com/photo-1608248597359-58b16fa71358?w=500&auto=format&fit=crop&q=60",
    description: "Made from sun-dried naturally sweet coconuts. 5-stage purification for strong hair.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_025",
    name: "L'Oreal Paris Total Repair 5 Keratin Shampoo",
    category: "Beauty & Personal Care",
    sku: "BEAU-SHP-205",
    costPrice: 210,
    sellingPrice: 280,
    stock: 14,
    unit: "340ml Bottle",
    lowStockThreshold: 4,
    expiry: "2027-05-15",
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=60",
    description: "Infused with Ceramide-Cement to fight 5 signs of damaged hair: hairfall, dryness and split ends.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_026",
    name: "Nivea Men Fresh Active 48h Roll-On Deodorant",
    category: "Beauty & Personal Care",
    sku: "BEAU-DEO-206",
    costPrice: 130,
    sellingPrice: 185,
    stock: 12,
    unit: "50ml Roll-on",
    lowStockThreshold: 3,
    expiry: "2027-09-01",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&auto=format&fit=crop&q=60",
    description: "Refreshing ocean extracts provide long-lasting odor protection with no alcohol.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_027",
    name: "Maybelline Baby Lips Cherry Kiss Tinted Lip Balm",
    category: "Beauty & Personal Care",
    sku: "BEAU-LIP-207",
    costPrice: 125,
    sellingPrice: 175,
    stock: 2, // LOW STOCK!
    unit: "4g Stick",
    lowStockThreshold: 5,
    expiry: "2027-04-12",
    image: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=500&auto=format&fit=crop&q=60",
    description: "16 hours continuous moisture with SPF 20 and a lovely natural cherry tint.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_028",
    name: "Garnier Skin Naturals Bright Complete Sheet Mask",
    category: "Beauty & Personal Care",
    sku: "BEAU-MSK-208",
    costPrice: 135,
    sellingPrice: 199,
    stock: 18,
    unit: "Pack of 2 Masks",
    lowStockThreshold: 4,
    expiry: "2027-06-30",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60",
    description: "Infused with 1 full bottle of Vitamin C concentrated serum for glowing hydrated skin in 15 mins.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },

  // ==========================================
  // 4. STUDY MATERIALS & STATIONERY
  // ==========================================
  {
    id: "prod_029",
    name: "Classmate Pulse Spiral Bound Ruled Notebooks (Pack of 3)",
    category: "Study Materials & Stationery",
    sku: "STUD-NOT-301",
    costPrice: 195,
    sellingPrice: 270,
    stock: 32,
    unit: "Pack of 3 (300 pgs)",
    lowStockThreshold: 8,
    expiry: null,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
    description: "Elemental chlorine-free premium 70 GSM white paper with micro-perforated pages.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_030",
    name: "Reynolds 045 Fine Carbide Ball Pens (Pack of 10)",
    category: "Study Materials & Stationery",
    sku: "STUD-PEN-302",
    costPrice: 70,
    sellingPrice: 100,
    stock: 40,
    unit: "Pack of 10 Pens",
    lowStockThreshold: 10,
    expiry: null,
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60",
    description: "Classic laser-tip writing instrument for smooth non-smudge exam and daily note writing.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_031",
    name: "Hauser XO 0.6mm Extra Dark Gel Pens (Pack of 5)",
    category: "Study Materials & Stationery",
    sku: "STUD-GEL-303",
    costPrice: 85,
    sellingPrice: 120,
    stock: 25,
    unit: "Pack of 5 Pens",
    lowStockThreshold: 6,
    expiry: null,
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60",
    description: "Feather-light ergonomic grip with ultra-smooth Japanese waterproof pigment ink.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_032",
    name: "Faber-Castell Textliner Pastel Highlighters (Set of 4)",
    category: "Study Materials & Stationery",
    sku: "STUD-HLT-304",
    costPrice: 95,
    sellingPrice: 140,
    stock: 19,
    unit: "Set of 4 Shades",
    lowStockThreshold: 5,
    expiry: null,
    image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=60",
    description: "Charming soft pastel water-based inks that don't bleed through textbook pages.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_033",
    name: "Camlin Scholar Mathematical Drawing Geometry Box",
    category: "Study Materials & Stationery",
    sku: "STUD-GEO-305",
    costPrice: 115,
    sellingPrice: 165,
    stock: 15,
    unit: "Metal Kit Box",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=60",
    description: "Self-centering compass, divider, 15cm ruler, protractor and set squares in sturdy tin case.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_034",
    name: "Post-it 3M Self-Adhesive Sticky Notes Pad (3x3 inch)",
    category: "Study Materials & Stationery",
    sku: "STUD-STK-306",
    costPrice: 48,
    sellingPrice: 75,
    stock: 28,
    unit: "100 Sheets Pad",
    lowStockThreshold: 8,
    expiry: null,
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60",
    description: "Reliable adhesion that sticks firmly and removes cleanly without damaging study book pages.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_035",
    name: "Kangaroo Heavy-Duty Stapler No. 10 with 1000 Pins",
    category: "Study Materials & Stationery",
    sku: "STUD-STP-307",
    costPrice: 85,
    sellingPrice: 130,
    stock: 14,
    unit: "Stapler + Pin Pack",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60",
    description: "All-metal construction with built-in staple remover, binds up to 20 sheets easily.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_036",
    name: "JK Copier A4 Paper Ream (75 GSM, 500 Sheets)",
    category: "Study Materials & Stationery",
    sku: "STUD-PPR-308",
    costPrice: 265,
    sellingPrice: 340,
    stock: 0, // OUT OF STOCK!
    unit: "500 Sheets Ream",
    lowStockThreshold: 5,
    expiry: null,
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60",
    description: "High brightness, jam-free multipurpose copier paper for project prints and assignments.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },

  // ==========================================
  // 5. GIFT PRODUCTS & HAMPERS
  // ==========================================
  {
    id: "prod_037",
    name: "Cadbury Celebrations Rich Dry Fruit Gift Hamper Box",
    category: "Gift Products & Hampers",
    sku: "GIFT-HAM-401",
    costPrice: 375,
    sellingPrice: 499,
    stock: 18,
    unit: "450g Luxury Box",
    lowStockThreshold: 5,
    expiry: "2027-02-14",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60",
    description: "Festive gift pack filled with whole roasted almonds, cashews and assorted Cadbury chocolates.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_038",
    name: "Artisanal Handcrafted Lavender Soy Scented Candle Jar",
    category: "Gift Products & Hampers",
    sku: "GIFT-CND-402",
    costPrice: 190,
    sellingPrice: 349,
    stock: 14,
    unit: "200g Glass Jar",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=60",
    description: "100% natural soy wax aromatherapy candle infused with calming French lavender essential oils.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_039",
    name: "Matte Ceramic Coffee Mug with Gold Spoon & Wooden Lid",
    category: "Gift Products & Hampers",
    sku: "GIFT-MUG-403",
    costPrice: 160,
    sellingPrice: 299,
    stock: 12,
    unit: "350ml Mug Set",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
    description: "Modern minimalist ceramic mug with natural wood coaster lid and brass-accented dessert spoon.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_040",
    name: "Executive Leatherette Hardbound Journal & Pen Gift Box",
    category: "Gift Products & Hampers",
    sku: "GIFT-JRN-404",
    costPrice: 260,
    sellingPrice: 450,
    stock: 9,
    unit: "Journal + Pen Set",
    lowStockThreshold: 3,
    expiry: null,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
    description: "Premium debossed notebook with magnetic clasp and weighted metal rollerball pen in gift box.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_041",
    name: "Ferrero Rocher Premium Hazelnut Chocolates Gift Pack",
    category: "Gift Products & Hampers",
    sku: "GIFT-FRR-405",
    costPrice: 420,
    sellingPrice: 540,
    stock: 15,
    unit: "Pack of 16 Pcs",
    lowStockThreshold: 4,
    expiry: "2027-03-25",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60",
    description: "Whole crunchy hazelnut coated in smooth chocolate filling with delicate crispy wafer shell.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_042",
    name: "Warm White Copper Wire USB Fairy String Lights (10m)",
    category: "Gift Products & Hampers",
    sku: "GIFT-LGT-406",
    costPrice: 90,
    sellingPrice: 199,
    stock: 3, // LOW STOCK!
    unit: "10 Meter String",
    lowStockThreshold: 5,
    expiry: null,
    image: "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=500&auto=format&fit=crop&q=60",
    description: "100 micro LEDs on flexible insulated copper wire, ideal for room decor, gifting and festivals.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_043",
    name: "Traditional Handcrafted Pure Brass Akhand Diya",
    category: "Gift Products & Hampers",
    sku: "GIFT-DYA-407",
    costPrice: 195,
    sellingPrice: 320,
    stock: 11,
    unit: "Piece with Glass Shield",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?w=500&auto=format&fit=crop&q=60",
    description: "Heavy solid brass puja & housewarming gifting diya with heat-resistant borosilicate glass chimney.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },

  // ==========================================
  // 6. OTHER LOCAL ESSENTIALS
  // ==========================================
  {
    id: "prod_044",
    name: "Milton Thermosteel Vacuum Insulated Stainless Flask (750ml)",
    category: "Other Local Essentials",
    sku: "UTIL-FLK-501",
    costPrice: 480,
    sellingPrice: 699,
    stock: 10,
    unit: "Piece (Boxed)",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60",
    description: "24-hour hot & cold temperature retention, 100% rust-proof 304 food-grade stainless steel.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_045",
    name: "Windproof 3-Fold Auto-Open Compact Travel Umbrella",
    category: "Other Local Essentials",
    sku: "UTIL-UMB-502",
    costPrice: 220,
    sellingPrice: 399,
    stock: 16,
    unit: "Piece with Cover",
    lowStockThreshold: 5,
    expiry: null,
    image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500&auto=format&fit=crop&q=60",
    description: "Reinforced fiberglass 8-rib canopy with one-touch button open/close mechanism.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_046",
    name: "Dettol Antiseptic First Aid Liquid & Hansaplast Kit",
    category: "Other Local Essentials",
    sku: "UTIL-AID-503",
    costPrice: 135,
    sellingPrice: 185,
    stock: 22,
    unit: "Combo Kit (250ml + 20 Strips)",
    lowStockThreshold: 6,
    expiry: "2027-10-31",
    image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format&fit=crop&q=60",
    description: "Essential home emergency kit with antiseptic disinfectant bottle and medicated adhesive bandages.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_047",
    name: "Pigeon Stainless Steel Multipurpose Knife & Peeler Set",
    category: "Other Local Essentials",
    sku: "UTIL-KNF-504",
    costPrice: 105,
    sellingPrice: 179,
    stock: 15,
    unit: "Set of 3 Tools",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=500&auto=format&fit=crop&q=60",
    description: "Razor-sharp laser edged kitchen knives with comfortable contoured grip and vegetable peeler.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_048",
    name: "Eco-Friendly Heavy Duty Canvas Grocery Tote Bags (Pack of 2)",
    category: "Other Local Essentials",
    sku: "UTIL-BAG-505",
    costPrice: 110,
    sellingPrice: 199,
    stock: 26,
    unit: "Pack of 2 Bags",
    lowStockThreshold: 6,
    expiry: null,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60",
    description: "100% natural unbleached cotton canvas bag with reinforced handles, holds up to 15kg groceries.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_049",
    name: "Godrej Aer Pocket Bathroom Fragrance Gel (Pack of 3)",
    category: "Other Local Essentials",
    sku: "UTIL-AER-506",
    costPrice: 115,
    sellingPrice: 165,
    stock: 20,
    unit: "Pack of 3 Gels",
    lowStockThreshold: 5,
    expiry: "2027-11-20",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=60",
    description: "Unique gel technology that maintains fresh floral and ocean aromas for up to 30 days.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_050",
    name: "Multi-Purpose Stainless Steel Scissors & Tape Set",
    category: "Other Local Essentials",
    sku: "UTIL-SCI-507",
    costPrice: 85,
    sellingPrice: 149,
    stock: 17,
    unit: "Scissors + 2 Tapes",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60",
    description: "Heavy duty 8-inch craft scissors with clear packing tape rolls for daily household packing.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },

  // ==========================================
  // 6. MEDICINES & HEALTHCARE
  // ==========================================
  {
    id: "prod_051",
    name: "Dolo 650 Paracetamol Tablets (Strip of 15)",
    category: "Medicines & Healthcare",
    sku: "MED-DOLO-001",
    costPrice: 24,
    sellingPrice: 32,
    stock: 60,
    unit: "Strip of 15 Tabs",
    lowStockThreshold: 15,
    expiry: "2027-08-31",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
    description: "Fast-acting paracetamol for fever, body ache, headaches, and viral fever symptom relief.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_052",
    name: "Dabur Honitus Herbal Cough Syrup (100ml)",
    category: "Medicines & Healthcare",
    sku: "MED-HONI-002",
    costPrice: 85,
    sellingPrice: 110,
    stock: 25,
    unit: "100ml Bottle",
    lowStockThreshold: 6,
    expiry: "2027-05-15",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
    description: "Ayurvedic non-drowsy cough syrup infused with honey, tulsi, mulethi, and banapsha.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_053",
    name: "Eno Fruit Salt Fast Relief Lemon (Pack of 6)",
    category: "Medicines & Healthcare",
    sku: "MED-ENO-003",
    costPrice: 42,
    sellingPrice: 54,
    stock: 40,
    unit: "Pack of 6 Sachets",
    lowStockThreshold: 10,
    expiry: "2027-12-01",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
    description: "Instant relief from acidity, heartburn, and stomach gas in 6 seconds.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_054",
    name: "Dettol Antiseptic Disinfectant Liquid (500ml)",
    category: "Medicines & Healthcare",
    sku: "MED-DETT-004",
    costPrice: 165,
    sellingPrice: 205,
    stock: 18,
    unit: "500ml Bottle",
    lowStockThreshold: 5,
    expiry: "2027-09-30",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60",
    description: "Trusted antiseptic liquid for first aid wound cleansing, surface disinfection, and hygiene.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_055",
    name: "Volini Rapid Pain Relief Spray (100g)",
    category: "Medicines & Healthcare",
    sku: "MED-VOLI-005",
    costPrice: 195,
    sellingPrice: 245,
    stock: 14,
    unit: "100g Can",
    lowStockThreshold: 4,
    expiry: "2027-06-20",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
    description: "Quick deep-penetrating pain relief spray for backache, joint pain, muscle pull, and sprains.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_056",
    name: "Johnson & Johnson Band-Aid Washproof Strips (Pack of 20)",
    category: "Medicines & Healthcare",
    sku: "MED-BAND-006",
    costPrice: 38,
    sellingPrice: 50,
    stock: 35,
    unit: "Box of 20 Strips",
    lowStockThreshold: 8,
    expiry: "2028-02-15",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60",
    description: "Water-resistant adhesive bandages with sterile pad protection for minor cuts and abrasions.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_057",
    name: "Omron Smart Digital Oral/Underarm Thermometer",
    category: "Medicines & Healthcare",
    sku: "MED-THERM-007",
    costPrice: 210,
    sellingPrice: 299,
    stock: 12,
    unit: "1 Piece Box",
    lowStockThreshold: 3,
    expiry: null,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
    description: "Fast 60-second fever reading with high accuracy, beeper alert, and auto-shutoff.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_058",
    name: "Becosules Z B-Complex & Zinc Capsules (Strip of 20)",
    category: "Medicines & Healthcare",
    sku: "MED-BECO-008",
    costPrice: 40,
    sellingPrice: 52,
    stock: 45,
    unit: "Strip of 20 Caps",
    lowStockThreshold: 10,
    expiry: "2027-04-10",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
    description: "Essential Vitamin B-Complex with Vitamin C and Zinc for mouth ulcers and immune stamina.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_059",
    name: "Burnol Antiseptic Healing Cream for Minor Burns (20g)",
    category: "Medicines & Healthcare",
    sku: "MED-BURN-009",
    costPrice: 65,
    sellingPrice: 85,
    stock: 16,
    unit: "20g Tube",
    lowStockThreshold: 4,
    expiry: "2027-10-30",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60",
    description: "Classic first aid ointment for instant cooling and anti-infective relief on minor kitchen burns and scalds.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_060",
    name: "Electral WHO-Formula Rehydration ORS Powder (Pack of 4)",
    category: "Medicines & Healthcare",
    sku: "MED-ELEC-010",
    costPrice: 68,
    sellingPrice: 88,
    stock: 30,
    unit: "Pack of 4 Sachets",
    lowStockThreshold: 8,
    expiry: "2027-11-15",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
    description: "Restores vital electrolytes and body fluids lost during heat exhaustion, dehydration, and upset stomach.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_061",
    name: "Dr. Morepen Digital Blood Pressure Monitor BPI-02",
    category: "Medicines & Healthcare",
    sku: "MED-BPM-011",
    costPrice: 1050,
    sellingPrice: 1399,
    stock: 8,
    unit: "Device + Cuff Unit",
    lowStockThreshold: 2,
    expiry: null,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
    description: "Fully automatic upper arm BP monitor with WHO blood pressure classification indicator.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_062",
    name: "Sterile Nitrile Examination Gloves (Box of 50)",
    category: "Medicines & Healthcare",
    sku: "MED-GLOV-012",
    costPrice: 220,
    sellingPrice: 299,
    stock: 15,
    unit: "Box of 50 Gloves",
    lowStockThreshold: 4,
    expiry: "2028-12-31",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60",
    description: "Medical-grade powder-free nitrile examination gloves for nursing, hygiene, and clinic care.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },

  // ==========================================
  // 7. PLUMBING & SANITARY SUPPLIES
  // ==========================================
  {
    id: "prod_063",
    name: "Supreme Heavy Duty CPVC Pipe 1-inch (10ft Length)",
    category: "Plumbing & Sanitary Supplies",
    sku: "PLUM-PIPE-001",
    costPrice: 290,
    sellingPrice: 380,
    stock: 22,
    unit: "10ft Length",
    lowStockThreshold: 5,
    expiry: null,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
    description: "SDR-11 pressure rated hot and cold water plumbing CPVC pipe, corrosion-proof and durable.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_064",
    name: "Solid Brass Heavy Bib Cock Tap (Quarter Turn)",
    category: "Plumbing & Sanitary Supplies",
    sku: "PLUM-TAP-002",
    costPrice: 210,
    sellingPrice: 299,
    stock: 16,
    unit: "1 Piece",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60",
    description: "High-grade forged brass chrome finished tap with ceramic disc cartridge for leak-free control.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_065",
    name: "PTFE Teflon Thread Seal Tape 12mm (Pack of 5)",
    category: "Plumbing & Sanitary Supplies",
    sku: "PLUM-TEF-003",
    costPrice: 55,
    sellingPrice: 85,
    stock: 45,
    unit: "Pack of 5 Rolls",
    lowStockThreshold: 10,
    expiry: null,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
    description: "Waterproof sealing plumber's tape for threaded pipe joints, taps, shower arms, and valves.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_066",
    name: "Pidilite PVC & CPVC Heavy Solvent Cement (250ml)",
    category: "Plumbing & Sanitary Supplies",
    sku: "PLUM-SOLV-004",
    costPrice: 110,
    sellingPrice: 155,
    stock: 18,
    unit: "250ml Can",
    lowStockThreshold: 5,
    expiry: "2027-09-01",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
    description: "Fast setting solvent adhesive for high pressure bonding of CPVC and PVC pipes and fittings.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_067",
    name: "Stainless Steel Flexible Connection Hose (18-inch)",
    category: "Plumbing & Sanitary Supplies",
    sku: "PLUM-HOSE-005",
    costPrice: 95,
    sellingPrice: 145,
    stock: 24,
    unit: "1 Piece",
    lowStockThreshold: 6,
    expiry: null,
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60",
    description: "Braided SS-304 connection pipe with brass nuts for geyser, wash basin, and cistern connection.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_068",
    name: "Brass Sink Waste Coupling Full Thread (3-inch)",
    category: "Plumbing & Sanitary Supplies",
    sku: "PLUM-COUP-006",
    costPrice: 120,
    sellingPrice: 180,
    stock: 14,
    unit: "1 Piece",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
    description: "Durable chrome plated brass sink drain coupling with rubber gasket and stopper mesh.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_069",
    name: "Overhead Water Tank Brass Float Valve Ball Cock (1-inch)",
    category: "Plumbing & Sanitary Supplies",
    sku: "PLUM-FLOT-007",
    costPrice: 220,
    sellingPrice: 310,
    stock: 9,
    unit: "1 Piece Unit",
    lowStockThreshold: 3,
    expiry: null,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
    description: "High pressure automatic water tank overflow cutoff ball valve with brass arm.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },

  // ==========================================
  // 8. ELECTRICAL & WIRING SUPPLIES
  // ==========================================
  {
    id: "prod_070",
    name: "Havells 1.5 sq mm Flame Retardant Copper Wire (90m Roll)",
    category: "Electrical & Wiring Supplies",
    sku: "ELEC-WIRE-001",
    costPrice: 1750,
    sellingPrice: 2150,
    stock: 10,
    unit: "90 Metre Roll",
    lowStockThreshold: 3,
    expiry: null,
    image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=500&auto=format&fit=crop&q=60",
    description: "100% electrolytic pure copper wire with flame retardant PVC insulation for home power wiring.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_071",
    name: "Anchor Roma 6A Modular Switch & Socket Set (Pack of 4)",
    category: "Electrical & Wiring Supplies",
    sku: "ELEC-SWTC-002",
    costPrice: 230,
    sellingPrice: 320,
    stock: 25,
    unit: "Set of 4 Units",
    lowStockThreshold: 6,
    expiry: null,
    image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=500&auto=format&fit=crop&q=60",
    description: "Polycarbonate spark-resistant modular 1-way switches and 3-pin safety shutter sockets.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_072",
    name: "Steelgrip Heavy PVC Electrical Insulation Tape (Pack of 5)",
    category: "Electrical & Wiring Supplies",
    sku: "ELEC-TAPE-003",
    costPrice: 48,
    sellingPrice: 75,
    stock: 50,
    unit: "Pack of 5 Rolls",
    lowStockThreshold: 12,
    expiry: null,
    image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=500&auto=format&fit=crop&q=60",
    description: "Weather-resistant, stretchable, high dielectric strength insulation tape for wire joint safety.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_073",
    name: "Philips 10W Cool Daylight B22 LED Bulbs (Pack of 2)",
    category: "Electrical & Wiring Supplies",
    sku: "ELEC-LEDB-004",
    costPrice: 155,
    sellingPrice: 210,
    stock: 28,
    unit: "Pack of 2 Bulbs",
    lowStockThreshold: 8,
    expiry: null,
    image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=500&auto=format&fit=crop&q=60",
    description: "Energy efficient 1000 lumen cool daylight eye-comfort LED bulbs with surge protection.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_074",
    name: "Mastech Digital Multimeter & Heavy Neon Line Tester",
    category: "Electrical & Wiring Supplies",
    sku: "ELEC-TEST-005",
    costPrice: 360,
    sellingPrice: 499,
    stock: 11,
    unit: "Kit (Meter + Tester)",
    lowStockThreshold: 3,
    expiry: null,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
    description: "Multi-range voltage, current, and resistance measurement unit with probe cables and phase tester.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_075",
    name: "Schneider Electric 32A Double Pole MCB Isolator",
    category: "Electrical & Wiring Supplies",
    sku: "ELEC-MCB-006",
    costPrice: 290,
    sellingPrice: 395,
    stock: 14,
    unit: "1 Piece Unit",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=500&auto=format&fit=crop&q=60",
    description: "Tripping safety circuit breaker protection against overload and short circuits for main panels.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },

  // ==========================================
  // 9. WELDING & METAL FABRICATION
  // ==========================================
  {
    id: "prod_076",
    name: "Advani-Oerlikon Overcord E6013 Arc Welding Rods (5kg Box)",
    category: "Welding & Metal Fabrication",
    sku: "WELD-ROD-001",
    costPrice: 650,
    sellingPrice: 840,
    stock: 14,
    unit: "5 kg Box",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=60",
    description: "General purpose mild steel all-position electrodes with smooth arc and easy slag release.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_077",
    name: "Auto-Darkening Solar Powered Welding Helmet Mask",
    category: "Welding & Metal Fabrication",
    sku: "WELD-MASK-002",
    costPrice: 780,
    sellingPrice: 1099,
    stock: 7,
    unit: "1 Helmet Unit",
    lowStockThreshold: 2,
    expiry: null,
    image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=60",
    description: "High speed shade DIN 9-13 auto-switching filter helmet protecting eyes and face from UV/IR rays.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_078",
    name: "Bosch 4-inch Metal Grinding & Cutting Wheels (Pack of 10)",
    category: "Welding & Metal Fabrication",
    sku: "WELD-DISC-003",
    costPrice: 280,
    sellingPrice: 380,
    stock: 20,
    unit: "Pack of 10 Discs",
    lowStockThreshold: 5,
    expiry: null,
    image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=60",
    description: "Reinforced resinoid bonded abrasive discs for angle grinders to cut and deburr mild steel and iron.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_079",
    name: "Heavy Cowhide Split Leather Welding Gloves (Heat Resistant)",
    category: "Welding & Metal Fabrication",
    sku: "WELD-GLOV-004",
    costPrice: 240,
    sellingPrice: 349,
    stock: 16,
    unit: "1 Pair Gloves",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=60",
    description: "14-inch long gauntlet cuff Kevlar-stitched gloves offering protection against hot sparks and molten slag.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_080",
    name: "Heavy-Duty Multi-Angle Magnetic Welding Clamp (50 lbs)",
    category: "Welding & Metal Fabrication",
    sku: "WELD-MAGN-005",
    costPrice: 190,
    sellingPrice: 275,
    stock: 15,
    unit: "1 Piece",
    lowStockThreshold: 3,
    expiry: null,
    image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=60",
    description: "Arrow magnet holder for 45°, 90°, and 135° angle precision alignment while welding pipes and frames.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },

  // ==========================================
  // 10. CONSTRUCTION, MASONRY & TOOLS
  // ==========================================
  {
    id: "prod_081",
    name: "UltraTech Super Weather-Proof Portland Cement (50kg Bag)",
    category: "Construction, Masonry & Tools",
    sku: "CONS-CEMT-001",
    costPrice: 340,
    sellingPrice: 395,
    stock: 40,
    unit: "50 kg Bag",
    lowStockThreshold: 10,
    expiry: null,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
    description: "High-grade engineered Portland cement offering superior bonding, low water permeability, and durability.",
    featured: true,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_082",
    name: "Master Mason Stainless Steel Brick Trowel (10-inch)",
    category: "Construction, Masonry & Tools",
    sku: "CONS-TRWL-002",
    costPrice: 180,
    sellingPrice: 260,
    stock: 18,
    unit: "1 Piece",
    lowStockThreshold: 4,
    expiry: null,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
    description: "Hardened steel blade with ergonomic wooden handle for mortar spreading, bricklaying, and plastering.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_083",
    name: "24-inch Heavy Duty Aluminum Magnetic Spirit Level",
    category: "Construction, Masonry & Tools",
    sku: "CONS-LEVL-003",
    costPrice: 260,
    sellingPrice: 375,
    stock: 12,
    unit: "1 Piece",
    lowStockThreshold: 3,
    expiry: null,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
    description: "Precision 3-vial (45°, 90°, 180°) leveling tool with magnetic base for masonry, framing, and tile work.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_084",
    name: "Dr. Fixit CrackX Paste Waterproof Crack Filler (1kg)",
    category: "Construction, Masonry & Tools",
    sku: "CONS-DFIX-004",
    costPrice: 140,
    sellingPrice: 195,
    stock: 22,
    unit: "1 kg Tub",
    lowStockThreshold: 5,
    expiry: "2027-10-15",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
    description: "Single-component acrylic ready-to-use filler for internal and external plaster cracks up to 5mm.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_085",
    name: "Industrial Site Safety Hard Hat Helmet with Chin Strap",
    category: "Construction, Masonry & Tools",
    sku: "CONS-HLMT-005",
    costPrice: 160,
    sellingPrice: 240,
    stock: 25,
    unit: "1 Piece",
    lowStockThreshold: 5,
    expiry: null,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
    description: "High density impact-absorbing safety helmet with adjustable ratchet suspension for site construction.",
    featured: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "prod_086",
    name: "Fevicol SH Ultimate Synthetic Resin Wood Glue (1kg)",
    category: "Construction, Masonry & Tools",
    sku: "CONS-FEVI-006",
    costPrice: 190,
    sellingPrice: 255,
    stock: 20,
    unit: "1 kg Jar",
    lowStockThreshold: 5,
    expiry: "2027-12-31",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
    description: "Industry-standard adhesive for bonding wood, plywood, laminate, veneer, and particle board.",
    featured: true,
    lastUpdated: new Date().toISOString()
  }
];

// Verified Local Service Providers & Tradespeople
const INITIAL_SERVICES = [
  {
    id: "serv_001",
    name: "Ramesh Kumar",
    category: "Plumber",
    title: "Master Plumber & Sanitary Expert",
    phone: "+91 98112 34567",
    whatsapp: "919811234567",
    experience: "12+ Years",
    visitingFee: 250,
    rating: 4.9,
    reviewsCount: 148,
    status: "available", // "available" or "busy"
    badges: ["Verified Pro", "Fast 30-Min Arrival", "Sanitary Specialist"],
    specialties: [
      "Pipe Leakage Detection & Repair",
      "Bathroom Sanitary Fitting & Faucets",
      "Overhead Water Tank Cleaning & Valves",
      "Geyser & Water Heater Installation",
      "Underground Drainage Clog Removal"
    ],
    address: "Market Complex, Sector 4 (Doorstep Service)",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60",
    description: "Specialist in residential and commercial plumbing, pipeline installations, pressure issues, and leak-free sanitary fixture installations."
  },
  {
    id: "serv_002",
    name: "Suresh Verma",
    category: "Electrician",
    title: "Certified Senior Electrician",
    phone: "+91 98223 45678",
    whatsapp: "919822345678",
    experience: "10+ Years",
    visitingFee: 200,
    rating: 4.9,
    reviewsCount: 192,
    status: "available",
    badges: ["Govt Certified", "Same-Day Fix", "Wiring Pro"],
    specialties: [
      "House Concealed Wiring & Short Circuits",
      "MCB & Main Distribution Board Upgrades",
      "Ceiling Fan, Chandelier & Light Fixtures",
      "Inverter, UPS & Battery Setup",
      "Modular Switchboard Replacement"
    ],
    address: "Near Metro Gate 2 / Quick Doorstep Visit",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
    description: "Licensed electrician experienced with domestic wiring, circuit tripping issues, phase balancing, and smart home lighting installations."
  },
  {
    id: "serv_003",
    name: "Balwan Singh & Team",
    category: "Construction Worker / Mason",
    title: "Civil Masonry & Structural Contractor",
    phone: "+91 98334 56789",
    whatsapp: "919833456789",
    experience: "18+ Years",
    visitingFee: 400,
    rating: 4.8,
    reviewsCount: 86,
    status: "available",
    badges: ["Licensed Contractor", "Material + Labor", "Structural Expert"],
    specialties: [
      "Wall Plastering, Brickwork & Partition Walls",
      "Floor Tile, Granite & Marble Laying",
      "Roof Waterproofing & Terrace Seepage Repair",
      "Structural Repair & Home Renovations",
      "Concrete Slab Pouring & Foundation Work"
    ],
    address: "Industrial Area Yard / Site Visits & Inspection",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
    description: "Experienced masonry and civil crew providing end-to-end building construction, tile fixing, plastering, wall knocking, and terrace waterproofing."
  },
  {
    id: "serv_004",
    name: "Dr. Ananya Sen, MBBS, MD",
    category: "Doctor / General Physician",
    title: "Family Medicine & Emergency Consultant",
    phone: "+91 98445 67890",
    whatsapp: "919844567890",
    experience: "14+ Years",
    visitingFee: 500,
    rating: 5.0,
    reviewsCount: 230,
    status: "available",
    badges: ["MBBS, MD Reg #4812", "Home Visit Consult", "Verified Doctor"],
    specialties: [
      "Fever, Viral, Cold & Flu Treatment",
      "Diabetes, BP & Chronic Care Consultation",
      "Elderly Bedside Home Consultation",
      "Emergency First Aid & Prescription Refills",
      "Child Healthcare & Preventive Guidance"
    ],
    address: "Sen Polyclinic, Ring Road (Clinic & Doorstep Home Visits)",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=60",
    description: "Senior family physician offering patient-centric consultations, diagnostic reviews, emergency triage, and doorstep visits for elderly patients."
  },
  {
    id: "serv_005",
    name: "Mohammed Arif",
    category: "Welder / Fabricator",
    title: "Precision Arc & Grill Metal Fabricator",
    phone: "+91 98556 78901",
    whatsapp: "919855678901",
    experience: "15+ Years",
    visitingFee: 300,
    rating: 4.9,
    reviewsCount: 114,
    status: "available",
    badges: ["Master Craftsman", "On-Site Arc Welding", "Custom Metalwork"],
    specialties: [
      "Main Iron Gate, Window Grills & Safety Doors",
      "Staircase Railings & Balcony Balustrades",
      "Tin Shed, Car Parking & Truss Erection",
      "Broken Gate Hinges & Emergency Welding",
      "Heavy Industrial & Custom Steel Fabrication"
    ],
    address: "Arif Iron Works, Workshop & Portable On-Site Unit",
    image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=60",
    description: "Skilled welding technician equipped with mobile arc welding generator for on-site repairs, gate fabrication, railing reinforcement, and metal frames."
  },
  {
    id: "serv_006",
    name: "Gurpreet Singh",
    category: "Carpenter",
    title: "Master Woodworker & Furniture Fixer",
    phone: "+91 98667 89012",
    whatsapp: "919866789012",
    experience: "11+ Years",
    visitingFee: 250,
    rating: 4.8,
    reviewsCount: 125,
    status: "available",
    badges: ["Modular Specialist", "Precision Woodcraft", "Quick Doorstep"],
    specialties: [
      "Modular Kitchen Cabinets & Drawer Hinges",
      "Door Lock, Handle & Latch Installation",
      "Custom Wooden Wall Shelves & Wardrobes",
      "Bed Frame, Dining Table & Chair Repair",
      "Laminate Pasting & Wooden Edge Banding"
    ],
    address: "Timber Market Lane / Doorstep Service",
    image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=60",
    description: "Expert in bespoke woodwork, modular kitchen hinge replacements, wardrobe repairs, lock installations, and antique furniture restoration."
  },
  {
    id: "serv_007",
    name: "Vikas Sharma",
    category: "Painter",
    title: "Interior & Exterior Paint & Waterproofing Specialist",
    phone: "+91 98778 90123",
    whatsapp: "919877890123",
    experience: "9+ Years",
    visitingFee: 200,
    rating: 4.8,
    reviewsCount: 97,
    status: "available",
    badges: ["Asian Paints Trained", "No-Mess Guarantee", "Waterproof Pro"],
    specialties: [
      "Interior Wall Painting, Primer & Wall Putty",
      "Exterior Weatherproof Apex Coating",
      "Seepage Treatment & Wall Damp Proofing",
      "Designer Texture Walls & Stencil Art",
      "Wood Polish, PU Coating & Metal Enamel"
    ],
    address: "Central Colony / Doorstep Service",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=60",
    description: "Quality painter with clean masking techniques, dust-free sanding machines, damp-proofing primers, and premium washable emulsion finishes."
  },
  {
    id: "serv_008",
    name: "Imran Khan",
    category: "AC & Appliance Repair",
    title: "Appliance Repair & HVAC Expert",
    phone: "+91 98889 01234",
    whatsapp: "919888901234",
    experience: "8+ Years",
    visitingFee: 350,
    rating: 4.9,
    reviewsCount: 165,
    status: "available",
    badges: ["Multi-Brand Certified", "90-Day Warranty", "Jet Pump Clean"],
    specialties: [
      "Split & Window AC Deep Jet Pump Service",
      "Eco Gas Charging & Leak Testing (R32/R410A)",
      "Single/Double Door Refrigerator Cooling Repair",
      "Front & Top Load Washing Machine Repair",
      "Microwave Oven & Electric Geyser Servicing"
    ],
    address: "CoolTech Appliance Hub / Doorstep Service",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&auto=format&fit=crop&q=60",
    description: "Certified refrigeration and AC technician specializing in high-pressure foam jet cleaning, compressor replacement, and electronic board fixes."
  },
  {
    id: "serv_009",
    name: "Dr. Neha Kapoor",
    category: "Diagnostic & Pathology",
    title: "Pathology Lab Sample Collection & Health Checkup",
    phone: "+91 98990 12345",
    whatsapp: "919899012345",
    experience: "7+ Years",
    visitingFee: 150,
    rating: 4.9,
    reviewsCount: 178,
    status: "available",
    badges: ["NABL Accredited Lab", "Free Home Sample Pick", "Digital Reports"],
    specialties: [
      "Full Body Preventive Health Checkup",
      "Complete Blood Count (CBC) & ESR Test",
      "Fasting Blood Sugar & HbA1c Diabetes Profile",
      "Thyroid Function Panel (T3, T4, TSH)",
      "Lipid, Liver & Kidney Function Tests (LFT/KFT)"
    ],
    address: "Kapoor Diagnostic Care / Home Sample Collection",
    image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500&auto=format&fit=crop&q=60",
    description: "Convenient, sterile home sample collection by trained phlebotomists with online barcode tracking and 6-hour verified digital reports."
  }
];

class StorageService {
  constructor() {
    this._inventoryCache = null;
    this._profileCache = null;
    this._cartCache = null;
    this._servicesCache = null;
    this._bookingsCache = null;
    this.init();
  }

  init() {
    const existing = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!existing) {
      this.saveInventory(INITIAL_INVENTORY);
    } else {
      try {
        const parsed = JSON.parse(existing);
        // Automatically upgrade if stored inventory is missing medicines or trade supplies
        const hasTradeOrMeds = parsed.some(p => 
          p.category && (p.category.includes('Medicines') || p.category.includes('Plumbing'))
        );
        if (!hasTradeOrMeds || parsed.length < 80) {
          this.saveInventory(INITIAL_INVENTORY);
        }
      } catch (e) {
        this.saveInventory(INITIAL_INVENTORY);
      }
    }

    // Initialize Services
    const existingServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!existingServices) {
      this.saveServices(INITIAL_SERVICES);
    } else {
      try {
        const parsedServ = JSON.parse(existingServices);
        if (!Array.isArray(parsedServ) || parsedServ.length < 9) {
          this.saveServices(INITIAL_SERVICES);
        }
      } catch (e) {
        this.saveServices(INITIAL_SERVICES);
      }
    }

    // Initialize Service Bookings
    const existingBookings = localStorage.getItem(STORAGE_KEYS.SERVICE_BOOKINGS);
    if (!existingBookings) {
      this.saveServiceBookings([]);
    }

    const existingProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!existingProfile) {
      this.saveProfile(DEFAULT_PROFILE);
    } else {
      try {
        const p = JSON.parse(existingProfile);
        if (p.shopName === "GreenLeaf Fresh & Provisions" || p.shopName === "CityMart SuperStore & Local Essentials" || !p.shopName.includes("Local Buddy")) {
          this.saveProfile(DEFAULT_PROFILE);
        }
      } catch (e) {}
    }
  }

  // --- Inventory Operations ---
  getInventory() {
    if (this._inventoryCache) {
      return this._inventoryCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      this._inventoryCache = data ? JSON.parse(data) : [];
      return this._inventoryCache;
    } catch (e) {
      console.error("Error reading inventory from localStorage:", e);
      return [];
    }
  }

  saveInventory(items) {
    try {
      this._inventoryCache = items;
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
      return true;
    } catch (e) {
      console.error("Error saving inventory to localStorage:", e);
      return false;
    }
  }

  addProduct(productData) {
    const items = this.getInventory();
    const newProduct = {
      id: "prod_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      lastUpdated: new Date().toISOString(),
      ...productData
    };
    items.unshift(newProduct);
    this.saveInventory(items);
    return newProduct;
  }

  updateProduct(productId, updatedFields) {
    const items = this.getInventory();
    const index = items.findIndex(item => item.id === productId);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updatedFields,
        lastUpdated: new Date().toISOString()
      };
      this.saveInventory(items);
      return items[index];
    }
    return null;
  }

  deleteProduct(productId) {
    const items = this.getInventory();
    const filtered = items.filter(item => item.id !== productId);
    this.saveInventory(filtered);
    return true;
  }

  updateStock(productId, delta) {
    const items = this.getInventory();
    const item = items.find(i => i.id === productId);
    if (item) {
      const newStock = Math.max(0, (parseInt(item.stock, 10) || 0) + delta);
      item.stock = newStock;
      item.lastUpdated = new Date().toISOString();
      this.saveInventory(items);
      return item;
    }
    return null;
  }

  resetDefaultCatalog() {
    this.saveInventory(INITIAL_INVENTORY);
    this.resetServices();
    return INITIAL_INVENTORY;
  }

  // --- Service Providers Operations ---
  getServices() {
    if (this._servicesCache) {
      return this._servicesCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
      this._servicesCache = data ? JSON.parse(data) : INITIAL_SERVICES;
      return this._servicesCache;
    } catch (e) {
      console.error("Error reading services:", e);
      return INITIAL_SERVICES;
    }
  }

  saveServices(services) {
    try {
      this._servicesCache = services;
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      return true;
    } catch (e) {
      console.error("Error saving services:", e);
      return false;
    }
  }

  addService(serviceData) {
    const services = this.getServices();
    const newService = {
      id: "serv_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      rating: 5.0,
      reviewsCount: 1,
      status: "available",
      badges: ["Verified Pro", "Neighborhood Partner"],
      ...serviceData
    };
    services.unshift(newService);
    this.saveServices(services);
    return newService;
  }

  updateService(serviceId, updatedFields) {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === serviceId);
    if (index !== -1) {
      services[index] = {
        ...services[index],
        ...updatedFields
      };
      this.saveServices(services);
      return services[index];
    }
    return null;
  }

  deleteService(serviceId) {
    const services = this.getServices();
    const filtered = services.filter(s => s.id !== serviceId);
    this.saveServices(filtered);
    return true;
  }

  toggleServiceAvailability(serviceId) {
    const services = this.getServices();
    const service = services.find(s => s.id === serviceId);
    if (service) {
      service.status = service.status === 'available' ? 'busy' : 'available';
      this.saveServices(services);
      return service;
    }
    return null;
  }

  resetServices() {
    this.saveServices(INITIAL_SERVICES);
    return INITIAL_SERVICES;
  }

  // --- Service Bookings Operations ---
  getServiceBookings() {
    if (this._bookingsCache) {
      return this._bookingsCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICE_BOOKINGS);
      this._bookingsCache = data ? JSON.parse(data) : [];
      return this._bookingsCache;
    } catch (e) {
      console.error("Error reading bookings:", e);
      return [];
    }
  }

  saveServiceBookings(bookings) {
    try {
      this._bookingsCache = bookings;
      localStorage.setItem(STORAGE_KEYS.SERVICE_BOOKINGS, JSON.stringify(bookings));
      return true;
    } catch (e) {
      console.error("Error saving bookings:", e);
      return false;
    }
  }

  addServiceBooking(bookingData) {
    const bookings = this.getServiceBookings();
    const newBooking = {
      id: "book_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      status: "Pending", // "Pending", "Confirmed", "Completed", "Cancelled"
      ...bookingData
    };
    bookings.unshift(newBooking);
    this.saveServiceBookings(bookings);
    return newBooking;
  }

  updateBookingStatus(bookingId, status) {
    const bookings = this.getServiceBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = status;
      booking.updatedAt = new Date().toISOString();
      this.saveServiceBookings(bookings);
      return booking;
    }
    return null;
  }

  // --- Store Profile Operations ---
  getProfile() {
    if (this._profileCache) {
      return this._profileCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      this._profileCache = data ? JSON.parse(data) : DEFAULT_PROFILE;
      return this._profileCache;
    } catch (e) {
      return DEFAULT_PROFILE;
    }
  }

  saveProfile(profileData) {
    try {
      this._profileCache = profileData;
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profileData));
      return true;
    } catch (e) {
      console.error("Error saving profile:", e);
      return false;
    }
  }

  // --- Cart Operations (For Customer View) ---
  getCart() {
    if (this._cartCache) {
      return this._cartCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      this._cartCache = data ? JSON.parse(data) : [];
      return this._cartCache;
    } catch (e) {
      return [];
    }
  }

  saveCart(cartItems) {
    try {
      this._cartCache = cartItems;
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
    } catch (e) {
      console.error("Error saving cart:", e);
    }
  }

  clearCart() {
    this._cartCache = [];
    localStorage.removeItem(STORAGE_KEYS.CART);
  }

  // --- Theme preference ---
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  }

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  // --- Export / Import ---
  exportJSON() {
    const data = {
      profile: this.getProfile(),
      inventory: this.getInventory(),
      services: this.getServices(),
      bookings: this.getServiceBookings(),
      exportedAt: new Date().toISOString(),
      version: "2.0"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localbuddy_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportCSV() {
    const items = this.getInventory();
    if (!items.length) return;

    const headers = ["ID", "Name", "Category", "SKU", "Cost Price", "Selling Price", "Stock", "Unit", "Min Alert", "Expiry", "Description"];
    const rows = items.map(i => [
      i.id,
      `"${(i.name || '').replace(/"/g, '""')}"`,
      `"${(i.category || '').replace(/"/g, '""')}"`,
      `"${(i.sku || '').replace(/"/g, '""')}"`,
      i.costPrice,
      i.sellingPrice,
      i.stock,
      `"${(i.unit || '').replace(/"/g, '""')}"`,
      i.lowStockThreshold,
      i.expiry || '',
      `"${(i.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `localbuddy_inventory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.inventory && Array.isArray(parsed.inventory)) {
        this.saveInventory(parsed.inventory);
        if (parsed.profile) {
          this.saveProfile(parsed.profile);
        }
        if (parsed.services && Array.isArray(parsed.services)) {
          this.saveServices(parsed.services);
        }
        if (parsed.bookings && Array.isArray(parsed.bookings)) {
          this.saveServiceBookings(parsed.bookings);
        }
        return { success: true, count: parsed.inventory.length };
      } else if (Array.isArray(parsed)) {
        this.saveInventory(parsed);
        return { success: true, count: parsed.length };
      }
      return { success: false, error: "Invalid data format: Expected inventory array." };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// Global instance
window.storageService = new StorageService();
