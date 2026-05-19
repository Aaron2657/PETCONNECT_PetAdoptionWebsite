import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext'; 

export default function BrowsePets() {
  const { currentUser } = useAuth(); 
  
  const [pets, setPets] = useState([]);
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [searchMode, setSearchMode] = useState('Pets'); 
  const [filterSpecies, setFilterSpecies] = useState('All');
  const [searchTerm, setSearchTerm] = useState(''); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Users & Identify Banned Users
        const usersQuery = query(collection(db, 'users'));
        const usersSnap = await getDocs(usersQuery);
        
        const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
        const bannedUserIds = usersList.filter(user => user.isBanned).map(user => user.id);

        let hiddenPetIds = new Set();

        // 2. RULE A: Hide pets this specific user has applied for (Even if Rejected)
        if (currentUser) {
          const myApplicationsQuery = query(
            collection(db, 'adoptionRequests'),
            where('adopterId', '==', currentUser.uid)
          );
          const myApplicationsSnap = await getDocs(myApplicationsQuery);
          myApplicationsSnap.forEach(doc => {
            hiddenPetIds.add(doc.data().petId);
          });
        }

        // 3. RULE B: Hide pets that are currently "Under Review" for EVERYONE (Pending or Approved)
        const activeApplicationsQuery = query(
          collection(db, 'adoptionRequests'),
          where('status', 'in', ['Pending', 'Approved'])
        );
        const activeApplicationsSnap = await getDocs(activeApplicationsQuery);
        
        activeApplicationsSnap.forEach(doc => {
          hiddenPetIds.add(doc.data().petId);
        });

        // 4. Fetch all pets
        const petsQuery = query(collection(db, 'pets'), orderBy('createdAt', 'desc'));
        const petsSnap = await getDocs(petsQuery);
        
        // 5. Filter the list before setting it to state
        const petsList = petsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(pet => !bannedUserIds.includes(pet.rescuerId)) // Hides banned users' pets
          .filter(pet => !hiddenPetIds.has(pet.id)); // Hides actively reviewed pets AND previously applied pets

        setPets(petsList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const getRescuerName = (user) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.displayName || 'PetConnect Member';
  };

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pet.species.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'All' || pet.species === filterSpecies;
    return matchesSearch && matchesSpecies;
  });

  const filteredUsers = users.filter(user => {
    const name = getRescuerName(user).toLowerCase();
    // Hide admins from the public browse page
    return name.includes(searchTerm.toLowerCase()) && user.role !== 'admin';
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-secondary rounded-full mb-4"></div>
          <p className="text-lg text-primary font-bold tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      
      {/* Header & Search Controls */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 leading-tight">
          Find Your New Best Friend
        </h1>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto mb-8 px-2">
          Browse our gallery of rescued animals waiting for a loving home, or connect directly with our dedicated community of rescuers.
        </p>

        {/* Mobile-Optimized Search Bar & Filters */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 max-w-3xl mx-auto w-full">
          <input 
            type="text" 
            placeholder={`Search ${searchMode.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-2/3 px-6 py-3.5 border border-gray-300 rounded-xl md:rounded-full focus:outline-none focus:ring-2 focus:ring-secondary shadow-sm text-base md:text-lg"
          />
          
          {searchMode === 'Pets' && (
            <select 
              value={filterSpecies} 
              onChange={(e) => setFilterSpecies(e.target.value)}
              className="w-full md:w-1/3 px-6 py-3.5 border border-gray-300 rounded-xl md:rounded-full focus:outline-none focus:ring-2 focus:ring-secondary shadow-sm text-base md:text-lg bg-white"
            >
              <option value="All">All Species</option>
              <option value="Dog">Dogs</option>
              <option value="Cat">Cats</option>
              <option value="Bird">Birds</option>
              <option value="Other">Other</option>
            </select>
          )}
        </div>

        {/* Mobile-Optimized Toggle Mode Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6">
          <button 
            onClick={() => setSearchMode('Pets')}
            className={`w-full sm:w-auto px-8 py-3 sm:py-2.5 rounded-xl sm:rounded-full font-bold transition shadow-sm text-base ${searchMode === 'Pets' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Browse Pets
          </button>
          <button 
            onClick={() => setSearchMode('Rescuers')}
            className={`w-full sm:w-auto px-8 py-3 sm:py-2.5 rounded-xl sm:rounded-full font-bold transition shadow-sm text-base ${searchMode === 'Rescuers' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Browse Rescuers
          </button>
        </div>
      </div>

      {/* Grid Display Area */}
      {searchMode === 'Pets' ? (
        <>
          {filteredPets.length === 0 ? (
            <div className="text-center py-16 md:py-20 bg-gray-50 rounded-2xl border border-gray-100 mx-2">
              <span className="text-4xl md:text-5xl mb-4 block">🔍</span>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">No pets found</h3>
              <p className="text-gray-500 text-sm md:text-base">Try adjusting your search filters or check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredPets.map(pet => (
                <div key={pet.id} className="bg-white rounded-2xl shadow-md overflow-hidden border-t-4 border-secondary flex flex-col relative transition-transform hover:-translate-y-1 hover:shadow-xl">
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-md uppercase tracking-wide bg-green-400 text-green-900 z-10">
                    {pet.status || 'Available'}
                  </div>
                  <img 
                    src={pet.imageUrls && pet.imageUrls.length > 0 ? pet.imageUrls[0] : pet.imageUrl} 
                    alt={pet.name} 
                    className="w-full h-48 md:h-56 object-cover" 
                  />
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-xl md:text-2xl font-extrabold text-primary mb-1">{pet.name}</h3>
                    <p className="text-gray-500 text-sm font-medium mb-3">{pet.species} • {pet.age}</p>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-5 flex-grow">{pet.description}</p>
                    <Link 
                      to={`/pet/${pet.id}`} 
                      className="block text-center w-full bg-secondary text-primary font-bold py-3 px-4 rounded-xl hover:bg-opacity-90 transition shadow-sm"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 md:py-20 bg-gray-50 rounded-2xl border border-gray-100 mx-2">
              <span className="text-4xl md:text-5xl mb-4 block">👥</span>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">No rescuers found</h3>
              <p className="text-gray-500 text-sm md:text-base">Try searching for a different name.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-white rounded-2xl shadow-md overflow-hidden border-t-4 border-primary flex flex-col items-center p-6 text-center relative transition-transform hover:-translate-y-1 hover:shadow-xl">
                  
                  {user.isBanned && (
                    <div className="absolute top-3 left-3 bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wide shadow-sm">
                      Banned
                    </div>
                  )}

                  {user.profilePicUrl ? (
                     <img 
                      src={user.profilePicUrl} 
                      alt={getRescuerName(user)} 
                      className={`w-20 h-20 md:w-24 md:h-24 rounded-full object-cover mb-4 border-4 shadow-sm ${user.isBanned ? 'border-red-500 opacity-60 grayscale' : 'border-primary'}`} 
                    />
                  ) : (
                     <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold mb-4 shadow-inner uppercase border-4 border-transparent ${user.isBanned ? 'bg-red-100 text-red-700 opacity-60' : 'bg-tertiary text-primary'}`}>
                       {getRescuerName(user).charAt(0)}
                     </div>
                  )}
                  
                  <h3 className={`text-lg md:text-xl font-bold mb-1 ${user.isBanned ? 'text-red-600' : 'text-primary'}`}>
                    {getRescuerName(user)}
                  </h3>
                  
                  <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow italic px-2">
                    "{user.bio || 'Dedicated PetConnect Rescuer'}"
                  </p>
                  
                  <Link 
                    to={`/user/${user.id}`} 
                    className="block text-center w-full bg-gray-100 text-gray-800 font-bold py-2.5 px-4 rounded-xl hover:bg-gray-200 transition shadow-sm mt-auto"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}