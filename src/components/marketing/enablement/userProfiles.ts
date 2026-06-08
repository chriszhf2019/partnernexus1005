// 用户档案数据 — 支撑 LearnerTooltip 悬浮详情
// 后续迁移到 user_profiles 表后，直接从 Supabase 查询替换此文件

export interface UserProfile {
  hireDate: string;
  passRate: number;
  manager: string;
  department: string;
  region: string;
}

const profiles: Record<string, UserProfile> = {
  '张伟': { hireDate: '2023-03', passRate: 85, manager: '王经理', department: '销售部', region: '华北' },
  '李明': { hireDate: '2022-07', passRate: 72, manager: '赵总监', department: '技术部', region: '东北' },
  '王芳': { hireDate: '2023-11', passRate: 68, manager: '陈经理', department: '市场部', region: '华东' },
  '赵强': { hireDate: '2021-05', passRate: 90, manager: '王经理', department: '技术部', region: '华北' },
  '陈晓东': { hireDate: '2023-01', passRate: 75, manager: '刘总监', department: '销售部', region: '华东' },
  '刘娜': { hireDate: '2024-02', passRate: 55, manager: '陈经理', department: '市场部', region: '华东' },
  '孙浩': { hireDate: '2022-09', passRate: 92, manager: '周总监', department: '技术部', region: '华南' },
  '周丽': { hireDate: '2021-12', passRate: 88, manager: '周总监', department: '技术部', region: '华南' },
  '刘磊': { hireDate: '2023-06', passRate: 62, manager: '刘总监', department: '销售部', region: '华东' },
  '张伟(备)': { hireDate: '2023-03', passRate: 85, manager: '王经理', department: '销售部', region: '华北' },
};

export function getUserProfile(name: string): UserProfile | undefined {
  return profiles[name];
}

export function getAllProfiles(): Record<string, UserProfile> {
  return profiles;
}
