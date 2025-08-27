import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { FaCameraRetro, FaEye, FaEyeSlash } from "react-icons/fa";

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

        // Username validation - match backend requirements
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.trim().length < 2) {
            newErrors.username = 'Username must be at least 2 characters';
        } else if (formData.username.trim().length > 50) {
            newErrors.username = 'Username must be less than 50 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
            newErrors.username = 'Username can only contain letters, numbers, and underscores';
        }

        // Email validation - match backend requirements
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        } else if (formData.email.length > 100) {
            newErrors.email = 'Email must be less than 100 characters';
        }

        // Strong password validation - match backend requirements
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (formData.password.length > 128) {
            newErrors.password = 'Password must be less than 128 characters';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)';
        }

        // Confirm password validation
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
         
            <div className="flex flex-col lg:flex-row w-full justify-between max-w-7xl mx-auto px-4 py-10 gap-10 lg:gap-0">
                <div className="order-1 lg:order-2 w-full lg:w-1/2 flex">
                    <div className="flex items-center justify-center w-full py-6 px-2 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full space-y-8">
                            <div>
                                <h2 className="mt-2 text-center text-3xl font-bold text-black">
                                    Create your account
                                </h2>
                                <p className="mt-2 text-center text-sm text-gray-600">
                                    Join <span className="text-md text-black">DigiConverter</span> and showcase your memories!
                                </p>
                            </div>
                            <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
                                <div className="px-2 sm:px-4 py-2">
                                    {errors.general && (
                                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                            {errors.general}
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        {/* Username */}
                                        <div>
                                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                                            <input id="username" name="username" type="text" autoComplete="username" required value={formData.username} onChange={handleChange} className={`mt-1 block w-full px-4 py-3 border ${errors.username ? 'border-red-300' : 'border-gray-300'} rounded-xl shadow-sm focus:outline-none focus:ring-black focus:border-black`} placeholder="Enter your username" />
                                            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                                        </div>
                                        {/* Email */}
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                                            <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className={`mt-1 block w-full px-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-xl shadow-sm focus:outline-none focus:ring-black focus:border-black`} placeholder="Enter your email" />
                                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                        </div>
                                        {/* Password */}
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                            <div className="relative">
                                                <input 
                                                    id="password" 
                                                    name="password" 
                                                    type={showPassword ? "text" : "password"} 
                                                    autoComplete="new-password" 
                                                    required 
                                                    value={formData.password} 
                                                    onChange={handleChange} 
                                                    className={`mt-1 block w-full px-4 py-3 pr-12 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-xl shadow-sm focus:outline-none focus:ring-black focus:border-black`} 
                                                    placeholder="Enter your password" 
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                    ) : (
                                                        <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                    )}
                                                </button>
                                            </div>
                                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                            {/* Password requirements indicator - only show when password field has content */}
                                            {formData.password && (
                                                <div className="mt-2 text-xs text-gray-500">
                                                    <p>Password must contain:</p>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                                                            At least 8 characters
                                                        </li>
                                                        <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                                                            One lowercase letter
                                                        </li>
                                                        <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                                                            One uppercase letter
                                                        </li>
                                                        <li className={/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                                                            One number
                                                        </li>
                                                        <li className={/[@$!%*?&]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                                                            One special character (@$!%*?&)
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        {/* Confirm Password */}
                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                            <div className="relative">
                                                <input 
                                                    id="confirmPassword" 
                                                    name="confirmPassword" 
                                                    type={showConfirmPassword ? "text" : "password"} 
                                                    autoComplete="new-password" 
                                                    required 
                                                    value={formData.confirmPassword} 
                                                    onChange={handleChange} 
                                                    className={`mt-1 block w-full px-4 py-3 pr-12 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-xl shadow-sm focus:outline-none focus:ring-black focus:border-black`} 
                                                    placeholder="Confirm your password" 
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? (
                                                        <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                    ) : (
                                                        <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                    )}
                                                </button>
                                            </div>
                                            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                                        </div>
                                    </div>
                                    <div className="my-6">
                                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            {isLoading ? 'Creating...' : 'Create Account'}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Already have an account?</span></div>
                                    </div>
                                    <div className="mt-6">
                                        <Link to="/login" className="w-full flex justify-center py-3 px-4 border border-black rounded-xl shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors">Sign in to your account</Link>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                {/* Quote Panel: second on mobile, left on desktop */}
                <div className="order-2 lg:order-1 w-full lg:w-1/2 flex items-center">
                    <div className="flex flex-col mx-auto lg:ml-20 text-center lg:text-left max-w-md">
                        <FaCameraRetro className='w-16 h-16 my-4 mx-auto lg:mx-0 text-black' />
                        <blockquote className="font-bold text-xl sm:text-2xl mb-4 text-black">
                            “A good snapshot keeps a moment from running away.”
                        </blockquote>
                        <figcaption className="text-lg text-gray-500">— Eudora Welty</figcaption>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
