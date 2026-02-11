import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Lock, Eye, FileText } from "lucide-react";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-800">
            <Navbar />

            {/* Elegant Hero Section */}
            <div className="relative py-24 md:py-32 bg-[#1a1a1a] text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
                    <h1 className="text-4xl md:text-6xl font-serif text-[#D4AF37] mb-6 tracking-wide">
                        Privacy Policy
                    </h1>
                    <div className="w-24 h-1 bg-[#D4AF37] mx-auto mb-8"></div>
                    <p className="text-gray-300 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed">
                        We value your trust and are committed to protecting your personal information with the highest standards of security.
                    </p>
                    <p className="text-sm text-[#D4AF37]/80 mt-8 uppercase tracking-widest">Last Updated: February 2026</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-lg max-w-none text-gray-600 space-y-16">

                    {/* Section 1 */}
                    <section className="relative pl-8 md:pl-12 border-l-2 border-[#D4AF37]/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center text-sm font-bold">1</div>
                        <h2 className="text-3xl font-serif text-[#1a1a1a] mb-6 mt-0">Information Collection</h2>
                        <p className="leading-relaxed mb-6">
                            We collect information to provide better services to all our users. This includes:
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="p-3 bg-[#D4AF37]/10 w-fit rounded-lg mb-4 text-[#D4AF37]">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Information you give us</h3>
                                <p className="text-sm text-gray-500">Name, email, shipping address, and payment details provided during checkout or account creation.</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="p-3 bg-[#D4AF37]/10 w-fit rounded-lg mb-4 text-[#D4AF37]">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Usage Information</h3>
                                <p className="text-sm text-gray-500">Details about how you use our site, including traffic data, location data, and other communication data.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="relative pl-8 md:pl-12 border-l-2 border-[#D4AF37]/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center text-sm font-bold">2</div>
                        <h2 className="text-3xl font-serif text-[#1a1a1a] mb-6 mt-0">How We Use Your Data</h2>
                        <p className="leading-relaxed mb-4">
                            We use the information we collect for various purposes, including:
                        </p>
                        <ul className="space-y-4 text-gray-600">
                            <li className="flex items-start gap-3">
                                <span className="text-[#D4AF37] mt-1.5">●</span>
                                <span>To provide and maintain our Service, including monitoring the usage of our Service.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-[#D4AF37] mt-1.5">●</span>
                                <span>To manage your Account: to manage your registration as a user of the Service.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-[#D4AF37] mt-1.5">●</span>
                                <span>To contact you: regarding updates or informative communications related to the functionalities.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-[#D4AF37] mt-1.5">●</span>
                                <span>To provide you with news, special offers and general information about other goods.</span>
                            </li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="relative pl-8 md:pl-12 border-l-2 border-[#D4AF37]/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center text-sm font-bold">3</div>
                        <h2 className="text-3xl font-serif text-[#1a1a1a] mb-6 mt-0">Data Security</h2>
                        <div className="bg-[#1a1a1a] text-gray-300 p-8 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Lock className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-serif text-[#D4AF37] mb-4">Your Security matters</h3>
                                <p className="leading-relaxed">
                                    The security of your Personal Data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="relative pl-8 md:pl-12 border-l-2 border-[#D4AF37]/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center text-sm font-bold">4</div>
                        <h2 className="text-3xl font-serif text-[#1a1a1a] mb-6 mt-0">Contact Us</h2>
                        <p className="leading-relaxed mb-8">
                            If you have specific questions about this Privacy Policy, you can contact us:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="mailto:privacy@aivestire.com" className="inline-flex items-center justify-center px-8 py-4 bg-[#1a1a1a] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1a1a1a] rounded-lg transition-all duration-300 font-medium tracking-wide shadow-lg group">
                                <Shield className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                                Contact Privacy Team
                            </a>
                        </div>
                    </section>

                </div>
            </div>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
