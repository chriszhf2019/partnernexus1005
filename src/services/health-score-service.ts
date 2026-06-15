import { fetchHealthData, filterDiagnosisByFocus, filterTasksByFocus } from '../lib/partnerHealthEngine';
import type { FocusMetric, VitalityData, DiagnosisAlert, ActionTask, HealthScores, RadarData } from '../lib/partnerHealthEngine';

interface CacheEntry { data: any; timestamp: number }
const TTL = 60000;
const cache = new Map<string, CacheEntry>();

function get<T>(key: string): T | null {
  const e = cache.get(key);
  return e && Date.now() - e.timestamp < TTL ? e.data : null;
}
function set(key: string, data: any) { cache.set(key, { data, timestamp: Date.now() }); }

let _allDiagnoses: DiagnosisAlert[] = [];
let _allTasks: ActionTask[] = [];

export const healthScoreService = {
  async loadAll() {
    const cached = get<Awaited<ReturnType<typeof fetchHealthData>>>('all');
    if (cached) {
      _allDiagnoses = cached.diagnoses;
      _allTasks = cached.tasks;
      return cached;
    }
    const data = await fetchHealthData();
    _allDiagnoses = data.diagnoses;
    _allTasks = data.tasks;
    set('all', data);
    return data;
  },

  async getVitality(): Promise<VitalityData> {
    const data = await this.loadAll();
    return data.vitality;
  },

  async getDiagnosis(focus: FocusMetric = 'OVERALL'): Promise<DiagnosisAlert[]> {
    await this.loadAll();
    return filterDiagnosisByFocus(_allDiagnoses, focus);
  },

  async getActions(focus: FocusMetric = 'OVERALL'): Promise<ActionTask[]> {
    await this.loadAll();
    return filterTasksByFocus(_allTasks, focus);
  },

  getPartnerScore(partnerId: string): HealthScores | null {
    const data = get<Awaited<ReturnType<typeof fetchHealthData>>>('all');
    return data?.partnerScores.get(partnerId) || null;
  },

  invalidateCache() { cache.clear(); _allDiagnoses = []; _allTasks = []; },
};
