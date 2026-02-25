import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-10 space-y-6">
      <h1 className="text-4xl md:text-5xl font-bold text-primary">
        Find Your Perfect Companion
      </h1>
      <p className="text-gray-600 max-w-lg md:text-lg">
        PetConnect makes it simple and transparent to browse rescued pets, connect with rescuers, and submit adoption requests.
      </p>
      
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center mt-6">
        <Link 
          to="/browse" 
          className="bg-primary text-white w-full sm:w-auto px-6 py-3 rounded-lg shadow hover:bg-opacity-90 transition"
        >
          Browse Pets
        </Link>
        <Link 
          to="/login" 
          className="bg-tertiary text-primary w-full sm:w-auto px-6 py-3 rounded-lg shadow hover:bg-opacity-90 transition font-medium"
        >
          Post a Rescued Pet
        </Link>
      </div>
    </div>
  );
};

export default Home;