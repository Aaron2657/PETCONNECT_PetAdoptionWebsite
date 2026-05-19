import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function EditPet() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Form State (Notice: 'status' has been entirely removed)
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  
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
          setExistingImageUrls(petData.imageUrls || (petData.imageUrl ? [petData.imageUrl] : []));
        } else {
          setError("Pet not found.");
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
    }
  }, [id, currentUser]);

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
      let finalImageUrls = [...existingImageUrls];

      if (newImages.length > 0) {
        finalImageUrls = []; // Reset if they are uploading new photos
        for (const image of newImages) {
          const data = new FormData();
          data.append("file", image);
          data.append("upload_preset", "petconnect"); 
          data.append("cloud_name", "dcb3qivh3"); 

          const res = await fetch("https://api.cloudinary.com/v1_1/dcb3qivh3/image/upload", {
            method: "POST",
            body: data,
          });

          const uploadResult = await res.json();
          finalImageUrls.push(uploadResult.secure_url);
        }
      }

      const petRef = doc(db, 'pets', id);
      // Update only core details, leaving status up to the application logic
      await updateDoc(petRef, {
        name,
        species,
        age,
        description,
        imageUrls: finalImageUrls
      });

      navigate(`/pet/${id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to update pet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-semibold text-primary">Loading pet details...</div>;
  if (error) return <div className="text-center mt-20 text-xl font-semibold text-red-600">{error}</div>;

  return (
    <div className="flex items-center justify-center mt-10 mb-20 px-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md border-t-4 border-secondary">
        <Link to={`/pet/${id}`} className="text-secondary font-bold hover:underline mb-6 inline-block">
          &larr; Back to Pet
        </Link>
        <h2 className="text-3xl font-bold text-primary mb-6">Edit Pet Listing</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Pet Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Species</label>
              <select value={species} onChange={(e) => setSpecies(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary">
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Age</label>
            <input type="text" value={age} onChange={(e) => setAge(e.target.value)} required placeholder="e.g. 2 Months, 3 Years" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary" />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Description / Background</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="4" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"></textarea>
          </div>

          <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
            <label className="block text-gray-700 font-semibold mb-2">Photos</label>
            
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
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
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}