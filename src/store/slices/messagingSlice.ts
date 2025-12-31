import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { messagingService, Conversation, Message, MessageThread } from '../../services/messagingService';

interface MessagingState {
  conversations: Conversation[];
  activeConversation: MessageThread | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMoreConversations: boolean;
  hasMoreMessages: boolean;
  isConnected: boolean;
}

const initialState: MessagingState = {
  conversations: [],
  activeConversation: null,
  unreadCount: 0,
  loading: false,
  error: null,
  hasMoreConversations: true,
  hasMoreMessages: true,
  isConnected: false,
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'messaging/fetchConversations',
  async (params?: {
    status?: 'active' | 'archived';
    type?: 'booking' | 'dispute' | 'support' | 'general';
    limit?: number;
    offset?: number;
  }) => {
    const response = await messagingService.getConversations(params);
    return response;
  }
);

export const fetchMessages = createAsyncThunk(
  'messaging/fetchMessages',
  async (params: {
    conversationId: string;
    limit?: number;
    offset?: number;
    before_message_id?: string;
  }) => {
    const { conversationId, ...queryParams } = params;
    const response = await messagingService.getMessages(conversationId, queryParams);
    return response;
  }
);

export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async (params: {
    conversationId: string;
    content: string;
    message_type?: 'text' | 'image' | 'document';
    metadata?: Record<string, any>;
  }) => {
    const { conversationId, ...messageData } = params;
    const message = await messagingService.sendMessage(conversationId, messageData);
    return { conversationId, message };
  }
);

export const createConversation = createAsyncThunk(
  'messaging/createConversation',
  async (data: {
    recipient_id: string;
    recipient_type: 'user' | 'operator' | 'admin';
    context?: {
      booking_id?: string;
      dispute_id?: string;
      type: 'booking' | 'dispute' | 'support' | 'general';
    };
    initial_message?: string;
  }) => {
    const conversation = await messagingService.createConversation(data);
    return conversation;
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'messaging/markAsRead',
  async (params: {
    conversationId: string;
    messageIds?: string[];
  }) => {
    await messagingService.markMessagesAsRead(params.conversationId, params.messageIds);
    return params;
  }
);

export const archiveConversation = createAsyncThunk(
  'messaging/archive',
  async (conversationId: string) => {
    await messagingService.archiveConversation(conversationId);
    return conversationId;
  }
);

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      
      // Update active conversation if it matches
      if (state.activeConversation?.conversation.id === conversationId) {
        state.activeConversation.messages.push(message);
        state.activeConversation.total_count += 1;
      }
      
      // Update conversation in list
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.last_message = message;
        conversation.updated_at = message.created_at;
        
        // Increment unread count if message is not from current user
        if (message.status === 'sent' && message.sender_id !== 'current_user_id') {
          conversation.unread_count += 1;
          state.unreadCount += 1;
        }
        
        // Move conversation to top of list
        const index = state.conversations.findIndex(c => c.id === conversationId);
        if (index > 0) {
          const [conv] = state.conversations.splice(index, 1);
          state.conversations.unshift(conv);
        }
      }
    },
    
    updateMessageStatus: (state, action: PayloadAction<{ messageId: string; status: 'delivered' | 'read' }>) => {
      if (state.activeConversation) {
        const message = state.activeConversation.messages.find(m => m.id === action.payload.messageId);
        if (message) {
          message.status = action.payload.status;
          if (action.payload.status === 'read') {
            message.read_at = new Date().toISOString();
          }
        }
      }
    },
    
    setActiveConversation: (state, action: PayloadAction<MessageThread | null>) => {
      state.activeConversation = action.payload;
    },
    
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetMessaging: (state) => {
      state.conversations = [];
      state.activeConversation = null;
      state.unreadCount = 0;
      state.hasMoreConversations = true;
      state.hasMoreMessages = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.meta.arg?.offset === 0 || !action.meta.arg?.offset) {
          // Replace conversations if this is the first page
          state.conversations = action.payload.conversations;
        } else {
          // Append conversations for pagination
          state.conversations.push(...action.payload.conversations);
        }
        
        state.hasMoreConversations = action.payload.has_more;
        state.unreadCount = action.payload.conversations.reduce(
          (total, conv) => total + conv.unread_count, 
          0
        );
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch conversations';
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.meta.arg.offset === 0 || !action.meta.arg.offset) {
          // Set as active conversation
          state.activeConversation = action.payload;
        } else {
          // Prepend older messages for pagination
          if (state.activeConversation) {
            state.activeConversation.messages = [
              ...action.payload.messages,
              ...state.activeConversation.messages,
            ];
            state.activeConversation.has_more = action.payload.has_more;
          }
        }
        
        state.hasMoreMessages = action.payload.has_more;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch messages';
      })
      
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        
        // Add message to active conversation
        if (state.activeConversation?.conversation.id === conversationId) {
          state.activeConversation.messages.push(message);
          state.activeConversation.total_count += 1;
        }
        
        // Update conversation in list
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation) {
          conversation.last_message = message;
          conversation.updated_at = message.created_at;
        }
      })
      
      // Create conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
      })
      
      // Mark as read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        
        // Update conversation unread count
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation) {
          state.unreadCount -= conversation.unread_count;
          conversation.unread_count = 0;
        }
        
        // Update messages in active conversation
        if (state.activeConversation?.conversation.id === conversationId) {
          state.activeConversation.messages.forEach(message => {
            if (message.status !== 'read') {
              message.status = 'read';
              message.read_at = new Date().toISOString();
            }
          });
        }
      })
      
      // Archive conversation
      .addCase(archiveConversation.fulfilled, (state, action) => {
        const conversationId = action.payload;
        const index = state.conversations.findIndex(c => c.id === conversationId);
        
        if (index > -1) {
          const conversation = state.conversations[index];
          state.unreadCount -= conversation.unread_count;
          state.conversations.splice(index, 1);
        }
        
        // Clear active conversation if it was archived
        if (state.activeConversation?.conversation.id === conversationId) {
          state.activeConversation = null;
        }
      });
  },
});

export const {
  addMessage,
  updateMessageStatus,
  setActiveConversation,
  setConnectionStatus,
  clearError,
  resetMessaging,
} = messagingSlice.actions;

export { messagingSlice };