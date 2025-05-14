"use client"

import type React from "react"
import { createContext, type ReactNode, useContext, useState } from "react"

interface HeaderContextProps {
  headerLeftContent: React.ReactNode
  setHeaderLeftContent: (content: React.ReactNode) => void
  headerRightContent: React.ReactNode
  setHeaderRightContent: (content: React.ReactNode) => void
}

const HeaderContext = createContext<HeaderContextProps | undefined>(undefined)

export const defaultHeaderContent: React.ReactNode = <div />

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [headerLeftContent, setHeaderLeftContent] =
    useState<React.ReactNode>(defaultHeaderContent)
  const [headerRightContent, setHeaderRightContent] =
    useState<React.ReactNode>(defaultHeaderContent)

  return (
    <HeaderContext.Provider
      value={{
        headerLeftContent,
        setHeaderLeftContent,
        headerRightContent,
        setHeaderRightContent,
      }}
    >
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
