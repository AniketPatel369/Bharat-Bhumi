import { useState, useEffect, useRef } from "react";
import { ChatMessage, Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatProps {
  messages: ChatMessage[];
  currentPlayer: Player | null;
  onSendMessage: (message: string) => void;
  isMobile?: boolean;
}

export default function Chat({ messages, currentPlayer, onSendMessage, isMobile = false }: ChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show floating icon when minimized
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-saffron hover:bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
        style={{ zIndex: 100000 }}
        title="Open Chat"
      >
        <i className="fas fa-comments text-xl"></i>
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  const containerClass = isMobile
    ? "flex flex-col h-80"
    : "bg-white rounded-xl shadow-2xl p-4 flex flex-col h-full";

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-navy flex items-center">
          <i className="fas fa-comments mr-2"></i>
          Game Chat
        </h3>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500" data-testid="text-messages-count">
            {messages.length} messages
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors"
            title="Minimize Chat"
          >Minimize
            <i className="fas fa-minus"></i>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 mb-4 bg-gray-50 rounded-lg p-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8" data-testid="text-no-messages">
              <i className="fas fa-comments text-3xl mb-2"></i>
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.playerId === currentPlayer?.id;

              return (
                <div
                  key={index}
                  className={`flex items-start space-x-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
                  data-testid={`message-${index}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-400">
                    {message.playerName.charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex-1 max-w-xs ${isOwnMessage ? 'text-right' : ''}`}>
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700" data-testid={`message-author-${index}`}>
                        {isOwnMessage ? 'You' : message.playerName}
                      </span>
                      <span className="text-xs text-gray-500" data-testid={`message-time-${index}`}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div
                      className={`chat-bubble ${isOwnMessage ? 'chat-bubble-own' : 'chat-bubble-other'
                        }`}
                    >
                      <p className="text-sm" data-testid={`message-content-${index}`}>
                        {message.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="flex space-x-2">
        <Input
          data-testid="input-chat-message"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          maxLength={500}
          className="flex-1"
        />
        <Button
          data-testid="button-send-message"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="bg-saffron hover:bg-orange-600 text-white"
        >
          <i className="fas fa-paper-plane"></i>
        </Button>
      </div>

      {/* Character Counter */}
      <div className="text-xs text-gray-500 mt-1 text-right">
        {newMessage.length}/500
      </div>
    </div>
  );
}
