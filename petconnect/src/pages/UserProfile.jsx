import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; // Added doc, getDoc
import { db } from '../config/firebase';

export default function UserProfile() {
  const { id } = useParams(); 
  
  // New extended user state
  const [userProfile, setUserProfile] = useState({ displayName: 'Rescuer', bio: '', profilePicUrl: '' });
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndPets = async () => {
      try {
        // 1. Fetch the user's custom profile from the 'users' collection
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }

        // 2. Fetch their available pets
        const petsQuery = query(collection(db, 'pets'), where('rescuerId', '==', id));
        const petsSnap = await getDocs(petsQuery);
        
        const allPets = petsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const availablePets = allPets.filter(pet => !pet.status || pet.status === 'Available');
        
        // If they don't have a custom profile yet, try to grab the name from their first pet as a fallback
        if (!userDoc.exists() && allPets.length > 0) {
           setUserProfile({ displayName: allPets[0].rescuerName || 'Anonymous Rescuer', bio: '', profilePicUrl: '' });
        }

        setPets(availablePets);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPets();
  }, [id]);

  if (loading) return <div className="text-center mt-20 text-xl text-primary font-semibold">Loading profile...</div>;

  return (
    <div className="container mx-auto mt-10 mb-10 px-4">
      
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8 border-t-4 border-secondary text-center max-w-3xl mx-auto flex flex-col items-center">
        
        {/* Render custom picture OR fallback to initials */}
        {userProfile.profilePicUrl ? (
           <img src={userProfile.profilePicUrl} alt={userProfile.displayName} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary shadow-sm" />
        ) : (
           <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-inner uppercase border-4 border-transparent">
             {userProfile.displayName.charAt(0)}
           </div>
        )}
        
        <h2 className="text-3xl font-bold text-primary">{userProfile.displayName}</h2>
        
        {/* Show their bio if they wrote one! */}
        {userProfile.bio ? (
           <p className="text-gray-700 mt-4 max-w-lg italic">"{userProfile.bio}"</p>
        ) : (
           <p className="text-gray-500 mt-2 font-medium">Dedicated PetConnect Rescuer</p>
        )}
      </div>

      <h3 className="text-2xl font-bold text-primary mb-6 border-b-2 border-secondary pb-2 max-w-7xl mx-auto">
        Pets Up For Adoption
      </h3>

      {pets.length === 0 ? (
        <p className="text-center text-gray-500 text-lg bg-white p-8 rounded-lg shadow-sm max-w-7xl mx-auto">
          This rescuer doesn't have any pets currently available for adoption. Check back later!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-secondary flex flex-col relative">
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-md uppercase tracking-wide bg-green-400 text-green-900">
                {pet.status || 'Available'}
              </div>

              <img src={pet.imageUrl} alt={pet.name} className="w-full h-48 object-cover" />
              
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-primary mb-1">{pet.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{pet.species} • {pet.age}</p>
                <p className="text-gray-700 text-sm line-clamp-2 mb-4 flex-grow">{pet.description}</p>
                <Link to={`/pet/${pet.id}`} className="block text-center w-full bg-tertiary text-primary font-bold py-2 px-4 rounded hover:bg-opacity-90 transition mt-auto">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}