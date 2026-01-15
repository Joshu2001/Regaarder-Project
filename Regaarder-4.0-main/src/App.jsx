import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './home.jsx';
import * as eventBus from './eventbus.js';
import React, { useState, useEffect } from 'react';
import Ideas from './ideas.jsx';
import Requests from './requests.jsx';
import Notifications from './notifications.jsx';
import More from './more.jsx';
import WatchHistory from './watchhistory.jsx';
import WatchTogether from './watchtogether.jsx';
import Marketplace from './Marketplace.jsx';
import Sponsorship from './sponsorship.jsx';
import Subscriptions from './subscriptions.jsx';
import Videoplayer from './Videoplayer.jsx';
import AdvertiseWithUs from './advertisewithus.jsx';
import CreatorDashboard from './creatordashboard.jsx';
import CreatorProfile from './creatorprofile.jsx';
import UserProfile from './userprofile.jsx';
import Settings from './settings.jsx';
import LikedVideos from './likedvideos.jsx';
import Bookmarks from './bookmarks.jsx';
import Playlist from './playlists.jsx';
import Referrals from './referrals.jsx';
import Policies from './policies.jsx';

function App() {
  const [overrideView, setOverrideView] = useState(null);
  const [overridePayload, setOverridePayload] = useState(null);

  useEffect(() => {
    const off = eventBus.on('switchToHomeOnly', (data) => {
      setOverrideView('home');
      setOverridePayload(data || null);
    });
    const off2 = eventBus.on('clearOverride', () => { setOverrideView(null); setOverridePayload(null); });
    return () => { try { off(); } catch (e) {} try { off2(); } catch (e) {} };
  }, []);

  return (
    <BrowserRouter>
      {overrideView === 'home' ? (
        <Home overrideMiniPlayerData={overridePayload} />
      ) : (
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
      )
      }
    </BrowserRouter>
  );
}

export default App;
