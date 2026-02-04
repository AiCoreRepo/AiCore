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
        message: "Apni nigaahon se khud ko mat dekhiye 🫶, Heera bhi aapko patthar lagega 🤍; Sab kehte honge \"chaand ka tukda ho aap\" 😍… Meri nazar se dekhiye 🎀, Chaand bhi aapka tukda lagega ✨🤌",
        emotion: ["✨", "🫶"],
    },
    {
        id: ComplimentMessageId.CMP_02,
        message: "Khud ko aapki yaadon ka gulaam kar diya 🫶, Aapke khaatir khud ko badnaam kar diya 😍. Aur kya saboot doon aapki khoobsurti ka 🎀, Mere paas ek hi dil tha 💓— Wo bhi aapke naam kar diya 🤌✨",
        emotion: ["💓", "🫶"],
    },
    {
        id: ComplimentMessageId.CMP_03,
        message: "Nazar ko nazar ki nazar na lage 🧿🫶, Koi achha bhi is kadar na lage 😍, Aapko dekha hai is nazar se 🎀, Jis nazar se aapko nazar hi na lage 🤌✨",
        emotion: ["🧿", "✨"],
    },
    {
        id: ComplimentMessageId.CMP_04,
        message: "Aaj chaand bhi der tak nikla nahi 🌙, Shayad kisi ne keh diya ho— \"Zameen par aaj khoobsurti ka mukammal jawaab hai\" 😍🫶",
        emotion: ["🌙", "😍"],
    },
    {
        id: ComplimentMessageId.CMP_05,
        message: "Chaand se poocha, tumse sundar kaun? 🌙 Chaand muskuraya 😊, kuch pal raha maun 🤍. Usne na lafzon ka sahaara liya 🤌, Bas ek pari ki taraf ishara kiya ✨🎀",
        emotion: ["🌙", "✨"],
    },
    {
        id: ComplimentMessageId.CMP_06,
        message: "Hey, are you ubalta hua doodh on the gas? 😜 'Cause tumse bilkul nazar nahi hatti 😍🫶🤌",
        emotion: ["😜", "😍"],
    },
    {
        id: ComplimentMessageId.CMP_07,
        message: "Chaand ki roshni-si hain jinki aankhein ✨, Ada-e-khaas rakhti ho tum 😍— Har libaas tum par jachta hai 🎀, Is rang mein to aur bhi kamaal lagti ho 🫶🤌",
        emotion: ["✨", "🎀"],
    },
    {
        id: ComplimentMessageId.CMP_08,
        message: "Sitaaron se poocha tumse sundar kaun ✨, Chaand se poocha tumse sundar kaun 🌙, Unhone dekha ek pari ki ore— Muskurate hue 😊, sharmate hue 😍… Muskurate hue, sharmate hue 🎀🫶",
        emotion: ["✨", "🌙"],
    },
    {
        id: ComplimentMessageId.CMP_09,
        message: "Aaj rangon ko bolne ki zarurat nahi padi 🎨, Silwaton ne hi poora kissa keh diya 😍, Jo pehen kar saamne aayi— Nazrein thehar gayi 🫶, Baat adhoori reh gayi 🤌✨",
        emotion: ["🎨", "✨"],
    },
    {
        id: ComplimentMessageId.CMP_10,
        message: "Phoolon ne aaj aaina badal liya 🌸, Jab aapko in rangon mein saja dekha 😍. Ye pehnaava jaise mausam ki pasand ho 🎀, Aap par har saadgi khil uthti hai 🫶, Aur har nazar thehar kar wajah dhoondhti hai ✨🤌",
        emotion: ["🌸", "✨"],
    },
    {
        id: ComplimentMessageId.CMP_11,
        message: "Kahan se laaun wo shabd 🤍, Jo sirf aap tak pahunch paayein 🫶… Duniya chaand ko dekhti rahe 🌙, Aur mujhe sirf aap hi nazar aayein 😍🎀",
        emotion: ["🤍", "🌙"],
    },
    {
        id: ComplimentMessageId.CMP_12,
        message: "Sitaaron bhari raaton ki baatein sab karte hain ✨, Door se suni kahaniyon par sab marte hain 😌… Tareef ke kaabil to aap mein bahut kuch hai 🫶, Par is andaaz mein ye roop Kuch zyada hi jachta hai 😍🤌✨",
        emotion: ["✨", "😍"],
    },
    {
        id: ComplimentMessageId.CMP_13,
        message: "Apni nigaahon se khud ko mat dekhiye 🫶, Heera bhi aapko patthar lagega 🤍",
        emotion: ["🫶", "🤍"],
    },
    {
        id: ComplimentMessageId.CMP_14,
        message: "Chaand ki roshni-si hain jinki aankhein ✨, Ada-e-khaas rakhti ho tum 😍",
        emotion: ["✨", "😍"],
    },
    {
        id: ComplimentMessageId.CMP_15,
        message: "Aaj chaand bhi der tak nikla nahi 🌙, Shayad kisi ne keh diya ho— \"Zameen par aaj khoobsurti ka mukammal jawaab hai\" 😍🫶",
        emotion: ["🌙", "🫶"],
    },
];

// LocalStorage key for tracking shown compliments
const SHOWN_COMPLIMENTS_KEY = 'aivestire_shown_compliments';


export const getRandomCompliment = (): ComplimentMessage => {
    try {
        // Get the list of already shown compliment IDs from localStorage
        const shownIdsJson = localStorage.getItem(SHOWN_COMPLIMENTS_KEY);
        let shownIds: string[] = shownIdsJson ? JSON.parse(shownIdsJson) : [];

        // If all messages have been shown, reset the tracking
        if (shownIds.length >= COMPLIMENT_MESSAGES.length) {
            shownIds = [];
            localStorage.removeItem(SHOWN_COMPLIMENTS_KEY);
        }

        // Filter out messages that have already been shown
        const availableMessages = COMPLIMENT_MESSAGES.filter(
            msg => !shownIds.includes(msg.id)
        );

        // Pick a random message from available ones
        const randomIndex = Math.floor(Math.random() * availableMessages.length);
        const selectedMessage = availableMessages[randomIndex];

        // Mark this message as shown
        shownIds.push(selectedMessage.id);
        localStorage.setItem(SHOWN_COMPLIMENTS_KEY, JSON.stringify(shownIds));

        return selectedMessage;
    } catch (error) {
        // Fallback to simple random if localStorage fails
        console.warn('Failed to track compliments, using simple random:', error);
        const randomIndex = Math.floor(Math.random() * COMPLIMENT_MESSAGES.length);
        return COMPLIMENT_MESSAGES[randomIndex];
    }
};
