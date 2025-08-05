import React from 'react';
import FileUpload from '../components/FileUpload';
import Navbar from '../components/Navbar';

const FileUploadPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <Navbar />

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                        File Converter
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Transform your files instantly. Upload and convert images and videos 
                        with our fast, secure, and easy-to-use converter.
                    </p>
                </div>
                
                <div className="flex justify-center">
                    <FileUpload />
                </div>
            </main>
        </div>
    );
};

export default FileUploadPage;
