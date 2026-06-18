import React from 'react';

/**
 * ForecastPanel — static/decorative right-column of the CanPredict login page.
 *
 * All data (bar heights, stat values) is hardcoded and decorative.
 * TODO: wire to /api/predictions/summary once backend supports it.
 */

const BARS = [
  { label: 'Rice',     height: 42,  high: false, delay: 0.05 },
  { label: 'Adobo',   height: 88,  high: true,  delay: 0.10 },
  { label: 'Lumpia',  height: 34,  high: false, delay: 0.15 },
  { label: 'Sinigang',height: 76,  high: true,  delay: 0.20 },
  { label: 'Pancit',  height: 50,  high: false, delay: 0.25 },
  { label: 'Tapsilog',height: 95,  high: true,  delay: 0.30 },
  { label: 'Halo-halo',height: 28, high: false, delay: 0.35 },
];

export default function ForecastPanel() {
  return (
    <div className="bg-panel flex flex-col justify-center h-full px-11 py-12 relative overflow-hidden">

      {/* ── Header ─────────────────────────────────────── */}
      <div>
        <h2 className="text-background font-bold text-[22px] leading-snug max-w-[320px] mb-1.5">
          Demand predictions, updated every week.
        </h2>
        <p className="text-[13.5px] leading-relaxed max-w-[300px]" style={{ color: '#A9AFC4' }}>
          Five trained models forecast which menu items will see high or low demand before the week starts.
        </p>
      </div>

      {/* ── Chart card ─────────────────────────────────── */}
      <div
        className="mt-8 rounded-[14px] px-5 pt-5 pb-4"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Card header */}
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-xs font-semibold tracking-tight" style={{ color: '#C5CADB' }}>
            Weekly demand by item
          </span>
          <span className="text-[11px]" style={{ color: '#767E99' }}>
            Jun 15 – Jun 21
          </span>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-[9px] h-[130px]">
          {BARS.map(({ label, height, high, delay }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-end h-full gap-2 flex-1"
            >
              <div
                className={`w-full rounded-t-[4px] rounded-b-[2px] ${high ? 'bg-warning' : 'bg-success'}`}
                style={{
                  height: `${height}%`,
                  transformOrigin: 'bottom',
                  animation: `grow 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s backwards`,
                }}
              />
              <span className="text-[10px] tracking-wide" style={{ color: '#767E99' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          className="flex gap-[18px] mt-4 pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: '#A9AFC4' }}>
            <span className="w-2 h-2 rounded-[2px] bg-success inline-block" />
            Low demand
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: '#A9AFC4' }}>
            <span className="w-2 h-2 rounded-[2px] bg-warning inline-block" />
            High demand
          </div>
        </div>
      </div>

      {/* ── Stat row ───────────────────────────────────── */}
      <dl className="mt-8 flex gap-7">
        <div>
          <dd className="text-background font-bold text-[26px] leading-none">88.4%</dd>
          <dt className="text-[11.5px] mt-1.5 tracking-tight" style={{ color: '#767E99' }}>
            Best model accuracy
          </dt>
        </div>
        <div>
          <dd className="text-background font-bold text-[26px] leading-none">18</dd>
          <dt className="text-[11.5px] mt-1.5 tracking-tight" style={{ color: '#767E99' }}>
            Menu items tracked
          </dt>
        </div>
      </dl>
    </div>
  );
}
