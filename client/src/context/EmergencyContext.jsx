import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const EmergencyContext = createContext(null);
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const socketUrl = configuredApiUrl || (isLocalhost ? 'http://localhost:5000' : 'https://zerodelay-api.onrender.com');
const EMERGENCY_QUEUE_KEY = 'queuedEmergencyTriggers';

const emergencyNumbers = {
  ambulance: '102 / 108',
  police: '100',
  fire: '101',
  disaster: '1078',
  universal: '112'
};

const fallbackFirstAidSteps = {
  Medical: [
    { step: 1, instruction: 'Ensure the scene is safe before approaching', duration: '5 seconds' },
    { step: 2, instruction: 'Call emergency services immediately', duration: '30 seconds', critical: true },
    { step: 3, instruction: 'Check responsiveness and breathing', duration: '10 seconds' },
    { step: 4, instruction: 'If not breathing, begin CPR if trained', duration: 'Until help arrives' }
  ],
  Accident: [
    { step: 1, instruction: 'Move away from traffic or danger if safe', duration: 'Immediate', critical: true },
    { step: 2, instruction: 'Call ambulance/police emergency services', duration: '30 seconds' },
    { step: 3, instruction: 'Do not move an injured person unless there is immediate danger', duration: 'Ongoing' },
    { step: 4, instruction: 'Control visible bleeding with direct pressure', duration: 'Ongoing' }
  ],
  Fire: [
    { step: 1, instruction: 'Evacuate immediately and warn others', duration: 'Immediate', critical: true },
    { step: 2, instruction: 'Call fire services', duration: '30 seconds' },
    { step: 3, instruction: 'Stay low under smoke and avoid elevators', duration: 'Ongoing' },
    { step: 4, instruction: 'If clothes catch fire: stop, drop, and roll', duration: '30 seconds' }
  ],
  Crime: [
    { step: 1, instruction: 'Prioritize safety and move to a secure place', duration: 'Immediate', critical: true },
    { step: 2, instruction: 'Call police when safe', duration: '30 seconds' },
    { step: 3, instruction: 'Do not confront the attacker', duration: 'Ongoing' },
    { step: 4, instruction: 'Remember details for responders if possible', duration: 'Ongoing' }
  ],
  'Natural Disaster': [
    { step: 1, instruction: 'Move away from immediate danger', duration: 'Immediate', critical: true },
    { step: 2, instruction: 'Call emergency/disaster helpline if possible', duration: '30 seconds' },
    { step: 3, instruction: 'Avoid damaged structures and power lines', duration: 'Ongoing' },
    { step: 4, instruction: 'Follow local official instructions', duration: 'Ongoing' }
  ],
  Other: [
    { step: 1, instruction: 'Stay calm and assess immediate danger', duration: '15 seconds' },
    { step: 2, instruction: 'Call the appropriate emergency service', duration: '30 seconds', critical: true },
    { step: 3, instruction: 'Share your location clearly', duration: '30 seconds' },
    { step: 4, instruction: 'Follow dispatcher instructions', duration: 'Ongoing' }
  ]
};

const getQueuedEmergencies = () => {
  try {
    return JSON.parse(localStorage.getItem(EMERGENCY_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveQueuedEmergencies = (items) => {
  localStorage.setItem(EMERGENCY_QUEUE_KEY, JSON.stringify(items));
};

const createOfflineFirstAid = (type) => ({
  type,
  steps: fallbackFirstAidSteps[type] || fallbackFirstAidSteps.Other,
  disclaimer: 'Offline guidance only. Contact emergency services as soon as signal is available.',
  emergencyNumbers
});

export function EmergencyProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [location, setLocationState] = useState(() => {
    try {
      const savedLocation = localStorage.getItem('lastKnownLocation');
      return savedLocation ? JSON.parse(savedLocation) : null;
    } catch {
      return null;
    }
  });
  const [locationError, setLocationError] = useState('');
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [firstAidSteps, setFirstAidSteps] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [queuedEmergencyCount, setQueuedEmergencyCount] = useState(() => getQueuedEmergencies().length);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  const setLocation = (nextLocation) => {
    setLocationState(nextLocation);
    if (nextLocation) {
      localStorage.setItem('lastKnownLocation', JSON.stringify(nextLocation));
    }
  };

  const syncQueuedEmergencies = async () => {
    const queued = getQueuedEmergencies();
    if (!queued.length || !navigator.onLine) return;

    const remaining = [];

    for (const item of queued) {
      try {
        await api.post('/emergency/trigger', item.payload);
      } catch (error) {
        remaining.push(item);
      }
    }

    saveQueuedEmergencies(remaining);
    setQueuedEmergencyCount(remaining.length);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueuedEmergencies();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      syncQueuedEmergencies();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const newSocket = io(socketUrl);
      
      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('join_user_room', user.id);
      });

      newSocket.on('emergency_triggered', (data) => {
        setActiveEmergency(data);
        setNearbyHospitals(data.hospitals);
        setFirstAidSteps(data.firstAidSteps);
      });

      newSocket.on('emergency_updated', (data) => {
        setActiveEmergency(prev => prev ? { ...prev, ...data } : null);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      setLocationError('');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError(error.message || 'Unable to get your location');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser');
    }
  };

  // Get current location
  useEffect(() => {
    requestLocation();
    if (!navigator.geolocation) return undefined;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLocationError('');
      },
      (error) => {
        console.error('Error watching location:', error);
        setLocationError(error.message || 'Unable to keep location updated');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const triggerEmergency = async (type = 'Medical', description = '') => {
    if (!location) {
      throw new Error('Location not available');
    }

    const payload = {
      latitude: location.latitude,
      longitude: location.longitude,
      type,
      description
    };

    try {
      const response = await api.post('/emergency/trigger', payload);

      setActiveEmergency(response.data.data.emergency);
      setNearbyHospitals(response.data.data.nearbyHospitals);
      setFirstAidSteps(response.data.data.firstAidSteps);

      return response.data.data;
    } catch (error) {
      const shouldQueue = !navigator.onLine || !error.response;

      if (!shouldQueue) {
        throw error;
      }

      const queuedItem = {
        id: crypto.randomUUID?.() || `${Date.now()}`,
        createdAt: new Date().toISOString(),
        payload
      };
      const queued = [...getQueuedEmergencies(), queuedItem];
      saveQueuedEmergencies(queued);
      setQueuedEmergencyCount(queued.length);

      const offlineEmergency = {
        _id: queuedItem.id,
        status: 'Active',
        type,
        description,
        queued: true,
        createdAt: queuedItem.createdAt,
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        contactsNotified: [],
        nearbyHospitals: []
      };
      const offlineFirstAid = createOfflineFirstAid(type);

      setActiveEmergency(offlineEmergency);
      setNearbyHospitals([]);
      setFirstAidSteps(offlineFirstAid);

      return {
        emergency: offlineEmergency,
        nearbyHospitals: [],
        contactsNotified: [],
        firstAidSteps: offlineFirstAid,
        queued: true
      };
    }
  };

  const cancelEmergency = async () => {
    if (activeEmergency) {
      if (activeEmergency.queued) {
        const remaining = getQueuedEmergencies().filter((item) => item.id !== activeEmergency._id);
        saveQueuedEmergencies(remaining);
        setQueuedEmergencyCount(remaining.length);
        setActiveEmergency(null);
        setFirstAidSteps(null);
        return;
      }

      await api.put(`/emergency/${activeEmergency._id}/status`, { status: 'Cancelled' });
      setActiveEmergency(null);
      setFirstAidSteps(null);
    }
  };

  const resolveEmergency = async () => {
    if (activeEmergency) {
      if (activeEmergency.queued) {
        const remaining = getQueuedEmergencies().filter((item) => item.id !== activeEmergency._id);
        saveQueuedEmergencies(remaining);
        setQueuedEmergencyCount(remaining.length);
        setActiveEmergency(null);
        setFirstAidSteps(null);
        return;
      }

      await api.put(`/emergency/${activeEmergency._id}/status`, { status: 'Resolved' });
      setActiveEmergency(null);
      setFirstAidSteps(null);
    }
  };

  const fetchNearbyHospitals = async () => {
    if (!location) return;
    
    const response = await api.get('/hospitals/nearby', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 10000
      }
    });
    
    setNearbyHospitals(response.data.data);
    return response.data.data;
  };

  return (
    <EmergencyContext.Provider value={{
      socket,
      activeEmergency,
      location,
      locationLoading,
      locationError,
      setLocation,
      requestLocation,
      nearbyHospitals,
      firstAidSteps,
      queuedEmergencyCount,
      isOnline,
      syncQueuedEmergencies,
      triggerEmergency,
      cancelEmergency,
      resolveEmergency,
      fetchNearbyHospitals
    }}>
      {children}
    </EmergencyContext.Provider>
  );
}

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
