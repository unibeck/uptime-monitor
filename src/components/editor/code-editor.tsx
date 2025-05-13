"use client"

import { useTheme } from "next-themes"
import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"
import { useEditorTheme } from "prism-react-editor/themes"

import "prism-react-editor/prism/languages/javascript"
import "prism-react-editor/layout.css"
import "prism-react-editor/scrollbar.css"

import { IconCopy, IconCopyCheckFilled } from "@tabler/icons-react"
import { useState } from "react"
import { Button } from "@/registry/new-york-v4/ui/button"

const DEFAULT_LIVE_CODE = `\
async ({ page, context }) => {
  await page.goto('https://example.com');
}
`

interface CodeEditorProps {
  initialValue?: string
  onChange?: (value: string) => void
}

export default function CodeEditor({
  initialValue = DEFAULT_LIVE_CODE,
  onChange,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme()
  const cssEditorTheme = useEditorTheme(
    resolvedTheme === "dark" ? "github-dark" : "github-light",
  )

  const [editorContent, setEditorContent] = useState(initialValue)

  const [copied, setCopied] = useState(false)
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(editorContent)
    setCopied(true)

    // Reset "copied" state after 2 seconds
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpdate = (value: string) => {
    setEditorContent(value)
    onChange?.(value)
  }

  return (
    <div className="focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] text-base md:text-md border-input placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 field-sizing-content w-full border bg-transparent shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50">
      {cssEditorTheme && (
        <div className="relative">
          <div className="absolute right-0.5 top-0.5 z-10 opacity-65 hover:opacity-100 transition-opacity duration-200">
            <Button onClick={copyToClipboard} variant="accent">
              {copied ? (
                <IconCopyCheckFilled className="h-4 w-4" />
              ) : (
                <IconCopy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="grid">
            <style>{cssEditorTheme}</style>
            <Editor
              language="javascript"
              value={initialValue}
              className="resize-y min-h-[160px] max-h-[500px] w-full"
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
        </div>
      )}
    </div>
  )
}
