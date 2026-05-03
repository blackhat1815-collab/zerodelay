import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

const offlineGuides = {
  'heart-attack': {
    title: 'Heart Attack First Aid',
    steps: [
      { step: 1, instruction: 'Call emergency services immediately', critical: true },
      { step: 2, instruction: 'Have the person sit down and rest' },
      { step: 3, instruction: 'Loosen tight clothing and keep them calm' },
      { step: 4, instruction: 'Monitor breathing and be ready for CPR' }
    ],
    warnings: ['Do not leave the person alone', 'Do not give food or drink if unconscious']
  },
  choking: {
    title: 'Choking First Aid',
    steps: [
      { step: 1, instruction: 'Ask if they are choking. Encourage coughing if they can breathe' },
      { step: 2, instruction: 'If they cannot breathe or speak, stand behind them', critical: true },
      { step: 3, instruction: 'Give abdominal thrusts above the navel' },
      { step: 4, instruction: 'Call emergency services if it does not clear quickly' }
    ],
    warnings: ['For infants, use back blows and chest thrusts instead']
  },
  bleeding: {
    title: 'Severe Bleeding First Aid',
    steps: [
      { step: 1, instruction: 'Apply firm direct pressure with clean cloth', critical: true },
      { step: 2, instruction: 'Keep pressure. Add cloth if blood soaks through' },
      { step: 3, instruction: 'Elevate the injured area if possible' },
      { step: 4, instruction: 'Call emergency services for heavy bleeding' }
    ],
    warnings: ['Do not remove embedded objects']
  },
  burns: {
    title: 'Burns First Aid',
    steps: [
      { step: 1, instruction: 'Cool the burn under cool running water for 10-20 minutes', critical: true },
      { step: 2, instruction: 'Remove jewelry or tight items near the burn' },
      { step: 3, instruction: 'Cover loosely with a clean non-stick dressing' },
      { step: 4, instruction: 'Seek help for large, deep, chemical, or electrical burns' }
    ],
    warnings: ['Do not use ice, butter, or ointments']
  },
  fracture: {
    title: 'Fracture First Aid',
    steps: [
      { step: 1, instruction: 'Keep the injured area still', critical: true },
      { step: 2, instruction: 'Do not try to straighten the bone' },
      { step: 3, instruction: 'Apply a cold pack wrapped in cloth' },
      { step: 4, instruction: 'Call emergency services for severe pain or deformity' }
    ],
    warnings: ['Do not move the person unless there is immediate danger']
  },
  stroke: {
    title: 'Stroke First Aid',
    steps: [
      { step: 1, instruction: 'Check Face, Arms, Speech, Time', critical: true },
      { step: 2, instruction: 'Call emergency services immediately if signs appear' },
      { step: 3, instruction: 'Note when symptoms started' },
      { step: 4, instruction: 'Do not give food or drink' }
    ],
    warnings: ['Every minute counts. Do not wait for symptoms to improve']
  }
};

export default function FirstAid() {
  const { id, condition } = useParams();
  const routeCondition = condition || id || '';
  const navigate = useNavigate();
  const [selectedCondition, setSelectedCondition] = useState(routeCondition);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedCondition(routeCondition);
    setGuide(null);
    setError('');

    if (routeCondition) {
      fetchGuide(routeCondition);
    }
  }, [routeCondition]);

  const openGuide = (conditionId) => {
    setSelectedCondition(conditionId);
    setGuide(offlineGuides[conditionId] || null);
    setError('');
    navigate(`/first-aid/${conditionId}`);
    fetchGuide(conditionId);
  };

  const showAllGuides = () => {
    setSelectedCondition('');
    setGuide(null);
    setError('');
    navigate('/first-aid');
  };

  const fetchGuide = async (conditionId) => {
    setLoading(true);
    setError('');
    const offlineGuide = offlineGuides[conditionId];

    if (offlineGuide) {
      setGuide(offlineGuide);
    }

    try {
      const response = await api.get(`/first-aid/${conditionId}`);
      setGuide(response.data.data);
    } catch (error) {
      console.error('Failed to fetch guide:', error);
      if (offlineGuide) {
        setGuide(offlineGuide);
        setError('');
      } else {
        setError(error.response?.data?.message || 'Unable to load this first aid guide');
      }
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
          <button
            type="button"
            onClick={showAllGuides}
            className="mb-6 inline-flex items-center gap-1 text-emergency-600 hover:text-emergency-700"
          >
            Back to all guides
          </button>
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
              <button
                type="button"
                onClick={() => openGuide(item.id)}
                className="card block w-full p-6 text-left transition-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emergency-500 focus:ring-offset-2"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                <p className="text-gray-500 mt-1">View first aid steps →</p>
              </button>
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
