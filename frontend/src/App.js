import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ChatRoom from './pages/ChatRoom'; 
import Profile from './pages/Profile'; 
// import CreateRoom from './pages/CreateRoom'; // Add later

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        { <Route path="/chatroom/:id" element={<ChatRoom />} /> }
        { <Route path="/profile" element={<Profile />} /> }
        {/* <Route path="/create-room" element={<CreateRoom />} /> */}
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;