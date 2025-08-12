// SupportedFormatsDropdown component
import React, { useState, useRef, useEffect } from 'react';

const SUPPORTED_FORMATS = [
    'JPEG', 'PNG', 'WebP', 'MP4', 'MOV', 'MPG'
];

function SupportedFormatsDropdown() {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div className="relative flex flex-col items-center" ref={dropdownRef}>
            <button
                className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-300 transition-colors text-xs focus:outline-none"
                onClick={() => setOpen(v => !v)}
                type="button"
            >
                Supported Formats
                <svg className={`w-4 h-4 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-4 flex flex-wrap justify-center gap-2 z-20 min-w-[185px]">
                    {SUPPORTED_FORMATS.map(fmt => (
                        <span key={fmt} className="bg-black text-white px-4 py-1 rounded-full text-xs shadow-sm">
                            {fmt}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SupportedFormatsDropdown;