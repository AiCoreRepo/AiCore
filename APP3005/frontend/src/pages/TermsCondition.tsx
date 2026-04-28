import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import {
    ChevronRight,
    CircleHelp,
    CreditCard,
    Gavel,
    Globe,
    Landmark,
    Mail,
    ScrollText,
    ShieldCheck,
} from "lucide-react";
import {
    BRAND_NAME,
    LEGAL_ENTITY_NAME,
    LEGAL_LAST_UPDATED,
    PRIVACY_EMAIL,
    REGISTERED_OFFICE_ADDRESS,
    SUPPORT_EMAIL,
} from "@/constants/legal.constants";

const sections = [
    {
        id: "1",
        title: "Electronic Record and Acceptance",
        icon: ScrollText,
        summary: `These terms apply from the moment you access, browse, register for, or otherwise use ${BRAND_NAME}.`,
        items: [
            "These Terms & Conditions are an electronic record under applicable Indian law and do not require physical or digital signatures.",
            `The website, related mobile site, and connected services are operated under the ${BRAND_NAME} brand by ${LEGAL_ENTITY_NAME}.`,
            "By accessing, browsing, registering, or otherwise using the platform, you agree to these Terms & Conditions, the Privacy Policy, and the applicable Refund, Return, and Shipping Policies.",
        ],
    },
    {
        id: "2",
        title: "User Information and Platform Use",
        icon: ShieldCheck,
        summary: "You are responsible for accurate account details, secure credentials, and lawful use of the platform.",
        items: [
            "You agree to provide true, accurate, current, and complete information during registration, checkout, and subsequent account use.",
            "You are responsible for activities performed through your account and for keeping your login credentials secure.",
            "You must not use the platform or its services for unlawful, fraudulent, abusive, or prohibited purposes, or in violation of applicable laws.",
        ],
    },
    {
        id: "3",
        title: "Orders, Charges, and Payments",
        icon: CreditCard,
        summary: "Pricing, availability, order acceptance, payment processing, and related checks are governed by this section.",
        items: [
            "Product details, pricing, shipping charges, taxes, availability, and promotional terms may change without prior notice.",
            "By initiating a transaction, you enter into a legally binding and enforceable arrangement for the applicable goods or services, subject to acceptance, availability, and successful processing.",
            "Online payments are processed through Razorpay. Sensitive payment credentials are intended to remain within hosted checkout flows, and payment verification, refund routing, and fraud checks may be carried out through the gateway and related providers.",
            "You agree to pay all charges associated with the goods or services you purchase through the platform.",
        ],
    },
    {
        id: "4",
        title: "Intellectual Property and Third-Party Links",
        icon: Globe,
        summary: `Platform content and branding remain protected, and any external websites you visit will have their own terms and policies.`,
        items: [
            `The contents, layout, look, graphics, software elements, branding, and related materials on ${BRAND_NAME} are proprietary to or licensed by the Platform Owner.`,
            "Unauthorized use of the platform or its content may give rise to claims under these terms and applicable law.",
            "The platform may contain links to third-party websites or services. When you access those links, you may become subject to the terms, privacy policy, and other policies of the relevant third party.",
            "We do not warrant the accuracy, completeness, timeliness, or suitability of platform content for every specific purpose to the fullest extent permitted by law.",
        ],
    },
    {
        id: "5",
        title: "Indemnity, Force Majeure, and Governing Law",
        icon: Gavel,
        summary: "This section explains liability allocation, uncontrollable events, and how disputes are handled under Indian law.",
        items: [
            "You agree to indemnify and hold harmless the Platform Owner, affiliates, officers, directors, employees, and agents from claims, damages, penalties, or costs arising from your breach of these terms, applicable policies, or applicable law.",
            "Neither party will be liable for failure or delay in performing an obligation where such failure or delay is caused by events beyond reasonable control, including force majeure events.",
            "These terms are governed by the laws of India. Disputes will be subject to the courts having jurisdiction over the Platform Owner's registered office, unless applicable law requires otherwise.",
            `The Platform Owner's registered office address is ${REGISTERED_OFFICE_ADDRESS}.`,
        ],
    },
];

const overviewItems = [
    {
        label: "Platform owner",
        value: LEGAL_ENTITY_NAME,
    },
    {
        label: "Brand",
        value: BRAND_NAME,
    },
    {
        label: "Registered office",
        value: REGISTERED_OFFICE_ADDRESS,
    },
    {
        label: "Last updated",
        value: LEGAL_LAST_UPDATED,
    },
];

const quickFacts = [
    "Using the platform means you accept these terms and the linked platform policies.",
    "Prices, stock, promotions, and shipping charges can change before order confirmation.",
    "Hosted payments are handled through Razorpay and related verification providers.",
];

const contactLinks =
    PRIVACY_EMAIL === SUPPORT_EMAIL
        ? [
            {
                label: "Support and privacy queries",
                value: SUPPORT_EMAIL,
            },
        ]
        : [
            {
                label: "Order and payment support",
                value: SUPPORT_EMAIL,
            },
            {
                label: "Privacy and data questions",
                value: PRIVACY_EMAIL,
            },
        ];

const TermsCondition = () => {
    return (
        <div className="min-h-screen bg-[#faf7f1] font-sans text-slate-800">
            <Navbar />

            <div className="relative overflow-hidden bg-[#141414] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.22),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_35%)]" />
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

                <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
                    <div className="max-w-4xl">
                        <p className="mb-4 inline-flex items-center rounded-full border border-[#D4AF37]/30 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[#E7C967]">
                            Legal Information
                        </p>
                        <h1 className="max-w-3xl font-serif text-4xl tracking-[0.03em] text-[#F6E7B0] md:text-6xl">
                            Terms & Conditions
                        </h1>
                        <p className="mt-6 max-w-3xl text-base leading-8 text-white/78 md:text-lg">
                            A clearer summary of the rules, responsibilities, and legal conditions
                            that apply when you use {BRAND_NAME}.
                        </p>

                        <div className="mt-10 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                                    Applies when
                                </p>
                                <p className="mt-3 text-sm leading-7 text-white/80">
                                    You browse, register, place orders, or interact with connected
                                    services.
                                </p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                                    Covers
                                </p>
                                <p className="mt-3 text-sm leading-7 text-white/80">
                                    Platform use, orders, payments, intellectual property, and
                                    disputes.
                                </p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                                    Last updated
                                </p>
                                <p className="mt-3 text-sm leading-7 text-white/80">
                                    {LEGAL_LAST_UPDATED}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[2rem] border border-[#d7c29a]/50 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4ead2] text-[#b68b22]">
                                <Landmark className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B78A20]">
                                    At A Glance
                                </p>
                                <h2 className="font-serif text-3xl text-[#161616]">
                                    Key Legal Details
                                </h2>
                            </div>
                        </div>

                        <dl className="grid gap-5 sm:grid-cols-2">
                            {overviewItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-3xl border border-slate-200 bg-[#fcfaf5] p-5"
                                >
                                    <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                                        {item.label}
                                    </dt>
                                    <dd className="mt-3 text-sm leading-7 text-slate-700">
                                        {item.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[2rem] border border-slate-200 bg-[#fffdf8] p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f6ecd7] text-[#b88c24]">
                                    <CircleHelp className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B78A20]">
                                        Read Fast
                                    </p>
                                    <h2 className="font-serif text-2xl text-[#161616]">
                                        Quick Summary
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {quickFacts.map((fact) => (
                                    <div
                                        key={fact}
                                        className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                                    >
                                        <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B78A20]" />
                                        <p className="text-sm leading-7 text-slate-700">{fact}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <nav
                            aria-label="Terms navigation"
                            className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B78A20]">
                                Jump To
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                {sections.map((section) => (
                                    <a
                                        key={section.id}
                                        href={`#terms-section-${section.id}`}
                                        className="rounded-full border border-slate-200 bg-[#fcfaf5] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#D4AF37]/50 hover:bg-[#f8f0df] hover:text-[#161616]"
                                    >
                                        {section.id}. {section.title}
                                    </a>
                                ))}
                            </div>
                        </nav>
                    </div>
                </section>

                <section className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50/90 p-6 text-sm leading-7 text-amber-950 shadow-[0_18px_40px_rgba(180,83,9,0.08)] md:p-7">
                    <p className="font-semibold uppercase tracking-[0.22em] text-amber-800">
                        Before you continue
                    </p>
                    <p className="mt-3 max-w-4xl">
                        These summaries are meant to make the page easier to read. The full clause
                        text below remains the governing legal content.
                    </p>
                </section>

                <div className="mt-10 space-y-8">
                    {sections.map((section) => {
                        const Icon = section.icon;

                        return (
                            <section
                                key={section.id}
                                id={`terms-section-${section.id}`}
                                className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8"
                            >
                                <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-start md:justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl bg-[#f5ebd5] text-[#B78A20]">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B78A20]">
                                                Clause {section.id}
                                            </p>
                                            <h2 className="mt-2 font-serif text-3xl leading-tight text-[#171717] md:text-[2rem]">
                                                {section.title}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="rounded-full border border-[#D4AF37]/25 bg-[#fcf6ea] px-4 py-2 text-sm font-medium text-[#8C6820]">
                                        Clear summary included
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
                                    <div className="rounded-[1.75rem] border border-[#ead9b7] bg-[#fbf6ea] p-6">
                                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B78A20]">
                                            In plain language
                                        </p>
                                        <p className="mt-4 text-base leading-8 text-slate-700">
                                            {section.summary}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {section.items.map((item) => (
                                            <div
                                                key={item}
                                                className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5"
                                            >
                                                <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#C69C35]" />
                                                <p className="text-sm leading-7 text-slate-700">
                                                    {item}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>

                <section className="mt-12 rounded-[2rem] border border-[#d7c29a]/50 bg-[#161616] p-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] md:p-10">
                    <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#E0B54E]">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                                        Need Help
                                    </p>
                                    <h2 className="font-serif text-3xl text-[#F3E0A1]">
                                        Questions About These Terms?
                                    </h2>
                                </div>
                            </div>

                            <p className="text-sm leading-8 text-white/78">
                                Contact us if you need clarification on orders, payments, privacy,
                                or legal usage of the platform. Include your order reference if the
                                query relates to a transaction.
                            </p>
                        </div>

                        <div className="grid gap-4 md:min-w-[320px]">
                            {contactLinks.map((contact) => (
                                <a
                                    key={contact.label}
                                    href={`mailto:${contact.value}`}
                                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition hover:border-[#D4AF37]/40 hover:bg-white/8"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                                        {contact.label}
                                    </p>
                                    <p className="mt-3 text-base font-medium text-white">
                                        {contact.value}
                                    </p>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default TermsCondition;
