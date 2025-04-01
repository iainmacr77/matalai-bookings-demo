import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[rgb(66,65,52)] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Nyoka</h3>
            <p className="text-gray-200 mb-4">
              Luxury safari experiences in the heart of Africa
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-200 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a href="#" className="text-gray-200 hover:text-white">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.09 1.064.067 1.791.207 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.258.636.398 1.363.465 2.427.067 1.067.09 1.407.09 4.123v.08c0 2.643-.012 2.987-.09 4.043-.067 1.064-.207 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.258-1.363.398-2.427.465-1.067.067-1.407.09-4.123.09h-.08c-2.643 0-2.987-.012-4.043-.09-1.064-.067-1.791-.207-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.258-.636-.398-1.363-.465-2.427-.067-1.024-.077-1.379-.09-3.808v-.63c0-2.43.013-2.784.09-3.808.067-1.064.207-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.258 1.363-.398 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-200 hover:text-white">Lodges & Camps</a></li>
              <li><a href="#" className="text-gray-200 hover:text-white">Experiences</a></li>
              <li><a href="#" className="text-gray-200 hover:text-white">About Us</a></li>
              <li><a href="#" className="text-gray-200 hover:text-white">Contact</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-200">
              <li>+27 (0) 21 883 2444</li>
              <li>reservations@nyoka.com</li>
              <li>PO Box 1234</li>
              <li>Arusha, Tanzania</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Newsletter</h3>
            <p className="text-gray-200 mb-4">
              Subscribe to our newsletter for updates and special offers.
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-l-md text-black"
              />
              <button
                type="submit"
                className="bg-[rgb(233,228,216)] text-[rgb(82,41,14)] px-4 py-2 rounded-r-md hover:bg-[rgb(213,208,196)]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[rgb(86,85,72)] mt-12 pt-8 text-center text-gray-200">
          <p>&copy; {new Date().getFullYear()} Nyoka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 