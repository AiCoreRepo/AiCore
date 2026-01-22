// Elegant complementary messages shown after AI try-on completes

export interface ComplimentMessage {
    id: string;
    message: string;
    emotion: string[];
}

export enum ComplimentMessageId {
    CMP_01 = "cmp_01",
    CMP_02 = "cmp_02",
    CMP_03 = "cmp_03",
    CMP_04 = "cmp_04",
    CMP_05 = "cmp_05",
    CMP_06 = "cmp_06",
    CMP_07 = "cmp_07",
    CMP_08 = "cmp_08",
    CMP_09 = "cmp_09",
    CMP_10 = "cmp_10",
    CMP_11 = "cmp_11",
    CMP_12 = "cmp_12",
    CMP_13 = "cmp_13",
    CMP_14 = "cmp_14",
    CMP_15 = "cmp_15",
}

export const COMPLIMENT_MESSAGES: ComplimentMessage[] = [
    {
        id: ComplimentMessageId.CMP_01,
        message: "This look feels effortlessly you — confident, calm, and naturally graceful.",
        emotion: ["confidence", "ease"],
    },
    {
        id: ComplimentMessageId.CMP_02,
        message: "There's a quiet elegance in this style that really complements your presence.",
        emotion: ["elegance", "self-assurance"],
    },
    {
        id: ComplimentMessageId.CMP_03,
        message: "This outfit carries a soft strength — comfortable, assured, and beautiful.",
        emotion: ["strength", "comfort"],
    },
    {
        id: ComplimentMessageId.CMP_04,
        message: "You wear this with such natural confidence, it feels completely effortless.",
        emotion: ["confidence", "authenticity"],
    },
    {
        id: ComplimentMessageId.CMP_05,
        message: "This look highlights your calm confidence and thoughtful sense of style.",
        emotion: ["calm", "confidence"],
    },
    {
        id: ComplimentMessageId.CMP_06,
        message: "There's a gentle power in this look — composed, warm, and self-assured.",
        emotion: ["warmth", "strength"],
    },
    {
        id: ComplimentMessageId.CMP_07,
        message: "This style feels grounded and graceful, like it truly belongs to you.",
        emotion: ["belonging", "grace"],
    },
    {
        id: ComplimentMessageId.CMP_08,
        message: "You bring a quiet charm to this look — subtle, confident, and real.",
        emotion: ["charm", "authenticity"],
    },
    {
        id: ComplimentMessageId.CMP_09,
        message: "This outfit reflects a beautiful balance of comfort and confidence.",
        emotion: ["balance", "comfort"],
    },
    {
        id: ComplimentMessageId.CMP_10,
        message: "There's an ease in this look that makes confidence feel natural.",
        emotion: ["ease", "confidence"],
    },
    {
        id: ComplimentMessageId.CMP_11,
        message: "This style feels thoughtful and intentional — quietly powerful.",
        emotion: ["intention", "strength"],
    },
    {
        id: ComplimentMessageId.CMP_12,
        message: "You carry this look with a calm assurance that feels very you.",
        emotion: ["assurance", "self-connection"],
    },
    {
        id: ComplimentMessageId.CMP_13,
        message: "This outfit complements your presence in a soft, confident way.",
        emotion: ["presence", "confidence"],
    },
    {
        id: ComplimentMessageId.CMP_14,
        message: "There's something reassuring and strong about how this look comes together.",
        emotion: ["reassurance", "strength"],
    },
    {
        id: ComplimentMessageId.CMP_15,
        message: "This style feels genuine — comfortable, confident, and beautifully balanced.",
        emotion: ["authenticity", "balance"],
    },
];

/**
 * Get a random compliment message
 */
export const getRandomCompliment = (): ComplimentMessage => {
    const randomIndex = Math.floor(Math.random() * COMPLIMENT_MESSAGES.length);
    return COMPLIMENT_MESSAGES[randomIndex];
};
