import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, X, Minimize2, Paperclip, Smile, MoreVertical, Ban, Shield, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface Profile {
  id: string;
  username: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
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
  const [allUsers, setAllUsers] = useState<Profile[]>([]); // unfiltered list
  const [blockedIds, setBlockedIds] = useState<string[]>([]); // ids currently blocked either way
  const [includeBlocked, setIncludeBlocked] = useState(false); // toggle to reveal blocked users for debugging
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  // Presence / typing
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const presenceChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = ['😊', '😂', '❤️', '👍', '👏', '🎉', '🔥', '💯', '✨', '🚀', '💪', '🙌', '👌', '😍', '🤔', '😎', '🎯', '💡'];

  // Render message content with clickable links (fix global regex test bug)
  const renderContent = (text: string) => {
    const splitRegex = /(https?:\/\/[^\s]+)/g; // used for splitting only
    const isFullUrl = (part: string) => /^https?:\/\/[^\s]+$/i.test(part);
    const parts = text.split(splitRegex);
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, i) =>
          isFullUrl(part) ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80 break-words"
            >
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Helper functions defined first
  const fetchUsers = async (userId: string) => {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id, username')
      .neq('id', userId)
      .limit(30);
    if (error) { return; }
    if (!data) { setUsers([]); return; }
    const { data: blockedRows } = await (supabase as any)
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    const blockedSet = new Set<string>();
    blockedRows?.forEach(r => {
      if (r.blocker_id === userId) blockedSet.add(r.blocked_id);
      if (r.blocked_id === userId) blockedSet.add(r.blocker_id);
    });
    const filtered = data.filter(u => !blockedSet.has(u.id));
    setBlockedIds(Array.from(blockedSet));
    setAllUsers(data);
    setUsers(filtered);
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

  // Block status helpers
  const checkBlockStatus = async (otherUserId: string) => {
    if (!currentUserId) return;
    const { data, error } = await (supabase as any)
      .from('blocked_users')
      .select('id, blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUserId})`)
      .maybeSingle();
    if (error) {
      console.warn('Block status check failed:', error.message);
      setIsBlocked(false);
    } else {
      setIsBlocked(!!data);
    }
  };

  const blockUser = async () => {
    if (!currentUserId || !selectedUser) return;
    const { error } = await (supabase as any).from('blocked_users').insert({
      blocker_id: currentUserId,
      blocked_id: selectedUser.id,
      reason: 'Blocked in widget'
    });
    if (error) {
      console.error('Failed to block user:', error.message);
    } else {
      setIsBlocked(true);
      // Remove from list and clear selection for WhatsApp-like behavior
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setSelectedUser(null);
    }
  };

  const unblockUser = async () => {
    if (!currentUserId || !selectedUser) return;
    const { error } = await (supabase as any)
      .from('blocked_users')
      .delete()
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', selectedUser.id);
    if (error) {
      console.error('Failed to unblock user:', error.message);
    } else {
      setIsBlocked(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!currentUserId) return;
    await checkBlockStatus(otherUserId);
    // Ordered pair for reset lookup
    const a = currentUserId < otherUserId ? currentUserId : otherUserId;
    const b = currentUserId < otherUserId ? otherUserId : currentUserId;
    const { data: resetRow } = await (supabase as any)
      .from('chat_resets')
      .select('reset_at')
      .eq('user_a', a)
      .eq('user_b', b)
      .maybeSingle();
    const resetAt = resetRow?.reset_at ? new Date(resetRow.reset_at) : null;

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username)
      `)
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    let filtered = data || [];
    if (resetAt) {
      filtered = filtered.filter(m => new Date(m.created_at) > resetAt);
      if ((data?.length || 0) > 0 && filtered.length === 0) {
        await (supabase as any).rpc('reset_conversation', { p_user1: currentUserId, p_user2: otherUserId });
      }
    }
    setMessages(filtered);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUserId) return;
    if (isBlocked) {
      console.warn('Message blocked: user relationship is blocked');
      alert('Cannot send message. This conversation is blocked.');
      return;
    }

    // Double-check block status before sending
    await checkBlockStatus(selectedUser.id);
    if (isBlocked) {
      console.warn('Message blocked: user relationship is blocked');
      alert('Cannot send message. This conversation is blocked.');
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUserId,
        receiver_id: selectedUser.id,
        content: newMessage.trim(),
      })
      .select();

    if (error) {
      alert(`Failed to send message: ${error.message}`);
      // Extra diagnostics for common RLS block scenario
      if (error.message.toLowerCase().includes('row-level security')) {
        await checkBlockStatus(selectedUser.id);
      }
      return;
    }

    setNewMessage("");
    fetchMessages(selectedUser.id);
    // Broadcast typing end when message sent
    if (presenceChannelRef.current) {
      presenceChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: currentUserId, isTyping: false } });
    }
  };

  const deleteChatHistory = async () => {
    if (!selectedUser || !currentUserId) return;
    const confirmDelete = window.confirm(`Delete the entire chat for both you and ${selectedUser.username}? This cannot be undone.`);
    if (!confirmDelete) return;
    const { error } = await (supabase as any).rpc('reset_conversation', {
      p_user1: currentUserId,
      p_user2: selectedUser.id,
    });
    if (error) {
      alert('Failed to delete chat: ' + error.message);
      return;
    }
    fetchMessages(selectedUser.id);
    // Remove user from list so they disappear after deletion
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    setSelectedUser(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedUser || !currentUserId) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `chat-files/${fileName}`;
    
    setUploadingFile(true);

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      setUploadingFile(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Send message with file link
    const fileMessage = `📎 File: ${file.name}\n${publicUrl}`;
    
    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      content: fileMessage,
    });

    if (error) {
      console.error("Error sending file message:", error);
    } else {
      fetchMessages(selectedUser.id);
    }

    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  // Parse progress request tag: ::progress_request::exchange=<id>;next=<n>;total=<m>
  const parseProgressRequest = (text: string): { exchangeId: string; next: number; total: number } | null => {
    const tagStart = text.indexOf('::progress_request::');
    if (tagStart === -1) return null;
    const tag = text.slice(tagStart).trim();
    const match = /::progress_request::exchange=([^;]+);next=(\d+);total=(\d+)/.exec(tag);
    if (!match) return null;
    return { exchangeId: match[1], next: Number(match[2]), total: Number(match[3]) };
  };

  const acceptProgress = async (payload: { exchangeId: string; next: number; total: number }, msg: Message) => {
    try {
      // Update exchange progress and status
      const updates: any = { completed_sessions: payload.next };
      if (payload.next >= payload.total) {
        updates.status = 'completed';
      }
      const { error } = await supabase.from('exchanges').update(updates).eq('id', payload.exchangeId);
      if (error) {
        console.error('Error updating exchange progress:', error);
        return;
      }

      // Award XP to both users for completing the session
      const { error: xpError } = await (supabase as any).rpc('award_session_xp', {
        p_exchange_id: payload.exchangeId,
        p_session_number: payload.next
      });
      if (xpError) {
        console.error('Failed to award XP:', xpError);
      }

      // Optional: reply in chat to confirm acceptance
      if (currentUserId && selectedUser) {
        await supabase.from('messages').insert({
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
          content: `✅ Progress confirmed: ${payload.next}/${payload.total} sessions completed. Both earned +50 XP! 🎉`,
          read: false
        });
        fetchMessages(selectedUser.id);
        fetchUnreadCount();
      }
    } catch (e) {
      console.error('Failed to accept progress:', e);
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
      // Create presence channel for online & typing indicators
      if (currentUserId) {
        const a = currentUserId < selectedUser.id ? currentUserId : selectedUser.id;
        const b = currentUserId < selectedUser.id ? selectedUser.id : currentUserId;
        presenceChannelRef.current = (supabase as any)
          .channel(`chat-presence:${a}:${b}`, { config: { presence: { key: currentUserId } } })
          .on('presence', { event: 'sync' }, () => {
            try {
              const state = presenceChannelRef.current.presenceState();
              const onlineIds = Object.keys(state || {});
              setOtherUserOnline(onlineIds.includes(selectedUser.id));
            } catch (e) { console.warn('Presence sync error', e); }
          })
          .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
            if (payload?.user_id === selectedUser.id) {
              setOtherUserTyping(!!payload.isTyping);
            }
          })
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              presenceChannelRef.current.track({ online: true, ts: Date.now() });
            }
          });
      }
      
      // Subscribe to new messages
      const messagesChannel = supabase
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

      // Subscribe to block status changes
      const blockChannel = supabase
        .channel(`blocks:${currentUserId}:${selectedUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocked_users',
          },
          () => {
            // Re-check block status when blocked_users changes
            checkBlockStatus(selectedUser.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(blockChannel);
        if (presenceChannelRef.current) {
          presenceChannelRef.current.untrack?.();
          supabase.removeChannel(presenceChannelRef.current);
          presenceChannelRef.current = null;
        }
        setOtherUserOnline(false);
        setOtherUserTyping(false);
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
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-mustard to-amber-500 hover:from-amber-500 hover:to-mustard shadow-lg ring-2 ring-amber-400/40 flex items-center justify-center transition-colors"
        >
          <MessageSquare className="w-7 h-7 text-black" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
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
          {selectedUser && isBlocked && (
            <span className="text-xs flex items-center gap-1 bg-red-500/10 text-red-600 px-2 py-1 rounded pixel-corners">
              <Ban className="w-3 h-3" /> Blocked
            </span>
          )}
          {selectedUser && !isBlocked && (
            <span className="flex items-center gap-2 ml-2">
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded pixel-corners border ${otherUserOnline ? 'bg-green-500/15 text-green-600 border-green-500/40' : 'bg-muted/40 text-muted-foreground border-border'}`}
                title={otherUserOnline ? 'Online' : 'Offline'}
              >
                <span className={`inline-block h-2 w-2 rounded-full ${otherUserOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                {otherUserOnline ? 'Online' : 'Offline'}
              </span>
              {otherUserTyping && (
                <span className="text-xs italic animate-pulse text-amber-600" title="Typing...">Typing…</span>
              )}
            </span>
          )}
        </CardTitle>
        <div className="flex gap-2 items-center">
          {selectedUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isBlocked ? (
                  <>
                    <DropdownMenuItem onClick={unblockUser} className="cursor-pointer">
                      <Shield className="w-4 h-4 mr-2" /> Unblock User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={deleteChatHistory} className="cursor-pointer text-red-600 focus:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Chat
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={blockUser} className="cursor-pointer text-red-600 focus:text-red-700">
                    <Ban className="w-4 h-4 mr-2" /> Block User
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
                {/* Empty state with optional toggle to reveal blocked users */}
                {users.length === 0 && !includeBlocked ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-center text-muted-foreground">
                      No users available to chat
                    </p>
                    {blockedIds.length > 0 && (
                      <Button
                        variant="secondary"
                        className="pixel-corners"
                        onClick={() => setIncludeBlocked(true)}
                      >
                        Show blocked ({blockedIds.length})
                      </Button>
                    )}
                  </div>
                ) : (
                  (includeBlocked ? allUsers : users).map((user) => (
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
                      <span className="flex items-center gap-2">
                        {user.username}
                        {includeBlocked && blockedIds.includes(user.id) && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-600 border border-red-500/30">
                            Blocked
                          </span>
                        )}
                      </span>
                    </Button>
                  ))
                )}
                {/* Toggle back to hidden blocked view */}
                {includeBlocked && (
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="pixel-corners w-full"
                      onClick={() => setIncludeBlocked(false)}
                    >
                      Hide blocked users
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col h-96">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUserId;
                    const progress = parseProgressRequest(msg.content);
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        {progress && !isOwn ? (
                          <div className={`max-w-[75%] rounded-lg px-4 py-2 pixel-corners bg-amber-50 border-2 border-amber-300 text-amber-900`}>
                            <p className="text-sm font-medium mb-2">
                              Mark {progress.next}/{progress.total} sessions completed?
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" className="pixel-corners"
                                onClick={() => acceptProgress(progress, msg)}>
                                Accept
                              </Button>
                            </div>
                            <p className="text-xs opacity-70 mt-2">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ) : (
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-2 pixel-corners ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm break-words break-all">{renderContent(msg.content)}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="icon"
                    variant="ghost"
                    disabled={uploadingFile}
                    className="pixel-corners shrink-0"
                    title="Upload file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="pixel-corners shrink-0"
                        title="Add emoji"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2">
                      <div className="grid grid-cols-6 gap-2">
                        {emojis.map((emoji, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            className="h-8 w-8 p-0 text-xl hover:scale-125 transition-transform"
                            onClick={() => insertEmoji(emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isBlocked ? "Blocked - unblock to chat" : uploadingFile ? "Uploading..." : "Type a message..."}
                    onKeyDown={(e) => e.key === "Enter" && !uploadingFile && !isBlocked && sendMessage()}
                    className="pixel-corners flex-1"
                    disabled={uploadingFile || isBlocked}
                    onInput={() => {
                      if (!currentUserId || !selectedUser) return;
                      if (presenceChannelRef.current) {
                        presenceChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: currentUserId, isTyping: true } });
                      }
                      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = window.setTimeout(() => {
                        if (presenceChannelRef.current) {
                          presenceChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: currentUserId, isTyping: false } });
                        }
                      }, 1200);
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    size="icon"
                    disabled={isBlocked || !newMessage.trim() || uploadingFile}
                    className="pixel-corners shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
    </motion.div>
  );
}
