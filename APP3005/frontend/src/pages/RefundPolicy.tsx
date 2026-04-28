import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    Ban,
    PackageCheck,
    CreditCard,
    BadgeAlert,
    Mail,
} from "lucide-react";
import {
    LEGAL_LAST_UPDATED,
    SUPPORT_EMAIL,
} from "@/constants/legal.constants";

const policyBlocks = [
    {
        id: "1",
        title: "Cancellation Requests",
        icon: Ban,
        points: [
            "Cancellation requests should generally be raised within 2 days of placing the order.",
            "Cancellation may not be entertained once the order has been communicated to the seller or merchant and shipping has already started, or once the product is out for delivery.",
            "Where shipment is already out for delivery, you may reject the product at the doorstep if the order is still eligible for refusal.",
            "Certain categories marked as non-cancellable, non-returnable, or otherwise restricted at the time of purchase may not be eligible for cancellation.",
        ],
    },
    {
        id: "2",
        title: "Damaged, Defective, or Mismatched Products",
        icon: PackageCheck,
        points: [
            "If you receive a damaged or defective item, please report it to customer support within 2 days of receiving the product.",
            "If the product received is materially different from what was shown or described, please notify customer support within 2 days of receipt.",
            "The seller or merchant may verify the complaint before refund, replacement, or exchange approval is granted.",
            "For products carrying a separate manufacturer warranty, warranty-related complaints may need to be addressed with the manufacturer directly.",
        ],
    },
    {
        id: "3",
        title: "Refund Processing",
        icon: CreditCard,
        points: [
            "Approved refunds are generally processed within 7 days.",
            "For prepaid orders, refunds are generally routed back to the original payment method used at checkout, subject to gateway, bank, or issuer processing.",
            "Razorpay or the relevant payment provider may be involved in refund routing, verification, and status updates for online transactions.",
            "The time taken for the amount to reflect in your account may vary depending on your bank, card network, or payment instrument provider.",
        ],
    },
    {
        id: "4",
        title: "Important Notes",
        icon: BadgeAlert,
        points: [
            "Refund, replacement, exchange, and cancellation decisions may depend on the product category, shipping stage, seller verification, and the condition of the returned item.",
            "If a category-specific, product-specific, or promotional policy applies to a purchase, that policy may operate in addition to this general page.",
            "For return and exchange rules, please also review the separate Return Policy page.",
        ],
    },
];

const RefundPolicy = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="border-b border-neutral-100 bg-neutral-50 pt-24 pb-12">
                <div className="mx-auto max-w-4xl px-6 text-center">
                    <h1 className="mb-4 text-4xl font-serif text-gray-900 md:text-5xl">
                        Refund and Cancellation Policy
                    </h1>
                    <div className="mx-auto mb-6 h-1 w-24 bg-[#D4AF37]" />
                    <p className="mx-auto max-w-3xl text-gray-500">
                        This policy explains cancellation eligibility, damaged-product reporting,
                        refund timelines, and the key conditions that apply to order-related
                        refunds and cancellations.
                    </p>
                    <p className="mt-4 text-sm text-gray-400">Last Updated: {LEGAL_LAST_UPDATED}</p>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-16">
                <div className="space-y-8">
                    {policyBlocks.map((block) => {
                        const Icon = block.icon;

                        return (
                            <section
                                key={block.id}
                                className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm"
                            >
                                <div className="mb-6 flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                                            Policy {block.id}
                                        </p>
                                        <h2 className="text-3xl font-serif text-gray-900">
                                            {block.title}
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {block.points.map((point) => (
                                        <p key={point} className="text-sm leading-7 text-gray-600">
                                            {point}
                                        </p>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <div className="mt-14 rounded-3xl bg-[#1a1a1a] p-8 text-white">
                    <div className="mb-4 flex items-center justify-center gap-3 text-center">
                        <Mail className="h-5 w-5 text-[#D4AF37]" />
                        <h2 className="text-2xl font-serif text-[#D4AF37]">Need Help With an Order?</h2>
                    </div>
                    <p className="mx-auto max-w-3xl text-center text-sm leading-7 text-gray-300">
                        For cancellation, damaged-product, mismatch, or refund support, contact{" "}
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="font-semibold text-white underline underline-offset-4"
                        >
                            {SUPPORT_EMAIL}
                        </a>
                        {" "}and include your order number.
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default RefundPolicy;
