import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function EditProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(''); 
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [existingPicUrl, setExistingPicUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
          
          if (data.firstName || data.lastName) {
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
          } else {
            const nameParts = (data.displayName || '').split(' ');
            setFirstName(nameParts[0] || '');
            setLastName(nameParts.slice(1).join(' ') || '');
          }

          // Strip the +63 prefix when loading into the input state
          if (data.phone) {
            const cleanPhone = data.phone.startsWith('+63') ? data.phone.substring(3) : data.phone;
            setPhone(cleanPhone);
          }
          
          setBio(data.bio || '');
          setExistingPicUrl(data.profilePicUrl || '');
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, navigate]);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setProfilePic(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      setSaving(false);
      return;
    }

    try {
      let finalPicUrl = existingPicUrl;

      if (profilePic) {
        const data = new FormData();
        data.append("file", profilePic);
        data.append("upload_preset", "petconnect"); 
        data.append("cloud_name", "dcb3qivh3"); 

        const res = await fetch("https://api.cloudinary.com/v1_1/dcb3qivh3/image/upload", {
          method: "POST",
          body: data,
        });

        const uploadResult = await res.json();
        finalPicUrl = uploadResult.secure_url;
      }

      // Re-add the +63 prefix before saving
      const fullPhoneNumber = `+63${phone}`;

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        phone: fullPhoneNumber,
        bio,
        profilePicUrl: finalPicUrl
      });

      alert('Profile updated successfully!');
      navigate(`/user/${currentUser.uid}`);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20 text-xl font-semibold text-primary">Loading profile...</div>;
  }

  return (
    <div className="flex items-center justify-center mt-10 mb-20 px-4">
      <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow-md border-t-4 border-secondary">
        <Link to={`/user/${currentUser.uid}`} className="text-secondary font-bold hover:underline mb-6 inline-block">
          &larr; Back to Profile
        </Link>
        
        <h2 className="text-3xl font-bold text-primary mb-6">Edit Profile</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            {existingPicUrl || profilePic ? (
              <img 
                src={profilePic ? URL.createObjectURL(profilePic) : existingPicUrl} 
                alt="Profile Preview" 
                className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl font-bold border-4 border-gray-300">
                ?
              </div>
            )}
            
            <div className="flex-1 w-full">
              <label className="block text-gray-700 font-semibold mb-2">Profile Picture</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-tertiary file:text-primary hover:file:bg-opacity-80 transition"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">First Name</label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required 
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Last Name</label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Mobile Number</label>
            <div className="flex shadow-sm">
              <span className="inline-flex items-center px-4 py-2 border border-r-0 border-gray-300 bg-gray-100 text-gray-700 rounded-l-md font-bold">
                +63
              </span>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} 
                required 
                maxLength="10"
                placeholder="9123456789"
                className="w-full px-4 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-tertiary"
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
            className="w-full bg-secondary text-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition mt-6 disabled:opacity-50 shadow-sm"
          >
            {saving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}