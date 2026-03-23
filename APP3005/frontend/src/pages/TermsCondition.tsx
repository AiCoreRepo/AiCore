import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    ScrollText,
    CreditCard,
    ShieldCheck,
    Globe,
    Gavel,
    Mail,
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
        body: [
            "These Terms & Conditions are an electronic record under applicable Indian law and do not require physical or digital signatures.",
            `The website, related mobile site, and connected services are operated under the ${BRAND_NAME} brand by ${LEGAL_ENTITY_NAME}.`,
            "By accessing, browsing, registering, or otherwise using the platform, you agree to these Terms & Conditions, the Privacy Policy, and the applicable Refund, Return, and Shipping Policies.",
        ],
    },
    {
        id: "2",
        title: "User Information and Platform Use",
        icon: ShieldCheck,
        body: [
            "You agree to provide true, accurate, current, and complete information during registration, checkout, and subsequent account use.",
            "You are responsible for activities performed through your account and for keeping your login credentials secure.",
            "You must not use the platform or its services for unlawful, fraudulent, abusive, or prohibited purposes, or in violation of applicable laws.",
        ],
    },
    {
        id: "3",
        title: "Orders, Charges, and Payments",
        icon: CreditCard,
        body: [
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
        body: [
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
        body: [
            "You agree to indemnify and hold harmless the Platform Owner, affiliates, officers, directors, employees, and agents from claims, damages, penalties, or costs arising from your breach of these terms, applicable policies, or applicable law.",
            "Neither party will be liable for failure or delay in performing an obligation where such failure or delay is caused by events beyond reasonable control, including force majeure events.",
            "These terms are governed by the laws of India. Disputes will be subject to the courts having jurisdiction over the Platform Owner's registered office, unless applicable law requires otherwise.",
            `The Platform Owner's registered office address is ${REGISTERED_OFFICE_ADDRESS}.`,
        ],
    },
];

const TermsCondition = () => {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-800">
            <Navbar />

            <div className="relative overflow-hidden bg-[#1a1a1a] py-24 text-white md:py-32">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                    <h1 className="mb-6 text-4xl font-serif tracking-wide text-[#D4AF37] md:text-6xl">
                        Terms & Conditions
                    </h1>
                    <div className="mx-auto mb-8 h-1 w-24 bg-[#D4AF37]" />
                    <p className="mx-auto max-w-3xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
                        These terms explain the rules, responsibilities, and legal conditions that
                        apply when you access or use the platform.
                    </p>
                    <p className="mt-8 text-sm uppercase tracking-widest text-[#D4AF37]/80">
                        Last Updated: {LEGAL_LAST_UPDATED}
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-20">
                <div className="mb-10 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-6 text-sm leading-7 text-gray-700">
                    Platform Owner: <span className="font-semibold text-[#1a1a1a]">{LEGAL_ENTITY_NAME}</span>
                    <br />
                    Registered Office: <span className="font-semibold text-[#1a1a1a]">{REGISTERED_OFFICE_ADDRESS}</span>
                </div>

                <div className="space-y-10">
                    {sections.map((section) => {
                        const Icon = section.icon;

                        return (
                            <section
                                key={section.id}
                                className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm"
                            >
                                <div className="mb-6 flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                                            Clause {section.id}
                                        </p>
                                        <h2 className="text-3xl font-serif text-[#1a1a1a]">
                                            {section.title}
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm leading-7 text-gray-600">
                                    {section.body.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <div className="mt-14 rounded-3xl border border-[#D4AF37]/20 bg-[#1a1a1a] p-8 text-white">
                    <div className="mb-4 flex items-center gap-3">
                        <Mail className="h-5 w-5 text-[#D4AF37]" />
                        <h2 className="text-2xl font-serif text-[#D4AF37]">Questions About These Terms?</h2>
                    </div>
                    <p className="max-w-3xl text-sm leading-7 text-gray-300">
                        Contact{" "}
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="font-semibold text-white underline underline-offset-4"
                        >
                            {SUPPORT_EMAIL}
                        </a>
                        {" "}for order and payment queries, or{" "}
                        <a
                            href={`mailto:${PRIVACY_EMAIL}`}
                            className="font-semibold text-white underline underline-offset-4"
                        >
                            {PRIVACY_EMAIL}
                        </a>
                        {" "}for privacy and data-handling questions.
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default TermsCondition;
