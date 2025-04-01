import React, { useState, useEffect } from 'react';

const ClonedHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-transparent' : 'bg-[rgb(233,228,216)]'
    }`}>
      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="block">
              <img src="/Nyoka-logo.png" className={`transition-all duration-300 ${
                isScrolled ? 'h-24 drop-shadow-lg' : 'h-36'
              } w-auto`} alt="Nyoka Logo" />
            </a>
          </div>

          {/* Navigation Links */}
          <nav className={`flex-1 mx-8 transition-all duration-300 ${
            isScrolled ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
          }`}>
            <div className="flex justify-center space-x-8 text-sm uppercase tracking-wider">
              <a href="#" className="text-gray-800 hover:text-gray-600 whitespace-nowrap">Our Story</a>
              <a href="#" className="text-gray-800 hover:text-gray-600 whitespace-nowrap">Safaris</a>
              <a href="#" className="text-gray-800 hover:text-gray-600 whitespace-nowrap">Experiences</a>
              <a href="#" className="text-gray-800 hover:text-gray-600 whitespace-nowrap">Destinations</a>
              <a href="#" className="text-gray-800 hover:text-gray-600 whitespace-nowrap">Specials</a>
              <a href="#" className="text-gray-800 hover:text-gray-600 whitespace-nowrap">Our Foundation</a>
              <a href="#" className="text-gray-800 hover:text-gray-600 whitespace-nowrap">Contact</a>
              <a href="#" className="text-gray-800 hover:text-gray-600 whitespace-nowrap">FAQs</a>
            </div>
          </nav>

          {/* Icons Container */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <button 
              className={`transition-all duration-300 ${
                isScrolled ? 'bg-[rgb(233,228,216)] rounded-full p-3 shadow-lg' : ''
              }`}
            >
              <svg 
                className={`w-6 h-6 text-gray-800 transition-all duration-300 ${
                  isScrolled ? 'drop-shadow-sm' : ''
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </button>

            {/* Menu Button */}
            <button 
              className={`transition-all duration-300 ${
                isScrolled ? 'bg-[rgb(233,228,216)] rounded-full p-3 shadow-lg' : ''
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg 
                className={`w-6 h-6 text-gray-800 transition-all duration-300 ${
                  isScrolled ? 'drop-shadow-sm' : ''
                }`}
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
        </div>

        {/* Expanded Menu */}
        {isMenuOpen && (
          <div className="absolute right-4 mt-4 w-64">
            <div className="bg-[rgb(233,228,216)] rounded-lg p-4 shadow-lg">
              <div className="flex flex-col space-y-4">
                <a href="#" className="text-gray-800 hover:text-gray-600">Our Story</a>
                <a href="#" className="text-gray-800 hover:text-gray-600">Safaris</a>
                <a href="#" className="text-gray-800 hover:text-gray-600">Experiences</a>
                <a href="#" className="text-gray-800 hover:text-gray-600">Destinations</a>
                <a href="#" className="text-gray-800 hover:text-gray-600">Specials</a>
                <a href="#" className="text-gray-800 hover:text-gray-600">Our Foundation</a>
                <a href="#" className="text-gray-800 hover:text-gray-600">Contact</a>
                <a href="#" className="text-gray-800 hover:text-gray-600">FAQs</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default ClonedHeader; 