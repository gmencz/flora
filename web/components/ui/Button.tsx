import { useButton } from '@react-aria/button'
import { useRef } from 'react'

export function Button(props) {
  const ref = useRef<HTMLButtonElement>(null)
  const { buttonProps } = useButton(props, ref)
  const { children } = props

  return (
    <button {...buttonProps} ref={ref}>
      {children}
    </button>
  )
}
