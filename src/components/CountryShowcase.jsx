import React, { useEffect, useRef, useState } from 'react';

const countries = [
  {
    name: 'South Africa',
    description: 'Experience the diverse landscapes and rich wildlife of South Africa',
    image: '/south-africa.png' // Make sure path is correct
  },
  {
    name: 'Botswana',
    description: 'Discover the pristine wilderness of the Okavango Delta',
    image: '/botswana.png' // Make sure path is correct
  },
  {
    name: 'Mozambique',
    description: 'Explore the coastal paradise and marine life of Mozambique',
    image: '/mozambique.png' // Make sure path is correct
  }
];

const CountryShowcase = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const sectionRef = useRef(null);
  // Use a ref to keep track of trigger elements mapped to their index
  const triggerMapRef = useRef(new Map());
  // Ref for the observer instance to clean it up properly
  const observerRef = useRef(null);

  useEffect(() => {
    const sectionElement = sectionRef.current;
    if (!sectionElement) return;

    // --- Cleanup function for previous effect runs ---
    const cleanup = () => {
        if (observerRef.current) {
            observerRef.current.disconnect(); // Disconnect observer
        }
        triggerMapRef.current.forEach((_, trigger) => {
            // Check if trigger is still in DOM before removing
            if (trigger.parentNode === sectionElement) {
                sectionElement.removeChild(trigger);
            }
        });
        triggerMapRef.current.clear(); // Clear the map
        observerRef.current = null;
    };

    // Run cleanup first
    cleanup();
    // --- End Cleanup ---


    // Observer options: target the vertical center line of the viewport
    const options = {
      root: null, // Use the viewport as the root
      rootMargin: '-50% 0px -50% 0px', // Margins to isolate the vertical center
      threshold: 0 // Trigger as soon as the center line is crossed (can be 0 or a small value)
      // threshold: 0.5 // Alternatively: trigger when the *center* of the trigger hits the center line
    };

    // Callback function for the observer
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        // Check if the element triggering the callback is one of our triggers
        if (triggerMapRef.current.has(entry.target)) {
           // Only update if the trigger is intersecting (entering the center)
           if (entry.isIntersecting) {
            const index = triggerMapRef.current.get(entry.target);
            // console.log(`Trigger ${index} intersecting`); // For debugging
            setActiveSlide(index);
          }
          // Note: We only care about entry.isIntersecting being true here.
          // When scrolling up, the *previous* trigger will become intersecting again.
        }
      });
    };

    // Create a single observer instance
    const observer = new IntersectionObserver(observerCallback, options);
    observerRef.current = observer; // Store observer instance

    // Create and observe trigger elements
    countries.forEach((_, index) => {
      const trigger = document.createElement('div');
      // Add some basic styles for debugging if needed
      // trigger.style.border = '1px dashed red';
      // trigger.style.position = 'absolute'; // already set below
      trigger.style.height = '100vh'; // Each trigger represents one screen height of scroll
      trigger.style.width = '100%';
      trigger.style.position = 'absolute';
      trigger.style.top = `${index * 100}vh`; // Position triggers down the page
      trigger.style.left = '0';
      trigger.style.zIndex = '-1'; // Put behind content (optional)

      sectionElement.appendChild(trigger);
      triggerMapRef.current.set(trigger, index); // Map the DOM element to its index
      observer.observe(trigger); // Observe the trigger
    });

    // Return the cleanup function to be called on unmount or before re-run
    return cleanup;

    // Dependency array: run effect if number of countries changes
  }, [countries.length]);


  return (
    // Set total height based on the number of countries
    <section
      className="relative"
      style={{ height: `${countries.length * 100}vh` }}
      ref={sectionRef}
    >
      {/* This div becomes sticky */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {countries.map((country, index) => (
          <div
            key={country.name}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${ // Adjusted duration/easing
              // Use z-index along with opacity for smoother transitions
              index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              backgroundImage: `url(${country.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative h-full flex items-center justify-center text-white z-20"> {/* Ensure content is above overlay */}
              <div className="text-center px-4 max-w-3xl mx-auto"> {/* Added max-width */}
                {/* Add transition to text elements too for better effect */}
                <h2
                    className={`text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 transition-all duration-500 ease-out ${
                        index === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: index === activeSlide ? '200ms' : '0ms' }} // Delay fade-in slightly
                >
                  {country.name}
                </h2>
                <p
                    className={`text-lg sm:text-xl md:text-2xl transition-all duration-500 ease-out ${
                        index === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: index === activeSlide ? '400ms' : '0ms' }} // Delay fade-in slightly more
                >
                  {country.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* The trigger elements are appended here by the useEffect */}
    </section>
  );
};

export default CountryShowcase;