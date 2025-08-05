import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { authUtils } from '../utils/auth';
import Loader from '../components/Loader';
import { FaCameraRetro } from "react-icons/fa";
import Navbar from '../components/Navbar';

function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authStatus = await authUtils.checkAuthStatus();
                setIsLoggedIn(authStatus.authenticated);
            } catch (error) {
                setIsLoggedIn(false);
            }
        };
        checkAuth();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(API_ENDPOINTS.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                authUtils.setAuth(data.token, data.user);
                localStorage.setItem('justLoggedIn', 'true');
                setIsLoggedIn(true);
                navigate('/upload');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        authUtils.clearAuth();
        setIsLoggedIn(false);
        setFormData({
            email: '',
            password: ''
        });
    };

    const getStoredUser = () => {
        return authUtils.getUser();
    };

    if (isLoggedIn) {
        const user = getStoredUser();
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-5">
                    <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md animate-fade-in">
                        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">✅ Successfully Logged In</h2>
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-6">
                            <p className="text-gray-700 mb-2"><strong>Username:</strong> {user?.username}</p>
                            <p className="text-gray-700 mb-4"><strong>Email:</strong> {user?.email}</p>
                            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-3 rounded-lg text-center font-semibold">
                                🚀 <strong>Unlimited Uploads</strong>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button 
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-1"
                                onClick={() => navigate('/upload')}
                            >
                                Go to Upload Page
                            </button>
                            <button 
                                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
                                onClick={() => navigate('/history')}
                            >
                                View History
                            </button>
                            <button 
                                className="w-full bg-red-100 text-red-600 py-3 px-6 rounded-lg font-semibold hover:bg-red-200 transition-all duration-200"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex w-full justify-between max-w-7xl mx-auto px-4 py-10">
                {/* Left: Quote/Brand Panel */}
                <div className="flex w-1/2 items-center">
                    <div className="flex-col ml-20 ">
                        <FaCameraRetro className='w-15 h-15 my-8 ml-5'/>
                        <blockquote className="font-bold text-xl w-3/4 mb-4 text-black">
                            “You don’t take a photograph. You make it.”
                        </blockquote>
                        <figcaption className="ml-2 text-lg text-gray-500 mt-1">— Ansel Adams</figcaption>
                    </div>
                </div>
                {/* Right: Login Form Panel */}
                <div className="flex w-1/2 ">
                    <div className="flex items-center justify-center w-full py-8 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full space-y-8">
                            <div>
                                <h2 className="mt-6 text-center text-3xl font-bold text-black">
                                    Login to your account
                                </h2>
                                <p className="mt-2 text-center text-sm text-gray-600">
                                    Welcome back to <span className="text-md text-black">DigiConverter</span>!
                                </p>
                            </div>
                            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                                <div className="px-8 py-2 ">
                                    {error && (
                                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                            {error}
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                Email address
                                            </label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-black focus:border-black"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                                Password
                                            </label>
                                            <input
                                                id="password"
                                                name="password"
                                                type="password"
                                                autoComplete="current-password"
                                                required
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-black focus:border-black"
                                                placeholder="Enter your password"
                                            />
                                        </div>
                                    </div>
                                    <div className="my-6">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Login
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-300"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <Link
                                            to="/register"
                                            className="w-full flex justify-center py-3 px-4 border border-black rounded-xl shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                                        >
                                            Create an account
                                        </Link>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
