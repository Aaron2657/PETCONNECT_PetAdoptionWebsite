import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'; 
import { db } from '../config/firebase';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  const { currentUser } = useAuth();
  
  const [myPets, setMyPets] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // State to track which dashboard sections are open/closed
  const [expandedSections, setExpandedSections] = useState({
    pets: true,     // Default to open so they see their pets immediately
    received: false,
    sent: false
  });

  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch Pets posted by the user
        const petsQuery = query(collection(db, 'pets'), where('rescuerId', '==', currentUser.uid));
        const petsSnap = await getDocs(petsQuery);
        setMyPets(petsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Requests received by the user (Rescuer view)
        const receivedQuery = query(collection(db, 'adoptionRequests'), where('rescuerId', '==', currentUser.uid));
        const receivedSnap = await getDocs(receivedQuery);
        setReceivedRequests(receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Requests sent by the user (Adopter view)
        const sentQuery = query(collection(db, 'adoptionRequests'), where('adopterId', '==', currentUser.uid));
        const sentSnap = await getDocs(sentQuery);
        setSentRequests(sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDeletePet = async (petId) => {
    if (window.confirm('Are you sure you want to delete this pet posting? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'pets', petId));
        setMyPets(myPets.filter(pet => pet.id !== petId));
      } catch (error) {
        console.error("Error deleting pet:", error);
        alert("Failed to delete pet.");
      }
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    if (window.confirm(`Are you sure you want to mark this application as ${newStatus}?`)) {
      try {
        await updateDoc(doc(db, 'adoptionRequests', requestId), {
          status: newStatus
        });
        
        // Update local UI state
        setReceivedRequests(receivedRequests.map(req => 
          req.id === requestId ? { ...req, status: newStatus } : req
        ));

      } catch (error) {
        console.error("Error updating request status:", error);
        alert("Failed to update status.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-secondary rounded-full mb-4"></div>
          <p className="text-lg text-primary font-bold tracking-widest uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-10 mb-20 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8 border-b-2 border-secondary pb-4">
        <h2 className="text-3xl font-bold text-primary">My Dashboard</h2>
      </div>

      <div className="space-y-6">
        
        {/* Section 1: My Posted Pets */}
        <div className="mb-6">
          <button 
            onClick={() => toggleSection('pets')}
            className="w-full flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm hover:bg-gray-100 transition"
          >
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-semibold text-primary">My Posted Pets</h3>
              <span className="bg-secondary text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center justify-center min-w-[24px] h-6">
                {myPets.length}
              </span>
            </div>
            <svg className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedSections.pets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          
          {expandedSections.pets && (
            <div className="mt-6 animate-fadeIn">
              {myPets.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500">
                  <p>You haven't posted any pets for adoption yet.</p>
                  <Link to="/post-pet" className="inline-block mt-4 text-secondary font-bold hover:underline">Post a Pet Now &rarr;</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {myPets.map(pet => (
                    <div key={pet.id} className="bg-white rounded-2xl shadow-md overflow-hidden border-t-4 border-secondary flex flex-col relative transition-transform hover:-translate-y-1 hover:shadow-xl">
                      
                      {/* Read-Only Status Badge replacing the old dropdown */}
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-md uppercase tracking-wide bg-green-400 text-green-900 z-10">
                        {pet.status || 'Available'}
                      </div>

                      <img 
                        src={pet.imageUrls && pet.imageUrls.length > 0 ? pet.imageUrls[0] : pet.imageUrl} 
                        alt={pet.name} 
                        className="w-full h-48 object-cover" 
                      />
                      
                      <div className="p-5 flex-grow flex flex-col">
                        <h4 className="text-xl font-extrabold text-primary mb-1">{pet.name}</h4>
                        <p className="text-sm text-gray-500 font-medium mb-4">{pet.species} • {pet.age}</p>
                        
                        <div className="mt-auto flex space-x-2 border-t border-gray-100 pt-4">
                          <Link to={`/edit-pet/${pet.id}`} className="flex-1 bg-gray-100 text-gray-800 text-center py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition shadow-sm">
                            Edit Pet
                          </Link>
                          <button onClick={() => handleDeletePet(pet.id)} className="flex-1 bg-red-50 text-red-600 text-center py-2.5 rounded-xl font-bold text-sm hover:bg-red-100 transition shadow-sm border border-red-100">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Received Adoption Applications (For Rescuers) */}
        <div className="mb-6">
          <button 
            onClick={() => toggleSection('received')}
            className="w-full flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm hover:bg-gray-100 transition"
          >
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-semibold text-primary">Applications Received</h3>
              <span className="bg-tertiary text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center justify-center min-w-[24px] h-6">
                {receivedRequests.length}
              </span>
            </div>
            <svg className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedSections.received ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          
          {expandedSections.received && (
            <div className="mt-6 animate-fadeIn">
              {receivedRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-4 bg-white rounded-lg shadow-sm border border-gray-100">No one has applied for your pets yet.</p>
              ) : (
                <div className="space-y-4">
                  {receivedRequests.map(req => (
                    <div key={req.id} className="bg-white border-l-4 border-secondary p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-transform hover:-translate-y-1 hover:shadow-md">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-xl font-bold text-primary">Application for: <Link to={`/pet/${req.petId}`} className="text-secondary hover:underline">{req.petName}</Link></h4>
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded shadow-sm uppercase tracking-wider
                            ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                              req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                              'bg-yellow-100 text-yellow-700'}`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1.5 bg-gray-50 p-4 rounded-md border border-gray-100">
                          <p><strong className="text-gray-800">Applicant:</strong> <Link to={`/user/${req.adopterId}`} className="text-blue-500 hover:underline font-semibold">{req.adopterName}</Link></p>
                          <p><strong className="text-gray-800">Email:</strong> {req.adopterEmail}</p>
                          <p><strong className="text-gray-800">Phone:</strong> {req.adopterPhone}</p>
                          <p><strong className="text-gray-800">Living Situation:</strong> {req.livingSituation}</p>
                          <p><strong className="text-gray-800">Other Pets:</strong> {req.hasOtherPets}</p>
                        </div>
                        <div className="mt-4 bg-blue-50 p-4 rounded-md text-sm italic text-gray-700 border border-blue-100">
                          "{req.message}"
                        </div>
                      </div>
                      
                      {/* Action Buttons for Rescuer */}
                      {req.status === 'Pending' && (
                        <div className="flex flex-row md:flex-col gap-3 w-full md:w-36">
                          <button onClick={() => handleUpdateRequestStatus(req.id, 'Approved')} className="flex-1 bg-green-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-600 transition text-sm text-center shadow-sm">
                            Approve
                          </button>
                          <button onClick={() => handleUpdateRequestStatus(req.id, 'Rejected')} className="flex-1 bg-red-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-600 transition text-sm text-center shadow-sm">
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

        {/* Section 3: My Sent Applications (For Adopters) */}
        <div className="mb-6">
          <button 
            onClick={() => toggleSection('sent')}
            className="w-full flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm hover:bg-gray-100 transition"
          >
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-semibold text-primary">My Submitted Applications</h3>
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full flex items-center justify-center min-w-[24px] h-6">
                {sentRequests.length}
              </span>
            </div>
            <svg className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedSections.sent ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          
          {expandedSections.sent && (
            <div className="mt-6 animate-fadeIn">
              {sentRequests.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500">
                  <p>You haven't submitted any adoption applications yet.</p>
                  <Link to="/browse" className="inline-block mt-4 text-primary font-bold hover:underline">Find a Pet to Adopt &rarr;</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sentRequests.map(req => (
                    <div key={req.id} className="bg-white border-t-4 border-primary rounded-2xl shadow-md p-6 flex flex-col h-full hover:-translate-y-1 hover:shadow-xl transition-transform">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Application For</p>
                          <h4 className="text-xl font-extrabold text-primary">{req.petName}</h4>
                          <p className="text-sm text-gray-500 mt-2 italic">"{req.message.substring(0, 60)}..."</p>
                        </div>
                        <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded shadow-sm uppercase tracking-wide
                            ${req.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                              req.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                          {req.status}
                        </span>
                      </div>

                      {req.status === 'Approved' && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-4 mt-2 flex-grow shadow-sm">
                          <p className="text-sm text-green-800 font-extrabold mb-3">🎉 Approved! Contact the rescuer:</p>
                          <p className="text-sm text-gray-800 mb-1"><strong>Name:</strong> {req.rescuerName}</p>
                          <p className="text-sm text-gray-800 mb-1"><strong>Email:</strong> {req.rescuerEmail}</p>
                          <p className="text-sm text-gray-800"><strong>Phone:</strong> {req.rescuerPhone}</p>
                        </div>
                      )}

                      <div className="mt-auto pt-5 border-t border-gray-100">
                        <Link to={`/pet/${req.petId}`} className="block text-center w-full bg-gray-100 text-gray-800 font-bold py-2.5 px-4 rounded-xl hover:bg-gray-200 transition shadow-sm">
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
    </div>
  );
}