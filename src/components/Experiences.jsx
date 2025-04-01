import React from 'react';

const experiences = [
  {
    id: 1,
    title: 'Game Drives',
    description: 'Track iconic wildlife from the comfort of our custom-designed luxury safari vehicles. Our expert guides will take you on an unforgettable journey through the African wilderness, where you\'ll encounter magnificent creatures in their natural habitat.',
    image: '/game-drives.png'
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
    image: '/balloons.png'
  },
  {
    id: 4,
    title: 'Cultural Visits',
    description: 'Engage respectfully with local communities for authentic insights into traditional life and culture. Learn about ancient customs, participate in traditional activities, and connect with the warm-hearted people who call this remarkable region home.',
    image: '/cultural.png'
  }
];

const Experiences = () => {
  return (
    <section className="bg-white">
      {experiences.map((experience, index) => (
        <div 
          key={experience.id}
          className="flex flex-col lg:flex-row w-full h-[75vh] items-center"
        >
          {/* Image Section */}
          <div className={`w-full lg:w-1/2 h-full flex items-center justify-center p-8 ${
            index % 2 === 1 ? 'lg:order-2' : ''
          }`}>
            <div className="w-full max-w-3xl h-[400px] overflow-hidden">
              <img
                src={experience.image}
                alt={experience.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className={`w-full lg:w-1/2 flex items-center ${
            index % 2 === 1 ? 'lg:order-1' : ''
          }`}>
            <div className="max-w-xl mx-auto px-12 py-16">
              <h2 className="text-5xl font-serif mb-6 leading-tight">{experience.title}</h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">{experience.description}</p>
              <a 
                href="#" 
                className="inline-flex items-center text-gray-900 text-lg hover:text-gray-600 transition-colors"
              >
                Learn more
                <span className="ml-3 text-2xl">→</span>
              </a>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default Experiences; 