import { PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function HospitalCard({ hospital, onNavigate }) {
  const address = typeof hospital.address === 'string' 
    ? hospital.address 
    : `${hospital.address?.street}, ${hospital.address?.city}`;

  return (
    <div className="card p-4 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900">{hospital.name}</h3>
          
          <div className="flex items-center gap-1 text-gray-600 mt-1">
            <MapPinIcon className="w-4 h-4" />
            <span className="text-sm">{address}</span>
          </div>
          
          {hospital.distance && (
            <span className="inline-block mt-2 px-2 py-1 bg-emergency-100 text-emergency-700 text-sm font-medium rounded-full">
              {hospital.distance} km away
            </span>
          )}
          
          {hospital.type && (
            <span className={`inline-block ml-2 mt-2 px-2 py-1 text-sm font-medium rounded-full ${
              hospital.type === 'Government' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {hospital.type}
            </span>
          )}
          
          {hospital.operatingHours && (
            <div className="flex items-center gap-1 text-gray-500 mt-2">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm">{hospital.operatingHours}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          {hospital.phone && (
            <a
              href={`tel:${hospital.emergencyPhone || hospital.phone}`}
              className="flex items-center gap-2 px-4 py-2 bg-emergency-600 text-white rounded-lg hover:bg-emergency-700 transition-colors"
            >
              <PhoneIcon className="w-5 h-5" />
              Call
            </a>
          )}
          
          {onNavigate && (
            <button
              onClick={() => onNavigate(hospital)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MapPinIcon className="w-5 h-5" />
              Navigate
            </button>
          )}
        </div>
      </div>
      
      {hospital.specialties?.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex flex-wrap gap-1">
            {hospital.specialties.slice(0, 4).map((specialty, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
