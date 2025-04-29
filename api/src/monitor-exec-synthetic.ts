import { WorkerEntrypoint } from "cloudflare:workers"
import { takeFirstOrNull, useDrizzle } from "@/db"
import { SyntheticChecksTable, SyntheticMonitorsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { OK } from "stoker/http-status-codes"
import { OK as OK_PHRASE } from "stoker/http-status-phrases"

// Import Lexical types needed for parsing
import type {
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedTextNode,
} from "lexical"

interface SyntheticExecPayload {
  monitorId: string
  runtime: "playwright-cf-latest" | "puppeteer-cf-latest"
  timeoutSeconds: number
}

// Helper function to extract text from Lexical JSON state
function extractCodeFromLexicalState(
  serializedState: SerializedEditorState,
): string {
  let code = ""
  function traverse(node: SerializedLexicalNode) {
    if (node.type === "code" || node.type === "code-highlight") {
      // Handle code blocks specifically if needed
      // Lexical code blocks might structure text differently, adjust as needed
      // This basic version assumes text content is directly within child text nodes
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
        code += "\n" // Add newline after paragraphs if not already present
      }
      if (node.type === "line-break") {
        code += "\n"
      }
      // Traverse children
      if ("children" in node && Array.isArray(node.children)) {
        node.children.forEach(traverse)
      }
    }
    // Add handling for other node types if necessary (e.g., list items)
  }
  traverse(serializedState.root)
  return code.trim() // Trim leading/trailing whitespace
}

export default class MonitorExecSynthetic extends WorkerEntrypoint<CloudflareEnv> {
  async fetch(_request: Request) {
    // This worker is triggered internally, not via HTTP fetch
    return new Response(
      `${OK_PHRASE}\nMonitorExecSynthetic: Use service binding to trigger checks.`,
      { status: OK },
    )
  }

  // Called via service binding from monitor-trigger DO
  async executeCheck(payload: SyntheticExecPayload) {
    // Use waitUntil to allow the DO to return quickly
    this.ctx.waitUntil(this._executeCheck(payload))
  }

  private async _executeCheck(payload: SyntheticExecPayload) {
    const { monitorId, runtime, timeoutSeconds } = payload
    console.log(`Synthetic check starting for [${monitorId}]...`)
    const db = useDrizzle(this.env.DB)

    // 1. Fetch monitor details (verify existence)
    const monitor = await db
      .select({
        id: SyntheticMonitorsTable.id,
        name: SyntheticMonitorsTable.name,
      })
      .from(SyntheticMonitorsTable)
      .where(eq(SyntheticMonitorsTable.id, monitorId))
      .then(takeFirstOrNull)

    if (!monitor) {
      console.error(
        `Synthetic Monitor [${monitorId}] does not exist. Cannot execute check.`,
      )
      // Optionally: Call MONITOR_TRIGGER_RPC.deleteDo(monitorId) if binding exists
      return
    }

    // 2. Fetch script STATE from R2
    const scriptStateKey = `scripts/synthetic/${monitorId}.js` // Keep naming convention for now
    let rawScriptState: string | null = null
    let parsedState: SerializedEditorState | null = null
    let executableCode: string | null = null

    try {
      const scriptObject = await this.env.SYNTHETIC_SCRIPTS.get(scriptStateKey)
      if (!scriptObject) {
        throw new Error(
          `Script state object not found in R2 for key: ${scriptStateKey}`,
        )
      }
      rawScriptState = await scriptObject.text()
      parsedState = JSON.parse(rawScriptState) as SerializedEditorState
      executableCode = extractCodeFromLexicalState(parsedState) // Extract code
      console.log(
        `Fetched and parsed script state [${scriptStateKey}] for monitor [${monitorId}]`,
      )

      if (!executableCode) {
        throw new Error("Extracted executable code is empty.")
      }
    } catch (error) {
      console.error(
        `Failed to fetch or parse script state for [${monitorId}]:`,
        error,
      )
      await this.recordCheckResult(
        db,
        monitorId,
        "failure",
        0,
        `Script retrieval/parsing failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      return
    }

    // Ensure executableCode is not null (already handled by catch, but for TS)
    if (!executableCode) {
      console.error(
        `Executable code is unexpectedly null for [${monitorId}] after parsing.`,
      )
      await this.recordCheckResult(
        db,
        monitorId,
        "failure",
        0,
        "Internal error: Executable code null after parsing.",
      )
      return
    }

    // 3. Execute via Browser Rendering using EXTRACTED code
    let checkResult: {
      statusOutcome: "success" | "failure"
      durationMs: number
      errorMessage?: string
    } = {
      statusOutcome: "failure",
      durationMs: 0,
      errorMessage: "Execution did not complete",
    }
    const startTime = Date.now()

    try {
      console.log(
        `Launching browser for [${monitorId}] with runtime [${runtime}] and timeout [${timeoutSeconds}s]`,
      )
      const browser = await this.env.BROWSER.launch(runtime)
      const browserContext = await browser.newContext()
      browserContext.setDefaultTimeout(timeoutSeconds * 1000)
      const page = await browserContext.newPage()

      // Use the extracted executableCode string here
      const userScriptFunction = new Function(
        "page",
        "context",
        "browser",
        executableCode,
      )
      await userScriptFunction(page, browserContext, browser)

      // If the script completes without throwing, consider it a success
      const durationMs = Date.now() - startTime
      console.log(
        `Synthetic check for [${monitorId}] completed successfully in ${durationMs}ms.`,
      )
      checkResult = { statusOutcome: "success", durationMs }

      await browser.close()
    } catch (error) {
      const durationMs = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(
        `Synthetic check for [${monitorId}] failed after ${durationMs}ms:`,
        errorMsg,
      )
      checkResult = {
        statusOutcome: "failure",
        durationMs,
        errorMessage: errorMsg,
      }
      // Attempt to close browser even on error
      try {
        if (this.env.BROWSER && typeof this.env.BROWSER.close === "function") {
          await this.env.BROWSER.close()
        }
      } catch (closeError) {
        console.error(
          `Error closing browser after script failure for [${monitorId}]:`,
          closeError,
        )
      }
    }

    // 4. Record check result
    await this.recordCheckResult(
      db,
      monitorId,
      checkResult.statusOutcome,
      checkResult.durationMs,
      checkResult.errorMessage,
    )

    // TODO: Add logic for consecutive failures and alerting
    console.log(
      `Synthetic check finished for [${monitorId}]. Outcome: ${checkResult.statusOutcome}`,
    )
  }

  private async recordCheckResult(
    db: ReturnType<typeof useDrizzle>,
    monitorId: string,
    statusOutcome: "success" | "failure",
    durationMs: number,
    errorMessage?: string,
  ) {
    try {
      await db.insert(SyntheticChecksTable).values({
        syntheticMonitorId: monitorId,
        timestamp: new Date(),
        statusOutcome: statusOutcome,
        durationMs: durationMs,
        errorMessage: errorMessage,
      })
      console.log(`Recorded check result for [${monitorId}]`)
    } catch (dbError) {
      console.error(
        `Failed to record check result for [${monitorId}]:`,
        dbError,
      )
    }
  }
}
