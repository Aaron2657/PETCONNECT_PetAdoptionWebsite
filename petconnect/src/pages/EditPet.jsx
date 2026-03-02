import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function EditPet() {
  const { id } = useParams(); // The pet's ID from the URL
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  
  // Image State
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [newImage, setNewImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch the pet's existing details when the page loads
  useEffect(() => {
    const fetchPet = async () => {
      try {
        const docRef = doc(db, 'pets', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const petData = docSnap.data();
          
          // Security check: Only the person who posted the pet can edit it!
          if (currentUser.uid !== petData.rescuerId) {
            setError("You do not have permission to edit this pet.");
            setLoading(false);
            return;
          }

          // Pre-fill the form with the existing data
          setName(petData.name);
          setSpecies(petData.species);
          setAge(petData.age);
          setDescription(petData.description);
          setExistingImageUrl(petData.imageUrl);
        } else {
          setError("Pet not found!");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load pet details.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchPet();
    } else {
      navigate('/login');
    }
  }, [id, currentUser, navigate]);

  // 2. Handle saving the updated details
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let finalImageUrl = existingImageUrl;

      // If they selected a NEW image, upload it to Cloudinary
      if (newImage) {
        const formData = new FormData();
        formData.append('file', newImage);
        
        // IMPORTANT: Replace with your Cloudinary details
        formData.append('upload_preset', 'petconnect_uploads'); 
        const cloudinaryResponse = await fetch(
          'https://api.cloudinary.com/v1_1/drvxsajim/image/upload',
          { method: 'POST', body: formData }
        );

        if (!cloudinaryResponse.ok) throw new Error("Image upload failed");
        
        const imageData = await cloudinaryResponse.json();
        finalImageUrl = imageData.secure_url;
      }

      // Update the specific document in Firebase
      const petRef = doc(db, 'pets', id);
      await updateDoc(petRef, {
        name,
        species,
        age,
        description,
        imageUrl: finalImageUrl,
        // We don't update the status or createdAt so we don't accidentally overwrite them!
      });

      // Send them back to the pet's public profile to see the changes
      navigate(`/pet/${id}`);
      
    } catch (err) {
      console.error(err);
      setError('Failed to update pet details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-bold text-primary">Loading pet details...</div>;
  if (error) return <div className="text-center mt-20 text-red-500 text-xl font-bold">{error}</div>;

  return (
    <div className="flex items-center justify-center mt-10 mb-10 px-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md border-t-4 border-secondary">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-primary">Edit {name}'s Details</h2>
          <Link to="/dashboard" className="text-secondary font-bold hover:underline">Cancel</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Pet's Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-tertiary outline-none" />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Species</label>
              <select value={species} onChange={(e) => setSpecies(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-tertiary outline-none">
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Age (e.g., "2 Months", "3 Years")</label>
            <input type="text" value={age} onChange={(e) => setAge(e.target.value)} required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-tertiary outline-none" />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="4" className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-tertiary outline-none"></textarea>
          </div>

          {/* Image Upload Section */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <label className="block text-gray-700 font-semibold mb-2">Update Photo (Optional)</label>
            <div className="flex items-center space-x-4">
              <img src={newImage ? URL.createObjectURL(newImage) : existingImageUrl} alt="Pet Preview" className="w-16 h-16 object-cover rounded-md border" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setNewImage(e.target.files[0])} 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-tertiary file:text-primary hover:file:bg-opacity-80 transition"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Leave this blank if you want to keep the current photo.</p>
          </div>

          <button disabled={saving} type="submit" className="w-full bg-secondary text-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition mt-6 disabled:opacity-50">
            {saving ? 'Saving Changes...' : 'Save Pet Details'}
          </button>
        </form>
      </div>
    </div>
  );
}