# DESIGN DIRECTION: INDUSTRIAL SCADA & LAB CONTROL CENTER

## Identity & Tone
- **Personality:** Precision engineering, mission-critical industrial telemetry, high-reliability control room.
- **Mood:** Focused, cyber-physical, confident, dark-mode first, high information density with zero clutter.
- **Anti-Slop Directives:** 
  - No purple-hazed blobs or decorative gradient mesh. Ambient light is cyan/emerald only and lives behind the surfaces, never as content.
  - No fake AI-dashboard rounded cartoon cards.
  - Crisp hairline borders over translucent glass surfaces, on a deep slate/black base (`#0a0d12` to `#161c26`).
  - Colors are functional signals, not decoration:
    - **Emerald (`#10b981`)**: Online, Relay Active, Closed Circuit, Normal range.
    - **Cyan (`#06b6d4`)**: Telemetry stream, RX incoming data, Primary sensor readout.
    - **Amber (`#f59e0b`)**: Warning threshold, Standby/Demo mode, pending action.
    - **Rose (`#f43f5e`)**: Danger threshold, Relay Error, Offline.
    - **Indigo / Purple (`#818cf8`)**: System event, Configuration parameters.

## Typography
- Primary: **Plus Jakarta Sans** (Weights: 400, 500, 600, 700) - modern humanist geometric clarity.
- Monospace: **JetBrains Mono** (Weights: 500, 600, 700) - channel numbers (`CH-01`), pin addresses, sensor readouts, latency (`42ms`), timestamp logs.

## Layout & Hierarchy
- Header: Mission control status bar (connection state, last write latency, quick actions).
- Quick KPI Stats: Instant situational awareness.
- Main Workspace: 2-column asymmetric grid.
  - Left Column (60%): Relay Rack Controls (8 CH) + Analog Telemetry (2 Gauges, 2 Level Bars) + Real-Time Time-Series Chart.
  - Right Column (40%): Digital Sensor Matrix (8 CH) + Industrial Telemetry Terminal with CSV/JSON export.
- Modals: Non-intrusive drawers/dialogs with explicit close triggers, no forced lockouts.

## Dials
ENERGY 2 / RHYTHM 2 / MOTION 1
- **ENERGY 2:** confident and dense, not loud. The relay bank is the focal point; everything else defers.
- **RHYTHM 2:** dense relay grid, gauge cards, chart, terminal. Different compositions for different jobs, same spacing scale.
- **MOTION 1:** hover/focus states and value transitions only. No endless pulses; the connecting dot may pulse because it marks a real pending state.

## Usage Discipline
- **Color is state, never decoration.** Cyan = live telemetry, emerald = on/normal, amber = demo/warning, rose = error/offline, indigo = system/config events.
- **Glow:** ambient light sits behind the panels, never on them. No glow on cards, buttons, icons, or borders; one live status dot maximum.
- **Background:** `industrial-950` with fixed cyan/emerald ambient gradients; panels float on it as frosted glass. No grid or blueprint pattern.
- **Surface:** panels use `backdrop-blur-xl` at 42% (dark) / 55% (light) opacity, a hairline border and a 1px top highlight. Nested cards stay at 50% so the ambient light carries through. Text must stay at 4.5:1 or better over the brightest tint.
- **Radius scale:** panels `12px`, inner cards `8px`, controls `6px`, chips `4px`. Deliberate hierarchy, not everything pill-shaped.
- **Type:** panel titles are sentence case sans. Monospace only for channel keys, values, timestamps, and latency. No wide-tracked uppercase headings.
- **One primary action per screen** (Firebase config). Destructive actions are outlined in rose and require confirmation.
- **Every control works:** no hover-only actions; edit affordances stay visible, and touch targets reach 44px on coarse pointers.

## Themes
- **Dark (default):** the control room. Page `#0a0d12`, panels `#10151d`.
- **Light:** daylight / field use. Page `#eef2f7`, white panels, same hierarchy; signal colors are darkened to keep text at 4.5:1 or better (`#047857`, `#0e7490`, `#b45309`, `#be123c`, `#4338ca`).
- **One token set, two values.** Every surface and text color is a CSS variable (`--industrial-*`, `--slate-*`, `--cyber-*`); components keep the same Tailwind classes. Charts read `--chart-*` and `--signal-*` so SVG strokes follow the theme.
- **Light is not inverted dark.** Borders, elevation and text hierarchy stay the same; only the values change.
- The choice persists in `localStorage('scada-theme')` and is applied before first paint. The default stays dark: the product is a control room, not the OS preference.
- Glass tuning lives in three tokens: `--ambient` (ambient light strength), `--glass-panel` (panel opacity), `--scrim-alpha` (modal veil). Change them there, not per component.

