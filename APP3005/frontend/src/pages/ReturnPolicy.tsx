import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    RotateCcw,
    Package,
    ClipboardCheck,
    ShieldCheck,
    Mail,
} from "lucide-react";
import {
    LEGAL_LAST_UPDATED,
    SUPPORT_EMAIL,
} from "@/constants/legal.constants";

const sections = [
    {
        id: "1",
        title: "Return and Exchange Window",
        icon: RotateCcw,
        content: [
            "We generally offer return or exchange requests within the first 2 days from the applicable purchase or delivery timeline communicated for the order.",
            "If more than 2 days have passed under the applicable return window, return, exchange, or refund requests may not be accepted unless otherwise required by law or a category-specific policy.",
            "Only eligible products and categories may be returned or exchanged under this page.",
        ],
    },
    {
        id: "2",
        title: "Eligibility Conditions",
        icon: Package,
        content: [
            "To qualify for return or exchange, the item should be unused and in the same condition in which it was received.",
            "The item should generally be returned with original packaging, tags, accessories, and proof of purchase where applicable.",
            "Items purchased on sale or in specially marked categories may not be eligible for return or exchange.",
            "Only items found defective or damaged may be eligible for replacement on an exchange request.",
        ],
    },
    {
        id: "3",
        title: "Exemptions and Inspection",
        icon: ClipboardCheck,
        content: [
            "Certain categories of products may be exempt from returns, refunds, or exchanges. Such exclusions may be identified at the time of purchase.",
            "For accepted return or exchange requests, the returned item may be inspected after receipt and before final approval.",
            "You may receive confirmation by email once the returned or exchanged product is received and reviewed.",
        ],
    },
    {
        id: "4",
        title: "Outcome After Approval",
        icon: ShieldCheck,
        content: [
            "If the return or exchange passes quality review, it will be processed in accordance with the applicable refund, exchange, or seller policy.",
            "Refunds, where approved, are generally handled under the separate Refund and Cancellation Policy.",
            "If inspection fails, the return or exchange may be declined and the item may be sent back to you where operationally applicable.",
        ],
    },
];

const ReturnPolicy = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="relative overflow-hidden bg-[#1a1a1a] py-24 text-white md:py-32">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                    <h1 className="mb-6 text-4xl font-serif tracking-wide text-[#D4AF37] md:text-6xl">
                        Return Policy
                    </h1>
                    <div className="mx-auto mb-8 h-1 w-24 bg-[#D4AF37]" />
                    <p className="mx-auto max-w-3xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
                        This policy explains the conditions, timelines, and review process for
                        returns, replacements, and eligible exchanges.
                    </p>
                    <p className="mt-8 text-sm uppercase tracking-widest text-[#D4AF37]/80">
                        Last Updated: {LEGAL_LAST_UPDATED}
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-20">
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
                                            Return {section.id}
                                        </p>
                                        <h2 className="text-3xl font-serif text-[#1a1a1a]">
                                            {section.title}
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {section.content.map((paragraph) => (
                                        <p key={paragraph} className="text-sm leading-7 text-gray-600">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <div className="mt-14 rounded-3xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-8 text-center">
                    <div className="mb-4 flex items-center justify-center gap-3">
                        <Mail className="h-5 w-5 text-[#D4AF37]" />
                        <h2 className="text-2xl font-serif text-[#1a1a1a]">Return Support</h2>
                    </div>
                    <p className="mx-auto max-w-3xl text-sm leading-7 text-gray-700">
                        For return or exchange help, contact{" "}
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="font-semibold text-[#1a1a1a] underline decoration-[#D4AF37] underline-offset-4"
                        >
                            {SUPPORT_EMAIL}
                        </a>
                        {" "}with your order number and issue details.
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ReturnPolicy;
