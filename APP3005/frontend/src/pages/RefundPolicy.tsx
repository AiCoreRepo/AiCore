import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const RefundPolicy = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <div className="pt-24 pb-12 bg-neutral-50 border-b border-neutral-100">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4">
                        Refund & Return Policy
                    </h1>
                    <div className="w-24 h-1 bg-[#D4AF37] mx-auto mb-6"></div>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Your satisfaction is our priority. Learn about our return process and refund eligibility.
                    </p>
                    <p className="text-sm text-gray-400 mt-4">Last Updated: February 2026</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="prose prose-lg max-w-none text-gray-600">
                    <section className="mb-12">
                        <h2 className="text-2xl font-serif text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center text-sm font-bold">1</span>
                            Returns
                        </h2>
                        <p className="mb-6">
                            We have a 30-day return policy, which means you have 30 days after receiving your item to request a return.
                        </p>
                        <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100 flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-2">Eligibility Criteria</h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li>Item must be in the same condition as received.</li>
                                    <li>Unworn and unused.</li>
                                    <li>With tags, and in its original packaging.</li>
                                    <li>Receipt or proof of purchase is required.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-serif text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center text-sm font-bold">2</span>
                            Refunds
                        </h2>
                        <p className="mb-4">
                            We will notify you once we’ve received and inspected your return, and let you know if the refund was approved or not. If approved, you’ll be automatically refunded on your original payment method.
                        </p>
                        <p className="text-sm italic text-gray-500">
                            Please remember it can take some time for your bank or credit card company to process and post the refund too.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-serif text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center text-sm font-bold">3</span>
                            Exchanges
                        </h2>
                        <p className="mb-4">
                            The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-serif text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center text-sm font-bold">4</span>
                            Damages and Issues
                        </h2>
                        <p className="mb-4">
                            Please inspect your order upon reception and contact us immediately if the item is defective, damaged or if you receive the wrong item, so that we can evaluate the issue and make it right.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-100 text-center">
                    <p className="text-gray-500 mb-6 font-medium">Have an issue with your order?</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="mailto:support@aivestire.com" className="inline-flex items-center justify-center px-8 py-3 bg-[#D4AF37] text-white hover:bg-[#C9A55C] rounded-full transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1">
                            Contact Support
                        </a>
                        <a href="/faq" className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-full transition-all duration-300 font-medium tracking-wide">
                            View FAQ
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default RefundPolicy;
