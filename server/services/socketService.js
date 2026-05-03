export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join user's personal room for targeted notifications
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Real-time location updates during emergency
    socket.on('location_update', (data) => {
      const { emergencyId, latitude, longitude, userId } = data;
      
      // Broadcast to all contacts watching this emergency
      io.to(`emergency_${emergencyId}`).emit('location_updated', {
        latitude,
        longitude,
        timestamp: new Date()
      });
    });

    // Join emergency room (for contacts tracking the emergency)
    socket.on('track_emergency', (emergencyId) => {
      socket.join(`emergency_${emergencyId}`);
    });

    // First aid step completion
    socket.on('first_aid_step_complete', (data) => {
      const { emergencyId, stepNumber } = data;
      io.to(`emergency_${emergencyId}`).emit('step_completed', {
        stepNumber,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
