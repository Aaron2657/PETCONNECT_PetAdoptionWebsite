import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Link } from 'react-router-dom';

export default function BrowsePets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect runs automatically when the page loads to fetch our data
  useEffect(() => {
    const fetchPets = async () => {
      try {
        // Ask Firebase for the pets, ordered by the newest ones first
        const petsQuery = query(collection(db, 'pets'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(petsQuery);
        
        // Loop through the results and put them into an array
        const petsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPets(petsList);
      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false); // Stop the loading spinner once we have the data
      }
    };

    fetchPets();
  }, []);

  // Show a loading message while Firebase is grabbing the data
  if (loading) {
    return <div className="text-center mt-20 text-xl text-primary font-semibold">Loading furry friends...</div>;
  }

  return (
    <div className="container mx-auto mt-10 mb-10">
      <h2 className="text-3xl font-bold text-center text-primary mb-8">Browse Rescued Pets</h2>
      
      {/* If there are no pets, show a friendly message */}
      {pets.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No pets have been posted yet. Be the first!</p>
      ) : (
        /* The Grid Layout for our Pet Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-secondary flex flex-col">
              {/* Pet Image */}
              <img 
                src={pet.imageUrl} 
                alt={pet.name} 
                className="w-full h-48 object-cover"
              />
              
              {/* Pet Details */}
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-primary mb-1">{pet.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{pet.species} • {pet.age}</p>
                
                {/* line-clamp-2 cuts off the description if it's too long! */}
                <p className="text-gray-700 text-sm line-clamp-2 mb-4 flex-grow">
                  {pet.description}
                </p>
                
                <Link 
                    to={`/pet/${pet.id}`} 
                    className="block w-full text-center bg-tertiary text-primary font-bold py-2 px-4 rounded hover:bg-opacity-90 transition mt-auto"
                    >
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