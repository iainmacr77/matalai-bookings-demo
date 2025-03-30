import React, { useState } from 'react';

const ClonedHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed w-full bg-[rgb(233,228,216)] z-50">
      {/* Top bar */}
      <div className="bg-black text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="text-sm">
            <span className="mr-4">+27 (0) 21 883 2444</span>
            <span>reservations@nyoka.com</span>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-sm hover:text-gray-300">EN</a>
            <a href="#" className="text-sm hover:text-gray-300">FR</a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="block">
              <img src="/Nyoka-logo.png" className="h-36 w-auto" />
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-800 hover:text-gray-600">Lodges & Camps</a>
            <a href="#" className="text-gray-800 hover:text-gray-600">Experiences</a>
            <a href="#" className="text-gray-800 hover:text-gray-600">About</a>
            <a href="#" className="text-gray-800 hover:text-gray-600">Contact</a>
            <a href="#" className="text-gray-800 hover:text-gray-600">Book Now</a>
          </nav>

          {/* Mobile menu button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              ) : (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4">
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-gray-800 hover:text-gray-600">Lodges & Camps</a>
              <a href="#" className="text-gray-800 hover:text-gray-600">Experiences</a>
              <a href="#" className="text-gray-800 hover:text-gray-600">About</a>
              <a href="#" className="text-gray-800 hover:text-gray-600">Contact</a>
              <a href="#" className="text-gray-800 hover:text-gray-600">Book Now</a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default ClonedHeader; 