import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import '../styles/ChatRoom.css';
import EmojiPicker from 'emoji-picker-react';

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomName, setRoomName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { roomId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const API_BASE_URL = 'https://safe-chat-7uuh.onrender.com/api';
  const SOCKET_URL = 'https://safe-chat-7uuh.onrender.com';

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username') || 'Unknown';

  useEffect(() => {
    if (!token || !roomId) {
      navigate('/login');
      return;
    }

    socketRef.current = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.emit('joinRoom', roomId);

    socketRef.current.on('newMessage', (message) => setMessages((prev) => [...prev, message]));
    socketRef.current.on('typing', ({ userId, username }) => {
      if (userId !== localStorage.getItem('userId')) {
        setTypingUsers((prev) => [...new Set([...prev, username])]);
        setTimeout(() => setTypingUsers((prev) => prev.filter((u) => u !== username)), 2000);
      }
    });
    socketRef.current.on('connect_error', () => setErrorMessage('Connection failed.'));
    socketRef.current.on('disconnect', () => setErrorMessage('Disconnected. Reconnecting...'));
    socketRef.current.on('reconnect', () => setErrorMessage(''));
    socketRef.current.on('error', (error) => {
      setErrorMessage(error);
      if (error.includes('Authentication error')) {
        localStorage.clear();
        navigate('/login');
      }
    });

    return () => socketRef.current.disconnect();
  }, [roomId, navigate, token]);

  useEffect(() => {
    const fetchRoomData = async () => {
      if (!token || !roomId) return;
      setLoading(true);
      try {
        const [messagesResponse, roomResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/chatrooms/${roomId}/messages`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/chatrooms/${roomId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setMessages(messagesResponse.data);
        setRoomName(roomResponse.data.roomName);
        setParticipants(roomResponse.data.participants);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.clear();
          navigate('/login');
        } else {
          setErrorMessage(err.response?.data?.message || 'Failed to load room.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRoomData();
  }, [roomId, navigate, token]);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    socketRef.current.emit('typing', { roomId, userId: localStorage.getItem('userId'), username });
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || !token) return;
    setLoading(true);
    try {
      const sender = { _id: localStorage.getItem('userId'), username };
      const messageData = { roomId, content: newMessage, sender };
      socketRef.current.emit('sendMessage', messageData);
      setNewMessage('');
      setShowEmojiPicker(false);
      setSuccessMessage('Message sent!');
      setTimeout(() => setSuccessMessage(''), 3000);
      inputRef.current?.focus();
    } catch (err) {
      setErrorMessage('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !token) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/chatrooms/leave`, { roomId }, { headers: { Authorization: `Bearer ${token}` } });
      socketRef.current.emit('leaveRoom', roomId);
      setSuccessMessage('Left room successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to leave room.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleParticipants = () => setParticipantsOpen(!participantsOpen);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };
  const dismissMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="chatroom">
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>SafeChat</h2>
          <button className="close-btn" onClick={toggleSidebar} aria-label="Close sidebar">
            ✕
          </button>
        </div>
        <nav>
          <button className="nav-btn" onClick={() => navigate('/dashboard')} aria-label="Go to Dashboard">
            Dashboard
          </button>
          <button className="nav-btn" onClick={() => navigate('/profile')} aria-label="Go to Profile">
            Profile
          </button>
          <button className="nav-btn" onClick={handleLogout} aria-label="Logout">
            Logout
          </button>
        </nav>
      </div>

      <div className="chat-container">
        <div className="chatheader">
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">☰</button>
          <h1>{roomName || 'Chat Room'}</h1>
          <div className="room-actions">
            <button onClick={handleLeaveRoom} aria-label="Leave room">Leave</button>
          </div>
        </div>

        {loading && <div className="loader"></div>}
        {(errorMessage || successMessage) && (
          <div className="alert">
            {errorMessage && <p className="error">{errorMessage}</p>}
            {successMessage && <p className="success">{successMessage}</p>}
            <button onClick={dismissMessages} aria-label="Dismiss">✕</button>
          </div>
        )}

        <div className="participants" data-open={participantsOpen}>
          <div className="participants-header">
            <h3>Participants ({participants.length}/3)</h3>
            <button onClick={toggleParticipants} aria-label="Toggle participants">👥</button>
          </div>
          <ul>
            {participants.map((p, i) => (
              <li key={i}>
                <span className="status" data-online={i % 2 === 0}></span>
                {p.username}
              </li>
            ))}
          </ul>
        </div>

        <div className="messages">
          {messages.length > 0 ? (
            messages.map((msg, i) => (
              <div
                key={msg._id || i}
                className={`message ${msg.sender._id === localStorage.getItem('userId') ? 'sent' : 'received'}`}
              >
                <span className="avatar">{msg.sender.username[0]}</span>
                <div className="message-body">
                  <div className="message-meta">
                    <span className="sender">{msg.sender.username}</span>
                    <span className="time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-messages">No messages yet. Say hi!</p>
          )}
          {typingUsers.length > 0 && (
            <div className="typing">
              <span className="dots"><span></span><span></span><span></span></span>
              {typingUsers.join(', ')} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="input-form">
          <div className="input-container">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              aria-label="Message input"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-label="Toggle emoji picker"
            >
              😊
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker">
                <EmojiPicker onEmojiClick={(emoji) => setNewMessage((prev) => prev + emoji.emoji)} />
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} aria-label="Send">
            {loading ? '...' : 'Send'}
          </button>
        </form>

        <div aria-live="polite" className="sr-only">
          {messages.length > 0 && `New message from ${messages[messages.length - 1].sender.username}: ${messages[messages.length - 1].content}`}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatRoom);