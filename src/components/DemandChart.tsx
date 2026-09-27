import React, { useState } from 'react';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';
import { DEMAND_TREND_DATA } from '../data/mockData';

export const DemandChart: React.FC = () => {
  const [activeRange, setActiveRange] = useState<'7d' | '14d' | '30d'>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<typeof DEMAND_TREND_DATA[0] | null>(null);

  // SVG dimensions
  const width = 760;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };

  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Values calculation
  const maxVal = 2800;
  const minVal = 1000;

  const getX = (index: number) => {
    return padding.left + (index / (DEMAND_TREND_DATA.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const normalized = (clamped - minVal) / (maxVal - minVal);
    return padding.top + graphHeight - normalized * graphHeight;
  };

  // Build SVG path for Actual & Projected Demand
  const demandPoints = DEMAND_TREND_DATA.map((d, i) => `${getX(i)},${getY(d.actualDemand)}`);
  const demandPath = `M ${demandPoints.join(' L ')}`;

  // Area under demand curve
  const areaPath = `M ${getX(0)},${padding.top + graphHeight} L ${demandPoints.join(' L ')} L ${getX(DEMAND_TREND_DATA.length - 1)},${padding.top + graphHeight} Z`;

  // Baseline Demand path
  const baselinePoints = DEMAND_TREND_DATA.map((d, i) => `${getX(i)},${getY(d.baselineDemand)}`);
  const baselinePath = `M ${baselinePoints.join(' L ')}`;

  // Buffer floor line Y
  const bufferFloorY = getY(1200);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Facility-Wide Consumption & Predictive Demand Curve
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
              AI Forecast
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical inpatient draw rate vs. machine-predicted respiratory & acute care surge
          </p>
        </div>

        {/* Range selectors */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-lg">
          {(['7d', '14d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeRange === r
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === '7d' ? 'Recent 7D' : r === '14d' ? '14 Days' : '30-Day View'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[540px] select-none"
        >
          <defs>
            <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="alertGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[1200, 1600, 2000, 2400, 2800].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Safety Buffer Floor Area / Line */}
          <line
            x1={padding.left}
            y1={bufferFloorY}
            x2={width - padding.right}
            y2={bufferFloorY}
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={width - padding.right - 4}
            y={bufferFloorY - 6}
            textAnchor="end"
            className="text-[10px] fill-rose-500 font-semibold"
          >
            Emergency Buffer Floor (1,200 units/day)
          </text>

          {/* Fill under demand */}
          <path d={areaPath} fill="url(#demandGradient)" />

          {/* Baseline Demand Line */}
          <path
            d={baselinePath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Actual Demand Line */}
          <path
            d={demandPath}
            fill="none"
            stroke="url(#alertGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Projection delimiter vertical line */}
          {(() => {
            const todayIdx = 6;
            const xToday = getX(todayIdx);
            return (
              <g>
                <line
                  x1={xToday}
                  y1={padding.top}
                  x2={xToday}
                  y2={padding.top + graphHeight}
                  stroke="#0ea5e9"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <rect
                  x={xToday + 4}
                  y={padding.top + 4}
                  width="95"
                  height="18"
                  rx="4"
                  fill="#0ea5e9"
                  fillOpacity="0.1"
                />
                <text
                  x={xToday + 8}
                  y={padding.top + 16}
                  className="text-[10px] fill-cyan-700 font-bold"
                >
                  AI PROJECTION →
                </text>
              </g>
            );
          })()}

          {/* Data points */}
          {DEMAND_TREND_DATA.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.actualDemand);
            const isHovered = hoveredPoint?.day === d.day;
            return (
              <g
                key={d.day}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Transparent hit area */}
                <rect
                  x={cx - 15}
                  y={padding.top}
                  width="30"
                  height={graphHeight}
                  fill="transparent"
                />

                {/* X-axis label */}
                <text
                  x={cx}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[10px] font-medium transition-colors ${
                    isHovered
                      ? 'fill-cyan-700 font-bold'
                      : d.isProjected
                      ? 'fill-cyan-600 font-semibold'
                      : 'fill-slate-500'
                  }`}
                >
                  {d.day}
                </text>

                {/* Circle marker */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : d.isProjected ? 4.5 : 4}
                  className={`transition-all ${
                    d.isProjected
                      ? 'fill-rose-500 stroke-white stroke-2'
                      : 'fill-cyan-600 stroke-white stroke-2'
                  }`}
                />
              </g>
            );
          })}
        </svg>

        {/* Hovered point inspection card */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 z-10 pointer-events-none border border-slate-700">
            <div className="font-bold text-cyan-400 flex items-center justify-between gap-4">
              <span>{hoveredPoint.day}</span>
              {hoveredPoint.isProjected && (
                <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/30 text-rose-300 rounded border border-rose-500/40">
                  Forecast
                </span>
              )}
            </div>
            <div className="flex justify-between gap-4 text-slate-300">
              <span>Actual / Est. Draw:</span>
              <span className="font-mono font-bold text-white">
                {hoveredPoint.actualDemand} units
              </span>
            </div>
            <div className="flex justify-between gap-4 text-slate-400">
              <span>Normal Baseline:</span>
              <span className="font-mono">{hoveredPoint.baselineDemand} units</span>
            </div>
            <div className="text-[10px] text-amber-300 pt-1 border-t border-slate-800">
              Surge index: +{Math.round(((hoveredPoint.actualDemand - hoveredPoint.baselineDemand) / hoveredPoint.baselineDemand) * 100)}% above normal
            </div>
          </div>
        )}
      </div>

      {/* Legend & Key Takeaway */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-cyan-600" />
            <span className="text-slate-600 font-medium">Daily Draw Rate (Units)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
            <span className="text-slate-500">Historical Baseline (30-day Avg)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
            <span className="text-rose-600 font-medium">Critical Safety Margin</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
          <span className="text-[11px]">
            Trajectory: <strong className="text-rose-600">+48% week-over-week draw rate</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
