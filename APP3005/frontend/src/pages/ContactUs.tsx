import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    Mail,
    LifeBuoy,
    Shield,
    ShoppingBag,
    Building2,
    Clock3,
} from "lucide-react";
import {
    LEGAL_ENTITY_NAME,
    LEGAL_LAST_UPDATED,
    PRIVACY_EMAIL,
    REGISTERED_OFFICE_ADDRESS,
    SUPPORT_EMAIL,
    SUPPORT_HOURS,
} from "@/constants/legal.constants";

const contactCards = [
    {
        title: "Order and Delivery Support",
        icon: ShoppingBag,
        description:
            "Use this for order status, delivery delays, cancellations, returns, replacements, and refund follow-ups.",
        email: SUPPORT_EMAIL,
    },
    {
        title: "Payment Support",
        icon: LifeBuoy,
        description:
            "Use this for Razorpay checkout issues, payment verification concerns, duplicate payment questions, and failed transaction follow-up.",
        email: SUPPORT_EMAIL,
    },
    {
        title: "Privacy and Grievance Contact",
        icon: Shield,
        description:
            "Use this for privacy questions, data access or correction requests, consent withdrawal, and grievance-related issues.",
        email: PRIVACY_EMAIL,
    },
];

const ContactUs = () => {
    return (
        <div className="min-h-screen bg-white text-gray-800">
            <Navbar />

            <div className="relative overflow-hidden bg-[#1a1a1a] py-24 text-white md:py-32">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                    <h1 className="mb-6 text-4xl font-serif tracking-wide text-[#D4AF37] md:text-6xl">
                        Contact Us
                    </h1>
                    <div className="mx-auto mb-8 h-1 w-24 bg-[#D4AF37]" />
                    <p className="mx-auto max-w-3xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
                        This page now also serves as the contact and grievance reference point for
                        the legal pages based on the policy PDF you shared.
                    </p>
                    <p className="mt-8 text-sm uppercase tracking-widest text-[#D4AF37]/80">
                        Last Updated: {LEGAL_LAST_UPDATED}
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-20">
                <div className="grid gap-8 md:grid-cols-3">
                    {contactCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <section
                                key={card.title}
                                className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm"
                            >
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h2 className="mb-3 text-2xl font-serif text-[#1a1a1a]">
                                    {card.title}
                                </h2>
                                <p className="mb-5 text-sm leading-7 text-gray-600">
                                    {card.description}
                                </p>
                                <a
                                    href={`mailto:${card.email}`}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a1a] underline decoration-[#D4AF37] underline-offset-4"
                                >
                                    <Mail className="h-4 w-4 text-[#D4AF37]" />
                                    {card.email}
                                </a>
                            </section>
                        );
                    })}
                </div>

                <div className="mt-12 grid gap-8 md:grid-cols-2">
                    <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-[#D4AF37]" />
                            <h2 className="text-2xl font-serif text-[#1a1a1a]">Registered Office</h2>
                        </div>
                        <p className="text-sm leading-7 text-gray-600">{LEGAL_ENTITY_NAME}</p>
                        <p className="text-sm leading-7 text-gray-600">{REGISTERED_OFFICE_ADDRESS}</p>
                    </section>

                    <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <Clock3 className="h-5 w-5 text-[#D4AF37]" />
                            <h2 className="text-2xl font-serif text-[#1a1a1a]">Support Window</h2>
                        </div>
                        <p className="text-sm leading-7 text-gray-600">{SUPPORT_HOURS}</p>
                        <p className="text-sm leading-7 text-gray-600">
                            If you need a grievance or privacy response, please contact{" "}
                            <a
                                href={`mailto:${PRIVACY_EMAIL}`}
                                className="font-semibold text-[#1a1a1a] underline decoration-[#D4AF37] underline-offset-4"
                            >
                                {PRIVACY_EMAIL}
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ContactUs;
