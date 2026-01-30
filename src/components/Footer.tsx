import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img 
                src="logo.png" 
                alt="Thani Oruvan Maths Logo" 
                className="w-14 h-14 rounded-lg shadow-lg object-cover"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='url(%23grad)' rx='8'/%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%233b82f6'/%3E%3Cstop offset='100%25' style='stop-color:%239333ea'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ctext x='28' y='38' font-family='Arial' font-size='22' font-weight='bold' fill='white' text-anchor='middle'%3ETO%3C/text%3E%3C/svg%3E";
                }}
              />
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Thani Oruvan
                </h3>
                <p className="text-base text-gray-400">Maths</p>
              </div>
            </div>
            <p className="text-gray-400 text-base leading-relaxed mb-6 max-w-md">
              Your trusted partner for competitive exam preparation. Master aptitude, quantitative ability, and reasoning with our expert guidance.
            </p>
            <div className="flex gap-4">
              <SocialIcon href="#" icon={<Facebook size={20} />} />
              <SocialIcon href="#" icon={<Twitter size={20} />} />
              <SocialIcon href="#" icon={<Instagram size={20} />} />
              <SocialIcon href="#" icon={<Youtube size={20} />} />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Contact Us
            </h4>
            <ul className="space-y-5 text-gray-300">
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-800 transition-colors duration-300">
                  <Mail size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <a href="mailto:support@thanioruvenmaths.com" className="hover:text-purple-400 transition-colors duration-200">
                    support@thanioruvenmaths.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-800 transition-colors duration-300">
                  <Phone size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <a href="tel:+919876543210" className="hover:text-blue-400 transition-colors duration-200">
                    +91 98765 43210
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-800 transition-colors duration-300">
                  <MapPin size={20} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <span className="text-gray-300">Tamil Nadu, India</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm gap-4">
            <p>
              &copy; {new Date().getFullYear()} <span className="font-semibold text-blue-400">Thani Oruvan Maths</span>. All rights reserved.
            </p>
           
          </div>
        </div>
      </div>

      {/* Decorative Bottom Border */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
    </footer>
  );
}

/* Social Icon Component */
function SocialIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="w-11 h-11 bg-gray-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
    >
      {icon}
    </a>
  );
}