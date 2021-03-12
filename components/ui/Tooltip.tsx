import { cloneElement, CSSProperties, ReactElement } from 'react'
import tw from 'twin.macro'

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left'

interface TooltipProps {
  label: string
  children: ReactElement
  className?: string
  position: TooltipPosition
}

const borders: Record<TooltipPosition, CSSProperties> = {
  top: {
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderTop: '10px solid white',
  },
  right: {
    borderTop: '10px solid transparent',
    borderBottom: '10px solid transparent',
    borderRight: '10px solid white',
    transform: 'translateY(-10px)',
  },
  bottom: {
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderBottom: '10px solid white',
  },
  left: {
    borderTop: '10px solid transparent',
    borderBottom: '10px solid transparent',
    borderLeft: '10px solid white',
    transform: 'translateY(-10px)',
  },
}

function Tooltip({ children, label, position }: TooltipProps) {
  return (
    <div className="group rounded-2xl">
      {cloneElement(children)}

      <div
        css={[
          tw`transition-all transform rounded-md ease-tooltip pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto absolute inline-flex bg-white shadow-lg py-2 px-3 text-sm font-semibold text-gray-800`,

          label.length <= 25 ? tw`whitespace-nowrap` : tw`w-48`,

          position === 'top' &&
            tw`-top-10 right-1/2 group-hover:-translate-y-1 translate-x-1/2`,

          position === 'right' &&
            tw`top-1/2 -translate-y-1/2 left-16 group-hover:translate-x-2`,

          position === 'bottom' &&
            tw`-bottom-10 right-1/2 group-hover:translate-y-1 translate-x-1/2`,

          position === 'left' &&
            tw`top-1/2 -translate-y-1/2 right-16 group-hover:translate-x-2`,
        ]}
      >
        <div
          css={[
            'transform',

            position === 'top' &&
              tw`w-0 h-0 absolute left-1/2 -bottom-1.5 -translate-x-1/2`,

            position === 'right' && tw`w-0 h-0 absolute -left-1.5 top-1/2`,

            position === 'bottom' &&
              tw`w-0 h-0 absolute left-1/2 -top-1.5 -translate-x-1/2`,

            position === 'left' && tw`w-0 h-0 absolute -right-1.5 top-1/2`,
          ]}
          style={borders[position]}
        />
        <span>{label}</span>
      </div>
    </div>
  )
}

export default Tooltip
