import clsx from 'clsx'
import { cloneElement, ReactElement } from 'react'

interface TooltipProps {
  label: string
  children: ReactElement
  className?: string
  onTop?: boolean
}

function Tooltip({ children, label, onTop }: TooltipProps) {
  return (
    <div className="group rounded-2xl">
      {cloneElement(children)}

      <div
        className={clsx(
          `transition-all rounded-md ease-server-tooltip pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto absolute inline-flex bg-white shadow-lg py-2 px-3 text-sm font-semibold text-gray-800`,

          label.length <= 25 ? 'whitespace-nowrap' : 'w-48',

          onTop
            ? '-top-10 right-1/2 transform group-hover:-translate-y-1 translate-x-1/2'
            : 'top-1/2 -translate-y-1/2 left-16 transform group-hover:translate-x-2',
        )}
      >
        <div
          className={
            onTop
              ? 'w-0 h-0 absolute left-1/2 -bottom-1.5 transform -translate-x-1/2'
              : 'w-0 h-0 absolute -left-1.5 top-1/2'
          }
          style={
            onTop
              ? {
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: '10px solid white',
                }
              : {
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  borderRight: '10px solid white',
                  transform: 'translateY(-10px)',
                }
          }
        />
        <span>{label}</span>
      </div>
    </div>
  )
}

export default Tooltip
