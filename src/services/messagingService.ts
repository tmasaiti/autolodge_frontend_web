import { api } from './api';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'user' | 'operator' | 'admin' | 'system';
  recipient_id: string;
  recipient_type: 'user' | 'operator' | 'admin';
  message_type: 'text' | 'image' | 'document' | 'system_notification' | 'booking_update';
  content: string;
  metadata?: {
    booking_id?: string;
    dispute_id?: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    [key: string]: any;
  };
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
  read_at?: string;
}

export interface Conversation {
  id: string;
  participants: {
    user_id: string;
    user_type: 'user' | 'operator' | 'admin';
    name: string;
    avatar_url?: string;
  }[];
  last_message?: Message;
  unread_count: number;
  status: 'active' | 'archived' | 'blocked';
  context?: {
    booking_id?: string;
    dispute_id?: string;
    type: 'booking' | 'dispute' | 'support' | 'general';
  };
  created_at: string;
  updated_at: string;
}

export interface MessageThread {
  conversation: Conversation;
  messages: Message[];
  has_more: boolean;
  total_count: number;
}

class MessagingService {
  private baseUrl = '/messaging';

  /**
   * Get user conversations
   */
  async getConversations(params?: {
    status?: 'active' | 'archived';
    type?: 'booking' | 'dispute' | 'support' | 'general';
    limit?: number;
    offset?: number;
  }): Promise<{
    conversations: Conversation[];
    total: number;
    has_more: boolean;
  }> {
    const response = await api.get(`${this.baseUrl}/conversations`, { params });
    return response.data as {
      conversations: Conversation[];
      total: number;
      has_more: boolean;
    };
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string, params?: {
    limit?: number;
    offset?: number;
    before_message_id?: string;
  }): Promise<MessageThread> {
    const response = await api.get(`${this.baseUrl}/conversations/${conversationId}/messages`, { params });
    return response.data as MessageThread;
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, data: {
    content: string;
    message_type?: 'text' | 'image' | 'document';
    metadata?: Record<string, any>;
  }): Promise<Message> {
    const response = await api.post(`${this.baseUrl}/conversations/${conversationId}/messages`, data);
    return response.data as Message;
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: {
    recipient_id: string;
    recipient_type: 'user' | 'operator' | 'admin';
    context?: {
      booking_id?: string;
      dispute_id?: string;
      type: 'booking' | 'dispute' | 'support' | 'general';
    };
    initial_message?: string;
  }): Promise<Conversation> {
    const response = await api.post(`${this.baseUrl}/conversations`, data);
    return response.data as Conversation;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, messageIds?: string[]): Promise<void> {
    await api.patch(`${this.baseUrl}/conversations/${conversationId}/read`, {
      message_ids: messageIds,
    });
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    await api.patch(`${this.baseUrl}/conversations/${conversationId}/archive`);
  }

  /**
   * Block conversation
   */
  async blockConversation(conversationId: string): Promise<void> {
    await api.patch(`${this.baseUrl}/conversations/${conversationId}/block`);
  }

  /**
   * Upload file for message
   */
  async uploadFile(file: File): Promise<{
    file_url: string;
    file_name: string;
    file_size: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`${this.baseUrl}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data as {
      file_url: string;
      file_name: string;
      file_size: number;
    };
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, params?: {
    conversation_id?: string;
    message_type?: string;
    limit?: number;
  }): Promise<{
    messages: Message[];
    total: number;
  }> {
    const response = await api.get(`${this.baseUrl}/search`, {
      params: { query, ...params },
    });
    return response.data as {
      messages: Message[];
      total: number;
    };
  }

  /**
   * Get message statistics
   */
  async getMessageStats(): Promise<{
    total_conversations: number;
    unread_conversations: number;
    total_messages: number;
    unread_messages: number;
    by_type: Record<string, number>;
  }> {
    const response = await api.get(`${this.baseUrl}/stats`);
    return response.data as {
      total_conversations: number;
      unread_conversations: number;
      total_messages: number;
      unread_messages: number;
      by_type: Record<string, number>;
    };
  }

  /**
   * Subscribe to real-time messages via WebSocket
   */
  subscribeToMessages(onMessage: (message: Message) => void): () => void {
    const token = localStorage.getItem('auth_token');
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api${this.baseUrl}/ws?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        this.subscribeToMessages(onMessage);
      }, 3000);
    };

    // Return cleanup function
    return () => {
      ws.close();
    };
  }
}

export const messagingService = new MessagingService();