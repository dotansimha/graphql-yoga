import React, { PropsWithChildren, ReactFragment, useState } from 'react'
import { Collapse } from '@theguild/components'

export interface AccordionProps {
  title: string
  initiallyOpen?: boolean
}

export const Accordion: React.FC<PropsWithChildren<AccordionProps>> = ({
  children,
  title,
  initiallyOpen,
}) => {
  const [open, setOpen] = useState(Boolean(initiallyOpen))

  return (
    <section className="w-full rounded-lg my-4 overflow-hidden bg-primary-700/5 dark:bg-primary-300/10">
      <button
        role="button"
        onClick={() => setOpen((open) => !open)}
        className="flex justify-between w-full p-2 font-medium bg-primary-700/5 text-gray-700 dark:bg-primary-300/10 dark:text-gray-200"
      >
        <span>{title}</span>
        <span className="text-gray-400 dark:text-gray-500">
          {open ? '-' : '+'}
        </span>
      </button>

      <Collapse open={open}>{children}</Collapse>
    </section>
  )
}
