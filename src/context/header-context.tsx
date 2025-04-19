'use client'

import type React from 'react'
import { type ReactNode, createContext, useContext, useState } from 'react'

interface HeaderContextProps {
  headerContent: React.ReactNode
  setHeaderContent: (content: React.ReactNode) => void
}

const HeaderContext = createContext<HeaderContextProps | undefined>(undefined)

export const defaultHeaderContent: React.ReactNode = (
  <div />
)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContent] = useState<React.ReactNode>(defaultHeaderContent)

  return (
    <HeaderContext.Provider value={{ headerContent, setHeaderContent }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeaderContext() {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error("useHeaderContext must be used within a HeaderProvider")
  }
  return context
} 