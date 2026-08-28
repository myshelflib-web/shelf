export const SHELF_PLANS = {
  free: {
    id: "FREE" as const,
    name: "Free",
    priceLabel: "₹0",
    periodLabel: "forever",
    storageLabel: "100 MB",
    tokensLabel: "50,000 / month",
    features: [
      "Upload PDFs and notes",
      "Highlight while you read",
      "Study AI on your material",
      "Dashboard and calendar",
      "Pin favourite pages",
    ],
  },
  premium: {
    id: "PREMIUM" as const,
    name: "Premium",
    priceInr: 999,
    planDays: 365,
    storageLabel: "1 GB",
    tokensLabel: "1M / month",
    features: [
      "Everything in Free",
      "1 GB upload storage",
      "20× more Study AI tokens",
      "Standard & Deep answer modes",
      "Priority access to new features",
      "Full year of Premium access",
    ],
  },
};
