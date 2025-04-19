import { PRE_URL, PROD_URL } from "@/lib/constants"

const DEV: AppEnvMetadata = {
  serverUrl: "http://localhost:8787",
}

const PRE: AppEnvMetadata = {
  ...DEV,

  serverUrl: PRE_URL,
}

const PROD: AppEnvMetadata = {
  ...PRE,

  serverUrl: PROD_URL,
}

export enum AppEnvID {
  DEV = "development",
  PRE = "preview",
  PROD = "production",
}

export interface AppEnvMetadata {
  serverUrl: string
}

const AppEnvs: { [value in AppEnvID]: AppEnvMetadata } = {
  [AppEnvID.DEV]: DEV,
  [AppEnvID.PRE]: PRE,
  [AppEnvID.PROD]: PROD,
}

export function getAppEnvID(cf: CloudflareEnv): AppEnvID {
  console.log(`Getting app env ID for [${cf.ENVIRONMENT}]`)
  return getAppEnvIDFromStr(cf.ENVIRONMENT) || AppEnvID.DEV
}

export function getAppEnvIDFromStr(appEnvStr: string): AppEnvID {
  switch (appEnvStr.toLowerCase()) {
    case "development":
      return AppEnvID.DEV
    case "preview":
      return AppEnvID.PRE
    case "production":
      return AppEnvID.PROD
    default:
      throw new Error(`Unknown environment: ${appEnvStr}`)
  }
}

export function getAppEnvMetadata(appEnvId: AppEnvID): AppEnvMetadata {
  return AppEnvs[appEnvId]
}
