import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Eye, EyeOff, Trash2, ChevronDown, Home, Users, Zap, X, AlertTriangle, Ban, EyeOff as EyeOffIcon, Trash, Send, Megaphone, Star, Gift, Bell, Crown, Mail, Calendar, Flame, Play, Settings, Share2, Check, Image, Upload, Plus, Pause, Trash as TrashIcon, Copy, Film, MessageCircle, ThumbsUp } from 'lucide-react';

export default function StaffDashboard() {
  const [staffSession, setStaffSession] = useState(null);
  const [activeTab, setActiveTab] = useState('videos'); // 'videos', 'requests', 'comments', 'reports', 'users', 'creators', 'shadowDeleted', 'approvals', 'promotions', 'ads'
  const [adAssets, setAdAssets] = useState([]);
  const [adOverlays, setAdOverlays] = useState([]);
  const [selectedAdVideo, setSelectedAdVideo] = useState(null);
  const [expandedVideoCardId, setExpandedVideoCardId] = useState(null); // Track which video card is showing full stats
  const [adOverlayModal, setAdOverlayModal] = useState({ isOpen: false, assetUrl: '', assetType: 'image', videoId: null, startTime: 0, duration: null });
  const [videoPreviewState, setVideoPreviewState] = useState({ isPlaying: false, currentTime: 0, videoDuration: 100, overlayPosition: { x: 50, y: 50 }, overlaySize: { width: 80, height: 60 }, isDragging: false, dragStart: { x: 0, y: 0 } });
  const [showOverlayUrlInput, setShowOverlayUrlInput] = useState(false);
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
  const [promotionModal, setPromotionModal] = useState({ isOpen: false, title: '', message: '', recipientType: 'individual', selectedUsers: [], promotionType: 'offer' });
  const [selectedActionType, setSelectedActionType] = useState(null);
  const [notificationPreview, setNotificationPreview] = useState(null);
  const [banType, setBanType] = useState('permanent');
  const [banDuration, setBanDuration] = useState({ value: 7, unit: 'days' });
  const [promotionTypeDropdown, setPromotionTypeDropdown] = useState(false);
  const [sendToDropdown, setSendToDropdown] = useState(false);
  const [previewColor, setPreviewColor] = useState('#f59e0b');

  useEffect(() => {
    const session = localStorage.getItem('staffSession');
    if (session) {
      setStaffSession(JSON.parse(session));
      loadData(JSON.parse(session));
    }
  }, []);

  // Video playback animation
  useEffect(() => {
    if (!videoPreviewState.isPlaying) return;

    const interval = setInterval(() => {
      setVideoPreviewState(prev => {
        const selectedVideo = videos.find(v => v.id === selectedAdVideo);
        const duration = selectedVideo?.duration || 100;
        const newTime = prev.currentTime + 0.033; // ~30fps
        
        // Stop at end
        if (newTime >= duration) {
          return { ...prev, currentTime: duration, isPlaying: false };
        }
        return { ...prev, currentTime: newTime };
      });
    }, 33); // 33ms ≈ 30fps

    return () => clearInterval(interval);
  }, [videoPreviewState.isPlaying, selectedAdVideo, videos]);

  // Sync video element with current time
  useEffect(() => {
    const videoElement = document.querySelector('[data-video-preview]');
    if (videoElement) {
      videoElement.currentTime = videoPreviewState.currentTime;
      if (videoPreviewState.isPlaying) {
        videoElement.play().catch(() => {});
      } else {
        videoElement.pause();
      }
    }
  }, [videoPreviewState.currentTime, videoPreviewState.isPlaying]);

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

  // Format time as M:SS.S (with 1 decimal place for seconds)
  const formatTimeCompact = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
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
          reason,
          ...(action === 'ban' && {
            banType: banType,
            banDuration: banType === 'temporary' ? banDuration : null
          })
        })
      });

      if (res.ok) {
        // Reload reports to reflect changes
        if (staffSession) loadData(staffSession);
        setUserActionModal({ isOpen: false, userId: null, action: null });
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setSelectedActionType(null);
        setNotificationPreview(null);
        setBanType('permanent');
        setBanDuration({ value: 7, unit: 'days' });
        setError('');
      } else {
        setError('Failed to apply user action');
      }
    } catch (err) {
      console.error('User action failed:', err);
      setError('Error applying user action');
    }
  };

  const handleSendPromotion = async () => {
    if (!promotionModal.title.trim() || !promotionModal.message.trim()) {
      setError('Please fill in all promotion fields');
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/staff/send-promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          title: promotionModal.title,
          message: promotionModal.message,
          promotionType: promotionModal.promotionType,
          recipientType: promotionModal.recipientType,
          selectedUsers: promotionModal.recipientType === 'individual' ? promotionModal.selectedUsers : null
        })
      });

      if (res.ok) {
        setPromotionModal({ isOpen: false, title: '', message: '', recipientType: 'individual', selectedUsers: [], promotionType: 'offer' });
        setError('');
        alert('Promotion sent successfully!');
      } else {
        setError('Failed to send promotion');
      }
    } catch (err) {
      console.error('Promotion send failed:', err);
      setError('Error sending promotion');
    }
  };

  const handleNotificationPreview = (actionType, reason) => {
    let banMessage = '';
    if (actionType === 'ban') {
      if (banType === 'temporary') {
        const durationText = banDuration.value === 1 ? banDuration.unit.slice(0, -1) : banDuration.unit;
        banMessage = `Your account has been temporarily banned for ${banDuration.value} ${durationText}.\n\nReason: ${reason || 'Violating terms of service'}`;
      } else {
        banMessage = `Your account has been permanently banned.\n\nReason: ${reason || 'Violating terms of service'}`;
      }
    }

    const previews = {
      warn: {
        title: 'Warning Notice',
        message: `Your account has received a warning for violating community guidelines.\n\nReason: ${reason || 'Violating community guidelines'}`,
        color: '#f59e0b',
        iconType: 'warn'
      },
      ban: {
        title: 'Account Banned',
        message: banMessage,
        color: '#ef4444',
        iconType: 'ban'
      },
      shadowban: {
        title: 'Content Restricted',
        message: `Your content visibility has been restricted.\n\nReason: ${reason || 'Content violates guidelines'}`,
        color: '#6b7280',
        iconType: 'shadowban'
      },
      delete: {
        title: 'Account Deleted',
        message: `Your account and all associated content have been permanently deleted.\n\nReason: ${reason || 'Severe violation of terms of service'}`,
        color: '#8b5cf6',
        iconType: 'delete'
      }
    };
    setNotificationPreview(previews[actionType] || null);
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
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>Staff Admin Dashboard</h1>
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
            <button
              onClick={() => {
                setActiveTab('promotions');
                setShowDropdown(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === 'promotions' ? '#eff6ff' : 'white',
                color: activeTab === 'promotions' ? '#1e40af' : '#374151',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'promotions' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'promotions' ? '#eff6ff' : 'white'}
            >
              Promotions
            </button>
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
                        borderRadius: '50%',
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
                              {user.isCreator && <span style={{ marginLeft: '8px', color: '#f59e0b', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Crown size={12} /> Creator</span>}
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
                              {user.warnings ? ` | ${user.warnings} warnings` : ''}
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
                        borderRadius: '50%',
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
                              <Crown size={16} style={{ marginRight: '6px' }} /> {creator.name}
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
                              {creator.warnings ? ` | ${creator.warnings} warnings` : ''}
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
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {!selectedActionType ? (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
                  Apply Action to User
                </h2>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
                  Select an action to apply to this user
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedActionType('warn')}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    <AlertTriangle size={16} style={{ marginRight: '6px' }} /> Send Warning
                  </button>
                  <button
                    onClick={() => setSelectedActionType('ban')}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    <Ban size={16} style={{ marginRight: '6px' }} /> Ban User
                  </button>
                  <button
                    onClick={() => setSelectedActionType('shadowban')}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    <EyeOff size={16} style={{ marginRight: '6px' }} /> Shadow Ban User
                  </button>
                  <button
                    onClick={() => setSelectedActionType('delete')}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    <Trash size={16} style={{ marginRight: '6px' }} /> Delete User Account
                  </button>
                  <button
                    onClick={() => {
                      setUserActionModal({ isOpen: false, userId: null, action: null });
                      setSelectedActionType(null);
                      setNotificationPreview(null);
                      setBanType('permanent');
                      setBanDuration({ value: 7, unit: 'days' });
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
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
                  {selectedActionType === 'warn' && 'Send Warning'}
                  {selectedActionType === 'ban' && '🚫 Ban User'}
                  {selectedActionType === 'shadowban' && '👁️ Shadow Ban User'}
                  {selectedActionType === 'delete' && '🗑️ Delete User Account'}
                </h2>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 16px 0' }}>
                  Select a reason or provide a custom one. The preview below shows exactly how users will see this.
                </p>

                {/* Ban Type Selector (Only for ban action) */}
                {selectedActionType === 'ban' && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0 0 8px 0' }}>BAN TYPE</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => setBanType('temporary')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: banType === 'temporary' ? '#ef4444' : '#f3f4f6',
                          color: banType === 'temporary' ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        ⏰ Temporary
                      </button>
                      <button
                        onClick={() => setBanType('permanent')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: banType === 'permanent' ? '#ef4444' : '#f3f4f6',
                          color: banType === 'permanent' ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        ♾️ Permanent
                      </button>
                    </div>
                  </div>
                )}

                {/* Ban Duration Selector (Only for temporary bans) */}
                {selectedActionType === 'ban' && banType === 'temporary' && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0 0 8px 0' }}>BAN DURATION</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={banDuration.value}
                        onChange={(e) => setBanDuration({ ...banDuration, value: parseInt(e.target.value) || 1 })}
                        min="1"
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                          fontWeight: '600'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          {['hours', 'days', 'weeks', 'months'].map((unit) => (
                            <button
                              key={unit}
                              onClick={() => setBanDuration({ ...banDuration, unit })}
                              style={{
                                padding: '10px 12px',
                                backgroundColor: banDuration.unit === unit ? '#ef4444' : '#f3f4f6',
                                color: banDuration.unit === unit ? 'white' : '#374151',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: banDuration.unit === unit ? '700' : '600',
                                transition: 'all 0.2s',
                                textTransform: 'capitalize'
                              }}
                              onMouseEnter={(e) => {
                                if (banDuration.unit !== unit) {
                                  e.target.style.backgroundColor = '#e5e7eb';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (banDuration.unit !== unit) {
                                  e.target.style.backgroundColor = '#f3f4f6';
                                }
                              }}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason Templates */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0 0 8px 0' }}>COMMON REASONS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedActionType === 'warn' && [
                      'Violating community guidelines',
                      'Spam or repetitive posting',
                      'Misleading or false information',
                      'Inappropriate language or behavior'
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setReasonModal({ ...reasonModal, reason: template });
                          handleNotificationPreview(selectedActionType, template);
                        }}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: reasonModal.reason === template ? '#f59e0b' : '#f3f4f6',
                          color: reasonModal.reason === template ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                      >
                        {template}
                      </button>
                    ))}
                    {selectedActionType === 'ban' && [
                      'Severe violation of terms of service',
                      'Repeated harassment or abuse',
                      'Copyright infringement',
                      'Illegal activity detected'
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setReasonModal({ ...reasonModal, reason: template });
                          handleNotificationPreview(selectedActionType, template);
                        }}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: reasonModal.reason === template ? '#ef4444' : '#f3f4f6',
                          color: reasonModal.reason === template ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                      >
                        {template}
                      </button>
                    ))}
                    {selectedActionType === 'shadowban' && [
                      'Content violates platform guidelines',
                      'Suspected artificial engagement',
                      'Low-quality or repetitive content',
                      'Restricted for review'
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setReasonModal({ ...reasonModal, reason: template });
                          handleNotificationPreview(selectedActionType, template);
                        }}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: reasonModal.reason === template ? '#6b7280' : '#f3f4f6',
                          color: reasonModal.reason === template ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                      >
                        {template}
                      </button>
                    ))}
                    {selectedActionType === 'delete' && [
                      'Severe violation of terms of service',
                      'Repeated policy violations after warnings',
                      'Harmful or illegal content',
                      'Account used for malicious purposes'
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setReasonModal({ ...reasonModal, reason: template });
                          handleNotificationPreview(selectedActionType, template);
                        }}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: reasonModal.reason === template ? '#8b5cf6' : '#f3f4f6',
                          color: reasonModal.reason === template ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Reason Input */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0 0 8px 0' }}>CUSTOM REASON (OPTIONAL)</p>
                  <textarea
                    value={reasonModal.reason}
                    onChange={(e) => {
                      setReasonModal({ ...reasonModal, reason: e.target.value });
                      handleNotificationPreview(selectedActionType, e.target.value);
                    }}
                    placeholder="Or type a custom reason here..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      minHeight: '80px',
                      marginBottom: '16px',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Notification Preview */}
                {notificationPreview && (
                  <div style={{
                    marginBottom: '16px'
                  }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0 0 12px 0' }}>HOW USERS WILL SEE THIS</p>
                    <div style={{
                      backgroundColor: '#f0f4f8',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: `1px solid ${notificationPreview.color}33`
                      }}>
                        {/* Close Button */}
                        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                          <span style={{
                            fontSize: '20px',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}>✕</span>
                        </div>

                        {/* Icon */}
                        <div style={{
                          textAlign: 'center',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            fontSize: '48px',
                            width: '70px',
                            height: '70px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: notificationPreview.color,
                            borderRadius: '50%',
                            color: 'white',
                            margin: '0 auto',
                            boxShadow: `0 4px 12px ${notificationPreview.color}40`
                          }}>
                            {notificationPreview.iconType === 'warn' && <AlertTriangle size={28} color="white" />}
                            {notificationPreview.iconType === 'ban' && <Ban size={28} color="white" />}
                            {notificationPreview.iconType === 'shadowban' && <EyeOff size={28} color="white" />}
                            {notificationPreview.iconType === 'delete' && <Trash size={28} color="white" />}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          margin: '0 0 12px 0',
                          color: '#1f2937',
                          textAlign: 'center',
                          letterSpacing: '-0.5px'
                        }}>
                          {notificationPreview.title}
                        </h3>

                        {/* Message */}
                        <p style={{
                          fontSize: '14px',
                          color: '#4b5563',
                          margin: '0',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          textAlign: 'center'
                        }}>
                          {notificationPreview.message}
                        </p>

                        {/* Action Buttons */}
                        {selectedActionType === 'warn' && (
                          <button style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginTop: '16px',
                            transition: 'opacity 0.2s'
                          }}>
                            Acknowledge
                          </button>
                        )}
                        {selectedActionType === 'shadowban' && (
                          <button style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginTop: '16px',
                            transition: 'opacity 0.2s'
                          }}>
                            Learn More
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                    onClick={() => handleUserAction(selectedActionType)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: selectedActionType === 'warn' ? '#f59e0b' : selectedActionType === 'ban' ? '#ef4444' : selectedActionType === 'delete' ? '#8b5cf6' : '#6b7280',
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
                    Confirm Action
                  </button>
                  <button
                    onClick={() => {
                      setSelectedActionType(null);
                      setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
                      setNotificationPreview(null);
                      setBanType('permanent');
                      setBanDuration({ value: 7, unit: 'days' });
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
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
          {/* Promotions Tab */}
          {activeTab === 'promotions' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => setPromotionModal({ ...promotionModal, isOpen: true })}
                  style={{
                    padding: '12px 24px',
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
                  + Send New Promotion
                </button>
              </div>
              <div style={{
                padding: '32px',
                textAlign: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                color: '#9ca3af'
              }}>
                <Megaphone size={48} style={{ margin: '0 auto 16px' }} />
                <p>No promotions sent yet. Create one to engage users with special offers!</p>
              </div>
            </div>
          )}

          {/* Ads Tab */}
          {activeTab === 'ads' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>Ad Management</h2>
                <button
                  onClick={() => document.getElementById('adAssetFileInput')?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  <Plus size={18} /> Upload Ad Asset
                </button>
                <input
                  id="adAssetFileInput"
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      const type = file.type.startsWith('image') ? 'image' : 'video';
                      const url = URL.createObjectURL(file);
                      setAdAssets([...adAssets, {
                        name: file.name,
                        type: type,
                        url: url
                      }]);
                    }
                  }}
                />
              </div>

              {/* Ad Assets Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>Ad Assets (Images, Videos, Banners)</h3>
                {adAssets.length === 0 ? (
                  <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px',
                    color: '#9ca3af'
                  }}>
                    <Image size={48} style={{ margin: '0 auto 16px' }} />
                    <p>No ad assets uploaded. Upload images, videos, or banners to get started.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                    {adAssets.map((asset, idx) => (
                      <div key={idx} style={{
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: '100%',
                          height: '120px',
                          backgroundColor: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {asset.type === 'image' ? (
                            <img 
                              src={asset.url} 
                              alt={asset.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <video 
                              src={asset.url}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          )}
                        </div>
                        <div style={{ padding: '8px', backgroundColor: 'white' }}>
                          <p style={{ margin: '0', fontSize: '12px', fontWeight: '600', color: '#1f2937', wordBreak: 'break-word' }}>
                            {asset.name}
                          </p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#9ca3af' }}>
                            {asset.type}
                          </p>
                        </div>
                        <button
                          onClick={() => setAdAssets(adAssets.filter((_, i) => i !== idx))}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Overlays Section */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>Video Ad Overlays & Banners</h3>
                {videos.length === 0 ? (
                  <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px',
                    color: '#9ca3af'
                  }}>
                    <Play size={48} style={{ margin: '0 auto 16px' }} />
                    <p>No videos available. Upload videos first to add overlays.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {videos.map(video => (
                      <div key={video.id} style={{
                        padding: selectedAdVideo === video.id ? '0' : '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: selectedAdVideo === video.id ? '#1f2937' : '#ffffff',
                        transition: 'all 0.3s',
                        overflow: 'hidden'
                      }}>
                        {selectedAdVideo === video.id ? (
                          // Expanded/Selected View - Just show video editor
                          <div />
                        ) : (
                          // Collapsed View - Show thumbnail and details
                          <div 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'start', 
                              gap: '12px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={() => setExpandedVideoCardId(video.id)}
                            onMouseLeave={() => setExpandedVideoCardId(null)}
                          >
                            {/* Video Thumbnail - Larger when collapsed */}
                            <div style={{
                              width: '120px',
                              height: '67px',
                              backgroundColor: '#374151',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9ca3af',
                              fontSize: '24px',
                              position: 'relative'
                            }}>
                              {video.thumbnail ? (
                                <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <>
                                  <video 
                                    src={video.videoUrl}
                                    crossOrigin="anonymous"
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover', 
                                      position: 'absolute',
                                      opacity: 0,
                                      pointerEvents: 'none'
                                    }}
                                    onLoadedMetadata={(e) => {
                                      // Generate thumbnail by seeking to middle of video
                                      if (e.target.duration > 0) {
                                        e.target.currentTime = Math.min(e.target.duration / 2, 5);
                                      }
                                    }}
                                    onSeeked={(e) => {
                                      try {
                                        // Capture frame as thumbnail
                                        const canvas = document.createElement('canvas');
                                        canvas.width = e.target.videoWidth;
                                        canvas.height = e.target.videoHeight;
                                        const ctx = canvas.getContext('2d');
                                        ctx.drawImage(e.target, 0, 0);
                                        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                                        // Update the video object with thumbnail
                                        const updatedVideos = videos.map(v => v.id === video.id ? {...v, thumbnail} : v);
                                        setVideos(updatedVideos);
                                      } catch (err) {
                                        // Silently fail if canvas is tainted (CORS issue)
                                        console.warn('Could not generate thumbnail for', video.title, err);
                                      }
                                    }}
                                  />
                                  <Film size={32} />
                                </>
                              )}
                            </div>
                            
                            {/* Video Info - Compact by default, expands on hover */}
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                {video.title}
                              </h4>
                              
                              {/* Duration - Always visible */}
                              <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} />
                                {video.duration ? formatTimeCompact(video.duration) : '0:00'}
                              </div>
                              
                              {/* Stats - Show on hover/expand */}
                              {expandedVideoCardId === video.id && (
                                <div style={{ 
                                  display: 'flex', 
                                  gap: '12px', 
                                  fontSize: '11px', 
                                  color: '#9ca3af',
                                  marginTop: '4px',
                                  animation: 'slideIn 0.3s ease'
                                }}>
                                  <span title="Views" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <Eye size={12} />{(video.views || 0).toLocaleString()}
                                  </span>
                                  <span title="Comments" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <MessageCircle size={12} />{(video.comments?.length || 0)}
                                  </span>
                                  <span title="Likes" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <ThumbsUp size={12} />{(video.likes || 0)}
                                  </span>
                                  {video.category && (
                                    <span style={{ marginLeft: 'auto', padding: '2px 6px', backgroundColor: '#f0f0f0', borderRadius: '3px' }}>
                                      {video.category}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => setSelectedAdVideo(selectedAdVideo === video.id ? null : video.id)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                              onMouseLeave={(e) => e.target.style.opacity = '1'}
                            >
                              Select
                            </button>
                          </div>
                        )}

                        {/* Video Timeline for Overlay Placement */}
                        {selectedAdVideo === video.id && (
                          <div style={{ padding: '16px' }}>
                            {/* Timeline */}
                            <div style={{
                              position: 'relative',
                              width: '100%',
                              height: '40px',
                              backgroundColor: '#374151',
                              borderRadius: '6px',
                              border: '1px solid #555',
                              marginBottom: '12px',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9ca3af',
                              fontSize: '12px'
                            }}>
                              {adOverlayModal.videoId === video.id 
                                ? `Start Time: ${formatTimeCompact(adOverlayModal.startTime)}`
                                : 'Select asset to set start time'
                              }
                            </div>

                            {/* Overlay Duration - MOVED BELOW FRAME STRIP */}
                            {/* Asset Selection - Custom Dropdown (for image/video) */}
                            {adOverlayModal.assetType !== 'text' && (
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', display: 'block' }}>
                                Select Ad Asset
                              </label>
                              <div style={{
                                position: 'relative',
                                width: '100%'
                              }}>
                                <button
                                  onClick={() => setAdOverlayModal({
                                    ...adOverlayModal,
                                    _dropdownOpen: !adOverlayModal._dropdownOpen
                                  })}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'white',
                                    color: adOverlayModal.assetUrl ? '#1f2937' : '#9ca3af',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.borderColor = '#3b82f6'}
                                  onMouseLeave={(e) => e.target.style.borderColor = '#e5e7eb'}
                                >
                                  <span>
                                    {adAssets.find(a => a.url === adOverlayModal.assetUrl)?.name || 'Choose an asset...'}
                                  </span>
                                  <span style={{ fontSize: '12px' }}>▼</span>
                                </button>

                                {adOverlayModal._dropdownOpen && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '4px',
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    zIndex: 1000,
                                    maxHeight: '300px',
                                    overflow: 'auto'
                                  }}>
                                    {adAssets.length === 0 ? (
                                      <div style={{
                                        padding: '12px',
                                        color: '#9ca3af',
                                        fontSize: '14px',
                                        textAlign: 'center'
                                      }}>
                                        No assets available
                                      </div>
                                    ) : (
                                      adAssets.map((asset, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => {
                                            setAdOverlayModal({
                                              ...adOverlayModal,
                                              assetUrl: asset.url,
                                              assetType: asset.type,
                                              _dropdownOpen: false
                                            });
                                          }}
                                          style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: 'none',
                                            backgroundColor: adOverlayModal.assetUrl === asset.url ? '#f0f9ff' : 'white',
                                            color: '#1f2937',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            textAlign: 'left',
                                            borderBottom: idx !== adAssets.length - 1 ? '1px solid #f3f4f6' : 'none',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#f9fafb';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = adOverlayModal.assetUrl === asset.url ? '#f0f9ff' : 'white';
                                          }}
                                        >
                                          {asset.type === 'image' ? (
                                            <img 
                                              src={asset.url}
                                              alt={asset.name}
                                              style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '4px',
                                                objectFit: 'cover',
                                                flexShrink: 0
                                              }}
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                              }}
                                            />
                                          ) : (
                                            <video
                                              src={asset.url}
                                              style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '4px',
                                                objectFit: 'cover',
                                                flexShrink: 0
                                              }}
                                            />
                                          )}
                                          <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{
                                              fontSize: '13px',
                                              fontWeight: '500',
                                              color: '#1f2937',
                                              whiteSpace: 'nowrap',
                                              textOverflow: 'ellipsis',
                                              overflow: 'hidden'
                                            }}>
                                              {asset.name}
                                            </div>
                                            <div style={{
                                              fontSize: '11px',
                                              color: '#9ca3af'
                                            }}>
                                              {asset.type}
                                            </div>
                                          </div>
                                          {adOverlayModal.assetUrl === asset.url && (
                                            <span style={{
                                              fontSize: '16px',
                                              color: '#10b981'
                                            }}>✓</span>
                                          )}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            )}

                            {/* Upload Custom Asset - Only for image/video */}
                            {adOverlayModal.assetType !== 'text' && (
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', display: 'block' }}>
                                Or Upload Custom Asset
                              </label>
                              <div 
                                style={{
                                  padding: '24px',
                                  border: '2px dashed #3b82f6',
                                  borderRadius: '8px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  backgroundColor: '#f0f9ff'
                                }}
                                onDragEnter={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.style.borderColor = '#1e40af';
                                  e.currentTarget.style.backgroundColor = '#e0f2fe';
                                }}
                                onDragLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#3b82f6';
                                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.style.borderColor = '#3b82f6';
                                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                                  if (e.dataTransfer.files?.[0]) {
                                    const file = e.dataTransfer.files[0];
                                    const type = file.type.startsWith('image') ? 'image' : 'video';
                                    setAdOverlayModal({
                                      ...adOverlayModal,
                                      assetUrl: URL.createObjectURL(file),
                                      assetType: type
                                    });
                                  }
                                }}
                                onClick={() => document.getElementById('customAssetInput')?.click()}
                              >
                                <Upload size={28} style={{ color: '#3b82f6', margin: '0 auto 12px' }} />
                                <p style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                  Upload Image or Video
                                </p>
                                <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>
                                  Drag and drop or click to browse
                                </p>
                                <input
                                  id="customAssetInput"
                                  type="file"
                                  accept="image/*,video/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      const file = e.target.files[0];
                                      const type = file.type.startsWith('image') ? 'image' : 'video';
                                      setAdOverlayModal({
                                        ...adOverlayModal,
                                        assetUrl: URL.createObjectURL(file),
                                        assetType: type
                                      });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            )}

                            {/* Text Input for Text Overlay */}
                            {adOverlayModal.assetType === 'text' && (
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', display: 'block' }}>
                                Overlay Text
                              </label>
                              <input
                                type="text"
                                placeholder="Enter overlay text..."
                                value={adOverlayModal.overlayText || ''}
                                onChange={(e) => setAdOverlayModal({
                                  ...adOverlayModal,
                                  overlayText: e.target.value
                                })}
                                style={{
                                  width: '100%',
                                  padding: '10px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  boxSizing: 'border-box',
                                  marginBottom: '8px'
                                }}
                              />
                              <label style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', display: 'block' }}>
                                Text Color
                              </label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="color"
                                  value={adOverlayModal.overlayColor || '#ffffff'}
                                  onChange={(e) => setAdOverlayModal({
                                    ...adOverlayModal,
                                    overlayColor: e.target.value
                                  })}
                                  style={{
                                    width: '50px',
                                    height: '40px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                  }}
                                />
                                <input
                                  type="text"
                                  value={adOverlayModal.overlayColor || '#ffffff'}
                                  onChange={(e) => setAdOverlayModal({
                                    ...adOverlayModal,
                                    overlayColor: e.target.value
                                  })}
                                  style={{
                                    flex: 1,
                                    padding: '8px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '13px'
                                  }}
                                />
                              </div>
                              <label style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', display: 'block', marginTop: '8px' }}>
                                Make Clickable
                              </label>
                              <input
                                type="text"
                                placeholder="Enter URL (optional)..."
                                value={adOverlayModal.overlayUrl || ''}
                                onChange={(e) => setAdOverlayModal({
                                  ...adOverlayModal,
                                  overlayUrl: e.target.value
                                })}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  boxSizing: 'border-box'
                                }}
                              />
                              
                              {/* Link Customization Options */}
                              {adOverlayModal.overlayUrl && (
                                <div style={{
                                  marginTop: '12px',
                                  padding: '10px',
                                  backgroundColor: '#f0f9ff',
                                  borderRadius: '6px',
                                  border: '1px solid #bfdbfe'
                                }}>
                                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', display: 'block' }}>
                                    Link Display Options
                                  </label>
                                  
                                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                      <input
                                        type="radio"
                                        name="linkDisplay"
                                        checked={!adOverlayModal.linkText}
                                        onChange={() => setAdOverlayModal({
                                          ...adOverlayModal,
                                          linkText: undefined
                                        })}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      Default (Icon)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                      <input
                                        type="radio"
                                        name="linkDisplay"
                                        checked={adOverlayModal.linkText === 'text'}
                                        onChange={() => setAdOverlayModal({
                                          ...adOverlayModal,
                                          linkText: 'text'
                                        })}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      Show Text
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                      <input
                                        type="radio"
                                        name="linkDisplay"
                                        checked={adOverlayModal.linkText === 'button'}
                                        onChange={() => setAdOverlayModal({
                                          ...adOverlayModal,
                                          linkText: 'button'
                                        })}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      Button
                                    </label>
                                  </div>
                                  
                                  {adOverlayModal.linkText && (
                                    <input
                                      type="text"
                                      placeholder="Link label text..."
                                      value={adOverlayModal.linkLabel || ''}
                                      onChange={(e) => setAdOverlayModal({
                                        ...adOverlayModal,
                                        linkLabel: e.target.value
                                      })}
                                      style={{
                                        width: '100%',
                                        padding: '6px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        boxSizing: 'border-box'
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                            )}

                            {(adOverlayModal.assetUrl || adOverlayModal.assetType === 'text') && (
                              <div style={{
                                marginBottom: '12px',
                                padding: '12px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                              }}>
                                <p style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>Overlay Preview - Drag & Resize</p>
                                
                                {/* Main Video Preview */}
                                <div data-video-container style={{
                                  width: '100%',
                                  height: '240px',
                                  backgroundColor: '#1f2937',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  aspectRatio: '16/9',
                                  marginBottom: '8px',
                                  cursor: 'default'
                                }}>
                                  {/* Actual Video or Placeholder */}
                                  {selectedAdVideo && videos.find(v => v.id === selectedAdVideo) ? (
                                    <video
                                      data-video-preview
                                      src={videos.find(v => v.id === selectedAdVideo)?.videoUrl}
                                      style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        backgroundColor: '#1f2937',
                                        display: 'block',
                                        zIndex: 1
                                      }}
                                      onLoadedMetadata={(e) => {
                                        setVideoPreviewState(prev => ({
                                          ...prev,
                                          videoDuration: e.target.duration
                                        }));
                                        // Generate thumbnail by seeking to middle of video
                                        if (e.target.duration > 0) {
                                          e.target.currentTime = Math.min(e.target.duration / 2, 5);
                                        }
                                      }}
                                      controls={false}
                                    />
                                  ) : (
                                    <div style={{
                                      position: 'absolute',
                                      width: '100%',
                                      height: '100%',
                                      backgroundColor: '#374151',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#9ca3af',
                                      fontSize: '14px'
                                    }}>
                                      Select a video to preview
                                    </div>
                                  )}

                                  {/* Playback indicator overlay */}
                                  {selectedAdVideo && videoPreviewState.isPlaying && (
                                    <div style={{
                                      position: 'absolute',
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                      pointerEvents: 'none'
                                    }}>
                                      <Play size={48} fill="#f59e0b" color="#f59e0b" style={{ opacity: 0.3 }} />
                                    </div>
                                  )}

                                  {/* Draggable & Resizable Overlay Asset */}
                                  <div 
                                    onMouseDown={(e) => {
                                      // Only drag if clicking on the overlay content, not the resize handle
                                      if (e.target === e.currentTarget || e.target.closest('[data-overlay-content]')) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const containerRect = document.querySelector('[data-video-container]')?.getBoundingClientRect();
                                        if (!containerRect) return;
                                        
                                        const startX = e.clientX;
                                        const startY = e.clientY;
                                        const startPosX = videoPreviewState.overlayPosition.x;
                                        const startPosY = videoPreviewState.overlayPosition.y;
                                        
                                        const handleMouseMove = (moveEvent) => {
                                          moveEvent.preventDefault();
                                          const deltaX = moveEvent.clientX - startX;
                                          const deltaY = moveEvent.clientY - startY;
                                          const deltaXPercent = (deltaX / containerRect.width) * 100;
                                          const deltaYPercent = (deltaY / containerRect.height) * 100;
                                          
                                          setVideoPreviewState(prev => ({
                                            ...prev,
                                            overlayPosition: {
                                              x: Math.max(0, Math.min(100, startPosX + deltaXPercent)),
                                              y: Math.max(0, Math.min(100, startPosY + deltaYPercent))
                                            }
                                          }));
                                        };

                                        const handleMouseUp = () => {
                                          document.removeEventListener('mousemove', handleMouseMove);
                                          document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                      }
                                    }}
                                    onTouchStart={(e) => {
                                      // Only drag if touching the overlay content, not the resize handle
                                      if (e.target === e.currentTarget || e.target.closest('[data-overlay-content]')) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const containerRect = document.querySelector('[data-video-container]')?.getBoundingClientRect();
                                        if (!containerRect || !e.touches[0]) return;
                                        
                                        const startX = e.touches[0].clientX;
                                        const startY = e.touches[0].clientY;
                                        const startPosX = videoPreviewState.overlayPosition.x;
                                        const startPosY = videoPreviewState.overlayPosition.y;
                                        
                                        const handleTouchMove = (moveEvent) => {
                                          moveEvent.preventDefault();
                                          if (!moveEvent.touches[0]) return;
                                          const deltaX = moveEvent.touches[0].clientX - startX;
                                          const deltaY = moveEvent.touches[0].clientY - startY;
                                          const deltaXPercent = (deltaX / containerRect.width) * 100;
                                          const deltaYPercent = (deltaY / containerRect.height) * 100;
                                          
                                          setVideoPreviewState(prev => ({
                                            ...prev,
                                            overlayPosition: {
                                              x: Math.max(0, Math.min(100, startPosX + deltaXPercent)),
                                              y: Math.max(0, Math.min(100, startPosY + deltaYPercent))
                                            }
                                          }));
                                        };

                                        const handleTouchEnd = () => {
                                          document.removeEventListener('touchmove', handleTouchMove);
                                          document.removeEventListener('touchend', handleTouchEnd);
                                        };

                                        document.addEventListener('touchmove', handleTouchMove);
                                        document.addEventListener('touchend', handleTouchEnd);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      // Arrow keys to move asset
                                      const step = e.shiftKey ? 10 : 5; // Shift for larger steps
                                      let newX = videoPreviewState.overlayPosition.x;
                                      let newY = videoPreviewState.overlayPosition.y;

                                      if (e.key === 'ArrowLeft') {
                                        newX = Math.max(0, newX - step);
                                        e.preventDefault();
                                      } else if (e.key === 'ArrowRight') {
                                        newX = Math.min(100, newX + step);
                                        e.preventDefault();
                                      } else if (e.key === 'ArrowUp') {
                                        newY = Math.max(0, newY - step);
                                        e.preventDefault();
                                      } else if (e.key === 'ArrowDown') {
                                        newY = Math.min(100, newY + step);
                                        e.preventDefault();
                                      }

                                      if (e.key.includes('Arrow')) {
                                        setVideoPreviewState(prev => ({
                                          ...prev,
                                          overlayPosition: { x: newX, y: newY }
                                        }));
                                      }
                                    }}
                                    tabIndex={0}
                                    style={{
                                      position: 'absolute',
                                      left: `${videoPreviewState.overlayPosition.x}%`,
                                      top: `${videoPreviewState.overlayPosition.y}%`,
                                      transform: 'translate(-50%, -50%)',
                                      width: `${videoPreviewState.overlaySize.width}%`,
                                      height: `${videoPreviewState.overlaySize.height}%`,
                                      minWidth: '30px',
                                      minHeight: '30px',
                                      zIndex: 10,
                                      cursor: 'grab',
                                      border: '2px dashed #3b82f6',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      overflow: 'hidden',
                                      userSelect: 'none',
                                      outline: 'none',
                                      touchAction: 'none'
                                    }}
                                  >
                                    {/* Overlay Content */}
                                    <div data-overlay-content style={{
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      pointerEvents: 'none'
                                    }}>
                                      {adOverlayModal.assetType === 'text' ? (
                                        <div style={{
                                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                          padding: '12px 16px',
                                          borderRadius: '6px',
                                          color: adOverlayModal.overlayColor || '#ffffff',
                                          fontSize: '16px',
                                          fontWeight: '600',
                                          textAlign: 'center',
                                          wordWrap: 'break-word',
                                          wordBreak: 'break-word'
                                        }}>
                                          {adOverlayModal.overlayText || 'Click here'}
                                          {adOverlayModal.overlayUrl && (
                                            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                                              🔗 {adOverlayModal.overlayUrl}
                                            </div>
                                          )}
                                        </div>
                                      ) : adOverlayModal.assetType === 'image' ? (
                                        <div style={{
                                          width: '100%',
                                          height: '100%',
                                          position: 'relative',
                                          cursor: adOverlayModal.overlayUrl ? 'pointer' : 'default',
                                          pointerEvents: 'auto'
                                        }}
                                          onClick={() => adOverlayModal.overlayUrl && window.open(adOverlayModal.overlayUrl, '_blank')}
                                          title={adOverlayModal.overlayUrl ? `Click to visit: ${adOverlayModal.overlayUrl}` : ''}
                                        >
                                          <img 
                                            src={adOverlayModal.assetUrl} 
                                            alt="preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '2px', pointerEvents: 'none' }}
                                          />
                                          {adOverlayModal.overlayUrl && adOverlayModal.linkText === 'button' && (
                                            <div style={{
                                              position: 'absolute',
                                              bottom: '8px',
                                              right: '8px',
                                              backgroundColor: '#3b82f6',
                                              color: 'white',
                                              padding: '6px 12px',
                                              borderRadius: '4px',
                                              fontSize: '11px',
                                              fontWeight: '600',
                                              pointerEvents: 'none',
                                              cursor: 'pointer'
                                            }}>
                                              {adOverlayModal.linkLabel || 'Visit'}
                                            </div>
                                          )}
                                          {adOverlayModal.overlayUrl && adOverlayModal.linkText === 'text' && (
                                            <div style={{
                                              position: 'absolute',
                                              bottom: '8px',
                                              left: '50%',
                                              transform: 'translateX(-50%)',
                                              backgroundColor: 'rgba(0,0,0,0.7)',
                                              color: 'white',
                                              padding: '4px 8px',
                                              borderRadius: '3px',
                                              fontSize: '10px',
                                              pointerEvents: 'none'
                                            }}>
                                              {adOverlayModal.linkLabel || 'Click to visit'}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div style={{
                                          width: '100%',
                                          height: '100%',
                                          position: 'relative',
                                          cursor: adOverlayModal.overlayUrl ? 'pointer' : 'default',
                                          pointerEvents: 'auto'
                                        }}
                                          onClick={() => adOverlayModal.overlayUrl && window.open(adOverlayModal.overlayUrl, '_blank')}
                                          title={adOverlayModal.overlayUrl ? `Click to visit: ${adOverlayModal.overlayUrl}` : ''}
                                        >
                                          <video 
                                            src={adOverlayModal.assetUrl}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '2px', pointerEvents: 'none' }}
                                          />
                                          {adOverlayModal.overlayUrl && adOverlayModal.linkText === 'button' && (
                                            <div style={{
                                              position: 'absolute',
                                              bottom: '8px',
                                              right: '8px',
                                              backgroundColor: '#3b82f6',
                                              color: 'white',
                                              padding: '6px 12px',
                                              borderRadius: '4px',
                                              fontSize: '11px',
                                              fontWeight: '600',
                                              pointerEvents: 'none',
                                              cursor: 'pointer'
                                            }}>
                                              {adOverlayModal.linkLabel || 'Visit'}
                                            </div>
                                          )}
                                          {adOverlayModal.overlayUrl && adOverlayModal.linkText === 'text' && (
                                            <div style={{
                                              position: 'absolute',
                                              bottom: '8px',
                                              left: '50%',
                                              transform: 'translateX(-50%)',
                                              backgroundColor: 'rgba(0,0,0,0.7)',
                                              color: 'white',
                                              padding: '4px 8px',
                                              borderRadius: '3px',
                                              fontSize: '10px',
                                              pointerEvents: 'none'
                                            }}>
                                              {adOverlayModal.linkLabel || 'Click to visit'}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Resize Handle - Bottom Right Corner */}
                                    <div
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const containerRect = document.querySelector('[data-video-container]')?.getBoundingClientRect();
                                        if (!containerRect) return;
                                        
                                        const startX = e.clientX;
                                        const startY = e.clientY;
                                        const startWidth = videoPreviewState.overlaySize.width;
                                        const startHeight = videoPreviewState.overlaySize.height;

                                        const handleMouseMove = (moveEvent) => {
                                          moveEvent.preventDefault();
                                          const deltaX = moveEvent.clientX - startX;
                                          const deltaY = moveEvent.clientY - startY;
                                          const widthPercent = (deltaX / containerRect.width) * 100;
                                          const heightPercent = (deltaY / containerRect.height) * 100;
                                          
                                          setVideoPreviewState(prev => ({
                                            ...prev,
                                            overlaySize: {
                                              width: Math.max(5, startWidth + widthPercent),
                                              height: Math.max(5, startHeight + heightPercent)
                                            }
                                          }));
                                        };

                                        const handleMouseUp = () => {
                                          document.removeEventListener('mousemove', handleMouseMove);
                                          document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove, true);
                                        document.addEventListener('mouseup', handleMouseUp, true);
                                      }}
                                      onTouchStart={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!e.touches[0]) return;
                                        const containerRect = document.querySelector('[data-video-container]')?.getBoundingClientRect();
                                        if (!containerRect) return;
                                        
                                        const startX = e.touches[0].clientX;
                                        const startY = e.touches[0].clientY;
                                        const startWidth = videoPreviewState.overlaySize.width;
                                        const startHeight = videoPreviewState.overlaySize.height;

                                        const handleTouchMove = (moveEvent) => {
                                          moveEvent.preventDefault();
                                          if (!moveEvent.touches[0]) return;
                                          const deltaX = moveEvent.touches[0].clientX - startX;
                                          const deltaY = moveEvent.touches[0].clientY - startY;
                                          const widthPercent = (deltaX / containerRect.width) * 100;
                                          const heightPercent = (deltaY / containerRect.height) * 100;
                                          
                                          setVideoPreviewState(prev => ({
                                            ...prev,
                                            overlaySize: {
                                              width: Math.max(5, startWidth + widthPercent),
                                              height: Math.max(5, startHeight + heightPercent)
                                            }
                                          }));
                                        };

                                        const handleTouchEnd = () => {
                                          document.removeEventListener('touchmove', handleTouchMove);
                                          document.removeEventListener('touchend', handleTouchEnd);
                                        };

                                        document.addEventListener('touchmove', handleTouchMove, true);
                                        document.addEventListener('touchend', handleTouchEnd, true);
                                      }}
                                      style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        right: '-4px',
                                        width: '24px',
                                        height: '24px',
                                        backgroundColor: '#3b82f6',
                                        cursor: 'nwse-resize',
                                        borderRadius: '2px',
                                        zIndex: 25,
                                        pointerEvents: 'auto',
                                        touchAction: 'none',
                                        border: '2px solid white',
                                        boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                                      }}
                                      title="Drag to resize"
                                    />

                                    {/* Resize Handle - Right Edge */}
                                    <div
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const containerRect = document.querySelector('[data-video-container]')?.getBoundingClientRect();
                                        if (!containerRect) return;
                                        
                                        const startX = e.clientX;
                                        const startWidth = videoPreviewState.overlaySize.width;

                                        const handleMouseMove = (moveEvent) => {
                                          moveEvent.preventDefault();
                                          const deltaX = moveEvent.clientX - startX;
                                          const widthPercent = (deltaX / containerRect.width) * 100;
                                          
                                          setVideoPreviewState(prev => ({
                                            ...prev,
                                            overlaySize: {
                                              ...prev.overlaySize,
                                              width: Math.max(5, startWidth + widthPercent)
                                            }
                                          }));
                                        };

                                        const handleMouseUp = () => {
                                          document.removeEventListener('mousemove', handleMouseMove);
                                          document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove, true);
                                        document.addEventListener('mouseup', handleMouseUp, true);
                                      }}
                                      onTouchStart={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!e.touches[0]) return;
                                        const containerRect = document.querySelector('[data-video-container]')?.getBoundingClientRect();
                                        if (!containerRect) return;
                                        
                                        const startX = e.touches[0].clientX;
                                        const startWidth = videoPreviewState.overlaySize.width;

                                        const handleTouchMove = (moveEvent) => {
                                          moveEvent.preventDefault();
                                          if (!moveEvent.touches[0]) return;
                                          const deltaX = moveEvent.touches[0].clientX - startX;
                                          const widthPercent = (deltaX / containerRect.width) * 100;
                                          
                                          setVideoPreviewState(prev => ({
                                            ...prev,
                                            overlaySize: {
                                              ...prev.overlaySize,
                                              width: Math.max(5, startWidth + widthPercent)
                                            }
                                          }));
                                        };

                                        const handleTouchEnd = () => {
                                          document.removeEventListener('touchmove', handleTouchMove);
                                          document.removeEventListener('touchend', handleTouchEnd);
                                        };

                                        document.addEventListener('touchmove', handleTouchMove, true);
                                        document.addEventListener('touchend', handleTouchEnd, true);
                                      }}
                                      style={{
                                        position: 'absolute',
                                        top: '0',
                                        right: '-4px',
                                        width: '8px',
                                        height: '100%',
                                        cursor: 'ew-resize',
                                        zIndex: 20,
                                        pointerEvents: 'auto',
                                        touchAction: 'none'
                                      }}
                                      title="Drag right edge to resize"
                                    />

                                    {/* Resize Handle - Bottom Edge */}
                                    <div
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const containerRect = document.querySelector('[data-video-container]')?.getBoundingClientRect();
                                        if (!containerRect) return;
                                        
                                        const startY = e.clientY;
                                        const startHeight = videoPreviewState.overlaySize.height;

                                        const handleMouseMove = (moveEvent) => {
                                          moveEvent.preventDefault();
                                          const deltaY = moveEvent.clientY - startY;
                                          const heightPercent = (deltaY / containerRect.height) * 100;
                                          
                                          setVideoPreviewState(prev => ({
                                            ...prev,
                                            overlaySize: {
                                              ...prev.overlaySize,
                                              height: Math.max(5, startHeight + heightPercent)
                                            }
                                          }));
                                        };

                                        const handleMouseUp = () => {
                                          document.removeEventListener('mousemove', handleMouseMove);
                                          document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove, true);
                                        document.addEventListener('mouseup', handleMouseUp, true);
                                      }}
                                      onTouchStart={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!e.touches[0]) return;
                                        const containerRect = document.querySelector('[data-video-container]')?.getBoundingClientRect();
                                        if (!containerRect) return;
                                        
                                        const startY = e.touches[0].clientY;
                                        const startHeight = videoPreviewState.overlaySize.height;

                                        const handleTouchMove = (moveEvent) => {
                                          moveEvent.preventDefault();
                                          if (!moveEvent.touches[0]) return;
                                          const deltaY = moveEvent.touches[0].clientY - startY;
                                          const heightPercent = (deltaY / containerRect.height) * 100;
                                          
                                          setVideoPreviewState(prev => ({
                                            ...prev,
                                            overlaySize: {
                                              ...prev.overlaySize,
                                              height: Math.max(5, startHeight + heightPercent)
                                            }
                                          }));
                                        };

                                        const handleTouchEnd = () => {
                                          document.removeEventListener('touchmove', handleTouchMove);
                                          document.removeEventListener('touchend', handleTouchEnd);
                                        };

                                        document.addEventListener('touchmove', handleTouchMove, true);
                                        document.addEventListener('touchend', handleTouchEnd, true);
                                      }}
                                      style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        left: '0',
                                        width: '100%',
                                        height: '8px',
                                        cursor: 'ns-resize',
                                        zIndex: 20,
                                        pointerEvents: 'auto',
                                        touchAction: 'none'
                                      }}
                                      title="Drag bottom edge to resize"
                                    />
                                  </div>

                                  {/* Timeline Control at bottom */}
                                  <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '44px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderTop: '1px solid #555',
                                    zIndex: 20
                                  }}>
                                    {/* Progress bar section */}
                                    <div style={{
                                      flex: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      paddingLeft: '8px',
                                      paddingRight: '8px',
                                      gap: '8px'
                                    }}>
                                      {/* Play/Pause button - Click only */}
                                      <button
                                        onClick={() => setVideoPreviewState({
                                          ...videoPreviewState,
                                          isPlaying: !videoPreviewState.isPlaying
                                        })}
                                        style={{
                                          width: '26px',
                                          height: '26px',
                                          borderRadius: '50%',
                                          backgroundColor: '#f59e0b',
                                          border: 'none',
                                          color: 'white',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          flexShrink: 0,
                                          transition: 'all 0.2s',
                                          userSelect: 'none',
                                          zIndex: 100,
                                          padding: 0
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.opacity = '0.9';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.opacity = '1';
                                        }}
                                        title="Click to play/pause"
                                      >
                                        {videoPreviewState.isPlaying ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" />}
                                      </button>

                                      {/* Progress bar - Full width DRAGGABLE */}
                                      <div 
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          
                                          const updatePosition = (clientX) => {
                                            const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                                            const selectedVideo = videos.find(v => v.id === selectedAdVideo);
                                            const videoDuration = selectedVideo?.duration || videoPreviewState.videoDuration || 100;
                                            const newTime = percent * videoDuration;
                                            
                                            setAdOverlayModal(prev => ({
                                              ...prev,
                                              startTime: newTime
                                            }));
                                            setVideoPreviewState(prev => ({
                                              ...prev,
                                              currentTime: newTime
                                            }));
                                          };

                                          updatePosition(e.clientX);
                                          
                                          const handleMouseMove = (moveEvent) => {
                                            moveEvent.preventDefault();
                                            updatePosition(moveEvent.clientX);
                                          };

                                          const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                          };

                                          document.addEventListener('mousemove', handleMouseMove, true);
                                          document.addEventListener('mouseup', handleMouseUp, true);
                                        }}
                                        onTouchStart={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (!e.touches[0]) return;
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          
                                          const updatePosition = (clientX) => {
                                            const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                                            const selectedVideo = videos.find(v => v.id === selectedAdVideo);
                                            const videoDuration = selectedVideo?.duration || videoPreviewState.videoDuration || 100;
                                            const newTime = percent * videoDuration;
                                            
                                            setAdOverlayModal(prev => ({
                                              ...prev,
                                              startTime: newTime
                                            }));
                                            setVideoPreviewState(prev => ({
                                              ...prev,
                                              currentTime: newTime
                                            }));
                                          };

                                          updatePosition(e.touches[0].clientX);
                                          
                                          const handleTouchMove = (moveEvent) => {
                                            moveEvent.preventDefault();
                                            if (!moveEvent.touches[0]) return;
                                            updatePosition(moveEvent.touches[0].clientX);
                                          };

                                          const handleTouchEnd = () => {
                                            document.removeEventListener('touchmove', handleTouchMove);
                                            document.removeEventListener('touchend', handleTouchEnd);
                                          };

                                          document.addEventListener('touchmove', handleTouchMove, true);
                                          document.addEventListener('touchend', handleTouchEnd, true);
                                        }}
                                        style={{
                                          flex: 1,
                                          height: '8px',
                                          backgroundColor: '#555',
                                          borderRadius: '4px',
                                          position: 'relative',
                                          cursor: 'pointer',
                                          zIndex: 30,
                                          display: 'flex',
                                          alignItems: 'center',
                                          pointerEvents: 'auto',
                                          touchAction: 'none'
                                        }}
                                      >
                                        <div style={{
                                          width: `${((videoPreviewState.currentTime || adOverlayModal.startTime || 0) / (videos.find(v => v.id === selectedAdVideo)?.duration || videoPreviewState.videoDuration || 100)) * 100}%`,
                                          height: '100%',
                                          backgroundColor: '#3b82f6',
                                          borderRadius: '4px',
                                          position: 'relative',
                                          pointerEvents: 'none'
                                        }}>
                                          <div style={{
                                            position: 'absolute',
                                            right: '-5px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '12px',
                                            height: '12px',
                                            backgroundColor: '#3b82f6',
                                            borderRadius: '50%',
                                            boxShadow: '0 0 4px rgba(59, 130, 246, 1)',
                                            pointerEvents: 'none'
                                          }} />
                                        </div>
                                      </div>

                                      {/* Time display - Show current time and total duration */}
                                      <span style={{
                                        color: '#fff',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap',
                                        minWidth: '60px',
                                        textAlign: 'right'
                                      }}>
                                        {formatTimeCompact(videoPreviewState.currentTime || adOverlayModal.startTime || 0)} / {formatTimeCompact(videos.find(v => v.id === selectedAdVideo)?.duration || videoPreviewState.videoDuration || 0)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Frame Strip Below - Horizontally Scrollable */}
                                <div style={{
                                  width: '100%',
                                  height: '50px',
                                  backgroundColor: '#1f2937',
                                  borderRadius: '6px',
                                  overflow: 'auto',
                                  display: 'flex',
                                  gap: '2px',
                                  padding: '4px',
                                  boxSizing: 'border-box',
                                  border: '1px solid #374151',
                                  scrollBehavior: 'smooth'
                                }}>
                                  {Array.from({ length: 12 }).map((_, idx) => (
                                    <div key={idx} style={{
                                      flex: '0 0 auto',
                                      width: '40px',
                                      minWidth: '40px',
                                      height: '100%',
                                      backgroundColor: '#374151',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#9ca3af',
                                      fontSize: '9px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      border: idx === Math.floor((videoPreviewState.currentTime || adOverlayModal.startTime || 0) / ((video?.duration || 100) / 12)) ? '1px solid #3b82f6' : '1px solid transparent',
                                      whiteSpace: 'nowrap'
                                    }}
                                    onClick={() => {
                                      const newTime = (idx / 12) * (video?.duration || 100);
                                      setAdOverlayModal({
                                        ...adOverlayModal,
                                        startTime: newTime
                                      });
                                      setVideoPreviewState({
                                        ...videoPreviewState,
                                        currentTime: newTime
                                      });
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#555'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#374151'}
                                    >
                                      {formatTimeCompact((idx / 12) * (video?.duration || 100))}
                                    </div>
                                  ))}
                                </div>

                                {/* Overlay Duration - Below Frame Strip */}
                                <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', display: 'block' }}>
                                    Overlay Duration (seconds)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    defaultValue="5"
                                    style={{
                                      width: '100%',
                                      padding: '8px',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      boxSizing: 'border-box'
                                    }}
                                    onChange={(e) => setAdOverlayModal({
                                      ...adOverlayModal,
                                      duration: parseInt(e.target.value)
                                    })}
                                  />
                                </div>

                                {/* Make Overlay Clickable - For Image/Video */}
                                {adOverlayModal.assetType !== 'text' && (
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', display: 'block' }}>
                                    Make Clickable (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Enter URL to make this overlay clickable..."
                                    value={adOverlayModal.overlayUrl || ''}
                                    onChange={(e) => setAdOverlayModal({
                                      ...adOverlayModal,
                                      overlayUrl: e.target.value
                                    })}
                                    style={{
                                      width: '100%',
                                      padding: '8px',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '6px',
                                      fontSize: '13px',
                                      boxSizing: 'border-box',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  />
                                  {adOverlayModal.overlayUrl && (
                                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#10b981' }}>
                                      ✓ Overlay will be clickable: {adOverlayModal.overlayUrl}
                                    </div>
                                  )}
                                </div>
                                )}
                              </div>
                            )}

                            {/* Add Button */}
                            <button
                              onClick={() => {
                                if ((adOverlayModal.assetUrl || adOverlayModal.assetType === 'text') && adOverlayModal.videoId) {
                                  const newOverlay = {
                                    id: Date.now(),
                                    videoId: adOverlayModal.videoId,
                                    assetType: adOverlayModal.assetType,
                                    startTime: adOverlayModal.startTime,
                                    duration: adOverlayModal.duration || 5,
                                    x: videoPreviewState.overlayPosition.x,
                                    y: videoPreviewState.overlayPosition.y,
                                    width: videoPreviewState.overlaySize.width,
                                    height: videoPreviewState.overlaySize.height,
                                    ...(adOverlayModal.assetType === 'text' ? {
                                      text: adOverlayModal.overlayText || 'Click here',
                                      color: adOverlayModal.overlayColor || '#ffffff',
                                      clickUrl: adOverlayModal.overlayUrl || null
                                    } : {
                                      assetUrl: adOverlayModal.assetUrl,
                                      clickUrl: adOverlayModal.overlayUrl || null
                                    })
                                  };
                                  setAdOverlays([...adOverlays, newOverlay]);
                                  setAdOverlayModal({ isOpen: false, assetUrl: '', assetType: 'image', videoId: null, startTime: 0, duration: null, _dropdownOpen: false, overlayText: '', overlayColor: '#ffffff', overlayUrl: '' });
                                  setSelectedAdVideo(null);
                                  setVideoPreviewState({ isPlaying: false, currentTime: 0, overlayPosition: { x: 50, y: 50 }, overlaySize: { width: 80, height: 60 }, isDragging: false, dragStart: { x: 0, y: 0 } });
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: (adOverlayModal.assetUrl || adOverlayModal.assetType === 'text') && adOverlayModal.videoId ? '#f59e0b' : '#e5e7eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: (adOverlayModal.assetUrl || adOverlayModal.assetType === 'text') && adOverlayModal.videoId ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => (adOverlayModal.assetUrl || adOverlayModal.assetType === 'text') && adOverlayModal.videoId && (e.target.style.opacity = '0.9')}
                              onMouseLeave={(e) => (adOverlayModal.assetUrl || adOverlayModal.assetType === 'text') && adOverlayModal.videoId && (e.target.style.opacity = '1')}
                            >
                              Add Overlay to Video
                            </button>
                          </div>
                        )}

                        {/* Show existing overlays for this video */}
                        {adOverlays.filter(o => o.videoId === video.id).length > 0 && (
                          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: '#666', margin: '0 0 8px 0' }}>
                              Active Overlays ({adOverlays.filter(o => o.videoId === video.id).length})
                            </p>
                            {adOverlays.filter(o => o.videoId === video.id).map(overlay => (
                              <div key={overlay.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                fontSize: '12px',
                                color: '#666'
                              }}>
                                <span>
                                  {formatTimeCompact(overlay.startTime)} - {overlay.duration}s ({overlay.assetType})
                                  {overlay.clickUrl && ' 🔗'}
                                  {overlay.assetType === 'text' && ` - "${overlay.text}"`}
                                </span>
                                <button
                                  onClick={() => setAdOverlays(adOverlays.filter(o => o.id !== overlay.id))}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                                >
                                  <Trash size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Promotion Modal */}
        {promotionModal.isOpen && (
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
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>
                Create Promotion
              </h2>
              <button
                onClick={() => setPromotionModal({ isOpen: false, title: '', message: '', recipientType: 'individual', selectedUsers: [], promotionType: 'offer' })}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '0'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                Promotion Type
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setPromotionTypeDropdown(!promotionTypeDropdown)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#ffffff',
                    color: '#1f2937',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    {promotionModal.promotionType === 'offer' && '🎁 Special Offer'}
                    {promotionModal.promotionType === 'announcement' && '📢 Announcement'}
                    {promotionModal.promotionType === 'feature' && '⭐ Featured'}
                  </span>
                  <ChevronDown size={18} style={{ transform: promotionTypeDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
                {promotionTypeDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, promotionType: 'offer' });
                        setPromotionTypeDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.promotionType === 'offer' ? '#f59e0b20' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f59e0b10'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.promotionType === 'offer' ? '#f59e0b20' : 'white'}
                    >
                      <Gift size={18} style={{ color: '#f59e0b' }} /> Special Offer
                    </button>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, promotionType: 'announcement' });
                        setPromotionTypeDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.promotionType === 'announcement' ? '#3b82f620' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#3b82f610'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.promotionType === 'announcement' ? '#3b82f620' : 'white'}
                    >
                      <Megaphone size={18} style={{ color: '#3b82f6' }} /> Announcement
                    </button>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, promotionType: 'feature' });
                        setPromotionTypeDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.promotionType === 'feature' ? '#10b98120' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '0 0 6px 6px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#10b98110'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.promotionType === 'feature' ? '#10b98120' : 'white'}
                    >
                      <Star size={18} style={{ color: '#10b981' }} /> Featured
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                Title
              </label>
              <input
                type="text"
                value={promotionModal.title}
                onChange={(e) => setPromotionModal({ ...promotionModal, title: e.target.value })}
                placeholder="e.g., New Feature Launch, 50% Off Boost..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                Message
              </label>
              <textarea
                value={promotionModal.message}
                onChange={(e) => setPromotionModal({ ...promotionModal, message: e.target.value })}
                placeholder="Describe the promotion or announcement..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  minHeight: '100px',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                Send To
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setSendToDropdown(!sendToDropdown)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#ffffff',
                    color: '#1f2937',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    {promotionModal.recipientType === 'all' && '📢 All Users'}
                    {promotionModal.recipientType === 'creators' && '👑 Creators Only'}
                    {promotionModal.recipientType === 'individual' && '👤 Select Users'}
                  </span>
                  <ChevronDown size={18} style={{ transform: sendToDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
                {sendToDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, recipientType: 'all' });
                        setSendToDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.recipientType === 'all' ? '#10b98120' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#10b98110'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.recipientType === 'all' ? '#10b98120' : 'white'}
                    >
                      <Megaphone size={18} style={{ color: '#10b981' }} /> All Users
                    </button>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, recipientType: 'creators' });
                        setSendToDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.recipientType === 'creators' ? '#f59e0b20' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f59e0b10'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.recipientType === 'creators' ? '#f59e0b20' : 'white'}
                    >
                      <Crown size={18} style={{ color: '#f59e0b' }} /> Creators Only
                    </button>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, recipientType: 'individual' });
                        setSendToDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.recipientType === 'individual' ? '#3b82f620' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '0 0 6px 6px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#3b82f610'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.recipientType === 'individual' ? '#3b82f620' : 'white'}
                    >
                      <Users size={18} style={{ color: '#3b82f6' }} /> Select Users
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Selection for Individual Promotions */}
            {promotionModal.recipientType === 'individual' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0' }}>SELECT USERS</p>
                  <button
                    onClick={() => {
                      if (promotionModal.selectedUsers.length === users.length) {
                        setPromotionModal({ ...promotionModal, selectedUsers: [] });
                      } else {
                        setPromotionModal({ ...promotionModal, selectedUsers: users.map(u => u.id) });
                      }
                    }}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: promotionModal.selectedUsers.length === users.length ? '#3b82f6' : '#e5e7eb',
                      color: promotionModal.selectedUsers.length === users.length ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    {promotionModal.selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  backgroundColor: '#f9fafb'
                }}>
                  {users.length === 0 ? (
                    <div style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: '#9ca3af',
                      fontSize: '13px'
                    }}>
                      No users available
                    </div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          backgroundColor: promotionModal.selectedUsers.includes(user.id) ? '#dbeafe' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => {
                          const isSelected = promotionModal.selectedUsers.includes(user.id);
                          setPromotionModal({
                            ...promotionModal,
                            selectedUsers: isSelected
                              ? promotionModal.selectedUsers.filter(id => id !== user.id)
                              : [...promotionModal.selectedUsers, user.id]
                          });
                        }}
                        onMouseEnter={(e) => {
                          if (!promotionModal.selectedUsers.includes(user.id)) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!promotionModal.selectedUsers.includes(user.id)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={promotionModal.selectedUsers.includes(user.id)}
                          onChange={() => {}}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#3b82f6'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            margin: '0',
                            color: '#1f2937'
                          }}>
                            {user.name}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            margin: '2px 0 0 0',
                            color: '#666'
                          }}>
                            {user.email}
                          </p>
                        </div>
                        {user.isCreator && (
                          <span style={{
                            fontSize: '11px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Crown size={12} /> Creator
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {promotionModal.selectedUsers.length > 0 && (
                  <p style={{
                    fontSize: '12px',
                    color: '#3b82f6',
                    margin: '8px 0 0 0',
                    fontWeight: '600'
                  }}>
                    ✓ {promotionModal.selectedUsers.length} user{promotionModal.selectedUsers.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

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

            {/* Promotion Preview */}
            {promotionModal.title && (
              <div style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0', textTransform: 'uppercase' }}>Preview - How Users Will See It</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setPreviewColor('#f59e0b')}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#f59e0b',
                        border: previewColor === '#f59e0b' ? '3px solid #1f2937' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Orange"
                    />
                    <button
                      onClick={() => setPreviewColor('#ef4444')}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        border: previewColor === '#ef4444' ? '3px solid #1f2937' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Red"
                    />
                    <button
                      onClick={() => setPreviewColor('#3b82f6')}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        border: previewColor === '#3b82f6' ? '3px solid #1f2937' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Blue"
                    />
                    <button
                      onClick={() => setPreviewColor('#10b981')}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        border: previewColor === '#10b981' ? '3px solid #1f2937' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Green"
                    />
                    <button
                      onClick={() => setPreviewColor('#8b5cf6')}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#8b5cf6',
                        border: previewColor === '#8b5cf6' ? '3px solid #1f2937' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Purple"
                    />
                  </div>
                </div>
                
                {/* Notification Card Preview */}
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '24px 20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  textAlign: 'center',
                  maxWidth: '320px',
                  margin: '0 auto'
                }}>
                  {/* Icon Circle */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    backgroundColor: previewColor + '20'
                  }}>
                    {promotionModal.promotionType === 'offer' && <Gift size={32} style={{ color: previewColor }} />}
                    {promotionModal.promotionType === 'announcement' && <Megaphone size={32} style={{ color: previewColor }} />}
                    {promotionModal.promotionType === 'feature' && <Star size={32} style={{ color: previewColor }} />}
                  </div>

                  {/* Header/Title */}
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    margin: '0 0 8px 0',
                    color: '#1f2937'
                  }}>
                    {promotionModal.promotionType === 'offer' && 'Special Offer'}
                    {promotionModal.promotionType === 'announcement' && 'Announcement'}
                    {promotionModal.promotionType === 'feature' && 'Featured Content'}
                  </h3>

                  {/* Subheader with recipient info */}
                  <p style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    {promotionModal.recipientType === 'all' && (
                      <>
                        <Megaphone size={14} /> For All Users
                      </>
                    )}
                    {promotionModal.recipientType === 'creators' && (
                      <>
                        <Crown size={14} /> For Creators
                      </>
                    )}
                    {promotionModal.recipientType === 'individual' && (
                      <>
                        <Users size={14} /> For {promotionModal.selectedUsers.length} user{promotionModal.selectedUsers.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </p>

                  {/* Main Title */}
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    margin: '0 0 12px 0',
                    color: '#1f2937',
                    wordBreak: 'break-word',
                    lineHeight: '1.4'
                  }}>
                    {promotionModal.title}
                  </h2>

                  {/* Message Text */}
                  <p style={{
                    fontSize: '14px',
                    color: '#4b5563',
                    margin: '0 0 20px 0',
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {promotionModal.message}
                  </p>

                  {/* Action Button */}
                  <button style={{
                    padding: '12px 24px',
                    backgroundColor: previewColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    width: '100%',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Learn More
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleSendPromotion}
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
                Send Promotion
              </button>
              <button
                onClick={() => setPromotionModal({ isOpen: false, title: '', message: '', recipientType: 'individual', selectedUsers: [], promotionType: 'offer' })}
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
        title="Go to App"
      >
        <Home size={24} />
        <span>App</span>
      </button>
      <button
        onClick={() => setActiveTab('promotions')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          width: '50px',
          height: '50px',
          backgroundColor: activeTab === 'promotions' ? '#f0f4f8' : 'transparent',
          color: activeTab === 'promotions' ? '#f59e0b' : '#666',
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
          e.currentTarget.style.color = '#f59e0b';
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'promotions') {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#666';
          }
        }}
        title="Manage Promotions"
      >
        <Megaphone size={24} />
        <span>Promotions</span>
      </button>
      <button
        onClick={() => setActiveTab('ads')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          width: '50px',
          height: '50px',
          backgroundColor: activeTab === 'ads' ? '#f0f4f8' : 'transparent',
          color: activeTab === 'ads' ? '#10b981' : '#666',
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
          e.currentTarget.style.color = '#10b981';
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'ads') {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#666';
          }
        }}
        title="Manage Ads"
      >
        <Image size={24} />
        <span>Ads</span>
      </button>
    </footer>
    </>
  );
}
