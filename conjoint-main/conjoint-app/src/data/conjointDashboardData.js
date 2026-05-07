export const datasets = [
  {
    id: "cars",
    name: "Car Preferences",
    description: "How different car buyers trade off cost, brand, powertrain, and safety.",
    personas: [
      {
        id: "budget-buyer",
        name: "Budget Buyer",
        description: "Prioritizes affordability and practical ownership costs.",
        attributes: [
          {
            id: "price",
            name: "Price",
            importance: 0.4,
            levels: [
              { id: "low", name: "Low", utility: 30 },
              { id: "medium", name: "Medium", utility: 10 },
              { id: "high", name: "High", utility: -20 }
            ]
          },
          {
            id: "brand",
            name: "Brand",
            importance: 0.2,
            levels: [
              { id: "economy", name: "Economy", utility: 18 },
              { id: "mainstream", name: "Mainstream", utility: 8 },
              { id: "premium", name: "Premium", utility: -6 }
            ]
          },
          {
            id: "fuel-type",
            name: "Fuel Type",
            importance: 0.18,
            levels: [
              { id: "petrol", name: "Petrol", utility: 10 },
              { id: "hybrid", name: "Hybrid", utility: 14 },
              { id: "electric", name: "Electric", utility: 4 }
            ]
          },
          {
            id: "safety",
            name: "Safety",
            importance: 0.22,
            levels: [
              { id: "basic", name: "Basic", utility: -12 },
              { id: "standard", name: "Standard", utility: 8 },
              { id: "advanced", name: "Advanced", utility: 22 }
            ]
          }
        ]
      },
      {
        id: "luxury-seeker",
        name: "Luxury Seeker",
        description: "Optimizes for status, comfort, and premium ownership signals.",
        attributes: [
          {
            id: "price",
            name: "Price",
            importance: 0.15,
            levels: [
              { id: "low", name: "Low", utility: -10 },
              { id: "medium", name: "Medium", utility: 5 },
              { id: "high", name: "High", utility: 22 }
            ]
          },
          {
            id: "brand",
            name: "Brand",
            importance: 0.36,
            levels: [
              { id: "economy", name: "Economy", utility: -18 },
              { id: "mainstream", name: "Mainstream", utility: 6 },
              { id: "premium", name: "Premium", utility: 28 }
            ]
          },
          {
            id: "fuel-type",
            name: "Fuel Type",
            importance: 0.12,
            levels: [
              { id: "petrol", name: "Petrol", utility: 4 },
              { id: "hybrid", name: "Hybrid", utility: 12 },
              { id: "electric", name: "Electric", utility: 18 }
            ]
          },
          {
            id: "safety",
            name: "Safety",
            importance: 0.37,
            levels: [
              { id: "basic", name: "Basic", utility: -20 },
              { id: "standard", name: "Standard", utility: 10 },
              { id: "advanced", name: "Advanced", utility: 30 }
            ]
          }
        ]
      },
      {
        id: "family-user",
        name: "Family User",
        description: "Balances value with reliability, comfort, and protection for passengers.",
        attributes: [
          {
            id: "price",
            name: "Price",
            importance: 0.25,
            levels: [
              { id: "low", name: "Low", utility: 15 },
              { id: "medium", name: "Medium", utility: 8 },
              { id: "high", name: "High", utility: -15 }
            ]
          },
          {
            id: "brand",
            name: "Brand",
            importance: 0.18,
            levels: [
              { id: "economy", name: "Economy", utility: 2 },
              { id: "mainstream", name: "Mainstream", utility: 12 },
              { id: "premium", name: "Premium", utility: 5 }
            ]
          },
          {
            id: "fuel-type",
            name: "Fuel Type",
            importance: 0.17,
            levels: [
              { id: "petrol", name: "Petrol", utility: 4 },
              { id: "hybrid", name: "Hybrid", utility: 20 },
              { id: "electric", name: "Electric", utility: 10 }
            ]
          },
          {
            id: "safety",
            name: "Safety",
            importance: 0.4,
            levels: [
              { id: "basic", name: "Basic", utility: -24 },
              { id: "standard", name: "Standard", utility: 12 },
              { id: "advanced", name: "Advanced", utility: 32 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "smartphones",
    name: "Smartphone Preferences",
    description: "How different phone shoppers weigh camera, battery, gaming, and price.",
    personas: [
      {
        id: "gamer",
        name: "Gamer",
        description: "Cares about performance, thermals, and battery endurance under heavy use.",
        attributes: [
          {
            id: "price",
            name: "Price",
            importance: 0.18,
            levels: [
              { id: "budget", name: "Budget", utility: 8 },
              { id: "midrange", name: "Midrange", utility: 12 },
              { id: "premium", name: "Premium", utility: 4 }
            ]
          },
          {
            id: "camera",
            name: "Camera",
            importance: 0.14,
            levels: [
              { id: "good", name: "Good", utility: 4 },
              { id: "great", name: "Great", utility: 8 },
              { id: "pro", name: "Pro", utility: 10 }
            ]
          },
          {
            id: "battery",
            name: "Battery",
            importance: 0.26,
            levels: [
              { id: "one-day", name: "One-Day", utility: -10 },
              { id: "long", name: "Long", utility: 14 },
              { id: "ultra", name: "Ultra", utility: 24 }
            ]
          },
          {
            id: "performance",
            name: "Performance",
            importance: 0.42,
            levels: [
              { id: "casual", name: "Casual", utility: -25 },
              { id: "fast", name: "Fast", utility: 10 },
              { id: "elite", name: "Elite", utility: 32 }
            ]
          }
        ]
      },
      {
        id: "photographer",
        name: "Photographer",
        description: "Wants image quality, editing flexibility, and dependable all-day power.",
        attributes: [
          {
            id: "price",
            name: "Price",
            importance: 0.16,
            levels: [
              { id: "budget", name: "Budget", utility: -6 },
              { id: "midrange", name: "Midrange", utility: 8 },
              { id: "premium", name: "Premium", utility: 16 }
            ]
          },
          {
            id: "camera",
            name: "Camera",
            importance: 0.45,
            levels: [
              { id: "good", name: "Good", utility: -14 },
              { id: "great", name: "Great", utility: 12 },
              { id: "pro", name: "Pro", utility: 34 }
            ]
          },
          {
            id: "battery",
            name: "Battery",
            importance: 0.24,
            levels: [
              { id: "one-day", name: "One-Day", utility: -8 },
              { id: "long", name: "Long", utility: 14 },
              { id: "ultra", name: "Ultra", utility: 22 }
            ]
          },
          {
            id: "performance",
            name: "Performance",
            importance: 0.15,
            levels: [
              { id: "casual", name: "Casual", utility: 0 },
              { id: "fast", name: "Fast", utility: 10 },
              { id: "elite", name: "Elite", utility: 18 }
            ]
          }
        ]
      },
      {
        id: "minimal-user",
        name: "Minimal User",
        description: "Wants reliable essentials without paying for features they will not use.",
        attributes: [
          {
            id: "price",
            name: "Price",
            importance: 0.37,
            levels: [
              { id: "budget", name: "Budget", utility: 28 },
              { id: "midrange", name: "Midrange", utility: 10 },
              { id: "premium", name: "Premium", utility: -20 }
            ]
          },
          {
            id: "camera",
            name: "Camera",
            importance: 0.15,
            levels: [
              { id: "good", name: "Good", utility: 12 },
              { id: "great", name: "Great", utility: 8 },
              { id: "pro", name: "Pro", utility: -4 }
            ]
          },
          {
            id: "battery",
            name: "Battery",
            importance: 0.31,
            levels: [
              { id: "one-day", name: "One-Day", utility: -6 },
              { id: "long", name: "Long", utility: 16 },
              { id: "ultra", name: "Ultra", utility: 22 }
            ]
          },
          {
            id: "performance",
            name: "Performance",
            importance: 0.17,
            levels: [
              { id: "casual", name: "Casual", utility: 10 },
              { id: "fast", name: "Fast", utility: 8 },
              { id: "elite", name: "Elite", utility: -6 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pizza",
    name: "Pizza Preferences",
    description: "What different diners value when choosing a pizza offer.",
    personas: [
      {
        id: "value-hunter",
        name: "Value Hunter",
        description: "Optimizes for price, familiar flavors, and dependable satisfaction.",
        attributes: [
          {
            id: "price",
            name: "Price",
            importance: 0.38,
            levels: [
              { id: "low", name: "Low", utility: 26 },
              { id: "medium", name: "Medium", utility: 10 },
              { id: "high", name: "High", utility: -18 }
            ]
          },
          {
            id: "crust",
            name: "Crust",
            importance: 0.18,
            levels: [
              { id: "classic", name: "Classic", utility: 16 },
              { id: "thin", name: "Thin", utility: 8 },
              { id: "stuffed", name: "Stuffed", utility: 4 }
            ]
          },
          {
            id: "protein",
            name: "Protein",
            importance: 0.22,
            levels: [
              { id: "veg", name: "Veg", utility: -6 },
              { id: "chicken", name: "Chicken", utility: 16 },
              { id: "pepperoni", name: "Pepperoni", utility: 20 }
            ]
          },
          {
            id: "spice",
            name: "Spice Level",
            importance: 0.22,
            levels: [
              { id: "mild", name: "Mild", utility: 18 },
              { id: "medium", name: "Medium", utility: 10 },
              { id: "hot", name: "Hot", utility: -8 }
            ]
          }
        ]
      },
      {
        id: "foodie-explorer",
        name: "Foodie Explorer",
        description: "Looks for bold flavor combinations and premium craft cues.",
        attributes: [
          {
            id: "price",
            name: "Price",
            importance: 0.14,
            levels: [
              { id: "low", name: "Low", utility: -8 },
              { id: "medium", name: "Medium", utility: 10 },
              { id: "high", name: "High", utility: 18 }
            ]
          },
          {
            id: "crust",
            name: "Crust",
            importance: 0.26,
            levels: [
              { id: "classic", name: "Classic", utility: -2 },
              { id: "thin", name: "Thin", utility: 18 },
              { id: "stuffed", name: "Stuffed", utility: 24 }
            ]
          },
          {
            id: "protein",
            name: "Protein",
            importance: 0.3,
            levels: [
              { id: "veg", name: "Veg", utility: 12 },
              { id: "chicken", name: "Chicken", utility: 18 },
              { id: "pepperoni", name: "Pepperoni", utility: 14 }
            ]
          },
          {
            id: "spice",
            name: "Spice Level",
            importance: 0.3,
            levels: [
              { id: "mild", name: "Mild", utility: -12 },
              { id: "medium", name: "Medium", utility: 12 },
              { id: "hot", name: "Hot", utility: 28 }
            ]
          }
        ]
      },
      {
        id: "health-conscious",
        name: "Health Conscious",
        description: "Prefers balanced portions, lighter ingredients, and better nutritional tradeoffs.",
        attributes: [
          {
            id: "price",
            name: "Price",
            importance: 0.2,
            levels: [
              { id: "low", name: "Low", utility: 10 },
              { id: "medium", name: "Medium", utility: 12 },
              { id: "high", name: "High", utility: -10 }
            ]
          },
          {
            id: "crust",
            name: "Crust",
            importance: 0.21,
            levels: [
              { id: "classic", name: "Classic", utility: 4 },
              { id: "thin", name: "Thin", utility: 20 },
              { id: "stuffed", name: "Stuffed", utility: -16 }
            ]
          },
          {
            id: "protein",
            name: "Protein",
            importance: 0.29,
            levels: [
              { id: "veg", name: "Veg", utility: 26 },
              { id: "chicken", name: "Chicken", utility: 18 },
              { id: "pepperoni", name: "Pepperoni", utility: -20 }
            ]
          },
          {
            id: "spice",
            name: "Spice Level",
            importance: 0.3,
            levels: [
              { id: "mild", name: "Mild", utility: 18 },
              { id: "medium", name: "Medium", utility: 12 },
              { id: "hot", name: "Hot", utility: -10 }
            ]
          }
        ]
      }
    ]
  }
];
