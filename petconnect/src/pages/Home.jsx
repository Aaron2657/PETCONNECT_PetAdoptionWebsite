import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen -mt-4 md:-mt-8">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between mt-10 md:mt-20 mb-16 px-4 md:px-8 max-w-7xl mx-auto w-full gap-10">
        
        {/* Left Side: Text and Buttons */}
        <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-primary leading-tight">
            Give a Rescued Pet <br/><span className="text-secondary">Forever Home</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-lg">
            PetConnect makes it simple and transparent to browse rescued pets, connect with compassionate rescuers, and submit adoption applications all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto pt-4">
            <Link 
              to="/browse" 
              className="bg-primary text-white px-8 py-4 rounded-lg shadow-lg hover:bg-opacity-90 transition font-bold text-lg text-center"
            >
              Start Adopting Today
            </Link>
            <Link 
              to="/post-pet" 
              className="bg-tertiary text-primary px-8 py-4 rounded-lg shadow-lg hover:bg-opacity-90 transition font-bold text-lg text-center"
            >
              Post a Pet for Adoption
            </Link>
          </div>
        </div>

        {/* Right Side: Hero Image */}
        <div className="md:w-1/2 w-full">
          <img 
            // Using a high-quality free Unsplash image as a placeholder!
            src="https://res.cloudinary.com/drvxsajim/image/upload/v1772611132/image-400x400_c65djc.png" 
            alt="Image of young Chloe" 
            className="rounded-2xl shadow-2xl object-cover w-full h-[400px] lg:h-[500px] border-4 border-white"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-16 px-4 md:px-8 border-t border-gray-100 flex-grow">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-12">How PetConnect Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-inner">1</div>
              <h3 className="text-xl font-bold text-primary mb-2">Browse Pets</h3>
              <p className="text-gray-600 text-sm">Explore our gallery of rescued dogs, cats, and other animals looking for a loving home.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 bg-tertiary text-primary rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-inner">2</div>
              <h3 className="text-xl font-bold text-primary mb-2">Apply to Adopt</h3>
              <p className="text-gray-600 text-sm">Found your perfect match? Submit a quick adoption request directly to the rescuer.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-inner">3</div>
              <h3 className="text-xl font-bold text-primary mb-2">Bring Them Home</h3>
              <p className="text-gray-600 text-sm">Once approved, work with the rescuer to finalize details and welcome your new best friend!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}