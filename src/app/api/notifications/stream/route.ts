import { NotificationStreamHandler } from '@/lib/api/handlers/notifications-handler'

const handler = new NotificationStreamHandler()

// Store active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: Request) {
  return handler.handle(request as any)
}

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