// Custom changes to the generated types if they are not natively supported by `wrangler types`
// https://developers.cloudflare.com/workers/wrangler/commands/#types
interface CloudflareEnv extends CloudflareEnvGen {
  // Durable Objects types are not exported by `wrangler types` (yet)
  // https://github.com/cloudflare/workers-sdk/issues/6905
  MONITOR_TRIGGER: DurableObjectNamespace<
    import("@api/monitor-trigger").MonitorTrigger
  >
  MONITOR_TRIGGER_RPC: Service<import("@api/monitor-trigger").MonitorTriggerRPC>
  MONITOR_EXEC: Service<import("@api/monitor-exec").MonitorExec>
}
