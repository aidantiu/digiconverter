import React from 'react';
import { Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';

const FileUploadPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <h1 className="text-2xl font-bold text-gray-900">DigiConverter</h1>
                        <nav className="flex space-x-8">
                            <Link to="/" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Home</Link>
                            <Link to="/upload" className="text-purple-600 font-semibold">Upload</Link>
                            <Link to="/history" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">History</Link>
                            <Link to="/login" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium transition-colors">Login</Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Convert Your Files</h1>
                    <p className="text-lg text-gray-600">Upload and convert your images and videos to any format</p>
                </div>
                
                <FileUpload />
            </main>
        </div>
    );
};

export default FileUploadPage;
