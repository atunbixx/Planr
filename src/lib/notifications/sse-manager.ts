/**
 * SSE Connection Manager
 * Manages Server-Sent Events connections for real-time notifications
 */

// Store active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>()

// Function to send notification to specific user
export function sendNotificationToUser(userId: string, notification: any) {
  const controller = connections.get(userId)
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      })}\n\n`)
    } catch (error) {
      console.error('Error sending notification to user:', error)
      connections.delete(userId)
    }
  }
}

// Function to send update to specific user
export function sendUpdateToUser(userId: string, updateType: string, data: any) {
  const controller = connections.get(userId)
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify({
        type: updateType,
        data,
        timestamp: new Date().toISOString()
      })}\n\n`)
    } catch (error) {
      console.error('Error sending update to user:', error)
      connections.delete(userId)
    }
  }
}

// Function to broadcast to all connected users
export function broadcastToAll(message: any) {
  const deadConnections: string[] = []
  
  for (const [userId, controller] of connections.entries()) {
    try {
      controller.enqueue(`data: ${JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      })}\n\n`)
    } catch (error) {
      deadConnections.push(userId)
    }
  }
  
  // Clean up dead connections
  deadConnections.forEach(userId => connections.delete(userId))
}

// Get active connection count (for monitoring)
export function getActiveConnections() {
  return connections.size
}

// Add connection
export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller)
}

// Remove connection
export function removeConnection(userId: string) {
  connections.delete(userId)
}

// Get connection
export function getConnection(userId: string) {
  return connections.get(userId)
}