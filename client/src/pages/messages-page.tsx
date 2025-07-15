import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Send,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Exchange, Message, User } from "@shared/schema";

// Type for WebSocket message
type WebSocketMessage = {
  type: string;
  message?: any;
};

interface MessageWithSender extends Message {
  sender?: Partial<User>;
}

interface ExchangeWithDetails extends Exchange {
  requester?: Partial<User>;
  provider?: Partial<User>;
  requestedSkill?: { id: number; title: string; };
  offeredSkill?: { id: number; title: string; }; 
}

// Helper function to parse URL search params
const useSearchParams = () => {
  const [loc] = useLocation();
  return new URLSearchParams(loc.split('?')[1] || '');
};

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useSearchParams();
  const exchangeId = params.get('exchangeId');
  const otherUserId = params.get('userId');
  
  const [selectedExchangeId, setSelectedExchangeId] = useState<number | null>(exchangeId ? Number(exchangeId) : null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(otherUserId ? Number(otherUserId) : null);
  const [message, setMessage] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user exchanges
  const { data: exchanges = [], isLoading: isLoadingExchanges } = useQuery<ExchangeWithDetails[]>({
    queryKey: ["/api/exchanges"],
    enabled: !!user,
  });

  // Fetch messages for selected exchange or user
  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/messages", { exchangeId: selectedExchangeId, otherUserId: selectedUserId }],
    enabled: !!user && (!!selectedExchangeId || !!selectedUserId),
  });

  // Mutation for sending a new message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        receiverId: getReceiverIdFromSelection(),
        content,
        exchangeId: selectedExchangeId,
      });
    },
    onSuccess: () => {
      setMessage("");
      refetchMessages();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Get receiver ID based on selection
  const getReceiverIdFromSelection = (): number | null => {
    if (selectedExchangeId) {
      const exchange = exchanges.find((e: ExchangeWithDetails) => e.id === selectedExchangeId);
      if (exchange) {
        return exchange.requesterId === user?.id ? exchange.providerId : exchange.requesterId;
      }
    }
    return selectedUserId;
  };

  // Get other user's info based on selection
  const getOtherUserInfo = () => {
    if (selectedExchangeId) {
      const exchange = exchanges.find((e: ExchangeWithDetails) => e.id === selectedExchangeId);
      if (exchange) {
        return exchange.requesterId === user?.id ? exchange.provider : exchange.requester;
      }
    }
    
    // Try to find user info from messages
    if (messages.length > 0) {
      const otherUserMessage = messages.find((m: MessageWithSender) => m.senderId !== user?.id);
      if (otherUserMessage) {
        return otherUserMessage.sender;
      }
    }
    
    return null;
  };

  // Setup WebSocket connection with better error handling
  useEffect(() => {
    if (!user) return;
    
    let reconnectAttempts = 0;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    
    const connectWebSocket = () => {
      try {
        // Clear any existing timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        // Instead of connecting directly to port 5000, use the same hostname
        // This avoids CORS issues and lets the dev server proxy WebSocket connections
        const wsUrl = `${protocol}://${window.location.hostname}/ws`;
        console.log(`Connecting WebSocket to: ${wsUrl} (attempt #${reconnectAttempts + 1})`);
        
        // Close any existing connection
        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch (err) {
            console.error('Error closing existing WebSocket:', err);
          }
        }
        
        const ws = new WebSocket(wsUrl);
        
        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          console.log('WebSocket connection timeout');
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
          }
        }, 10000);
        
        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          clearTimeout(connectionTimeout);
          setWsConnected(true);
          reconnectAttempts = 0;
          
          // Send user ID after connection is established
          ws.send(JSON.stringify({
            type: 'identify',
            userId: user.id
          }));
        };
        
        ws.onmessage = (event) => {
          try {
            console.log('WebSocket message received:', event.data);
            const data: WebSocketMessage = JSON.parse(event.data);
            
            if (data.type === 'message') {
              // Add new message to current messages
              if (
                (selectedExchangeId && data.message.exchangeId === selectedExchangeId) ||
                (selectedUserId && 
                  ((data.message.senderId === selectedUserId && data.message.receiverId === user.id) ||
                  (data.message.receiverId === selectedUserId && data.message.senderId === user.id)))
              ) {
                console.log('Refetching messages after new WebSocket message');
                refetchMessages();
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = (event) => {
          console.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason}`);
          clearTimeout(connectionTimeout);
          setWsConnected(false);
          
          // Implement exponential backoff for reconnection
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
          reconnectAttempts++;
          
          console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error occurred:', error);
          // The onclose handler will be called after this
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('Error in WebSocket connection setup:', error);
        
        // If we can't even create the WebSocket, try again later
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
        reconnectAttempts++;
        
        console.log(`Error occurred. Attempting to reconnect in ${delay / 1000} seconds...`);
        reconnectTimeout = setTimeout(connectWebSocket, delay);
      }
    };
    
    connectWebSocket();
    
    // Cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (err) {
          console.error('Error during cleanup of WebSocket:', err);
        }
      }
    };
  }, [user, selectedExchangeId, selectedUserId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    if (!getReceiverIdFromSelection()) {
      toast({
        title: "Error",
        description: "No recipient selected",
        variant: "destructive",
      });
      return;
    }
    
    // Send through mutation (API)
    sendMessageMutation.mutate(message);
    
    // Send through WebSocket for real-time delivery
    if (wsConnected && wsRef.current) {
      const wsMessage = {
        type: 'chat',
        senderId: user?.id,
        receiverId: getReceiverIdFromSelection(),
        exchangeId: selectedExchangeId,
        content: message,
      };
      
      wsRef.current.send(JSON.stringify(wsMessage));
    }
  };

  // Select a conversation
  const selectConversation = (exchangeId: number | null, userId: number | null) => {
    setSelectedExchangeId(exchangeId);
    setSelectedUserId(userId);
  };

  // Get exchange title for the sidebar
  const getExchangeTitle = (exchange: ExchangeWithDetails) => {
    const isRequester = exchange.requesterId === user?.id;
    const partner = isRequester ? exchange.provider : exchange.requester;
    const skill = isRequester ? exchange.requestedSkill : exchange.offeredSkill;
    
    return `${partner?.name || 'Unknown'} (${skill?.title || 'Unknown skill'})`;
  };

  const otherUser = getOtherUserInfo();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col md:flex-row h-[70vh]">
            {/* Sidebar - Conversation List */}
            <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              </div>
              
              {isLoadingExchanges ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : exchanges.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  {exchanges.map((exchange) => {
                    const isRequester = exchange.requesterId === user?.id;
                    const partner = isRequester ? exchange.provider : exchange.requester;
                    
                    return (
                      <div
                        key={exchange.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          selectedExchangeId === exchange.id ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => selectConversation(exchange.id, null)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={partner?.avatar || undefined} />
                            <AvatarFallback>
                              {partner?.name?.[0] || partner?.username?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {partner?.name || partner?.username || 'Unknown user'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {getExchangeTitle(exchange)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </ScrollArea>
              )}
            </div>
            
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              {selectedExchangeId || selectedUserId ? (
                <>
                  <div className="p-4 border-b border-gray-200 flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherUser?.avatar || undefined} />
                      <AvatarFallback>
                        {otherUser?.name?.[0] || otherUser?.username?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {otherUser?.name || otherUser?.username || 'Unknown user'}
                      </h3>
                      {selectedExchangeId && (
                        <p className="text-xs text-gray-500">
                          {(() => {
                            const exchange = exchanges.find((e: ExchangeWithDetails) => e.id === selectedExchangeId);
                            if (!exchange) return 'Exchange';
                            
                            const isRequester = exchange.requesterId === user?.id;
                            const skill = isRequester ? exchange.requestedSkill : exchange.offeredSkill;
                            
                            return skill?.title || 'Unknown skill';
                          })()}
                          
                          <Badge 
                            variant="outline" 
                            className="ml-2 text-xs"
                          >
                            {(() => {
                              const exchange = exchanges.find((e: ExchangeWithDetails) => e.id === selectedExchangeId);
                              return exchange?.status || 'Unknown';
                            })()}
                          </Badge>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {isLoadingMessages ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isOwnMessage = msg.senderId === user?.id;
                          
                          return (
                            <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <div className="flex items-end">
                                {!isOwnMessage && (
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage src={msg.sender?.avatar || undefined} />
                                    <AvatarFallback>
                                      {msg.sender?.name?.[0] || msg.sender?.username?.[0] || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div 
                                  className={`rounded-lg px-4 py-2 max-w-md ${
                                    isOwnMessage 
                                      ? 'bg-primary-100 text-primary-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {msg.createdAt && format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <Input
                        className="flex-1"
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <Button type="submit" disabled={sendMessageMutation.isPending}>
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4 text-center">
                  <svg className="h-12 w-12 mb-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">Your Messages</p>
                  <p className="mb-4">Select a conversation from the sidebar to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
