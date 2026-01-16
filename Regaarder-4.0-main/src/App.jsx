import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/more" element={<More />} />
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
          <Route path="/upgradetopremium" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Fallback routes for .jsx extensions (redirects) */}
          <Route path="/home.jsx" element={<Navigate to="/home" replace />} />
          <Route path="/ideas.jsx" element={<Navigate to="/ideas" replace />} />
          <Route path="/requests.jsx" element={<Navigate to="/requests" replace />} />
          <Route path="/notifications.jsx" element={<Navigate to="/notifications" replace />} />
          <Route path="/more.jsx" element={<Navigate to="/more" replace />} />
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
