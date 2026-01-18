import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Eye, EyeOff, Trash2, ChevronDown, Home, Users } from 'lucide-react';

export default function StaffDashboard() {
  const [staffSession, setStaffSession] = useState(null);
  const [activeTab, setActiveTab] = useState('videos'); // 'videos', 'requests', 'comments', 'reports', 'users', 'creators', 'shadowDeleted', 'approvals'
  const [showDropdown, setShowDropdown] = useState(false);
  const [reportCategory, setReportCategory] = useState('all'); // 'all', 'users', 'creators', 'requests', 'ads', 'videos'
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [creators, setCreators] = useState([]);
  const [shadowDeleted, setShadowDeleted] = useState([]);
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [actionModal, setActionModal] = useState({ isOpen: false, itemId: null, itemType: null });
  const [reasonModal, setReasonModal] = useState({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
  const [userActionModal, setUserActionModal] = useState({ isOpen: false, userId: null, action: null });

  useEffect(() => {
    const session = localStorage.getItem('staffSession');
    if (session) {
      setStaffSession(JSON.parse(session));
      loadData(JSON.parse(session));
    }
  }, []);

  const loadData = async (employee) => {
    try {
      setLoading(true);
      setError('');

      // Load reports
      const reportsRes = await fetch(`http://localhost:4000/staff/reports?employeeId=${employee.id}`);
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }

      // Load videos
      const videosRes = await fetch(`http://localhost:4000/staff/videos?employeeId=${employee.id}`);
      if (videosRes.ok) {
        const data = await videosRes.json();
        setVideos(data.videos || []);
      }

      // Load users
      const usersRes = await fetch(`http://localhost:4000/staff/users?employeeId=${employee.id}`);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
        // Also extract creators from users
        const creatorsOnly = (data.users || []).filter(u => u.isCreator);
        setCreators(creatorsOnly);
      }

      // Load requests
      const requestsRes = await fetch(`http://localhost:4000/staff/requests?employeeId=${employee.id}`);
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data.requests || []);
      }

      // Load comments
      const commentsRes = await fetch(`http://localhost:4000/staff/comments?employeeId=${employee.id}`);
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments || []);
      }

      // Load pending accounts (admin only)
      if (employee.role === 'administrator') {
        const pendingRes = await fetch(`http://localhost:4000/staff/pending-accounts?employeeId=${employee.id}`);
        if (pendingRes.ok) {
          const data = await pendingRes.json();
          setPendingAccounts(data.pendingAccounts || []);
        }
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShadowDelete = async (videoId) => {
    const reason = prompt('Enter reason for shadow deletion:');
    if (!reason) return;

    try {
      const res = await fetch(`http://localhost:4000/staff/shadow-delete/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        // Update UI
        const deletedReport = reports.find(r => r.videoId === videoId);
        if (deletedReport) {
          setShadowDeleted([...shadowDeleted, { videoId, deletedBy: staffSession.id, reason, createdAt: new Date().toISOString() }]);
          setReports(reports.filter(r => r.videoId !== videoId));
        }
      }
    } catch (err) {
      console.error('Shadow delete failed:', err);
    }
  };

  const handleApproveAccount = async (pendingId, approve) => {
    try {
      const res = await fetch('http://localhost:4000/staff/approve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          pendingId,
          approve
        })
      });

      if (res.ok) {
        setPendingAccounts(pendingAccounts.filter(p => p.employeeId !== pendingId));
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/staff/delete-video/${videoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        setVideos(videos.filter(v => v.id !== videoId));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
      } else {
        setError('Failed to delete video');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Error deleting video');
    }
  };

  const handleHideVideo = async (videoId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/staff/hide-video/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        setVideos(videos.filter(v => v.id !== videoId));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
      } else {
        setError('Failed to hide video');
      }
    } catch (err) {
      console.error('Hide failed:', err);
      setError('Error hiding video');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/staff/delete-request/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        setRequests(requests.filter(r => r.id !== requestId));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
      } else {
        setError('Failed to delete request');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Error deleting request');
    }
  };

  const handleHideRequest = async (requestId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/staff/hide-request/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        setRequests(requests.filter(r => r.id !== requestId));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
      } else {
        setError('Failed to hide request');
      }
    } catch (err) {
      console.error('Hide failed:', err);
      setError('Error hiding request');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/staff/delete-comment/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
      } else {
        setError('Failed to delete comment');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Error deleting comment');
    }
  };

  const handleHideComment = async (commentId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/staff/hide-comment/${commentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
      } else {
        setError('Failed to hide comment');
      }
    } catch (err) {
      console.error('Hide failed:', err);
      setError('Error hiding comment');
    }
  };

  const handleUserAction = async (action) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/staff/user-action/${userActionModal.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          action: action,
          reason
        })
      });

      if (res.ok) {
        // Reload reports to reflect changes
        if (staffSession) loadData(staffSession);
        setUserActionModal({ isOpen: false, userId: null, action: null });
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
      } else {
        setError('Failed to apply user action');
      }
    } catch (err) {
      console.error('User action failed:', err);
      setError('Error applying user action');
    }
  };

  if (!staffSession) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
        Please login as staff to access this dashboard
      </div>
    );
  }

  return (
    <>
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0' }}>Staff Admin Dashboard</h1>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>Welcome, {staffSession.name} ({staffSession.role})</p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#dc2626',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Dropdown Menu */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onBlur={(e) => {
            if (!e.currentTarget.parentElement.contains(e.relatedTarget)) {
              setTimeout(() => setShowDropdown(false), 150);
            }
          }}
        >
          <span>
            {activeTab === 'videos' && `Videos (${videos.length})`}
            {activeTab === 'requests' && `Requests (${requests.length})`}
            {activeTab === 'comments' && `Comments (${comments.length})`}
            {activeTab === 'reports' && `Report Queue (${reports.length})`}
            {activeTab === 'users' && `Users (${users.length})`}
            {activeTab === 'creators' && `Creators (${creators.length})`}
            {activeTab === 'shadowDeleted' && `Shadow Deleted (${shadowDeleted.length})`}
            {activeTab === 'approvals' && `Account Approvals (${pendingAccounts.length})`}
          </span>
          <ChevronDown 
            size={20} 
            style={{
              transition: 'transform 0.3s ease',
              transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
            }} 
          />
        </button>

        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            backgroundColor: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            zIndex: 50,
            overflow: 'hidden'
          }}>
            <button
              onClick={() => {
                setActiveTab('videos');
                setShowDropdown(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === 'videos' ? '#eff6ff' : 'white',
                color: activeTab === 'videos' ? '#1e40af' : '#374151',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'videos' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'videos' ? '#eff6ff' : 'white'}
            >
              Videos ({videos.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('requests');
                setShowDropdown(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === 'requests' ? '#eff6ff' : 'white',
                color: activeTab === 'requests' ? '#1e40af' : '#374151',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'requests' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'requests' ? '#eff6ff' : 'white'}
            >
              Requests ({requests.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('comments');
                setShowDropdown(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === 'comments' ? '#eff6ff' : 'white',
                color: activeTab === 'comments' ? '#1e40af' : '#374151',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'comments' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'comments' ? '#eff6ff' : 'white'}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                setShowDropdown(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === 'reports' ? '#eff6ff' : 'white',
                color: activeTab === 'reports' ? '#1e40af' : '#374151',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'reports' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'reports' ? '#eff6ff' : 'white'}
            >
              Report Queue ({reports.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                setShowDropdown(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === 'users' ? '#eff6ff' : 'white',
                color: activeTab === 'users' ? '#1e40af' : '#374151',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'users' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'users' ? '#eff6ff' : 'white'}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('creators');
                setShowDropdown(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === 'creators' ? '#eff6ff' : 'white',
                color: activeTab === 'creators' ? '#1e40af' : '#374151',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'creators' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'creators' ? '#eff6ff' : 'white'}
            >
              Creators ({creators.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('shadowDeleted');
                setShowDropdown(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === 'shadowDeleted' ? '#eff6ff' : 'white',
                color: activeTab === 'shadowDeleted' ? '#1e40af' : '#374151',
                border: 'none',
                borderBottom: staffSession?.role === 'administrator' ? '1px solid #e5e7eb' : 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'shadowDeleted' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'shadowDeleted' ? '#eff6ff' : 'white'}
            >
              Shadow Deleted ({shadowDeleted.length})
            </button>
            {staffSession?.role === 'administrator' && (
              <button
                onClick={() => {
                  setActiveTab('approvals');
                  setShowDropdown(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'approvals' ? '#eff6ff' : 'white',
                  color: activeTab === 'approvals' ? '#1e40af' : '#374151',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === 'approvals' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'approvals' ? '#eff6ff' : 'white'}
              >
                Account Approvals ({pendingAccounts.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
          Loading...
        </div>
      ) : (
        <>
          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div>
              {videos.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#9ca3af'
                }}>
                  <Eye size={48} style={{ margin: '0 auto 16px' }} />
                  <p>No videos to manage</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {videos.map(video => (
                    <div key={video.id} style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#fff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {video.title}
                          </h3>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Author: {video.author}
                          </p>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Views: {video.views} | Likes: {video.likes} | Comments: {video.comments}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            {new Date(video.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setActionModal({ isOpen: true, itemId: video.id, itemType: 'video' })}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: 'white',
                            color: '#dc2626',
                            border: '2px solid #dc2626',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#dc2626';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.color = '#dc2626';
                          }}
                        >
                          Action
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              {requests.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#9ca3af'
                }}>
                  <Eye size={48} style={{ margin: '0 auto 16px' }} />
                  <p>No requests to manage</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {requests.map(req => (
                    <div key={req.id} style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#fff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {req.title}
                          </h3>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Requester: {req.company}
                          </p>
                          {req.claimedBy && (
                            <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                              Claimed by: {req.claimedBy.name}
                            </p>
                          )}
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Likes: {req.likes} | Comments: {req.comments}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            {new Date(req.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setActionModal({ isOpen: true, itemId: req.id, itemType: 'request' })}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: 'white',
                            color: '#dc2626',
                            border: '2px solid #dc2626',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#dc2626';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.color = '#dc2626';
                          }}
                        >
                          Action
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div>
              {comments.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#9ca3af'
                }}>
                  <Eye size={48} style={{ margin: '0 auto 16px' }} />
                  <p>No comments to manage</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {comments.map(comment => (
                    <div key={comment.id} style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#fff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {comment.userName}
                          </h3>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            {comment.text}
                          </p>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '12px' }}>
                            On request: {comment.requestId}
                          </p>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '12px' }}>
                            Likes: {comment.likesCount} | Dislikes: {comment.dislikesCount}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setActionModal({ isOpen: true, itemId: comment.id, itemType: 'comment' })}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: 'white',
                            color: '#dc2626',
                            border: '2px solid #dc2626',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#dc2626';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.color = '#dc2626';
                          }}
                        >
                          Action
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              {users.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#9ca3af'
                }}>
                  <Users size={48} style={{ margin: '0 auto 16px' }} />
                  <p>No users to manage</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {users.map(user => (
                    <div key={user.id} style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: user.status === 'banned' ? '#fee2e2' : user.shadowBanned ? '#fef3c7' : '#fff',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start'
                    }}>
                      {/* Profile Picture */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        backgroundColor: '#e5e7eb',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {user.image ? (
                          <img src={user.image} alt={user.name} style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }} />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#d1d5db',
                            color: '#fff',
                            fontSize: '32px',
                            fontWeight: 'bold'
                          }}>
                            {(user.name || 'U')[0].toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                              {user.name}
                              {user.isCreator && <span style={{ marginLeft: '8px', color: '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}>👑 Creator</span>}
                            </h3>
                            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                              @{user.email.split('@')[0]}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setUserActionModal({ isOpen: true, userId: user.id, action: null });
                              setReasonModal({ isOpen: true, action: 'user', itemId: null, itemType: null, reason: '' });
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: 'white',
                              color: '#dc2626',
                              border: '2px solid #dc2626',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#dc2626';
                              e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'white';
                              e.target.style.color = '#dc2626';
                            }}
                          >
                            Action
                          </button>
                        </div>

                        {/* Bio */}
                        {user.bio && (
                          <p style={{ margin: '8px 0', color: '#666', fontSize: '13px', fontStyle: 'italic' }}>
                            "{user.bio}"
                          </p>
                        )}

                        {/* User Details */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                          <div>
                            <span style={{ color: '#999', fontSize: '12px' }}>Email:</span>
                            <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>{user.email}</p>
                          </div>
                          <div>
                            <span style={{ color: '#999', fontSize: '12px' }}>Status:</span>
                            <p style={{ margin: '0', color: user.status === 'banned' ? '#dc2626' : user.shadowBanned ? '#f59e0b' : '#10b981', fontSize: '13px', fontWeight: 'bold' }}>
                              {user.status === 'banned' ? '🚫 Banned' : user.shadowBanned ? '👁️ Shadow Banned' : '✓ Active'}
                              {user.warnings ? ` | ⚠️ ${user.warnings}` : ''}
                            </p>
                          </div>
                          {user.isCreator && (
                            <div>
                              <span style={{ color: '#999', fontSize: '12px' }}>Creator Since:</span>
                              <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>
                                {new Date(user.creatorSince).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          <div>
                            <span style={{ color: '#999', fontSize: '12px' }}>Joined:</span>
                            <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Creators Tab */}
          {activeTab === 'creators' && (
            <div>
              {creators.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#9ca3af'
                }}>
                  <Users size={48} style={{ margin: '0 auto 16px' }} />
                  <p>No creators</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {creators.map(creator => (
                    <div key={creator.id} style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: creator.status === 'banned' ? '#fee2e2' : creator.shadowBanned ? '#fef3c7' : '#fffbeb',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start'
                    }}>
                      {/* Profile Picture */}
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '8px',
                        backgroundColor: '#e5e7eb',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '3px solid #f59e0b'
                      }}>
                        {creator.image ? (
                          <img src={creator.image} alt={creator.name} style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }} />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#d1d5db',
                            color: '#fff',
                            fontSize: '40px',
                            fontWeight: 'bold'
                          }}>
                            {(creator.name || 'C')[0].toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Creator Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>
                              👑 {creator.name}
                            </h3>
                            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                              @{creator.email.split('@')[0]}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setUserActionModal({ isOpen: true, userId: creator.id, action: null });
                              setReasonModal({ isOpen: true, action: 'user', itemId: null, itemType: null, reason: '' });
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: 'white',
                              color: '#dc2626',
                              border: '2px solid #dc2626',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#dc2626';
                              e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'white';
                              e.target.style.color = '#dc2626';
                            }}
                          >
                            Action
                          </button>
                        </div>

                        {/* Bio */}
                        {creator.bio && (
                          <p style={{ margin: '8px 0', color: '#666', fontSize: '13px', fontStyle: 'italic' }}>
                            "{creator.bio}"
                          </p>
                        )}

                        {/* Creator Details */}
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '8px' }}>
                          <div>
                            <span style={{ color: '#999', fontSize: '12px' }}>Email:</span>
                            <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>{creator.email}</p>
                          </div>
                          <div>
                            <span style={{ color: '#999', fontSize: '12px' }}>Price:</span>
                            <p style={{ margin: '0', color: '#f59e0b', fontSize: '13px', fontWeight: 'bold' }}>
                              ${creator.price || '0'} / Request
                            </p>
                          </div>
                          <div>
                            <span style={{ color: '#999', fontSize: '12px' }}>Status:</span>
                            <p style={{ margin: '0', color: creator.status === 'banned' ? '#dc2626' : creator.shadowBanned ? '#f59e0b' : '#10b981', fontSize: '13px', fontWeight: 'bold' }}>
                              {creator.status === 'banned' ? '🚫 Banned' : creator.shadowBanned ? '👁️ Shadow Banned' : '✓ Active'}
                              {creator.warnings ? ` | ⚠️ ${creator.warnings}` : ''}
                            </p>
                          </div>
                          <div>
                            <span style={{ color: '#999', fontSize: '12px' }}>Creator Since:</span>
                            <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>
                              {new Date(creator.creatorSince).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span style={{ color: '#999', fontSize: '12px' }}>Streak:</span>
                            <p style={{ margin: '0', color: '#f59e0b', fontSize: '13px', fontWeight: 'bold' }}>
                              🔥 {creator.streak || 0}
                            </p>
                          </div>
                        </div>

                        {/* Intro Video */}
                        {creator.introVideo && (
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ color: '#999', fontSize: '12px' }}>Intro Video:</span>
                            <p style={{ margin: '4px 0', color: '#3b82f6', fontSize: '12px' }}>
                              <a href={creator.introVideo} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                                View Video →
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'reports' && (
            <div>
              {/* Report Category Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                flexWrap: 'wrap',
                paddingBottom: '12px',
                borderBottom: '2px solid #e5e7eb'
              }}>
                {['all', 'users', 'creators', 'requests', 'ads', 'videos'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setReportCategory(cat)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: reportCategory === cat ? '#3b82f6' : 'transparent',
                      color: reportCategory === cat ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: reportCategory === cat ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (reportCategory !== cat) e.target.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      if (reportCategory !== cat) e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Filtered Reports */}
              {reports.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#9ca3af'
                }}>
                  <CheckCircle size={48} style={{ margin: '0 auto 16px' }} />
                  <p>No reports in queue</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reports.map(report => (
                    <div key={report.id} style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#fff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          {reportCategory === 'users' || report.type === 'user' ? (
                            <>
                              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                User Report: {report.userId}
                              </h3>
                              <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                                Reason: {report.reason}
                              </p>
                              <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                                Violation: {report.violationType}
                              </p>
                            </>
                          ) : (
                            <>
                              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                Report: {report.videoId || report.contentId}
                              </h3>
                              <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                                Reason: {report.reason}
                              </p>
                            </>
                          )}
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            Reported by: {report.reportedBy}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            {new Date(report.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          {reportCategory === 'users' || report.type === 'user' ? (
                            <button
                              onClick={() => {
                                setUserActionModal({ isOpen: true, userId: report.userId, action: null });
                                setReasonModal({ isOpen: true, action: 'user', itemId: null, itemType: null, reason: '' });
                              }}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: 'white',
                                color: '#dc2626',
                                border: '2px solid #dc2626',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#dc2626';
                                e.target.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.color = '#dc2626';
                              }}
                            >
                              Action
                            </button>
                          ) : (
                            <button
                              onClick={() => handleShadowDelete(report.videoId || report.contentId)}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              <EyeOff size={14} style={{ marginRight: '4px' }} />
                              Shadow Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Shadow Deleted Tab */}
          {activeTab === 'shadowDeleted' && (
            <div>
              {shadowDeleted.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#9ca3af'
                }}>
                  <Eye size={48} style={{ margin: '0 auto 16px' }} />
                  <p>No shadow-deleted videos</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shadowDeleted.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {item.videoId}
                          </h3>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Reason: {item.reason}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            Deleted by: Staff #{item.deletedBy}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => alert('Restore functionality coming soon')}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Account Approvals Tab (Admin Only) */}
          {activeTab === 'approvals' && staffSession.role === 'administrator' && (
            <div>
              {pendingAccounts.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#9ca3af'
                }}>
                  <Clock size={48} style={{ margin: '0 auto 16px' }} />
                  <p>No pending account requests</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingAccounts.map(account => (
                    <div key={account.employeeId} style={{
                      padding: '16px',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      backgroundColor: '#fffbeb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {account.name}
                          </h3>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Email: {account.email}
                          </p>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Employee ID: {account.employeeId}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            Applied: {new Date(account.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApproveAccount(account.employeeId, true)}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveAccount(account.employeeId, false)}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 24px 0', color: '#1f2937' }}>
              Choose Action
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  setActionModal({ isOpen: false, itemId: null, itemType: null });
                  setReasonModal({ isOpen: true, action: 'hide', itemId: actionModal.itemId, itemType: actionModal.itemType, reason: '' });
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <EyeOff size={18} />
                Hide
              </button>
              <button
                onClick={() => {
                  setActionModal({ isOpen: false, itemId: null, itemType: null });
                  setReasonModal({ isOpen: true, action: 'delete', itemId: actionModal.itemId, itemType: actionModal.itemType, reason: '' });
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <Trash2 size={18} />
                Delete Permanently
              </button>
              <button
                onClick={() => setActionModal({ isOpen: false, itemId: null, itemType: null })}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {reasonModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
              {reasonModal.action === 'hide' ? 'Hide ' : 'Delete '}
              {reasonModal.itemType}
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
              Please provide a reason for this action
            </p>
            <textarea
              value={reasonModal.reason}
              onChange={(e) => setReasonModal({ ...reasonModal, reason: e.target.value })}
              placeholder="Enter your reason here..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                minHeight: '120px',
                marginBottom: '24px',
                resize: 'none'
              }}
            />
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  if (reasonModal.action === 'hide') {
                    if (reasonModal.itemType === 'video') handleHideVideo(reasonModal.itemId);
                    else if (reasonModal.itemType === 'request') handleHideRequest(reasonModal.itemId);
                    else if (reasonModal.itemType === 'comment') handleHideComment(reasonModal.itemId);
                  } else {
                    if (reasonModal.itemType === 'video') handleDeleteVideo(reasonModal.itemId);
                    else if (reasonModal.itemType === 'request') handleDeleteRequest(reasonModal.itemId);
                    else if (reasonModal.itemType === 'comment') handleDeleteComment(reasonModal.itemId);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: reasonModal.action === 'hide' ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Confirm
              </button>
              <button
                onClick={() => setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' })}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Action Modal (for reports - warn/ban/shadow ban/delete users) */}
      {userActionModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
              Apply Action to User
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
              Please provide a reason for this action
            </p>
            <textarea
              value={reasonModal.reason}
              onChange={(e) => setReasonModal({ ...reasonModal, reason: e.target.value })}
              placeholder="Enter your reason here..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                minHeight: '120px',
                marginBottom: '24px',
                resize: 'none'
              }}
            />
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => handleUserAction('warn')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Send Warning
              </button>
              <button
                onClick={() => handleUserAction('ban')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Ban User
              </button>
              <button
                onClick={() => handleUserAction('shadowban')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Shadow Ban User
              </button>
              <button
                onClick={() => handleUserAction('delete')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Delete User Account
              </button>
              <button
                onClick={() => {
                  setUserActionModal({ isOpen: false, userId: null, action: null });
                  setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

    {/* Footer - Fixed at bottom like normal app footer */}
    <footer style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '24px',
      zIndex: 40,
      boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.05)'
    }}>
      <button
        onClick={() => window.location.href = '/'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          width: '50px',
          height: '50px',
          backgroundColor: 'transparent',
          color: '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          transition: 'all 0.2s',
          flexDirection: 'column',
          gap: '4px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f4f8';
          e.currentTarget.style.color = '#1d3a8a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#3b82f6';
        }}
        title="Go to Home"
      >
        <Home size={24} />
        <span>Home</span>
      </button>
    </footer>
    </>
  );
}
