import { isToday, isYesterday, parseISO, format } from 'date-fns'

export function formatMessageTimestamp(timestamp: string) {
  const date = parseISO(timestamp)

  if (isToday(date)) {
    return format(date, "'Today at 'h:mm' 'aa")
  } else if (isYesterday(date)) {
    return format(date, "'Yesterday at 'h:mm' 'aa")
  } else {
    return format(date, "dd/MM/yyyy' at 'h:mm' 'aa")
  }
}
