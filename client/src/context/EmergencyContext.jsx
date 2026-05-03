import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const EmergencyContext = createContext(null);

export function EmergencyProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [location, setLocation] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [firstAidSteps, setFirstAidSteps] = useState(null);

  useEffect(() => {
    if (user) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      
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

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );
    }
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
      setLocation,
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
