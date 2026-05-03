import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || 'Unknown',
    medicalConditions: user?.medicalConditions?.join(', ') || '',
    allergies: user?.allergies?.join(', ') || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        medicalConditions: formData.medicalConditions
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        allergies: formData.allergies
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      };

      await updateProfile(updateData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Profile & Medical Info</h1>
          <p className="text-gray-600 mt-1">
            Keep your medical information updated for emergency responders
          </p>
        </motion.div>

        <motion.div 
          className="card p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="pb-6 border-b">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="label">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input bg-gray-100"
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            {/* Medical Info */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Medical Information</h2>
              <p className="text-sm text-gray-500 mb-4">
                This information will be shared with emergency responders and contacts during emergencies.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="input"
                  >
                    {bloodGroups.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="label">Medical Conditions</label>
                  <input
                    type="text"
                    value={formData.medicalConditions}
                    onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                    className="input"
                    placeholder="e.g., Diabetes, Asthma, Heart condition (comma-separated)"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter conditions separated by commas
                  </p>
                </div>
                
                <div>
                  <label className="label">Allergies</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="input"
                    placeholder="e.g., Penicillin, Peanuts, Latex (comma-separated)"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter allergies separated by commas
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Info Card */}
        <motion.div 
          className="mt-6 p-4 bg-blue-50 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-medium text-blue-900">Why share medical information?</h3>
          <p className="text-sm text-blue-700 mt-1">
            During emergencies, responders can access critical medical details to provide 
            appropriate care. Blood group, allergies, and pre-existing conditions can be 
            life-saving information.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
