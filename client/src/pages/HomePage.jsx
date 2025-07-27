import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const HomePage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navbar />

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-10 sm:px-20 md:px-30 lg:px-40 py-15">
                <div className="text-center">

                    <div className="mb-6">
                        <span className="inline-block px-4 py-1.5 text-sm text-medium bg-black text-white rounded-full mb-4">Digicam-First Format Converter</span>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-gradient-to-r from-black via-gray-700 to-black bg-clip-text text-transparent">Let’s help you showcase the moments that matter</h1>
                    <p className="mx-auto my-6 max-w-[700px] text-gray-600 md:text-lg lg:text-xl leading-relaxed mb-5">Preserve priceless digicam moments, convert them into future-proof formats, and relive your memories anytime, anywhere.</p>
                    
                    <div className="flex flex-col sm:flex-col md:flex-row justify-center md:space-x-4 space-y-4 md:space-y-0 mt-8 mb-16">
                        <Link to="/register" className="px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition-all duration-300 hover:shadow-lg hover-lift flex items-center justify-center">
                            Get Started 
                        </Link>
                        <Link to="/upload" className="px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-black bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-all duration-300 hover:shadow-md hover-lift flex items-center justify-center">
                            See How It Works
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center border-r last:border-r-0 border-gray-200">
                            <span className="text-4xl font-bold text-black block mb-2">3</span>
                            <span>Free uploads daily</span>
                        </div>
                        <div className="text-center border-r last:border-r-0 border-gray-200">
                            <span className="text-4xl font-bold text-black block mb-2">∞</span>
                            <span>Unlimited for members</span>
                        </div>
                        <div className="text-center border-r last:border-r-0 border-gray-200">
                            <span className="text-4xl font-bold text-black block mb-2">7</span>
                            <span>Supported formats</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-16">Why Choose DigiConverter?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">🚀</div>
                            <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
                            <p>Convert your files in seconds with our optimized processing engine.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
                            <p>Your files are processed securely and deleted automatically after 24 hours.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">💎</div>
                            <h3 className="text-xl font-semibold mb-3">High Quality</h3>
                            <p>Maintain the best possible quality during conversion with our advanced algorithms.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">📱</div>
                            <h3 className="text-xl font-semibold mb-3">Works Everywhere</h3>
                            <p>Access from any device - desktop, tablet, or mobile. No software installation required.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Membership CTA Section */}
            <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
                        <h2 className="text-3xl font-bold mb-4">🚀 Ready for Unlimited Conversions?</h2>
                        <p className="text-xl mb-8">Login to unlock unlimited file conversions, priority processing, and extended file history.</p>
                        
                        <div className="flex justify-center space-x-12 mb-8">
                            <div className="flex flex-col items-center">
                                <span className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mb-2">∞</span>
                                <span className="font-medium">Unlimited uploads</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mb-2">⚡</span>
                                <span className="font-medium">Priority processing</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mb-2">📋</span>
                                <span className="font-medium">Conversion history</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Link to="/login" className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:-translate-y-1 shadow-lg">
                                🔐 Login for Unlimited Access
                            </Link>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <small>💡 <strong>Testing?</strong> Use our pre-filled test credentials on the login page</small>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p>&copy; 2025 DigiConverter. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
