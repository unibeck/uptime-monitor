"use client"

import "./live-editor.css"
import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"
import "prism-react-editor/prism/languages/javascript"

import "prism-react-editor/layout.css"
import "prism-react-editor/scrollbar.css"
import "prism-react-editor/themes/github-dark.css"
// import 'prism-react-editor/themes/night-owl-light.css';
import "prism-react-editor/search.css"

const DEFAULT_LIVE_CODE = `\
async ({ page, context }) => {
  await page.goto('https://example.com');
}
`

interface LiveEditorProps {
  initialValue?: string
  onChange?: (value: string) => void
}

export default function LiveEditor({
  initialValue = DEFAULT_LIVE_CODE,
  onChange,
}: LiveEditorProps) {
  const handleUpdate = (value: string) => {
    onChange?.(value)
  }

  return (
    <div className="grid border">
      <Editor
        language="javascript"
        value={initialValue}
        textareaProps={{
          name: "editor",
          "aria-label": "Code editor",
        }}
        onUpdate={handleUpdate}
      >
        {(editor) => {
          return <BasicSetup editor={editor} />
        }}
      </Editor>
    </div>
    // <div className={"live-editor-section border"}>
    //   <div className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
    //     <Editor
    //       className="resize-y prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] max-h-[500px] w-full"
    //       controls={false}
    //       value={liveCode}
    //       onChange={(newCode) => {
    //         setLiveCode(newCode.toString())
    //         setDefaultLiveCode(newCode.toString())
    //       }}
    //     />
    //   </div>
    // </div>
  )
}
