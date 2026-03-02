import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function EditPet() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  
  // UPDATED: Image State now handles arrays for the carousel!
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const docRef = doc(db, 'pets', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const petData = docSnap.data();
          
          if (currentUser.uid !== petData.rescuerId) {
            setError("You do not have permission to edit this pet.");
            setLoading(false);
            return;
          }

          setName(petData.name);
          setSpecies(petData.species);
          setAge(petData.age);
          setDescription(petData.description);
          
          // Fallback to single imageUrl if it's an older post without an array
          setExistingImageUrls(petData.imageUrls || [petData.imageUrl]);
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

  const handleImageChange = (e) => {
    if (e.target.files) {
      setNewImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let finalImageUrls = existingImageUrls;
      let finalImageUrl = existingImageUrls[0]; // The thumbnail is always the first image

      // If they selected NEW images, upload them all to Cloudinary
      if (newImages.length > 0) {
        const uploadPromises = newImages.map(async (img) => {
          const formData = new FormData();
          formData.append('file', img);
          formData.append('upload_preset', 'petconnect_uploads'); 

          const cloudinaryResponse = await fetch(
            'https://api.cloudinary.com/v1_1/drvxsajim/image/upload',
            { method: 'POST', body: formData }
          );

          if (!cloudinaryResponse.ok) throw new Error("Image upload failed");
          
          const imageData = await cloudinaryResponse.json();
          return imageData.secure_url;
        });

        finalImageUrls = await Promise.all(uploadPromises);
        finalImageUrl = finalImageUrls[0]; // Set the new thumbnail
      }

      // Update the specific document in Firebase
      const petRef = doc(db, 'pets', id);
      await updateDoc(petRef, {
        name,
        species,
        age,
        description,
        imageUrl: finalImageUrl,
        imageUrls: finalImageUrls, // Save the full array for the carousel
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
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-3xl font-bold text-primary">Edit {name}'s Details</h2>
          <Link to={`/pet/${id}`} className="text-secondary font-bold hover:underline">Cancel</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Pet's Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Species</label>
              <select value={species} onChange={(e) => setSpecies(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary">
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Age (e.g., "2 Months", "3 Years")</label>
            <input type="text" value={age} onChange={(e) => setAge(e.target.value)} required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="4" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"></textarea>
          </div>

          {/* UPDATED: Multi-Image Upload Section */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <label className="block text-gray-700 font-semibold mb-2">Update Photos (Select multiple)</label>
            
            {/* Show tiny previews of existing or newly selected images */}
            <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
              {newImages.length > 0 
                ? newImages.map((img, idx) => (
                    <img key={idx} src={URL.createObjectURL(img)} alt={`New preview ${idx}`} className="w-16 h-16 object-cover rounded-md border shadow-sm flex-shrink-0" />
                  ))
                : existingImageUrls.map((url, idx) => (
                    <img key={idx} src={url} alt={`Current photo ${idx}`} className="w-16 h-16 object-cover rounded-md border shadow-sm flex-shrink-0" />
                  ))
              }
            </div>

            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleImageChange} 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-tertiary file:text-primary hover:file:bg-opacity-80 transition"
            />
            <p className="text-xs text-gray-500 mt-2">
              <strong>Note:</strong> Uploading new photos will completely replace the current photo gallery. Leave this blank to keep existing photos.
            </p>
          </div>

          <button disabled={saving} type="submit" className="w-full bg-secondary text-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition mt-6 disabled:opacity-50 shadow-sm">
            {saving ? 'Saving Changes...' : 'Save Pet Details'}
          </button>
        </form>
      </div>
    </div>
  );
}