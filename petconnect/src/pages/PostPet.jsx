import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function PostPet() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl text-primary font-bold">Please log in to post a rescued pet.</h2>
        <button onClick={() => navigate('/login')} className="mt-4 bg-secondary text-primary px-6 py-2 rounded font-bold">Log In</button>
      </div>
    );
  }

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return setError('Please upload a picture of the pet.');

    try {
      setError('');
      setLoading(true);

      // 1. Prepare the image to send to Cloudinary
      const formData = new FormData();
      formData.append('file', image);
      
    
      formData.append('upload_preset', 'petconnect_uploads'); 

      const cloudinaryResponse = await fetch(
        'https://api.cloudinary.com/v1_1/drvxsajim/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (!cloudinaryResponse.ok) {
         throw new Error(cloudinaryData.error?.message || 'Image upload failed');
      }

      // public URL to uploaded image!
      const imageUrl = cloudinaryData.secure_url;

      // Save the pet data + the new Cloudinary image URL to Firebase Firestore
      await addDoc(collection(db, 'pets'), {
        name,
        species,
        age,
        description,
        imageUrl,
        rescuerId: currentUser.uid,
        rescuerEmail: currentUser.email,
        rescuerName: currentUser.displayName,
        status: 'Available', 
        createdAt: serverTimestamp()
      });

      //Redirect to home
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to post pet. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center mt-10 mb-10">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md border-t-4 border-tertiary">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">Post a Rescued Pet</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Pet's Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Species</label>
              <select value={species} onChange={(e) => setSpecies(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary">
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Age (e.g., 2 Months, 3 Years)</label>
            <input type="text" value={age} onChange={(e) => setAge(e.target.value)} required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Description / Background</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="4" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"></textarea>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Pet Photo</label>
            <input type="file" accept="image/*" onChange={handleImageChange} required className="w-full px-4 py-2 border rounded-md" />
          </div>
          
          <button disabled={loading} type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded hover:bg-opacity-90 transition disabled:opacity-50 mt-6">
            {loading ? 'Uploading Pet Profile...' : 'Post Rescued Pet'}
          </button>
        </form>
      </div>
    </div>
  );
}