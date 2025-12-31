import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Send, 
  Paperclip, 
  Image, 
  MoreVertical,
  Download,
  Copy,
  Trash2,
  Check,
  CheckCheck
} from 'lucide-react';
import { RootState, AppDispatch } from '../../store/store';
import { 
  sendMessage, 
  markMessagesAsRead,
  fetchMessages
} from '../../store/slices/messagingSlice';
import { messagingService, Message } from '../../services/messagingService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatDistanceToNow, format } from 'date-fns';

interface MessageThreadProps {
  conversationId: string;
}

export const MessageThread: React.FC<MessageThreadProps> = ({ conversationId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { activeConversation, loading } = useSelector((state: RootState) => state.messaging);
  
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (activeConversation && activeConversation.conversation.unread_count > 0) {
      dispatch(markMessagesAsRead({ conversationId }));
    }
  }, [dispatch, conversationId, activeConversation]);

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return;

    setSending(true);
    try {
      let messageData: any = {
        conversationId,
        content: messageText.trim(),
        message_type: 'text' as const,
      };

      // Handle file upload
      if (selectedFile) {
        const fileData = await messagingService.uploadFile(selectedFile);
        messageData = {
          conversationId,
          content: selectedFile.name,
          message_type: selectedFile.type.startsWith('image/') ? 'image' : 'document',
          metadata: {
            file_url: fileData.file_url,
            file_name: fileData.file_name,
            file_size: fileData.file_size,
          },
        };
      }

      await dispatch(sendMessage(messageData));
      setMessageText('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const loadMoreMessages = () => {
    if (activeConversation && activeConversation.has_more && !loading) {
      dispatch(fetchMessages({
        conversationId,
        offset: activeConversation.messages.length,
      }));
    }
  };

  const getMessageStatusIcon = (message: Message) => {
    switch (message.status) {
      case 'sent':
        return <Check className="h-3 w-3 text-neutral-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-neutral-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const renderMessage = (message: Message, isOwn: boolean) => {
    const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
    const fullTime = format(new Date(message.created_at), 'PPpp');

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          <div
            className={`
              px-4 py-2 rounded-lg shadow-sm
              ${isOwn 
                ? 'bg-primary-600 text-white' 
                : 'bg-white border border-neutral-200 text-neutral-900'
              }
            `}
          >
            {/* Message Content */}
            {message.message_type === 'text' && (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
            
            {message.message_type === 'image' && message.metadata?.file_url && (
              <div>
                <img
                  src={message.metadata.file_url}
                  alt={message.content}
                  className="rounded max-w-full h-auto mb-2"
                />
                <p className="text-xs opacity-75">{message.content}</p>
              </div>
            )}
            
            {message.message_type === 'document' && message.metadata?.file_url && (
              <div className="flex items-center space-x-2">
                <Paperclip className="h-4 w-4" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{message.content}</p>
                  {message.metadata.file_size && (
                    <p className="text-xs opacity-75">
                      {(message.metadata.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <a
                  href={message.metadata.file_url}
                  download={message.content}
                  className="p-1 hover:bg-black hover:bg-opacity-10 rounded"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
          
          {/* Message Info */}
          <div className={`flex items-center mt-1 space-x-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-neutral-500" title={fullTime}>
              {timeAgo}
            </span>
            {isOwn && getMessageStatusIcon(message)}
          </div>
        </div>
      </div>
    );
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="text-neutral-400 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Select a conversation</h3>
          <p className="text-neutral-600">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              {activeConversation.conversation.participants
                .find(p => p.user_id !== 'current_user_id')?.name || 'Conversation'}
            </h3>
            {activeConversation.conversation.context && (
              <p className="text-sm text-neutral-600 capitalize">
                {activeConversation.conversation.context.type} conversation
              </p>
            )}
          </div>
          
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Load More Button */}
        {activeConversation.has_more && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMoreMessages}
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Loading...' : 'Load older messages'}
            </Button>
          </div>
        )}

        {/* Messages List */}
        {activeConversation.messages.map((message) => {
          const isOwn = message.sender_id === 'current_user_id'; // Replace with actual user ID
          return renderMessage(message, isOwn);
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-neutral-200 p-4">
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-neutral-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedFile.type.startsWith('image/') ? (
                <Image className="h-4 w-4 text-neutral-500" />
              ) : (
                <Paperclip className="h-4 w-4 text-neutral-500" />
              )}
              <span className="text-sm text-neutral-700">{selectedFile.name}</span>
              <span className="text-xs text-neutral-500">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="p-2"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={(!messageText.trim() && !selectedFile) || sending}
              className="px-4 py-2"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};