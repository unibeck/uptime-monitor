"use client"

import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/new-york-v4/ui/button"
import { IconTimezone } from "@tabler/icons-react"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false)

  const signInWithOkta = async () => {
    const response = await authClient.signIn.oauth2(
      {
        providerId: "okta",
        callbackURL: "/dashboard",
      },
      {
        onRequest(context) {
          setIsLoading(true)
        },
        onError(ctx) {
          toast.error(ctx.error.message)
          setIsLoading(false)
        },
        onSuccess(ctx) {
          console.log("Logged in! Redirecting to dashboard...")
        },
      },
    )

    console.log("data", response)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <IconTimezone stroke={1.5} />
              </div>
              <span className="sr-only">Uptime Monitor</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Uptime Monitor</h1>
          </div>
          <div className="grid gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={signInWithOkta}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Continue with Okta"
              )}
            </Button>
          </div>
        </div>
      </form>
      {/* <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div> */}
    </div>
  )
}
