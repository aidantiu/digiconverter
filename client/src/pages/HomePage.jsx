import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaRegMoneyBillAlt } from "react-icons/fa";
import { TbUsers } from "react-icons/tb";
import { FaRegClock } from "react-icons/fa";
import { CiCreditCardOff } from "react-icons/ci";
import { GoUnlock } from "react-icons/go";
import { IoFlashOutline } from "react-icons/io5";
import { SlSocialFacebook } from "react-icons/sl";
import { IoLogoInstagram } from "react-icons/io";
import { CiLinkedin } from "react-icons/ci";


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

                    <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-gradient-to-r from-black via-gray-700 to-black bg-clip-text text-transparent">Let’s help you showcase the moments that matter</h1>
                    <p className="mx-auto my-6 max-w-[700px] text-gray-600 md:text-lg lg:text-xl leading-relaxed mb-5">Preserve priceless digicam moments, convert them into future-proof formats, and relive your memories anytime, anywhere.</p>
                    
                    <div className="flex flex-col sm:flex-col md:flex-row justify-center md:space-x-4 space-y-4 md:space-y-0 mt-8 mb-16">
                        <Link to="/register" className="px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition-all duration-300 hover:shadow-lg hover-lift flex items-center justify-center">
                            Get Started 
                        </Link>
                        <Link to="/upload" className="px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-black bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-all duration-300 hover:shadow-md hover-lift flex items-center justify-center">
                            See How It Works
                        </Link>
                    </div>

                    {/* Stats Section with bounce animation */}
                    <style>{`
                        @keyframes smooth-wave {
                            0% { transform: translateY(0); }
                            8% { transform: translateY(-4px); }
                            16% { transform: translateY(-8px); }
                            25% { transform: translateY(-12px); }
                            33% { transform: translateY(-14px); }
                            41% { transform: translateY(-16px); }
                            50% { transform: translateY(-18px); }
                            58% { transform: translateY(-16px); }
                            66% { transform: translateY(-14px); }
                            75% { transform: translateY(-12px); }
                            83% { transform: translateY(-8px); }
                            91% { transform: translateY(-4px); }
                            100% { transform: translateY(0); }
                        }
                    `}</style>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[ 
                            { value: '3', label: 'Free uploads daily' },
                            { value: '∞', label: 'Unlimited for members' },
                            { value: '7', label: 'Supported formats' },
                        ].map((stat, idx, arr) => (
                            <div
                                key={stat.value}
                                className="text-center border-r last:border-r-0 border-gray-200"
                                style={{
                                    animation: `smooth-wave 3.2s linear infinite`,
                                    animationDelay: `${idx * 1.05}s`,
                                    animationFillMode: 'both',
                                }}
                            >
                                <span className="text-4xl font-bold text-black block mb-2">{stat.value}</span>
                                <span>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Hook Section */}
            <section className="bg-[#fdfeff] py-20 my-10">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold tracking-tighter sm:text-4xl md:text-5xl">What do we provide?</h1>
                    <p className='mt-4 max-w-[800px] mx-auto text-gray-600 text-lg'>No subscriptions. No complicated software. Just a fast, secure way to convert your Digicam files and keep your memories accessible.</p>
                </div>
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Main Feature Card */}
                        <div className="lg:col-span-2 flex flex-col align-middlebg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-10 min-h-[320px] relative overflow-hidden border border-gray-100">
                            <span className="inline-block w-fit px-4 py-2 mb-8 text-xs bg-gradient-to-r from-purple-200 to-blue-100 text-purple-700 rounded-full">Featured</span>
                            <h2 className="text-3xl font-extrabold mb-4">Simple and Accessible</h2>
                            <p className="text-md text-gray-600 mb-8">No subscriptions. No hidden limits. We believe file conversion—especially for old Digicam formats—should be easy, fast, and free for everyone.</p>
                            <FaRegMoneyBillAlt  className='w-10 h-10 fill-green-600'/>
                        </div>

                        {/* Right Feature Cards */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-blue-50 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-6 flex-1 border border-blue-100">
                                <TbUsers className='w-6 h-6 mb-3'/>
                                <h3 className="text-lg font-semibold mb-2">Format-Ready</h3>
                                <p className="text-gray-600 text-sm">Support for classic Digicam formats like MPG, MOV, and more.</p>
                            </div>
                            <div className="bg-purple-50 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-6 flex-1 border border-purple-100">
                                <FaRegClock className='w-6 h-6 mb-3'/>
                                <h3 className="text-lg font-bold mb-2"> Convert on Your Time </h3>
                                <p className="text-gray-600 text-sm">Upload and convert at your pace. Just smooth media transformation when you need it.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-green-50 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col items-center text-center border border-gray-100">
                            <CiCreditCardOff className="h-10 w-10 mb-4 fill-green-600" />
                            <h3 className="text-lg font-bold mb-2">No Hidden Costs</h3>
                            <p className="text-gray-600 text-sm">No subscriptions or hidden fees – free for everyone.</p>
                        </div>
                        {/* Card 2 */}
                        <div className="bg-amber-50 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col items-center text-center border border-gray-100">
                            <GoUnlock className="h-10 w-10 mb-4 fill-yellow-600" />
                            <h3 className="text-lg font-bold mb-2">Unlimited Conversions</h3>
                            <p className="text-gray-600 text-sm">No limits for registered users.</p>
                        </div>
                        {/* Card 3 */}
                        <div className="bg-red-50 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col items-center text-center border border-gray-100">
                            <IoFlashOutline className="h-10 w-10 mb-4 stroke-red-600" />
                            <h3 className="text-lg font-bold mb-2">Priority & History</h3>
                            <p className="text-gray-600 text-sm">History tracking and faster processing for logged-in users.</p>
                        </div>
                    </div>
                </div>
            </section>


            {/* Membership CTA Section */}
            <section className="inset-0 bg-gradient-to-b from-gray-50 to-white z-0 py-10">
                <div className="flex mx-auto mb-2 items-center p-1.5 bg-gray-200 rounded-full w-fit">
                    <IoFlashOutline className='h-3 w-3 mr-1 fill-gray-600'></IoFlashOutline>
                    <p className='text-xs text-gray-600'>Simple Process</p>    
                </div>
                <h1 className='text-center text-3xl font-[1000] mb-6'>Easy to Get Started</h1>
                <p className=' text-gray-500 text-center mx-auto text-lg'>A simple way to convert Digicam files and preserve your memories</p>

                {/* Cards */}
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-5 mt-15">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="rounded-3xl border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 transform px-8 py-15 flex flex-col">
                            <h1 className='text-5xl font-bold text-gray-300 mb-8'>01</h1>
                            <h3 className="text-lg font-bold mb-5">Create an Account</h3>
                            <p className="text-gray-600 text-sm">Sign up for free and tell us a bit about your style preferences to get started.</p>
                        </div>
                        {/* Card 2 */}
                        <div className="rounded-3xl border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 px-8 py-15 hover:-translate-y-2 transform flex flex-col">
                            <h1 className='text-5xl font-bold text-gray-300 mb-8'>02</h1>
                            <h3 className="text-lg font-bold mb-5">Upload Your Files</h3>
                            <p className="text-gray-600 text-sm">Add old videos or photos from your Digicam — MPG, MOV, and more.</p>
                        </div>
                        {/* Card 3 */}
                        <div className="rounded-3xl border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 px-8 py-15 flex flex-col">
                            <h1 className='text-5xl font-bold text-gray-300 mb-8'>03</h1>
                            <h3 className="text-lg font-bold mb-5">Convert and Relive</h3>
                            <p className="text-gray-600 text-sm"> Get high-quality, modern-format versions ready to view, share, or store.</p>
                        </div>
                    </div>
                </div>
                
            </section>

            {/* Footer */}
            <footer className="bg-black text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-15">
                        {/* About */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">About DigiConverter</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">Preserving your digicam memories, making file conversion accessible, fast, and free for everyone.</p>
                        </div>
                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/" className="hover:underline text-gray-300" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</Link></li>
                                <li><Link to="/upload" className="hover:underline text-gray-300">How It Works</Link></li>
                                <li><Link to="/history" className="hover:underline text-gray-300">History</Link></li>
                               
                            </ul>
                        </div>
                        {/* Spacer for grid alignment on large screens */}
                        <div className="hidden lg:block"></div>
                        {/* Connect */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Connect</h3>
                            <div className="flex space-x-6 mt-2">
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-gray-400"><SlSocialFacebook /></a>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-gray-400"><IoLogoInstagram /></a>
                                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-gray-400"><CiLinkedin /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
