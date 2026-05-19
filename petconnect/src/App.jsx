import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import GlobalBannedListener from './components/GlobalBannedListener';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BrowsePets from './pages/BrowsePets';
import PetDetails from './pages/PetDetails';
import PostPet from './pages/PostPet';
import EditPet from './pages/EditPet';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import UserDashboard from './pages/UserDashboard';
import AdoptionRequest from './pages/AdoptionRequest';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        
        {/* Real-time ban listener */}
        <GlobalBannedListener /> 
        
        {/* Main Layout Wrapper - Navbar is inside here to prevent gaps */}
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/browse" element={<BrowsePets />} />
              <Route path="/pet/:id" element={<PetDetails />} />
              <Route path="/post-pet" element={<PostPet />} />
              <Route path="/edit-pet/:id" element={<EditPet />} />
              <Route path="/user/:id" element={<UserProfile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/adopt/:id" element={<AdoptionRequest />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </div>
        </div>
        
      </AuthProvider>
    </Router>
  );
}

export default App;