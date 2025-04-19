import { createZodRoute } from "next-zod-route"
import * as HttpStatusCodes from "stoker/http-status-codes"
import * as HttpStatusPhrases from "stoker/http-status-phrases"

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
        message: HttpStatusPhrases.INTERNAL_SERVER_ERROR,
        error: errorMessage,
      }),
      { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
    )
  },
})
