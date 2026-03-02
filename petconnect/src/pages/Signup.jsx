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
  const [success, setSuccess] = useState(''); // NEW: State for our success message
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // 1. Create the account in Firebase
      await signup(
        emailRef.current.value, 
        passwordRef.current.value,
        firstNameRef.current.value,
        lastNameRef.current.value,
        phoneRef.current.value
      );

      // 2. Firebase auto-logs them in. We instantly log them out!
      if (logout) {
        await logout();
      }

      // 3. Show the success message
      setSuccess('Account created successfully! Please login your new account...');
      
      // 4. Wait 2 seconds so the user can read the message, then redirect
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError('Failed to create an account: ' + err.message);
      setLoading(false); // We only stop loading if there is an error
    }
  }

  return (
    <div className="flex items-center justify-center mt-10 mb-10 px-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md border-t-4 border-secondary">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">Create an Account</h2>
        
        {/* Error Message */}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        {/* NEW: Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-500 text-green-800 px-4 py-3 rounded mb-4 font-bold text-center shadow-sm">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">First Name</label>
              <input type="text" ref={firstNameRef} required disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100" />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Last Name</label>
              <input type="text" ref={lastNameRef} required disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100" />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
            <input type="tel" ref={phoneRef} required disabled={success !== ''} placeholder="e.g. 09123456789" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100" />
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
        
        <div className="text-center mt-6 text-gray-600">
          Already have an account? <Link to="/login" className="text-secondary font-bold hover:underline">Log In</Link>
        </div>
      </div>
    </div>
  );
}