import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function PetDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth(); 
  
  const [pet, setPet] = useState(null);
  const [rescuerPhone, setRescuerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApprovedAdopter, setIsApprovedAdopter] = useState(false);

  // NEW: State to track which image in the carousel is currently being viewed
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchPetAndStatus = async () => {
      try {
        const docRef = doc(db, 'pets', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const petData = { id: docSnap.id, ...docSnap.data() };
          setPet(petData);

          const rescuerDoc = await getDoc(doc(db, 'users', petData.rescuerId));
          if (rescuerDoc.exists()) {
            setRescuerPhone(rescuerDoc.data().phone || rescuerDoc.data().phoneNumber || 'Not provided');
          }
        } else {
          setError("Pet not found! They may have been removed.");
          setLoading(false);
          return; 
        }

        if (currentUser) {
          const statusQuery = query(
            collection(db, 'adoptionRequests'),
            where('petId', '==', id),
            where('adopterId', '==', currentUser.uid),
            where('status', '==', 'Approved')
          );
          const statusSnap = await getDocs(statusQuery);
          
          if (!statusSnap.empty) {
            setIsApprovedAdopter(true);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load pet details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPetAndStatus();
  }, [id, currentUser]);

  if (loading) return <div className="text-center mt-20 text-xl text-primary font-semibold">Loading pet details...</div>;
  if (error) return <div className="text-center mt-20 text-red-500 text-xl font-semibold">{error}</div>;
  if (!pet) return null;

  // NEW: Determine our image array. If 'imageUrls' doesn't exist (older posts), fall back to putting the single 'imageUrl' in an array.
  const petImages = pet.imageUrls && pet.imageUrls.length > 0 ? pet.imageUrls : [pet.imageUrl];

  // Carousel controls
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % petImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + petImages.length) % petImages.length);
  };

  return (
    <div className="container mx-auto mt-10 mb-10 px-4 max-w-5xl">
      <Link to="/browse" className="text-secondary font-bold hover:underline mb-6 inline-block">
        &larr; Back to Browse
      </Link>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border-t-4 border-primary flex flex-col md:flex-row">
        
        {/* UPDATED: Image Carousel Section */}
        <div className="md:w-1/2 relative bg-gray-100 min-h-[300px] md:min-h-[500px] flex items-center justify-center overflow-hidden">
          <img 
            src={petImages[currentImageIndex]} 
            alt={`${pet.name} - Photo ${currentImageIndex + 1}`} 
            className="w-full h-full object-cover absolute inset-0 transition-opacity duration-300" 
          />
          
          {/* Only render arrows and dots if there is more than 1 image */}
          {petImages.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition shadow-md"
              >
                &#10094;
              </button>
              
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition shadow-md"
              >
                &#10095;
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {petImages.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2.5 h-2.5 rounded-full transition-colors shadow-sm ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="p-8 md:w-1/2 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-4xl font-bold text-primary">{pet.name}</h2>
            <span className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full border border-green-200">
              {pet.status || 'Available'}
            </span>
          </div>
          
          <div className="text-gray-600 mb-6 flex space-x-6 border-b pb-4">
            <span className="bg-gray-100 px-3 py-1 rounded"><strong>Species:</strong> {pet.species}</span>
            <span className="bg-gray-100 px-3 py-1 rounded"><strong>Age:</strong> {pet.age}</span>
          </div>
          
          <h3 className="text-2xl font-semibold text-primary mb-2">About Me</h3>
          <p className="text-gray-700 whitespace-pre-line flex-grow mb-8">
            {pet.description}
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
            <h4 className="font-bold text-primary mb-3 border-b border-blue-200 pb-2">Rescuer Information</h4>
            <p className="text-sm text-gray-700 mb-3">
                <strong>Posted By:</strong>{' '}
                <Link to={`/user/${pet.rescuerId}`} className="text-secondary font-bold hover:underline">
                  {pet.rescuerName || 'Anonymous'}
                </Link>
            </p>

            <div className="space-y-2">
              <p className="text-sm text-gray-700 flex items-center space-x-2 overflow-hidden">
                <strong>Email:</strong> 
                {currentUser && (currentUser.uid === pet.rescuerId || isApprovedAdopter) ? (
                  <span className="truncate">{pet.rescuerEmail}</span>
                ) : (
                  <span className="italic text-gray-500 bg-gray-200 px-2 py-1 rounded text-[11px] sm:text-xs border border-gray-300 whitespace-nowrap truncate">
                    Hidden until approved
                  </span>
                )}
              </p>
              
              <p className="text-sm text-gray-700 flex items-center space-x-2 overflow-hidden">
                <strong>Phone:</strong> 
                {currentUser && (currentUser.uid === pet.rescuerId || isApprovedAdopter) ? (
                  <span className="truncate">{rescuerPhone}</span>
                ) : (
                  <span className="italic text-gray-500 bg-gray-200 px-2 py-1 rounded text-[11px] sm:text-xs border border-gray-300 whitespace-nowrap truncate">
                    Hidden until approved
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {isApprovedAdopter ? (
             <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mt-auto text-center font-bold">
               🎉 You are approved to adopt {pet.name}! Please contact the rescuer to finalize.
             </div>
          ) : (
            <Link 
              to={`/adopt/${pet.id}`} 
              className="block text-center w-full bg-secondary text-primary font-bold text-lg py-3 rounded hover:bg-opacity-90 transition mt-auto shadow-sm"
            >
              Submit Adoption Request
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}