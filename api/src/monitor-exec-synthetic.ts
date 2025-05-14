import { WorkerEntrypoint } from "cloudflare:workers"
import { Browser, launch, type BrowserWorker } from '@cloudflare/playwright';

import { eq } from "drizzle-orm"
import { OK } from "stoker/http-status-codes"
import { OK as OK_PHRASE } from "stoker/http-status-phrases"
import { takeFirstOrNull, useDrizzle } from "@/db"
import { SyntheticChecksTable, SyntheticMonitorsTable } from "@/db/schema"

interface SyntheticExecPayload {
  monitorId: string
  runtime: "playwright-cf-latest" | "puppeteer-cf-latest"
  timeoutSeconds: number
}

interface TestScriptPayload {
  scriptContent: string;
  runtime: "playwright-cf-latest" | "puppeteer-cf-latest";
  timeoutSeconds: number;
}

interface TestScriptInternalResult {
  success: boolean;
  logs: string[];
  error?: string;
  durationMs?: number;
}

interface CfConsoleMessage {
  text: () => string;
}

export default class MonitorExecSynthetic extends WorkerEntrypoint<CloudflareEnv> {
  async fetch(_request: Request) {
    // This worker is triggered internally, not via HTTP fetch
    return new Response(
      `${OK_PHRASE}\nMonitorExecSynthetic: Use service binding to trigger checks.`,
      { status: OK },
    )
  }

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
    let script: string | null = null

    try {
      const scriptObject = await this.env.SYNTHETIC_SCRIPTS.get(scriptStateKey)
      if (!scriptObject) {
        throw new Error(
          `Script state object not found in R2 for key: ${scriptStateKey}`,
        )
      }
      script = await scriptObject.text()
      console.log(
        `Fetched and parsed script state [${scriptStateKey}] for monitor [${monitorId}]`,
      )
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

    if (!script) {
      console.error(
        `Script is unexpectedly null for [${monitorId}] after parsing.`,
      )
      await this.recordCheckResult(
        db,
        monitorId,
        "failure",
        0,
        "Internal error: Script null after parsing.",
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
        script,
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

  // --- Test Script Execution Method ---
  public async testScript(
    payload: TestScriptPayload,
  ): Promise<TestScriptInternalResult> {
    const { scriptContent, runtime, timeoutSeconds } = payload;
    const logs: string[] = [];
    // The BROWSER binding itself (this.env.BROWSER) is what we call .launch() on.
    // The result of launch is the actual browser instance to be closed.
    let browser: Browser | undefined = undefined;

    logs.push(
      `[TestScript] Initiating test with runtime: ${runtime}, timeout: ${timeoutSeconds}s.`,
    );
    const startTime = Date.now();

    try {
      logs.push(`[TestScript] Launching browser runtime: ${runtime}`);
      browser = await launch(this.env.BROWSER);
      logs.push("[TestScript] Browser launched.");
      const page = await browser.newPage();
      logs.push("[TestScript] New page created.");

      page.on("console", (msg: CfConsoleMessage) => { 
        const msgText = msg.text();
        logs.push(`[Script CONSOLE] ${msgText}`);
      });

      logs.push("[TestScript] Executing user script...");

      //BLOCKED: https://x.com/SolBeckman_/status/1922447497156317546
      // const userScriptFunction = new Function(
      //   "page",
      //   "context",
      //   "browser",
      //   scriptContent,
      // );
      // await userScriptFunction(page, context, launchedBrowser);

      const durationMs = Date.now() - startTime;
      logs.push(
        `[TestScript] Script completed successfully in ${durationMs}ms.`,
      );
      return { success: true, durationMs, logs };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      logs.push(`[TestScript] Script execution failed after ${durationMs}ms.`);
      logs.push(`[TestScript] Error: ${errorMsg}`);
      // Include stack trace if available
      if (error instanceof Error && error.stack) {
        logs.push(`[TestScript] Stack: ${error.stack}`);
      }
      return { success: false, durationMs, error: errorMsg, logs };
    } finally {
      if (browser) {
        try {
          logs.push("[TestScript] Closing browser.");
          await browser.close();
          logs.push("[TestScript] Browser closed.");
        } catch (closeError) {
          const closeMsg =
            closeError instanceof Error
              ? closeError.message
              : String(closeError);
          logs.push(`[TestScript] Error closing browser: ${closeMsg}`);
        }
      }
    }
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
