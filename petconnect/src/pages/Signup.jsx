import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const phoneRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  
  const { signup, logout } = useAuth();
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError('Passwords do not match');
    }

    // Ensure they typed exactly 10 digits after the +63
    if (phoneRef.current.value.length !== 10) {
      return setError('Please enter a valid 10-digit mobile number (e.g., 9123456789)');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Combine the prefix with the user's input before sending to database
      const fullPhoneNumber = `+63${phoneRef.current.value}`;
      
      // 1. Create the account in Firebase
      await signup(
        emailRef.current.value, 
        passwordRef.current.value,
        firstNameRef.current.value,
        lastNameRef.current.value,
        fullPhoneNumber
      );

      // 2. if Firebase auto-logs them in. We instantly log them out!
      if (logout) {
        await logout();
      }

      // 3. Show the success message
      setSuccess('Account created successfully! Redirecting to login...');
      
      // 4. Redirect after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error(err);
      setError('Failed to create an account. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center mt-10 mb-20 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border-t-4 border-primary">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">Create Account</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 font-bold">{success}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">First Name</label>
              <input type="text" ref={firstNameRef} required disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100" />
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Last Name</label>
              <input type="text" ref={lastNameRef} required disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100" />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
            <div className="flex shadow-sm">
              <span className="inline-flex items-center px-4 py-2 border border-r-0 border-gray-300 bg-gray-100 text-gray-700 rounded-l-md font-bold">
                +63
              </span>
              <input 
                type="tel" 
                ref={phoneRef} 
                required 
                disabled={success !== ''} 
                maxLength="10"
                placeholder="9123456789"
                onChange={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} // Blocks letters
                className="w-full px-4 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100" 
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input type="email" ref={emailRef} required disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100" />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <input type="password" ref={passwordRef} required disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100" />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
            <input type="password" ref={passwordConfirmRef} required disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100" />
          </div>
          
          <button disabled={loading || success !== ''} type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded hover:bg-opacity-90 transition disabled:opacity-50 mt-6 shadow-sm">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account? <Link to="/login" className="text-secondary font-semibold hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}