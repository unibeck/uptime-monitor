// Script to log the OpenNext bundle size
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

async function logBundleSize() {
  console.log("Logging OpenNext bundle size...")
  const handlerPath = join(
    process.cwd(),
    ".open-next/server-functions/default/handler.mjs",
  )

  if (!existsSync(handlerPath)) {
    console.error("Handler file not found:", handlerPath)
    return
  }
  const content = readFileSync(handlerPath, "utf8")

  const originalSize = Buffer.byteLength(content, "utf8")
  console.log(`Original size: ${formatBytes(originalSize)}`)

  const compressedSize = gzipSync(content).length
  console.log(`Compressed size: ${formatBytes(compressedSize)}`)
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) {
    return "0 Bytes"
  }

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`
}

logBundleSize().catch(console.error)
