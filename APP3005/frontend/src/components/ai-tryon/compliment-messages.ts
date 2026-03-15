export interface ComplimentMessage {
    id: string;
    message: string;
    highlights: string[];
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
}

export const COMPLIMENT_MESSAGES: ComplimentMessage[] = [
    {
        id: ComplimentMessageId.CMP_01,
        message:
            "Ye look aap par bahut khoobsurati se baith raha hai. Grace bhi dikh rahi hai, aur poora finish premium feel de raha hai.",
        highlights: ["Graceful", "Polished"],
    },
    {
        id: ComplimentMessageId.CMP_02,
        message:
            "Is outfit ne aapki presence ko aur nikhara hai. Sach kahun, aap is look ko sirf pehen nahi rahi, poore confidence ke saath own kar rahi hain.",
        highlights: ["Confident", "Refined"],
    },
    {
        id: ComplimentMessageId.CMP_03,
        message:
            "Ye rang aap par itni narmi se khil raha hai jaise design ko apni sahi jagah mil gayi ho. Bahut balanced aur elegant pairing hai.",
        highlights: ["Elegant", "Balanced"],
    },
    {
        id: ComplimentMessageId.CMP_04,
        message:
            "Silhouette clean hai, fall flattering hai, aur overall vibe bahut composed lag rahi hai. Is look mein aap effortlessly standout kar rahi hain.",
        highlights: ["Flattering", "Composed"],
    },
    {
        id: ComplimentMessageId.CMP_05,
        message:
            "Aaj ka style verdict seedha sa hai: ye outfit aap par bahut jach raha hai. Softness bhi hai, statement bhi hai, aur poori look yaad reh jaati hai.",
        highlights: ["Statement", "Soft"],
    },
    {
        id: ComplimentMessageId.CMP_06,
        message:
            "Is look ko dekhkar nazar thehar si jaati hai. Fit aur finish dono milkar aapki natural elegance ko aur strong bana rahe hain.",
        highlights: ["Elegant", "Sharp"],
    },
    {
        id: ComplimentMessageId.CMP_07,
        message:
            "Aapki personality aur is outfit ka mood ekdum sync mein lag raha hai. Poora styling result tasteful, graceful, aur bahut flattering hai.",
        highlights: ["Tasteful", "Graceful"],
    },
    {
        id: ComplimentMessageId.CMP_08,
        message:
            "Is dress ki detailing aur aapki presence ek dusre ko beautifully complement kar rahi hain. Sach mein, ye look aap par bahut hi khoobsurat lag raha hai.",
        highlights: ["Detailed", "Beautiful"],
    },
];

const SHOWN_COMPLIMENTS_KEY = "aivestire_shown_compliments";

export const getRandomCompliment = (): ComplimentMessage => {
    try {
        const shownIdsJson = localStorage.getItem(SHOWN_COMPLIMENTS_KEY);
        let shownIds: string[] = shownIdsJson ? JSON.parse(shownIdsJson) : [];

        if (shownIds.length >= COMPLIMENT_MESSAGES.length) {
            shownIds = [];
            localStorage.removeItem(SHOWN_COMPLIMENTS_KEY);
        }

        const availableMessages = COMPLIMENT_MESSAGES.filter(
            (msg) => !shownIds.includes(msg.id),
        );

        const randomIndex = Math.floor(Math.random() * availableMessages.length);
        const selectedMessage = availableMessages[randomIndex];

        shownIds.push(selectedMessage.id);
        localStorage.setItem(SHOWN_COMPLIMENTS_KEY, JSON.stringify(shownIds));

        return selectedMessage;
    } catch (error) {
        console.warn("Failed to track compliments, using simple random:", error);
        const randomIndex = Math.floor(Math.random() * COMPLIMENT_MESSAGES.length);
        return COMPLIMENT_MESSAGES[randomIndex];
    }
};
