export function handleGetUserMediaError(e: Error, closeCall: VoidFunction) {
  switch (e.name) {
    case 'NotFoundError':
      alert('Unable to open your call because no microphone was found')
      break
    case 'SecurityError':
    case 'PermissionDeniedError':
      // Do nothing; this is the same as the user canceling the call.
      break
    default:
      alert('Error opening your microphone: ' + e.message)
      break
  }

  closeCall()
}
