import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { FaCameraRetro } from "react-icons/fa";

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.trim().length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store auth data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('justLoggedIn', 'true');
                
                // Redirect to upload page
                navigate('/upload');
            } else {
                setErrors({ general: data.message || 'Registration failed' });
            }
        } catch (error) {
            console.error('Registration error:', error);
            setErrors({ general: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <div className=" flex w-full justify-between max-w-7xl mx-auto px-4">
                <div className="flex w-1/2 items-center">
                    <div className="flex-col ml-20 ">
                        <FaCameraRetro className='w-15 h-15 my-8 ml-5'/>
                        <blockquote className="font-bold text-xl w-3/4 mb-4 text-black">
                            “A good snapshot keeps a moment from running away.”
                        </blockquote>
                        <figcaption className="ml-2 text-lg text-gray-500 mt-1">— Eudora Welty</figcaption>
                    </div>  
                </div>
                <div className="flex w-1/2 ">
                    <div className="flex items-center justify-center w-full py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8">
                        <div>
                            <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
                                Create your account
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                Join <span className="text-md text-black">DigiConverter</span> and showcase your memories!
                            </p>
                        </div>
                        
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div className="px-8 py-2 ">
                                {errors.general && (
                                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                        {errors.general}
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                            Username
                                        </label>
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            autoComplete="username"
                                            required
                                            value={formData.username}
                                            onChange={handleChange}
                                            className={`mt-1 block w-full px-4 py-3 border ${
                                                errors.username ? 'border-red-300' : 'border-gray-300'
                                            } rounded-xl shadow-sm focus:outline-none focus:ring-black focus:border-black`}
                                            placeholder="Enter your username"
                                        />
                                        {errors.username && (
                                            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                                        )}
                                    </div>

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
                                            className={`mt-1 block w-full px-4 py-3 border ${
                                                errors.email ? 'border-red-300' : 'border-gray-300'
                                            } rounded-xl shadow-sm focus:outline-none focus:ring-black focus:border-black`}
                                            placeholder="Enter your email"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`mt-1 block w-full px-4 py-3 border ${
                                                errors.password ? 'border-red-300' : 'border-gray-300'
                                            } rounded-xl shadow-sm focus:outline-none focus:ring-black focus:border-black`}
                                            placeholder="Enter your password"
                                        />
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                            Confirm Password
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={`mt-1 block w-full px-4 py-3 border ${
                                                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                            } rounded-xl shadow-sm focus:outline-none focus:ring-black focus:border-black`}
                                            placeholder="Confirm your password"
                                        />
                                        {errors.confirmPassword && (
                                            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="my-6">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isLoading ? <Loader /> : 'Create Account'}
                                    </button>
                                </div>

                               <div class="relative">
                                    <div class="absolute inset-0 flex items-center">
                                        <div class="w-full border-t border-gray-300">
                                        </div>
                                    </div>
                                    
                                    <div class="relative flex justify-center text-sm">
                                        <span class="px-2 bg-white text-gray-500">Already have an account?</span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <Link
                                        to="/login"
                                        className="w-full flex justify-center py-3 px-4 border border-black rounded-xl shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                                    >
                                        Sign in to your account
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
};

export default RegisterPage;
