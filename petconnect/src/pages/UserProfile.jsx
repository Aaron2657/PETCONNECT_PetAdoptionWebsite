import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // NEW: Added useNavigate
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore'; 
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function UserProfile() {
  const { id } = useParams(); 
  const { currentUser } = useAuth(); 
  const navigate = useNavigate(); // NEW: Initialize navigate
  
  const [userProfile, setUserProfile] = useState({ displayName: 'Rescuer', bio: '', profilePicUrl: '', isBanned: false });
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdmin, setIsAdmin] = useState(false); 

  useEffect(() => {
    const fetchUserAndPets = async () => {
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
        }

        const petsQuery = query(collection(db, 'pets'), where('rescuerId', '==', id));
        const petsSnap = await getDocs(petsQuery);
        
        const allPets = petsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const availablePets = allPets.filter(pet => !pet.status || pet.status === 'Available');
        
        if (!userDoc.exists() && allPets.length > 0) {
           setUserProfile({ displayName: allPets[0].rescuerName || 'Anonymous Rescuer', bio: '', profilePicUrl: '', isBanned: false });
        }

        setPets(availablePets);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPets();
  }, [id, currentUser]);

  const handleReportUser = async () => {
    const reason = window.prompt("Why are you reporting this user? (e.g., Fake account, inappropriate behavior)");
    if (!reason) return; 

    try {
      await addDoc(collection(db, 'reports'), {
        reportedUserId: id,
        reportedUserName: userProfile.displayName || 'Anonymous Rescuer', 
        reporterId: currentUser ? currentUser.uid : 'Anonymous', 
        reason: reason,
        status: 'Pending',
        createdAt: new Date()
      });
      alert("Report submitted successfully. Our admins will review it.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit report.");
    }
  };

  const handleBanUser = async () => {
    const confirmBan = window.confirm(`Are you sure you want to instantly ban ${userProfile.displayName || 'this user'}?`);
    if (!confirmBan) return;

    try {
      await updateDoc(doc(db, 'users', id), { isBanned: true });
      setUserProfile(prev => ({ ...prev, isBanned: true }));
      alert("User has been banned successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to ban user.");
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl text-primary font-semibold">Loading profile...</div>;

  // NEW: Completely block access for guests!
  if (!currentUser) {
    return (
      <div className="text-center mt-20 px-4">
        <h2 className="text-2xl text-primary font-bold">Please log in to view user profiles.</h2>
        <p className="text-gray-600 mt-2">We keep our rescuers' profiles secure for registered users only.</p>
        <button 
          onClick={() => navigate('/login')} 
          className="mt-6 bg-secondary text-primary px-8 py-3 rounded-md font-bold hover:bg-opacity-90 transition shadow-sm"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-10 mb-10 px-4">
      
      <div className={`bg-white rounded-lg shadow-md p-8 mb-8 border-t-4 text-center max-w-3xl mx-auto flex flex-col items-center ${userProfile.isBanned ? 'border-red-600' : 'border-secondary'}`}>
        
        {userProfile.isBanned && (
          <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md font-bold mb-6 flex items-center justify-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span>THIS ACCOUNT HAS BEEN BANNED FOR VIOLATING PLATFORM POLICIES.</span>
          </div>
        )}

        {userProfile.profilePicUrl ? (
           <img src={userProfile.profilePicUrl} alt={userProfile.displayName || 'Rescuer'} className={`w-24 h-24 rounded-full object-cover mb-4 border-4 shadow-sm ${userProfile.isBanned ? 'border-red-600 opacity-50 grayscale' : 'border-primary'}`} />
        ) : (
           <div className={`w-24 h-24 text-white rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-inner uppercase border-4 border-transparent ${userProfile.isBanned ? 'bg-red-800 opacity-50' : 'bg-primary'}`}>
             {userProfile.displayName ? userProfile.displayName.charAt(0) : '?'}
           </div>
        )}
        
        <h2 className={`text-3xl font-bold ${userProfile.isBanned ? 'text-red-700 line-through' : 'text-primary'}`}>
          {userProfile.displayName || 'Anonymous Rescuer'}
        </h2>
        
        {userProfile.bio ? (
           <p className="text-gray-700 mt-4 max-w-lg italic">"{userProfile.bio}"</p>
        ) : (
           <p className="text-gray-500 mt-2 font-medium">Dedicated PetConnect Rescuer</p>
        )}

        {currentUser && currentUser.uid === id && (
          <Link 
            to="/edit-profile" 
            className="mt-6 bg-secondary text-primary font-bold py-2 px-8 rounded hover:bg-opacity-90 transition shadow-sm"
          >
            Edit Profile
          </Link>
        )}

        {!userProfile.isBanned && (!currentUser || currentUser.uid !== id) && (
          isAdmin ? (
            <button 
              onClick={handleBanUser}
              className="mt-4 bg-red-600 text-white font-bold py-2 px-6 rounded-md shadow-sm hover:bg-red-700 transition"
            >
              Ban User
            </button>
          ) : (
            <button 
              onClick={handleReportUser}
              className="mt-4 text-xs text-red-500 font-bold hover:underline"
            >
              Flag / Report User
            </button>
          )
        )}
      </div>

      <h3 className="text-2xl font-bold text-primary mb-6 border-b-2 border-secondary pb-2 max-w-7xl mx-auto">
        Pets Up For Adoption
      </h3>

      {userProfile.isBanned ? (
         <div className="bg-red-50 p-8 rounded-lg shadow-sm max-w-7xl mx-auto text-center border border-red-200">
           <p className="text-red-600 font-bold text-lg">
             Pets posted by banned accounts are no longer visible.
           </p>
         </div>
      ) : pets.length === 0 ? (
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