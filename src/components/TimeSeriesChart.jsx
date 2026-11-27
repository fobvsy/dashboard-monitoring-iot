import React, { useState } from 'react';
import { Pause, Play } from 'lucide-react';

const WIDTH = 640;
const HEIGHT = 180;
const PADDING = { top: 12, right: 12, bottom: 26, left: 40 };
const INNER_W = WIDTH - PADDING.left - PADDING.right;
const INNER_H = HEIGHT - PADDING.top - PADDING.bottom;
const TICKS = [100, 75, 50, 25, 0];

export default function TimeSeriesChart({
  dataHistory = [],
  gauge1Name = 'Sensor 1',
  gauge1Unit = '',
  gauge1Min = 0,
  gauge1Max = 100,
  gauge2Name = 'Sensor 2',
  gauge2Unit = '',
  gauge2Min = 0,
  gauge2Max = 100,
  isPaused,
  setIsPaused
}) {
  const [dataPointsLimit, setDataPointsLimit] = useState(30);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const visibleData = dataHistory.slice(-dataPointsLimit);

  // Both channels are plotted as a percentage of their own range so a shared
  // axis stays honest when the units differ.
  const normalize = (val, min, max) => {
    if (typeof val !== 'number' || max <= min) return 0;
    return Math.min(Math.max(((val - min) / (max - min)) * 100, 0), 100);
  };

  const getX = (index) => {
    if (visibleData.length <= 1) return PADDING.left;
    return PADDING.left + (index / (visibleData.length - 1)) * INNER_W;
  };

  const getY = (pct) => PADDING.top + INNER_H - (pct / 100) * INNER_H;

  const pointsG1 = visibleData
    .map((d, i) => `${getX(i)},${getY(normalize(d.g1, gauge1Min, gauge1Max))}`)
    .join(' ');

  const pointsG2 = visibleData
    .map((d, i) => `${getX(i)},${getY(normalize(d.g2, gauge2Min, gauge2Max))}`)
    .join(' ');

  const areaG1 = visibleData.length > 0
    ? `M ${getX(0)},${PADDING.top + INNER_H} L ${pointsG1.replace(/ /g, ' L ')} L ${getX(visibleData.length - 1)},${PADDING.top + INNER_H} Z`
    : '';

  const hoverX = hoveredPoint ? getX(hoveredPoint.index) : 0;
  const tooltipWidth = 150;
  const tooltipX = hoveredPoint
    ? Math.min(Math.max(hoverX - tooltipWidth / 2, PADDING.left), WIDTH - PADDING.right - tooltipWidth)
    : 0;

  return (
    <section className="panel" aria-labelledby="chart-title">
      <div className="panel-head">
        <div className="min-w-0">
          <h2 id="chart-title" className="panel-title">Tren telemetri</h2>
          <p className="panel-meta mt-0.5">
            % dari rentang kanal · {visibleData.length} sampel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-0.5 w-4 rounded bg-cyber-cyan" />
              {gauge1Name}{gauge1Unit ? ` (${gauge1Unit})` : ''}
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-0.5 w-4 rounded bg-cyber-green" />
              {gauge2Name}{gauge2Unit ? ` (${gauge2Unit})` : ''}
            </span>
          </div>

          <select
            value={dataPointsLimit}
            onChange={(e) => setDataPointsLimit(Number(e.target.value))}
            aria-label="Jumlah sampel yang ditampilkan"
            className="min-h-[44px] sm:min-h-[34px] bg-industrial-950/60 border border-industrial-700 text-slate-300 font-mono text-[11px] rounded-md px-2 focus:border-cyber-cyan"
          >
            <option value={20}>20 sampel</option>
            <option value={30}>30 sampel</option>
            <option value={50}>50 sampel</option>
            <option value={100}>100 sampel</option>
          </select>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            aria-pressed={isPaused}
            aria-label={isPaused ? 'Lanjutkan stream grafik' : 'Jeda stream grafik'}
            title={isPaused ? 'Lanjutkan stream grafik' : 'Jeda stream grafik'}
            className={`icon-btn h-[34px] w-[34px] ${
              isPaused ? 'border-cyber-amber/40 bg-cyber-amber/10 text-cyber-amber' : ''
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isPaused && (
        <p className="px-4 pt-2 text-[11px] font-mono text-cyber-amber">
          Stream dijeda. Data baru tidak direkam sampai dilanjutkan.
        </p>
      )}

      <div className="p-3">
        {visibleData.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center gap-1 text-center px-4">
            <p className="text-xs text-slate-300">Belum ada sampel telemetri.</p>
            <p className="text-[11px] text-slate-400 font-mono">
              Grafik terisi otomatis setelah data pertama masuk.
            </p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-44 sm:h-52 select-none"
            onPointerLeave={() => setHoveredPoint(null)}
            role="img"
            aria-label={`Grafik tren ${gauge1Name} dan ${gauge2Name}, ${visibleData.length} sampel terakhir`}
          >
            <defs>
              <linearGradient id="areaGradG1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--signal-cyan)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--signal-cyan)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y axis ticks */}
            {TICKS.map((pct) => {
              const y = getY(pct);
              return (
                <g key={pct}>
                  <line
                    x1={PADDING.left}
                    y1={y}
                    x2={WIDTH - PADDING.right}
                    y2={y}
                    stroke="var(--chart-grid)"
                    strokeWidth="1"
                  />
                  <text
                    x={PADDING.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill="var(--chart-axis)"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {pct}
                  </text>
                </g>
              );
            })}

            {areaG1 && <path d={areaG1} fill="url(#areaGradG1)" />}

            <polyline
              fill="none"
              stroke="var(--signal-green)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsG2}
            />

            <polyline
              fill="none"
              stroke="var(--signal-cyan)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsG1}
            />

            {/* Hover targets and markers */}
            {visibleData.map((d, i) => {
              const cx = getX(i);
              const isHovered = hoveredPoint?.index === i;

              return (
                <g key={i}>
                  <rect
                    x={cx - INNER_W / visibleData.length / 2}
                    y={PADDING.top}
                    width={Math.max(INNER_W / visibleData.length, 4)}
                    height={INNER_H}
                    fill="transparent"
                    className="cursor-pointer"
                    onPointerEnter={() => setHoveredPoint({ ...d, index: i })}
                    onPointerDown={() =>
                      setHoveredPoint((prev) => (prev?.index === i ? null : { ...d, index: i }))
                    }
                  />
                  {isHovered && (
                    <>
                      <circle
                        cx={cx}
                        cy={getY(normalize(d.g1, gauge1Min, gauge1Max))}
                        r="4"
                        fill="var(--signal-cyan)"
                        stroke="var(--chart-surface)"
                        strokeWidth="1.5"
                        className="pointer-events-none"
                      />
                      <circle
                        cx={cx}
                        cy={getY(normalize(d.g2, gauge2Min, gauge2Max))}
                        r="4"
                        fill="var(--signal-green)"
                        stroke="var(--chart-surface)"
                        strokeWidth="1.5"
                        className="pointer-events-none"
                      />
                    </>
                  )}
                </g>
              );
            })}

            {hoveredPoint && (
              <g pointerEvents="none">
                <line
                  x1={hoverX}
                  y1={PADDING.top}
                  x2={hoverX}
                  y2={PADDING.top + INNER_H}
                  stroke="var(--chart-crosshair)"
                  strokeWidth="1"
                />
                <rect
                  x={tooltipX}
                  y={PADDING.top - 4}
                  width={tooltipWidth}
                  height="44"
                  rx="4"
                  fill="var(--chart-surface)"
                  stroke="var(--chart-border)"
                  strokeWidth="1"
                />
                <text x={tooltipX + 8} y={PADDING.top + 11} fill="var(--chart-axis)" fontSize="9" fontFamily="monospace">
                  {hoveredPoint.timestamp}
                </text>
                <text x={tooltipX + 8} y={PADDING.top + 25} fill="var(--signal-cyan)" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {hoveredPoint.g1?.toFixed(1)} {gauge1Unit}
                </text>
                <text x={tooltipX + 80} y={PADDING.top + 25} fill="var(--signal-green)" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {hoveredPoint.g2?.toFixed(1)} {gauge2Unit}
                </text>
              </g>
            )}

            <text x={PADDING.left} y={HEIGHT - 6} fill="var(--chart-axis)" fontSize="9" fontFamily="monospace">
              {visibleData[0].timestamp}
            </text>
            <text
              x={WIDTH - PADDING.right}
              y={HEIGHT - 6}
              textAnchor="end"
              fill="var(--chart-axis)"
              fontSize="9"
              fontFamily="monospace"
            >
              {visibleData[visibleData.length - 1].timestamp}
            </text>
          </svg>
        )}
      </div>
    </section>
  );
}
