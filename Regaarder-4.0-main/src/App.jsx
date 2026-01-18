import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import * as eventBus from './eventbus.js';
import React, { useState, useEffect, useTransition, Suspense, lazy } from 'react';
import PageLoadingSkeleton from './PageLoadingSkeleton.jsx';

// Lazy load all page components for faster initial load
const Home = lazy(() => import('./home.jsx'));
const Ideas = lazy(() => import('./ideas.jsx'));
const Requests = lazy(() => import('./requests.jsx'));
const Notifications = lazy(() => import('./notifications.jsx'));
const More = lazy(() => import('./more.jsx'));
const WatchHistory = lazy(() => import('./watchhistory.jsx'));
const WatchTogether = lazy(() => import('./watchtogether.jsx'));
const Marketplace = lazy(() => import('./Marketplace.jsx'));
const Sponsorship = lazy(() => import('./sponsorship.jsx'));
const Subscriptions = lazy(() => import('./subscriptions.jsx'));
const Videoplayer = lazy(() => import('./Videoplayer.jsx'));
const AdvertiseWithUs = lazy(() => import('./advertisewithus.jsx'));
const CreatorDashboard = lazy(() => import('./creatordashboard.jsx'));
const CreatorProfile = lazy(() => import('./creatorprofile.jsx'));
const UserProfile = lazy(() => import('./userprofile.jsx'));
const Settings = lazy(() => import('./settings.jsx'));
const LikedVideos = lazy(() => import('./likedvideos.jsx'));
const Bookmarks = lazy(() => import('./bookmarks.jsx'));
const Playlist = lazy(() => import('./playlists.jsx'));
const Referrals = lazy(() => import('./referrals.jsx'));
const Policies = lazy(() => import('./policies.jsx'));
const StaffDashboard = lazy(() => import('./StaffDashboard.jsx'));

// Main footer tab switcher component
function FooterTabSwitcher() {
  const [activeTab, setActiveTab] = useState('home');
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path or window global
  useEffect(() => {
    const path = location.pathname.replace('/', '');
    const mainTabs = ['home', 'ideas', 'requests', 'more'];
    if (mainTabs.includes(path)) {
      setActiveTab(path);
    } else if (path === '' || path === 'home.jsx') {
      setActiveTab('home');
    }
  }, [location.pathname]);

  // Store setActiveTab in window for external access (footer buttons)
  // This allows footer components to trigger tab switches instantly
  useEffect(() => {
    window.setFooterTab = setActiveTab;
    // Sync back if window.currentFooterTab was set (for footer components)
    if (window.currentFooterTab && window.currentFooterTab !== activeTab) {
      setActiveTab(window.currentFooterTab);
    }
    return () => {
      // Don't delete - footer components need this
    };
  }, [activeTab]);

  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      {/* Main tab content - switched based on activeTab */}
      {/* Components remain mounted for instant switching */}
      <div style={{ display: activeTab === 'home' ? 'block' : 'none', position: activeTab === 'home' ? 'relative' : 'absolute', visibility: activeTab === 'home' ? 'visible' : 'hidden' }}>
        <Home />
      </div>
      <div style={{ display: activeTab === 'ideas' ? 'block' : 'none', position: activeTab === 'ideas' ? 'relative' : 'absolute', visibility: activeTab === 'ideas' ? 'visible' : 'hidden' }}>
        <Ideas />
      </div>
      <div style={{ display: activeTab === 'requests' ? 'block' : 'none', position: activeTab === 'requests' ? 'relative' : 'absolute', visibility: activeTab === 'requests' ? 'visible' : 'hidden' }}>
        <Requests />
      </div>
      <div style={{ display: activeTab === 'more' ? 'block' : 'none', position: activeTab === 'more' ? 'relative' : 'absolute', visibility: activeTab === 'more' ? 'visible' : 'hidden' }}>
        <More />
      </div>
    </Suspense>
  );
}

function App() {
  const [overrideView, setOverrideView] = useState(null);
  const [overridePayload, setOverridePayload] = useState(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const off = eventBus.on('switchToHomeOnly', (data) => {
      startTransition(() => {
        setOverrideView('home');
        setOverridePayload(data || null);
      });
    });
    const off2 = eventBus.on('clearOverride', () => {
      startTransition(() => {
        setOverrideView(null);
        setOverridePayload(null);
      });
    });
    return () => { try { off(); } catch (e) {} try { off2(); } catch (e) {} };
  }, []);

  return (
    <BrowserRouter>
      {isPending ? (
        <PageLoadingSkeleton />
      ) : overrideView === 'home' ? (
        <Home overrideMiniPlayerData={overridePayload} />
      ) : (
      <Suspense fallback={<PageLoadingSkeleton />}>
        <Routes>
          {/* Main footer tabs - use tab switcher for instant switching */}
          <Route path="/" element={<FooterTabSwitcher />} />
          <Route path="/home" element={<FooterTabSwitcher />} />
          <Route path="/home.jsx" element={<FooterTabSwitcher />} />
          <Route path="/ideas" element={<FooterTabSwitcher />} />
          <Route path="/ideas.jsx" element={<FooterTabSwitcher />} />
          <Route path="/requests" element={<FooterTabSwitcher />} />
          <Route path="/requests.jsx" element={<FooterTabSwitcher />} />
          <Route path="/more" element={<FooterTabSwitcher />} />
          <Route path="/more.jsx" element={<FooterTabSwitcher />} />
          
          {/* Other routes - keep normal routing */}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/watchhistory" element={<WatchHistory />} />
          <Route path="/watchtogether" element={<WatchTogether />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/sponsorship" element={<Sponsorship />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/videoplayer" element={<Videoplayer />} />
          <Route path="/advertisewithus" element={<AdvertiseWithUs />} />
          <Route path="/creatordashboard" element={<CreatorDashboard />} />
          <Route path="/creatorprofile" element={<CreatorProfile />} />
          <Route path="/userprofile" element={<UserProfile />} />
          
          {/* Additional sidebar routes - they can redirect to home or show placeholder */}
          <Route path="/yourprofile" element={<UserProfile />} />
          <Route path="/yourrequests" element={<Requests />} />
          <Route path="/trackyourrequests" element={<Requests />} />
          <Route path="/referralrewards" element={<Referrals />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/likedvideos" element={<LikedVideos />} />
          <Route path="/following" element={<Home />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/myfolders" element={<Navigate to="/playlist" replace />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/upgradetopremium" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Fallback routes for .jsx extensions (redirects) */}
          <Route path="/notifications.jsx" element={<Navigate to="/notifications" replace />} />
          <Route path="/watchhistory.jsx" element={<Navigate to="/watchhistory" replace />} />
          <Route path="/watchtogether.jsx" element={<Navigate to="/watchtogether" replace />} />
          <Route path="/marketplace.jsx" element={<Navigate to="/marketplace" replace />} />
          <Route path="/Marketplace.jsx" element={<Navigate to="/marketplace" replace />} />
          <Route path="/sponsorship.jsx" element={<Navigate to="/sponsorship" replace />} />
          <Route path="/Sponsorship.jsx" element={<Navigate to="/sponsorship" replace />} />
          <Route path="/videoplayer.jsx" element={<Navigate to="/videoplayer" replace />} />
          <Route path="/Videoplayer.jsx" element={<Navigate to="/videoplayer" replace />} />
          <Route path="/advertisewithus.jsx" element={<Navigate to="/advertisewithus" replace />} />
          <Route path="/creatordashboard.jsx" element={<Navigate to="/creatordashboard" replace />} />
          <Route path="/creatorprofile.jsx" element={<Navigate to="/creatorprofile" replace />} />
          <Route path="/userprofile.jsx" element={<Navigate to="/userprofile" replace />} />
        </Routes>
      </Suspense>
      )
      }
    </BrowserRouter>
  );
}

export default App;
