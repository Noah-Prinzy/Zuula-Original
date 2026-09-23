"use client"

import * as React from "react"
import {
  RiCloseLine,
  RiImageLine,
  RiMicLine,
  RiUploadCloud2Line,
  RiVideoLine,
} from "@remixicon/react"
import { useTranslations } from "next-intl"

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Progress } from "@/components/ui/progress"
import { ACCEPT_ATTR, formatBytes, MAX_FILE_BYTES, mediaKind } from "@/lib/submission"
import { cn } from "@/lib/utils"

const KIND_ICON = { image: RiImageLine, audio: RiMicLine, video: RiVideoLine }

// FR-SUBMIT-01 / 05: one image, audio or video file up to 50 MB.
export function MediaDropzone({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  progress,
  disabled,
}: {
  id: string
  value: File | null
  onChange: (file: File | null) => void
  invalid?: boolean
  describedBy?: string
  /** 0–100 while uploading; undefined when idle. */
  progress?: number
  disabled?: boolean
}) {
  const t = useTranslations("Submit.dropzone")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  // Object URL for image previews, revoked when the file changes.
  const preview = React.useMemo(
    () => (value && mediaKind(value) === "image" ? URL.createObjectURL(value) : null),
    [value]
  )
  React.useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  function pick(files: FileList | null) {
    const file = files?.[0]
    if (file) onChange(file)
  }

  if (value) {
    const kind = mediaKind(value)
    const Icon = kind ? KIND_ICON[kind] : RiUploadCloud2Line
    const uploading = progress !== undefined
    return (
      <div className="flex flex-col gap-2">
        <Attachment
          state={uploading ? (progress < 100 ? "uploading" : "processing") : invalid ? "error" : "done"}
          className="w-full"
        >
          <AttachmentMedia variant={preview ? "image" : "icon"} className={preview ? "w-16" : undefined}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img src={preview} alt="" />
            ) : (
              <Icon aria-hidden />
            )}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{value.name}</AttachmentTitle>
            <AttachmentDescription>
              {kind ? t(`kinds.${kind}`) : t("unsupported")} · {formatBytes(value.size)}
              {uploading && ` · ${progress < 100 ? t("uploading", { percent: progress }) : t("scanning")}`}
            </AttachmentDescription>
          </AttachmentContent>
          {!uploading && (
            <AttachmentActions>
              <AttachmentAction aria-label={t("remove")} onClick={() => onChange(null)} disabled={disabled}>
                <RiCloseLine />
              </AttachmentAction>
            </AttachmentActions>
          )}
        </Attachment>
        {uploading && <Progress value={progress} aria-label={t("uploadProgress")} />}
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) pick(e.dataTransfer.files)
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 border border-dashed bg-muted/30 px-4 py-10 text-center transition-colors",
        dragging && "border-primary bg-primary/5",
        invalid && "border-destructive"
      )}
    >
      <RiUploadCloud2Line className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-sm">
        {t.rich("dragOr", {
          browse: (chunks) => (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="press font-medium text-primary underline-offset-4 [--press-tint:transparent] hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {chunks}
            </button>
          ),
        })}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("accepts", { size: formatBytes(MAX_FILE_BYTES) })}
      </p>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        disabled={disabled}
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}
