import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore'; 
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

  // Modal & Popup States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showBanPopup, setShowBanPopup] = useState(false); // NEW: State for the Admin Ban Popup

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

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setIsSubmittingReport(true);
    try {
      await addDoc(collection(db, 'reports'), {
        reportedUserId: id,
        reporterId: currentUser.uid,
        reason: reportReason,
        status: 'active',
        createdAt: serverTimestamp()
      });
      alert('Report submitted successfully. Our admin team will review this shortly.');
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      console.error("Error submitting report:", error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // NEW: Admin Direct Ban Function
  const handleAdminBanUser = async () => {
    if (window.confirm(`Are you sure you want to ban ${getDisplayName()}? They will lose all platform access.`)) {
      try {
        await updateDoc(doc(db, 'users', id), { isBanned: true });
        
        // Instantly update the UI to show the red banner
        setUserProfile(prev => ({ ...prev, isBanned: true }));
        
        // Show the sleek popup
        setShowBanPopup(true);
        
        // Hide the popup after 4 seconds
        setTimeout(() => {
          setShowBanPopup(false);
        }, 4000);

      } catch (error) {
        console.error("Error banning user:", error);
        alert('Failed to ban user.');
      }
    }
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
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* Header Banner */}
      <div className={`h-48 md:h-64 w-full relative transition-colors duration-500 ${userProfile.isBanned ? 'bg-red-700' : 'bg-primary'}`}>
        {userProfile.isBanned && (
          <div className="absolute top-0 w-full bg-red-900 bg-opacity-90 text-white text-center py-2 font-bold uppercase tracking-widest text-xs z-10 animate-fade-in">
            This account has been banned
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10">
        
        {/* Profile Details Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 flex flex-col items-center text-center border-t-4 border-secondary relative">
          
          {/* Action Button (Top Right) - Smart Toggle between Report and Ban */}
          {currentUser && currentUser.uid !== id && !userProfile.isBanned && (
            <div className="absolute top-4 right-4">
              {isAdmin ? (
                // ADMIN VIEW: Ban Button
                <button 
                  onClick={handleAdminBanUser}
                  className="text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm font-bold flex items-center gap-2 shadow-sm"
                  title="Ban this user immediately"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Ban User</span>
                </button>
              ) : (
                // STANDARD USER VIEW: Report Button
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors text-sm font-bold flex items-center gap-1"
                  title="Report this user"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Report</span>
                </button>
              )}
            </div>
          )}

          {/* Overlapping Profile Picture */}
          <div className="-mt-20 md:-mt-28 mb-4">
            {userProfile.profilePicUrl ? (
              <img 
                src={userProfile.profilePicUrl} 
                alt={getDisplayName()} 
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 bg-white shadow-md transition-colors duration-500 ${userProfile.isBanned ? 'border-red-500 opacity-70 grayscale' : 'border-white'}`} 
              />
            ) : (
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-5xl md:text-6xl font-bold border-4 bg-white shadow-md transition-colors duration-500 ${userProfile.isBanned ? 'border-red-500 text-red-700 opacity-70' : 'border-white text-primary bg-tertiary'}`}>
                {getDisplayName().charAt(0)}
              </div>
            )}
          </div>
          
          {/* User Details */}
          <h1 className={`text-3xl md:text-4xl font-extrabold mb-3 transition-colors duration-500 ${userProfile.isBanned ? 'text-red-600' : 'text-primary'}`}>
            {getDisplayName()}
          </h1>
          
          <p className="text-gray-600 max-w-2xl text-base md:text-lg italic mb-6">
            "{userProfile.bio || 'Dedicated PetConnect Member'}"
          </p>
          
          {/* Contact & Actions Container */}
          {(isAdmin || (currentUser && currentUser.uid === id)) && (
            <div className="flex flex-col items-center gap-4 w-full">
               <div className="flex flex-wrap justify-center gap-3">
                 <span className="bg-tertiary bg-opacity-30 text-primary px-4 py-1.5 rounded-full text-sm font-bold">
                   📞 {userProfile.phone || 'No phone'}
                 </span>
                 <span className="bg-tertiary bg-opacity-30 text-primary px-4 py-1.5 rounded-full text-sm font-bold">
                   ✉️ {userProfile.email}
                 </span>
               </div>

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

          {/* Underline Tabs */}
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

      {/* Report Modal Overlay */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Report User</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Please provide a detailed reason for reporting <span className="font-bold">{getDisplayName()}</span>. False reports may result in account suspension.
            </p>
            <form onSubmit={handleReportSubmit}>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 resize-none"
                rows="4"
                placeholder="E.g., Requesting payment outside the platform, fake pet listings, abusive behavior..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
              ></textarea>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded transition"
                  disabled={isSubmittingReport}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition disabled:opacity-50"
                  disabled={isSubmittingReport}
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Admin Ban Success Popup (Toast Notification) */}
      {showBanPopup && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 z-50 transition-all duration-300 animate-bounce">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="font-bold text-sm tracking-wide">
            {getDisplayName()} has been permanently banned.
          </span>
        </div>
      )}
    </div>
  );
}

function PetCard({ pet }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-secondary flex flex-col relative">
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