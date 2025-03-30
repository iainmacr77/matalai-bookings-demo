import React from 'react';

const HeroSection = () => {
  return (
    <section className="relative h-screen">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/hero-background.png')] bg-cover bg-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-white">
        <div className="text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Experience Luxury Safari
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Discover the magic of African wildlife in unparalleled comfort and style
          </p>
          <a
            href="#book-now"
            className="inline-block bg-white text-black px-8 py-3 rounded-md text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Book Your Stay
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 