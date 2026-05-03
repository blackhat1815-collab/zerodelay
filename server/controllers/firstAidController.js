import { getFirstAidSteps, getAIResponse } from '../services/aiService.js';

// @desc    Get first aid guidance
// @route   POST /api/first-aid/guide
export const getFirstAidGuide = async (req, res, next) => {
  try {
    const { emergencyType, symptoms, description } = req.body;

    const steps = await getFirstAidSteps(emergencyType, description || symptoms);

    res.json({ success: true, data: steps });
  } catch (error) {
    next(error);
  }
};

// @desc    Chat with AI for first aid
// @route   POST /api/first-aid/chat
export const firstAidChat = async (req, res, next) => {
  try {
    const { message, context } = req.body;

    const response = await getAIResponse(message, context);

    res.json({ success: true, data: { response } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get first aid for specific condition
// @route   GET /api/first-aid/:condition
export const getConditionGuide = async (req, res, next) => {
  try {
    const { condition } = req.params;

    // Predefined first aid guides
    const guides = {
      'heart-attack': {
        title: 'Heart Attack First Aid',
        steps: [
          { step: 1, instruction: 'Call emergency services (102/108) immediately', critical: true },
          { step: 2, instruction: 'Have the person sit down and rest in a comfortable position' },
          { step: 3, instruction: 'Loosen any tight clothing' },
          { step: 4, instruction: 'If the person is conscious and not allergic, give aspirin (325mg) to chew' },
          { step: 5, instruction: 'If they have prescribed nitroglycerin, help them take it' },
          { step: 6, instruction: 'Monitor breathing and be ready to perform CPR if needed' },
          { step: 7, instruction: 'Keep the person calm and reassured until help arrives' }
        ],
        warnings: ['Do not leave the person alone', 'Do not give anything by mouth if unconscious']
      },
      'choking': {
        title: 'Choking First Aid',
        steps: [
          { step: 1, instruction: 'Ask "Are you choking?" If they can cough or speak, encourage coughing' },
          { step: 2, instruction: 'If they cannot breathe/speak, stand behind them' },
          { step: 3, instruction: 'Place your fist just above the navel' },
          { step: 4, instruction: 'Grasp your fist with other hand' },
          { step: 5, instruction: 'Perform quick upward thrusts (Heimlich maneuver)' },
          { step: 6, instruction: 'Repeat until object is expelled or person becomes unconscious' },
          { step: 7, instruction: 'If unconscious, begin CPR and call emergency services' }
        ],
        warnings: ['For infants, use back blows and chest thrusts instead']
      },
      'bleeding': {
        title: 'Severe Bleeding First Aid',
        steps: [
          { step: 1, instruction: 'Call emergency services for severe bleeding', critical: true },
          { step: 2, instruction: 'Apply direct pressure to the wound with a clean cloth' },
          { step: 3, instruction: 'If possible, elevate the injured area above the heart' },
          { step: 4, instruction: 'Add more cloth if blood soaks through - do not remove original' },
          { step: 5, instruction: 'Apply a pressure bandage if available' },
          { step: 6, instruction: 'If bleeding continues and is life-threatening, consider a tourniquet' },
          { step: 7, instruction: 'Keep the person warm and calm until help arrives' }
        ],
        warnings: ['Do not remove embedded objects', 'Apply tourniquet only as last resort']
      },
      'burns': {
        title: 'Burns First Aid',
        steps: [
          { step: 1, instruction: 'Remove the person from the heat source safely' },
          { step: 2, instruction: 'Cool the burn under cool (not cold) running water for 10-20 minutes' },
          { step: 3, instruction: 'Remove jewelry or tight items near the burn before swelling' },
          { step: 4, instruction: 'Cover with a sterile, non-stick bandage' },
          { step: 5, instruction: 'Do not apply ice, butter, or ointments' },
          { step: 6, instruction: 'Give over-the-counter pain reliever if needed' },
          { step: 7, instruction: 'Seek medical attention for large or deep burns' }
        ],
        warnings: ['Do not break blisters', 'Seek immediate help for chemical or electrical burns']
      },
      'fracture': {
        title: 'Fracture First Aid',
        steps: [
          { step: 1, instruction: 'Do not move the person unless necessary for safety' },
          { step: 2, instruction: 'Call emergency services for severe fractures', critical: true },
          { step: 3, instruction: 'Immobilize the injured area - do not try to realign' },
          { step: 4, instruction: 'Apply ice wrapped in cloth to reduce swelling' },
          { step: 5, instruction: 'If there is bleeding, apply gentle pressure with clean cloth' },
          { step: 6, instruction: 'Create a splint using rigid material if trained' },
          { step: 7, instruction: 'Keep the person still and comfortable until help arrives' }
        ],
        warnings: ['Never try to straighten a broken bone', 'Watch for signs of shock']
      },
      'stroke': {
        title: 'Stroke First Aid (F.A.S.T.)',
        steps: [
          { step: 1, instruction: 'Face: Ask them to smile - does one side droop?' },
          { step: 2, instruction: 'Arms: Ask them to raise both arms - does one drift down?' },
          { step: 3, instruction: 'Speech: Ask them to repeat a phrase - is it slurred?' },
          { step: 4, instruction: 'Time: If any signs, call emergency services immediately', critical: true },
          { step: 5, instruction: 'Note the time symptoms started' },
          { step: 6, instruction: 'Keep them comfortable, do not give food or drink' },
          { step: 7, instruction: 'If unconscious, place in recovery position' }
        ],
        warnings: ['Every minute counts - do not wait to see if symptoms improve']
      }
    };

    const guide = guides[condition.toLowerCase()];

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found. Available: heart-attack, choking, bleeding, burns, fracture, stroke'
      });
    }

    res.json({ success: true, data: guide });
  } catch (error) {
    next(error);
  }
};
