import type { useAuth } from "./auth"

export type Session = ReturnType<typeof useAuth>["$Infer"]["Session"]
