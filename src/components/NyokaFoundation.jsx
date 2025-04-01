import React from 'react';

const NyokaFoundation = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url("/foundation.png")',
        }}
      />

      {/* Dark Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />

      {/* Content */}
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto">
          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">
            Our Foundation: Restoring Africa's Wild Heart
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-200 mb-12">
            Creating a connected landscape where wildlife thrives and ecosystems flourish
          </p>

          {/* Main Content */}
          <div className="prose prose-lg mx-auto mb-12 prose-invert">
            <p className="text-gray-200 leading-relaxed max-w-3xl">
              The Nyoka Foundation is pioneering an ambitious vision: re-wilding a vital ecological corridor 
              stretching from the majestic Cederberg mountain range to the Namibian border. This transformative 
              initiative aims to restore and protect one of Africa's most critical wildlife corridors, 
              creating a haven for biodiversity and a bulwark against climate change. As the non-profit arm 
              of the broader Nyoka initiative, we're committed to fostering sustainable eco-tourism that 
              benefits both wildlife and local communities, while ensuring the long-term resilience of our 
              planet's precious ecosystems.
            </p>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="/foundation"
              className="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-md text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Join the Movement
              <svg 
                className="ml-2 w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 8l4 4m0 0l-4 4m4-4H3" 
                />
              </svg>
            </a>
            <a
              href="/partner"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-md text-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              Partner with Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NyokaFoundation; 