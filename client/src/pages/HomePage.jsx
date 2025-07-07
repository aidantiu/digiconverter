import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const HomePage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navbar />

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">Convert Your Files Instantly</h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">Transform images and videos to any format you need. Fast, secure, and free for everyone.</p>
                    
                    <div className="flex justify-center space-x-4 mb-16">
                        <Link to="/upload" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:-translate-y-1 shadow-lg">
                            Start Converting
                        </Link>
                        <Link to="/upload" className="bg-white text-purple-600 border-2 border-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition-all duration-200">
                            Learn More
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <span className="text-4xl font-bold text-purple-600 block">3</span>
                            <span className="text-gray-600">Free uploads daily</span>
                        </div>
                        <div className="text-center">
                            <span className="text-4xl font-bold text-purple-600 block">∞</span>
                            <span className="text-gray-600">Unlimited for members</span>
                        </div>
                        <div className="text-center">
                            <span className="text-4xl font-bold text-purple-600 block">12+</span>
                            <span className="text-gray-600">Supported formats</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">Why Choose DigiConverter?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">🚀</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
                            <p className="text-gray-600">Convert your files in seconds with our optimized processing engine.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Private</h3>
                            <p className="text-gray-600">Your files are processed securely and deleted automatically after 24 hours.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">💎</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">High Quality</h3>
                            <p className="text-gray-600">Maintain the best possible quality during conversion with our advanced algorithms.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="text-4xl mb-4">📱</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Works Everywhere</h3>
                            <p className="text-gray-600">Access from any device - desktop, tablet, or mobile. No software installation required.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Membership CTA Section */}
            <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">🚀 Ready for Unlimited Conversions?</h2>
                        <p className="text-xl text-gray-600 mb-8">Login to unlock unlimited file conversions, priority processing, and extended file history.</p>
                        
                        <div className="flex justify-center space-x-12 mb-8">
                            <div className="flex flex-col items-center">
                                <span className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mb-2">∞</span>
                                <span className="text-gray-700 font-medium">Unlimited uploads</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mb-2">⚡</span>
                                <span className="text-gray-700 font-medium">Priority processing</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mb-2">📋</span>
                                <span className="text-gray-700 font-medium">Conversion history</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Link to="/login" className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:-translate-y-1 shadow-lg">
                                🔐 Login for Unlimited Access
                            </Link>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <small className="text-gray-600">💡 <strong>Testing?</strong> Use our pre-filled test credentials on the login page</small>
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
