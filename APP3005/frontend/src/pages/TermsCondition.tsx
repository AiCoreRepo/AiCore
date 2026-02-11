import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollText, Gavel, Scale, AlertCircle } from "lucide-react";

const TermsCondition = () => {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-800">
            <Navbar />

            {/* Elegant Hero Section */}
            <div className="relative py-24 md:py-32 bg-[#1a1a1a] text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
                    <h1 className="text-4xl md:text-6xl font-serif text-[#D4AF37] mb-6 tracking-wide">
                        Terms & Conditions
                    </h1>
                    <div className="w-24 h-1 bg-[#D4AF37] mx-auto mb-8"></div>
                    <p className="text-gray-300 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed">
                        Please read these terms and conditions carefully before using appropriate services operated by AiVestire.
                    </p>
                    <p className="text-sm text-[#D4AF37]/80 mt-8 uppercase tracking-widest">Last Updated: February 2026</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-lg max-w-none text-gray-600 space-y-16">

                    {/* Introduction */}
                    <section className="relative pl-8 md:pl-12 border-l-2 border-[#D4AF37]/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center text-sm font-bold">1</div>
                        <h2 className="text-3xl font-serif text-[#1a1a1a] mb-6 mt-0">Conditions of Use</h2>
                        <div className="flex flex-col md:flex-row gap-6 items-start bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <div className="p-3 bg-[#D4AF37]/10 w-fit rounded-lg text-[#D4AF37] flex-shrink-0">
                                <ScrollText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-0">Agreement to Terms</h3>
                                <p className="text-gray-600 mb-0">
                                    By using this website, you certify that you have read and reviewed this Agreement and that you agree to comply with its terms. If you do not want to be bound by the terms of this Agreement, you are advised to stop using the website accordingly.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Intellectual Property */}
                    <section className="relative pl-8 md:pl-12 border-l-2 border-[#D4AF37]/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center text-sm font-bold">2</div>
                        <h2 className="text-3xl font-serif text-[#1a1a1a] mb-6 mt-0">Intellectual Property</h2>
                        <p className="leading-relaxed mb-4">
                            You agree that all materials, products, and services provided on this website are the property of AiVestire, its affiliates, directors, officers, employees, agents, suppliers, or licensors including all copyrights, trade secrets, trademarks, patents, and other intellectual property.
                        </p>
                        <ul className="grid md:grid-cols-2 gap-4 mt-8">
                            <li className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                                <span className="font-medium text-gray-700">Copyrights & Trademarks</span>
                            </li>
                            <li className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                                <span className="font-medium text-gray-700">Digital Assets & Images</span>
                            </li>
                            <li className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                                <span className="font-medium text-gray-700">AI Generated Content</span>
                            </li>
                            <li className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                                <span className="font-medium text-gray-700">User Interface Design</span>
                            </li>
                        </ul>
                    </section>

                    {/* User Accounts */}
                    <section className="relative pl-8 md:pl-12 border-l-2 border-[#D4AF37]/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center text-sm font-bold">3</div>
                        <h2 className="text-3xl font-serif text-[#1a1a1a] mb-6 mt-0">User Accounts</h2>
                        <div className="bg-[#1a1a1a] text-gray-300 p-8 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Scale className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-serif text-[#D4AF37] mb-4 mt-0">Your Responsibility</h3>
                                <p className="leading-relaxed mb-4">
                                    As a user of this website, you may be asked to register with us and provide private information. You are responsible for enhancing the accuracy of this information, and you are responsible for maintaining the safety and security of your identifying information.
                                </p>
                                <p className="leading-relaxed mb-0 text-sm text-gray-400">
                                    You are also responsible for all activities that occur under your account or password. If you think there are any possible issues regarding the security of your account on the website, inform us immediately so we may address them accordingly.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Disputes */}
                    <section className="relative pl-8 md:pl-12 border-l-2 border-[#D4AF37]/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center text-sm font-bold">4</div>
                        <h2 className="text-3xl font-serif text-[#1a1a1a] mb-6 mt-0">Applicable Law</h2>
                        <div className="flex items-start gap-4">
                            <Gavel className="w-6 h-6 text-[#D4AF37] mt-1 flex-shrink-0" />
                            <p className="leading-relaxed mt-0">
                                By visiting this website, you agree that the laws, without regard to principles of conflict laws, will govern these terms and conditions, or any dispute of any sort that might come between AiVestire and you, or its business partners and associates.
                            </p>
                        </div>
                    </section>

                    {/* Acceptance */}
                    <div className="mt-16 pt-12 border-t border-gray-100 text-center">
                        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-sm font-semibold uppercase tracking-wider mb-6">
                            <AlertCircle className="w-4 h-4" />
                            Acceptance of Terms
                        </div>
                        <p className="text-gray-500 mb-8 max-w-xl mx-auto">
                            By continuing to use our website, you acknowledge that you have read and understood these Terms and Conditions.
                        </p>
                        <a href="/" className="inline-flex items-center justify-center px-8 py-4 bg-[#1a1a1a] text-white hover:bg-[#D4AF37] hover:text-[#1a1a1a] rounded-lg transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1">
                            Continue Shopping
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default TermsCondition;
