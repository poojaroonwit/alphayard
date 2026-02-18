import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  const encoder = new TextEncoder()

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      let isControllerClosed = false
      
      // Helper function to safely enqueue data
      const safeEnqueue = (data: string) => {
        if (!isControllerClosed) {
          try {
            controller.enqueue(encoder.encode(data))
          } catch (error) {
            console.log('Stream controller closed, cannot enqueue data')
            isControllerClosed = true
          }
        }
      }

      // Send initial connection message
      const data = {
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Connected to config watch stream'
      }
      
      safeEnqueue(`data: ${JSON.stringify(data)}\n\n`)

      // In a real implementation, you would:
      // 1. Connect to your database change streams
      // 2. Listen for configuration updates
      // 3. Send updates to connected clients
      
      // For now, we'll send a heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        if (!isControllerClosed) {
          const heartbeatData = {
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          }
          safeEnqueue(`data: ${JSON.stringify(heartbeatData)}\n\n`)
        } else {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        isControllerClosed = true
        clearInterval(heartbeat)
        try {
          controller.close()
        } catch (error) {
          // Controller already closed, ignore
        }
      })

      // Simulate a config update after 10 seconds (for testing)
      const timeoutId = setTimeout(() => {
        if (!isControllerClosed) {
          const updateData = {
            type: 'config_update',
            timestamp: new Date().toISOString(),
            config: {
              branding: {
                primaryColor: '#3b82f6',
                appName: 'Boundary (Updated)'
              }
            }
          }
          safeEnqueue(`data: ${JSON.stringify(updateData)}\n\n`)
        }
      }, 10000)

      // Also clear timeout on abort
      request.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
      })
    }
  })

  return new Response(stream, { headers })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle different event types
    switch (body.type) {
      case 'config_update':
        // In a real implementation, this would broadcast the update to all connected clients
        console.log('Config update broadcast:', body.config)
        break
        
      case 'subscribe':
        // Handle subscription to specific config changes
        console.log('New subscription:', body)
        break
        
      default:
        console.log('Unknown event type:', body.type)
    }
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('Error in config watch POST:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
