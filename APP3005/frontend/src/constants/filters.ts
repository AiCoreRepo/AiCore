export const SORT_OPTIONS = [
  "Price: Low to High",
  "Price: High to Low",
  "Newest",
  "Most Popular"
] as const;

export type SortOption = typeof SORT_OPTIONS[number];

export const STATIC_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const STATIC_RATINGS = ['4 & above', '3 & above', '2 & above', '1 & above'];
export const STATIC_DISCOUNTS = ['10% and above', '20% and above', '30% and above', '40% and above', '50% and above'];
