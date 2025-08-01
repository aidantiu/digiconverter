import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import { MdOutlineFlipCameraAndroid } from "react-icons/md";

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const [hasScrolled, setHasScrolled] = useState(false);
    const location = useLocation();

    // Check authentication status on component mount and when location changes
    useEffect(() => {
        checkAuthStatus();
    }, [location]);

    // Add scroll listener to toggle shadow
    useEffect(() => {
        const handleScroll = () => {
            setHasScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        // Check on mount
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const checkAuthStatus = () => {
        // Use quick auth status - no server call, no loading state needed
        const authStatus = authUtils.getQuickAuthStatus();
        
        if (authStatus.authenticated) {
            setUser(authStatus.user);
            setIsLoggedIn(true);
        } else {
            setUser(null);
            setIsLoggedIn(false);
        }
        
        setAuthChecking(false);
    };

    const handleLogout = () => {
        authUtils.clearAuth();
        setUser(null);
        setIsLoggedIn(false);
        setShowProfileMenu(false);
        setShowMobileMenu(false);
        // Optionally redirect to home
        window.location.href = '/';
    };

    const isActiveLink = (path) => {
        return location.pathname === path;
    };

    return (
        <header className={`sticky top-0 z-50 bg-gray-50/80 backdrop-blur${hasScrolled ? ' shadow-sm' : ''}`}> 
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center text-lg hover:text-black transition-colors">
                        <MdOutlineFlipCameraAndroid className="w-7 h-7 mr-2" /> 
                        <p className='font-bold'>DigiConvert</p>
                    </Link>
                    
                    {/* Navigation and Auth Section */}
                    <div className="flex items-center space-x-6">
                        {/* Navigation Links */}
                        <nav className="hidden md:flex items-center space-x-6 text-gray-700">
                            <Link 
                                to="/upload" 
                                className={`text-sm transition-colors ${
                                    isActiveLink('/upload') 
                                        ? 'text-black border-b-2 border-black-600 pb-1' 
                                        : 'hover:text-black'
                                }`}
                            >
                                Upload
                            </Link>
                            <Link 
                                to="/history" 
                                className={`text-sm transition-colors ${
                                    isActiveLink('/history') 
                                        ? 'text-black border-b-2 border-black-600 pb-1' 
                                        : 'hover:text-black'
                                }`}
                            >
                                History
                            </Link>
                        </nav>

                        {/* Auth Section */}
                        {isLoggedIn ? (
                            <div className="relative">
                                {/* User Profile Button */}
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center space-x-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg transition-colors"
                                >
                                    <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <span className="hidden sm:block text-sm">{user?.username}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                            <p className="text-sm text-gray-500">{user?.email}</p>
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            onClick={() => setShowProfileMenu(false)}
                                        >
                                            👤 Profile
                                        </Link>
                                        <Link
                                            to="/history"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            onClick={() => setShowProfileMenu(false)}
                                        >
                                            📋 My Conversions
                                        </Link>
                                        <hr className="my-1" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            🚪 Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center space-x-3">
                                <Link 
                                    to="/login" 
                                    className="hover:text-black text-sm transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button 
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="text-gray-600 hover:text-black p-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {showMobileMenu ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="md:hidden border-t border-gray-200 py-4 relative z-50">
                        <nav className="flex flex-col space-y-4">
                            <Link 
                                to="/upload" 
                                onClick={() => setShowMobileMenu(false)}
                                className={`font-medium transition-colors px-2 py-1 ${
                                    isActiveLink('/upload') 
                                        ? 'text-gray-600 bg-purple-50 rounded' 
                                        : 'text-gray-600 hover:text-black'
                                }`}
                            >
                                Upload
                            </Link>
                            <Link 
                                to="/history" 
                                onClick={() => setShowMobileMenu(false)}
                                className={`font-medium transition-colors px-2 py-1 ${
                                    isActiveLink('/history') 
                                        ? 'text-purple-600 bg-purple-50 rounded' 
                                        : 'text-gray-600 hover:text-purple-600'
                                }`}
                            >
                                History
                            </Link>
                            
                            <hr className="border-gray-200" />
                            
                            {isLoggedIn ? (
                                <div className="space-y-3">
                                    <div className="px-2 py-2 bg-purple-50 rounded">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                                <p className="text-xs text-gray-600">{user?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        to="/profile"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block px-2 py-1 text-gray-700 hover:text-purple-600 font-medium"
                                    >
                                        Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-2 py-1 text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Link 
                                        to="/register" 
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block px-2 py-1 text-gray-600 hover:text-purple-600 font-medium"
                                    >
                                        Register
                                    </Link>
                                    <Link 
                                        to="/login" 
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium text-center transition-colors"
                                    >
                                        Login
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                )}
            </div>

            {/* Click outside to close dropdowns */}
            {showProfileMenu && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowProfileMenu(false)}
                ></div>
            )}
            {showMobileMenu && (
                <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowMobileMenu(false)}
                ></div>
            )}
        </header>
    );
};

export default Navbar;
