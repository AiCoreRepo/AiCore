/**
 * Angle types for camera rotation
 */
export enum AngleType {
  FRONT = 'front',
  BACK = 'back',
  SIDE_LEFT = 'side-left',
  SIDE_RIGHT = 'side-right',
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * Camera rotation definitions for each angle
 */
export const ANGLE_DEFINITIONS: Record<AngleType, string> = {
  [AngleType.FRONT]: '0° (front view)',
  [AngleType.BACK]: '180° (full back view)',
  [AngleType.SIDE_LEFT]: '45° left (side profile view looking left)',
  [AngleType.SIDE_RIGHT]: '45° right (side profile view looking right)',
  [AngleType.LEFT]: '90° left (full left profile)',
  [AngleType.RIGHT]: '90° right (full right profile)',
};
