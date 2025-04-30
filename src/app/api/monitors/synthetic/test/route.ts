import { getCloudflareContext } from "@opennextjs/cloudflare"
// Import Lexical types and the extraction helper
import type {
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedTextNode,
} from "lexical"
import { NextResponse } from "next/server"
import { BAD_REQUEST, OK } from "stoker/http-status-codes"
import { z } from "zod"
import { createRoute } from "@/lib/api-utils"

// Helper function to extract text from Lexical JSON state (Copied for now, consider sharing)
function extractCodeFromLexicalStateLocal(
  serializedState: SerializedEditorState,
): string {
  let code = ""
  function traverse(node: SerializedLexicalNode) {
    if (node.type === "code" || node.type === "code-highlight") {
      if ("children" in node && Array.isArray(node.children)) {
        node.children.forEach(traverse)
      }
    } else if (node.type === "text" && "text" in node) {
      code += (node as SerializedTextNode).text
    } else if (
      node.type === "paragraph" ||
      node.type === "root" ||
      node.type === "line-break"
    ) {
      if (
        node.type === "paragraph" &&
        code.length > 0 &&
        !code.endsWith("\n")
      ) {
        code += "\n"
      }
      if (node.type === "line-break") {
        code += "\n"
      }
      if ("children" in node && Array.isArray(node.children)) {
        node.children.forEach(traverse)
      }
    }
  }
  traverse(serializedState.root)
  return code.trim()
}

// Schema for the test request body - scriptContent is now the stringified JSON state
const syntheticTestSchema = z.object({
  runtime: z.enum(["playwright-cf-latest", "puppeteer-cf-latest"]),
  timeoutSeconds: z.number().positive().int().max(60),
  scriptContent: z
    .string()
    .min(1, { message: "Script JSON state cannot be empty" }),
})

/**
 * POST /api/monitors/synthetic/test
 *
 * Executes a synthetic script on-demand using Cloudflare Browser Rendering for testing purposes.
 *
 * @body {syntheticTestSchema} - Runtime, timeout, and stringified Lexical JSON script state
 * @returns {Promise<NextResponse>} JSON response with test results (statusOutcome, durationMs, errorMessage?)
 */
export const POST = createRoute
  .body(syntheticTestSchema)
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext()
    const {
      runtime,
      timeoutSeconds,
      scriptContent: scriptStateString,
    } = context.body

    console.log(
      `Starting synthetic test with runtime [${runtime}], timeout [${timeoutSeconds}s]`,
    )

    let executableCode: string
    try {
      const parsedState = JSON.parse(scriptStateString) as SerializedEditorState
      executableCode = extractCodeFromLexicalStateLocal(parsedState)
      if (!executableCode) {
        throw new Error("Extracted executable code is empty.")
      }
    } catch (parseError) {
      console.error("Failed to parse script state or extract code:", parseError)
      return NextResponse.json(
        {
          statusOutcome: "failure",
          durationMs: 0,
          errorMessage: `Failed to parse script: ${parseError instanceof Error ? parseError.message : "Invalid format"}`,
        },
        { status: BAD_REQUEST },
      )
    }

    let testResult: {
      statusOutcome: "success" | "failure"
      durationMs: number
      errorMessage?: string
    }
    const startTime = Date.now()

    try {
      const browser = await env.BROWSER.launch(runtime)
      const browserContext = await browser.newContext()
      browserContext.setDefaultTimeout(timeoutSeconds * 1000)
      const page = await browserContext.newPage()

      // Execute the extracted code
      const userScriptFunction = new Function(
        "page",
        "context",
        "browser",
        executableCode,
      )
      await userScriptFunction(page, browserContext, browser)

      const durationMs = Date.now() - startTime
      console.log(`Synthetic test completed successfully in ${durationMs}ms.`)
      testResult = { statusOutcome: "success", durationMs }
      await browser.close()
    } catch (error) {
      const durationMs = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(
        "Synthetic test script execution failed after",
        durationMs,
        "ms:",
        errorMsg,
      )
      testResult = {
        statusOutcome: "failure",
        durationMs,
        errorMessage: errorMsg,
      }
    }

    return NextResponse.json(testResult, { status: OK })
  })
