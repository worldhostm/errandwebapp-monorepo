import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (token: string): Socket => {
  if (socket && socket.connected) return socket

  if (socket) {
    socket.disconnect()
  }

  socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090', {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
