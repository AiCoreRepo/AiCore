import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    Truck,
    BadgeIndianRupee,
    MapPin,
    Clock3,
    Mail,
} from "lucide-react";
import {
    LEGAL_LAST_UPDATED,
    SUPPORT_EMAIL,
} from "@/constants/legal.constants";

const sections = [
    {
        id: "1",
        title: "Shipping Method",
        icon: Truck,
        content: [
            "Orders are generally shipped through registered domestic courier companies and/or speed post.",
            "Shipping and delivery remain subject to courier company, logistics partner, and postal-service norms.",
            "Delivery is attempted to the address provided by the buyer at the time of purchase or as otherwise confirmed for the order.",
        ],
    },
    {
        id: "2",
        title: "Dispatch and Delivery Timeline",
        icon: Clock3,
        content: [
            "Orders are generally shipped within 10 days from the date of order or payment, or as per the delivery timeline agreed at the time of order confirmation.",
            "Operational, logistics, inventory, weather, and carrier-related factors may affect dispatch or delivery timing.",
            "The Platform Owner is not liable for delay caused solely by courier companies, postal authorities, or other external logistics providers beyond reasonable control.",
        ],
    },
    {
        id: "3",
        title: "Address, Confirmation, and Delivery Communication",
        icon: MapPin,
        content: [
            "Customers must provide a complete and accurate delivery address, contact number, and any required landmark details.",
            "Delivery or shipment-related confirmation may be sent to the email address provided at the time of registration or purchase.",
            "If delivery fails because of incorrect address details, recipient unavailability, or refusal to accept the package, re-shipping, cancellation, or support review may be required.",
        ],
    },
    {
        id: "4",
        title: "Shipping Charges",
        icon: BadgeIndianRupee,
        content: [
            "Any shipping or delivery charge shown at checkout or order confirmation forms part of the order pricing applicable to that purchase.",
            "If shipping charges are levied by the seller or Platform Owner, such shipping charges are generally non-refundable unless otherwise required by law or expressly stated otherwise.",
            "Taxes, promotional discounts, or category-specific shipping terms may apply separately where shown on the platform.",
        ],
    },
];

const ShippingPolicy = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="relative overflow-hidden bg-[#1a1a1a] py-24 text-white md:py-32">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                    <h1 className="mb-6 text-4xl font-serif tracking-wide text-[#D4AF37] md:text-6xl">
                        Shipping Policy
                    </h1>
                    <div className="mx-auto mb-8 h-1 w-24 bg-[#D4AF37]" />
                    <p className="mx-auto max-w-3xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
                        This version now covers the key shipping points from your PDF, including
                        domestic courier dispatch, the 10-day shipping statement, delivery to the
                        buyer-provided address, email confirmation, and non-refundable shipping
                        charges where applicable.
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
                                            Shipping {section.id}
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
                        <h2 className="text-2xl font-serif text-[#1a1a1a]">Shipment Support</h2>
                    </div>
                    <p className="mx-auto max-w-3xl text-sm leading-7 text-gray-700">
                        For delivery, tracking, or address-related questions, contact{" "}
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="font-semibold text-[#1a1a1a] underline decoration-[#D4AF37] underline-offset-4"
                        >
                            {SUPPORT_EMAIL}
                        </a>
                        .
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ShippingPolicy;
