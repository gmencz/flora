import { cloneElement, CSSProperties, ReactElement } from 'react'
import tw, { styled } from 'twin.macro'

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left'

interface TooltipProps {
  label: string
  children: ReactElement
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

const TooltipTopOverlay = styled.div<Pick<TooltipProps, 'label'>>(
  ({ label }) => [
    tw`transform -top-10 right-1/2 translate-x-1/2 group-hover:-translate-y-1 transition-all rounded-md ease-tooltip pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto absolute inline-flex bg-white shadow-lg py-2 px-3 text-sm font-semibold text-gray-800`,
    label.length <= 25 ? tw`whitespace-nowrap` : tw`w-48`,
  ],
)

const TooltipRightOverlay = styled.div<
  Pick<TooltipProps, 'label' | 'className'>
>(({ label }) => [
  tw`transform top-1/2 -translate-y-1/2 left-16 group-hover:translate-x-1 transition-all rounded-md ease-tooltip pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto absolute inline-flex bg-white shadow-lg py-2 px-3 text-sm font-semibold text-gray-800`,
  label.length <= 25 ? tw`whitespace-nowrap` : tw`w-48`,
])

const TooltipBottomOverlay = styled.div<Pick<TooltipProps, 'label'>>(
  ({ label }) => [
    tw`transform -bottom-10 right-1/2 translate-x-1/2 group-hover:translate-y-1 transition-all rounded-md ease-tooltip pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto absolute inline-flex bg-white shadow-lg py-2 px-3 text-sm font-semibold text-gray-800`,
    label.length <= 25 ? tw`whitespace-nowrap` : tw`w-48`,
  ],
)

const TooltipLeftOverlay = styled.div<Pick<TooltipProps, 'label'>>(
  ({ label }) => [
    tw`transform top-1/2 -translate-y-1/2 right-16 group-hover:-translate-x-1 transition-all rounded-md ease-tooltip pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto absolute inline-flex bg-white shadow-lg py-2 px-3 text-sm font-semibold text-gray-800`,
    label.length <= 25 ? tw`whitespace-nowrap` : tw`w-48`,
  ],
)

const TooltipText = styled.div<Pick<TooltipProps, 'position'>>(
  ({ position }) => [
    position === 'top' &&
      tw`transform w-0 h-0 absolute left-1/2 -bottom-1.5 -translate-x-1/2`,
    position === 'right' && tw`transform w-0 h-0 absolute -left-1.5 top-1/2`,
    position === 'bottom' &&
      tw`transform w-0 h-0 absolute left-1/2 -top-1.5 -translate-x-1/2`,
    position === 'left' && tw`transform w-0 h-0 absolute -right-1.5 top-1/2`,
  ],
)

function Tooltip({ children, label, position }: TooltipProps) {
  return (
    <div className="group rounded-2xl">
      {cloneElement(children)}

      {position === 'top' ? (
        <TooltipTopOverlay label={label}>
          <TooltipText position={position} style={borders[position]} />
          <span>{label}</span>
        </TooltipTopOverlay>
      ) : position === 'right' ? (
        <TooltipRightOverlay label={label}>
          <TooltipText position={position} style={borders[position]} />
          <span>{label}</span>
        </TooltipRightOverlay>
      ) : position === 'bottom' ? (
        <TooltipBottomOverlay label={label}>
          <TooltipText position={position} style={borders[position]} />
          <span>{label}</span>
        </TooltipBottomOverlay>
      ) : (
        <TooltipLeftOverlay label={label}>
          <TooltipText position={position} style={borders[position]} />
          <span>{label}</span>
        </TooltipLeftOverlay>
      )}
    </div>
  )
}

export default Tooltip
