import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  ExclamationTriangleIcon,
  FireIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldExclamationIcon,
  TruckIcon,
  WifiIcon,
  CloudIcon
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

const triggerTypes = [
  { value: 'Medical', label: 'Medical', helper: 'Health issue or injury', Icon: HeartIcon },
  { value: 'Accident', label: 'Accident', helper: 'Crash or road incident', Icon: TruckIcon },
  { value: 'Fire', label: 'Fire', helper: 'Smoke, fire, or burns', Icon: FireIcon },
  { value: 'Crime', label: 'Crime', helper: 'Violence or threat', Icon: ShieldExclamationIcon },
  { value: 'Natural Disaster', label: 'Disaster', helper: 'Flood, quake, or storm', Icon: CloudIcon },
  { value: 'Other', label: 'Other', helper: 'Anything urgent', Icon: ExclamationTriangleIcon },
];

const getOfflineChatResponse = (message) => {
  const text = message.toLowerCase();

  if (text.includes('cpr') || text.includes('breathing')) {
    return 'Offline CPR guidance:\n1. Call 112/102/108 as soon as signal is available.\n2. Place hands in the center of the chest.\n3. Push hard and fast, about 100-120 compressions per minute.\n4. Continue until help arrives or the person responds.';
  }

  if (text.includes('bleed') || text.includes('blood')) {
    return 'Offline bleeding guidance:\n1. Apply firm direct pressure with clean cloth.\n2. Keep pressure on the wound.\n3. Add more cloth if blood soaks through.\n4. Seek emergency help as soon as possible.';
  }

  if (text.includes('burn')) {
    return 'Offline burn guidance:\n1. Cool the burn under cool running water for 10-20 minutes.\n2. Remove tight items near the burn.\n3. Cover loosely with a clean dressing.\n4. Do not use ice, butter, or ointments.';
  }

  return 'Offline guidance:\n1. Stay calm and check for immediate danger.\n2. Move to safety if needed.\n3. Use 112, 102/108, 100, or 101 as soon as signal is available.\n4. Keep monitoring breathing and consciousness.';
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const openManualFallbackWindow = () => {
  const fallbackWindow = window.open('', 'zerodelay-emergency-fallback');

  if (!fallbackWindow) return null;

  fallbackWindow.document.title = 'Emergency alert fallback';
  fallbackWindow.document.body.innerHTML = `
    <main style="font-family: Arial, sans-serif; max-width: 720px; margin: 32px auto; padding: 0 16px; color: #111827;">
      <h1 style="color: #dc2626;">Preparing emergency alert...</h1>
      <p>Keep this window open. If automatic SMS/email is unavailable, your ready-to-send contact links will appear here.</p>
    </main>
  `;

  return fallbackWindow;
};

const renderManualFallbackWindow = (fallbackWindow, notifications) => {
  if (!fallbackWindow) return;

  const actionableNotifications = notifications.filter((notification) => (
    notification.status !== 'Sent' && notification.status !== 'Delivered'
  ));

  const rows = actionableNotifications.map((notification) => {
    const links = [
      notification.whatsappLink && ['WhatsApp', notification.whatsappLink, '#16a34a'],
      notification.smsLink && ['SMS', notification.smsLink, '#dc2626'],
      notification.emailLink && ['Email', notification.emailLink, '#2563eb']
    ].filter(Boolean);

    return `
      <section style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 12px 0; background: #f9fafb;">
        <h2 style="font-size: 18px; margin: 0 0 4px;">${escapeHtml(notification.contactName || 'Emergency contact')}</h2>
        <p style="margin: 0 0 12px; color: #4b5563;">${escapeHtml(notification.method)} - ${notification.status === 'NotConfigured' ? 'manual send required' : escapeHtml(notification.status)}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${links.map(([label, href, color]) => `
            <a href="${escapeHtml(href)}" target="_blank" rel="noreferrer" style="display: inline-block; background: ${color}; color: white; text-decoration: none; border-radius: 8px; padding: 10px 14px; font-weight: 700;">
              Send via ${label}
            </a>
          `).join('')}
        </div>
      </section>
    `;
  }).join('');

  fallbackWindow.document.title = 'Send emergency alert';
  fallbackWindow.document.body.innerHTML = `
    <main style="font-family: Arial, sans-serif; max-width: 760px; margin: 28px auto; padding: 0 16px; color: #111827;">
      <h1 style="color: #dc2626; margin-bottom: 8px;">Send Emergency Alert</h1>
      <p style="color: #4b5563; line-height: 1.5;">
        Automatic delivery is not available for one or more channels. Use these prepared links to send the exact emergency message to your contacts now.
      </p>
      ${rows || '<p style="padding: 16px; background: #fef2f2; border-radius: 8px;">No emergency contact channels are available. Add contacts with phone numbers or email addresses.</p>'}
    </main>
  `;
};

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
    queuedEmergencyCount,
    isOnline,
    syncQueuedEmergencies,
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
  const [notificationProviders, setNotificationProviders] = useState(null);
  const [manualSendNotifications, setManualSendNotifications] = useState([]);
  const [deliveryPopup, setDeliveryPopup] = useState(null);
  const [triggerStatusMessage, setTriggerStatusMessage] = useState('');
  const [showTriggerComposer, setShowTriggerComposer] = useState(false);

  const handleTriggerResult = (result) => {
    if (result.queued) {
      setManualSendNotifications([]);
      setTriggerStatusMessage('Emergency activated offline. It will send automatically when your network returns.');
      setDeliveryPopup({
        status: 'queued',
        deliveredCount: 0,
        smsCount: 0,
        emailCount: 0,
        failedCount: 0,
        manualCount: 0
      });
      setShowTriggerComposer(false);
      toast.success('No network. Emergency saved and will send automatically when online.');
      return;
    }

    const notifications = result.contactsNotified || result.emergency?.contactsNotified || [];
    const deliveredCount = notifications.filter((item) => (
      item.status === 'Sent' || item.status === 'Delivered'
    )).length;
    const notConfiguredCount = notifications.filter((item) => item.status === 'NotConfigured').length;
    const failedCount = notifications.filter((item) => item.status === 'Failed').length;
    const needsManualSend = notifications.filter((item) => (
      item.status !== 'Sent' && item.status !== 'Delivered'
    ));
    const sentByMethod = notifications.reduce((counts, item) => {
      if (item.status === 'Sent' || item.status === 'Delivered') {
        counts[item.method] = (counts[item.method] || 0) + 1;
      }
      return counts;
    }, {});

    setManualSendNotifications(needsManualSend);
    setTriggerStatusMessage(
      deliveredCount > 0
        ? `Notification sent. SMS: ${sentByMethod.SMS || 0}, Email: ${sentByMethod.Email || 0}.`
        : 'Emergency activated. Check contact details below.'
    );
    setDeliveryPopup({
      status: deliveredCount > 0 ? 'sent' : 'active',
      deliveredCount,
      smsCount: sentByMethod.SMS || 0,
      emailCount: sentByMethod.Email || 0,
      failedCount,
      manualCount: needsManualSend.length
    });
    setShowTriggerComposer(false);

    if (deliveredCount > 0 && notConfiguredCount + failedCount === 0) {
      toast.success(`Emergency alert sent to ${deliveredCount} contact${deliveredCount === 1 ? '' : 's'}.`);
    } else if (deliveredCount > 0) {
      toast.success(`Emergency alert sent to ${deliveredCount} contact${deliveredCount === 1 ? '' : 's'}. Use fallback links for the rest.`);
    } else if (notConfiguredCount > 0) {
      toast.success('Emergency activated. Use the fallback links to notify contacts now.');
    } else if (notifications.length === 0) {
      toast.error('Emergency saved, but no emergency contacts are set up to notify.');
    } else if (failedCount > 0) {
      toast.error('Emergency saved, but automatic delivery failed. Use the fallback links.');
    } else {
      toast.error('Emergency saved, but contact notification delivery failed.');
    }
  };

  useEffect(() => {
    if (transcript) {
      setDescription(prev => prev + ' ' + transcript);
    }
  }, [transcript]);

  useEffect(() => {
    let ignore = false;

    const fetchNotificationStatus = async () => {
      try {
        const response = await api.get('/health');
        if (!ignore) {
          setNotificationProviders(response.data.notifications || null);
        }
      } catch (error) {
        if (!ignore) {
          setNotificationProviders(null);
        }
      }
    };

    fetchNotificationStatus();

    return () => {
      ignore = true;
    };
  }, []);

  const handleTrigger = async (event) => {
    event?.preventDefault();
    if (isTriggering) return;

    setTriggerStatusMessage('Trigger clicked. Sending notifications now...');
    setDeliveryPopup({
      status: 'sending',
      deliveredCount: 0,
      smsCount: 0,
      emailCount: 0,
      failedCount: 0,
      manualCount: 0
    });
    setIsTriggering(true);
    try {
      const result = await triggerEmergency(selectedType, description);
      handleTriggerResult(result);
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setDescription('');
    } catch (error) {
      setTriggerStatusMessage(error.response?.data?.message || error.message || 'Failed to trigger emergency');
      setDeliveryPopup({
        status: 'failed',
        deliveredCount: 0,
        smsCount: 0,
        emailCount: 0,
        failedCount: 1,
        manualCount: 0,
        error: error.response?.data?.message || error.message || 'Failed to trigger emergency'
      });
      toast.error(error.response?.data?.message || error.message || 'Failed to trigger emergency');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this emergency?')) {
      try {
        await cancelEmergency();
        setShowTriggerComposer(false);
        toast.success('Emergency cancelled');
      } catch (error) {
        toast.error('Failed to cancel emergency');
      }
    }
  };

  const handleResolve = async () => {
    try {
      await resolveEmergency();
      setShowTriggerComposer(false);
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

  const handleOpenManualSendWindow = () => {
    const fallbackWindow = openManualFallbackWindow();
    renderManualFallbackWindow(fallbackWindow, manualSendNotifications);
  };

  const closeDeliveryPopup = () => {
    setDeliveryPopup(null);
  };

  const renderDeliveryPopup = () => {
    if (!deliveryPopup) return null;

    const isSending = deliveryPopup.status === 'sending';
    const isFailed = deliveryPopup.status === 'failed';
    const isQueued = deliveryPopup.status === 'queued';

    return createPortal(
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isFailed ? 'bg-red-100' : isSending ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            {isSending ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            ) : (
              <CheckCircleIcon className={`h-8 w-8 ${isFailed ? 'text-red-600' : 'text-green-600'}`} />
            )}
          </div>
          <h2 className="text-center text-xl font-bold text-gray-900">
            {isSending
              ? 'Sending Emergency Notifications'
              : isFailed
                ? 'Emergency Trigger Failed'
                : isQueued
                  ? 'Emergency Queued'
                  : 'Emergency Notification Sent'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSending
              ? 'Please wait. We are notifying your emergency contacts now.'
              : isFailed
                ? deliveryPopup.error
                : isQueued
                  ? 'Your emergency is active on this device and will be sent automatically when your network returns.'
                  : deliveryPopup.deliveredCount > 0
                    ? `Message sent to emergency contacts. ${deliveryPopup.deliveredCount} notification${deliveryPopup.deliveredCount === 1 ? '' : 's'} sent successfully.`
                    : 'Emergency has been activated.'}
          </p>
          {!isSending && !isFailed && !isQueued && (
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-2xl font-bold text-green-700">{deliveryPopup.smsCount}</p>
                <p className="text-xs text-green-800">SMS</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-2xl font-bold text-blue-700">{deliveryPopup.emailCount}</p>
                <p className="text-xs text-blue-800">Email</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3">
                <p className="text-2xl font-bold text-orange-700">{deliveryPopup.manualCount}</p>
                <p className="text-xs text-orange-800">Manual</p>
              </div>
            </div>
          )}
          {deliveryPopup.failedCount > 0 && !isFailed && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {deliveryPopup.failedCount} notification{deliveryPopup.failedCount === 1 ? '' : 's'} failed. Check contact notification details below.
            </p>
          )}
          {!isSending && (
            <button
              type="button"
              onClick={closeDeliveryPopup}
              className="mt-5 w-full rounded-lg bg-emergency-600 px-4 py-2 font-medium text-white hover:bg-emergency-700"
            >
              OK
            </button>
          )}
        </div>
      </div>,
      document.body
    );
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
          text: error.response?.data?.message || getOfflineChatResponse(message)
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
  const sentCount = notifications.filter((item) => item.status === 'Sent' || item.status === 'Delivered').length;
  const mockedCount = notifications.filter((item) => item.status === 'Mocked').length;
  const notConfiguredCount = notifications.filter((item) => item.status === 'NotConfigured').length;
  const activeLocationUnavailable = Boolean(activeEmergency?.locationUnavailable) && !location;
  const automaticNotificationsUnavailable = notificationProviders && (
    notificationProviders.sms?.configured === false ||
    notificationProviders.email?.configured === false
  );
  const missingNotificationSettings = notificationProviders
    ? [
        ...(notificationProviders.sms?.missing || []),
        ...(notificationProviders.email?.missing || [])
      ]
    : [];
  const selectedEmergencyType = triggerTypes.find((type) => type.value === selectedType) || triggerTypes[0];
  const SelectedEmergencyIcon = selectedEmergencyType.Icon;
  const locationSummary = location
    ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
    : locationLoading
      ? 'Getting location...'
      : 'No location yet';
  const triggerStatusTone = triggerStatusMessage.toLowerCase().includes('failed') ||
    triggerStatusMessage.toLowerCase().includes('unable')
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-green-200 bg-green-50 text-green-700';

  // Active Emergency View
  if (activeEmergency && activeEmergency.status === 'Active' && !showTriggerComposer) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        {renderDeliveryPopup()}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Status Header */}
          <motion.div 
            className="bg-emergency-600 text-white rounded-xl p-6 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-2xl">🚨</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Emergency Active</h1>
                  <p className="opacity-80">
                    {sentCount} delivered
                    {mockedCount > 0 && `, ${mockedCount} simulated`}
                    {notConfiguredCount > 0 && `, ${notConfiguredCount} need manual send`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTriggerStatusMessage('');
                    setDeliveryPopup(null);
                    setShowTriggerComposer(true);
                  }}
                  className="px-4 py-2 bg-white text-emergency-700 rounded-lg hover:bg-emergency-50 flex items-center gap-2 font-semibold"
                >
                  <ShieldExclamationIcon className="w-5 h-5" />
                  New alert
                </button>
                <button
                  type="button"
                  onClick={handleResolve}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Resolved
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>

          {manualSendNotifications.length > 0 && (
            <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Manual contact notification is ready.</p>
                  <p className="mt-1 text-sm">
                    Automatic SMS/email is unavailable for {manualSendNotifications.length} notification{manualSendNotifications.length === 1 ? '' : 's'}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenManualSendWindow}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                >
                  Open send links
                </button>
              </div>
            </div>
          )}

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
                    If a provider is not configured, open one of these channels to send the alert manually.
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
                              {notification.method} - {notification.status === 'NotConfigured' ? 'Manual send required' : notification.status}
                            </p>
                            {notification.error && (
                              <p className="mt-1 max-w-md text-xs text-red-600">
                                {notification.error}
                              </p>
                            )}
                          </div>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            notification.status === 'Sent'
                              ? 'bg-green-100 text-green-700'
                              : notification.status === 'Failed'
                                ? 'bg-red-100 text-red-700'
                                : notification.status === 'NotConfigured'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {notification.status === 'NotConfigured' ? 'Manual' : notification.status}
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
                  userLocation={activeLocationUnavailable ? null : location}
                  hospitals={nearbyHospitals}
                  height="250px"
                  zoom={15}
                />
                {activeLocationUnavailable ? (
                  <p className="mt-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                    Location was not available when the alert was triggered. Share your live location manually if a contact asks for it.
                  </p>
                ) : location && (
                  <p className="text-sm text-gray-500 mt-2">
                    Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    {location.accuracy ? ` - Accuracy ${Math.round(location.accuracy)}m` : ''}
                  </p>
                )}
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🏥 Nearest Hospitals</h2>
                <div className="space-y-4">
                  {nearbyHospitals.length > 0 ? (
                    nearbyHospitals.slice(0, 3).map((hospital, index) => (
                      <HospitalCard 
                        key={hospital._id || index}
                        hospital={hospital}
                        onNavigate={navigateToHospital}
                      />
                    ))
                  ) : (
                    <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                      Nearby hospitals will appear once a usable location is available.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      {renderDeliveryPopup()}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emergency-600">Emergency trigger</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-950">Send SOS alert</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Choose the emergency type, confirm your location, then send the alert.
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
            isOnline ? 'border-green-200 bg-green-50 text-green-800' : 'border-yellow-200 bg-yellow-50 text-yellow-800'
          }`}>
            <WifiIcon className="h-4 w-4" />
            {isOnline ? 'Online' : 'Offline queue'}
          </div>
        </motion.div>

        {(queuedEmergencyCount > 0 || automaticNotificationsUnavailable) && (
          <div className="mb-6 grid gap-3">
            {queuedEmergencyCount > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {queuedEmergencyCount} queued alert{queuedEmergencyCount === 1 ? '' : 's'} pending.
                </span>
                {isOnline && (
                  <button
                    type="button"
                    onClick={syncQueuedEmergencies}
                    className="rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                  >
                    Send queued now
                  </button>
                )}
              </div>
            )}

            {automaticNotificationsUnavailable && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                <p className="font-semibold">Automatic SMS/email notifications are not configured.</p>
                {missingNotificationSettings.length > 0 && (
                  <p className="mt-1">Missing server settings: {missingNotificationSettings.join(', ')}.</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <section className="card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Emergency type</h2>
                  <p className="text-sm text-gray-500">Selected: {selectedEmergencyType.label}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emergency-50 text-emergency-600">
                  <SelectedEmergencyIcon className="h-6 w-6" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {triggerTypes.map(({ value, label, helper, Icon }) => {
                  const selected = selectedType === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedType(value)}
                      aria-pressed={selected}
                      className={`flex min-h-24 items-start gap-3 rounded-lg border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emergency-500 focus:ring-offset-2 ${
                        selected
                          ? 'border-emergency-500 bg-emergency-50 text-emergency-900'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-emergency-200 hover:bg-emergency-50/60'
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        selected ? 'bg-emergency-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-semibold">{label}</span>
                        <span className="mt-1 block text-xs text-gray-500">{helper}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Location</h2>
                  <p className="text-sm text-gray-500">{locationSummary}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <MapPinIcon className="h-6 w-6" />
                </div>
              </div>

              <Map userLocation={location} hospitals={[]} height="220px" showUserRadius={true} />

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700">
                  {location
                    ? `Accuracy ${location.accuracy ? `${Math.round(location.accuracy)}m` : 'unknown'}`
                    : locationError || 'Location can be added manually if browser access is unavailable.'}
                </div>
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {locationLoading ? 'Checking...' : 'Refresh location'}
                </button>
              </div>

              {!location && (
                <div className="mt-4 grid gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={manualLocation.latitude}
                    onChange={handleManualLocationChange}
                    className="input bg-white"
                    placeholder="Latitude"
                  />
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={manualLocation.longitude}
                    onChange={handleManualLocationChange}
                    className="input bg-white"
                    placeholder="Longitude"
                  />
                  <button
                    type="button"
                    onClick={handleUseManualLocation}
                    className="rounded-lg bg-emergency-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emergency-700"
                  >
                    Use location
                  </button>
                </div>
              )}
            </section>

            <section className="card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Details</h2>
                  <p className="text-sm text-gray-500">Optional note for contacts and responders.</p>
                </div>
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                    isListening ? 'bg-emergency-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? <StopIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
                </button>
              </div>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the situation..."
                className="input min-h-32 resize-y"
              />
              {isListening && (
                <p className="mt-2 text-sm font-medium text-emergency-600">Listening...</p>
              )}
            </section>
          </motion.div>

          <motion.aside
            className="lg:sticky lg:top-24 lg:self-start"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="card overflow-visible p-5 sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emergency-50 text-emergency-600">
                  <SelectedEmergencyIcon className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-950">{selectedEmergencyType.label} alert</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {isOnline ? 'Ready to send now.' : 'Will queue until the network returns.'}
                  </p>
                </div>
              </div>

              <dl className="mb-5 grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <dt className="text-gray-500">Location</dt>
                  <dd className="max-w-40 truncate font-semibold text-gray-900">{locationSummary}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <dt className="text-gray-500">Queue</dt>
                  <dd className="font-semibold text-gray-900">{queuedEmergencyCount}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={handleTrigger}
                disabled={isTriggering}
                className="flex min-h-40 w-full select-none flex-col items-center justify-center rounded-xl bg-emergency-600 px-6 py-8 text-center font-bold text-white shadow-2xl shadow-emergency-600/25 ring-8 ring-emergency-100 transition-colors hover:bg-emergency-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-8 focus:ring-emergency-200"
              >
                {isTriggering ? (
                  <>
                    <span className="mb-3 h-9 w-9 animate-spin rounded-full border-4 border-white border-t-transparent" />
                    <span className="text-lg">Sending alert...</span>
                  </>
                ) : (
                  <>
                    <ShieldExclamationIcon className="mb-3 h-12 w-12" />
                    <span className="text-2xl">Trigger SOS</span>
                    <span className="mt-1 text-sm font-medium opacity-85">{selectedEmergencyType.label}</span>
                  </>
                )}
              </button>

              {triggerStatusMessage && (
                <div className={`mt-4 rounded-lg border px-3 py-3 text-sm font-medium ${triggerStatusTone}`}>
                  {triggerStatusMessage}
                </div>
              )}

              <a
                href="tel:112"
                className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                <PhoneIcon className="h-5 w-5" />
                Call 112
              </a>
            </div>
          </motion.aside>
        </div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {renderFirstAidChat()}
        </motion.div>
      </div>
    </div>
  );

  // Trigger Emergency View
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {renderDeliveryPopup()}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Emergency Response</h1>
          <p className="text-gray-600 mt-2">Select emergency type and trigger alert</p>
        </motion.div>

        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
          isOnline
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-yellow-200 bg-yellow-50 text-yellow-800'
        }`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {isOnline
                ? 'Online - emergency alerts can be sent now.'
                : 'Offline - emergency alerts will be saved on this device and retried when signal returns.'}
              {queuedEmergencyCount > 0 && ` ${queuedEmergencyCount} queued alert${queuedEmergencyCount === 1 ? '' : 's'} pending.`}
            </span>
            {queuedEmergencyCount > 0 && isOnline && (
              <button
                type="button"
                onClick={syncQueuedEmergencies}
                className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
              >
                Send queued now
              </button>
            )}
          </div>
        </div>

        {automaticNotificationsUnavailable && (
          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            <p className="font-semibold">Automatic SMS/email notifications are not configured.</p>
            <p className="mt-1">
              The emergency will still be saved, and manual WhatsApp/SMS/email links will be shown after triggering.
              {missingNotificationSettings.length > 0 && ` Missing server settings: ${missingNotificationSettings.join(', ')}.`}
            </p>
          </div>
        )}

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
                  type="button"
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
                  type="button"
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
            className="card relative z-30 p-6 flex flex-col items-center justify-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Ready to Alert</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isOnline
                  ? 'This will notify all your emergency contacts'
                  : 'This will save locally and send when signal returns'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleTrigger}
              disabled={isTriggering}
              className="relative z-40 flex h-44 w-44 select-none flex-col items-center justify-center rounded-full bg-emergency-600 font-bold text-white shadow-2xl shadow-emergency-600/30 ring-8 ring-emergency-100 transition-all hover:bg-emergency-700 hover:ring-emergency-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-8 focus:ring-emergency-200"
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
            </button>

            <button
              type="button"
              onClick={handleTrigger}
              disabled={isTriggering}
              className="relative z-40 mt-5 select-none rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-70"
            >
              {isTriggering ? 'Sending alert...' : 'Send alert now'}
            </button>

            {triggerStatusMessage && (
              <p className={`relative z-40 mt-3 text-center text-sm font-medium ${
                triggerStatusMessage.toLowerCase().includes('failed') || triggerStatusMessage.toLowerCase().includes('unable')
                  ? 'text-red-600'
                  : 'text-green-700'
              }`}>
                {triggerStatusMessage}
              </p>
            )}

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
