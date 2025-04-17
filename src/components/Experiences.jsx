import React from 'react';

const experiences = [
  {
    id: 1,
    title: 'Game Drives',
    description: 'Track iconic wildlife from the comfort of our custom-designed luxury safari vehicles. Our expert guides will take you on an unforgettable journey through the African wilderness, where you\'ll encounter magnificent creatures in their natural habitat.',
    image: '/game-drives.png' // Ensure paths are correct
  },
  {
    id: 2,
    title: 'Walking Safaris',
    description: 'Connect deeply with the bush, discovering hidden details and tracking wildlife on foot with expert guides. Experience the thrill of walking through the same paths as Africa\'s magnificent wildlife, learning about tracks, flora, and the intricate ecosystems around you.',
    image: '/walking-safari.png'
  },
  {
    id: 3,
    title: 'Hot Air Balloon',
    description: 'Gain a breathtaking bird\'s-eye perspective, drifting silently over vast plains at sunrise. Float above the African landscape as the morning light paints the sky, offering unparalleled views of wildlife and the stunning terrain below.',
    image: '/hot-air-balloon.png'
  },
  {
    id: 4,
    title: 'Cultural Visits',
    description: 'Engage respectfully with local communities for authentic insights into traditional life and culture. Learn about ancient customs, participate in traditional activities, and connect with the warm-hearted people who call this remarkable region home.',
    image: '/cultural.png'
  }
];

const Experiences = () => {
  // Define vertical padding value for top/bottom margins
  const verticalPadding = "py-4 md:py-6 lg:py-8"; // Adjust as needed
  // Define horizontal padding specifically for the text side
  const textHorizontalPadding = "px-4 md:px-6 lg:px-8"; // Adjust as needed

  return (
    <section className="bg-[rgb(245,241,235)] overflow-hidden"> {/* Added overflow-hidden to section */}
      {experiences.map((experience, index) => (
        <div
          key={experience.id}
          // Fixed height for uniform rows, adjust h-[70vh] or use another value like h-[600px]
          // Using a fixed height like h-[600px] might be more predictable than vh units sometimes.
          // Try adjusting this height if images are cropped too much or sections are too tall/short.
          className="flex flex-col lg:flex-row w-full h-[70vh] lg:h-[650px]" // Example: Set a fixed pixel height for large screens
        >
          {/* --- Image Container --- */}
          <div
            className={`w-full lg:w-1/2 h-full relative ${ // Added relative positioning
              index % 2 === 1 ? 'lg:order-2' : '' // Alternating order
            }`}
            // No padding here anymore - apply padding to an inner element if needed,
            // but for object-cover to fill edge-to-edge (within the half), we remove padding here.
          >
            {/* Image fills the container div */}
            {/* object-cover will scale the image to maintain aspect ratio while filling the div, cropping excess */}
             {/* Added absolute positioning and padding directly related to the image if needed,
                 but letting object-cover handle the container is cleaner */}
            <img
              src={experience.image}
              alt={experience.title}
              className={`w-full h-full object-cover ${verticalPadding}`} // Apply vertical padding here to push image content inward slightly
              // className="absolute inset-0 w-full h-full object-cover" // Alternative: Absolute positioning
              loading="lazy"
            />
          </div>

          {/* --- Content Container --- */}
          <div
            // This container now handles the padding for the text area
            className={`w-full lg:w-1/2 h-full flex items-center justify-center
                        ${verticalPadding}      // Apply VERTICAL padding
                        ${textHorizontalPadding} // Apply HORIZONTAL padding
                        ${index % 2 === 1 ? 'lg:order-1' : '' // Alternating order
            }`}
          >
            {/* Inner div for text content max-width control */}
            <div className="max-w-xl w-full">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-4 md:mb-6 leading-tight text-gray-800">
                {experience.title}
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed md:leading-loose mb-6 md:mb-8">
                {experience.description}
              </p>
              <a
                href="#" // Link appropriately
                className="inline-flex items-center text-gray-900 text-base md:text-lg hover:text-gray-600 transition-colors font-medium"
              >
                Learn more
                <span className="ml-2 text-xl md:text-2xl">→</span>
              </a>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default Experiences;