import React from 'react';
import FileUpload from '../components/FileUpload';
import Navbar from '../components/Navbar';

const FileUploadPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navbar />

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
