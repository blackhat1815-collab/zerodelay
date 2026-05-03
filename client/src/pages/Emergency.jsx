import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MicrophoneIcon, 
  StopIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';
import {
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { useEmergency } from '../context/EmergencyContext';
import { useVoiceRecognition } from '../services/hooks/useVoiceRecognition';
import Map from '../services/components/Map';
import FirstAidCard from '../services/components/FirstAidCard';
import HospitalCard from '../services/components/HospitalCard';
import api from '../services/api';
import toast from 'react-hot-toast';

const emergencyTypes = [
  { value: 'Medical', label: 'Medical Emergency', icon: '🏥' },
  { value: 'Accident', label: 'Accident', icon: '🚗' },
  { value: 'Fire', label: 'Fire', icon: '🔥' },
  { value: 'Crime', label: 'Crime/Violence', icon: '🚨' },
  { value: 'Natural Disaster', label: 'Natural Disaster', icon: '🌊' },
  { value: 'Other', label: 'Other', icon: '⚠️' },
];

export default function Emergency() {
  const { 
    activeEmergency, 
    location, 
    locationLoading,
    locationError,
    setLocation,
    requestLocation,
    nearbyHospitals, 
    firstAidSteps,
    triggerEmergency, 
    cancelEmergency,
    resolveEmergency 
  } = useEmergency();
  
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceRecognition();
  
  const [selectedType, setSelectedType] = useState('Medical');
  const [description, setDescription] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [manualLocation, setManualLocation] = useState({
    latitude: '',
    longitude: ''
  });
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Tell me what happened and I will give quick first aid guidance.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (transcript) {
      setDescription(prev => prev + ' ' + transcript);
    }
  }, [transcript]);

  const handleTrigger = async () => {
    if (!location) {
      toast.error('Unable to get your location. Please enable location services.');
      return;
    }

    setIsTriggering(true);
    try {
      await triggerEmergency(selectedType, description);
      toast.success('Emergency alert sent! Help is on the way.');
      setCurrentStep(0);
      setCompletedSteps(new Set());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to trigger emergency');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this emergency?')) {
      try {
        await cancelEmergency();
        toast.success('Emergency cancelled');
      } catch (error) {
        toast.error('Failed to cancel emergency');
      }
    }
  };

  const handleResolve = async () => {
    try {
      await resolveEmergency();
      toast.success('Emergency resolved. Stay safe!');
    } catch (error) {
      toast.error('Failed to resolve emergency');
    }
  };

  const handleStepComplete = (stepIndex) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
    if (stepIndex === currentStep) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const navigateToHospital = (hospital) => {
    const coords = hospital.coordinates || hospital.location?.coordinates;
    if (coords) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`,
        '_blank'
      );
    }
  };

  const handleManualLocationChange = (e) => {
    setManualLocation({ ...manualLocation, [e.target.name]: e.target.value });
  };

  const handleUseManualLocation = () => {
    const latitude = Number(manualLocation.latitude);
    const longitude = Number(manualLocation.longitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      toast.error('Enter a valid latitude between -90 and 90');
      return;
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      toast.error('Enter a valid longitude between -180 and 180');
      return;
    }

    setLocation({ latitude, longitude });
    toast.success('Location set');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const message = chatInput.trim();

    if (!message || chatLoading) return;

    const nextMessages = [...chatMessages, { role: 'user', text: message }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await api.post('/first-aid/chat', {
        message,
        context: {
          emergencyType: selectedType,
          activeEmergency: Boolean(activeEmergency),
          description
        }
      });

      setChatMessages([
        ...nextMessages,
        { role: 'assistant', text: response.data.data.response }
      ]);
    } catch (error) {
      setChatMessages([
        ...nextMessages,
        {
          role: 'assistant',
          text: error.response?.data?.message || 'I could not reach first aid chat. Call 112 if this is urgent.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const renderFirstAidChat = () => (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">First Aid Chat</h2>
      <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
        {chatMessages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-lg px-3 py-2 text-sm ${
              message.role === 'user'
                ? 'ml-auto bg-emergency-600 text-white'
                : 'mr-auto bg-white text-gray-800 ring-1 ring-gray-200'
            } max-w-[85%] whitespace-pre-line`}
          >
            {message.text}
          </div>
        ))}
        {chatLoading && (
          <div className="mr-auto max-w-[85%] rounded-lg bg-white px-3 py-2 text-sm text-gray-500 ring-1 ring-gray-200">
            Thinking...
          </div>
        )}
      </div>
      <form onSubmit={handleChatSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="input"
          placeholder="Ask about CPR, bleeding, burns..."
        />
        <button
          type="submit"
          disabled={chatLoading || !chatInput.trim()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );

  const notifications = activeEmergency?.contactsNotified || [];
  const sentCount = notifications.filter((item) => item.status === 'Sent').length;
  const mockedCount = notifications.filter((item) => item.status === 'Mocked').length;

  // Active Emergency View
  if (activeEmergency && activeEmergency.status === 'Active') {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Status Header */}
          <motion.div 
            className="bg-emergency-600 text-white rounded-xl p-6 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-2xl">🚨</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Emergency Active</h1>
                  <p className="opacity-80">
                    {sentCount} delivered, {mockedCount} ready to send
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleResolve}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Resolved
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* First Aid Section */}
            <motion.div 
              className="card p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🩺 First Aid Guidance
              </h2>
              
              {firstAidSteps?.steps && (
                <div className="space-y-3">
                  {firstAidSteps.steps.map((step, index) => (
                    <FirstAidCard
                      key={index}
                      step={step}
                      isActive={index === currentStep}
                      isCompleted={completedSteps.has(index)}
                      onComplete={() => handleStepComplete(index)}
                    />
                  ))}
                </div>
              )}
              
              {firstAidSteps?.emergencyNumbers && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Emergency Numbers</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(firstAidSteps.emergencyNumbers).map(([key, value]) => (
                      <a
                        key={key}
                        href={`tel:${value.split('/')[0].trim()}`}
                        className="flex justify-between items-center p-2 bg-white rounded hover:bg-gray-100"
                      >
                        <span className="text-sm capitalize text-gray-600">{key}</span>
                        <span className="font-bold text-emergency-600">{value}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {renderFirstAidChat()}

            {/* Map & Hospitals */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {notifications.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Notifications</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Open one of these channels to send the alert now.
                  </p>
                  <div className="space-y-3">
                    {notifications.map((notification, index) => (
                      <div
                        key={`${notification.contact || index}-${notification.method}`}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {notification.contactName || `Contact ${index + 1}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {notification.method} - {notification.status}
                            </p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            notification.status === 'Sent'
                              ? 'bg-green-100 text-green-700'
                              : notification.status === 'Failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {notification.status}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {notification.whatsappLink && (
                            <a
                              href={notification.whatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4" />
                              WhatsApp
                            </a>
                          )}
                          {notification.smsLink && (
                            <a
                              href={notification.smsLink}
                              className="inline-flex items-center gap-1 rounded-lg bg-emergency-600 px-3 py-2 text-sm font-medium text-white hover:bg-emergency-700"
                            >
                              <PhoneIcon className="h-4 w-4" />
                              SMS
                            </a>
                          )}
                          {notification.emailLink && (
                            <a
                              href={notification.emailLink}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                              <EnvelopeIcon className="h-4 w-4" />
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📍 Your Location</h2>
                <Map 
                  userLocation={location}
                  hospitals={nearbyHospitals}
                  height="250px"
                  zoom={15}
                />
                {location && (
                  <p className="text-sm text-gray-500 mt-2">
                    Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    {location.accuracy ? ` - Accuracy ${Math.round(location.accuracy)}m` : ''}
                  </p>
                )}
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🏥 Nearest Hospitals</h2>
                <div className="space-y-4">
                  {nearbyHospitals.slice(0, 3).map((hospital, index) => (
                    <HospitalCard 
                      key={hospital._id || index}
                      hospital={hospital}
                      onNavigate={navigateToHospital}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Trigger Emergency View
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Emergency Response</h1>
          <p className="text-gray-600 mt-2">Select emergency type and trigger alert</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Emergency Type & Description */}
          <motion.div 
            className="card p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Emergency Type</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {emergencyTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedType === type.value
                      ? 'border-emergency-500 bg-emergency-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="label">Additional Details (Optional)</label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the situation..."
                  className="input h-24 resize-none pr-12"
                />
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-2 bottom-2 p-2 rounded-full ${
                    isListening ? 'bg-emergency-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isListening ? (
                    <StopIcon className="w-5 h-5" />
                  ) : (
                    <MicrophoneIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isListening && (
                <p className="text-sm text-emergency-600 mt-1 animate-pulse">
                  🎤 Listening...
                </p>
              )}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Location:</strong>{' '}
                {location 
                  ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : locationLoading ? 'Getting location...' : 'Location unavailable'
                }
              </p>
            </div>

            {!location && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  {locationError || 'Allow location access in your browser to trigger an emergency.'}
                </p>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="mt-3 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Try location again
                </button>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={manualLocation.latitude}
                    onChange={handleManualLocationChange}
                    className="input"
                    placeholder="Latitude"
                  />
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={manualLocation.longitude}
                    onChange={handleManualLocationChange}
                    className="input"
                    placeholder="Longitude"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseManualLocation}
                  className="mt-3 w-full rounded-lg bg-emergency-600 px-3 py-2 text-sm font-medium text-white hover:bg-emergency-700"
                >
                  Use manual location
                </button>
              </div>
            )}
          </motion.div>

          {/* Right: Emergency Button & Preview */}
          <motion.div 
            className="card p-6 flex flex-col items-center justify-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Ready to Alert</h2>
              <p className="text-sm text-gray-500 mt-1">
                This will notify all your emergency contacts
              </p>
            </div>

            <motion.button
              onClick={handleTrigger}
              disabled={isTriggering || !location}
              className="w-40 h-40 rounded-full bg-emergency-600 text-white font-bold 
                shadow-2xl emergency-glow flex flex-col items-center justify-center
                hover:bg-emergency-700 transition-colors disabled:opacity-70
                focus:outline-none focus:ring-4 focus:ring-emergency-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isTriggering ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent mb-2"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span className="text-4xl mb-2">🚨</span>
                  <span className="text-lg">TRIGGER</span>
                  <span className="text-xs mt-1 opacity-80">Emergency</span>
                </>
              )}
            </motion.button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Type: <strong className="text-gray-900">{selectedType}</strong>
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {renderFirstAidChat()}
        </motion.div>

        {/* Map Preview */}
        <motion.div 
          className="card p-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Location Preview</h2>
          <Map 
            userLocation={location}
            hospitals={[]}
            height="200px"
            showUserRadius={true}
          />
        </motion.div>
      </div>
    </div>
  );
}
