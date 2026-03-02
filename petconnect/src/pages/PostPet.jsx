import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom'; 

export default function PostPet() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]); 
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // NEW: Success state for the checkmark message
  const [loading, setLoading] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          }
        } catch (err) {
          console.error("Error checking role:", err);
        }
      }
      setCheckingRole(false);
    };

    checkUserRole();
  }, [currentUser]);

  if (checkingRole) {
    return <div className="text-center mt-20 text-xl text-primary font-semibold">Verifying permissions...</div>;
  }

  if (!currentUser) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl text-primary font-bold">Please log in to post a rescued pet.</h2>
        <button onClick={() => navigate('/login')} className="mt-4 bg-secondary text-primary px-6 py-2 rounded font-bold">Log In</button>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center px-4">
        <div className="bg-red-50 border-t-4 border-red-600 p-8 rounded-lg shadow-md max-w-lg w-full">
          <h2 className="text-3xl text-red-800 font-bold mb-4">Action Restricted</h2>
          <p className="text-lg text-red-700 mb-6">
            Administrative accounts are restricted from posting pets to maintain platform integrity. This account is for moderation only.
          </p>
          <Link to="/admin" className="bg-red-600 text-white px-6 py-3 rounded font-bold hover:bg-red-700 transition shadow-sm">
            Return to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return setError('Please upload at least one picture of the pet.');

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const uploadPromises = images.map(async (img) => {
        const formData = new FormData();
        formData.append('file', img);
        formData.append('upload_preset', 'petconnect_uploads'); 

        const cloudinaryResponse = await fetch(
          'https://api.cloudinary.com/v1_1/drvxsajim/image/upload',
          { method: 'POST', body: formData }
        );

        const cloudinaryData = await cloudinaryResponse.json();

        if (!cloudinaryResponse.ok) {
           throw new Error(cloudinaryData.error?.message || 'Image upload failed');
        }
        return cloudinaryData.secure_url;
      });

      const uploadedImageUrls = await Promise.all(uploadPromises);

      await addDoc(collection(db, 'pets'), {
        name,
        species,
        age,
        description,
        imageUrl: uploadedImageUrls[0], 
        imageUrls: uploadedImageUrls,
        rescuerId: currentUser.uid,
        rescuerEmail: currentUser.email,
        rescuerName: currentUser.displayName,
        status: 'Available', 
        createdAt: serverTimestamp()
      });

      // NEW: Show the success banner, then redirect to the dashboard after 2 seconds
      setSuccess('Pet posted successfully! Redirecting to your dashboard...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error(err);
      setError('Failed to post pet. Please try again.');
      setLoading(false); // Only turn off loading if there is an error, otherwise let it ride out the redirect!
    }
  };

  return (
    <div className="flex items-center justify-center mt-10 mb-10 px-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md border-t-4 border-tertiary">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">Post a Rescued Pet</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        {/* NEW: Green Success Banner with SVG Checkmark */}
        {success && (
          <div className="bg-green-100 border border-green-500 text-green-800 px-4 py-4 rounded mb-6 font-bold flex flex-col items-center justify-center text-center shadow-sm space-y-2">
            <div className="bg-green-500 text-white rounded-full p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <span>{success}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Pet's Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100 disabled:text-gray-400" />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Species</label>
              <select value={species} onChange={(e) => setSpecies(e.target.value)} disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100 disabled:text-gray-400">
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Age (e.g., 2 Months, 3 Years)</label>
            <input type="text" value={age} onChange={(e) => setAge(e.target.value)} required disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100 disabled:text-gray-400" />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Description / Background</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="4" disabled={success !== ''} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary disabled:bg-gray-100 disabled:text-gray-400"></textarea>
          </div>

          <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
            <label className="block text-gray-700 font-semibold mb-2">Pet Photos (Select multiple)</label>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} required disabled={success !== ''} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-tertiary file:text-primary hover:file:bg-opacity-80 transition disabled:opacity-50" />
            <p className="text-xs text-gray-500 mt-2">The first photo you select will be used as the thumbnail.</p>
          </div>
          
          <button disabled={loading || success !== ''} type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded hover:bg-opacity-90 transition disabled:opacity-50 mt-6 shadow-sm">
            {loading && !success ? 'Uploading Pet Profile...' : success ? 'Success!' : 'Post Rescued Pet'}
          </button>
        </form>
      </div>
    </div>
  );
}