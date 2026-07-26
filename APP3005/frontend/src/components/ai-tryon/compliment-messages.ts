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
        message:
            "Apni nigaahon se khud ko mat dekhiye 🫶, Heera bhi aapko patthar lagega 🤍; Sab kehte honge \"chaand ka tukda ho aap\" 😍… Meri nazar se dekhiye 🎀, Chaand bhi aapka tukda lagega ✨🤌",
        highlights: ["✨", "🫶"],
    },
    {
        id: ComplimentMessageId.CMP_02,
        message:
            "Khud ko aapki yaadon ka gulaam kar diya 🫶, Aapke khaatir khud ko badnaam kar diya 😍. Aur kya saboot doon aapki khoobsurti ka 🎀, Mere paas ek hi dil tha 💓— Wo bhi aapke naam kar diya 🤌✨",
        highlights: ["💓", "🫶"],
    },
    {
        id: ComplimentMessageId.CMP_03,
        message:
            "Nazar ko nazar ki nazar na lage 🧿🫶, Koi achha bhi is kadar na lage 😍, Aapko dekha hai is nazar se 🎀, Jis nazar se aapko nazar hi na lage 🤌✨",
        highlights: ["🧿", "✨"],
    },
    {
        id: ComplimentMessageId.CMP_04,
        message:
            "Aaj chaand bhi der tak nikla nahi 🌙, Shayad kisi ne keh diya ho— \"Zameen par aaj khoobsurti ka mukammal jawaab hai\" 😍🫶",
        highlights: ["🌙", "😍"],
    },
    {
        id: ComplimentMessageId.CMP_05,
        message:
            "Chaand se poocha, tumse sundar kaun? 🌙 Chaand muskuraya 😊, kuch pal raha maun 🤍. Usne na lafzon ka sahaara liya 🤌, Bas ek pari ki taraf ishara kiya ✨🎀",
        highlights: ["🌙", "✨"],
    },
    {
        id: ComplimentMessageId.CMP_06,
        message:
            "Hey, are you ubalta hua doodh on the gas? 😜 'Cause tumse bilkul nazar nahi hatti 😍🫶🤌",
        highlights: ["😜", "😍"],
    },
    {
        id: ComplimentMessageId.CMP_07,
        message:
            "Chaand ki roshni-si hain jinki aankhein ✨, Ada-e-khaas rakhti ho tum 😍— Har libaas tum par jachta hai 🎀, Is rang mein to aur bhi kamaal lagti ho 🫶🤌",
        highlights: ["✨", "🎀"],
    },
    {
        id: ComplimentMessageId.CMP_08,
        message:
            "Sitaaron se poocha tumse sundar kaun ✨, Chaand se poocha tumse sundar kaun 🌙, Unhone dekha ek pari ki ore— Muskurate hue 😊, sharmate hue 😍… Muskurate hue, sharmate hue 🎀🫶",
        highlights: ["✨", "🌙"],
    },
    {
        id: ComplimentMessageId.CMP_09,
        message:
            "Aaj rangon ko bolne ki zarurat nahi padi 🎨, Silwaton ne hi poora kissa keh diya 😍, Jo pehen kar saamne aayi— Nazrein thehar gayi 🫶, Baat adhoori reh gayi 🤌✨",
        highlights: ["🎨", "✨"],
    },
    {
        id: ComplimentMessageId.CMP_10,
        message:
            "Phoolon ne aaj aaina badal liya 🌸, Jab aapko in rangon mein saja dekha 😍. Ye pehnaava jaise mausam ki pasand ho 🎀, Aap par har saadgi khil uthti hai 🫶, Aur har nazar thehar kar wajah dhoondhti hai ✨🤌",
        highlights: ["🌸", "✨"],
    },
    {
        id: ComplimentMessageId.CMP_11,
        message:
            "Kahan se laaun wo shabd 🤍, Jo sirf aap tak pahunch paayein 🫶… Duniya chaand ko dekhti rahe 🌙, Aur mujhe sirf aap hi nazar aayein 😍🎀",
        highlights: ["🤍", "🌙"],
    },
    {
        id: ComplimentMessageId.CMP_12,
        message:
            "Sitaaron bhari raaton ki baatein sab karte hain ✨, Door se suni kahaniyon par sab marte hain 😌… Tareef ke kaabil to aap mein bahut kuch hai 🫶, Par is andaaz mein ye roop Kuch zyada hi jachta hai 😍🤌✨",
        highlights: ["✨", "😍"],
    },
    {
        id: ComplimentMessageId.CMP_13,
        message:
            "Apni nigaahon se khud ko mat dekhiye 🫶, Heera bhi aapko patthar lagega 🤍",
        highlights: ["🫶", "🤍"],
    },
    {
        id: ComplimentMessageId.CMP_14,
        message:
            "Chaand ki roshni-si hain jinki aankhein ✨, Ada-e-khaas rakhti ho tum 😍",
        highlights: ["✨", "😍"],
    },
    {
        id: ComplimentMessageId.CMP_15,
        message:
            "Aaj chaand bhi der tak nikla nahi 🌙, Shayad kisi ne keh diya ho— \"Zameen par aaj khoobsurti ka mukammal jawaab hai\" 😍🫶",
        highlights: ["🌙", "🫶"],
    },
];

const MALE_DEMO_COMPLIMENTS: Record<string, ComplimentMessage> = {
    "Midnight Tee Set": {
        id: "male_midnight_tee",
        message:
            "Kaale libaas mein andaaz kuch yun nikhar aaya 🖤, Saadgi ne bhi aaj hero wala rang dikhaya ✨",
        highlights: ["🖤", "✨"],
    },
    "Mehendi Green Kurta": {
        id: "male_mehendi_kurta",
        message:
            "Mehendi sa rang, nawabi sa andaaz 💚, Aaj har nazar kahe— janaab, kya baat! ✨",
        highlights: ["💚", "✨"],
    },
    "Sky Blue Relaxed Shirt": {
        id: "male_sky_blue",
        message:
            "Aasmaani rang aur sukoon bhara style 💙, Janaab chalein to har nazar ruk jaaye a while ✨",
        highlights: ["💙", "✨"],
    },
    "Ice Blue Embroidered Bandhgala": {
        id: "male_ice_blue_bandhgala",
        message:
            "Bandhgale ki shaan, chehre par noor ❄️, Is nawabi andaaz ka jawaab nahi huzoor 👑",
        highlights: ["❄️", "👑"],
    },
    "Midnight Floral Bandhgala": {
        id: "male_midnight_bandhgala",
        message:
            "Siyah rang par phoolon ka kamaal 🖤, Janaab ka ye andaaz hai bilkul bemisaal 👑",
        highlights: ["🖤", "👑"],
    },
};

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

export const getComplimentForGarment = (
    garmentTitle?: string | null,
): ComplimentMessage => {
    const fixed = garmentTitle ? MALE_DEMO_COMPLIMENTS[garmentTitle.trim()] : null;
    return fixed || getRandomCompliment();
};
