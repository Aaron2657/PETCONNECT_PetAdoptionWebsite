import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  const { currentUser } = useAuth();
  
  const [myPets, setMyPets] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setSentRequests(sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  // Handle Application Status (Accept/Reject)
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

  // NEW FUNCTION: Handle Pet Status (Available/Pending/Adopted)
  const handleUpdatePetStatus = async (petId, newStatus) => {
    try {
      const petRef = doc(db, 'pets', petId);
      await updateDoc(petRef, { status: newStatus });
      
      // Update the screen instantly
      setMyPets(prevPets => 
        prevPets.map(pet => pet.id === petId ? { ...pet, status: newStatus } : pet)
      );
    } catch (error) {
      console.error("Error updating pet status:", error);
      alert("Failed to update pet status.");
    }
  };

  if (!currentUser) return <div className="text-center mt-20 text-xl font-bold text-primary">Please log in to view your dashboard.</div>;
  if (loading) return <div className="text-center mt-20 text-xl text-primary font-semibold">Loading your command center...</div>;

  return (
    <div className="container mx-auto mt-10 mb-10 px-4 max-w-5xl">
      <h2 className="text-3xl font-bold text-primary mb-8 border-b-2 border-secondary pb-4">My Dashboard</h2>

      {/* Section 1: My Posted Pets */}
      <div className="mb-12">
        <h3 className="text-2xl font-semibold text-primary mb-4">My Posted Pets</h3>
        {myPets.length === 0 ? (
          <p className="text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-gray-100">You haven't posted any pets yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPets.map(pet => (
              <div key={pet.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-tertiary flex items-center space-x-4">
                <img src={pet.imageUrl} alt={pet.name} className="w-24 h-24 object-cover rounded-md" />
                <div className="flex-grow">
                  <h4 className="font-bold text-lg text-primary">{pet.name}</h4>
                  
                  {/* NEW LOGIC: Dynamic Status Color */}
                  <p className="text-sm text-gray-600 mb-2">Status: 
                    <span className={`ml-1 font-bold ${
                      pet.status === 'Adopted' ? 'text-secondary' : 
                      pet.status === 'Pending' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {pet.status || 'Available'}
                    </span>
                  </p>
                  
                  {/* NEW DROPDOWN: Change Pet Status */}
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
                    
                    <Link to={`/pet/${pet.id}`} className="text-tertiary text-sm font-bold hover:underline">View Public Profile</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Received Applications */}
      <div className="mb-12">
        <h3 className="text-2xl font-semibold text-primary mb-4">Applications Received</h3>
        {receivedRequests.length === 0 ? (
          <p className="text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-gray-100">No one has applied for your pets yet.</p>
        ) : (
          <div className="space-y-4">
            {receivedRequests.map(req => (
              <div key={req.id} className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-secondary">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-primary">Application for {req.petName}</h4>
                    <p className="text-sm text-gray-600"><strong>From:</strong> {req.adopterName} ({req.adopterEmail})</p>
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
                <div className="flex space-x-6 text-sm text-gray-600 mb-4">
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

      {/* Section 3: Sent Applications */}
      <div>
        <h3 className="text-2xl font-semibold text-primary mb-4">My Adoption Applications</h3>
        {sentRequests.length === 0 ? (
          <p className="text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-gray-100">You haven't applied to adopt any pets yet.</p>
        ) : (
          <div className="space-y-4">
            {sentRequests.map(req => (
              <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-primary flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-primary">Applied for: {req.petName}</h4>
                  <p className="text-sm text-gray-500">Message: {req.message.substring(0, 60)}...</p>
                </div>
                 <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide
                    ${req.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                      req.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {req.status}
                  </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}