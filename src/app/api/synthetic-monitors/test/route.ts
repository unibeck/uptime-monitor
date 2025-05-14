import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { INTERNAL_SERVER_ERROR, OK } from "stoker/http-status-codes";
import { INTERNAL_SERVER_ERROR as INTERNAL_SERVER_ERROR_PHRASE } from "stoker/http-status-phrases";
import { z } from "zod";
import { createRoute } from "@/lib/api-utils";

// Define the schema for the request body
const testScriptBodySchema = z.object({
  scriptContent: z.string().min(1, "Script content cannot be empty."),
  runtime: z.enum(["playwright-cf-latest", "puppeteer-cf-latest"]),
  timeoutSeconds: z.coerce.number().int().positive("Timeout must be positive."),
});

// Define the expected result structure from the Durable Object's testScript method
interface TestScriptDOResult {
  success: boolean;
  logs?: string[];
  error?: string;
  durationMs?: number;
  // Potential future additions:
  // screenshotUrl?: string;
  // videoUrl?: string;
}

/**
 * POST /api/synthetic-monitors/test
 *
 * Executes a synthetic monitor script for testing purposes without saving any resources.
 *
 * @body {testScriptBodySchema} - Script content, runtime, and timeout for the test.
 * @returns {Promise<NextResponse<TestScriptDOResult>>} JSON response with the test execution results.
 * @throws {NextResponse} 400 if validation fails, 500 on internal errors or DO communication failure.
 */
export const POST = createRoute
  .body(testScriptBodySchema)
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext();
    const { scriptContent, runtime, timeoutSeconds } = context.body;

    try {
      console.log(
        `Attempting to test script with runtime: ${runtime}, timeout: ${timeoutSeconds}s`,
      );
      
      const testResult: TestScriptDOResult =
        await env.MONITOR_EXEC_SYNTHETIC.testScript({
          scriptContent,
          runtime,
          timeoutSeconds,
        });

      console.log("Script test finished. Result:", testResult);
      return NextResponse.json(testResult, { status: OK });
    } catch (error) {
      console.error("Error testing synthetic monitor script:", error);
      // Determine if the error is from the DO or a general error
      const errorMessage =
        error instanceof Error ? error.message : INTERNAL_SERVER_ERROR_PHRASE;
      
      // If the DO itself throws an error object that should be propagated,
      // you might want to check `error.cause` or specific error types.
      return NextResponse.json(
        {
          success: false, // Ensure the response conforms to a TestScriptDOResult like structure for consistency
          error: `Failed to test script: ${errorMessage}`,
          logs: [],
          durationMs: 0,
        },
        { status: INTERNAL_SERVER_ERROR },
      );
    }
  }); 