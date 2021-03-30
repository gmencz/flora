import qs from 'qs'
import admin from '../lib/firebase'
import { RequestWithUser } from '../types'

function handleUnauthorizedUpgrade(socket: any) {
  socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
  socket.destroy()
}

export async function authorizeUser(request: RequestWithUser, socket: any) {
  const url = request.url!.substr(2)
  const { token } = qs.parse(url)

  if (!token) {
    return handleUnauthorizedUpgrade(socket)
  }

  try {
    const { uid } = await admin.auth().verifyIdToken(token as string)
    request.userId = uid
  } catch (error) {
    console.error(error)
    return handleUnauthorizedUpgrade(socket)
  }
}
