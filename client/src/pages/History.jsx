import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const statusColors = {
  Active: 'bg-yellow-100 text-yellow-800',
  Responded: 'bg-blue-100 text-blue-800',
  Resolved: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-100 text-gray-800'
};

const statusIcons = {
  Active: ExclamationCircleIcon,
  Responded: ClockIcon,
  Resolved: CheckCircleIcon,
  Cancelled: XCircleIcon
};

export default function History() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/emergency/history');
      setEmergencies(response.data.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (start, end) => {
    if (!end) return 'Ongoing';
    const diff = new Date(end) - new Date(start);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} min`;
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Emergency History</h1>
          <p className="text-gray-600 mt-1">Your past emergency alerts and their status</p>
        </motion.div>

        {emergencies.length === 0 ? (
          <motion.div 
            className="card p-12 text-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ClockIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No emergency history</h3>
            <p className="text-gray-500">
              Your emergency alerts will appear here
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4 mt-8">
            {emergencies.map((emergency, index) => {
              const StatusIcon = statusIcons[emergency.status];
              
              return (
                <motion.div
                  key={emergency._id}
                  className="card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        emergency.status === 'Resolved' ? 'bg-green-100' :
                        emergency.status === 'Active' ? 'bg-yellow-100' :
                        emergency.status === 'Cancelled' ? 'bg-gray-100' : 'bg-blue-100'
                      }`}>
                        <StatusIcon className={`w-6 h-6 ${
                          emergency.status === 'Resolved' ? 'text-green-600' :
                          emergency.status === 'Active' ? 'text-yellow-600' :
                          emergency.status === 'Cancelled' ? 'text-gray-600' : 'text-blue-600'
                        }`} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{emergency.type} Emergency</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[emergency.status]}`}>
                            {emergency.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(emergency.createdAt)}
                        </p>
                        
                        {emergency.description && (
                          <p className="text-gray-600 mt-2">{emergency.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1 text-gray-500">
                            <MapPinIcon className="w-4 h-4" />
                            <span>
                              {emergency.location?.coordinates[1].toFixed(4)}, 
                              {emergency.location?.coordinates[0].toFixed(4)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-gray-500">
                            <ClockIcon className="w-4 h-4" />
                            <span>Duration: {getDuration(emergency.createdAt, emergency.resolvedAt)}</span>
                          </div>
                        </div>
                        
                        {emergency.contactsNotified?.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm text-gray-500">
                              {emergency.contactsNotified.filter(c => c.status === 'Sent').length} contacts notified
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {emergency.timeline?.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Timeline</h4>
                      <div className="space-y-2">
                        {emergency.timeline.slice(0, 5).map((event, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <span className="text-gray-600">{event.event}</span>
                            <span className="text-gray-400">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
