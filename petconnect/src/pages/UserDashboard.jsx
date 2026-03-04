import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'; 
import { db } from '../config/firebase';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  const { currentUser } = useAuth();
  
  const [myPets, setMyPets] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: State to track which dashboard sections are open/closed
  const [expandedSections, setExpandedSections] = useState({
    pets: true,     // Default to open so they see their pets immediately
    received: false,
    sent: false
  });

  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      try {
        const petsQuery = query(collection(db, 'pets'), where('rescuerId', '==', currentUser.uid));
        const petsSnap = await getDocs(petsQuery);
        setMyPets(petsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const receivedQuery = query(collection(db, 'adoptionRequests'), where('rescuerId', '==', currentUser.uid));
        const receivedSnap = await getDocs(receivedQuery);
        setReceivedRequests(receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const sentQuery = query(collection(db, 'adoptionRequests'), where('adopterId', '==', currentUser.uid));
        const sentSnap = await getDocs(sentQuery);
        
        const sentRequestsWithRescuerInfo = await Promise.all(sentSnap.docs.map(async (requestDoc) => {
          const reqData = { id: requestDoc.id, ...requestDoc.data() };
          
          if (reqData.status === 'Approved') {
            const rescuerDoc = await getDoc(doc(db, 'users', reqData.rescuerId));
            if (rescuerDoc.exists()) {
              reqData.rescuerEmail = rescuerDoc.data().email;
              reqData.rescuerPhone = rescuerDoc.data().phone || rescuerDoc.data().phoneNumber || 'Not provided';
            }
          }
          return reqData;
        }));

        setSentRequests(sentRequestsWithRescuerInfo);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  // NEW: Helper function to toggle individual sections
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, 'adoptionRequests', requestId);
      await updateDoc(requestRef, { status: newStatus });
      setReceivedRequests(prevRequests =>
        prevRequests.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
      );
    } catch (error) {
      console.error("Error updating application status:", error);
      alert("Failed to update the application. Please try again.");
    }
  };

  const handleUpdatePetStatus = async (petId, newStatus) => {
    try {
      const petRef = doc(db, 'pets', petId);
      await updateDoc(petRef, { status: newStatus });
      
      setMyPets(prevPets => 
        prevPets.map(pet => pet.id === petId ? { ...pet, status: newStatus } : pet)
      );
    } catch (error) {
      console.error("Error updating pet status:", error);
      alert("Failed to update pet status.");
    }
  };

  const handleDeletePet = async (petId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this pet? This action cannot be undone.");
    if (!confirmDelete) return; 

    try {
      await deleteDoc(doc(db, 'pets', petId));
      setMyPets(prevPets => prevPets.filter(pet => pet.id !== petId));
    } catch (error) {
      console.error("Error deleting pet:", error);
      alert("Failed to delete the pet. Please try again.");
    }
  };

  if (!currentUser) return <div className="text-center mt-20 text-xl font-bold text-primary">Please log in to view your dashboard.</div>;
  if (loading) return <div className="text-center mt-20 text-xl text-primary font-semibold">Loading your dashboard...</div>;

  return (
    <div className="container mx-auto mt-10 mb-10 px-4 max-w-5xl">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-8 border-b-2 border-secondary pb-4">
        <h2 className="text-3xl font-bold text-primary">My Dashboard</h2>
        
        <Link 
          to={`/user/${currentUser.uid}`} 
          className="bg-primary text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-opacity-90 transition shadow-sm whitespace-nowrap text-center"
        >
          View Profile
        </Link>
      </div>

      {/* Section 1: My Posted Pets */}
      <div className="mb-6">
        <button 
          onClick={() => toggleSection('pets')}
          className="w-full flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm hover:bg-gray-100 transition"
        >
          <div className="flex items-center space-x-3">
            <h3 className="text-2xl font-semibold text-primary">My Posted Pets</h3>
            <span className="bg-secondary text-primary text-xs font-bold px-2 py-1 rounded-full">{myPets.length}</span>
          </div>
          <svg className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedSections.pets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {expandedSections.pets && (
          <div className="mt-4 animate-fadeIn">
            {myPets.length === 0 ? (
              <p className="text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-gray-100">You haven't posted any pets yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPets.map(pet => (
                  <div key={pet.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-tertiary flex items-center space-x-4">
                    <img src={pet.imageUrl} alt={pet.name} className="w-24 h-24 object-cover rounded-md" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-lg text-primary">{pet.name}</h4>
                      
                      <p className="text-sm text-gray-600 mb-2">Status: 
                        <span className={`ml-1 font-bold ${
                          pet.status === 'Adopted' ? 'text-secondary' : 
                          pet.status === 'Pending' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {pet.status || 'Available'}
                        </span>
                      </p>
                      
                      <div className="flex flex-col space-y-2 mt-2">
                        <select 
                          value={pet.status || 'Available'}
                          onChange={(e) => handleUpdatePetStatus(pet.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-tertiary w-full max-w-[150px]"
                        >
                          <option value="Available">Available</option>
                          <option value="Pending">Pending</option>
                          <option value="Adopted">Adopted</option>
                        </select>
                        
                        <div className="flex items-center space-x-3 pt-2">
                          <Link to={`/pet/${pet.id}`} className="text-tertiary text-sm font-bold hover:underline leading-none">View</Link>
                          <span className="text-gray-300 leading-none">|</span>
                          <Link to={`/edit-pet/${pet.id}`} className="text-blue-500 text-sm font-bold hover:underline leading-none">Edit</Link>
                          <span className="text-gray-300 leading-none">|</span>
                          <button 
                            onClick={() => handleDeletePet(pet.id)} 
                            className="text-red-500 text-sm font-bold hover:underline leading-none"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Received Applications */}
      <div className="mb-6">
        <button 
          onClick={() => toggleSection('received')}
          className="w-full flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm hover:bg-gray-100 transition"
        >
          <div className="flex items-center space-x-3">
            <h3 className="text-2xl font-semibold text-primary">Applications Received</h3>
            <span className="bg-secondary text-primary text-xs font-bold px-2 py-1 rounded-full">{receivedRequests.length}</span>
          </div>
          <svg className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedSections.received ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {expandedSections.received && (
          <div className="mt-4 animate-fadeIn">
            {receivedRequests.length === 0 ? (
              <p className="text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-gray-100">No one has applied for your pets yet.</p>
            ) : (
              <div className="space-y-4">
                {receivedRequests.map(req => (
                  <div key={req.id} className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-secondary">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-primary">Application for {req.petName}</h4>
                        <div className="mt-1 text-sm text-gray-700">
                          <p><strong>From:</strong> {req.adopterName} ({req.adopterEmail})</p>
                          <p className="mt-1"><strong>Phone:</strong> {req.adopterPhone || 'Not provided'}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide
                        ${req.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                          req.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {req.status}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded border border-gray-100 mb-4">
                      <p className="text-sm text-gray-700"><strong>Message:</strong> "{req.message}"</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:space-x-6 text-sm text-gray-600 mb-4 space-y-2 sm:space-y-0">
                      <span><strong>Living Situation:</strong> {req.livingSituation}</span>
                      <span><strong>Other Pets:</strong> {req.hasOtherPets}</span>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex space-x-3 border-t pt-4">
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'Approved')}
                          className="bg-green-500 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-600 transition shadow-sm"
                        >
                          Accept Application
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                          className="bg-red-500 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-600 transition shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Sent Applications */}
      <div className="mb-6">
        <button 
          onClick={() => toggleSection('sent')}
          className="w-full flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm hover:bg-gray-100 transition"
        >
          <div className="flex items-center space-x-3">
            <h3 className="text-2xl font-semibold text-primary">My Adoption Applications</h3>
            <span className="bg-secondary text-primary text-xs font-bold px-2 py-1 rounded-full">{sentRequests.length}</span>
          </div>
          <svg className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedSections.sent ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {expandedSections.sent && (
          <div className="mt-4 animate-fadeIn">
            {sentRequests.length === 0 ? (
              <p className="text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-gray-100">You haven't applied to adopt any pets yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sentRequests.map(req => (
                  <div key={req.id} className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-primary text-lg">Applied for: {req.petName}</h4>
                        <p className="text-sm text-gray-500 mt-1">Message: {req.message.substring(0, 60)}...</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide
                          ${req.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                            req.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                        {req.status}
                      </span>
                    </div>

                    {req.status === 'Approved' && (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4 mt-2">
                        <p className="text-sm text-green-800 font-bold mb-2">🎉 Approved! Contact the rescuer:</p>
                        <p className="text-sm text-gray-700"><strong>Email:</strong> {req.rescuerEmail}</p>
                        <p className="text-sm text-gray-700"><strong>Phone:</strong> {req.rescuerPhone}</p>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <Link to={`/pet/${req.petId}`} className="text-secondary font-bold text-sm hover:underline flex items-center">
                        View Pet Post &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}