import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BoltIcon, 
  MapPinIcon, 
  HeartIcon, 
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import EmergencyButton from '../services/components/EmergencyButton';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: BoltIcon,
    title: 'Instant Alert',
    description: 'One tap or voice command triggers immediate emergency response'
  },
  {
    icon: MapPinIcon,
    title: 'Live Location',
    description: 'Real-time GPS tracking shared with emergency contacts and responders'
  },
  {
    icon: HeartIcon,
    title: 'AI First Aid',
    description: 'Step-by-step guidance for immediate medical assistance'
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Multi-Channel Alerts',
    description: 'SMS, email, and push notifications to all emergency contacts'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Nearest Help',
    description: 'Automatic detection of nearby hospitals and emergency services'
  },
  {
    icon: ClockIcon,
    title: 'Zero Delay',
    description: 'Response time reduced to seconds, not minutes'
  }
];

const emergencyNumbers = [
  { name: 'National Emergency', number: '112' },
  { name: 'Ambulance', number: '102/108' },
  { name: 'Police', number: '100' },
  { name: 'Fire', number: '101' },
  { name: 'Disaster', number: '1078' },
  { name: 'Women Helpline', number: '1091' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-emergency-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-emergency-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emergency-500/20 rounded-full mb-6">
                <span className="w-2 h-2 bg-emergency-500 rounded-full animate-pulse"></span>
                <span className="text-emergency-300 text-sm font-medium">Every second matters</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-gradient">ZeroDelay</span>
              </h1>
              <p className="text-2xl lg:text-3xl text-gray-300 mt-4">
                AI-Powered Emergency Response
              </p>
              
              <p className="text-lg text-gray-400 mt-6 max-w-xl">
                In India alone, thousands of lives are lost not because help isn't available, 
                but because it arrives too late. ZeroDelay reduces response time to near zero.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-8">
                {user ? (
                  <Link to="/dashboard" className="btn-primary text-lg px-8 py-4">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary text-lg px-8 py-4">
                      Get Started Free
                    </Link>
                    <Link to="/login" className="btn bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-4">
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
            
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <EmergencyButton />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900">
              What makes ZeroDelay powerful
            </h2>
            <p className="text-xl text-gray-600 mt-4">
              Simplicity. No complex setup. No delay. Just immediate action.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card p-6 hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 bg-emergency-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emergency-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="text-xl text-gray-600 mt-4">Three steps to safety</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Tap or Speak', desc: 'Press the emergency button or use voice command', icon: '👆' },
              { step: '2', title: 'Alert Sent', desc: 'Location shared with contacts & nearest hospitals found', icon: '📍' },
              { step: '3', title: 'Get Guided', desc: 'AI provides step-by-step first aid until help arrives', icon: '🏥' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="w-20 h-20 mx-auto bg-emergency-600 rounded-full flex items-center justify-center text-4xl shadow-lg mb-6">
                  {item.icon}
                </div>
                <div className="text-sm font-medium text-emergency-600 mb-2">Step {item.step}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Numbers */}
      <section className="py-16 bg-emergency-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8">Emergency Numbers (India)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {emergencyNumbers.map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number.split('/')[0]}`}
                className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors"
              >
                <div className="text-2xl font-bold">{item.number}</div>
                <div className="text-sm opacity-80">{item.name}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">This is not just a project.</h2>
            <p className="text-2xl text-gray-300 mb-8">This is something that can save lives.</p>
            <p className="text-lg text-gray-400 mb-8">
              With future integration into public emergency systems and wearables, 
              ZeroDelay has the potential to become a global safety standard.
            </p>
            {!user && (
              <Link to="/register" className="btn-primary text-xl px-12 py-5">
                Start Protecting Your Loved Ones
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-emergency-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">ZD</span>
              </div>
              <span className="font-bold text-xl text-white">ZeroDelay</span>
            </div>
            <p className="text-sm">
              © 2025 ZeroDelay. Every second matters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
