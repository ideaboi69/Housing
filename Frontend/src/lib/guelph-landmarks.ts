export type LandmarkType =
  | "campus"
  | "grocery"
  | "gym"
  | "shopping"
  | "transit"
  | "park"
  | "recreation"
  | "food"
  | "health"
  | "library"
  | "area";

export const LANDMARK_TYPES: Record<LandmarkType, { color: string; label: string; emoji: string }> = {
  campus: { color: "#1B2D45", label: "Campus", emoji: "🎓" },
  grocery: { color: "#4ADE80", label: "Groceries", emoji: "🥬" },
  gym: { color: "#2EC4B6", label: "Gyms", emoji: "💪" },
  shopping: { color: "#FF6B35", label: "Shopping", emoji: "🛍️" },
  transit: { color: "#1B2D45", label: "Transit", emoji: "🚌" },
  park: { color: "#86EFAC", label: "Parks & Trails", emoji: "🌿" },
  recreation: { color: "#2EC4B6", label: "Rec", emoji: "🏊" },
  food: { color: "#FFB627", label: "Food", emoji: "☕" },
  health: { color: "#E71D36", label: "Health", emoji: "🏥" },
  library: { color: "#A78BFA", label: "Library", emoji: "📚" },
  area: { color: "#98A3B0", label: "Area", emoji: "📍" },
};

export const MAP_VIEW_LANDMARK_ORDER: LandmarkType[] = ["campus", "grocery", "gym", "park", "transit"];

export const DEFAULT_MAP_VIEW_LANDMARKS = new Set<LandmarkType>(["campus", "grocery", "gym", "park"]);

export const DEFAULT_DETAIL_LANDMARKS = new Set<LandmarkType>([
  "campus",
  "grocery",
  "gym",
  "park",
  "transit",
]);

export const GUELPH_LANDMARKS: Array<{
  name: string;
  lat: number;
  lng: number;
  emoji: string;
  type: LandmarkType;
}> = [
  { name: "Guelph Campus", lat: 43.5305, lng: -80.2262, emoji: "🎓", type: "campus" },
  { name: "Athletics Centre", lat: 43.532, lng: -80.229, emoji: "🏟️", type: "campus" },
  { name: "McLaughlin Library", lat: 43.531, lng: -80.2265, emoji: "📚", type: "campus" },

  { name: "Zehrs (Stone Road)", lat: 43.5185, lng: -80.2523, emoji: "🥬", type: "grocery" },
  { name: "Walmart Supercentre", lat: 43.5148, lng: -80.256, emoji: "🛒", type: "grocery" },
  { name: "FreshCo (Eramosa)", lat: 43.546, lng: -80.231, emoji: "🥬", type: "grocery" },
  { name: "Metro (Paisley)", lat: 43.542, lng: -80.271, emoji: "🥬", type: "grocery" },
  { name: "Food Basics (Speedvale)", lat: 43.558, lng: -80.253, emoji: "🥬", type: "grocery" },

  { name: "GoodLife Fitness", lat: 43.546, lng: -80.234, emoji: "💪", type: "gym" },
  { name: "Movati Athletic", lat: 43.518, lng: -80.258, emoji: "💪", type: "gym" },
  { name: "Fit4Less (Edinburgh)", lat: 43.523, lng: -80.241, emoji: "💪", type: "gym" },
  { name: "Crunch Fitness", lat: 43.519, lng: -80.25, emoji: "💪", type: "gym" },

  { name: "Stone Road Mall", lat: 43.5195, lng: -80.249, emoji: "🛍️", type: "shopping" },
  { name: "Canadian Tire", lat: 43.515, lng: -80.26, emoji: "🔧", type: "shopping" },
  { name: "LCBO (Stone Road)", lat: 43.519, lng: -80.251, emoji: "🍷", type: "shopping" },

  { name: "Guelph Central Station", lat: 43.5464, lng: -80.2559, emoji: "🚌", type: "transit" },

  { name: "Royal City Park", lat: 43.55, lng: -80.253, emoji: "🌳", type: "park" },
  { name: "Riverside Park", lat: 43.544, lng: -80.26, emoji: "🌳", type: "park" },
  { name: "Preservation Park Trails", lat: 43.5128, lng: -80.2732, emoji: "🥾", type: "park" },
  { name: "The Arboretum Trails", lat: 43.5376, lng: -80.2189, emoji: "🥾", type: "park" },
  { name: "Exhibition Park", lat: 43.539, lng: -80.21, emoji: "🌳", type: "park" },
  { name: "South End Rec Centre", lat: 43.513, lng: -80.242, emoji: "🏊", type: "recreation" },
  { name: "West End Rec Centre", lat: 43.537, lng: -80.278, emoji: "🏊", type: "recreation" },

  { name: "Downtown Guelph", lat: 43.5464, lng: -80.2489, emoji: "🏙️", type: "area" },
  { name: "Planet Bean Coffee", lat: 43.5467, lng: -80.2475, emoji: "☕", type: "food" },
  { name: "The Albion Hotel", lat: 43.547, lng: -80.25, emoji: "🍺", type: "food" },

  { name: "Guelph General Hospital", lat: 43.543, lng: -80.243, emoji: "🏥", type: "health" },
  { name: "Health Services", lat: 43.53, lng: -80.225, emoji: "🏥", type: "health" },

  { name: "Guelph Public Library", lat: 43.547, lng: -80.252, emoji: "📖", type: "library" },
];
