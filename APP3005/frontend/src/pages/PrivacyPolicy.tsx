import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    Shield,
    Lock,
    FileText,
    RefreshCcw,
    Mail,
    ChevronRight,
    TriangleAlert,
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
        title: "Introduction and Scope",
        icon: FileText,
        intro:
            "This Privacy Policy describes how the Platform Owner collects, uses, stores, shares, protects, or otherwise processes personal data through the AiVestire website, related mobile site, and connected services.",
        items: [
            `${BRAND_NAME} is primarily intended for users in India, and personal data is primarily stored and processed in India.`,
            "By visiting the platform, creating an account, placing an order, using AI-led features, or providing information to us, you agree to this Privacy Policy, the Terms & Conditions, and applicable Indian laws.",
            "Certain sections of the platform may be browsed without registration, but some features and services require personal information to function.",
        ],
    },
    {
        id: "2",
        title: "What We Collect",
        icon: Shield,
        intro:
            "We collect information you provide directly, information generated through transactions, and certain technical or behavioural data needed to operate the platform.",
        items: [
            "Account and profile data such as name, date of birth, address, phone number, email address, login details, and order history.",
            "Transaction and payment data such as order amount, payment status, refund status, masked payment method details, and related identifiers received from Razorpay or other payment partners.",
            "Sensitive or optional data, where relevant to platform features and lawful use, may include payment instrument information handled through hosted checkout, proof-of-identity details, and image or facial-feature data submitted for AI try-on or similar personalisation flows.",
            "Usage and behavioural data such as IP address, browser type, device information, interaction patterns, preferences, and activity on the platform.",
        ],
    },
    {
        id: "3",
        title: "How We Use and Share Data",
        icon: RefreshCcw,
        intro:
            "We use personal data to provide the services you request and to operate, secure, and improve the platform.",
        items: [
            "To register accounts, process purchases, arrange shipping, handle customer support, manage cancellations, returns, replacements, and refunds, and improve customer experience.",
            "To detect and prevent fraud, troubleshoot issues, investigate disputes, enforce platform terms, conduct analytics, marketing research, and send service or promotional communications where permitted.",
            "To share necessary information with affiliates, sellers, logistics partners, payment partners such as Razorpay, prepaid payment instrument issuers, technology providers, marketing or business partners, and legal or regulatory authorities where disclosure is required or reasonably necessary.",
            "If a third-party business partner collects your data directly, its own privacy policy may apply to that collection and processing.",
        ],
    },
    {
        id: "4",
        title: "Payments and Fraud Safety",
        icon: Lock,
        intro:
            "Online payments are processed through Razorpay, and sensitive payment instrument credentials are intended to remain within hosted payment flows rather than being stored on the AiVestire interface.",
        items: [
            "We do not intend to store full card numbers, CVV, net-banking passwords, UPI PINs, or similar payment credentials on our servers.",
            "Limited personal and transaction data may be shared with Razorpay to authenticate, verify, capture, refund, reconcile, and secure transactions.",
            "If you receive an email, message, or call claiming to be from us and asking for card PIN, CVV, net-banking password, or mobile-banking credentials, do not share that information and report the incident immediately.",
        ],
    },
    {
        id: "5",
        title: "Security, Retention, Deletion, and Rights",
        icon: Mail,
        intro:
            "We use reasonable security practices and procedures, but internet transmission and storage systems can never be guaranteed to be completely risk free.",
        items: [
            "We retain personal data only for as long as reasonably required for the purpose for which it was collected, or as required for fraud prevention, dispute handling, pending shipments, regulatory compliance, or other legitimate business purposes.",
            "You may request access, correction, update, or deletion of personal data we control, subject to pending claims, unresolved support matters, legal retention requirements, or service dependencies.",
            "Account deletion or data removal requests may reduce or remove access to your account and related platform services.",
            `For privacy requests, write to ${PRIVACY_EMAIL}. For order, refund, or delivery support, write to ${SUPPORT_EMAIL}.`,
        ],
    },
];

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-800">
            <Navbar />

            <div className="relative overflow-hidden bg-[#1a1a1a] py-24 text-white md:py-32">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                    <h1 className="mb-6 text-4xl font-serif tracking-wide text-[#D4AF37] md:text-6xl">
                        Privacy Policy
                    </h1>
                    <div className="mx-auto mb-8 h-1 w-24 bg-[#D4AF37]" />
                    <p className="mx-auto max-w-3xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
                        This policy explains how personal data is collected, used, stored, shared,
                        and protected across the platform and related services.
                    </p>
                    <p className="mt-8 text-sm uppercase tracking-widest text-[#D4AF37]/80">
                        Last Updated: {LEGAL_LAST_UPDATED}
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-20">
                <div className="mb-10 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-6 text-sm leading-7 text-gray-700">
                    {LEGAL_ENTITY_NAME} operates {BRAND_NAME}. Our registered office address is{" "}
                    <span className="font-semibold text-[#1a1a1a]">{REGISTERED_OFFICE_ADDRESS}</span>.
                </div>

                <div className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                        <TriangleAlert className="h-4 w-4" />
                        Payment Safety Notice
                    </div>
                    Never share card PIN, CVV, net-banking password, OTP, or UPI PIN with anyone
                    claiming to represent {BRAND_NAME}. Hosted checkout and secure verification
                    should happen through approved payment interfaces only.
                </div>

                <div className="space-y-12">
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
                                            Section {section.id}
                                        </p>
                                        <h2 className="text-3xl font-serif text-[#1a1a1a]">
                                            {section.title}
                                        </h2>
                                    </div>
                                </div>

                                <p className="mb-6 text-base leading-7 text-gray-600">
                                    {section.intro}
                                </p>

                                <div className="space-y-4">
                                    {section.items.map((item) => (
                                        <div key={item} className="flex items-start gap-3">
                                            <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-[#D4AF37]" />
                                            <p className="text-sm leading-7 text-gray-600">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <div className="mt-14 rounded-3xl border border-[#D4AF37]/20 bg-[#1a1a1a] p-8 text-white">
                    <div className="mb-4 flex items-center gap-3">
                        <Mail className="h-5 w-5 text-[#D4AF37]" />
                        <h2 className="text-2xl font-serif text-[#D4AF37]">Grievance and Privacy Contact</h2>
                    </div>
                    <div className="space-y-3 text-sm leading-7 text-gray-300">
                        <p>
                            Grievance and privacy requests can be sent to{" "}
                            <a
                                href={`mailto:${PRIVACY_EMAIL}`}
                                className="font-semibold text-white underline underline-offset-4"
                            >
                                {PRIVACY_EMAIL}
                            </a>
                            .
                        </p>
                        <p>{LEGAL_ENTITY_NAME}</p>
                        <p>{REGISTERED_OFFICE_ADDRESS}</p>
                        <p>
                            You may withdraw previously given consent by contacting us in writing.
                            We may verify such requests before acting on them, and withdrawal will
                            not invalidate prior lawful processing.
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
