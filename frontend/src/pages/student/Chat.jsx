import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, MessageCircle, Trash2, MoreVertical, CheckCheck, Circle, Clock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const socket = io('http://localhost:5000');

export default function Chat() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(() => {
    const saved = sessionStorage.getItem('activeContact');
    return saved ? JSON.parse(saved) : null;
  });
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (activeContact) {
      sessionStorage.setItem('activeContact', JSON.stringify(activeContact));
    } else {
      sessionStorage.removeItem('activeContact');
    }
  }, [activeContact]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) socket.emit('join', userId);
    
    socket.on('receiveMessage', (msg) => {
      if (activeContact && (msg.sender?._id || msg.sender?.id || msg.sender) === (activeContact._id || activeContact.id)) {
        setMessages((prev) => [...prev, msg]);
        socket.emit('markRead', { senderId: activeContact._id || activeContact.id, receiverId: userId });
        window.dispatchEvent(new Event('chat_read'));
      } else {
        // Increment unread count for the contact
        setContacts(prev => prev.map(c => 
          (c._id || c.id) === (msg.sender?._id || msg.sender?.id || msg.sender) 
          ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } 
          : c
        ));
      }
    });

    socket.on('userTyping', (data) => {
      if (activeContact && data.senderId === activeContact._id) {
        setIsTyping(data.isTyping);
      }
    });

    socket.on('messagesRead', (data) => {
      if (activeContact && data.receiverId === (activeContact._id || activeContact.id)) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    });

    socket.on('activeUsers', (users) => setActiveUsers(users));

    return () => {
      socket.off('receiveMessage');
      socket.off('userTyping');
      socket.off('messagesRead');
      socket.off('activeUsers');
    };
  }, [user, activeContact]);

  useEffect(() => {
    api.get('/messages/contacts').then(res => {
      const fetchedContacts = res.data.data || [];
      setContacts(fetchedContacts);
      if (location.state?.recruiter) {
        const r = location.state.recruiter;
        const existing = fetchedContacts.find(c => c._id === r._id);
        if (existing) setActiveContact(existing);
        else {
          const newContact = { _id: r._id, name: r.name, role: 'recruiter' };
          setContacts(prev => [newContact, ...prev]);
          setActiveContact(newContact);
        }
      }
    });
  }, [location.state]);

  useEffect(() => {
    if (activeContact) {
      const receiverId = user?._id || user?.id;
      const senderId = activeContact._id || activeContact.id;
      api.get(`/messages/${senderId}`).then(res => {
        setMessages(res.data.data || []);
        socket.emit('markRead', { senderId, receiverId });
        window.dispatchEvent(new Event('chat_read'));
      });
    }
  }, [activeContact]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMsg = async () => {
    if (!text.trim() || !activeContact) return;
    const receiverId = activeContact._id || activeContact.id;
    const senderId = user?._id || user?.id;
    try {
      const res = await api.post('/messages', { receiverId, content: text });
      const newMsg = res.data.data;
      setMessages((prev) => [...prev, newMsg]);
      socket.emit('sendMessage', { ...newMsg, receiverId });
      setText('');
      socket.emit('typing', { senderId, receiverId, isTyping: false });
    } catch { toast.error('Failed to send message'); }
  };

  const deleteMsg = async (id) => {
    try {
      await api.delete(`/messages/${id}`);
      setMessages(prev => prev.filter(m => m._id !== id));
      toast.success('Unsent');
    } catch { toast.error('Failed to unsend'); }
  };

  const clearConversation = async () => {
    if (!window.confirm('Clear entire chat?')) return;
    try {
      await api.delete(`/messages/clear/${activeContact._id || activeContact.id}`);
      setMessages([]);
      setShowMenu(false);
      toast.success('Chat cleared');
    } catch { toast.error('Failed to clear'); }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!activeContact) return;
    
    const senderId = user?._id || user?.id;
    const receiverId = activeContact._id || activeContact.id;
    socket.emit('typing', { senderId, receiverId, isTyping: true });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { senderId, receiverId, isTyping: false });
    }, 2000);
  };

  const getDateLabel = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-secondary text-white mb-2">Messaging</div>
        <h1 className="page-title">Chat Hub</h1>
      </div>

      <div className="neo-card flex h-[75vh] overflow-hidden">
        {/* Contacts Sidebar */}
        <div className="w-80 border-r-3 border-brand-dark flex flex-col bg-brand-bg/10">
          <div className="p-4 border-b-3 border-brand-dark">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." className="neo-input pl-10 py-2 text-sm bg-white" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-brand-muted italic opacity-60">No conversations found</div>
            ) : filtered.map((c) => {
              const isOnline = activeUsers.includes(c._id);
              return (
                <button key={c._id} onClick={() => {
                  setActiveContact(c);
                  setContacts(prev => prev.map(con => con._id === c._id ? { ...con, unreadCount: 0 } : con));
                }}
                  className={`w-full flex items-center gap-4 p-4 border-b-2 border-brand-dark/10 transition-all
                    ${activeContact?._id === c._id ? 'bg-brand-dark text-white' : 'hover:bg-white'}`}>
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 flex items-center justify-center font-black border-3 border-brand-dark text-xl
                      ${activeContact?._id === c._id ? 'bg-white text-brand-dark' : 'bg-brand-primary text-white'}`}>
                      {c.name[0].toUpperCase()}
                    </div>
                    {isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-brand-success border-2 border-brand-dark rounded-full" />}
                    {c.unreadCount > 0 && activeContact?._id !== c._id && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-primary text-white text-[10px] font-black flex items-center justify-center border-2 border-brand-dark rounded-full">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-black text-sm truncate">{c.name}</p>
                    <p className={`text-xs uppercase tracking-wider font-bold opacity-70 ${activeContact?._id === c._id ? 'text-white/80' : 'text-brand-muted'}`}>{c.role}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
          {activeContact ? (
            <>
              {/* Header */}
              <div className="p-4 border-b-3 border-brand-dark flex items-center justify-between bg-brand-bg/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-secondary text-white flex items-center justify-center font-black border-2 border-brand-dark shadow-neo-sm">
                    {activeContact.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black leading-none">{activeContact.name}</p>
                      {activeUsers.includes(activeContact._id) && <span className="w-2 h-2 bg-brand-success rounded-full animate-pulse" />}
                    </div>
                    <p className="text-[10px] text-brand-muted font-bold uppercase mt-1">
                      {isTyping ? <span className="text-brand-primary animate-bounce inline-block">Typing...</span> : activeContact.role}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white border-2 border-transparent hover:border-brand-dark transition-all">
                    <MoreVertical size={20} />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border-3 border-brand-dark shadow-neo z-10">
                      <button onClick={clearConversation} className="w-full text-left p-3 hover:bg-red-50 text-red-600 font-bold flex items-center gap-2 text-sm">
                        <Trash2 size={16} /> Clear Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-bg/5">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => {
                    const isMine = (msg.sender?._id || msg.sender?.id || msg.sender) === (user?._id || user?.id);
                    const showDateDivider = i === 0 || (msg.createdAt && messages[i - 1]?.createdAt && 
                      new Date(messages[i - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString());

                    return (
                      <motion.div key={msg._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-4">
                        {showDateDivider && (
                          <div className="flex justify-center my-4 mb-2">
                            <span className="neo-badge bg-white border-brand-dark text-brand-dark text-[10px] uppercase font-black px-4 py-1.5 shadow-neo-sm">
                              {getDateLabel(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className="flex flex-col max-w-[70%] gap-1">
                            <div className="flex items-center gap-2">
                              {isMine && (
                                <button onClick={() => deleteMsg(msg._id)} title="Unsend" className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 transition-all rounded">
                                  <Trash2 size={14} />
                                </button>
                              )}
                              <div className={isMine ? 'chat-bubble-sent relative' : 'chat-bubble-received'}>
                                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                              </div>
                            </div>
                            <div className={`flex items-center gap-1.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[9px] font-bold text-brand-muted uppercase">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMine && (
                                <span className={`text-[10px] ${msg.isRead ? 'text-brand-primary' : 'text-brand-muted'}`}>
                                  <CheckCheck size={12} strokeWidth={3} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t-3 border-brand-dark bg-white">
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <input 
                      value={text} 
                      onChange={handleTyping}
                      onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                      placeholder="Type your message here..." 
                      className="neo-input py-3 shadow-none focus:shadow-neo-sm" 
                    />
                    {text && <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary animate-pulse" />}
                  </div>
                  <button onClick={sendMsg} disabled={!text.trim()} className="neo-btn-primary p-3 rounded-none aspect-square shrink-0">
                    <Send size={22} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-5 text-center p-12">
              <div className="w-24 h-24 bg-brand-bg rounded-full flex items-center justify-center border-4 border-brand-dark shadow-neo animate-bounce">
                <MessageCircle size={48} className="text-brand-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase">Select a Conversation</h3>
                <p className="text-brand-muted font-medium mt-2 max-w-xs">Pick a contact from the left to start chatting in real-time.</p>
              </div>
              <div className="flex gap-2">
                <span className="neo-badge bg-brand-success text-white">Secure</span>
                <span className="neo-badge bg-brand-primary text-white">Real-time</span>
                <span className="neo-badge bg-brand-accent">Fast</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

