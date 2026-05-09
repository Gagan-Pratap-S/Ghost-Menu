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
  tags?: string[];
}

export const initialMenuItems: MenuItem[] = [
  { id:1,  name:"Paneer Tikka",          price:299, category:"Starters",  image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop", description:"Marinated paneer grilled in tandoor. Smoky, juicy, with mint chutney.",          available:true, featured:true,  prep_time:"medium", profit_tag:"high",   views:145, clicks:42,  tags:["Veg","Spicy"] },
  { id:2,  name:"Samosa (2 pcs)",        price:59,  category:"Starters",  image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop", description:"Crispy pastry stuffed with spiced potato and peas.",                             available:true, featured:false, prep_time:"fast",   profit_tag:"medium", views:267, clicks:34,  tags:["Veg","Jain"] },
  { id:3,  name:"Veg Spring Rolls",      price:129, category:"Starters",  image:"https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop", description:"Crispy rolls with stir-fried vegetables. Sweet chilli dip.",                     available:true, featured:false, prep_time:"fast",   profit_tag:"medium", views:89,  clicks:18,  tags:["Veg"] },
  { id:4,  name:"Hara Bhara Kebab",      price:179, category:"Starters",  image:"https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop", description:"Spinach-pea patties spiced with herbs. Pan-fried till golden.",                 available:true, featured:false, prep_time:"fast",   profit_tag:"medium", views:74,  clicks:21,  tags:["Veg","Jain"] },
  { id:5,  name:"Butter Chicken",        price:349, category:"Mains",     image:"https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop", description:"Tender chicken in a rich creamy tomato-butter gravy.",                          available:true, featured:true,  prep_time:"medium", profit_tag:"high",   views:289, clicks:98,  tags:["Spicy"] },
  { id:6,  name:"Paneer Butter Masala",  price:299, category:"Mains",     image:"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop", description:"Soft paneer in a velvety tomato-cream gravy.",                                   available:true, featured:true,  prep_time:"medium", profit_tag:"high",   views:211, clicks:76,  tags:["Veg"] },
  { id:7,  name:"Dal Makhani",           price:249, category:"Mains",     image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop", description:"Slow-cooked black lentils in a creamy buttery gravy.",                           available:true, featured:false, prep_time:"slow",   profit_tag:"high",   views:234, clicks:67,  tags:["Veg","Gluten-free"] },
  { id:8,  name:"Chicken Biryani",       price:329, category:"Mains",     image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop", description:"Fragrant basmati rice layered with spiced chicken.",                             available:true, featured:false, prep_time:"slow",   profit_tag:"high",   views:367, clicks:89,  tags:["Spicy"] },
  { id:9,  name:"Veg Biryani",           price:249, category:"Mains",     image:"https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&h=300&fit=crop", description:"Aromatic basmati rice with seasonal vegetables.",                                available:true, featured:false, prep_time:"slow",   profit_tag:"medium", views:182, clicks:44,  tags:["Veg","Jain"] },
  { id:10, name:"Chole Bhature",         price:179, category:"Mains",     image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop", description:"Spiced chickpeas with fluffy deep-fried bhature.",                              available:true, featured:false, prep_time:"medium", profit_tag:"medium", views:298, clicks:87,  tags:["Veg"] },
  { id:11, name:"Veg Thali Special",     price:399, category:"Combos",    image:"https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=300&fit=crop", description:"Dal makhani + Paneer + Rice + 2 Roti + Salad + Dessert.",                        available:true, featured:true,  prep_time:"medium", profit_tag:"high",   views:198, clicks:72,  tags:["Veg"] },
  { id:12, name:"Chicken Thali",         price:449, category:"Combos",    image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop", description:"Butter chicken + Rice + 2 Roti + Salad + Raita + Sweet.",                       available:true, featured:true,  prep_time:"medium", profit_tag:"high",   views:312, clicks:124, tags:[] },
  { id:13, name:"Masala Dosa",           price:199, category:"Breakfast", image:"https://images.unsplash.com/photo-1668236543090-82eba5eea6ca?w=400&h=300&fit=crop", description:"Crispy rice crepe with sambar and coconut chutney.",                             available:true, featured:true,  prep_time:"fast",   profit_tag:"medium", views:412, clicks:156, tags:["Veg","Gluten-free"] },
  { id:14, name:"Aloo Paratha",          price:79,  category:"Breakfast", image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop", description:"Whole wheat flatbread stuffed with spiced potato.",                              available:true, featured:false, prep_time:"fast",   profit_tag:"medium", views:175, clicks:52,  tags:["Veg","Jain"] },
  { id:15, name:"Butter Naan",           price:49,  category:"Breads",    image:"https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&h=300&fit=crop", description:"Fluffy tandoor-baked bread glazed with butter.",                                 available:true, featured:false, prep_time:"fast",   profit_tag:"high",   views:423, clicks:167, tags:["Veg"] },
  { id:16, name:"Garlic Naan",           price:59,  category:"Breads",    image:"https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=300&fit=crop", description:"Naan topped with roasted garlic and coriander.",                                 available:true, featured:false, prep_time:"fast",   profit_tag:"high",   views:387, clicks:154, tags:["Veg"] },
  { id:17, name:"Gulab Jamun (2 pcs)",   price:99,  category:"Desserts",  image:"https://images.unsplash.com/photo-1627303795478-d0e2e5a4a1e8?w=400&h=300&fit=crop", description:"Soft milk-solid balls in rose-scented sugar syrup.",                             available:true, featured:false, prep_time:"fast",   profit_tag:"low",    views:178, clicks:12,  tags:["Veg","Gluten-free"] },
  { id:18, name:"Rasmalai",              price:129, category:"Desserts",  image:"https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=300&fit=crop", description:"Cottage cheese dumplings in saffron-flavoured cream.",                          available:true, featured:false, prep_time:"fast",   profit_tag:"medium", views:143, clicks:29,  tags:["Veg","Gluten-free"] },
  { id:19, name:"Mango Lassi",           price:79,  category:"Beverages", image:"https://images.unsplash.com/photo-1590080876614-bc8104e62908?w=400&h=300&fit=crop", description:"Thick yogurt drink blended with Alphonso mango pulp.",                          available:true, featured:false, prep_time:"fast",   profit_tag:"medium", views:189, clicks:45,  tags:["Veg","Gluten-free"] },
  { id:20, name:"Masala Chai",           price:39,  category:"Beverages", image:"https://images.unsplash.com/photo-1567922045116-2a00fae2ed03?w=400&h=300&fit=crop", description:"Spiced tea with ginger, cardamom and cinnamon.",                                available:true, featured:false, prep_time:"fast",   profit_tag:"medium", views:467, clicks:189, tags:["Veg","Gluten-free"] },
];

export const comboSuggestions: Record<string, string[]> = {
  "Paneer Tikka":         ["Butter Naan", "Mango Lassi"],
  "Paneer Butter Masala": ["Garlic Naan", "Gulab Jamun (2 pcs)"],
  "Butter Chicken":       ["Garlic Naan", "Mango Lassi"],
  "Chicken Biryani":      ["Mango Lassi", "Rasmalai"],
  "Dal Makhani":          ["Butter Naan", "Masala Chai"],
  "Masala Dosa":          ["Masala Chai"],
  "Chole Bhature":        ["Mango Lassi"],
};
