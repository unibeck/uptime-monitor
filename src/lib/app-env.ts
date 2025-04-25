import { PRE_FQDN, PROD_FQDN } from "@/lib/constants"

const DEV: AppEnvMetadata = {
  appUrl: "http://localhost:8787",
}

const PRE: AppEnvMetadata = {
  ...DEV,

  appUrl: PRE_FQDN,
}

const PROD: AppEnvMetadata = {
  ...PRE,

  appUrl: PROD_FQDN,
}

export enum AppEnvID {
  DEV = "development",
  PRE = "preview",
  PROD = "production",
}

export interface AppEnvMetadata {
  appUrl: string
}

const AppEnvs: { [value in AppEnvID]: AppEnvMetadata } = {
  [AppEnvID.DEV]: DEV,
  [AppEnvID.PRE]: PRE,
  [AppEnvID.PROD]: PROD,
}

export function getAppEnvID(): AppEnvID {
  console.log(`Getting app env ID for [${process.env.NEXT_PUBLIC_APP_ENV}]`)
  return getAppEnvIDFromStr(process.env.NEXT_PUBLIC_APP_ENV || "development")
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

export function getAppEnvMetadata(appEnvId = getAppEnvID()): AppEnvMetadata {
  return AppEnvs[appEnvId]
}
