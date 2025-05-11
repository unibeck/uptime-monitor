import { NodeViewContent, type NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { Check, Copy } from "lucide-react" // Icons for UI
import { useState } from "react"
import { Button } from "@/registry/new-york-v4/ui/button"

function CodeBlock({ node }: NodeViewProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    const codeContent = node.textContent || ""

    if (codeContent) {
      await navigator.clipboard.writeText(codeContent)
      setCopied(true)

      // Reset "copied" state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <NodeViewWrapper style={{ position: "relative" }}>
      <Button
        type="button"
        variant="outline"
        onClick={copyToClipboard}
        style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 1 }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </Button>
      <NodeViewContent as="code" />
    </NodeViewWrapper>
  )
}

export default CodeBlock
