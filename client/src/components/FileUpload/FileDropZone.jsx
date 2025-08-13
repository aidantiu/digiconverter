import React from 'react';
import { FaRegImages } from "react-icons/fa";
import { CiVideoOn } from "react-icons/ci";

const FileDropZone = ({ onFileChange, disabled = false }) => {
    return (
        <div className="relative">
            <input
                type="file"
                id="file"
                onChange={onFileChange}
                accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mpg,.mpeg"
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center hover:border-purple-400 transition-colors bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center space-y-2">
                    {/* Cloud Upload Icon */}
                    <div className="w-16 h-16 text-blue-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                        </svg>
                    </div>
                    {/* Text */}
                    <div className="text-center">
                        <p className="text-lg font-medium text-blue-300 mb-2">Click, or drop your files here</p>
                        <p className="text-sm text-gray-500">
                            <FaRegImages className='inline-block mr-1' /> Images: JPEG, PNG, WebP
                        </p>
                        <p className="text-sm text-gray-500">
                            <CiVideoOn className="inline-block mr-1" /> Videos: MP4, MOV, WebM, MPG
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileDropZone;
