import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, Search, User, Building, Shield } from 'lucide-react';
import { AppDispatch } from '../../store/store';
import { createConversation } from '../../store/slices/messagingSlice';
import { Conversation } from '../../services/messagingService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

interface ContactOption {
  id: string;
  name: string;
  type: 'user' | 'operator' | 'admin';
  avatar_url?: string;
  description?: string;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null);
  const [conversationType, setConversationType] = useState<'general' | 'booking' | 'dispute' | 'support'>('general');
  const [initialMessage, setInitialMessage] = useState('');
  const [creating, setCreating] = useState(false);

  // Mock contacts - in real app, this would come from an API
  const mockContacts: ContactOption[] = [
    {
      id: 'admin-1',
      name: 'Customer Support',
      type: 'admin',
      description: 'Get help with your account and bookings',
    },
    {
      id: 'operator-1',
      name: 'Safari Rentals',
      type: 'operator',
      description: 'Vehicle operator in Johannesburg',
    },
    {
      id: 'operator-2',
      name: 'Cape Town Cars',
      type: 'operator',
      description: 'Premium vehicle rentals in Cape Town',
    },
  ];

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'operator':
        return <Building className="h-5 w-5 text-blue-600" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-green-600" />;
      default:
        return <User className="h-5 w-5 text-neutral-600" />;
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedContact) return;

    setCreating(true);
    try {
      const conversationData = {
        recipient_id: selectedContact.id,
        recipient_type: selectedContact.type as 'user' | 'operator' | 'admin',
        context: {
          type: conversationType,
        },
        initial_message: initialMessage.trim() || undefined,
      };

      const result = await dispatch(createConversation(conversationData)).unwrap();
      onConversationCreated(result);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedContact(null);
    setConversationType('general');
    setInitialMessage('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <Modal.Header>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Start New Conversation</h2>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-6">
          {/* Contact Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Who would you like to message?
            </label>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Contact List */}
            <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg">
              {filteredContacts.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`
                        w-full p-4 text-left hover:bg-neutral-50 transition-colors
                        ${selectedContact?.id === contact.id ? 'bg-primary-50 border-primary-200' : ''}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {contact.avatar_url ? (
                            <img
                              src={contact.avatar_url}
                              alt={contact.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                              {getContactIcon(contact.type)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900">{contact.name}</p>
                          {contact.description && (
                            <p className="text-sm text-neutral-600 truncate">{contact.description}</p>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 mt-1 capitalize">
                            {contact.type}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500">
                  <User className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                  <p>No contacts found</p>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Type */}
          {selectedContact && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Conversation Type
              </label>
              <select
                value={conversationType}
                onChange={(e) => setConversationType(e.target.value as any)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="general">General</option>
                <option value="booking">Booking Related</option>
                <option value="dispute">Dispute</option>
                <option value="support">Support</option>
              </select>
            </div>
          )}

          {/* Initial Message */}
          {selectedContact && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Initial Message (Optional)
              </label>
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex items-center justify-end space-x-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          
          <Button
            onClick={handleCreateConversation}
            disabled={!selectedContact || creating}
          >
            {creating ? 'Creating...' : 'Start Conversation'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};