"use client"
import React, { useEffect, useMemo, useState } from "react"
import { Copy, Plus, Trash2, ExternalLink } from "lucide-react"

// Types
type BlendMode = "absolute" | "blend"

type SpotlightItem = {
  id: number
  source: "color" | "tailwind" | "css"
  fill: string
  fillOpacity: number
  blurIntensity: number
  width: number
  height: number
  x: number
  y: number
  rotation: number
  opacity: number
  gradientClass?: string
  cssText?: string
  flipX?: boolean
}

type BackgroundConfig = {
  type: "gradient" | "solid" | "dark" | "light" | "transparent" | "customTailwind" | "customCss"
  color?: string
  tailwindClass?: string
  cssText?: string
}

// UI helpers
const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, className, ...props }) => (
  <label className={`block text-xs font-semibold text-slate-700 mb-1 ${className || ""}`} {...props}>
    {children}
  </label>
)

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 text-[11px] font-medium bg-white">
    {children}
  </span>
)

const FieldRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2">{children}</div>
)

const Slider: React.FC<{
  id?: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  format?: (n: number) => string
  onChange: (v: number) => void
}> = ({ id, label, value, min, max, step, suffix = "", format, onChange }) => {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const nudge = (d: number) => onChange(clamp(Number((value + d).toFixed(3))))
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <FieldRow>
        <button
          type="button"
          className="px-2 py-1 rounded border text-slate-700 hover:bg-slate-50"
          onClick={() => nudge(-(step || 1))}
          aria-label={`decrease ${label}`}
        >
          −
        </button>
        <input
          id={id}
          className="flex-1"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number.parseFloat(e.target.value)))}
        />
        <button
          type="button"
          className="px-2 py-1 rounded border text-slate-700 hover:bg-slate-50"
          onClick={() => nudge(step || 1)}
          aria-label={`increase ${label}`}
        >
          +
        </button>
        <input
          type="number"
          className="w-20 px-2 py-1 border rounded text-sm"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const n = Number.parseFloat(e.target.value)
            if (!Number.isNaN(n)) onChange(clamp(n))
          }}
        />
      </FieldRow>
      <div className="mt-1">
        <span className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-semibold">
          {format ? format(value) : `${value}${suffix}`}
        </span>
      </div>
    </div>
  )
}

// Reusable SVG spotlight
const Spotlight: React.FC<{
  className?: string
  fill: string
  filterId: string
  fillOpacity: number
  blurIntensity: number
  style?: React.CSSProperties
}> = ({ className, fill, filterId, fillOpacity, blurIntensity, style }) => {
  return (
    <svg
      className={`pointer-events-none absolute ${className || ""}`}
      style={{ ...style, position: "absolute" }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
      aria-hidden
    >
      <g filter={`url(#${filterId})`}>
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity={fillOpacity}
        />
      </g>
      <defs>
        <filter
          id={filterId}
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation={blurIntensity} result="effect1_foregroundBlur_1065_8" />
        </filter>
      </defs>
    </svg>
  )
}

const backgroundPresets: { label: string; value: BackgroundConfig }[] = [
  {
    label: "Emerald Glow",
    value: {
      type: "gradient",
      color: "#10b981",
      tailwindClass: "bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600",
    },
  },
  { label: "Dark", value: { type: "dark" } },
  { label: "Light", value: { type: "light" } },
  { label: "Transparent", value: { type: "transparent" } },
]

function parseInlineCss(text?: string): React.CSSProperties {
  const style: React.CSSProperties = {}
  const input = text || ""
  input.split(";").forEach((raw) => {
    const [k, ...rest] = raw.split(":")
    if (!k || !rest.length) return
    const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    const val = rest.join(":").replace(/!important/gi, "").trim()
    if (!key || !val) return
    ;(style as any)[key] = val
  })
  return style
}

// App
export default function App() {
  const [spotlights, setSpotlights] = useState<SpotlightItem[]>([
    {
      id: 1,
      source: "color",
      fill: "#ffffff",
      fillOpacity: 0.4,
      blurIntensity: 120,
      width: 600,
      height: 600,
      x: 10,
      y: 10,
      rotation: 0,
      opacity: 0.8,
      gradientClass: "bg-gradient-to-br from-white/70 to-white/0",
  cssText: "",
  flipX: false,
    },
    {
      id: 2,
      source: "color",
      fill: "#ffffff",
      fillOpacity: 0.3,
      blurIntensity: 140,
      width: 500,
      height: 500,
      x: 75,
      y: 20,
      rotation: 45,
      opacity: 0.6,
      gradientClass: "bg-gradient-to-br from-white/60 to-white/0",
  cssText: "",
  flipX: false,
    },
  ])

  const [background, setBackground] = useState<BackgroundConfig>({
    type: "gradient",
    color: "#10b981",
    tailwindClass: "bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600",
  })

  const [blendMode, setBlendMode] = useState<BlendMode>("absolute")
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)

  // Close small menus on outside click or ESC
  useEffect(() => {
    if (menuOpenId == null) return
    const onDocClick = () => setMenuOpenId(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpenId(null) }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpenId])

  const updateSpotlight = (id: number, key: keyof SpotlightItem, value: any) => {
    setSpotlights((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)))
  }

  const addSpotlight = () => {
    const newId = (spotlights.length ? Math.max(...spotlights.map((s) => s.id)) : 0) + 1
    setSpotlights([
      ...spotlights,
      {
        id: newId,
        source: "color",
        fill: "#ffffff",
        fillOpacity: 0.3,
        blurIntensity: 151,
        width: 400,
        height: 400,
        x: 50,
        y: 50,
        rotation: 0,
        opacity: 0.7,
        gradientClass: "bg-gradient-to-br from-white/70 to-white/0",
  cssText: "",
  flipX: false,
      },
    ])
  }

  const duplicateSpotlight = (id: number) => {
    const spotlight = spotlights.find((s) => s.id === id)
    if (spotlight) {
      const newId = Math.max(...spotlights.map((s) => s.id)) + 1
      setSpotlights([...spotlights, { ...spotlight, id: newId, x: spotlight.x + 10, y: spotlight.y + 10 }])
    }
  }

  const mirrorDuplicateSpotlight = (id: number) => {
    const s = spotlights.find((sp) => sp.id === id)
    if (!s) return
    const newId = Math.max(...spotlights.map((sp) => sp.id)) + 1
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
    const mirroredX = clamp(100 - s.x, -20, 120)
    // Mirror across vertical axis by flipping on X (scaleX(-1)) and toggling flipX flag.
    const mirrored = { ...s, id: newId, x: mirroredX, flipX: !s.flipX }
    setSpotlights([...spotlights, mirrored])
  }

  const removeSpotlight = (id: number) => {
    if (spotlights.length > 1) setSpotlights(spotlights.filter((s) => s.id !== id))
  }

  const previewBgStyle = useMemo<React.CSSProperties>(() => {
    switch (background.type) {
      case "gradient":
        return { background: "linear-gradient(135deg, #34d399, #10b981, #059669)" }
      case "solid":
        return { backgroundColor: background.color }
      case "dark":
        return { backgroundColor: "#111827" }
      case "light":
        return { backgroundColor: "#f8fafc" }
      case "transparent":
        return { backgroundColor: "transparent" }
      case "customTailwind":
        return {}
      case "customCss": {
        const style = parseInlineCss(background.cssText)
        delete (style as any).minHeight
        return style
      }
      default:
        return { backgroundColor: "#f8fafc" }
    }
  }, [background])

  const generatedCode = useMemo(() => {
    const lines: string[] = []
    lines.push('// SVG Spotlight Component')
    lines.push('// Copy and paste this component into your React project')
    lines.push('')
    lines.push("import React from 'react'")
    lines.push('')
    lines.push('type SpotlightProps = {')
    lines.push('  className?: string')
    lines.push('  fill: string')
    lines.push('  filterId: string')
    lines.push('  fillOpacity: number')
    lines.push('  blurIntensity: number')
    lines.push('  style?: React.CSSProperties')
    lines.push('}')
    lines.push('')
    lines.push('export const Spotlight: React.FC<SpotlightProps> = ({ className, fill, filterId, fillOpacity, blurIntensity, style }) => (')
    lines.push('  <svg className={"pointer-events-none absolute " + (className || "")} style={{ ...style, position: "absolute" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3787 2842" fill="none" aria-hidden>')
    lines.push('    <g filter={"url(#" + filterId + ")"}>')
    lines.push('      <ellipse cx="1924.71" cy="273.501" rx="1924.71" ry="273.501" transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)" fill={fill} fillOpacity={fillOpacity} />')
    lines.push('    </g>')
    lines.push('    <defs>')
    lines.push('      <filter id={filterId} x="0.860352" y="0.838989" width="3785.16" height="2840.26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">')
    lines.push('        <feFlood floodOpacity="0" result="BackgroundImageFix" />')
    lines.push('        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />')
    lines.push('        <feGaussianBlur stdDeviation={blurIntensity} result="effect1_foregroundBlur_1065_8" />')
    lines.push('      </filter>')
    lines.push('    </defs>')
    lines.push('  </svg>')
    lines.push(')')
    lines.push('')
    lines.push('/*')
    lines.push('Quick start:')
    lines.push("1) Copy the component above into your project (e.g. Spotlight.tsx).")
    lines.push("2) Place it inside a container with position: relative.")
    lines.push("3) Give each light a unique filterId (e.g. 'spot-1', 'spot-2').")
    lines.push('4) Control size and position with the style prop (width/height/left/top/transform).')
    lines.push('')
    lines.push('Tips:')
    lines.push('• Start with blurIntensity 120..220 for a soft glow.')
    lines.push('• Use fillOpacity 0.2..0.6 for gentle light.')
    lines.push('• Keep filterId unique per Spotlight.')
    lines.push('*/')
    return lines.join('\n')
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(59,130,246,0.08),transparent),radial-gradient(1200px_600px_at_90%_10%,rgba(16,185,129,0.08),transparent)]">
      <header className="sticky top-0 z-40">
        <div className="relative border-b border-slate-200/60 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative">
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-sky-500/25 via-emerald-500/25 to-cyan-500/25 blur-lg -z-10" />
                <div className="size-9 md:size-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white grid place-items-center font-semibold shadow-lg ring-1 ring-white/60">
                  S
                </div>
              </div>
              <div>
                <h1 className="text-base md:text-lg font-semibold md:font-bold text-slate-900 tracking-tight">SVG Spotlight Generator</h1>
                <p className="text-[11px] md:text-xs text-slate-600 -mt-0.5">Design lush, blendable lighting backgrounds</p>
              </div>
            </div>
            <a
              href="https://lucide.dev/icons/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/70 text-slate-600 text-xs hover:bg-white hover:border-slate-300 transition-colors shadow-sm"
            >
              <span className="hidden sm:inline">Icons:</span>
              <span>Lucide</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <aside className="lg:col-span-1">
          <div className="bg-white shadow-ring rounded-2xl overflow-hidden max-h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b bg-slate-50/70 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-800">Controls</h2>
                <Badge>{spotlights.length} lights</Badge>
              </div>
              <button
                onClick={addSpotlight}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Scrollable content */}
            <div className="p-4 space-y-6 overflow-y-auto">
              {/* Background */}
              <section aria-labelledby="background-settings" className="border rounded-xl p-4">
                <h3 id="background-settings" className="text-sm font-semibold text-slate-700 mb-3 tracking-wide">
                  Background
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label>Mode</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                      value={background.type}
                      onChange={(e) => setBackground({ ...background, type: e.target.value as BackgroundConfig["type"] })}
                    >
                      <option value="gradient">Preset Gradient</option>
                      <option value="customTailwind">Custom Tailwind Gradient</option>
                      <option value="customCss">Custom CSS (inline)</option>
                      <option value="solid">Solid Color</option>
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="transparent">Transparent</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {backgroundPresets.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setBackground(p.value)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs ${
                          background.type === p.value.type
                            ? "border-slate-900 text-slate-900"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {background.type === "solid" && (
                    <div>
                      <Label>Color</Label>
                      <input
                        type="color"
                        value={background.color || "#ffffff"}
                        onChange={(e) => setBackground({ ...background, color: e.target.value })}
                        className="h-10 w-full rounded border cursor-pointer"
                        aria-label="Background color"
                      />
                    </div>
                  )}

                  {background.type === "customTailwind" && (
                    <div>
                      <Label>Tailwind Classes</Label>
                      <input
                        type="text"
                        value={background.tailwindClass || ""}
                        onChange={(e) => setBackground({ ...background, tailwindClass: e.target.value })}
                        placeholder="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500"
                        className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                      />
                    </div>
                  )}

                  {background.type === "customCss" && (
                    <div>
                      <Label>Custom CSS</Label>
                      <textarea
                        value={background.cssText || ""}
                        onChange={(e) => setBackground({ ...background, cssText: e.target.value })}
                        placeholder={
                          "background: radial-gradient(...), radial-gradient(...), #f8fafc;\nbackground-attachment: fixed;\nbackground-repeat: no-repeat;\nbackground-size: cover;"
                        }
                        className="w-full px-3 py-2 border rounded-lg font-mono text-xs min-h-28"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Spotlights */}
              <section aria-labelledby="spotlights" className="space-y-3">
                <h3 id="spotlights" className="text-sm font-semibold text-slate-700 tracking-wide">
                  Spotlights
                </h3>

                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                  {spotlights.map((s, idx) => (
                    <details key={s.id} className="group border rounded-xl overflow-hidden bg-white open:shadow-sm">
                      <summary className="list-none cursor-pointer select-none px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-medium text-sm text-slate-800 truncate">Spotlight {idx + 1}</span>
                          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                            <Badge>
                              {s.width}×{s.height}px
                            </Badge>
                            <Badge>{Math.round(s.opacity * 100)}%</Badge>
                          </div>
                        </div>
                        <div className="relative flex items-center gap-1 flex-shrink-0">
                          {/* Duplicate split menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setMenuOpenId(menuOpenId === s.id ? null : s.id)
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                              aria-haspopup="menu"
                              aria-expanded={menuOpenId === s.id}
                              aria-label={`Duplicate options for Spotlight ${idx + 1}`}
                              title="Duplicate options"
                            >
                              <Copy size={14} />
                            </button>
                            {menuOpenId === s.id && (
                              <div
                                role="menu"
                                className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                              >
                                <button
                                  role="menuitem"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                                  onClick={() => { duplicateSpotlight(s.id); setMenuOpenId(null) }}
                                >
                                  Duplicate here
                                </button>
                                <button
                                  role="menuitem"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                                  onClick={() => { mirrorDuplicateSpotlight(s.id); setMenuOpenId(null) }}
                                >
                                  Duplicate (mirror)
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              removeSpotlight(s.id)
                            }}
                            disabled={spotlights.length === 1}
                            className="inline-flex items-center justify-center w-8 h-8 text-red-600 disabled:opacity-40 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            aria-label={`Remove Spotlight ${idx + 1}`}
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </summary>

                      <div className="px-4 pb-4 pt-0 space-y-4 border-t">
                        {/* Source */}
                        <div>
                          <Label>Fill Source</Label>
                          <select
                            className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                            value={s.source}
                            onChange={(e) => updateSpotlight(s.id, "source", e.target.value as SpotlightItem["source"]) }
                          >
                            <option value="color">Solid Color (SVG)</option>
                            <option value="tailwind">Tailwind Gradient</option>
                            <option value="css">Custom CSS</option>
                          </select>
                        </div>

                        {/* Source-specific inputs */}
                        {s.source === "color" && (
                          <div className="space-y-3">
                            <div>
                              <Label>Color</Label>
                              <input
                                type="color"
                                value={s.fill}
                                onChange={(e) => updateSpotlight(s.id, "fill", e.target.value)}
                                className="w-full h-10 rounded border cursor-pointer"
                                aria-label="Spotlight color"
                              />
                            </div>
                            <Slider
                              label="Fill Opacity"
                              value={Number(s.fillOpacity.toFixed(2))}
                              min={0}
                              max={0.8}
                              step={0.05}
                              onChange={(v) => updateSpotlight(s.id, "fillOpacity", v)}
                              format={(n) => `${Math.round(n * 100)}%`}
                            />
                          </div>
                        )}

                        {s.source === "tailwind" && (
                          <div>
                            <Label>Tailwind Classes</Label>
                            <input
                              type="text"
                              value={s.gradientClass || ""}
                              onChange={(e) => updateSpotlight(s.id, "gradientClass", e.target.value)}
                              placeholder="bg-gradient-to-br from-white/80 to-transparent"
                              className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                            />
                          </div>
                        )}

                        {s.source === "css" && (
                          <div>
                            <Label>Custom CSS</Label>
                            <textarea
                              value={s.cssText || ""}
                              onChange={(e) => updateSpotlight(s.id, "cssText", e.target.value)}
                              placeholder="background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);"
                              className="w-full px-3 py-2 border rounded-lg font-mono text-xs min-h-20 resize-none"
                            />
                          </div>
                        )}

                        {/* Universal controls */}
                        <div className="grid grid-cols-1 gap-4">
                          <Slider
                            label="Opacity"
                            value={Number(s.opacity.toFixed(2))}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={(v) => updateSpotlight(s.id, "opacity", v)}
                            format={(n) => `${Math.round(n * 100)}%`}
                          />
                          <Slider
                            label="Blur"
                            value={s.blurIntensity}
                            min={50}
                            max={300}
                            step={1}
                            onChange={(v) => updateSpotlight(s.id, "blurIntensity", Math.round(v))}
                          />
                          <Slider
                            label="Width"
                            value={s.width}
                            min={200}
                            max={900}
                            step={10}
                            onChange={(v) => updateSpotlight(s.id, "width", Math.round(v))}
                            suffix="px"
                          />
                          <Slider
                            label="Height"
                            value={s.height}
                            min={200}
                            max={900}
                            step={10}
                            onChange={(v) => updateSpotlight(s.id, "height", Math.round(v))}
                            suffix="px"
                          />
                          <Slider
                            label="X Position"
                            value={s.x}
                            min={-20}
                            max={120}
                            step={1}
                            onChange={(v) => updateSpotlight(s.id, "x", Math.round(v))}
                            suffix="%"
                          />
                          <Slider
                            label="Y Position"
                            value={s.y}
                            min={-20}
                            max={120}
                            step={1}
                            onChange={(v) => updateSpotlight(s.id, "y", Math.round(v))}
                            suffix="%"
                          />
                          <Slider
                            label="Rotation"
                            value={s.rotation}
                            min={0}
                            max={360}
                            step={1}
                            onChange={(v) => updateSpotlight(s.id, "rotation", Math.round(v))}
                            suffix="°"
                          />
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </aside>

        {/* Preview + Code */}
        <section className="lg:col-span-3">
          <div className="bg-white shadow-ring rounded-2xl p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Live Preview</h2>
              <button
                onClick={() => navigator.clipboard.writeText(generatedCode)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-black focus-ring"
              >
                <Copy size={16} /> Copy Code
              </button>
            </div>

            <div
              className={`relative w-full h-[520px] rounded-xl overflow-hidden border-2 ${
                background.type === "transparent" ? "bg-checker" : ""
              } ${background.type === "customTailwind" ? background.tailwindClass || "" : ""}`}
              style={previewBgStyle}
            >
              {spotlights.map((s) => (
        s.source === "tailwind" ? (
                  <div
                    key={`g-${s.id}`}
                    className={`absolute pointer-events-none rounded-full ${s.gradientClass || ""}`}
                    style={{
                      width: `${s.width}px`,
                      height: `${s.height}px`,
                      left: `${s.x}%`,
                      top: `${s.y}%`,
          transform: `translate(-50%, -50%) ${s.flipX ? 'scaleX(-1) ' : ''}rotate(${s.rotation}deg)`,
                      opacity: s.opacity,
                      filter: `blur(${s.blurIntensity}px)`,
                      zIndex: 1,
                      ...(blendMode === "blend" ? { mixBlendMode: "screen" as any } : {}),
                    }}
                  />
                ) : s.source === "css" ? (
                  <div
                    key={`c-${s.id}`}
                    className={`absolute pointer-events-none rounded-full`}
                    style={{
                      width: `${s.width}px`,
                      height: `${s.height}px`,
                      left: `${s.x}%`,
                      top: `${s.y}%`,
          transform: `translate(-50%, -50%) ${s.flipX ? 'scaleX(-1) ' : ''}rotate(${s.rotation}deg)`,
                      opacity: s.opacity,
                      filter: `blur(${s.blurIntensity}px)`,
                      zIndex: 1,
                      ...(blendMode === "blend" ? { mixBlendMode: "screen" as any } : {}),
                      ...parseInlineCss(s.cssText),
                    }}
                  />
                ) : (
                  <Spotlight
                    key={s.id}
                    fill={s.fill}
                    filterId={`filter-${s.id}`}
                    fillOpacity={s.fillOpacity}
                    blurIntensity={s.blurIntensity}
                    style={{
                      width: `${s.width}px`,
                      height: `${s.height}px`,
                      left: `${s.x}%`,
                      top: `${s.y}%`,
          transform: `translate(-50%, -50%) ${s.flipX ? 'scaleX(-1) ' : ''}rotate(${s.rotation}deg)`,
                      opacity: s.opacity,
                      zIndex: 1,
                      ...(blendMode === "blend" ? { mixBlendMode: "screen" as any } : {}),
                    }}
                  />
                )
              ))}

              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.35)]">Your Content</h1>
                  <p className="text-lg text-white/90">Spotlight Background</p>
                </div>
              </div>
            </div>

            {/* Blend Mode Controls */}
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Render Mode</h3>
                <Badge>{blendMode === "absolute" ? "SVG absolute positioning" : "Screen blend mode"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBlendMode("absolute")}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    blendMode === "absolute" ? "border-slate-900 text-slate-900 bg-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                  aria-pressed={blendMode === "absolute"}
                >
                  Absolute
                </button>
                <button
                  type="button"
                  onClick={() => setBlendMode("blend")}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    blendMode === "blend" ? "border-slate-900 text-slate-900 bg-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                  aria-pressed={blendMode === "blend"}
                >
                  Blend
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {blendMode === "absolute"
                  ? "Colors render pure without background interference (recommended for SVG)"
                  : "Colors blend with background using a screen-like effect"}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-semibold text-slate-800 mb-2">Generated Code</h3>
              <pre className="bg-slate-900 text-emerald-300 p-4 rounded-lg overflow-x-auto text-xs max-h-64 overflow-y-auto">
                <code>{generatedCode}</code>
              </pre>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-slate-500 py-6">Built with React, Vite, and Tailwind</footer>
    </div>
  )
}
