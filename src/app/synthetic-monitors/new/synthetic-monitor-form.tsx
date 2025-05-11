"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react"
import js from "highlight.js/lib/languages/javascript"
import ts from "highlight.js/lib/languages/typescript"

import { all, createLowlight } from "lowlight"
import "highlight.js/styles/github-dark.css"

import { useForm } from "react-hook-form"
import { z } from "zod"
import CodeBlock from "@/components/editor/code-block"
import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/registry/new-york-v4/ui/form"
import { Input } from "@/registry/new-york-v4/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/new-york-v4/ui/select"

// Register the languages you need
const lowlight = createLowlight(all)
lowlight.register("javascript", js)
lowlight.register("typescript", ts)

const baseSchema = z.object({
  name: z.string().min(1, "Name is required."),
  checkInterval: z.coerce.number().int().positive("Interval must be positive."),
  timeoutSeconds: z.coerce.number().int().positive("Timeout must be positive."),
  runtime: z.enum(["playwright-cf-latest", "puppeteer-cf-latest"]),
  scriptContent: z.string().min(1, "Script content cannot be empty."),
})

const syntheticMonitorFormSchema = baseSchema.refine(
  (data) => data.checkInterval >= data.timeoutSeconds + 5,
  {
    message: "Check Interval must be at least 5 seconds greater than Timeout.",
    path: ["checkInterval"],
  },
)

export type SyntheticMonitorFormValues = z.infer<
  typeof syntheticMonitorFormSchema
>

function TiptapEditor({
  onChange,
  initialValue,
  placeholder,
}: {
  onChange: (value: string) => void
  initialValue: string
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      Document,
      Text,
      Paragraph,
      CodeBlockLowlight
        .extend({
          addNodeView() {
            return ReactNodeViewRenderer(CodeBlock)
          },
          isolating: true,
        })
        .configure({ lowlight, defaultLanguage: "typescript" }),
    ],
    content: {
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: 'typescript' },
          content: initialValue ? [{ type: 'text', text: initialValue }] : [],
        },
      ],
    },
    onUpdate: ({ editor }) => {
      // Extract text content specifically from code blocks
      let textContent = ""
      editor.state.doc.descendants((node) => {
        if (node.type.name === "codeBlock") {
          textContent += `${node.textContent}\n` // Add newline between blocks if multiple
        }
      })
      onChange(textContent.trim()) // Trim trailing newline
    },
    // editorProps: {
    //   attributes: {
    //     // Add Tailwind classes for styling the editor content area
    //     class:
    //       "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] p-2 w-full",
    //   },
    // },
  })

  // useEffect(() => {
  //   if (editor?.isEmpty) {
  //     editor.commands.setContent('<pre><code class="language-typescript"></code></pre>')
  //   }
  // }, [editor])

  return (
    <div className="border rounded-md overflow-hidden">
      <EditorContent editor={editor} />
    </div>
  )
}

export function SyntheticMonitorForm() {
  const form = useForm<SyntheticMonitorFormValues>({
    resolver: zodResolver(syntheticMonitorFormSchema),
    defaultValues: {
      name: "",
      checkInterval: 300,
      timeoutSeconds: 30,
      runtime: "playwright-cf-latest",
      scriptContent: "",
    },
  })

  function onSubmit(values: SyntheticMonitorFormValues) {
    console.log("Form Submitted:", values)
    // TODO: Implement API call to POST /api/synthetic-monitors
  }

  function handleTestScript() {
    const scriptContent = form.getValues("scriptContent")
    const runtime = form.getValues("runtime")
    const timeout = form.getValues("timeoutSeconds")
    console.log("Testing script:", { scriptContent, runtime, timeout })
    // TODO: Implement API call to POST /api/monitors/synthetic/test
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Login Flow Check" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for your synthetic monitor.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check Interval */}
          <FormField
            control={form.control}
            name="checkInterval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check Interval (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="300"
                    {...field}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    min="1"
                  />
                </FormControl>
                <FormDescription>
                  How often to run the check (e.g., 60, 300, 900).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Timeout */}
          <FormField
            control={form.control}
            name="timeoutSeconds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeout (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    {...field}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    min="1"
                  />
                </FormControl>
                <FormDescription>
                  Maximum execution time allowed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Runtime */}
        <FormField
          control={form.control}
          name="runtime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Runtime</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a runtime" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="playwright-cf-latest">
                    Playwright (Cloudflare Latest)
                  </SelectItem>
                  <SelectItem value="puppeteer-cf-latest">
                    Puppeteer (Cloudflare Latest)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The browser automation library to use.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Script Content */}
        <FormField
          control={form.control}
          name="scriptContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Script</FormLabel>
              <FormControl>
                <TiptapEditor
                  onChange={field.onChange}
                  initialValue={field.value ?? ""}
                  placeholder="Enter your Playwright/Puppeteer script here..."
                />
              </FormControl>
              <FormDescription>
                Write your browser automation script here (JavaScript or
                TypeScript).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between items-center">
          <Button type="submit">Create Monitor</Button>
          <Button type="button" variant="outline" onClick={handleTestScript}>
            Test Script
          </Button>
        </div>
      </form>
    </Form>
  )
}
