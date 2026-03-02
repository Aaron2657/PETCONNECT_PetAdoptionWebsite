import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function EditProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState(''); // NEW: Phone state
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [existingPicUrl, setExistingPicUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch their existing profile when the page loads
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDisplayName(data.displayName || currentUser.displayName || '');
          // NEW: Grab the phone number (checking both potential variable names just in case)
          setPhone(data.phone || data.phoneNumber || ''); 
          setBio(data.bio || '');
          setExistingPicUrl(data.profilePicUrl || '');
        } else {
          setDisplayName(currentUser.displayName || '');
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let finalPicUrl = existingPicUrl;

      // If they selected a new picture, upload it to Cloudinary first!
      if (profilePic) {
        const formData = new FormData();
        formData.append('file', profilePic);
        
        formData.append('upload_preset', 'petconnect_uploads'); 
        const cloudinaryResponse = await fetch(
          'https://api.cloudinary.com/v1_1/drvxsajim/image/upload',
          { method: 'POST', body: formData }
        );

        if (!cloudinaryResponse.ok) throw new Error("Image upload failed");
        
        const imageData = await cloudinaryResponse.json();
        finalPicUrl = imageData.secure_url;
      }

      // Save everything to the 'users' collection in Firebase
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName || 'Anonymous',
        email: currentUser.email,
        phone: phone, // NEW: Save the updated phone number!
        bio: bio,
        profilePicUrl: finalPicUrl,
        updatedAt: new Date()
      }, { merge: true }); // Merge ensures we don't overwrite anything else by accident

      // Send them to their public profile so they can see the changes!
      navigate(`/user/${currentUser.uid}`);
      
    } catch (err) {
      console.error(err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-bold text-primary">Loading profile data...</div>;

  return (
    <div className="flex items-center justify-center mt-10 mb-10 px-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md border-t-4 border-secondary">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-3xl font-bold text-primary">Edit Profile</h2>
          <Link to="/dashboard" className="text-secondary font-bold hover:underline">Cancel</Link>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture Upload */}
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-primary flex-shrink-0">
              {profilePic ? (
                <img src={URL.createObjectURL(profilePic)} alt="Preview" className="w-full h-full object-cover" />
              ) : existingPicUrl ? (
                <img src={existingPicUrl} alt="Current Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold uppercase">
                  {displayName ? displayName.charAt(0) : '?'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Profile Picture</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setProfilePic(e.target.files[0])} 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-tertiary file:text-primary hover:file:bg-opacity-80 transition"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Display Name</label>
              <input 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                required 
                placeholder="e.g. John Doe Rescue"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"
              />
            </div>

            {/* NEW: Phone Number Input */}
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
                placeholder="e.g. 09123456789"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">About Me / Bio</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              rows="4" 
              placeholder="Tell adopters a little bit about yourself or your rescue mission..."
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"
            ></textarea>
          </div>

          <button 
            disabled={saving} 
            type="submit" 
            className="w-full bg-secondary text-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition disabled:opacity-50 mt-4"
          >
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}