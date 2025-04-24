import React from 'react';

// --- Define Data for Countries ---
// Replace placeholder image paths with your actual stunning images!
const countries = [
  {
    id: 'sa',
    name: 'South Africa',
    // Thoughtful, non-AI sounding description:
    teaser: 'From iconic Big Five encounters in Kruger to the unique beauty of the Cape, our South African lodges offer classic safari adventures and breathtaking landscapes.',
    image: '/lion.png', // Replace with your SA image
    link: '/destinations/south-africa' // Example link path
  },
  {
    id: 'bots',
    name: 'Botswana',
    // Thoughtful, non-AI sounding description:
    teaser: 'Journey into the heart of the wilderness. Explore the pristine waterways of the Okavango Delta and the vast, wildlife-rich plains of our exclusive Botswana camps.',
    image: '/botswana-new.png', // Replace with your Botswana image
    link: '/destinations/botswana' // Example link path
  },
  {
    id: 'moz',
    name: 'Mozambique',
    // Thoughtful, non-AI sounding description:
    teaser: 'Discover barefoot luxury on secluded shores. Our Mozambican villas provide an idyllic escape with turquoise waters, vibrant reefs, and tranquil coastal living.',
    image: '/mozambique- new.png', // Replace with your Mozambique image
    link: '/destinations/mozambique' // Example link path
  }
];

// --- Renamed Component ---
const DestinationsSection = () => {
  return (
    // Adjust padding and background as desired
    <section className="py-16 md:py-24 bg-[rgb(245,241,235)]">
      <div className="container mx-auto px-4">
        {/* --- Updated Heading --- */}
        <h2 className="text-3xl md:text-4xl font-serif text-center text-gray-800 mb-4">
          Discover Our Sanctuaries
        </h2>
        {/* --- Updated Introductory Text --- */}
        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12 md:mb-16">
          Embark on an unforgettable journey across Southern Africa. Our exclusive collection spans ten distinct lodges, camps, and villas nestled within the unique beauty of <span className="font-semibold">South Africa</span>, the wild heart of <span className="font-semibold">Botswana</span>, and the pristine coastlines of <span className="font-semibold">Mozambique</span>.
        </p>

        {/* --- Grid for Countries (using existing grid structure) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"> {/* Adjusted gap */}
          {/* Map over the COUNTRIES data */}
          {countries.map((country) => (
            // Add group class for hover effects
            <div key={country.id} className="group bg-white rounded-lg overflow-hidden shadow-lg flex flex-col">
              {/* --- Container for Larger Image --- */}
              {/* Added overflow-hidden to contain image zoom if added */}
              <div className="relative overflow-hidden">
                 {/* ** Increased Image Height using h-80 / md:h-96 ** */}
                <img
                  src={country.image}
                  alt={`Scenic view representing ${country.name}`}
                  // Increased height, object-cover, added transition + hover effect
                  className="w-full h-80 md:h-96 object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
              </div>
              {/* --- Content Area --- */}
              {/* Use flex to push button to bottom */}
              <div className="p-6 flex flex-col flex-grow">
                {/* Country Name */}
                <h3 className="text-2xl font-serif font-semibold mb-3 text-gray-800">{country.name}</h3>
                {/* Country Teaser Text */}
                <p className="text-gray-700 mb-4 flex-grow">{country.teaser}</p> {/* flex-grow pushes button down */}
                {/* Link/Button */}
                <a
                  href={country.link} // Use country link
                  // Updated styling for a cleaner look
                  className="inline-block mt-auto text-sm font-semibold text-gray-800 uppercase tracking-wider hover:text-gray-600 transition-colors duration-300 self-start" // Aligns button left
                >
                  Explore {country.name} →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Export the renamed component ---
export default DestinationsSection;