import React, { useState, useEffect } from 'react';

const ClonedHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // --- Logo Configuration ---
  const logoWithBackground = "/Nyoka-logo.png";          // Original logo
  const logoWithoutBackground = "/nyoka-logo-bg-removed.png"; // Transparent logo

  // --- Height Configuration ---
  // ** INCREASED initial height, adjust h-40 as needed (e.g., h-36, h-44, h-48) **
  const initialLogoHeight = 'h-40';
  // ** Scrolled height, adjust h-16 as needed (e.g., h-18, h-20) **
  const scrolledLogoHeight = 'h-16';
  // ** Padding for layout, adjust py-2 if needed **
  const verticalPadding = 'py-2'; // Tailwind class for vertical padding (e.g., py-2 -> theme(spacing.2) * 2)
  const verticalPaddingValue = '4'; // The numeric part of the padding class * 2 (e.g., '2' for py-2 -> 4)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed w-full z-50 transition-all duration-300 bg-transparent">
      <div className="container mx-auto px-4">
        {/* Apply vertical padding consistently */}
        <div className={`flex justify-between items-center ${verticalPadding}`}>
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="block">
              <img
                // Conditionally set the logo source
                src={isScrolled ? logoWithBackground : logoWithoutBackground}
                className={`transition-all duration-300 w-auto ${
                  // Conditionally set the logo height class
                  isScrolled ? scrolledLogoHeight : initialLogoHeight
                } ${
                  // Apply drop-shadow only when scrolled (looks better with bg)
                  isScrolled ? 'drop-shadow-lg' : ''
                }`}
                alt="Nyoka Logo"
              />
            </a>
          </div>

          {/* Icons Container */}
          <div className="flex items-center space-x-4">
            {/* Search Button - Style is now applied ALWAYS */}
            <button
              className="transition-colors duration-300 bg-[rgb(233,228,216)] rounded-full p-3 shadow-lg hover:bg-opacity-90" // Added hover effect
            >
              <svg
                className="w-6 h-6 text-gray-800"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Menu Button - Style is now applied ALWAYS */}
            <button
              className="transition-colors duration-300 bg-[rgb(233,228,216)] rounded-full p-3 shadow-lg hover:bg-opacity-90" // Added hover effect
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="w-6 h-6 text-gray-800"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded Menu */}
        {isMenuOpen && (
          // Position below the initial header height + padding
          // Uses template literal to insert dynamic parts
          <div className={`absolute right-4 top-[calc(theme(height.${initialLogoHeight.split('-')[1]})_+_theme(spacing.${verticalPaddingValue}))] w-64 z-40`}> {/* Added z-40 */}
            <div className="bg-[rgb(233,228,216)] rounded-lg p-4 shadow-lg">
              <div className="flex flex-col space-y-4">
                {/* Ensure all nav links are here */}
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