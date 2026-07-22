import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, ShieldAlert, ChevronLeft, User, Clock, AlertTriangle } from 'lucide-react';
import { db } from '../dbMock';
import { User as UserType, ChatMessage } from '../types';

interface SupportChatProps {
  currentUser: UserType | null;
  onOpenAuth: () => void;
}

export const SupportChat: React.FC<SupportChatProps> = ({ currentUser, onOpenAuth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  // For Admin mode
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserUsername, setSelectedUserUsername] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages and clean expired ones
  useEffect(() => {
    const checkAndLoadChats = () => {
      // 1. Clean expired chats (idle for over 1 hour)
      db.cleanExpiredChats();

      // 2. Load latest chats
      const allMsgs = db.getChatMessages();
      setMessages(allMsgs);
    };

    // Initial load
    checkAndLoadChats();

    // Poll every 3 seconds for simulated "real-time" feel between user and admin
    const interval = setInterval(checkAndLoadChats, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when message list or active tab changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUserId, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.role === 'admin' ? 'admin' : currentUser.id,
          senderUsername: currentUser.username,
          receiverId: currentUser.role === 'admin' ? (selectedUserId || '') : 'admin',
          message: inputText.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.db) {
        db.updateLocalDb(data.db);
        setMessages(db.getChatMessages());
        setInputText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get active conversations list (For Admin only)
  const getActiveConversations = () => {
    const userMap = new Map<string, { username: string; lastMessage: ChatMessage }>();

    // Sort messages so that we can find the last message
    const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sorted.forEach(msg => {
      // Identify the user conversation ID (always the non-admin participant)
      const userId = msg.senderId === 'admin' ? msg.receiverId : msg.senderId;
      const username = msg.senderId === 'admin' ? 'Khách hàng' : msg.senderUsername;

      if (userId && userId !== 'admin') {
        userMap.set(userId, {
          username: msg.senderId === 'admin' ? userMap.get(userId)?.username || 'Khách hàng' : username,
          lastMessage: msg,
        });
      }
    });

    return Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      username: data.username,
      lastMessage: data.lastMessage,
    })).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
  };

  // Filter messages for active chat conversation
  const getConversationMessages = () => {
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      if (!selectedUserId) return [];
      // Admin sees messages between 'admin' and selectedUserId
      return messages.filter(
        m => (m.senderId === 'admin' && m.receiverId === selectedUserId) || 
             (m.senderId === selectedUserId && m.receiverId === 'admin')
      );
    } else {
      // User sees messages between themselves and 'admin'
      return messages.filter(
        m => (m.senderId === currentUser.id && m.receiverId === 'admin') || 
             (m.senderId === 'admin' && m.receiverId === currentUser.id)
      );
    }
  };

  const activeChatMessages = getConversationMessages();
  const activeConversations = currentUser?.role === 'admin' ? getActiveConversations() : [];

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end" id="support-chat-container">
      {/* Expanded Chat Box */}
      {isOpen && (
        <div 
          className="absolute right-0 bottom-16 w-[330px] sm:w-[360px] h-[480px] max-h-[70vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          id="support-chat-window"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentUser?.role === 'admin' && selectedUserId ? (
                <button 
                  onClick={() => {
                    setSelectedUserId(null);
                    setSelectedUserUsername('');
                  }}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                  title="Quay lại danh sách"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              )}
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  {currentUser?.role === 'admin' ? (
                    selectedUserId ? `Hỗ trợ: ${selectedUserUsername}` : 'Tổng đài Hỗ trợ Admin'
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-pink-500" />
                      Báo cáo sự cố & Hỗ trợ
                    </>
                  )}
                </h3>
                <p className="text-[10px] text-zinc-500">
                  {currentUser?.role === 'admin' && !selectedUserId ? 'Danh sách khách cần hỗ trợ' : 'Phản hồi trong vài phút'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
              id="close-chat-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900/60" id="chat-messages-scroll">
            {/* If not logged in */}
            {!currentUser ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                <AlertTriangle className="w-10 h-10 text-yellow-500/80" />
                <p className="text-zinc-300 font-bold text-sm">Cần Đăng Nhập</p>
                <p className="text-xs text-zinc-500 max-w-xs leading-normal">
                  Vui lòng đăng nhập tài khoản của bạn để kết nối trực tiếp và gửi báo cáo sự cố tới Admin.
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAuth();
                  }}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-pink-600/20"
                >
                  Đăng Nhập Ngay
                </button>
              </div>
            ) : currentUser.role === 'admin' && !selectedUserId ? (
              /* ADMIN: List of active user conversations */
              activeConversations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                  <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs font-bold text-zinc-400">Không có yêu cầu hỗ trợ nào</p>
                  <p className="text-[10px] leading-relaxed max-w-xs mt-1">
                    Khi khách hàng gửi tin nhắn báo cáo sự cố hoặc hỏi đáp, cuộc hội thoại sẽ hiển thị tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Cuộc trò chuyện đang hoạt động:</p>
                  {activeConversations.map(conv => (
                    <button
                      key={conv.userId}
                      onClick={() => {
                        setSelectedUserId(conv.userId);
                        setSelectedUserUsername(conv.username);
                      }}
                      className="w-full text-left p-3 bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-800/80 hover:border-pink-500/30 rounded-xl transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-pink-950/40 border border-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xs shrink-0">
                        {conv.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-xs text-zinc-200 group-hover:text-pink-400 transition-colors">{conv.username}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate pr-2">
                          {conv.lastMessage.senderId === 'admin' ? 'Bạn: ' : ''}{conv.lastMessage.message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              /* CUSTOMER OR ADMIN DETAILED CHAT VIEW */
              <>
                {/* Auto welcome info */}
                <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-1 text-center">
                  <p className="text-[11px] text-zinc-400 font-bold">
                    🔔 Hệ Thống Hỗ Trợ 24/7
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Hãy nhắn tin báo cáo sự cố hoặc đặt câu hỏi. Lịch sử chat sẽ <span className="text-pink-400 font-semibold">tự động xoá hoàn toàn sau 1 tiếng</span> kể từ tin nhắn cuối cùng để bảo mật.
                  </p>
                </div>

                {/* Message display bubble list */}
                {activeChatMessages.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    Chưa có tin nhắn nào. Hãy gửi phản hồi đầu tiên của bạn!
                  </div>
                ) : (
                  activeChatMessages.map(msg => {
                    const isMe = currentUser?.role === 'admin' ? (msg.senderId === 'admin') : (msg.senderId === currentUser?.id);
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] text-zinc-500 font-bold">
                            {isMe ? 'Bạn' : msg.senderUsername}
                          </span>
                          <span className="text-[8px] text-zinc-600 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div 
                          className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs break-words leading-relaxed ${
                            isMe 
                              ? 'bg-pink-600 text-white rounded-tr-none' 
                              : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Footer Input */}
          {currentUser && (currentUser.role !== 'admin' || selectedUserId) && (
            <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập nội dung báo cáo hoặc trò chuyện..."
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                id="support-chat-input"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 bg-pink-600 hover:bg-pink-700 disabled:bg-zinc-800 text-white disabled:text-zinc-500 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
                id="send-chat-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-pink-600 hover:bg-pink-500 text-white font-extrabold rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer group"
        id="toggle-support-chat-btn"
      >
        <MessageSquare className="w-5 h-5 animate-pulse" />
        <span className="text-xs tracking-wide">Báo Cáo Sự Cố</span>
        {/* Unread dot simulation */}
        {messages.length > 0 && currentUser && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-zinc-900" />
        )}
      </button>
    </div>
  );
};
