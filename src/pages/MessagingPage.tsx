import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MessageCircle, Plus, X } from 'lucide-react';
import { RootState, AppDispatch } from '../store/store';
import { 
  addMessage, 
  setConnectionStatus,
  resetMessaging
} from '../store/slices/messagingSlice';
import { ConversationList } from '../components/messaging/ConversationList';
import { MessageThread } from '../components/messaging/MessageThread';
import { NewConversationModal } from '../components/messaging/NewConversationModal';
import { messagingService, Conversation, Message } from '../services/messagingService';
import { useAuth } from '../contexts/AuthContext';

export const MessagingPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useAuth();
  const { activeConversation, isConnected } = useSelector((state: RootState) => state.messaging);
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Set up real-time messaging connection
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(resetMessaging());
      dispatch(setConnectionStatus(false));
      return;
    }

    // Subscribe to real-time messages
    const unsubscribe = messagingService.subscribeToMessages((message: Message) => {
      dispatch(addMessage({ 
        conversationId: message.conversation_id, 
        message 
      }));
    });

    // Mark as connected
    dispatch(setConnectionStatus(true));

    // Cleanup on unmount or auth change
    return () => {
      unsubscribe();
      dispatch(setConnectionStatus(false));
    };
  }, [isAuthenticated, dispatch]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationCreated = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
    setShowNewConversationModal(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Sign in to access messages</h2>
          <p className="text-neutral-600">You need to be signed in to view and send messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-50 flex">
      {/* Conversation List Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <MessageThread conversationId={selectedConversationId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Welcome to Messages
              </h3>
              <p className="text-neutral-600 mb-6">
                Select a conversation from the sidebar or start a new one
              </p>
              <button
                onClick={handleNewConversation}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Start New Conversation</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm">Reconnecting...</span>
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <NewConversationModal
          isOpen={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </div>
  );
};