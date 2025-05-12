"use client"

import { Editor } from "codice"
import { useEffect, useState, } from "react"

const defaultColorPlateColors = {
  class: "#8d85ff",
  identifier: "#354150",
  sign: "#8996a3",
  entity: "#6eafad",
  property: "#4e8fdf",
  jsxliterals: "#bf7db6",
  string: "#00a99a",
  keyword: "#f47067",
  comment: "#a19595",
  break: "#ffffff",
  space: "#ffffff",
}

const DEFAULT_LIVE_CODE = `\
async ({ page, context }) => {
  await page.goto('https://example.com');
}

`

const DEFAULT_LIVE_CODE_KEY = "$saved-live-code"
function useDefaultLiveCode(defaultCodeText: string) {
  const [defaultCode, setCode] = useState(defaultCodeText || "")

  useEffect(() => {
    if (defaultCode) {
      return
    }

    setCode(
      window.localStorage.getItem(DEFAULT_LIVE_CODE_KEY) || DEFAULT_LIVE_CODE,
    )
  }, [defaultCode])

  const setDefaultLiveCode = (code: string) =>
    window.localStorage.setItem(DEFAULT_LIVE_CODE_KEY, code)

  return {
    defaultLiveCode: defaultCode,
    setDefaultLiveCode,
  }
}

export default function LiveEditor({
  defaultCode = DEFAULT_LIVE_CODE,
}) {
  const { defaultLiveCode, setDefaultLiveCode } =
    useDefaultLiveCode(defaultCode)

  const [liveCode, setLiveCode] = useState(defaultLiveCode)

  return (
    <div className={"live-editor-section border"}>
      <style>{`
        ${`
        .live-editor-section {
          --codice-caret-color: var(--foreground);
          --sh-class: ${defaultColorPlateColors.class};
          --sh-identifier: ${defaultColorPlateColors.identifier};
          --sh-sign: ${defaultColorPlateColors.sign};
          --sh-property: ${defaultColorPlateColors.property};
          --sh-entity: ${defaultColorPlateColors.entity};
          --sh-string: ${defaultColorPlateColors.string};
          --sh-keyword: ${defaultColorPlateColors.keyword};
          --sh-comment: ${defaultColorPlateColors.comment};
          --sh-jsxliterals: ${defaultColorPlateColors.jsxliterals};
        }
        `}`}</style>

      <div className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
        <Editor
          className="resize-y prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] max-h-[500px] w-full"
          controls={false}
          value={liveCode}
          onChange={(newCode) => {
            setLiveCode(newCode.toString())
            setDefaultLiveCode(newCode.toString())
          }}
        />
      </div>
    </div>
  )
}
