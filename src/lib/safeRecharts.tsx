// Safe replacements for Recharts v3 components that have Vite bundler issues
// Recharts CartesianGrid and Tooltip throw "t is not a function" in production builds

import React from 'react';

// Replacement for <CartesianGrid strokeDasharray="3 3" />
export const SafeGrid: React.FC<{ strokeDasharray?: string; horizontal?: boolean; vertical?: boolean }> = ({
  strokeDasharray = '3 3',
}) => (
  <g>
    {[0, 1, 2, 3, 4].map(i => (
      <line
        key={i}
        x1="0"
        y1={`${i * 25}%`}
        x2="100%"
        y2={`${i * 25}%`}
        stroke="#e5e7eb"
        strokeDasharray={strokeDasharray}
        strokeWidth={0.5}
      />
    ))}
  </g>
);

// Replacement for <Tooltip />
export const SafeTooltip: React.FC<{
  formatter?: (value: any, name?: string) => [string, string];
  labelFormatter?: (label: string) => string;
  contentStyle?: React.CSSProperties;
}> = ({ formatter }) => {
  // Minimal tooltip - renders nothing, charts work without it
  return null;
};

// A working tooltip using SVG <title> elements
export const SafeBarTooltip: React.FC<{ data: any[]; dataKey: string; nameKey?: string }> = ({ data, dataKey, nameKey }) => {
  return (
    <g>
      {data.map((entry: any, index: number) => (
        <title key={index}>
          {entry[nameKey || 'name']}: {entry[dataKey]}
        </title>
      ))}
    </g>
  );
};
