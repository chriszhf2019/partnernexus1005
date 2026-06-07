import { useState, useRef, useEffect } from 'react';
import { Mail } from 'lucide-react';

export interface TooltipData {
  name: string;
  company: string;
  hireDate?: string;
  passRate?: number;
  manager?: string;
  enrolledCount: number;
  completedCount: number;
  lastActivity?: string;
}

interface LearnerTooltipProps {
  data: TooltipData;
  children: React.ReactNode;
  onSendReminder?: () => void;
  onViewDetail?: () => void;
}

export const LearnerTooltip = ({ data, children, onSendReminder, onViewDetail }: LearnerTooltipProps) => {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showTip = () => {
    timeoutRef.current = setTimeout(() => setShow(true), 300);
  };
  const hideTip = () => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div className="relative inline-block" onMouseEnter={showTip} onMouseLeave={hideTip}>
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-3 w-56">
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-neutral-800 border-r border-b border-neutral-200 dark:border-neutral-700 rotate-45" />
            <p className="font-bold text-sm text-neutral-900 dark:text-white">{data.name}</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{data.company}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px] text-neutral-600 dark:text-neutral-300">
              {data.hireDate && <div>📅 {data.hireDate}</div>}
              {data.passRate !== undefined && <div>📊 通过率 {data.passRate}%</div>}
              {data.manager && <div>👤 {data.manager}</div>}
              <div>📚 {data.completedCount}/{data.enrolledCount} 门完成</div>
              {data.lastActivity && <div className="col-span-2">📈 {data.lastActivity}</div>}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={onViewDetail}
                className="flex-1 py-1.5 text-[11px] font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                查看详情
              </button>
              <button
                onClick={onSendReminder}
                className="py-1.5 px-2 text-[11px] border border-neutral-200 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700"
              >
                <Mail className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
