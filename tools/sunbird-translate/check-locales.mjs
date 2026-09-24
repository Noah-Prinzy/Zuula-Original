// Independent check of apps/web/messages/{lg,ach,nyn,teo}.json against en.json:
// valid JSON, no keys English lacks, every message parses with intl-messageformat's parser
// AND formats through next-intl's createTranslator, has exactly English's arguments/tags/choice options, and
// formats without throwing for every select value and several plural counts.
import fs from "node:fs"
import { createRequire } from "node:module"

const WEB = new URL("../../apps/web", import.meta.url).pathname
const require = createRequire(WEB + "/package.json")
const { parse } = require(WEB + "/node_modules/intl-messageformat/node_modules/@formatjs/icu-messageformat-parser")
const { IntlMessageFormat } = require(WEB + "/node_modules/intl-messageformat")
// next-intl's own runtime formatter (the path t() and t.rich() take in the app).
const { createTranslator } = await import(WEB + "/node_modules/use-intl/dist/esm/production/core.js")

const flat = (o, p = "", acc = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k
    if (v && typeof v === "object") flat(v, key, acc)
    else acc[key] = v
  }
  return acc
}
const en = flat(JSON.parse(fs.readFileSync(`${WEB}/messages/en.json`, "utf8")))

function sig(ast, acc = new Set(), vals = {}) {
  for (const el of ast) {
    switch (el.type) {
      case 0: break
      case 7: acc.add("#"); break
      case 8:
        acc.add(`<${el.value}>`)
        vals[el.value] = (c) => `[${[].concat(c).join("")}]`
        sig(el.children, acc, vals)
        break
      case 5: case 6: {
        const keys = Object.keys(el.options)
        acc.add(`${el.type === 6 ? "plural" : "select"}(${el.value}:${[...keys].sort()})`)
        ;(vals.__choices ??= {})[el.value] = el.type === 6 ? "n" : keys
        for (const o of Object.values(el.options)) sig(o.value, acc, vals)
        break
      }
      default:
        acc.add(`{${el.value}:${el.type}:${el.style ?? ""}}`)
        if (!(el.value in vals)) vals[el.value] = el.type === 2 ? 7 : el.type >= 3 ? new Date(0) : "V"
    }
  }
  return { acc, vals }
}

let failures = 0, checked = 0
for (const lang of ["lg", "ach", "nyn", "teo"]) {
  const raw = fs.readFileSync(`${process.env.DIR || WEB + "/messages"}/${lang}.json`, "utf8")
  const nested = JSON.parse(raw)
  const loc = flat(nested)
  const errors = []
  const tr = createTranslator({ locale: lang, messages: nested, timeZone: "Africa/Kampala", onError: (e) => errors.push(e) })
  let n = 0
  for (const [key, msg] of Object.entries(loc)) {
    const fail = (why) => (failures++, console.log(`FAIL ${lang} ${key}: ${why}\n  ${msg}`))
    if (!(key in en)) { fail("key not in en.json"); continue }
    if (typeof msg !== "string" || !msg.trim()) { fail("not a non-empty string"); continue }
    n++
    try {
      const e = sig(parse(en[key])), t = sig(parse(msg))
      const a = [...e.acc].sort().join(" "), b = [...t.acc].sort().join(" ")
      if (a !== b) { fail(`placeholders differ: en [${a}] vs [${b}]`); continue }
      // Every combination of select values, and counts 0/1/2/5 for plurals.
      const choices = Object.entries(e.vals.__choices || {})
      let combos = [{}]
      for (const [name, opts] of choices) {
        const values = opts === "n" ? [0, 1, 2, 5] : opts
        combos = combos.flatMap((c) => values.map((v) => ({ ...c, [name]: v })))
      }
      const { __choices, ...base } = e.vals
      for (const c of combos) {
        const v = { ...base, ...c }
        for (const l of [lang, "en"]) {
          const out = new IntlMessageFormat(msg, l).format(v)
          const str = [].concat(out).join("")
          if (/[{}]/.test(str) && !/[{}]/.test(en[key].replace(/\{[^{}]*\}/g, ""))) throw new Error(`stray brace in output: ${str}`)
        }
        errors.length = 0
        const hasTags = [...e.acc].some((x) => x.startsWith("<"))
        const out = hasTags ? tr.rich(key, v) : tr(key, v)
        if (errors.length) throw new Error(`next-intl: ${errors[0].message}`)
        if (out === key) throw new Error("next-intl returned the fallback key")
      }
      checked++
    } catch (err) {
      fail(err.message)
    }
  }
  console.log(`${lang}: ${n} keys`)
}
console.log(`${checked} messages OK, ${failures} failures`)
process.exit(failures ? 1 : 0)
