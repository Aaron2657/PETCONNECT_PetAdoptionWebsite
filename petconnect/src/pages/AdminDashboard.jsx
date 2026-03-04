import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // NEW: State to track which report cards are expanded
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    const checkAdminAndFetchReports = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
          
          const reportsQuery = await getDocs(collection(db, 'reports'));
          setReports(reportsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
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

  // NEW: Toggle function for the dropdowns
  const toggleGroup = (userId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // UPDATED: Now dismisses ALL pending reports for this specific user at once
  const handleDismissUserReports = async (reportedUserId) => {
    try {
      // Find all reports for this user that are currently pending
      const pendingReports = reports.filter(r => r.reportedUserId === reportedUserId && r.status === 'Pending');
      
      // Update them all in Firestore simultaneously
      const updatePromises = pendingReports.map(report => 
        updateDoc(doc(db, 'reports', report.id), { status: 'Dismissed' })
      );
      await Promise.all(updatePromises);

      // Update local state so the UI reflects the change instantly
      setReports(prev => prev.map(r => 
        r.reportedUserId === reportedUserId ? { ...r, status: 'Dismissed' } : r
      ));
    } catch (error) {
      console.error(error);
      alert("Failed to dismiss reports.");
    }
  };

  // UPDATED: Bans the user and updates ALL their tied reports to "User Banned"
  const handleBanUser = async (reportedUserId) => {
    const confirmBan = window.confirm("Are you sure you want to ban this user? This will lock their account and resolve all pending reports against them.");
    if (!confirmBan) return;

    try {
      // 1. Ban the actual user account
      await updateDoc(doc(db, 'users', reportedUserId), { isBanned: true });
      
      // 2. Find all their reports and update them
      const userReports = reports.filter(r => r.reportedUserId === reportedUserId);
      const updatePromises = userReports.map(report => 
        updateDoc(doc(db, 'reports', report.id), { status: 'User Banned' })
      );
      await Promise.all(updatePromises);
      
      // 3. Update local state
      setReports(prev => prev.map(r => 
        r.reportedUserId === reportedUserId ? { ...r, status: 'User Banned' } : r
      ));
      
      alert("User has been banned successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to ban user. Make sure their user profile exists in the database.");
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-bold text-primary">Loading Admin Panel...</div>;
  if (!isAdmin) return null; 

  // NEW: Group the raw reports array by the Reported User's ID
  const groupedReports = Object.values(reports.reduce((acc, report) => {
    if (!acc[report.reportedUserId]) {
      acc[report.reportedUserId] = {
        reportedUserId: report.reportedUserId,
        reportedUserName: report.reportedUserName,
        reportsList: [],
        groupStatus: 'Dismissed' // Default, will be overridden if any are pending
      };
    }
    
    acc[report.reportedUserId].reportsList.push(report);
    
    // If even a single report in this group is Pending, the whole group needs Admin attention
    if (report.status === 'Pending') {
      acc[report.reportedUserId].groupStatus = 'Pending';
    } else if (report.status === 'User Banned') {
      acc[report.reportedUserId].groupStatus = 'User Banned';
    }
    
    return acc;
  }, {}));

  return (
    <div className="container mx-auto mt-10 mb-10 px-4 max-w-6xl">
      <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-3xl font-bold text-red-800">Admin Control Panel</h2>
        <p className="text-red-600 font-medium">Review user reports and manage platform safety.</p>
      </div>

      <h3 className="text-2xl font-bold text-primary mb-4 border-b-2 border-secondary pb-2">Grouped User Reports</h3>
      
      {groupedReports.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow-sm">No reports to review at this time.</p>
      ) : (
        <div className="space-y-6">
          {groupedReports.map(group => (
            <div key={group.reportedUserId} className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-yellow-500">
              
              {/* Group Header - Always visible */}
              <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide
                      ${group.groupStatus === 'Pending' ? 'bg-yellow-200 text-yellow-800' : 
                        group.groupStatus === 'Dismissed' ? 'bg-gray-200 text-gray-800' : 'bg-red-200 text-red-800'}`}>
                      {group.groupStatus}
                    </span>
                    <span className="bg-tertiary text-primary text-xs font-bold px-3 py-1 rounded-full">
                      {group.reportsList.length} {group.reportsList.length === 1 ? 'Report' : 'Reports'}
                    </span>
                  </div>
                  
                  <p className="text-xl text-primary font-bold">
                    <Link to={`/user/${group.reportedUserId}`} className="hover:text-secondary transition hover:underline">
                      {group.reportedUserName}
                    </Link>
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
                  <button 
                    onClick={() => toggleGroup(group.reportedUserId)} 
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-100 transition flex items-center justify-center space-x-2"
                  >
                    <span>{expandedGroups[group.reportedUserId] ? 'Hide Details' : 'View Details'}</span>
                    <svg className={`w-4 h-4 transition-transform ${expandedGroups[group.reportedUserId] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  
                  {group.groupStatus === 'Pending' && (
                    <>
                      <button onClick={() => handleDismissUserReports(group.reportedUserId)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-300 transition">
                        Dismiss All
                      </button>
                      <button onClick={() => handleBanUser(group.reportedUserId)} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition shadow-sm">
                        Ban User
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Group Body - Dropdown expanded view */}
              {expandedGroups[group.reportedUserId] && (
                <div className="p-6 border-t border-gray-100 bg-white">
                  <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Individual Complaints</h4>
                  <div className="space-y-4">
                    {group.reportsList.map((report, index) => (
                      <div key={report.id} className="bg-gray-50 p-4 rounded border border-gray-100 flex flex-col md:flex-row gap-4 items-start">
                        <div className="bg-primary text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-gray-800 mb-1"><strong>Reason:</strong> "{report.reason}"</p>
                          <p className="text-xs text-gray-500">Reported by ID: {report.reporterId}</p>
                          <p className="text-xs text-gray-400 mt-1">Status: {report.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}