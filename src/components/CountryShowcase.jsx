import React, { useEffect, useRef, useState } from 'react';

// --- Define Data for Lodge Types ---
const lodgeTypes = [
  {
    id: 'tented',
    name: 'Authentic Tented Camps',
    description: 'Immerse yourself in the wilderness. Our tented camps offer an intimate connection with nature without sacrificing comfort.',
    image: '/south-africa.png', // REPLACE if possible
    link: '/lodge-types/tented-camps' // Example link for the button
  },
  {
    id: 'main',
    name: 'Classic Safari Lodges',
    description: 'The quintessential safari experience. Enjoy spacious accommodations, central amenities, and spectacular wildlife viewing.',
    image: '/botswana.png', // REPLACE if possible
    link: '/lodge-types/safari-lodges' // Example link for the button
  },
  {
    id: 'exclusive',
    name: 'Exclusive Villas & Lodges',
    description: 'Unparalleled privacy and luxury. Indulge in bespoke service, unique designs, and secluded settings for the ultimate escape.',
    image: '/mozambique.png', // REPLACE if possible
    link: '/lodge-types/exclusive-villas' // Example link for the button
  }
];

// --- Renamed Component ---
const LodgeTypeShowcase = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const sectionRef = useRef(null);
  const triggerMapRef = useRef(new Map());
  const observerRef = useRef(null);

  useEffect(() => {
    const sectionElement = sectionRef.current;
    if (!sectionElement) return;

    const cleanup = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      triggerMapRef.current.forEach((_, trigger) => {
        // Check parentNode before removal
        if (trigger.parentNode === sectionElement) {
          sectionElement.removeChild(trigger);
        }
      });
      triggerMapRef.current.clear();
      observerRef.current = null;
    };

    cleanup();

    // Observer options: Trigger when crossing the vertical center of viewport
    const options = {
      root: null,
      rootMargin: '-50% 0px -50% 0px', // Targets the middle horizontal line
      threshold: 0 // Trigger as soon as the boundary crosses the line
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (triggerMapRef.current.has(entry.target)) {
          if (entry.isIntersecting) { // Only act when *entering* the center threshold
            const index = triggerMapRef.current.get(entry.target);
            setActiveSlide(index);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, options);
    observerRef.current = observer;

    lodgeTypes.forEach((_, index) => {
      const trigger = document.createElement('div');
      trigger.style.height = '100vh';
      trigger.style.width = '100%';
      trigger.style.position = 'absolute';
      trigger.style.top = `${index * 100}vh`;
      trigger.style.left = '0';
      trigger.style.zIndex = '-1'; // Keep behind content

      sectionElement.appendChild(trigger);
      triggerMapRef.current.set(trigger, index);
      observer.observe(trigger);
    });

    return cleanup;

  }, [lodgeTypes.length]);


  return (
    <section
      className="relative"
      style={{ height: `${lodgeTypes.length * 100}vh` }}
      ref={sectionRef}
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {lodgeTypes.map((lodgeType, index) => (
          <div
            key={lodgeType.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              backgroundImage: `url(${lodgeType.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-white z-20 p-4"> {/* Added flex-col and padding */}
              <div className="text-center max-w-3xl mx-auto">
                {/* --- Animated Text --- */}
                <h2
                    className={`text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 transition-all duration-500 ease-out ${
                        index === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: index === activeSlide ? '200ms' : '0ms' }}
                >
                  {lodgeType.name}
                </h2>
                <p
                    className={`text-lg sm:text-xl md:text-2xl mb-8 transition-all duration-500 ease-out ${ // Added mb-8
                        index === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: index === activeSlide ? '400ms' : '0ms' }}
                >
                  {lodgeType.description}
                </p>

                {/* --- Discover More Button --- */}
                <a
                  href={lodgeType.link} // Use the link from data
                  className={`inline-block bg-white text-gray-900 px-8 py-3 rounded-md font-semibold uppercase tracking-wider transition-all duration-500 ease-out hover:bg-opacity-90 hover:shadow-lg ${ // Styling for the button
                    index === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: index === activeSlide ? '600ms' : '0ms' }} // Delay button slightly more
                >
                  Discover More
                </a>

              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Trigger elements are appended here by the useEffect */}
    </section>
  );
};

export default LodgeTypeShowcase;