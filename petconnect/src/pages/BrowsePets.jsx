import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function BrowsePets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for our filters
  const [filterSpecies, setFilterSpecies] = useState('All');
  const [searchTerm, setSearchTerm] = useState(''); // NEW: Search bar state

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const petsQuery = query(collection(db, 'pets'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(petsQuery);
        
        const petsList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(pet => pet.status !== 'Adopted'); 
        
        setPets(petsList);
      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false); 
      }
    };

    fetchPets();
  }, []);

  if (loading) {
    return <div className="text-center mt-20 text-xl text-primary font-semibold">Loading furry friends...</div>;
  }

  // UPDATED LOGIC: Filter by BOTH species and search term
  const filteredPets = pets.filter(pet => {
    // 1. Check if it matches the dropdown
    const matchesSpecies = filterSpecies === 'All' || pet.species === filterSpecies;
    
    // 2. Check if the pet's name includes the typed text (ignoring uppercase/lowercase)
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 3. Only keep the pet if it passes BOTH tests!
    return matchesSpecies && matchesSearch;
  });

  return (
    <div className="container mx-auto mt-10 mb-10 px-4">
      <h2 className="text-3xl font-bold text-center text-primary mb-8">Browse Rescued Pets</h2>
      
      {/* UPDATED UI: The Search & Filter Control Bar */}
      <div className="flex justify-center mb-8">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-white px-6 py-4 rounded-lg shadow-sm border-t-2 border-secondary w-full max-w-3xl">
          
          {/* Search Bar */}
          <div className="flex items-center space-x-2 w-full sm:w-1/2">
            <label className="font-bold text-gray-700">Search:</label>
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary block p-2 w-full"
            />
          </div>

          {/* Species Dropdown */}
          <div className="flex items-center space-x-2 w-full sm:w-1/2">
             <label className="font-bold text-gray-700 whitespace-nowrap">Species:</label>
             <select 
               value={filterSpecies}
               onChange={(e) => setFilterSpecies(e.target.value)}
               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary block p-2 font-medium w-full"
             >
               <option value="All">All Pets</option>
               <option value="Dog">Dogs</option>
               <option value="Cat">Cats</option>
               <option value="Other">Others</option>
             </select>
          </div>

        </div>
      </div>

      {filteredPets.length === 0 ? (
        <div className="text-center mt-10">
          <p className="text-gray-500 text-lg mb-2">
            No pets found matching your search.
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setFilterSpecies('All'); }}
            className="text-secondary font-bold hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-secondary flex flex-col relative">
              
              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-md uppercase tracking-wide
                ${pet.status === 'Pending' ? 'bg-yellow-400 text-yellow-900' : 'bg-green-400 text-green-900'}`}>
                {pet.status || 'Available'}
              </div>

              <img 
                src={pet.imageUrl} 
                alt={pet.name} 
                className="w-full h-48 object-cover"
              />
              
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-primary mb-1">{pet.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{pet.species} • {pet.age}</p>
                
                <p className="text-gray-700 text-sm line-clamp-2 mb-4 flex-grow">
                  {pet.description}
                </p>
                
                <Link 
                  to={`/pet/${pet.id}`} 
                  className="block text-center w-full bg-tertiary text-primary font-bold py-2 px-4 rounded hover:bg-opacity-90 transition mt-auto"
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