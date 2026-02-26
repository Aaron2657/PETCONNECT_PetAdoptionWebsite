import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; // Added query tools
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function PetDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth(); 
  
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // NEW STATE: Keeps track of whether this user is approved
  const [isApprovedAdopter, setIsApprovedAdopter] = useState(false);

  useEffect(() => {
    const fetchPetAndStatus = async () => {
      try {
        // 1. Fetch the Pet's data
        const docRef = doc(db, 'pets', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPet({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Pet not found! They may have been removed.");
          setLoading(false);
          return; // Stop running if there's no pet
        }

        // 2. Check if the current user has an APPROVED application for this pet
        if (currentUser) {
          const statusQuery = query(
            collection(db, 'adoptionRequests'),
            where('petId', '==', id),
            where('adopterId', '==', currentUser.uid),
            where('status', '==', 'Approved')
          );
          const statusSnap = await getDocs(statusQuery);
          
          // If the query finds a match, they are approved!
          if (!statusSnap.empty) {
            setIsApprovedAdopter(true);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load pet details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPetAndStatus();
  }, [id, currentUser]);

  if (loading) return <div className="text-center mt-20 text-xl text-primary font-semibold">Loading pet details...</div>;
  if (error) return <div className="text-center mt-20 text-red-500 text-xl font-semibold">{error}</div>;
  if (!pet) return null;

  return (
    <div className="container mx-auto mt-10 mb-10 px-4 max-w-5xl">
      <Link to="/browse" className="text-secondary font-bold hover:underline mb-6 inline-block">
        &larr; Back to Browse
      </Link>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border-t-4 border-primary flex flex-col md:flex-row">
        
        <div className="md:w-1/2">
          <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover min-h-[300px] md:min-h-[500px]" />
        </div>
        
        <div className="p-8 md:w-1/2 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-4xl font-bold text-primary">{pet.name}</h2>
            <span className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full border border-green-200">
              {pet.status || 'Available'}
            </span>
          </div>
          
          <div className="text-gray-600 mb-6 flex space-x-6 border-b pb-4">
            <span className="bg-gray-100 px-3 py-1 rounded"><strong>Species:</strong> {pet.species}</span>
            <span className="bg-gray-100 px-3 py-1 rounded"><strong>Age:</strong> {pet.age}</span>
          </div>
          
          <h3 className="text-2xl font-semibold text-primary mb-2">About Me</h3>
          <p className="text-gray-700 whitespace-pre-line flex-grow mb-8">
            {pet.description}
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
            <h4 className="font-bold text-primary mb-2">Rescuer Information</h4>
            <p className="text-sm text-gray-700 mb-1"><strong>Posted By:</strong> {pet.rescuerName || 'Anonymous'}</p>
            <p className="text-sm text-gray-700 flex items-center space-x-2 mt-1 overflow-hidden">
              <strong>Contact:</strong> 
              {/* UPDATED LOGIC: Show email if they are the rescuer OR if they are an approved adopter! */}
              {currentUser && (currentUser.uid === pet.rescuerId || isApprovedAdopter) ? (
                <span className="truncate">{pet.rescuerEmail}</span>
              ) : (
                <span className="italic text-gray-500 bg-gray-200 px-2 py-1 rounded text-[11px] sm:text-xs border border-gray-300 whitespace-nowrap truncate">
                  Hidden until approved
                </span>
              )}
            </p>
          </div>
          
          {/* UPDATED LOGIC: Change the bottom button if they are approved */}
          {isApprovedAdopter ? (
             <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mt-auto text-center font-bold">
               🎉 You are approved to adopt {pet.name}! Please contact the rescuer to finalize.
             </div>
          ) : (
            <Link 
              to={`/adopt/${pet.id}`} 
              className="block text-center w-full bg-secondary text-primary font-bold text-lg py-3 rounded hover:bg-opacity-90 transition mt-auto shadow-sm"
            >
              Submit Adoption Request
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}