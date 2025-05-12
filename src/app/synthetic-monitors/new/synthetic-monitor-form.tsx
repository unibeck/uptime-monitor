"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Editor } from 'codice'
import { useState } from "react"
import { useForm } from "react-hook-form"

import { z } from "zod"
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
import { Textarea } from "@/registry/new-york-v4/ui/textarea"
import LiveEditor from "@/components/editor/live-editor"

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

function SugarHighEditor({
  onChange,
  initialValue,
  placeholder,
}: {
  onChange: (value: string) => void
  initialValue: string
  placeholder?: string
}) {
  const [code, setCode] = useState(initialValue || "let asdf = 0;")
  // const [highlightedCode, setHighlightedCode] = useState("")

  // useEffect(() => {
  //   const initialContent = initialValue || ""
  //   setCode(initialContent)
  //   setHighlightedCode(highlight(initialContent))
  // }, [initialValue])

  // const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   const newCode = event.target.value
  //   setCode(newCode)
  //   setHighlightedCode(highlight(newCode))
  //   onChange(newCode)
  // }

  return (
    <Editor
      title="index.js"
      value={code}
      onChange={(text) => setCode(text.toString())}
    />
    // <div className="relative border rounded-md">
    //   {/* <Textarea
    //     value={code}
    //     onChange={handleCodeChange}
    //     placeholder={placeholder}
    //     className="absolute inset-0 w-full h-full p-2 bg-transparent text-transparent caret-white font-mono text-sm resize-none !outline-none !ring-0 !border-0 z-10"
    //     spellCheck="false"
    //   /> */}
    //   {/* <pre className="min-h-[200px] p-2 w-full overflow-auto whitespace-pre-wrap break-all">
    //     <code
    //       dangerouslySetInnerHTML={{ __html: highlightedCode }}
    //       className="font-mono text-sm"
    //     />
    //   </pre> */}
    // </div>
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
                <LiveEditor />
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
