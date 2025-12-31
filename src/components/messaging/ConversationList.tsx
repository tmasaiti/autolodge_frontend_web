import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  Archive, 
  Filter,
  MoreVertical,
  User,
  Building,
  Shield
} from 'lucide-react';
import { RootState, AppDispatch } from '../../store/store';
import { 
  fetchConversations, 
  setActiveConversation,
  archiveConversation,
  fetchMessages
} from '../../store/slices/messagingSlice';
import { Conversation } from '../../services/messagingService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onConversationSelect?: (conversation: Conversation) => void;
  onNewConversation?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onConversationSelect,
  onNewConversation,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { conversations, loading, unreadCount } = useSelector((state: RootState) => state.messaging);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchConversations({ status: filter === 'archived' ? 'archived' : 'active' }));
  }, [dispatch, filter]);

  const handleConversationClick = async (conversation: Conversation) => {
    setSelectedConversation(conversation.id);
    
    // Fetch messages for this conversation
    await dispatch(fetchMessages({ conversationId: conversation.id }));
    
    if (onConversationSelect) {
      onConversationSelect(conversation);
    }
  };

  const handleArchive = (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(archiveConversation(conversationId));
  };

  const getParticipantInfo = (conversation: Conversation) => {
    // Find the other participant (not the current user)
    const otherParticipant = conversation.participants.find(p => p.user_id !== 'current_user_id');
    return otherParticipant || conversation.participants[0];
  };

  const getParticipantIcon = (userType: string) => {
    switch (userType) {
      case 'operator':
        return <Building className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getContextBadge = (context?: Conversation['context']) => {
    if (!context) return null;
    
    const colors = {
      booking: 'bg-blue-100 text-blue-800',
      dispute: 'bg-red-100 text-red-800',
      support: 'bg-green-100 text-green-800',
      general: 'bg-neutral-100 text-neutral-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[context.type]}`}>
        {context.type}
      </span>
    );
  };

  const filteredConversations = conversations.filter(conversation => {
    if (filter === 'unread' && conversation.unread_count === 0) return false;
    
    if (searchQuery) {
      const participant = getParticipantInfo(conversation);
      const query = searchQuery.toLowerCase();
      return (
        participant.name.toLowerCase().includes(query) ||
        conversation.last_message?.content.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-white border-r border-neutral-200">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Messages</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          
          {onNewConversation && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewConversation}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New</span>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          {(['all', 'unread', 'archived'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${filter === filterOption
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }
              `}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading conversations...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {filteredConversations.map((conversation) => {
              const participant = getParticipantInfo(conversation);
              const isSelected = selectedConversation === conversation.id;
              const timeAgo = conversation.last_message 
                ? formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })
                : formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true });

              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation)}
                  className={`
                    p-4 cursor-pointer transition-colors relative group
                    ${isSelected 
                      ? 'bg-primary-50 border-r-2 border-primary-500' 
                      : 'hover:bg-neutral-50'
                    }
                    ${conversation.unread_count > 0 ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {participant.avatar_url ? (
                        <img
                          src={participant.avatar_url}
                          alt={participant.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
                          {getParticipantIcon(participant.user_type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm font-medium truncate ${
                            conversation.unread_count > 0 ? 'text-neutral-900' : 'text-neutral-700'
                          }`}>
                            {participant.name}
                          </p>
                          {getContextBadge(conversation.context)}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-neutral-500">{timeAgo}</span>
                          {conversation.unread_count > 0 && (
                            <span className="bg-primary-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Last Message */}
                      {conversation.last_message && (
                        <p className={`text-sm mt-1 truncate ${
                          conversation.unread_count > 0 ? 'text-neutral-700 font-medium' : 'text-neutral-500'
                        }`}>
                          {conversation.last_message.message_type === 'text' 
                            ? conversation.last_message.content
                            : `📎 ${conversation.last_message.message_type}`
                          }
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleArchive(conversation.id, e)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
                        title="Archive conversation"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-neutral-600">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start a conversation to get help or connect with others'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};