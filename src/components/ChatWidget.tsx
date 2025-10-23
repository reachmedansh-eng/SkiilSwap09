import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, X, Minimize2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Profile {
  id: string;
  username: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    username: string;
  };
}

export function ChatWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper functions defined first
  const fetchUsers = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .neq("id", userId)
      .limit(10);
    if (data) setUsers(data);
  };

  const fetchUnreadCount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { count } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("receiver_id", session.user.id)
      .eq("read", false);
    
    if (count !== null) setUnreadCount(count);
  };

  const markMessagesAsRead = async () => {
    if (!selectedUser || !currentUserId) return;
    
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("receiver_id", currentUserId)
      .eq("sender_id", selectedUser.id)
      .eq("read", false);
    
    fetchUnreadCount();
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!currentUserId) return;
    
    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username)
      `)
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUserId) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      fetchMessages(selectedUser.id);
    }
  };

  // Effects
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        fetchUsers(session.user.id);
        // Fetch initial unread count
        await fetchUnreadCount();
      }
    };
    init();
  }, []);

  // Real-time subscription for unread count
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      markMessagesAsRead(); // Mark as read when opening chat
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${currentUserId}:${selectedUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${currentUserId}`,
          },
          () => {
            fetchMessages(selectedUser.id);
            markMessagesAsRead(); // Auto-mark as read when chat is open
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, currentUserId]);

  // Hide chat widget on onboarding and auth pages
  const hideOnPages = ['/', '/auth', '/signup', '/welcome'];
  if (hideOnPages.includes(location.pathname)) {
    return null;
  }

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="relative w-16 h-16 shadow-2xl pixel-corners bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 overflow-hidden p-0"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
          }}
        >
          {/* Pixelated chat bubble icon with conditional fill */}
          <motion.div 
            className="relative w-full h-full flex items-center justify-center z-10"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 48 48" 
              className="relative z-10"
              style={{ imageRendering: 'pixelated' }}
            >
              {/* Outer bubble - always white stroke */}
              <rect x="8" y="8" width="32" height="24" fill="none" stroke="white" strokeWidth="3"/>
              
              {/* Inner fill - red if unread, transparent if not */}
              <rect 
                x="11" 
                y="11" 
                width="26" 
                height="18" 
                fill={unreadCount > 0 ? "#ef4444" : "none"}
                className="transition-colors duration-300"
              />
              
              {/* Speech bubble tail */}
              <path 
                d="M 20 32 L 20 40 L 28 32 Z" 
                fill={unreadCount > 0 ? "#ef4444" : "none"}
                stroke="white" 
                strokeWidth="3"
                strokeLinejoin="miter"
                className="transition-colors duration-300"
              />
              
              {/* Pixel dots inside bubble (always white) - animated */}
              <motion.g
                animate={{
                  opacity: [1, 0.3, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.5, 1]
                }}
              >
                <rect x="16" y="17" width="4" height="4" fill="white"/>
                <rect x="23" y="17" width="4" height="4" fill="white"/>
                <rect x="30" y="17" width="4" height="4" fill="white"/>
              </motion.g>
            </svg>
          </motion.div>
          
          {/* Animated racing lines inside button */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)'
              ],
              backgroundPosition: ['-200% 0', '200% 0']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundSize: '200% 100%'
            }}
          />
          
          {/* Pulsing glow effect - intensifies when unread */}
          <motion.div
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
            }}
            animate={{
              boxShadow: unreadCount > 0 
                ? [
                    '0 0 0 0 rgba(239, 68, 68, 0.7)',
                    '0 0 0 10px rgba(239, 68, 68, 0)',
                    '0 0 0 0 rgba(239, 68, 68, 0)'
                  ]
                : [
                    '0 0 0 0 rgba(6, 182, 212, 0.7)',
                    '0 0 0 10px rgba(6, 182, 212, 0)',
                    '0 0 0 0 rgba(6, 182, 212, 0)'
                  ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Card 
        className="w-96 shadow-2xl border-4 border-cyan-400 bg-gradient-to-br from-background to-secondary/20 backdrop-blur-xl overflow-hidden relative"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
          boxShadow: '0 0 0 2px rgba(34, 211, 238, 0.5), 0 0 20px rgba(6, 182, 212, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Pixelated corner decorations */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
        <div className="absolute bottom-0 left-0 w-3 h-3 bg-cyan-400" style={{ clipPath: 'polygon(0 100%, 100% 100%, 0 0)' }} />
        
        {/* Racing lines animation at the top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent overflow-hidden">
          <motion.div
            className="absolute inset-0"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
              width: '50%'
            }}
          />
        </div>
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {selectedUser ? selectedUser.username : "Chat"}
        </CardTitle>
        <div className="flex gap-2">
          {selectedUser && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setSelectedUser(null);
                setMessages([]);
              }}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsOpen(false);
              setSelectedUser(null);
              setIsMinimized(false);
            }}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0">
          {!selectedUser ? (
            <ScrollArea className="h-96">
              <div className="p-4 space-y-2">
                {users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No users available to chat
                  </p>
                ) : (
                  users.map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="w-full justify-start pixel-corners"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar className="w-8 h-8 mr-3">
                        <AvatarFallback className="text-xs">
                          {user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.username}
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col h-96">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-4 py-2 pixel-corners ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="pixel-corners"
                />
                <Button
                  onClick={sendMessage}
                  size="icon"
                  disabled={!newMessage.trim()}
                  className="pixel-corners"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
    </motion.div>
  );
}
