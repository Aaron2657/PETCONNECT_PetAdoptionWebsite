import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  
  const { login, logout } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation(); // NEW: Grab the location to check for kicked-out messages

  // NEW: Initialize error state with the banned message if it exists
  const [error, setError] = useState(location.state?.bannedMessage || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      
      // 1. Authenticate the user with Firebase
      await login(emailRef.current.value, passwordRef.current.value);
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        // 2. Fetch their user profile from your database
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // 3. Check if they are banned BEFORE letting them in
          if (userData.isBanned) {
            await logout(); 
            setError('Your account has been reported and permanently banned from the platform.');
            setLoading(false);
            return;
          }

          // 4. If they are an Admin, send to Admin Dashboard. Otherwise, Home.
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen -mt-20 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border-t-4 border-primary">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">Log In</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 font-semibold">{error}</div>}
        
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
            className="w-full bg-secondary text-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition disabled:opacity-50 mt-6 shadow-sm"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Need an account? <Link to="/signup" className="text-secondary font-semibold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}