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
  
  const { signup } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      // Pass the new fields into the signup function
      await signup(
        emailRef.current.value, 
        passwordRef.current.value,
        firstNameRef.current.value,
        lastNameRef.current.value,
        phoneRef.current.value
      );
      navigate('/');
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center mt-10 mb-10">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border-t-4 border-primary">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">Sign Up</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">First Name</label>
              <input type="text" ref={firstNameRef} required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Last Name</label>
              <input type="text" ref={lastNameRef} required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
            <input type="tel" ref={phoneRef} required placeholder="e.g. 09123456789" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input type="email" ref={emailRef} required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <input type="password" ref={passwordRef} required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
            <input type="password" ref={passwordConfirmRef} required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
          </div>
          
          <button disabled={loading} type="submit" className="w-full bg-primary text-white font-bold py-2 px-4 rounded hover:bg-opacity-90 transition disabled:opacity-50 mt-4">
            Sign Up
          </button>
        </form>
        <div className="text-center mt-4 text-gray-600">
          Already have an account? <Link to="/login" className="text-secondary font-bold hover:underline">Log In</Link>
        </div>
      </div>
    </div>
  );
}