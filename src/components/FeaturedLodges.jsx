import React from 'react';

const lodges = [
  {
    id: 1,
    name: 'Serengeti Lodge',
    description: 'Luxury tented suites overlooking the Serengeti plains',
    image: '/lodge-1.png',
    price: 'From $1,200/night'
  },
  {
    id: 2,
    name: 'Ngorongoro Camp',
    description: 'Intimate camp with stunning crater views',
    image: '/lodge-2.png',
    price: 'From $950/night'
  },
  {
    id: 3,
    name: 'Lake Manyara Retreat',
    description: 'Eco-friendly lodge nestled in the forest',
    image: '/lodge-3.png',
    price: 'From $850/night'
  }
];

const FeaturedLodges = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Our Luxury Lodges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lodges.map((lodge) => (
            <div key={lodge.id} className="bg-white rounded-lg overflow-hidden shadow-lg">
              <div className="relative h-64">
                <img
                  src={lodge.image}
                  alt={lodge.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-2">{lodge.name}</h3>
                <p className="text-gray-600 mb-4">{lodge.description}</p>
                <p className="text-lg font-semibold text-gray-800">{lodge.price}</p>
                <a
                  href={`/lodges/${lodge.id}`}
                  className="mt-4 inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedLodges; 