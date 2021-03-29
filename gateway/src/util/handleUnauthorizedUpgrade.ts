export function handleUnauthorizedUpgrade(socket: any) {
  socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
  socket.destroy()
}
