import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function EmergencyButton({ size = 'large' }) {
  const { user } = useAuth();
  const { triggerEmergency, location } = useEmergency();
  const [isTriggering, setIsTriggering] = useState(false);
  const navigate = useNavigate();

  const handleEmergency = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!location) {
      toast.error('Unable to get your location. Please enable location services.');
      return;
    }

    setIsTriggering(true);
    try {
      await triggerEmergency();
      toast.success('Emergency triggered! Help is on the way.');
      navigate('/emergency');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to trigger emergency');
    } finally {
      setIsTriggering(false);
    }
  };

  const buttonSize = size === 'large' 
    ? 'w-64 h-64 text-3xl' 
    : 'w-32 h-32 text-xl';

  return (
    <motion.button
      onClick={handleEmergency}
      disabled={isTriggering}
      className={`${buttonSize} rounded-full bg-emergency-600 text-white font-bold 
        shadow-2xl emergency-glow flex flex-col items-center justify-center
        hover:bg-emergency-700 transition-colors disabled:opacity-70
        focus:outline-none focus:ring-4 focus:ring-emergency-300`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isTriggering ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5, repeat: isTriggering ? Infinity : 0 }}
    >
      {isTriggering ? (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-2"></div>
          <span>Sending...</span>
        </>
      ) : (
        <>
          <span className="text-5xl mb-2">🚨</span>
          <span>EMERGENCY</span>
          <span className="text-sm mt-2 opacity-80">Tap for help</span>
        </>
      )}
    </motion.button>
  );
}
