import { AngleType } from '../enums/angle.enum';


export const ANGLE_SEQUENCE: AngleType[] = [
    AngleType.BACK,       // Index 0 - First angle to generate
    AngleType.SIDE_LEFT,  // Index 1
    AngleType.SIDE_RIGHT, // Index 2
    AngleType.LEFT,       // Index 3
    AngleType.RIGHT,      // Index 4
];

export const GEMINI_MODEL_ID = 'gemini-2.5-flash-image';


export const GENERATION_TIMEOUT = 120000; // 120 seconds


export const INITIAL_SESSION_INDEX = 0;
