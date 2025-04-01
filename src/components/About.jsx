import React from 'react';

const About = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative h-[500px] rounded-lg overflow-hidden">
            <img
              src="/masi-women.png"
              alt="About Nyoka"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div>
            <h2 className="text-4xl font-bold mb-6">About Nyoka</h2>
            <p className="text-gray-600 mb-6">
              Nyoka has been providing exceptional safari experiences for over 20 years. 
              Our commitment to luxury, sustainability, and authentic African experiences 
              has made us one of the most trusted names in safari tourism.
            </p>
            <p className="text-gray-600 mb-8">
              We believe in responsible tourism that benefits both our guests and the 
              local communities. Our lodges are designed to have minimal impact on the 
              environment while providing maximum comfort and unforgettable experiences.
            </p>
            <a
              href="/about"
              className="inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Learn More About Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About; 