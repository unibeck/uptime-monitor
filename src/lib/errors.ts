export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message
  }
  return String(error)
}

export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack
  }

  return undefined
}

export function logError(error: unknown): string {
  const message = getErrorMessage(error)
  console.error(message)
  return message
}

export function logErrorStack(error: unknown) {
  const stack = getErrorStack(error)
  if (stack) {
    console.error(stack)
  }
}
