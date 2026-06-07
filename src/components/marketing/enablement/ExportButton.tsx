import { Download } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';

interface ExportButtonProps {
  data: Array<Record<string, any>>;
  filename?: string;
  columns?: Array<{ key: string; label: string }>;
}

export const ExportButton = ({ data, filename, columns }: ExportButtonProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    const cols = columns || (data.length > 0 ? Object.keys(data[0]).map(k => ({ key: k, label: k })) : []);
    const header = cols.map(c => c.label).join(',');
    const rows = data.map(row => cols.map(c => {
      const v = row[c.key];
      if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return `"${v.replace(/"/g, '""')}"`;
      return v ?? '';
    }).join(','));
    const csv = '﻿' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('success', '导出成功');
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleExport}>
      <Download className="w-3 h-3 mr-1" />导出 Excel
    </Button>
  );
};
