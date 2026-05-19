import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

export default function GlobalBannedListener() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If no one is logged in, do nothing
    if (!currentUser) return;

    // Set up a real-time listener on the current user's profile document
    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        
        // The millisecond isBanned becomes true, execute this block!
        if (userData.isBanned) {
          await logout();
          
          // Kick them to the login page and pass a secure message through React Router state
          navigate('/login', { 
            state: { bannedMessage: 'Your account has been permanently suspended by an Administrator. You have been logged out.' } 
          });
        }
      }
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [currentUser, logout, navigate]);

  return null; // This component renders nothing to the screen
}