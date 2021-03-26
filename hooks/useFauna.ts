import { useContext } from 'react'
import { FaunaClientContext } from '@/lib/FaunaClient'

export function useFauna() {
  const context = useContext(FaunaClientContext)

  if (!context) {
    throw new Error(`Can't use hook 'useFauna' outside of a FaunaProvider`)
  }

  return context
}
