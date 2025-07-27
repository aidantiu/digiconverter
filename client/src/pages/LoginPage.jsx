import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { authUtils } from '../utils/auth';
import Loader from '../components/Loader';

function LoginPage() {
    const [formData, setFormData] = useState({
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Start with false, check in useEffect
    const navigate = useNavigate();

    // Clean up localStorage and check auth status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authStatus = await authUtils.checkAuthStatus();
                setIsLoggedIn(authStatus.authenticated);
            } catch (error) {
                console.warn('Error checking auth status on login page:', error);
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
                // Store token and user info using auth utility
                authUtils.setAuth(data.token, data.user);
                localStorage.setItem('justLoggedIn', 'true'); // Set flag for welcome message
                setIsLoggedIn(true);
                
                // Redirect to upload page
                navigate('/upload');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        authUtils.clearAuth();
        setIsLoggedIn(false);
        setFormData({
            email: 'test@digiconverter.com',
            password: 'testpassword123'
        });
    };

    const getStoredUser = () => {
        return authUtils.getUser();
    };

    if (isLoggedIn) {
        const user = getStoredUser();
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-5">
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
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-5">
            <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-lg animate-fade-in">
                <h2 className="text-3xl font-bold text-center mb-2">🔐 Login to DigiConverter</h2>
        

                {/* Pre-filled form for testing */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold mb-2">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                            ❌ {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-1 disabled:hover:transform-none flex items-center justify-center"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Logging in...
                            </div>
                        ) : (
                            '🚀 Login'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
