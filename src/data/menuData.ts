export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  available: boolean;
  featured: boolean;
  tag?: string;
  prep_time: "fast" | "medium" | "slow";
  profit_tag: "high" | "medium" | "low";
  views: number;
  clicks: number;
}

export const initialMenuItems: MenuItem[] = [
  // Starters
  { id: 1, name: "Paneer Tikka", price: 299, category: "Starters", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop", description: "Marinated paneer cubes grilled in tandoor. Smoky, juicy, served with mint chutney.", available: true, featured: true, prep_time: "medium", profit_tag: "high", views: 145, clicks: 42 },
  { id: 2, name: "Samosa (2 pcs)", price: 59, category: "Starters", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop", description: "Crispy golden pastry stuffed with spiced potato and peas. Classic street food.", available: true, featured: false, prep_time: "fast", profit_tag: "medium", views: 267, clicks: 34 },
  { id: 3, name: "Veg Spring Rolls", price: 129, category: "Starters", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop", description: "Crispy rolls packed with stir-fried vegetables. Served with sweet chilli dip.", available: true, featured: false, prep_time: "fast", profit_tag: "medium", views: 89, clicks: 18 },
  { id: 4, name: "Hara Bhara Kebab", price: 179, category: "Starters", image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop", description: "Spinach-pea patties spiced with herbs. Pan-fried till golden.", available: true, featured: false, prep_time: "fast", profit_tag: "medium", views: 74, clicks: 21 },
  // Mains
  { id: 5, name: "Butter Chicken", price: 349, category: "Mains", image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop", description: "Tender chicken in a rich creamy tomato-butter gravy. All-time favourite.", available: true, featured: true, prep_time: "medium", profit_tag: "high", views: 289, clicks: 98 },
  { id: 6, name: "Paneer Butter Masala", price: 299, category: "Mains", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop", description: "Soft paneer in a velvety tomato-cream gravy. Best paired with naan.", available: true, featured: true, prep_time: "medium", profit_tag: "high", views: 211, clicks: 76 },
  { id: 7, name: "Dal Makhani", price: 249, category: "Mains", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop", description: "Slow-cooked black lentils in a creamy buttery gravy. Comfort in a bowl.", available: true, featured: false, prep_time: "slow", profit_tag: "high", views: 234, clicks: 67 },
  { id: 8, name: "Chicken Biryani", price: 329, category: "Mains", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop", description: "Fragrant basmati rice layered with spiced chicken. Served with raita.", available: true, featured: false, prep_time: "slow", profit_tag: "high", views: 367, clicks: 89 },
  { id: 9, name: "Veg Biryani", price: 249, category: "Mains", image: "https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&h=300&fit=crop", description: "Aromatic basmati rice with seasonal vegetables and whole spices.", available: true, featured: false, prep_time: "slow", profit_tag: "medium", views: 182, clicks: 44 },
  { id: 10, name: "Chole Bhature", price: 179, category: "Mains", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop", description: "Spiced chickpeas with fluffy deep-fried bhature. Classic Punjabi.", available: true, featured: false, prep_time: "medium", profit_tag: "medium", views: 298, clicks: 87 },
  { id: 11, name: "Rajma Chawal", price: 199, category: "Mains", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop", description: "Slow-cooked red kidney beans in spiced gravy. Served with steamed rice.", available: true, featured: false, prep_time: "slow", profit_tag: "medium", views: 156, clicks: 38 },
  { id: 12, name: "Palak Paneer", price: 279, category: "Mains", image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop", description: "Fresh paneer in a vibrant spinach gravy. Healthy and flavourful.", available: true, featured: false, prep_time: "medium", profit_tag: "high", views: 167, clicks: 51 },
  // Combos
  { id: 13, name: "Veg Thali Special", price: 399, category: "Combos", image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=300&fit=crop", description: "Dal makhani + Paneer + Rice + 2 Roti + Salad + Dessert. Complete meal.", available: true, featured: true, prep_time: "medium", profit_tag: "high", views: 198, clicks: 72 },
  { id: 14, name: "Chicken Thali", price: 449, category: "Combos", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop", description: "Butter chicken + Rice + 2 Roti + Salad + Raita + Sweet. Best value.", available: true, featured: true, prep_time: "medium", profit_tag: "high", views: 312, clicks: 124 },
  { id: 15, name: "Paneer Combo Meal", price: 349, category: "Combos", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop", description: "Paneer butter masala + 2 Naan + Rice + Raita + Gulab Jamun. Filling.", available: true, featured: true, prep_time: "medium", profit_tag: "high", views: 244, clicks: 93 },
  // Breakfast
  { id: 16, name: "Masala Dosa", price: 199, category: "Breakfast", image: "https://images.unsplash.com/photo-1668236543090-82eba5eea6ca?w=400&h=300&fit=crop", description: "Crispy rice crepe filled with spiced potato. With sambar & coconut chutney.", available: true, featured: true, prep_time: "fast", profit_tag: "medium", views: 412, clicks: 156 },
  { id: 17, name: "Idli Sambar (4 pcs)", price: 129, category: "Breakfast", image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop", description: "Steamed rice cakes with hot lentil sambar and coconut chutney.", available: true, featured: false, prep_time: "fast", profit_tag: "medium", views: 198, clicks: 63 },
  { id: 18, name: "Aloo Paratha", price: 79, category: "Breakfast", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop", description: "Whole wheat flatbread stuffed with spiced potato. Served with curd.", available: true, featured: false, prep_time: "fast", profit_tag: "medium", views: 175, clicks: 52 },
  // Breads
  { id: 19, name: "Butter Naan", price: 49, category: "Breads", image: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&h=300&fit=crop", description: "Soft fluffy tandoor-baked bread glazed with butter. Perfect with curries.", available: true, featured: false, prep_time: "fast", profit_tag: "high", views: 423, clicks: 167 },
  { id: 20, name: "Garlic Naan", price: 59, category: "Breads", image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=300&fit=crop", description: "Naan topped with roasted garlic and fresh coriander. Fragrant and irresistible.", available: true, featured: false, prep_time: "fast", profit_tag: "high", views: 387, clicks: 154 },
  // Desserts
  { id: 21, name: "Gulab Jamun (2 pcs)", price: 99, category: "Desserts", image: "https://images.unsplash.com/photo-1627303795478-d0e2e5a4a1e8?w=400&h=300&fit=crop", description: "Soft milk-solid balls soaked in rose-scented sugar syrup. Served warm.", available: true, featured: false, prep_time: "fast", profit_tag: "low", views: 178, clicks: 12 },
  { id: 22, name: "Rasmalai", price: 129, category: "Desserts", image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=300&fit=crop", description: "Cottage cheese dumplings in saffron-flavoured cream. Chilled dessert.", available: true, featured: false, prep_time: "fast", profit_tag: "medium", views: 143, clicks: 29 },
  // Beverages
  { id: 23, name: "Filter Coffee", price: 49, category: "Beverages", image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=300&fit=crop", description: "Traditional South Indian decoction coffee with milk. Strong and aromatic.", available: true, featured: false, prep_time: "fast", profit_tag: "medium", views: 523, clicks: 178 },
  { id: 24, name: "Mango Lassi", price: 79, category: "Beverages", image: "https://images.unsplash.com/photo-1590080876614-bc8104e62908?w=400&h=300&fit=crop", description: "Thick yogurt drink blended with Alphonso mango pulp. Summer favourite.", available: true, featured: false, prep_time: "fast", profit_tag: "medium", views: 189, clicks: 45 },
  { id: 25, name: "Sweet Lassi", price: 69, category: "Beverages", image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop", description: "Chilled yogurt blended with sugar and cardamom. Refreshingly light.", available: true, featured: false, prep_time: "fast", profit_tag: "medium", views: 134, clicks: 37 },
  { id: 26, name: "Masala Chai", price: 39, category: "Beverages", image: "https://images.unsplash.com/photo-1567922045116-2a00fae2ed03?w=400&h=300&fit=crop", description: "Spiced tea brewed with ginger, cardamom and cinnamon. The classic.", available: true, featured: false, prep_time: "fast", profit_tag: "medium", views: 467, clicks: 189 },
];

// Combo suggestions shown in item detail modal
export const comboSuggestions: Record<string, string[]> = {
  "Paneer Tikka":         ["Butter Naan", "Mango Lassi"],
  "Paneer Butter Masala": ["Garlic Naan", "Sweet Lassi", "Gulab Jamun (2 pcs)"],
  "Palak Paneer":         ["Butter Naan", "Masala Chai"],
  "Chole Bhature":        ["Mango Lassi", "Gulab Jamun (2 pcs)"],
  "Butter Chicken":       ["Garlic Naan", "Sweet Lassi"],
  "Chicken Biryani":      ["Mango Lassi", "Rasmalai"],
  "Dal Makhani":          ["Butter Naan", "Masala Chai"],
  "Masala Dosa":          ["Filter Coffee"],
};
