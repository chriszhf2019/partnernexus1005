interface RadarCompareProps {
  company: { tech: number; sales: number; marketing: number };
  platform: { tech: number; sales: number; marketing: number };
  companyName: string;
}

export const RadarCompare = ({ company, platform, companyName }: RadarCompareProps) => {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 38;
  const minR = 12;

  const toCoords = (v: number, angleDeg: number) => {
    const r = minR + (v / 100) * (maxR - minR);
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const axes = [
    { label: '技术', angle: -90, key: 'tech' as const, color: '#2563eb' },
    { label: '销售', angle: 18, key: 'sales' as const, color: '#059669' },
    { label: '市场', angle: 126, key: 'marketing' as const, color: '#7c3aed' },
  ];

  const companyPoints = axes.map(a => toCoords(company[a.key], a.angle)).map(p => `${p.x},${p.y}`).join(' ');
  const platformPoints = axes.map(a => toCoords(platform[a.key], a.angle)).map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="text-center">
      <p className="text-[11px] font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
        {companyName} vs 平台平均
      </p>
      <div className="flex justify-center gap-6">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grid */}
          {[0.4, 0.7, 1].map(scale => {
            const pts = axes.map(a => toCoords(scale * 100, a.angle)).map(p => `${p.x},${p.y}`).join(' ');
            return <polygon key={scale} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />;
          })}
          {/* Platform average (dashed) */}
          <polygon points={platformPoints} fill="rgba(148,163,184,0.1)" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* Company */}
          <polygon points={companyPoints} fill="rgba(37,99,235,0.2)" stroke="#2563eb" strokeWidth="2" />
          {/* Labels */}
          {axes.map(a => {
            const p = toCoords(Math.max(company[a.key], platform[a.key]) + 8, a.angle);
            return (
              <text key={a.key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill={a.color} fontSize="8" fontWeight="700">
                {a.label} {company[a.key]}
              </text>
            );
          })}
        </svg>
        {/* Legend + diffs */}
        <div className="flex flex-col justify-center gap-2 text-[10px]">
          <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-blue-600" />{companyName}</div>
          <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-neutral-400 border-t-2 border-dashed border-neutral-400" />平台平均</div>
          {axes.map(a => {
            const diff = company[a.key] - platform[a.key];
            return (
              <div key={a.key} className={diff >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                {a.label} {diff >= 0 ? '+' : ''}{diff}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
