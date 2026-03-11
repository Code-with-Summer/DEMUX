import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteTitle } from '../common/site-title-context.jsx';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { siteTitle } = useSiteTitle();

  return (
    <footer style={{ backgroundColor: '#F9FAFB' }} className="border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600 }} className="text-gray-900 mb-3">
              {siteTitle}
            </h3>
            <p style={{ fontSize: '14px', color: '#4B5563' }} className="leading-relaxed">
              A modern blogging platform for sharing ideas and stories.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600 }} className="text-gray-900 uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" style={{ fontSize: '14px' }} className="text-gray-600 hover:text-gray-900 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/signin" style={{ fontSize: '14px' }} className="text-gray-600 hover:text-gray-900 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" style={{ fontSize: '14px' }} className="text-gray-600 hover:text-gray-900 transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Copyright */}
          <div className="md:text-right">
            <p style={{ fontSize: '14px' }} className="text-gray-600">
              © {currentYear} {siteTitle}. All rights reserved.
            </p>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }} className="mt-2">
              Built with modern design principles
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

