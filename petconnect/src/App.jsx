import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PostPet from './pages/PostPet';
import BrowsePets from './pages/BrowsePets';
import PetDetails from './pages/PetDetails';
import AdoptionRequest from './pages/AdoptionRequest';
import UserDashboard from './pages/UserDashboard';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import EditPet from './pages/EditPet';
import AdminDashboard from './pages/AdminDashboard'; // Add this import at the top

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-grow p-4 md:p-8">
            <Routes>
              <Route path="/user/:id" element={<UserProfile />} />
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/post-pet" element={<PostPet />} />
              <Route path="/browse" element={<BrowsePets />} /> 
              <Route path="/pet/:id" element={<PetDetails />} />
              <Route path="/adopt/:id" element={<AdoptionRequest />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/edit-pet/:id" element={<EditPet />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;