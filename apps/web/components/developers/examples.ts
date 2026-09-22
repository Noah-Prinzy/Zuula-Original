import { API_RATE_LIMIT } from "@/lib/mock/account"
import { getSampleReport, SAMPLE_REPORTS } from "@/lib/mock/fact-checks"
import type { FactCheckReport } from "@/lib/types/fact-check"

// Request and response examples for the API docs, built from the sample data so they always
// match the FactCheckReport type (lib/types/fact-check.ts). Code is never translated.

export const BASE_URL = "https://api.zuula.ug/v1"
export { API_RATE_LIMIT }

const sample = (getSampleReport("fc-2026-0142") ?? SAMPLE_REPORTS[0]) as FactCheckReport
const json = (value: unknown) => JSON.stringify(value, null, 2)

// The public fact-check object: the report minus internal fields, one item per array.
function factCheck(r: FactCheckReport) {
  return {
    id: r.id,
    trackingId: r.trackingId,
    url: `https://zuula.ug/fact-checks/${r.id}`,
    title: r.title,
    contentType: r.contentType,
    language: r.language,
    category: r.category,
    verdict: r.verdict,
    confidence: r.confidence,
    summary: r.summary,
    whatIsFalse: r.whatIsFalse.slice(0, 1),
    whatIsTrue: r.whatIsTrue.slice(0, 1),
    claims: r.claims.slice(0, 1).map(({ id, start, end, assessment, reason, citationIds }) => ({
      id,
      start,
      end,
      assessment,
      reason,
      citationIds,
    })),
    citations: r.citations
      .slice(0, 1)
      .map(({ id, sourceName, title, url, publishedAt, stance, trusted }) => ({
        id,
        sourceName,
        title,
        url,
        publishedAt,
        stance,
        trusted,
      })),
    aiSignals: r.aiSignals.slice(0, 1),
    community: {
      accurate: r.community.accurate,
      inaccurate: r.community.inaccurate,
    },
    humanReview: r.humanReview ?? null,
    checkedAt: r.checkedAt,
    processingSeconds: r.processingSeconds,
  }
}

const TEXT = "Boiled banana leaves cure malaria in three days. Share with your family!"
const AUTH_JS = "Authorization: `Bearer ${process.env.ZUULA_API_KEY}`"
const AUTH_PY = `headers={"Authorization": f"Bearer {os.environ['ZUULA_API_KEY']}"}`

export const SUBMIT = {
  curl: `curl ${BASE_URL}/checks \\
  -H "Authorization: Bearer $ZUULA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "text",
    "content": "${TEXT}",
    "language": "auto"
  }'

# Media: send the file as multipart/form-data
curl ${BASE_URL}/checks \\
  -H "Authorization: Bearer $ZUULA_API_KEY" \\
  -F type=media \\
  -F file=@voice-note.ogg`,
  javascript: `// Node 18+ or any server runtime with fetch. Never call the API from a
// browser: that would expose your key.
const res = await fetch("${BASE_URL}/checks", {
  method: "POST",
  headers: {
    ${AUTH_JS},
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "text",
    content: "${TEXT}",
    language: "auto",
  }),
})

if (!res.ok) throw new Error((await res.json()).error.message)
const { trackingId } = await res.json()`,
  python: `import os
import requests

res = requests.post(
    "${BASE_URL}/checks",
    ${AUTH_PY},
    json={
        "type": "text",
        "content": "${TEXT}",
        "language": "auto",
    },
    timeout=30,
)
res.raise_for_status()
tracking_id = res.json()["trackingId"]`,
}

export const SUBMIT_RESPONSE = json({
  trackingId: sample.trackingId,
  status: "queued",
  estimatedSeconds: 10,
  statusUrl: `${BASE_URL}/checks/${sample.trackingId}`,
})

export const STATUS = {
  curl: `curl ${BASE_URL}/checks/${sample.trackingId} \\
  -H "Authorization: Bearer $ZUULA_API_KEY"`,
  javascript: `// Poll until the check finishes. Text takes about 10 seconds, media up to a minute.
async function waitForResult(trackingId) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await fetch("${BASE_URL}/checks/" + trackingId, {
      headers: { ${AUTH_JS} },
    })

    if (res.status === 429) {
      const wait = Number(res.headers.get("Retry-After") ?? 60)
      await new Promise((r) => setTimeout(r, wait * 1000))
      continue
    }

    const check = await res.json()
    if (check.status === "completed") return check.result
    if (check.status === "failed") throw new Error(check.error.message)
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error("Timed out waiting for the check")
}`,
  python: `import os
import time
import requests

def wait_for_result(tracking_id):
    for _ in range(30):
        res = requests.get(
            f"${BASE_URL}/checks/{tracking_id}",
            ${AUTH_PY},
            timeout=30,
        )
        if res.status_code == 429:
            time.sleep(int(res.headers.get("Retry-After", 60)))
            continue
        check = res.json()
        if check["status"] == "completed":
            return check["result"]
        if check["status"] == "failed":
            raise RuntimeError(check["error"]["message"])
        time.sleep(3)
    raise TimeoutError("Timed out waiting for the check")`,
}

export const STATUS_RESPONSE = json({
  trackingId: sample.trackingId,
  status: "completed",
  submittedAt: sample.checkedAt,
  completedAt: sample.checkedAt,
  result: factCheck(sample),
})

export const REPORT = {
  curl: `curl ${BASE_URL}/fact-checks/${sample.id} \\
  -H "Authorization: Bearer $ZUULA_API_KEY"`,
  javascript: `const res = await fetch("${BASE_URL}/fact-checks/${sample.id}", {
  headers: { ${AUTH_JS} },
})
const factCheck = await res.json()`,
  python: `res = requests.get(
    "${BASE_URL}/fact-checks/${sample.id}",
    ${AUTH_PY},
    timeout=30,
)
fact_check = res.json()`,
}

export const REPORT_RESPONSE = json(factCheck(sample))
export const SAMPLE_REPORT_ID = sample.id

export const SEARCH = {
  curl: `curl -G ${BASE_URL}/fact-checks \\
  -H "Authorization: Bearer $ZUULA_API_KEY" \\
  --data-urlencode "q=internet" \\
  -d verdict=false \\
  -d perPage=10`,
  javascript: `const params = new URLSearchParams({ q: "internet", verdict: "false", perPage: "10" })
const res = await fetch("${BASE_URL}/fact-checks?" + params, {
  headers: { ${AUTH_JS} },
})
const { data, total } = await res.json()`,
  python: `res = requests.get(
    "${BASE_URL}/fact-checks",
    ${AUTH_PY},
    params={"q": "internet", "verdict": "false", "perPage": 10},
    timeout=30,
)
results = res.json()["data"]`,
}

export const SEARCH_RESPONSE = json({
  data: [
    {
      id: sample.id,
      trackingId: sample.trackingId,
      url: `https://zuula.ug/fact-checks/${sample.id}`,
      title: sample.title,
      verdict: sample.verdict,
      confidence: sample.confidence,
      summary: sample.summary,
      category: sample.category,
      language: sample.language,
      checkedAt: sample.checkedAt,
    },
  ],
  page: 1,
  perPage: 10,
  total: 1,
})

export const ERROR_RESPONSE = json({
  error: {
    code: "rate_limited",
    message: `This key has used its ${API_RATE_LIMIT} requests for this hour.`,
    retryAfter: 1260,
  },
})

export const RATE_HEADERS = `HTTP/1.1 200 OK
X-RateLimit-Limit: ${API_RATE_LIMIT}
X-RateLimit-Remaining: 63
X-RateLimit-Reset: 1790000000`
