import { createZodRoute } from "next-zod-route"

import { INTERNAL_SERVER_ERROR } from "stoker/http-status-codes"
import { logError, logErrorStack } from "./errors"

export const createRoute = createZodRoute({
  handleServerError: (error: Error) => {
    const errorMessage = logError(error)
    logErrorStack(error)

    // TODO: Create custom error that takes message, error, and status code
    // if (error instanceof CustomError) {
    //   return new Response(JSON.stringify({ message: error.message }), { status: error.status });
    // }

    // Default error response
    return new Response(
      JSON.stringify({
        message: INTERNAL_SERVER_ERROR,
        error: errorMessage,
      }),
      { status: INTERNAL_SERVER_ERROR },
    )
  },
})
