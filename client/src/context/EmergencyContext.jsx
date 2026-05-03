import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const EmergencyContext = createContext(null);
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const socketUrl = configuredApiUrl || (isLocalhost ? 'http://localhost:5000' : 'https://zerodelay-api.onrender.com');

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

  const setLocation = (nextLocation) => {
    setLocationState(nextLocation);
    if (nextLocation) {
      localStorage.setItem('lastKnownLocation', JSON.stringify(nextLocation));
    }
  };

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
      setLocationError('');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError(error.message || 'Unable to get your location');
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
  }, []);

  const triggerEmergency = async (type = 'Medical', description = '') => {
    if (!location) {
      throw new Error('Location not available');
    }

    const response = await api.post('/emergency/trigger', {
      latitude: location.latitude,
      longitude: location.longitude,
      type,
      description
    });

    setActiveEmergency(response.data.data.emergency);
    setNearbyHospitals(response.data.data.nearbyHospitals);
    setFirstAidSteps(response.data.data.firstAidSteps);

    return response.data.data;
  };

  const cancelEmergency = async () => {
    if (activeEmergency) {
      await api.put(`/emergency/${activeEmergency._id}/status`, { status: 'Cancelled' });
      setActiveEmergency(null);
      setFirstAidSteps(null);
    }
  };

  const resolveEmergency = async () => {
    if (activeEmergency) {
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
      locationError,
      setLocation,
      requestLocation,
      nearbyHospitals,
      firstAidSteps,
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
