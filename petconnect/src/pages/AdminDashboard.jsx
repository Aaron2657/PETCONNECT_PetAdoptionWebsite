import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAndFetchReports = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        // 1. Verify this user if it is an admin
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
          
          // 2. Fetch all reports
          const reportsQuery = await getDocs(collection(db, 'reports'));
          setReports(reportsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          // Kick them out if they aren't an admin
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchReports();
  }, [currentUser, navigate]);

  const handleDismissReport = async (reportId) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'Dismissed' });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'Dismissed' } : r));
    } catch (error) {
      alert("Failed to dismiss report.");
    }
  };

  const handleBanUser = async (reportedUserId, reportId) => {
    const confirmBan = window.confirm("Are you sure you want to ban this user?");
    if (!confirmBan) return;

    try {
      // 1. Mark the user as banned in the users collection
      await updateDoc(doc(db, 'users', reportedUserId), { isBanned: true });
      
      // 2. Mark the report as resolved
      await updateDoc(doc(db, 'reports', reportId), { status: 'User Banned' });
      
      // 3. Update UI
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'User Banned' } : r));
      alert("User has been banned successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to ban user. Make sure their user profile exists in the database.");
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-bold text-primary">Loading Admin Panel...</div>;
  if (!isAdmin) return null; 

  return (
    <div className="container mx-auto mt-10 mb-10 px-4 max-w-6xl">
      <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-3xl font-bold text-red-800">Admin Control Panel</h2>
        <p className="text-red-600 font-medium">Review user reports and manage platform safety.</p>
      </div>

      <h3 className="text-2xl font-bold text-primary mb-4 border-b-2 border-secondary pb-2">User Reports</h3>
      
      {reports.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow-sm">No reports to review at this time.</p>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-500 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-4 md:mb-0">
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-2 inline-block
                  ${report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                    report.status === 'Dismissed' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                  {report.status}
                </span>
                <p className="text-lg text-primary"><strong>Reported User:</strong> {report.reportedUserName}</p>
                <p className="text-gray-600"><strong>Reason:</strong> {report.reason}</p>
                <p className="text-xs text-gray-400 mt-2">Reported by ID: {report.reporterId}</p>
              </div>
              
              {report.status === 'Pending' && (
                <div className="flex space-x-3">
                  <button onClick={() => handleDismissReport(report.id)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-300 transition">
                    Dismiss
                  </button>
                  <button onClick={() => handleBanUser(report.reportedUserId, report.id)} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition">
                    Ban User
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}