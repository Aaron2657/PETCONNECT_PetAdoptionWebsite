import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function UserProfile() {
  const { id } = useParams(); 
  const { currentUser } = useAuth(); 
  const navigate = useNavigate();
  
  const [userProfile, setUserProfile] = useState({ firstName: '', lastName: '', bio: '', profilePicUrl: '', isBanned: false });
  const [postedPets, setPostedPets] = useState([]);
  const [adoptedPets, setAdoptedPets] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('posted');
  const [isAdmin, setIsAdmin] = useState(false); 

  useEffect(() => {
    const fetchUserAndHistory = async () => {
      try {
        if (currentUser) {
          const viewerDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (viewerDoc.exists() && viewerDoc.data().role === 'admin') {
            setIsAdmin(true);
          }
        }

        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          setLoading(false);
          return;
        }

        const postedQuery = query(collection(db, 'pets'), where('rescuerId', '==', id));
        const postedSnap = await getDocs(postedQuery);
        setPostedPets(postedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const adoptedReqQuery = query(collection(db, 'adoptionRequests'), where('adopterId', '==', id), where('status', '==', 'Approved'));
        const adoptedReqSnap = await getDocs(adoptedReqQuery);
        
        const adoptedPetsList = [];
        for (const request of adoptedReqSnap.docs) {
          const petRef = doc(db, 'pets', request.data().petId);
          const petSnap = await getDoc(petRef);
          if (petSnap.exists()) {
            adoptedPetsList.push({ id: petSnap.id, ...petSnap.data() });
          }
        }
        setAdoptedPets(adoptedPetsList);

      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndHistory();
  }, [id, currentUser]);

  const getDisplayName = () => {
    if (userProfile.firstName || userProfile.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return 'PetConnect User';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-secondary rounded-full mb-4"></div>
          <p className="text-lg text-primary font-bold tracking-widest uppercase">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* 1. Consistent Header Banner */}
      <div className={`h-48 md:h-64 w-full relative ${userProfile.isBanned ? 'bg-red-700' : 'bg-primary'}`}>
        {userProfile.isBanned && (
          <div className="absolute top-0 w-full bg-red-900 bg-opacity-90 text-white text-center py-2 font-bold uppercase tracking-widest text-xs z-10">
            This account has been banned
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10">
        
        {/* 2. Profile Details Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 flex flex-col items-center text-center border-t-4 border-secondary">
          
          {/* Overlapping Profile Picture */}
          <div className="-mt-20 md:-mt-28 mb-4">
            {userProfile.profilePicUrl ? (
              <img 
                src={userProfile.profilePicUrl} 
                alt={getDisplayName()} 
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 bg-white shadow-md ${userProfile.isBanned ? 'border-red-500 opacity-70' : 'border-white'}`} 
              />
            ) : (
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-5xl md:text-6xl font-bold border-4 bg-white shadow-md ${userProfile.isBanned ? 'border-red-500 text-red-700 opacity-70' : 'border-white text-primary bg-tertiary'}`}>
                {getDisplayName().charAt(0)}
              </div>
            )}
          </div>
          
          {/* User Details */}
          <h1 className={`text-3xl md:text-4xl font-extrabold mb-3 ${userProfile.isBanned ? 'text-red-600' : 'text-primary'}`}>
            {getDisplayName()}
          </h1>
          
          <p className="text-gray-600 max-w-2xl text-base md:text-lg italic mb-6">
            "{userProfile.bio || 'Dedicated PetConnect Member'}"
          </p>
          
          {/* Contact & Actions Container */}
          {(isAdmin || (currentUser && currentUser.uid === id)) && (
            <div className="flex flex-col items-center gap-4 w-full">
               
               {/* Contact Badges using Theme Colors */}
               <div className="flex flex-wrap justify-center gap-3">
                 <span className="bg-tertiary bg-opacity-30 text-primary px-4 py-1.5 rounded-full text-sm font-bold">
                   📞 {userProfile.phone || 'No phone'}
                 </span>
                 <span className="bg-tertiary bg-opacity-30 text-primary px-4 py-1.5 rounded-full text-sm font-bold">
                   ✉️ {userProfile.email}
                 </span>
               </div>

               {/* Edit Button using Theme Colors */}
               {currentUser && currentUser.uid === id && (
                 <Link 
                   to="/edit-profile" 
                   className="mt-2 bg-secondary text-primary font-bold py-2.5 px-8 rounded hover:bg-opacity-90 transition shadow-sm"
                 >
                   Edit Profile
                 </Link>
               )}
            </div>
          )}

          {/* 3. Underline Tabs */}
          <div className="flex w-full justify-center mt-10 border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('posted')}
              className={`px-6 py-4 font-bold text-sm md:text-base transition-colors border-b-4 -mb-px ${activeTab === 'posted' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              Pets Posted <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{postedPets.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('adopted')}
              className={`px-6 py-4 font-bold text-sm md:text-base transition-colors border-b-4 -mb-px ${activeTab === 'adopted' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              Adoption History <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{adoptedPets.length}</span>
            </button>
          </div>
        </div>

        {/* Tab Content Areas */}
        <div className="mt-8">
          {activeTab === 'posted' && (
            <div>
              {postedPets.length === 0 ? (
                <div className="py-12 text-center bg-transparent">
                  <p className="text-gray-500 text-lg">No pets posted for adoption yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {postedPets.map((pet) => (
                    <PetCard key={pet.id} pet={pet} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'adopted' && (
            <div>
              {adoptedPets.length === 0 ? (
                <div className="py-12 text-center bg-transparent">
                  <p className="text-gray-500 text-lg">No recorded adoption history yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adoptedPets.map((pet) => (
                    <PetCard key={pet.id} pet={pet} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// 4. RESTORED: Exactly matching your PetCard CSS from the screenshot!
function PetCard({ pet }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-secondary flex flex-col relative">
      
      {/* Restored Status Badge */}
      <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-md uppercase tracking-wide bg-green-400 text-green-900 z-10">
        {pet.status || 'Available'}
      </div>

      <img 
        src={pet.imageUrls && pet.imageUrls.length > 0 ? pet.imageUrls[0] : pet.imageUrl} 
        alt={pet.name} 
        className="w-full h-48 object-cover" 
      />
      
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-primary mb-1">{pet.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{pet.species} • {pet.age}</p>
        <p className="text-gray-700 text-sm line-clamp-2 mb-4 flex-grow">{pet.description}</p>
        
        {/* Restored Button CSS */}
        <Link 
          to={`/pet/${pet.id}`} 
          className="block text-center w-full bg-secondary text-primary font-bold py-2 px-4 rounded hover:bg-opacity-90 transition"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}