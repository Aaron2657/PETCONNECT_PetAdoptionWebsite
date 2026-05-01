import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Split state into Active and History
  const [activeReports, setActiveReports] = useState([]);
  const [historyReports, setHistoryReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // State to track which accordions are open
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Tab State
  const [currentTab, setCurrentTab] = useState('active');

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
          const reportsData = reportsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const grouped = {};
          
          for (const report of reportsData) {
            if (!grouped[report.reportedUserId]) {
              const reportedUserDoc = await getDoc(doc(db, 'users', report.reportedUserId));
              const userData = reportedUserDoc.exists() ? reportedUserDoc.data() : null;
              
              let userName = 'Unknown User';
              let isBanned = false;

              if (userData) {
                isBanned = userData.isBanned || false;
                if (userData.firstName || userData.lastName) {
                  userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                }
              }

              grouped[report.reportedUserId] = {
                reportedUserId: report.reportedUserId,
                reportedUserName: userName,
                isBanned: isBanned,
                reportsList: []
              };
            }
            grouped[report.reportedUserId].reportsList.push(report);
          }

          const active = [];
          const history = [];

          Object.values(grouped).forEach(group => {
            const hasActiveReports = group.reportsList.some(r => r.status === 'active' || !r.status);
            
            if (group.isBanned) {
              group.resolutionStatus = 'Banned';
              history.push(group);
            } else if (!hasActiveReports && group.reportsList.length > 0) {
              group.resolutionStatus = 'Dismissed';
              history.push(group);
            } else {
              group.resolutionStatus = 'Pending';
              active.push(group);
            }
          });

          setActiveReports(active);
          setHistoryReports(history);
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

  const toggleGroup = (userId) => {
    setExpandedGroups(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleBanUser = async (userId, reportsList) => {
    if (window.confirm('Are you sure you want to ban this user? They will lose access to the platform.')) {
      try {
        await updateDoc(doc(db, 'users', userId), { isBanned: true });
        
        const batch = writeBatch(db);
        reportsList.forEach(report => {
          const reportRef = doc(db, 'reports', report.id);
          batch.update(reportRef, { status: 'dismissed' });
        });
        await batch.commit();
        
        const groupToMove = activeReports.find(g => g.reportedUserId === userId);
        if (groupToMove) {
          groupToMove.isBanned = true;
          groupToMove.resolutionStatus = 'Banned';
          groupToMove.reportsList.forEach(r => r.status = 'dismissed');
          setActiveReports(prev => prev.filter(g => g.reportedUserId !== userId));
          setHistoryReports(prev => [groupToMove, ...prev]);
        }
        
        alert('User has been permanently banned.');
      } catch (error) {
        console.error("Error banning user:", error);
        alert('Failed to ban user.');
      }
    }
  };

  const handleDismissAll = async (userId, reportsList) => {
    if (window.confirm('Are you sure you want to dismiss all reports for this user?')) {
      try {
        const batch = writeBatch(db);
        reportsList.forEach(report => {
          const reportRef = doc(db, 'reports', report.id);
          batch.update(reportRef, { status: 'dismissed' });
        });
        await batch.commit();

        const groupToMove = activeReports.find(g => g.reportedUserId === userId);
        if (groupToMove) {
          groupToMove.resolutionStatus = 'Dismissed';
          groupToMove.reportsList.forEach(r => r.status = 'dismissed');
          setActiveReports(prev => prev.filter(g => g.reportedUserId !== userId));
          setHistoryReports(prev => [groupToMove, ...prev]);
        }
      } catch (error) {
        console.error("Error dismissing reports:", error);
        alert('Failed to dismiss reports.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-secondary rounded-full mb-4"></div>
          <p className="text-lg text-primary font-bold tracking-widest uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const displayReports = currentTab === 'active' ? activeReports : historyReports;

  return (
    <div className="container mx-auto mt-10 mb-10 px-4 max-w-5xl">
      
      {/* Header aligned exactly like the User Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-8 border-b-2 border-secondary pb-4">
        <h2 className="text-3xl font-bold text-primary">Admin Dashboard</h2>
        
        {/* Styled Tabs mimicking the View Profile button from the screenshot */}
        <div className="flex space-x-2">
          <button 
            onClick={() => setCurrentTab('active')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition shadow-sm whitespace-nowrap text-center ${currentTab === 'active' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Active Reports
          </button>
          <button 
            onClick={() => setCurrentTab('history')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition shadow-sm whitespace-nowrap text-center ${currentTab === 'history' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Report History
          </button>
        </div>
      </div>

      {/* Accordion List */}
      <div className="mb-6">
        {displayReports.length === 0 ? (
          <p className="text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
            {currentTab === 'active' ? 'There are currently no active reports to review.' : 'No resolved reports have been archived yet.'}
          </p>
        ) : (
          <div className="space-y-4">
            {displayReports.map((group) => (
              <div key={group.reportedUserId} className="w-full">
                
                {/* Accordion Bar (Matches "My Posted Pets" Bar) */}
                <button 
                  onClick={() => toggleGroup(group.reportedUserId)}
                  className="w-full flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm hover:bg-gray-100 transition"
                >
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-semibold text-primary">Reported: {group.reportedUserName}</h3>
                    <span className="bg-secondary text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center justify-center min-w-[24px] h-6">
                      {group.reportsList.length}
                    </span>
                    
                    {/* Resolution Status for History Tab */}
                    {currentTab === 'history' && group.resolutionStatus === 'Banned' && (
                      <span className="ml-2 text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded uppercase tracking-wide">Banned</span>
                    )}
                    {currentTab === 'history' && group.resolutionStatus === 'Dismissed' && (
                      <span className="ml-2 text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded uppercase tracking-wide">Dismissed</span>
                    )}
                  </div>
                  <svg className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedGroups[group.reportedUserId] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {/* Expanded Interior Card */}
                {expandedGroups[group.reportedUserId] && (
                  <div className="mt-4 animate-fadeIn mb-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary flex flex-col">
                      
                      {/* Top Header inside the expanded card */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-primary">{group.reportedUserName}'s Profile</h4>
                          <p className="text-sm text-gray-500 font-mono mt-1">User ID: {group.reportedUserId}</p>
                        </div>
                      </div>
                      
                      {/* List of individual complaint messages */}
                      <div className="bg-gray-50 p-4 rounded border border-gray-100 mb-4 space-y-3">
                        {group.reportsList.map((report, index) => (
                          <div key={report.id} className={`${index !== 0 ? 'border-t border-gray-200 pt-3' : ''}`}>
                            <p className="text-sm text-gray-700 font-medium">"{report.reason}"</p>
                            <p className="text-xs text-gray-400 mt-1 font-mono">Reported by ID: {report.reporterId}</p>
                          </div>
                        ))}
                      </div>

                      {/* Action Links (Matches "View | Edit | Delete" styling from screenshot) */}
                      {currentTab === 'active' && (
                        <div className="flex items-center space-x-3 mt-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDismissAll(group.reportedUserId, group.reportsList); }}
                            className="text-blue-500 text-sm font-bold hover:underline leading-none"
                          >
                            Dismiss Reports
                          </button>
                          <span className="text-gray-300 leading-none">|</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleBanUser(group.reportedUserId, group.reportsList); }}
                            className="text-red-500 text-sm font-bold hover:underline leading-none"
                          >
                            Ban User
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}