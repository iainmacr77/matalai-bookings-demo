import React from 'react';

const experiences = [
  {
    id: 1,
    title: 'Game Drives',
    description: 'Expert-guided safaris in our luxury vehicles',
    icon: '🚗'
  },
  {
    id: 2,
    title: 'Walking Safaris',
    description: 'Intimate encounters with nature on foot',
    icon: '🚶'
  },
  {
    id: 3,
    title: 'Hot Air Balloon',
    description: 'Spectacular aerial views of the Serengeti',
    icon: '🎈'
  },
  {
    id: 4,
    title: 'Cultural Visits',
    description: 'Authentic experiences with local communities',
    icon: '👥'
  }
];

const Experiences = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Unique Experiences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {experiences.map((experience) => (
            <div key={experience.id} className="text-center p-6">
              <div className="text-4xl mb-4">{experience.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{experience.title}</h3>
              <p className="text-gray-600">{experience.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experiences; 