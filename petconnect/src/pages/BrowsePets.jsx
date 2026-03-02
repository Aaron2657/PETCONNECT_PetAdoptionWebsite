import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext'; // NEW: Import useAuth

export default function BrowsePets() {
  const { currentUser } = useAuth(); // NEW: Grab the currently logged-in user
  
  const [pets, setPets] = useState([]);
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [searchMode, setSearchMode] = useState('Pets'); 
  const [filterSpecies, setFilterSpecies] = useState('All');
  const [searchTerm, setSearchTerm] = useState(''); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const usersSnap = await getDocs(usersQuery);
        
        const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);

        const bannedUserIds = usersList.filter(user => user.isBanned).map(user => user.id);

        const petsQuery = query(collection(db, 'pets'), orderBy('createdAt', 'desc'));
        const petsSnap = await getDocs(petsQuery);
        
        const petsList = petsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(pet => pet.status !== 'Adopted' && !bannedUserIds.includes(pet.rescuerId)); 
        
        setPets(petsList);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); 
      }
    };

    fetchData();
  }, []);

  const getRescuerName = (user) => {
    if (user.displayName) return user.displayName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return 'Anonymous Rescuer';
  };

  if (loading) {
    return <div className="text-center mt-20 text-xl text-primary font-semibold">Loading directory...</div>;
  }

  const filteredPets = pets.filter(pet => {
    const matchesSpecies = filterSpecies === 'All' || pet.species === filterSpecies;
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSpecies && matchesSearch;
  });

  // UPDATED: Filter out Admins and the Current User!
  const filteredUsers = users.filter(user => {
    const name = getRescuerName(user);
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 1. Ensure the user is not an admin
    const isNotAdmin = user.role !== 'admin';
    
    // 2. Ensure the user is not the person currently looking at the screen
    const isNotSelf = currentUser ? user.id !== currentUser.uid : true;

    return matchesSearch && isNotAdmin && isNotSelf;
  });

  return (
    <div className="container mx-auto mt-10 mb-10 px-4">
      <h2 className="text-3xl font-bold text-center text-primary mb-8">
        {searchMode === 'Pets' ? 'Browse Rescued Pets' : 'Find Rescuers'}
      </h2>
      
      <div className="flex justify-center mb-8">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 bg-white px-6 py-4 rounded-lg shadow-sm border-t-2 border-secondary w-full max-w-4xl">
          
          <div className="flex items-center space-x-2 w-full md:w-auto">
             <label className="font-bold text-gray-700 whitespace-nowrap">Look for:</label>
             <select 
               value={searchMode}
               onChange={(e) => {
                 setSearchMode(e.target.value);
                 setSearchTerm(''); 
               }}
               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary block p-2 font-medium w-full"
             >
               <option value="Pets">Pets</option>
               <option value="Rescuers">Rescuers</option>
             </select>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-1/2 flex-grow">
            <label className="font-bold text-gray-700">Search:</label>
            <input 
              type="text" 
              placeholder={searchMode === 'Pets' ? "Search by pet name..." : "Search by rescuer name..."} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-tertiary block p-2 w-full"
            />
          </div>

          {searchMode === 'Pets' && (
            <div className="flex items-center space-x-2 w-full md:w-auto">
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
          )}

        </div>
      </div>

      {searchMode === 'Pets' ? (
        filteredPets.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-gray-500 text-lg mb-2">No pets found matching your search.</p>
            <button onClick={() => { setSearchTerm(''); setFilterSpecies('All'); }} className="text-secondary font-bold hover:underline">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPets.map((pet) => (
              <div key={pet.id} className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-secondary flex flex-col relative">
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-md uppercase tracking-wide ${pet.status === 'Pending' ? 'bg-yellow-400 text-yellow-900' : 'bg-green-400 text-green-900'}`}>
                  {pet.status || 'Available'}
                </div>
                <img src={pet.imageUrl} alt={pet.name} className="w-full h-48 object-cover" />
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-primary mb-1">{pet.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{pet.species} • {pet.age}</p>
                  <p className="text-gray-700 text-sm line-clamp-2 mb-4 flex-grow">{pet.description}</p>
                  <Link to={`/pet/${pet.id}`} className="block text-center w-full bg-tertiary text-primary font-bold py-2 px-4 rounded hover:bg-opacity-90 transition mt-auto">View Details</Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredUsers.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-gray-500 text-lg mb-2">No rescuers found matching your search.</p>
            <button onClick={() => setSearchTerm('')} className="text-secondary font-bold hover:underline">Clear Search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-primary flex flex-col items-center p-6 text-center relative">
                
                {user.isBanned && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide shadow-sm">
                    Banned
                  </div>
                )}

                {user.profilePicUrl ? (
                   <img src={user.profilePicUrl} alt={getRescuerName(user)} className={`w-24 h-24 rounded-full object-cover mb-4 border-4 shadow-sm ${user.isBanned ? 'border-red-500 opacity-60' : 'border-primary'}`} />
                ) : (
                   <div className={`w-24 h-24 text-primary rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-inner uppercase border-4 border-transparent ${user.isBanned ? 'bg-red-100 opacity-60' : 'bg-tertiary'}`}>
                     {getRescuerName(user).charAt(0)}
                   </div>
                )}
                
                <h3 className={`text-xl font-bold mb-1 ${user.isBanned ? 'text-red-600' : 'text-primary'}`}>
                  {getRescuerName(user)}
                </h3>
                
                <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow italic">
                  "{user.bio || 'Dedicated PetConnect Rescuer'}"
                </p>
                
                <Link to={`/user/${user.id}`} className="block text-center w-full bg-secondary text-primary font-bold py-2 px-4 rounded hover:bg-opacity-90 transition mt-auto">
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}