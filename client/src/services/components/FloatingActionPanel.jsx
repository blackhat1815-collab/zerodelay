import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import toast from 'react-hot-toast';

const publicActions = [
  { label: 'First Aid', to: '/first-aid', icon: BookOpenIcon },
  { label: 'Call 112', href: 'tel:112', icon: PhoneIcon },
];

const privateActions = [
  { label: 'Contacts', to: '/contacts', icon: UserGroupIcon },
  { label: 'History', to: '/history', icon: ClockIcon },
  { label: 'First Aid', to: '/first-aid', icon: BookOpenIcon },
  { label: 'Call 112', href: 'tel:112', icon: PhoneIcon },
];

export default function FloatingActionPanel() {
  const [open, setOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const { user } = useAuth();
  const { location, activeEmergency, triggerEmergency } = useEmergency();
  const navigate = useNavigate();
  const actions = user ? privateActions : publicActions;

  const handleSos = async () => {
    if (!user) {
      navigate('/login');
      setOpen(false);
      return;
    }

    if (!location) {
      toast.error('Enable location services before sending an emergency alert.');
      return;
    }

    setIsTriggering(true);
    try {
      await triggerEmergency();
      toast.success('Emergency alert sent.');
      navigate('/emergency');
      setOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to trigger emergency');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="w-[min(calc(100vw-2.5rem),22rem)] overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-gray-200"
          >
            <div className="border-b border-gray-100 bg-gray-950 px-4 py-3 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Quick Response</p>
                  <p className="text-xs text-gray-300">
                    {activeEmergency?.status === 'Active' ? 'Emergency active' : 'Ready when needed'}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">
                  {user ? 'Protected' : 'Guest'}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <button
                type="button"
                onClick={handleSos}
                disabled={isTriggering}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emergency-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emergency-600/25 transition-colors hover:bg-emergency-700 focus:outline-none focus:ring-2 focus:ring-emergency-500 focus:ring-offset-2 disabled:opacity-70"
              >
                <ShieldExclamationIcon className="h-5 w-5" />
                {isTriggering ? 'Sending Alert...' : user ? 'Send SOS Alert' : 'Sign In For SOS'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                {actions.map((action) => {
                  const Icon = action.icon;
                  const classes =
                    'flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:border-emergency-200 hover:bg-emergency-50 hover:text-emergency-700';

                  if (action.href) {
                    return (
                      <a key={action.label} href={action.href} className={classes}>
                        <Icon className="h-5 w-5" />
                        {action.label}
                      </a>
                    );
                  }

                  return (
                    <Link key={action.label} to={action.to} onClick={() => setOpen(false)} className={classes}>
                      <Icon className="h-5 w-5" />
                      {action.label}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emergency-600 ring-1 ring-gray-200">
                  <MapPinIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {location ? 'Location connected' : 'Waiting for location'}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {location
                      ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                      : 'Allow browser location access for SOS alerts'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-gray-950 text-white shadow-2xl ring-1 ring-white/20 transition-colors hover:bg-emergency-600 focus:outline-none focus:ring-2 focus:ring-emergency-500 focus:ring-offset-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        aria-label={open ? 'Close quick response panel' : 'Open quick response panel'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
            >
              <XMarkIcon className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
            >
              <PlusIcon className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
