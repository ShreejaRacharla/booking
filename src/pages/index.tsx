import Link from 'next/link'
import { useState } from 'react'
import { Search, BarChart3, CheckCircle, DollarSign } from 'lucide-react'

export default function LandingPage() {
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
    }

    return (
        <div className="min-h-screen bg-rotary-white relative overflow-hidden flex flex-col">
            <div className="absolute top-[-5%] left-[-10%] w-[60%] h-[60%] bg-rotary-sky/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-rotary-azure/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[30%] w-[40%] h-[40%] bg-rotary-turquoise/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

            <nav className="w-full backdrop-blur-md border-b border-rotary-lightgray p-4 sticky top-0 z-50 bg-rotary-white/80">
                <div className="container mx-auto flex justify-between items-center max-w-6xl px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rotary-royal to-rotary-azure flex items-center justify-center shadow-lg shadow-rotary-royal/30">
                            <span className="text-rotary-white font-bold text-xl leading-none">R</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-extrabold text-rotary-black tracking-tight">
                                Booking<span className="text-rotary-gold font-light">Service</span>
                            </span>
                            <span className="text-xs text-rotary-darkgray font-medium">Reserve with Confidence</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <Link
                            href="/login"
                            className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-rotary-royal to-rotary-azure hover:from-rotary-royal/90 hover:to-rotary-azure/90 text-rotary-white rounded-lg shadow-lg shadow-rotary-royal/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-grow flex flex-col items-center justify-center px-4 relative z-10 pt-12 md:pt-20 pb-20 md:pb-32">
                <div className="max-w-4xl w-full text-center space-y-8">

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rotary-gold/30 bg-rotary-gold/5 text-sm font-semibold text-rotary-gold animate-fade-in shadow-sm hover:border-rotary-gold/50 transition-colors">
                        <span className="flex w-2.5 h-2.5 rounded-full bg-rotary-gold animate-pulse" />
                        Seamless Booking Experience
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-rotary-black leading-[1.1] animate-fade-in">
                        Book your next <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rotary-royal via-rotary-azure to-rotary-sky">
                            experience effortlessly
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-rotary-darkgray max-w-2xl mx-auto font-light leading-relaxed">
                        Find and securely reserve facilities and timeslots with dynamic availability, intelligent approvals, and seamless payments.
                    </p>

                    <form
                        onSubmit={handleSearch}
                        className="w-full max-w-2xl mx-auto mt-12 relative animate-fade-in group"
                    >
                        <div className="bg-rotary-white/95 backdrop-blur-sm p-2 pl-6 rounded-2xl flex items-center gap-4 shadow-2xl shadow-rotary-royal/10 ring-2 ring-rotary-lightgray group-focus-within:ring-rotary-royal/50 group-focus-within:shadow-rotary-royal/15 transition-all duration-300 border border-rotary-lightgray group-focus-within:border-rotary-royal/30">
                            <Search className="h-6 w-6 text-rotary-sky/60 flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search facilities, locations, services..."
                                className="flex-grow bg-transparent border-none outline-none text-base text-rotary-black placeholder:text-rotary-midgray py-3 font-medium"
                            />
                            <button
                                type="submit"
                                className="px-8 py-3 bg-gradient-to-r from-rotary-royal to-rotary-azure hover:from-rotary-royal/90 hover:to-rotary-azure/90 text-rotary-white font-semibold rounded-xl shadow-lg shadow-rotary-royal/20 transition-all duration-200 active:scale-95 hover:-translate-y-0.5 flex-shrink-0"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-12 border-t border-rotary-lightgray">
                        <div className="p-6 rounded-xl bg-gradient-to-br from-rotary-royal/5 to-rotary-azure/5 border border-rotary-lightgray hover:border-rotary-royal/30 transition-all duration-200 group cursor-default">
                            <div className="w-12 h-12 rounded-lg bg-rotary-royal/10 flex items-center justify-center mb-4 group-hover:bg-rotary-royal/20 transition-colors">
                                <BarChart3 className="w-6 h-6 text-rotary-royal" />
                            </div>
                            <h3 className="text-lg font-bold text-rotary-black mb-2">Smart Availability</h3>
                            <p className="text-sm text-rotary-darkgray">Real-time facility and timeslot availability with instant updates</p>
                        </div>

                        <div className="p-6 rounded-xl bg-gradient-to-br from-rotary-sky/5 to-rotary-turquoise/5 border border-rotary-lightgray hover:border-rotary-sky/30 transition-all duration-200 group cursor-default">
                            <div className="w-12 h-12 rounded-lg bg-rotary-sky/10 flex items-center justify-center mb-4 group-hover:bg-rotary-sky/20 transition-colors">
                                <CheckCircle className="w-6 h-6 text-rotary-sky" />
                            </div>
                            <h3 className="text-lg font-bold text-rotary-black mb-2">Intelligent Approvals</h3>
                            <p className="text-sm text-rotary-darkgray">Streamlined approval workflow with multi-level verification</p>
                        </div>

                        <div className="p-6 rounded-xl bg-gradient-to-br from-rotary-gold/5 to-rotary-cranberry/5 border border-rotary-lightgray hover:border-rotary-gold/30 transition-all duration-200 group cursor-default">
                            <div className="w-12 h-12 rounded-lg bg-rotary-gold/10 flex items-center justify-center mb-4 group-hover:bg-rotary-gold/20 transition-colors">
                                <DollarSign className="w-6 h-6 text-rotary-gold" />
                            </div>
                            <h3 className="text-lg font-bold text-rotary-black mb-2">Secure Payments</h3>
                            <p className="text-sm text-rotary-darkgray">Safe and secure payment processing with multiple methods</p>
                        </div>
                    </div>

                </div>
            </main>

            <footer className="w-full py-6 px-4 text-center border-t border-rotary-lightgray bg-rotary-white/50 backdrop-blur-sm">
                <p className="text-sm text-rotary-midgray">
                    © {new Date().getFullYear()} BookingService. Powered by Rotary International Colors.
                </p>
                <div className="flex justify-center gap-4 mt-3 text-xs">
                    <Link href="#" className="text-rotary-darkgray hover:text-rotary-royal transition-colors">Privacy</Link>
                    <span className="text-rotary-lightgray">•</span>
                    <Link href="#" className="text-rotary-darkgray hover:text-rotary-royal transition-colors">Terms</Link>
                    <span className="text-rotary-lightgray">•</span>
                    <Link href="#" className="text-rotary-darkgray hover:text-rotary-royal transition-colors">Contact</Link>
                </div>
            </footer>
        </div>
    )
}