// AI Service for first aid guidance
// In production, integrate with OpenAI, Google AI, or similar

const emergencyFirstAid = {
  'Medical': [
    { step: 1, instruction: 'Ensure the scene is safe before approaching', duration: '5 seconds' },
    { step: 2, instruction: 'Check if the person is responsive - tap shoulder and ask "Are you okay?"', duration: '10 seconds' },
    { step: 3, instruction: 'Call emergency services (102/108) immediately', duration: '30 seconds', critical: true },
    { step: 4, instruction: 'Check for breathing - look, listen, and feel for 10 seconds', duration: '10 seconds' },
    { step: 5, instruction: 'If not breathing, begin CPR: 30 chest compressions, 2 rescue breaths', duration: 'Until help arrives' },
    { step: 6, instruction: 'If breathing, place in recovery position (on their side)', duration: '30 seconds' },
    { step: 7, instruction: 'Monitor breathing and pulse continuously until help arrives', duration: 'Ongoing' }
  ],
  'Accident': [
    { step: 1, instruction: 'Ensure your safety first - check for traffic, fire, or other hazards', duration: '10 seconds' },
    { step: 2, instruction: 'Call emergency services (102/108/100) immediately', duration: '30 seconds', critical: true },
    { step: 3, instruction: 'Do NOT move the victim unless there is immediate danger', duration: 'Important' },
    { step: 4, instruction: 'Check for responsiveness and breathing', duration: '15 seconds' },
    { step: 5, instruction: 'Control any visible bleeding with direct pressure using clean cloth', duration: 'Ongoing' },
    { step: 6, instruction: 'Keep the person warm with a blanket or jacket', duration: '30 seconds' },
    { step: 7, instruction: 'Talk to them calmly and keep them still until help arrives', duration: 'Ongoing' }
  ],
  'Fire': [
    { step: 1, instruction: 'Alert everyone - shout "FIRE!" and activate fire alarm if available', duration: '10 seconds', critical: true },
    { step: 2, instruction: 'Call fire services (101) immediately', duration: '30 seconds' },
    { step: 3, instruction: 'Evacuate using stairs, NEVER use elevators', duration: 'Ongoing' },
    { step: 4, instruction: 'Stay low to avoid smoke - crawl if necessary', duration: 'Ongoing' },
    { step: 5, instruction: 'Feel doors before opening - if hot, find another route', duration: '5 seconds' },
    { step: 6, instruction: 'If clothes catch fire: STOP, DROP, and ROLL', duration: '30 seconds' },
    { step: 7, instruction: 'Meet at designated assembly point and account for everyone', duration: 'After evacuation' }
  ],
  'Crime': [
    { step: 1, instruction: 'Prioritize your safety - do not confront the attacker', duration: 'Immediate', critical: true },
    { step: 2, instruction: 'If safe, move to a secure location and lock doors', duration: '30 seconds' },
    { step: 3, instruction: 'Call police (100) when safe to do so', duration: '1 minute' },
    { step: 4, instruction: 'Try to remember details: appearance, vehicle, direction of escape', duration: 'Ongoing' },
    { step: 5, instruction: 'Do not touch or disturb any evidence', duration: 'Important' },
    { step: 6, instruction: 'Provide first aid to any injured persons if trained', duration: 'As needed' },
    { step: 7, instruction: 'Wait for police and provide a clear account of events', duration: 'Ongoing' }
  ],
  'Natural Disaster': [
    { step: 1, instruction: 'Stay calm and assess immediate dangers', duration: '10 seconds' },
    { step: 2, instruction: 'For earthquake: DROP, COVER, and HOLD ON under sturdy furniture', duration: 'Until shaking stops' },
    { step: 3, instruction: 'For flood: Move to higher ground immediately', duration: 'Immediate', critical: true },
    { step: 4, instruction: 'Avoid downed power lines and damaged structures', duration: 'Ongoing' },
    { step: 5, instruction: 'Call disaster helpline (1078) or local emergency services', duration: '1 minute' },
    { step: 6, instruction: 'Help others only if safe to do so', duration: 'As safe' },
    { step: 7, instruction: 'Listen to official instructions via radio or alerts', duration: 'Ongoing' }
  ],
  'Other': [
    { step: 1, instruction: 'Stay calm and assess the situation', duration: '15 seconds' },
    { step: 2, instruction: 'Ensure your safety and the safety of others', duration: '30 seconds' },
    { step: 3, instruction: 'Call the appropriate emergency service', duration: '1 minute', critical: true },
    { step: 4, instruction: 'Provide clear information about location and situation', duration: '1 minute' },
    { step: 5, instruction: 'Follow instructions from emergency dispatcher', duration: 'Ongoing' },
    { step: 6, instruction: 'Do not take unnecessary risks', duration: 'Important' },
    { step: 7, instruction: 'Stay on the line until help arrives if requested', duration: 'As needed' }
  ]
};

export const getFirstAidSteps = async (emergencyType, description) => {
  // Get base steps for emergency type
  const baseSteps = emergencyFirstAid[emergencyType] || emergencyFirstAid['Other'];
  
  // In production, you would send the description to an AI model
  // to get personalized guidance based on the specific situation
  
  return {
    type: emergencyType,
    steps: baseSteps,
    disclaimer: 'These are general guidelines. Follow instructions from emergency services when they respond.',
    emergencyNumbers: {
      ambulance: '102 / 108',
      police: '100',
      fire: '101',
      disaster: '1078',
      universal: '112'
    }
  };
};

export const getAIResponse = async (message, context) => {
  // In production, integrate with OpenAI, Claude, or similar
  // For demo, return contextual responses
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('cpr') || lowerMessage.includes('not breathing')) {
    return `For CPR:
1. Place heel of hand on center of chest
2. Push hard and fast - at least 2 inches deep
3. Rate: 100-120 compressions per minute
4. After 30 compressions, give 2 rescue breaths
5. Continue until help arrives or person responds

Remember: Even hands-only CPR (compressions without breaths) is effective.`;
  }
  
  if (lowerMessage.includes('bleeding') || lowerMessage.includes('blood')) {
    return `To control bleeding:
1. Apply firm, direct pressure with clean cloth
2. Don't remove the cloth - add more if needed
3. Elevate the wound above heart level if possible
4. For severe bleeding, apply pressure to pressure points
5. Consider tourniquet only for life-threatening limb bleeding

Keep pressure until emergency services arrive.`;
  }
  
  if (lowerMessage.includes('burn')) {
    return `For burns:
1. Cool under running water for 10-20 minutes
2. Remove jewelry/tight items before swelling
3. Don't use ice, butter, or ointments
4. Cover loosely with sterile bandage
5. Seek medical help for large or deep burns

For chemical burns: Flush with water for 20+ minutes.`;
  }
  
  return `I understand you need help. Here's what to do:
1. Stay calm and assess the situation
2. Ensure your safety first
3. Call emergency services (112 for universal emergency)
4. Provide clear details about location and condition
5. Follow their instructions

What specific situation are you dealing with? I can provide more targeted guidance.`;
};
