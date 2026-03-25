/**
 * Creator Upload Flow – Enum Constants
 *
 * These match the Prisma schema enums exactly.
 * Used for validation, display labels, and AI recommendations.
 */

// ============================================
// BODY SHAPE
// ============================================
export enum BodyShape {
  HOURGLASS = 'HOURGLASS',
  PEAR = 'PEAR',
  APPLE = 'APPLE',
  RECTANGLE = 'RECTANGLE',
  INVERTED_TRIANGLE = 'INVERTED_TRIANGLE',
  OVAL = 'OVAL',
  ATHLETIC = 'ATHLETIC',
  PETITE = 'PETITE',
  PLUS_SIZE = 'PLUS_SIZE',
}

export const BODY_SHAPE_LABELS: Record<BodyShape, string> = {
  [BodyShape.HOURGLASS]: 'Hourglass',
  [BodyShape.PEAR]: 'Pear',
  [BodyShape.APPLE]: 'Apple',
  [BodyShape.RECTANGLE]: 'Rectangle',
  [BodyShape.INVERTED_TRIANGLE]: 'Inverted Triangle',
  [BodyShape.OVAL]: 'Oval',
  [BodyShape.ATHLETIC]: 'Athletic',
  [BodyShape.PETITE]: 'Petite',
  [BodyShape.PLUS_SIZE]: 'Plus Size',
};

// ============================================
// SKIN TONE
// ============================================
export enum SkinTone {
  FAIR = 'FAIR',
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  OLIVE = 'OLIVE',
  TAN = 'TAN',
  BROWN = 'BROWN',
  DARK_BROWN = 'DARK_BROWN',
  DEEP = 'DEEP',
}

export const SKIN_TONE_LABELS: Record<SkinTone, string> = {
  [SkinTone.FAIR]: 'Fair',
  [SkinTone.LIGHT]: 'Light',
  [SkinTone.MEDIUM]: 'Medium',
  [SkinTone.OLIVE]: 'Olive',
  [SkinTone.TAN]: 'Tan',
  [SkinTone.BROWN]: 'Brown',
  [SkinTone.DARK_BROWN]: 'Dark Brown',
  [SkinTone.DEEP]: 'Deep',
};

/** Approximate hex swatches for UI display */
export const SKIN_TONE_HEX: Record<SkinTone, string> = {
  [SkinTone.FAIR]: '#FDDCB5',
  [SkinTone.LIGHT]: '#F5C9A0',
  [SkinTone.MEDIUM]: '#D4936A',
  [SkinTone.OLIVE]: '#B5784E',
  [SkinTone.TAN]: '#9C6244',
  [SkinTone.BROWN]: '#7B4C30',
  [SkinTone.DARK_BROWN]: '#5C3320',
  [SkinTone.DEEP]: '#3B1F0F',
};

// ============================================
// CLOTHING COLOR
// ============================================
export enum ClothingColor {
  BLACK = 'BLACK',
  WHITE = 'WHITE',
  GREY = 'GREY',
  CHARCOAL = 'CHARCOAL',
  NAVY = 'NAVY',
  ROYAL_BLUE = 'ROYAL_BLUE',
  SKY_BLUE = 'SKY_BLUE',
  TEAL = 'TEAL',
  GREEN = 'GREEN',
  OLIVE_GREEN = 'OLIVE_GREEN',
  MINT = 'MINT',
  RED = 'RED',
  MAROON = 'MAROON',
  PINK = 'PINK',
  HOT_PINK = 'HOT_PINK',
  CORAL = 'CORAL',
  ORANGE = 'ORANGE',
  YELLOW = 'YELLOW',
  GOLD = 'GOLD',
  BEIGE = 'BEIGE',
  CREAM = 'CREAM',
  BROWN = 'BROWN',
  CHOCOLATE = 'CHOCOLATE',
  CARAMEL = 'CARAMEL',
  LAVENDER = 'LAVENDER',
  PURPLE = 'PURPLE',
  INDIGO = 'INDIGO',
  RUST = 'RUST',
  OFF_WHITE = 'OFF_WHITE',
  MULTI_COLOR = 'MULTI_COLOR',
  PRINTED = 'PRINTED',
  OTHER = 'OTHER',
}

export const CLOTHING_COLOR_LABELS: Record<ClothingColor, string> = {
  [ClothingColor.BLACK]: 'Black',
  [ClothingColor.WHITE]: 'White',
  [ClothingColor.GREY]: 'Grey',
  [ClothingColor.CHARCOAL]: 'Charcoal',
  [ClothingColor.NAVY]: 'Navy',
  [ClothingColor.ROYAL_BLUE]: 'Royal Blue',
  [ClothingColor.SKY_BLUE]: 'Sky Blue',
  [ClothingColor.TEAL]: 'Teal',
  [ClothingColor.GREEN]: 'Green',
  [ClothingColor.OLIVE_GREEN]: 'Olive Green',
  [ClothingColor.MINT]: 'Mint',
  [ClothingColor.RED]: 'Red',
  [ClothingColor.MAROON]: 'Maroon',
  [ClothingColor.PINK]: 'Pink',
  [ClothingColor.HOT_PINK]: 'Hot Pink',
  [ClothingColor.CORAL]: 'Coral',
  [ClothingColor.ORANGE]: 'Orange',
  [ClothingColor.YELLOW]: 'Yellow',
  [ClothingColor.GOLD]: 'Gold',
  [ClothingColor.BEIGE]: 'Beige',
  [ClothingColor.CREAM]: 'Cream',
  [ClothingColor.BROWN]: 'Brown',
  [ClothingColor.CHOCOLATE]: 'Chocolate',
  [ClothingColor.CARAMEL]: 'Caramel',
  [ClothingColor.LAVENDER]: 'Lavender',
  [ClothingColor.PURPLE]: 'Purple',
  [ClothingColor.INDIGO]: 'Indigo',
  [ClothingColor.RUST]: 'Rust',
  [ClothingColor.OFF_WHITE]: 'Off White',
  [ClothingColor.MULTI_COLOR]: 'Multi Color',
  [ClothingColor.PRINTED]: 'Printed',
  [ClothingColor.OTHER]: 'Other',
};

/** Representative hex codes for UI swatches */
export const CLOTHING_COLOR_HEX: Record<ClothingColor, string> = {
  [ClothingColor.BLACK]: '#1A1A1A',
  [ClothingColor.WHITE]: '#FFFFFF',
  [ClothingColor.GREY]: '#9E9E9E',
  [ClothingColor.CHARCOAL]: '#37474F',
  [ClothingColor.NAVY]: '#1A237E',
  [ClothingColor.ROYAL_BLUE]: '#1565C0',
  [ClothingColor.SKY_BLUE]: '#81D4FA',
  [ClothingColor.TEAL]: '#00796B',
  [ClothingColor.GREEN]: '#388E3C',
  [ClothingColor.OLIVE_GREEN]: '#6D8B00',
  [ClothingColor.MINT]: '#A5F3C4',
  [ClothingColor.RED]: '#C62828',
  [ClothingColor.MAROON]: '#880E4F',
  [ClothingColor.PINK]: '#F06292',
  [ClothingColor.HOT_PINK]: '#E91E8C',
  [ClothingColor.CORAL]: '#FF6B6B',
  [ClothingColor.ORANGE]: '#EF6C00',
  [ClothingColor.YELLOW]: '#F9A825',
  [ClothingColor.GOLD]: '#D4AC0D',
  [ClothingColor.BEIGE]: '#D7C4A3',
  [ClothingColor.CREAM]: '#FFFDD0',
  [ClothingColor.BROWN]: '#6D4C41',
  [ClothingColor.CHOCOLATE]: '#4E342E',
  [ClothingColor.CARAMEL]: '#C68642',
  [ClothingColor.LAVENDER]: '#CE93D8',
  [ClothingColor.PURPLE]: '#7B1FA2',
  [ClothingColor.INDIGO]: '#3949AB',
  [ClothingColor.RUST]: '#B7410E',
  [ClothingColor.OFF_WHITE]: '#FAF9F6',
  [ClothingColor.MULTI_COLOR]: '#FF6384',
  [ClothingColor.PRINTED]: '#A89BC2',
  [ClothingColor.OTHER]: '#BDBDBD',
};
