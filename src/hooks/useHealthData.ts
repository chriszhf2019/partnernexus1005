import { useState, useEffect, useMemo, useCallback } from 'react';
import { healthScoreService } from '../services/health-score-service';
import type { FocusMetric, VitalityData, DiagnosisAlert, ActionTask, HealthScores } from '../lib/partnerHealthEngine';

interface HealthDataState {
  loading: boolean;
  error: string | null;
  vitality: VitalityData | null;
  diagnoses: DiagnosisAlert[];
  tasks: ActionTask[];
  focusMetric: FocusMetric;
}

export function useHealthData() {
  const [state, setState] = useState<HealthDataState>({
    loading: true, error: null, vitality: null,
    diagnoses: [], tasks: [], focusMetric: 'OVERALL',
  });

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { vitality, diagnoses, tasks } = await healthScoreService.loadAll();
      setState(prev => ({
        loading: false, error: null, vitality,
        diagnoses, tasks, focusMetric: prev.focusMetric,
      }));
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false, error: e.message }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setFocusMetric = useCallback((metric: FocusMetric) => {
    setState(prev => ({ ...prev, focusMetric: metric }));
  }, []);

  const refresh = useCallback(() => {
    healthScoreService.invalidateCache();
    load();
  }, [load]);

  // Filtered data based on current focus
  const filteredDiagnoses = useMemo(() => {
    const all = state.diagnoses;
    switch (state.focusMetric) {
      case 'OVERALL': return all.filter(d => d.level === 'danger' || d.level === 'warning');
      case 'COVERAGE': return all.filter(d => d.tags.some(t => t.includes('未覆盖') || t.includes('缺口')));
      case 'VITALITY': return all.filter(d => d.tags.includes('沉睡伙伴'));
      case 'CAPABILITY': return all.filter(d => d.tags.some(t => t.includes('能力')));
      default: return all;
    }
  }, [state.diagnoses, state.focusMetric]);

  const filteredTasks = useMemo(() => {
    switch (state.focusMetric) {
      case 'OVERALL': return state.tasks.filter(t => t.type === 'RECRUIT' || t.type === 'ACTIVATE');
      case 'COVERAGE': return state.tasks.filter(t => t.type === 'RECRUIT');
      case 'VITALITY': return state.tasks.filter(t => t.type === 'ACTIVATE');
      case 'CAPABILITY': return state.tasks.filter(t => t.type === 'TRAIN');
      default: return state.tasks;
    }
  }, [state.tasks, state.focusMetric]);

  return useMemo(() => ({
    loading: state.loading,
    error: state.error,
    vitality: state.vitality,
    diagnoses: filteredDiagnoses,
    tasks: filteredTasks,
    allDiagnoses: state.diagnoses,
    allTasks: state.tasks,
    focusMetric: state.focusMetric,
    setFocusMetric,
    refresh,
  }), [state, filteredDiagnoses, filteredTasks, setFocusMetric, refresh]);
}
