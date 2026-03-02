import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
// NEW FIREBASE IMPORTS
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  
  // UPDATED: Destructure 'logout' so we can kick banned users out!
  const { login, logout } = useAuth(); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      
      // 1. Authenticate the user with Firebase
      await login(emailRef.current.value, passwordRef.current.value);
      
      // 2. Grab their current User ID securely from Firebase Auth
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        // 3. Fetch their user profile from your database
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        // 4. Check if the Admin has flagged them as banned
        if (userDoc.exists() && userDoc.data().isBanned) {
          
          // Log them out instantly!
          await logout(); 
          
          // Display the exact requested error message
          setError('You have been reported by a user and has been banned off the platform and cannot login.');
          setLoading(false);
          return; // Stop running the code so they don't get redirected to the Home page!
        }
      }

      // 5. If they are NOT banned, send them to the home page normally
      navigate('/');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center mt-10">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border-t-4 border-secondary">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">Log In</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input 
              type="email" 
              ref={emailRef} 
              required 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <input 
              type="password" 
              ref={passwordRef} 
              required 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"
            />
          </div>
          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-secondary text-primary font-bold py-2 px-4 rounded hover:bg-opacity-90 transition disabled:opacity-50"
          >
            Log In
          </button>
        </form>
        <div className="text-center mt-4 text-gray-600">
          Need an account? <Link to="/signup" className="text-primary font-bold hover:underline">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}