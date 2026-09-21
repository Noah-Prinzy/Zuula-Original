"use client"

import { REGEXP_ONLY_DIGITS } from "input-otp"

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { OTP_LENGTH } from "@/lib/auth"

// 6-digit one-time code, split 3–3. Supports paste and SMS autofill (autocomplete=one-time-code).
export function CodeInput({
  id,
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  describedBy,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  invalid?: boolean
  disabled?: boolean
  describedBy?: string
}) {
  return (
    <InputOTP
      id={id}
      maxLength={OTP_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      autoComplete="one-time-code"
      inputMode="numeric"
      aria-invalid={invalid}
      aria-describedby={describedBy}
      containerClassName="justify-start"
    >
      <InputOTPGroup>
        {[0, 1, 2].map((i) => (
          <InputOTPSlot key={i} index={i} aria-invalid={invalid} className="size-11 text-lg" />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        {[3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} aria-invalid={invalid} className="size-11 text-lg" />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
