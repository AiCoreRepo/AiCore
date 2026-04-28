// ============================================================
// Frontend enum mirrors – match backend Prisma enums exactly
// ============================================================

export const BODY_SHAPES = [
  { value: 'HOURGLASS',         label: 'Hourglass',          icon: '⌛' },
  { value: 'PEAR',              label: 'Pear',               icon: '🍐' },
  { value: 'APPLE',             label: 'Apple',              icon: '🍎' },
  { value: 'RECTANGLE',         label: 'Rectangle',          icon: '▭'  },
  { value: 'INVERTED_TRIANGLE', label: 'Inverted Triangle',  icon: '🔺' },
  { value: 'OVAL',              label: 'Oval',               icon: '⬭'  },
  { value: 'ATHLETIC',          label: 'Athletic',           icon: '💪' },
  { value: 'PETITE',            label: 'Petite',             icon: '🌸' },
  { value: 'PLUS_SIZE',         label: 'Plus Size',          icon: '✨' },
] as const;

export type BodyShapeValue = typeof BODY_SHAPES[number]['value'];

export const SKIN_TONES = [
  { value: 'FAIR',       label: 'Fair',       hex: '#FDDCB5' },
  { value: 'LIGHT',      label: 'Light',      hex: '#F5C9A0' },
  { value: 'MEDIUM',     label: 'Medium',     hex: '#D4936A' },
  { value: 'OLIVE',      label: 'Olive',      hex: '#B5784E' },
  { value: 'TAN',        label: 'Tan',        hex: '#9C6244' },
  { value: 'BROWN',      label: 'Brown',      hex: '#7B4C30' },
  { value: 'DARK_BROWN', label: 'Dark Brown', hex: '#5C3320' },
  { value: 'DEEP',       label: 'Deep',       hex: '#3B1F0F' },
] as const;

export type SkinToneValue = typeof SKIN_TONES[number]['value'];

export const CLOTHING_COLORS = [
  { value: 'BLACK',        label: 'Black',        hex: '#1A1A1A' },
  { value: 'WHITE',        label: 'White',        hex: '#FFFFFF' },
  { value: 'GREY',         label: 'Grey',         hex: '#9E9E9E' },
  { value: 'CHARCOAL',     label: 'Charcoal',     hex: '#37474F' },
  { value: 'NAVY',         label: 'Navy',         hex: '#1A237E' },
  { value: 'ROYAL_BLUE',   label: 'Royal Blue',   hex: '#1565C0' },
  { value: 'SKY_BLUE',     label: 'Sky Blue',     hex: '#81D4FA' },
  { value: 'TEAL',         label: 'Teal',         hex: '#00796B' },
  { value: 'GREEN',        label: 'Green',        hex: '#388E3C' },
  { value: 'OLIVE_GREEN',  label: 'Olive Green',  hex: '#6D8B00' },
  { value: 'MINT',         label: 'Mint',         hex: '#A5F3C4' },
  { value: 'RED',          label: 'Red',          hex: '#C62828' },
  { value: 'MAROON',       label: 'Maroon',       hex: '#880E4F' },
  { value: 'PINK',         label: 'Pink',         hex: '#F06292' },
  { value: 'HOT_PINK',     label: 'Hot Pink',     hex: '#E91E8C' },
  { value: 'CORAL',        label: 'Coral',        hex: '#FF6B6B' },
  { value: 'ORANGE',       label: 'Orange',       hex: '#EF6C00' },
  { value: 'YELLOW',       label: 'Yellow',       hex: '#F9A825' },
  { value: 'GOLD',         label: 'Gold',         hex: '#D4AC0D' },
  { value: 'BEIGE',        label: 'Beige',        hex: '#D7C4A3' },
  { value: 'CREAM',        label: 'Cream',        hex: '#FFFDD0' },
  { value: 'BROWN',        label: 'Brown',        hex: '#6D4C41' },
  { value: 'CHOCOLATE',    label: 'Chocolate',    hex: '#4E342E' },
  { value: 'CARAMEL',      label: 'Caramel',      hex: '#C68642' },
  { value: 'LAVENDER',     label: 'Lavender',     hex: '#CE93D8' },
  { value: 'PURPLE',       label: 'Purple',       hex: '#7B1FA2' },
  { value: 'INDIGO',       label: 'Indigo',       hex: '#3949AB' },
  { value: 'RUST',         label: 'Rust',         hex: '#B7410E' },
  { value: 'OFF_WHITE',    label: 'Off White',    hex: '#FAF9F6' },
  { value: 'MULTI_COLOR',  label: 'Multi Color',  hex: '#FF6384' },
  { value: 'PRINTED',      label: 'Printed',      hex: '#A89BC2' },
  { value: 'OTHER',        label: 'Other',        hex: '#BDBDBD' },
] as const;

export type ClothingColorValue = typeof CLOTHING_COLORS[number]['value'];
