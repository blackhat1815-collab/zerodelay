import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const conditions = [
  { id: 'heart-attack', name: 'Heart Attack', icon: '❤️', color: 'red' },
  { id: 'choking', name: 'Choking', icon: '😤', color: 'orange' },
  { id: 'bleeding', name: 'Severe Bleeding', icon: '🩸', color: 'red' },
  { id: 'burns', name: 'Burns', icon: '🔥', color: 'orange' },
  { id: 'fracture', name: 'Fracture', icon: '🦴', color: 'blue' },
  { id: 'stroke', name: 'Stroke', icon: '🧠', color: 'purple' },
];

export default function FirstAid() {
  const { id, condition } = useParams();
  const selectedCondition = condition || id;
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedCondition) {
      fetchGuide(selectedCondition);
    }
  }, [selectedCondition]);

  const fetchGuide = async (conditionId) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/first-aid/${conditionId}`);
      setGuide(response.data.data);
    } catch (error) {
      console.error('Failed to fetch guide:', error);
      setError(error.response?.data?.message || 'Unable to load this first aid guide');
    } finally {
      setLoading(false);
    }
  };

  if (selectedCondition && loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="card p-8 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-emergency-600"></div>
            <p className="mt-4 text-gray-600">Loading first aid guide...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCondition && error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link to="/first-aid" className="mb-6 inline-flex items-center gap-1 text-emergency-600 hover:text-emergency-700">
            Back to all guides
          </Link>
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-gray-900">Guide unavailable</h1>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCondition && guide) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/first-aid"
            className="text-emergency-600 hover:text-emergency-700 mb-6 inline-flex items-center gap-1"
          >
            ← Back to all guides
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{guide.title}</h1>
            
            <div className="card p-6 mt-6">
              <div className="space-y-4">
                {guide.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      step.critical 
                        ? 'border-emergency-500 bg-emergency-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        step.critical 
                          ? 'bg-emergency-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {step.step}
                      </div>
                      <div>
                        <p className={`font-medium ${step.critical ? 'text-emergency-800' : 'text-gray-800'}`}>
                          {step.critical && <span className="text-emergency-600">⚠️ CRITICAL: </span>}
                          {step.instruction}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {guide.warnings && guide.warnings.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-bold text-yellow-800 mb-2">⚠️ Important Warnings</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {guide.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-700">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Emergency Numbers */}
            <div className="mt-6 p-4 bg-emergency-100 rounded-lg">
              <h3 className="font-bold text-emergency-800 mb-2">Emergency Numbers (India)</h3>
              <div className="grid grid-cols-3 gap-2">
                <a href="tel:112" className="p-2 bg-white rounded text-center hover:bg-gray-50">
                  <div className="font-bold text-emergency-600">112</div>
                  <div className="text-xs text-gray-500">Universal</div>
                </a>
                <a href="tel:102" className="p-2 bg-white rounded text-center hover:bg-gray-50">
                  <div className="font-bold text-emergency-600">102/108</div>
                  <div className="text-xs text-gray-500">Ambulance</div>
                </a>
                <a href="tel:100" className="p-2 bg-white rounded text-center hover:bg-gray-50">
                  <div className="font-bold text-emergency-600">100</div>
                  <div className="text-xs text-gray-500">Police</div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">First Aid Guides</h1>
          <p className="text-gray-600 mt-1">
            Quick reference guides for common emergencies
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {conditions.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/first-aid/${item.id}`}
                className="card p-6 hover:shadow-xl transition-shadow block"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                <p className="text-gray-500 mt-1">View first aid steps →</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* General Tips */}
        <motion.div 
          className="card p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">General Emergency Tips</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">1️⃣</span>
              <div>
                <p className="font-medium">Stay Calm</p>
                <p className="text-gray-600 text-sm">Take a deep breath. Clear thinking saves lives.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">2️⃣</span>
              <div>
                <p className="font-medium">Ensure Safety</p>
                <p className="text-gray-600 text-sm">Check for dangers before approaching a victim.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">3️⃣</span>
              <div>
                <p className="font-medium">Call for Help</p>
                <p className="text-gray-600 text-sm">Dial 112 (universal emergency) immediately.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">4️⃣</span>
              <div>
                <p className="font-medium">Provide Basic Care</p>
                <p className="text-gray-600 text-sm">Use these guides to help until professionals arrive.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
