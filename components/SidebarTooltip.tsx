import clsx from 'clsx'
import { cloneElement, ReactElement } from 'react'

interface SidebarTooltipProps {
  label: string
  children: ReactElement
  className?: string
}

function SidebarTooltip({ children, label }: SidebarTooltipProps) {
  return (
    <div className="group rounded-2xl">
      {cloneElement(children)}

      <div
        className={clsx(
          'transition-all rounded-md ease-server-tooltip pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto absolute inline-flex left-14 transform top-1.5 group-hover:translate-x-2 bg-white shadow-md py-2 px-3 text-sm font-semibold text-gray-800',

          label.length <= 25 ? 'whitespace-nowrap' : 'w-48',
        )}
      >
        <div
          className="w-0 h-0 absolute -left-1.5 top-1/2"
          style={{
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderRight: '10px solid white',
            transform: 'translateY(-10px)',
          }}
        />
        <span>{label}</span>
      </div>
    </div>
  )
}

export default SidebarTooltip
