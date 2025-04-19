"use client"

import { DEFAULT_TOAST_OPTIONS } from "@/lib/toasts"
import { toast } from "sonner"

export async function handleResumeMonitoring(websiteId: string) {
  return handleToggleStatus(websiteId, true)
}

export async function handlePauseMonitoring(websiteId: string) {
  return handleToggleStatus(websiteId, false)
}

export async function handleToggleStatus(websiteId: string, newStatus: boolean) {
  if (!confirm(`Are you sure you want to ${newStatus ? 'resume' : 'pause'} monitoring for this website?`)) {
    return false
  }

  try {
    const endpoint = newStatus 
      ? `/api/websites/${websiteId}/resume` 
      : `/api/websites/${websiteId}/pause`
    
    const response = await fetch(endpoint, {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error(`Received status code ${response.status}`)
    }
    
    toast.success(`Successfully ${newStatus ? 'resumed' : 'paused'} monitoring`, {
      ...DEFAULT_TOAST_OPTIONS,
    })

    return true
  } catch (error) {
    console.error('Error toggling status:', error)
    toast.error(`Failed to ${newStatus ? 'resume' : 'pause'} monitoring`, {
      description: `${error}`,
      ...DEFAULT_TOAST_OPTIONS,
    })
    return false
  }
}

export async function handleDeleteWebsite(websiteId: string) {
  if (!confirm('Are you sure you want to delete this website?')) {
    return false
  }
  
  try {
    const response = await fetch(`/api/websites/${websiteId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`Received status code ${response.status}`)
    }
    
    toast.success('Website deleted successfully', {
      ...DEFAULT_TOAST_OPTIONS,
    })

    return true
  } catch (error) {
    console.error('Error deleting website:', error)
    toast.error('Failed to delete website', {
      description: `${error}`,
      ...DEFAULT_TOAST_OPTIONS,
    })
    return false
  }
} 