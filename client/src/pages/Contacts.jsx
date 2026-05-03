import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import api from '../services/api';
import toast from 'react-hot-toast';

const relationships = ['Family', 'Friend', 'Doctor', 'Other'];

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'Family',
    isPrimary: false,
    notifyBySMS: true,
    notifyByEmail: true
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await api.get('/contacts');
      setContacts(response.data.data);
    } catch (error) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact._id}`, formData);
        toast.success('Contact updated');
      } else {
        await api.post('/contacts', formData);
        toast.success('Contact added');
      }
      
      fetchContacts();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await api.delete(`/contacts/${id}`);
      toast.success('Contact deleted');
      fetchContacts();
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const openModal = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        relationship: contact.relationship,
        isPrimary: contact.isPrimary,
        notifyBySMS: contact.notifyBySMS,
        notifyByEmail: contact.notifyByEmail
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        relationship: 'Family',
        isPrimary: false,
        notifyBySMS: true,
        notifyByEmail: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emergency-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emergency Contacts</h1>
            <p className="text-gray-600 mt-1">People who will be notified during emergencies</p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Contact
          </button>
        </motion.div>

        {contacts.length === 0 ? (
          <motion.div 
            className="card p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <PhoneIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No contacts yet</h3>
            <p className="text-gray-500 mb-6">Add emergency contacts to be notified during emergencies</p>
            <button
              onClick={() => openModal()}
              className="btn-primary"
            >
              Add Your First Contact
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact._id}
                  className="card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-emergency-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl text-emergency-600 font-bold">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{contact.name}</h3>
                          {contact.isPrimary && (
                            <StarSolidIcon className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded mt-1">
                          {contact.relationship}
                        </span>
                        
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center gap-2 text-gray-600">
                            <PhoneIcon className="w-4 h-4" />
                            <a href={`tel:${contact.phone}`} className="hover:text-emergency-600">
                              {contact.phone}
                            </a>
                            {contact.notifyBySMS && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                SMS
                              </span>
                            )}
                          </div>
                          {contact.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <EnvelopeIcon className="w-4 h-4" />
                              <a href={`mailto:${contact.email}`} className="hover:text-emergency-600">
                                {contact.email}
                              </a>
                              {contact.notifyByEmail && (
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                  Email
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(contact)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            >
              <motion.div
                className="bg-white rounded-xl w-full max-w-md p-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      placeholder="contact@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Relationship</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="input"
                    >
                      {relationships.map((rel) => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.isPrimary}
                        onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                        className="w-4 h-4 text-emergency-600 rounded"
                      />
                      <span className="text-gray-700">Set as primary contact</span>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.notifyBySMS}
                        onChange={(e) => setFormData({ ...formData, notifyBySMS: e.target.checked })}
                        className="w-4 h-4 text-emergency-600 rounded"
                      />
                      <span className="text-gray-700">Notify via SMS</span>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.notifyByEmail}
                        onChange={(e) => setFormData({ ...formData, notifyByEmail: e.target.checked })}
                        className="w-4 h-4 text-emergency-600 rounded"
                      />
                      <span className="text-gray-700">Notify via Email</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                    >
                      {editingContact ? 'Update' : 'Add Contact'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
