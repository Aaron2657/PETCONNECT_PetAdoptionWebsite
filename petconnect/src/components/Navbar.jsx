import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <nav className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold tracking-wide text-secondary">
          PetConnect
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="hover:text-tertiary transition">Home</Link>
          <Link to="/browse" className="hover:text-tertiary transition">Browse Pets</Link>
          
          {currentUser ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-tertiary border-l border-gray-400 pl-4">
                {currentUser.displayName || currentUser.email}
              </span>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 transition"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-secondary text-primary px-4 py-2 rounded-md font-semibold hover:bg-opacity-90 transition whitespace-nowrap">
              Login / Sign Up
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="md:hidden focus:outline-none" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-6 h-6 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-4 space-y-2 pb-2">
          <Link to="/" className="block hover:bg-gray-700 px-2 py-1 rounded">Home</Link>
          <Link to="/browse" className="block hover:bg-gray-700 px-2 py-1 rounded">Browse Pets</Link>
          
          {currentUser ? (
             <>
               <span className="block text-tertiary px-2 py-1 text-sm border-t border-gray-600 pt-2 mt-2">
                 Logged in as: {currentUser.displayName || currentUser.email}
               </span>
               <button 
                 onClick={handleLogout} 
                 className="block w-full text-left text-red-400 font-semibold hover:bg-gray-700 px-2 py-1 rounded"
               >
                 Log Out
               </button>
             </>
          ) : (
            <Link to="/login" className="block text-secondary font-semibold hover:bg-gray-700 px-2 py-1 rounded">
              Login / Sign Up
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;