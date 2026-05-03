import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  ClockIcon, 
  MapPinIcon,
  HeartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
import EmergencyButton from '../services/components/EmergencyButton';
import Map from '../services/components/Map';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const { location, nearbyHospitals, fetchNearbyHospitals, activeEmergency } = useEmergency();
  const [contacts, setContacts] = useState([]);
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbyHospitals();
    }
  }, [location]);

  const fetchData = async () => {
    try {
      const [contactsRes, historyRes] = await Promise.all([
        api.get('/contacts'),
        api.get('/emergency/history')
      ]);
      setContacts(contactsRes.data.data);
      setRecentEmergencies(historyRes.data.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">Your safety dashboard is ready</p>
        </motion.div>

        {/* Active Emergency Alert */}
        {activeEmergency && activeEmergency.status === 'Active' && (
          <motion.div 
            className="mb-6 p-4 bg-emergency-100 border-2 border-emergency-500 rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-emergency-600 animate-pulse" />
              <div className="flex-1">
                <h3 className="font-bold text-emergency-800">Active Emergency</h3>
                <p className="text-emergency-600">Help is on the way</p>
              </div>
              <Link 
                to="/emergency"
                className="btn-primary"
              >
                View Status
              </Link>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Emergency Button Section */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card p-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Emergency</h2>
              <div className="flex justify-center mb-6">
                <EmergencyButton size="small" />
              </div>
              <p className="text-sm text-gray-500">
                Tap to instantly alert your contacts and find nearby help
              </p>
              <Link 
                to="/emergency"
                className="btn-secondary w-full mt-4"
              >
                Advanced Options
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="card p-4 text-center">
                <UserGroupIcon className="w-8 h-8 mx-auto text-emergency-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{contacts.length}</div>
                <div className="text-sm text-gray-500">Contacts</div>
              </div>
              <div className="card p-4 text-center">
                <ClockIcon className="w-8 h-8 mx-auto text-emergency-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{recentEmergencies.length}</div>
                <div className="text-sm text-gray-500">Past Alerts</div>
              </div>
            </div>
          </motion.div>

          {/* Map & Hospitals */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Nearby Hospitals</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPinIcon className="w-4 h-4" />
                  {location ? 'Location active' : 'Getting location...'}
                </div>
              </div>
              
              <Map 
                userLocation={location}
                hospitals={nearbyHospitals.slice(0, 5)}
                height="300px"
              />
              
              {nearbyHospitals.length > 0 && (
                <div className="mt-4 space-y-2">
                  {nearbyHospitals.slice(0, 3).map((hospital, index) => (
                    <div 
                      key={hospital._id || index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{hospital.name}</p>
                        <p className="text-sm text-gray-500">
                          {hospital.distance} km away
                        </p>
                      </div>
                      <a
                        href={`tel:${hospital.emergencyPhone || hospital.phone}`}
                        className="px-3 py-1 bg-emergency-600 text-white text-sm rounded-lg"
                      >
                        Call
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Emergency Contacts */}
          <motion.div 
            className="card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Emergency Contacts</h2>
              <Link to="/contacts" className="text-emergency-600 text-sm font-medium">
                Manage
              </Link>
            </div>
            
            {contacts.length > 0 ? (
              <div className="space-y-3">
                {contacts.slice(0, 4).map((contact) => (
                  <div 
                    key={contact._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emergency-100 rounded-full flex items-center justify-center">
                        <span className="text-emergency-600 font-medium">
                          {contact.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-500">{contact.relationship}</p>
                      </div>
                    </div>
                    {contact.isPrimary && (
                      <span className="px-2 py-1 bg-emergency-100 text-emergency-700 text-xs rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserGroupIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No emergency contacts yet</p>
                <Link to="/contacts" className="btn-primary">
                  Add Contacts
                </Link>
              </div>
            )}
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            className="card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/first-aid"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
              >
                <HeartIcon className="w-8 h-8 mx-auto text-emergency-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">First Aid Guide</span>
              </Link>
              
              <Link 
                to="/profile"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
              >
                <UserGroupIcon className="w-8 h-8 mx-auto text-emergency-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Medical Profile</span>
              </Link>
              
              <Link 
                to="/history"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
              >
                <ClockIcon className="w-8 h-8 mx-auto text-emergency-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Alert History</span>
              </Link>
              
              <a 
                href="tel:112"
                className="p-4 bg-emergency-50 rounded-lg hover:bg-emergency-100 transition-colors text-center"
              >
                <div className="text-2xl mb-1">📞</div>
                <span className="text-sm font-medium text-emergency-700">Call 112</span>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
