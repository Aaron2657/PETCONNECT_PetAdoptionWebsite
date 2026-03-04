import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// UPDATED: Imported onSnapshot for real-time live updates!
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db } from '../config/firebase';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false); 
  const [dropdownOpen, setDropdownOpen] = useState(false); 
  const [userProfile, setUserProfile] = useState(null); 
  
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null); 

  // UPDATED: Live listener for instant profile updates
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null); 
      return;
    }

    // onSnapshot creates a live connection to this user's document
    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        setUserProfile({ displayName: currentUser.displayName || currentUser.email, bio: '', profilePicUrl: '' });
      }
    }, (error) => {
      console.error("Error fetching user profile:", error);
    });

    // Cleanup the live connection when they log out or leave
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const getDisplayName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (userProfile?.firstName) return userProfile.firstName;
    if (userProfile?.displayName) return userProfile.displayName;
    if (currentUser?.displayName) return currentUser.displayName;
    if (currentUser?.email) return currentUser.email.split('@')[0]; 
    return 'User';
  };

  const getInitial = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="bg-primary text-white p-4 shadow-md relative z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-wide text-secondary">
          PetConnect
        </Link>

        <div className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="hover:text-tertiary transition font-medium">Home</Link>
          <Link to="/browse" className="hover:text-tertiary transition font-medium">Browse Pets</Link>
          
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none hover:opacity-80 transition ml-4 border-l border-gray-500 pl-6"
              >
                {userProfile?.profilePicUrl ? (
                   <img src={userProfile.profilePicUrl} alt={getDisplayName()} className="w-10 h-10 rounded-full object-cover border-4 border-primary shadow-sm" />
                ) : (
                   <div className="w-10 h-10 bg-tertiary text-primary rounded-full flex items-center justify-center font-bold shadow-sm uppercase">
                      {getInitial()}
                   </div>
                )}
                <span className="text-sm font-medium">{getDisplayName()}</span>
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-xl py-2 border border-gray-100 overflow-hidden transform transition-all">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-bold text-primary truncate">{currentUser.email}</p>
                  </div>
                  
                  {userProfile?.role !== 'admin' && (
                    <Link 
                      to="/dashboard" 
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-tertiary hover:text-primary transition"
                    >
                      My Dashboard
                    </Link>
                  )}

                  {userProfile?.role !== 'admin' && (
                    <Link 
                      to={`/user/${currentUser.uid}`} 
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-tertiary hover:text-primary transition"
                    >
                      View Profile
                    </Link>
                  )}

                  {userProfile?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold transition border-t border-gray-100 mt-1 pt-2"
                    >
                      Admin Panel
                    </Link>
                  )}
                  
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 transition"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="bg-secondary text-primary px-5 py-2 rounded-md font-bold hover:bg-opacity-90 transition shadow-sm ml-4">
              Login / Sign Up
            </Link>
          )}
        </div>

        <button 
          className="md:hidden focus:outline-none" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-6 h-6 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden mt-4 space-y-2 pb-4 bg-primary shadow-inner rounded-b-lg">
          <Link to="/" onClick={() => setIsOpen(false)} className="block hover:bg-gray-700 px-4 py-2 rounded font-medium">Home</Link>
          <Link to="/browse" onClick={() => setIsOpen(false)} className="block hover:bg-gray-700 px-4 py-2 rounded font-medium">Browse Pets</Link>
          
          {currentUser ? (
             <div className="border-t border-gray-600 pt-2 mt-2">
               <div className="px-4 py-2 flex items-center space-x-3 mb-2">
                 {userProfile?.profilePicUrl ? (
                    <img src={userProfile.profilePicUrl} alt={getDisplayName()} className="w-10 h-10 rounded-full object-cover border-4 border-primary shadow-sm" />
                 ) : (
                    <div className="w-10 h-10 bg-tertiary text-primary rounded-full flex items-center justify-center font-bold shadow-sm uppercase">
                       {getInitial()}
                    </div>
                 )}
                 <span className="text-sm font-medium text-gray-200 truncate">{getDisplayName()}</span>
               </div>
               
               {userProfile?.role !== 'admin' && (
                 <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block hover:bg-gray-700 px-4 py-2 rounded text-tertiary font-bold">My Dashboard</Link>
               )}
               
               {userProfile?.role !== 'admin' && (
                 <Link to={`/user/${currentUser.uid}`} onClick={() => setIsOpen(false)} className="block hover:bg-gray-700 px-4 py-2 rounded text-tertiary font-bold">View Profile</Link>
               )}

               {userProfile?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className="block hover:bg-gray-700 px-4 py-2 rounded text-red-400 font-bold border-t border-gray-600 mt-2 pt-2">
                    Admin Panel
                  </Link>
               )}
               
               <button 
                 onClick={() => { handleLogout(); setIsOpen(false); }} 
                 className="block w-full text-left text-red-400 font-bold hover:bg-gray-700 px-4 py-2 rounded mt-2"
               >
                 Log Out
               </button>
             </div>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)} className="block text-secondary font-bold hover:bg-gray-700 px-4 py-2 rounded mt-2">
              Login / Sign Up
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;