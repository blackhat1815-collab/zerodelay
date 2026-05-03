import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function FirstAidCard({ step, isActive, isCompleted, onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border-2 transition-all ${
        isCompleted 
          ? 'border-green-500 bg-green-50' 
          : isActive 
            ? 'border-emergency-500 bg-emergency-50' 
            : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          isCompleted 
            ? 'bg-green-500 text-white' 
            : isActive 
              ? 'bg-emergency-500 text-white' 
              : 'bg-gray-200 text-gray-600'
        }`}>
          {isCompleted ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            step.step
          )}
        </div>
        
        <div className="flex-1">
          <p className={`font-medium ${
            step.critical ? 'text-emergency-700' : 'text-gray-800'
          }`}>
            {step.critical && <span className="text-emergency-600">⚠️ CRITICAL: </span>}
            {step.instruction}
          </p>
          
          {step.duration && (
            <p className="text-sm text-gray-500 mt-1">
              ⏱️ {step.duration}
            </p>
          )}
        </div>
        
        {isActive && !isCompleted && onComplete && (
          <button
            onClick={onComplete}
            className="flex-shrink-0 px-3 py-1 bg-emergency-600 text-white text-sm rounded-lg hover:bg-emergency-700"
          >
            Done
          </button>
        )}
      </div>
    </motion.div>
  );
}
