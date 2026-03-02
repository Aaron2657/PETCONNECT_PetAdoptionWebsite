import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function AdoptionRequest() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  
  // NEW: State to block admins
  const [isAdmin, setIsAdmin] = useState(false);

  const [message, setMessage] = useState('');
  const [livingSituation, setLivingSituation] = useState('House with yard');
  const [hasOtherPets, setHasOtherPets] = useState('No');

  useEffect(() => {
    const fetchPetAndCheckApplication = async () => {
      try {
        const docRef = doc(db, 'pets', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPet({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Pet not found!");
          setLoading(false);
          return;
        }

        if (currentUser) {
          // NEW: Check for admin status
          const viewerDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (viewerDoc.exists() && viewerDoc.data().role === 'admin') {
            setIsAdmin(true);
            setLoading(false);
            return; // Stop checking further if they are an admin
          }

          const applicationQuery = query(
            collection(db, 'adoptionRequests'),
            where('petId', '==', id),
            where('adopterId', '==', currentUser.uid)
          );
          
          const querySnapshot = await getDocs(applicationQuery);
          
          if (!querySnapshot.empty) {
            setHasApplied(true);
          }
        }
      } catch (err) {
        setError("Failed to load pet details.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPetAndCheckApplication();
  }, [id, currentUser]);

  if (!currentUser) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl text-primary font-bold">Please log in to adopt a pet.</h2>
        <button onClick={() => navigate('/login')} className="mt-4 bg-secondary text-primary px-6 py-2 rounded font-bold">Log In</button>
      </div>
    );
  }

  // NEW: Hard block for Admins
  if (isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center px-4">
        <div className="bg-red-50 border-t-4 border-red-600 p-8 rounded-lg shadow-md max-w-lg w-full">
          <h2 className="text-3xl text-red-800 font-bold mb-4">Action Restricted</h2>
          <p className="text-lg text-red-700 mb-6">
            Administrative accounts cannot submit adoption requests. This account is for platform moderation only.
          </p>
          <Link to="/admin" className="bg-red-600 text-white px-6 py-3 rounded font-bold hover:bg-red-700 transition shadow-sm">
            Return to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentUser.uid === pet.rescuerId) {
      return setError("You cannot submit an adoption request for your own pet!");
    }

    try {
      setError('');
      setSubmitting(true);

      const adopterDocRef = doc(db, 'users', currentUser.uid);
      const adopterSnap = await getDoc(adopterDocRef);
      
      let adopterPhone = 'Not provided';
      if (adopterSnap.exists()) {
        const data = adopterSnap.data();
        adopterPhone = data.phone || data.phoneNumber || 'Not provided';
      }

      await addDoc(collection(db, 'adoptionRequests'), {
        petId: pet.id,
        petName: pet.name,
        rescuerId: pet.rescuerId,
        adopterId: currentUser.uid,
        adopterEmail: currentUser.email,
        adopterName: currentUser.displayName || 'Anonymous User',
        adopterPhone: adopterPhone, 
        message,
        livingSituation,
        hasOtherPets,
        status: 'Pending', 
        createdAt: serverTimestamp()
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-semibold text-primary">Loading application...</div>;
  if (error && !pet) return <div className="text-center mt-20 text-red-500 text-xl font-semibold">{error}</div>;

  if (hasApplied) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 space-y-4 text-center px-4">
        <div className="bg-yellow-50 border-t-4 border-yellow-400 p-8 rounded-lg shadow-md max-w-lg w-full">
          <h2 className="text-3xl font-bold text-yellow-800 mb-4">Already Applied!</h2>
          <p className="text-gray-700 text-lg">
            You have already submitted an adoption request for <strong>{pet.name}</strong>. The rescuer is currently reviewing your application and will reach out to you soon!
          </p>
          <Link to="/browse" className="inline-block bg-secondary text-primary font-bold py-3 px-6 rounded hover:bg-opacity-90 transition mt-6 shadow-sm">
            Browse More Pets
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 space-y-4 text-center">
        <h2 className="text-4xl font-bold text-green-600">Application Submitted!</h2>
        <p className="text-gray-700 text-lg max-w-md">
          Thank you for wanting to give <strong>{pet.name}</strong> a loving home. The rescuer will review your application and contact you soon.
        </p>
        <Link to="/browse" className="bg-primary text-white font-bold py-2 px-6 rounded hover:bg-opacity-90 transition mt-4">
          Browse More Pets
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center mt-10 mb-10 px-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md border-t-4 border-secondary">
        <Link to={`/pet/${pet.id}`} className="text-primary font-bold hover:underline mb-4 inline-block">
          &larr; Back to {pet.name}'s Profile
        </Link>
        
        <h2 className="text-3xl font-bold text-primary mb-2">Adoption Application</h2>
        <p className="text-gray-600 mb-6">You are applying to adopt <strong className="text-secondary text-lg">{pet.name}</strong>.</p>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Why would you be a good fit for {pet.name}?</label>
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              required 
              rows="4" 
              placeholder="Tell the rescuer a little bit about yourself and why you want to adopt this pet..."
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"
            ></textarea>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Living Situation</label>
              <select 
                value={livingSituation} 
                onChange={(e) => setLivingSituation(e.target.value)} 
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"
              >
                <option value="House with yard">House with yard</option>
                <option value="House without yard">House without yard</option>
                <option value="Apartment/Condo">Apartment / Condo</option>
              </select>
            </div>
            
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-semibold mb-2">Do you have other pets?</label>
              <select 
                value={hasOtherPets} 
                onChange={(e) => setHasOtherPets(e.target.value)} 
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary"
              >
                <option value="No">No</option>
                <option value="Yes - Dogs">Yes - Dogs</option>
                <option value="Yes - Cats">Yes - Cats</option>
                <option value="Yes - Other">Yes - Other</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border text-sm text-gray-600">
            <strong>Note:</strong> By submitting this request, your contact information (Email, Name, and Phone Number) will be shared with the rescuer so they can reach out to you.
          </div>
          
          <button 
            disabled={submitting} 
            type="submit" 
            className="w-full bg-secondary text-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition disabled:opacity-50 mt-6 shadow-sm"
          >
            {submitting ? 'Sending Application...' : 'Submit Adoption Request'}
          </button>
        </form>
      </div>
    </div>
  );
}