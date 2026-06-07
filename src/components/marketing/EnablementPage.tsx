import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { ProgressBar } from '../ui/ProgressBar';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import {
  Award, Users, BookOpen, GraduationCap, Target, Zap, Clock, Trophy, Monitor, Handshake,
  Megaphone, Star, Play, Calendar, Gift, TrendingUp, AlertTriangle, ChevronRight, Search,
  Plus, Download, Share2, Radar, Lightbulb, ShoppingCart, Package, CheckCircle2, X,
  MessageSquare, Eye, BarChart3, UserCheck, Building2,
} from 'lucide-react';
import { AdminKpiCards } from './enablement/AdminKpiCards';
import { AdminCourseList } from './enablement/AdminCourseList';
import { CompanyView } from './enablement/CompanyView';
import { FeedbackAnalysis } from './enablement/FeedbackAnalysis';
import { CourseRanking } from './enablement/CourseRanking';

const FRAMEWORK: Record<string, { icon: any; color: string; bg: string; desc: string }> = {
  '技术认证': { icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50', desc: '产品技术能力与解决方案架构' },
  '销售赋能': { icon: Handshake, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: '销售技能与客户关系管理' },
  '市场营销': { icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50', desc: '品牌推广与市场活动执行' },
};
const ROLES = ['销售经理', '技术架构师', '市场专员', '新人入职'];
const ROLE_PATHS: Record<string, string[]> = {
  '销售经理': ['销售基础:客户沟通技巧', '大客户商务谈判实战'],
  '技术架构师': ['技术方案架构设计', '云原生架构深度实践', '金融行业解决方案认证'],
  '市场专员': ['市场活动策划与执行', '销售基础:客户沟通技巧'],
  '新人入职': ['销售基础:客户沟通技巧', '技术方案架构设计'],
};

export const EnablementPage = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'learner' | 'admin'>('learner');
  const [myRole, setMyRole] = useState('销售经理');
  const [myName, setMyName] = useState('张伟');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentType, setAssessmentType] = useState<'pre' | 'post'>('pre');
  const [assessmentQ, setAssessmentQ] = useState<Record<string, string>>({});
  const [assessmentResult, setAssessmentResult] = useState<{ score: number; level?: string } | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 4, content: '' });
  const [adminView, setAdminView] = useState<'course' | 'company'>('course');
  const [comparingCompany, setComparingCompany] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [progRes, enrRes, asRes, fbRes] = await Promise.all([
      supabase.from('certification_programs').select('*').order('category').order('level'),
      supabase.from('user_enrollments').select('*').order('last_activity', { ascending: false }),
      supabase.from('assessment_records').select('*').order('created_at', { ascending: false }),
      supabase.from('course_feedback').select('*').order('created_at', { ascending: false }),
    ]);
    if (progRes.data) setPrograms(progRes.data);
    if (enrRes.data) setEnrollments(enrRes.data);
    if (asRes.data) setAssessments(asRes.data);
    if (fbRes.data) setFeedback(fbRes.data);
    setLoading(false);
  };

  // My data (learner mode)
  const myEnrollments = useMemo(() => enrollments.filter(e => e.user_name === myName), [enrollments, myName]);
  const myPathPrograms = useMemo(() => {
    const pathNames = ROLE_PATHS[myRole] || [];
    return programs.filter(p => pathNames.includes(p.name));
  }, [programs, myRole]);
  const totalPoints = useMemo(() => myPathPrograms.reduce((s, p) => s + (p.points || 0), 0), [myPathPrograms]);
  const isActive = (status: string) => status === 'completed' || status === 'assessed';
  const earnedPoints = useMemo(() => {
    return myEnrollments.reduce((s, e) => {
      const prog = programs.find(p => p.name === e.program_name);
      return s + (isActive(e.status) ? (prog?.points || 0) : Math.round((prog?.points || 0) * (e.progress || 0) / 100));
    }, 0);
  }, [myEnrollments, programs]);
  const completedCount = myEnrollments.filter(e => isActive(e.status)).length;

  // Admin stats
  const adminStats = useMemo(() => ({
    total: enrollments.length,
    users: new Set(enrollments.map(e => e.user_name)).size,
    companies: new Set(enrollments.map(e => e.company)).size,
    completed: enrollments.filter(e => isActive(e.status)).length,
  }), [enrollments]);

  // Active rate & trends for admin KPI
  const adminKpiData = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const activeUsers = new Set(
      enrollments
        .filter(e => e.last_activity && new Date(e.last_activity) >= weekAgo)
        .map(e => e.user_name)
    );
    const totalUsers = new Set(enrollments.map(e => e.user_name)).size;
    const activeRate = totalUsers > 0 ? Math.round((activeUsers.size / totalUsers) * 100) : 0;
    const weeklyTrend = [3, 4, 5, activeUsers.size];
    const completed = enrollments.filter(e => isActive(e.status)).length;
    const completionRate = enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0;
    const completionTrend = [35, 42, 50, completionRate];
    const stagnantCount = enrollments.filter(
      e => e.progress < 50 && e.last_activity && new Date(e.last_activity) < weekAgo
    ).length;
    const lowScoreCount = feedback.filter(f => f.rating <= 2).length;
    return { activeRate, weeklyTrend, completionRate, completionTrend, stagnantCount, lowScoreCount };
  }, [enrollments, feedback]);

  // Company view data
  const companyData = useMemo(() => {
    const map = new Map<string, { users: Set<string>; enrollments: any[]; scores: number[] }>();
    enrollments.forEach((e: any) => {
      if (!map.has(e.company)) map.set(e.company, { users: new Set(), enrollments: [], scores: [] });
      const c = map.get(e.company)!;
      c.users.add(e.user_name);
      c.enrollments.push(e);
      if (e.score) c.scores.push(e.score);
    });
    const platformAvg = { tech: 50, sales: 55, marketing: 45 };
    const gradients = ['from-blue-600 to-blue-400', 'from-emerald-600 to-emerald-400', 'from-violet-600 to-violet-400', 'from-amber-600 to-amber-400', 'from-rose-600 to-rose-400'];
    const companies = Array.from(map.entries()).map(([name, data], i) => {
      const total = data.enrollments.length;
      const completed = data.enrollments.filter((e: any) => isActive(e.status)).length;
      const avgScore = data.scores.length > 0 ? Math.round(data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length) : 0;
      const completionRate = total > 0 ? completed / total : 0;
      const activity: 'high' | 'medium' | 'low' = completionRate >= 0.6 ? 'high' : completionRate >= 0.3 ? 'medium' : 'low';
      // Compute company-level scores from assessments
      const compAssessments = assessments.filter((a: any) => data.users.has(a.user_name) && a.type === 'post');
      const techScores = compAssessments.filter((a: any) => {
        const prog = programs.find((p: any) => p.name === a.program_name);
        return prog?.category === '技术认证';
      }).map((a: any) => a.score);
      const salesScores = compAssessments.filter((a: any) => {
        const prog = programs.find((p: any) => p.name === a.program_name);
        return prog?.category === '销售赋能';
      }).map((a: any) => a.score);
      const marketingScores = compAssessments.filter((a: any) => {
        const prog = programs.find((p: any) => p.name === a.program_name);
        return prog?.category === '市场营销';
      }).map((a: any) => a.score);
      return {
        name,
        firstChar: name[0],
        gradient: gradients[i % gradients.length],
        userCount: data.users.size,
        completedTotal: `${completed}/${total}门完成`,
        avgScore,
        activity,
        scores: {
          tech: techScores.length > 0 ? Math.round(techScores.reduce((a: number, b: number) => a + b, 0) / techScores.length) : Math.round(30 + Math.random() * 20),
          sales: salesScores.length > 0 ? Math.round(salesScores.reduce((a: number, b: number) => a + b, 0) / salesScores.length) : Math.round(30 + Math.random() * 20),
          marketing: marketingScores.length > 0 ? Math.round(marketingScores.reduce((a: number, b: number) => a + b, 0) / marketingScores.length) : Math.round(30 + Math.random() * 20),
        },
      };
    });
    return { companies, platformAvg };
  }, [enrollments, assessments, programs]);

  // Course stats for admin
  const courseStats = useMemo(() => {
    return programs.map(p => {
      const enrolls = enrollments.filter(e => e.program_name === p.name);
      const fbs = feedback.filter(f => f.program_name === p.name);
      return {
        ...p,
        enrollmentCount: enrolls.length,
        completedCount: enrolls.filter(e => isActive(e.status)).length,
        avgRating: fbs.length > 0 ? Math.round(fbs.reduce((s, f) => s + f.rating, 0) / fbs.length * 10) / 10 : 0,
        feedbackCount: fbs.length,
        recentLearners: enrolls.slice(0, 5),
      };
    });
  }, [programs, enrollments, feedback]);

  // Radar scores (based on my assessment results)
  const radarScores = useMemo(() => {
    const myAssessments = assessments.filter(a => a.user_name === myName && a.type === 'post');
    const tech = programs.filter(p => p.category === '技术认证');
    const sales = programs.filter(p => p.category === '销售赋能');
    const marketing = programs.filter(p => p.category === '市场营销');
    const avg = (arr: any[]) => {
      const scores = arr.map(p => {
        const a = myAssessments.find((r: any) => r.program_name === p.name);
        if (a) return a.score;
        // Fallback: use enrollment progress or score as estimate
        const enr = myEnrollments.find(e => e.program_name === p.name);
        if (enr?.score) return enr.score;
        if (enr?.progress) return enr.progress;
        return 0; // No data → 0, will show as empty on radar
      });
      return scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
    };
    return { tech: avg(tech), sales: avg(sales), marketing: avg(marketing) };
  }, [programs, assessments, myName, myEnrollments]);

  const startAssessment = (type: 'pre' | 'post', programName: string) => {
    setSelectedProgram(programName);
    setAssessmentType(type);
    setAssessmentQ({});
    setAssessmentResult(null);
    setShowAssessment(true);
  };

  const submitAssessment = async () => {
    const questions = ASSESSMENT_DB[selectedProgram || ''] || [{ q: '整体掌握程度', options: ['完全不会','基本了解','熟练掌握','可以给他人讲解'], answer: '熟练掌握' }];
    const correct = questions.filter((q: any) => assessmentQ[q.q] === q.answer).length;
    const score = Math.round((correct / Math.max(questions.length, 1)) * 100);
    const level = score >= 80 ? '专家级' : score >= 60 ? '中级' : '初级';

    await supabase.from('assessment_records').insert({
      user_name: myName, program_name: selectedProgram, type: assessmentType, score, level,
      answers: assessmentQ,
    });

    if (assessmentType === 'post') {
      const enr = myEnrollments.find(e => e.program_name === selectedProgram);
      if (enr) {
        await supabase.from('user_enrollments').update({ status: score >= 60 ? 'completed' : 'assessed', score, progress: Math.max(enr.progress || 0, score), last_activity: new Date().toISOString() }).eq('id', enr.id);
      }
    }

    setAssessmentResult({ score, level });
    loadAll();
  };

  const submitFeedback = async () => {
    if (!showFeedback || !feedbackForm.content) return;
    await supabase.from('course_feedback').insert({
      user_name: myName, company: '北京测试公司', program_name: showFeedback,
      rating: feedbackForm.rating, content: feedbackForm.content,
    });
    setShowFeedback(null);
    setFeedbackForm({ rating: 4, content: '' });
    loadAll();
  };

  const ASSESSMENT_DB: Record<string, any[]> = {
    '销售基础:客户沟通技巧': [
      { q: 'B2B销售中首次拜访最重要的目标？', options: ['介绍产品', '建立信任了解需求', '报价', '签合同'], answer: '建立信任了解需求' },
      { q: 'SPIN销售法中N代表？', options: ['Need-Payoff', 'Neutral', 'Negotiation', 'Network'], answer: 'Need-Payoff' },
    ],
    '技术方案架构设计': [
      { q: '微服务间通信最常用模式？', options: ['共享数据库', 'RESTful API', 'SOAP', '文件'], answer: 'RESTful API' },
      { q: 'CAP定理最多满足几个？', options: ['1', '2', '3', '0'], answer: '2' },
    ],
  };

  const tabs = mode === 'learner' ? [
    { id: 'dashboard', label: '我的学习' },
    { id: 'framework', label: '课程体系' },
    { id: 'store', label: '积分商城' },
  ] : [
    { id: 'admin', label: '管理总览' },
    { id: 'framework', label: '课程管理' },
    { id: 'feedbackTab', label: '学员反馈' },
  ];

  if (loading) return <div className="text-center py-16 text-neutral-400">加载中...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">赋能培训中心</h1><p className="text-sm text-neutral-500 mt-1">学-考-证一体化 · 随时评估 · 数据驱动优化</p></div>
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
            {[{ k: 'learner', l: '🎓 学习者' }, { k: 'admin', l: '📊 管理员' }].map(m => (
              <button key={m.k} onClick={() => { setMode(m.k as any); setActiveTab(m.k === 'admin' ? 'admin' : 'dashboard'); }} className={cn('px-3 py-1 text-xs font-medium rounded-md', mode === m.k ? 'bg-white shadow-sm' : 'text-neutral-500')}>{m.l}</button>
            ))}
          </div>
          {mode === 'learner' && (
            <>
              <select value={myName} onChange={e => setMyName(e.target.value)} className="h-8 px-2 rounded-lg border text-sm">
                {[...new Set(enrollments.map(e => e.user_name)), '张伟','李明','王芳'].map(n => <option key={n}>{n}</option>)}
              </select>
              <select value={myRole} onChange={e => setMyRole(e.target.value)} className="h-8 px-2 rounded-lg border text-sm">
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* KPI + Radar */}
      {mode === 'learner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 grid grid-cols-4 gap-3">
            {[
              { icon: BookOpen, label: '已学课程', value: `${myEnrollments.length}`, sub: `${completedCount}门完成`, color: 'text-blue-600 bg-blue-50' },
              { icon: Award, label: '获得积分', value: `${earnedPoints}`, sub: `/ ${totalPoints} 总分`, color: 'text-amber-600 bg-amber-50' },
              { icon: TrendingUp, label: '评估次数', value: `${assessments.filter(a => a.user_name === myName).length}`, sub: '次评估记录', color: 'text-emerald-600 bg-emerald-50' },
              { icon: Star, label: '能力解锁返利', value: '+1.5%', sub: completedCount >= 2 ? '额外返利已激活' : `再完成${Math.max(0,2-completedCount)}门解锁`, color: 'text-purple-600 bg-purple-50' },
            ].map((s, i) => (
              <Card key={i}><div className="p-3 flex items-center gap-3"><div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}><s.icon className="w-5 h-5" /></div><div><p className="text-xs text-neutral-500">{s.label}</p><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-neutral-400">{s.sub}</p></div></div></Card>
            ))}
          </div>
          <Card><div className="p-3 text-center"><h4 className="text-xs font-semibold text-neutral-500 mb-2">能力雷达</h4>
            <svg viewBox="0 0 120 120" className="w-full max-w-[120px] mx-auto">
              {[0.4, 0.7, 1].map(scale => <polygon key={scale} points={`60,${60-42*scale} ${60+36*scale},${60+21*scale} ${60+22*scale},${60+38*scale} ${60-22*scale},${60+38*scale} ${60-36*scale},${60+21*scale}`} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />)}
              <polygon points={[
                { v: radarScores.tech, a: -90 }, { v: radarScores.sales, a: 18 },
                { v: radarScores.marketing, a: 126 }, { v: radarScores.tech, a: -162 }, { v: radarScores.sales, a: -234 },
              ].map(d => { const r = (d.a * Math.PI) / 180; return `${60 + (12 + d.v / 100 * 38) * Math.cos(r)},${60 + (12 + d.v / 100 * 38) * Math.sin(r)}`; }).join(' ')} fill="rgba(37,99,235,0.15)" stroke="#2563eb" strokeWidth="1.5" />
              {[{ l: '技术', v: radarScores.tech, a: -90, c: '#2563eb' }, { l: '销售', v: radarScores.sales, a: 18, c: '#059669' }, { l: '市场', v: radarScores.marketing, a: 126, c: '#7c3aed' }].map(d => {
                const r = (d.a * Math.PI) / 180; const x = 60 + (12 + d.v / 100 * 38) * Math.cos(r); const y = 60 + (12 + d.v / 100 * 38) * Math.sin(r);
                return <g key={d.l}><circle cx={x} cy={y} r="3" fill={d.c} /><text x={60 + (12 + d.v / 100 * 38 + 10) * Math.cos(r)} y={60 + (12 + d.v / 100 * 38 + 10) * Math.sin(r)} textAnchor="middle" dominantBaseline="central" className="text-[9px]" fill={d.c}>{d.l} {d.v}%</text></g>;
              })}
            </svg></div>
          </Card>
        </div>
      ) : (
        <AdminKpiCards
          activeRate={adminKpiData.activeRate}
          activeTrend={adminKpiData.weeklyTrend}
          completionRate={adminKpiData.completionRate}
          completionTrend={adminKpiData.completionTrend}
          stagnantCount={adminKpiData.stagnantCount}
          lowScoreCount={adminKpiData.lowScoreCount}
          avgRating={feedback.length > 0 ? +(feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : 0}
          totalFeedback={feedback.length}
          lowFeedbackCount={feedback.filter(f => f.rating <= 2).length}
          onStagnantClick={() => {}}
          onFeedbackClick={() => setActiveTab('feedbackTab')}
        />
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Learner Dashboard */}
      {mode === 'learner' && activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="p-4 bg-brand/5 rounded-xl border border-brand/20">
            <p className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-brand" />{myName} · {myRole} 学习路径</p>
            <p className="text-xs text-neutral-500 mt-1">必修 {myPathPrograms.length} 门 · 已完成 {completedCount} 门 · 评估 {assessments.filter(a => a.user_name === myName).length} 次</p>
            <div className="mt-2 h-1.5 bg-neutral-200 rounded-full"><div className="h-full bg-brand rounded-full transition-all" style={{ width: `${myPathPrograms.length > 0 ? (completedCount / myPathPrograms.length * 100) : 0}%` }} /></div>
          </div>

          {/* My enrollments */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map(p => {
              const enr = myEnrollments.find(e => e.program_name === p.name);
              const prog = enr?.progress || 0;
              const isComplete = isActive(enr?.status || '');
              const myAssessments = assessments.filter(a => a.user_name === myName && a.program_name === p.name);
              const fw = FRAMEWORK[p.category] || FRAMEWORK['技术认证'];
              return (
                <Card key={p.id} hover className={cn(isComplete && 'border-emerald-200')}>
                  <CardContent>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${fw.bg} flex items-center justify-center`}><fw.icon className={`w-4 h-4 ${fw.color}`} /></div>
                        <div>
                          <div className="flex items-center gap-1.5"><p className="text-sm font-semibold">{p.name}</p>{p.is_required ? <Badge variant="danger" size="sm">必修</Badge> : <Badge variant="secondary" size="sm">选修</Badge>}</div>
                          <div className="flex items-center gap-2 mt-0.5"><Badge size="sm">{p.level}</Badge><span className="text-[10px] text-neutral-400">⭐{p.points}分</span></div>
                        </div>
                      </div>
                      {isComplete && <Award className="w-5 h-5 text-amber-500 fill-amber-500" />}
                    </div>
                    {/* Assessment history */}
                    {myAssessments.length > 0 && (
                      <div className="mb-2 space-y-0.5">
                        {myAssessments.slice(0, 3).map((a: any, i: number) => (
                          <div key={i} className="text-[10px] text-neutral-400 flex items-center gap-1"><Clock className="w-3 h-3" />{a.type === 'pre' ? '课前' : '课后'}评估: {a.score}分 ({a.level}) · {new Date(a.created_at).toLocaleDateString('zh-CN')}</div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1"><span>进度</span><span>{prog}%</span></div>
                    <ProgressBar value={prog} max={100} />
                    <div className="flex items-center gap-1 mt-3">
                      <Button variant="secondary" size="sm" onClick={() => startAssessment('pre', p.name)} title="随时评估您的当前水平">评估</Button>
                      <Button variant={isComplete ? 'secondary' : 'brand'} size="sm" className="flex-1">{isComplete ? <><Award className="w-3.5 h-3.5 mr-1" />已获证</> : <><Play className="w-3.5 h-3.5 mr-1" />继续学习</>}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowFeedback(p.name)} title="课程反馈"><MessageSquare className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Dashboard */}
      {mode === 'admin' && activeTab === 'admin' && (
        <div className="space-y-4">
          {/* View toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdminView('course')}
              className={cn('px-3 py-1.5 text-[12px] font-medium rounded-lg', adminView === 'course' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800')}
            >
              📚 按课程
            </button>
            <button
              onClick={() => setAdminView('company')}
              className={cn('px-3 py-1.5 text-[12px] font-medium rounded-lg', adminView === 'company' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800')}
            >
              🏢 按公司
            </button>
          </div>

          {adminView === 'course' ? (
            <AdminCourseList
              courses={courseStats.map(cs => ({
                id: cs.id,
                name: cs.name,
                isRequired: cs.is_required,
                enrollmentCount: cs.enrollmentCount,
                completedCount: cs.completedCount,
                avgRating: cs.avgRating,
                healthDot: (cs.enrollmentCount === 0 ? 'gray' : cs.completedCount / cs.enrollmentCount >= 0.6 ? 'green' : cs.completedCount / cs.enrollmentCount >= 0.3 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red' | 'gray',
                learners: cs.recentLearners.map((e: any) => {
                  const weekAgo = new Date(Date.now() - 7 * 86400000);
                  const isOverdue = e.progress < 50 && e.last_activity && new Date(e.last_activity) < weekAgo;
                  return {
                    name: e.user_name,
                    company: e.company,
                    status: (e.status === 'completed' ? 'completed' : isOverdue ? 'overdue' : 'learning') as 'completed' | 'learning' | 'overdue' | 'stagnant',
                    score: e.score || undefined,
                    progress: e.progress || 0,
                    lastActivity: e.last_activity ? new Date(e.last_activity).toLocaleDateString('zh-CN') : undefined,
                  };
                }),
              }))}
              onNudge={(id) => {
                const courseName = programs.find((p: any) => p.id === id)?.name || '';
                const count = enrollments.filter((e: any) => e.program_name === courseName && e.progress < 50).length;
                alert(`将向 ${count} 名学员发送学习提醒`);
              }}
              onInvite={() => alert('已向合作伙伴推送课程邀请')}
              onExport={() => {
                const exportData = enrollments.map((e: any) => ({
                  '学员姓名': e.user_name,
                  '所属公司': e.company,
                  '课程名称': e.program_name,
                  '学习进度': `${e.progress}%`,
                  '评估分数': e.score || '-',
                  '状态': e.status === 'completed' ? '已完成' : e.status === 'assessed' ? '已评估' : '学习中',
                  '最近活动': e.last_activity ? new Date(e.last_activity).toLocaleDateString('zh-CN') : '-',
                }));
                const cols = ['学员姓名','所属公司','课程名称','学习进度','评估分数','状态','最近活动'].map(k => ({ key: k, label: k }));
                const header = cols.map(c => c.label).join(',');
                const rows = exportData.map((row: any) => cols.map(c => `"${String(row[c.key] || '').replace(/"/g, '""')}"`).join(','));
                const csv = '﻿' + header + '\n' + rows.join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `培训进度报表_${new Date().toISOString().slice(0,10)}.csv`;
                a.click(); URL.revokeObjectURL(url);
              }}
            />
          ) : (
            <CompanyView
              companies={companyData.companies}
              platformAvg={companyData.platformAvg}
              comparingCompany={comparingCompany}
              onCompare={setComparingCompany}
              onCloseCompare={() => setComparingCompany(null)}
              onIntervene={(name) => alert(`已向 ${name} 发送激励通知`)}
            />
          )}
        </div>
      )}

      {/* Course Framework */}
      {activeTab === 'framework' && (
        <CourseRanking
          courses={programs.map((p: any) => {
            const cs = courseStats.find(c => c.id === p.id);
            return {
              id: p.id,
              name: p.name,
              completionRate: cs?.enrollmentCount ? Math.round((cs.completedCount / cs.enrollmentCount) * 100) : 0,
              avgRating: cs?.avgRating || 0,
              enrollmentCount: cs?.enrollmentCount || 0,
              duration: p.duration,
              isDead: cs?.enrollmentCount === 0 && cs?.completedCount === 0,
            };
          })}
          onRetire={(id) => {
            const p = programs.find((prog: any) => prog.id === id);
            if (confirm(`确定要下架课程 "${p?.name}" 吗？`)) {
              alert('课程已下架（演示）');
            }
          }}
        />
      )}

      {/* Feedback Tab (Admin) */}
      {mode === 'admin' && activeTab === 'feedbackTab' && (
        <FeedbackAnalysis feedback={feedback.map((fb: any) => ({
          id: fb.id,
          userName: fb.user_name,
          company: fb.company,
          programName: fb.program_name,
          rating: fb.rating,
          content: fb.content,
          createdAt: fb.created_at,
        }))} />
      )}

      {/* Store */}
      {activeTab === 'store' && (
        <div className="space-y-4">
          <p className="text-sm">可用积分: <span className="text-amber-600 font-bold">{earnedPoints}</span> ⭐</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ name: '免费易拉宝套装', cost: 50, icon: Gift }, { name: 'Demo机试用30天', cost: 100, icon: Monitor }, { name: '原厂专家现场支持', cost: 200, icon: Users }, { name: '营销物料大礼包', cost: 80, icon: Package }, { name: '优先商机分配权(月)', cost: 150, icon: Target }, { name: '年度峰会VIP席位', cost: 300, icon: Star }].map((item, i) => (
              <Card key={i} hover><CardContent><div className="text-center"><item.icon className="w-8 h-8 mx-auto mb-2 text-amber-500" /><p className="text-sm font-semibold">{item.name}</p><div className="flex items-center justify-center gap-1 mt-2"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /><span className="text-lg font-bold text-amber-600">{item.cost}</span></div><Button variant={earnedPoints >= item.cost ? 'brand' : 'secondary'} size="sm" className="w-full mt-2" disabled={earnedPoints < item.cost}><ShoppingCart className="w-3.5 h-3.5 mr-1" />{earnedPoints >= item.cost ? '立即兑换' : '积分不足'}</Button></div></CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {/* Assessment Modal */}
      <AnimatePresence>{showAssessment && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAssessment(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[550px] max-w-[90vw] max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex justify-between"><h3 className="font-semibold">{assessmentType === 'pre' ? '课前' : '课后'}评估: {selectedProgram}</h3><button onClick={() => setShowAssessment(false)}><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              {assessmentResult ? (
                <div className="text-center py-6">
                  <Award className="w-16 h-16 mx-auto mb-3 text-amber-500" />
                  <p className={cn('text-2xl font-bold', assessmentResult.score >= 60 ? 'text-emerald-600' : 'text-red-500')}>{assessmentResult.score}分 — {assessmentResult.level}</p>
                  <p className="text-sm text-neutral-500 mt-1">评估记录已保存，可在学习记录中查看历史</p>
                  <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setShowAssessment(false); setAssessmentResult(null); }}>关闭</Button>
                </div>
              ) : (
                <>
                  {(ASSESSMENT_DB[selectedProgram || ''] || [{ q: '您对这门课程的掌握程度？', options: ['完全不会','基本了解','熟练掌握','可以教别人'], answer: '熟练掌握' }]).map((q: any, i: number) => (
                    <div key={i}><p className="text-sm font-semibold mb-2">{i + 1}. {q.q}</p>
                      <div className="space-y-2">{q.options.map((opt: string) => (
                        <label key={opt} className={cn('flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:border-brand', assessmentQ[q.q] === opt ? 'border-brand bg-brand/5' : 'border-neutral-200')}>
                          <input type="radio" name={`aq${i}`} checked={assessmentQ[q.q] === opt} onChange={e => setAssessmentQ(p => ({ ...p, [q.q]: e.target.value }))} />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}</div>
                    </div>
                  ))}
                  <Button variant="brand" size="md" className="w-full" onClick={submitAssessment} disabled={Object.keys(assessmentQ).length < (ASSESSMENT_DB[selectedProgram || ''] || [{ q: '' }]).length}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />提交评估
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>)}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>{showFeedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowFeedback(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[450px]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex justify-between"><h3 className="font-semibold">课程反馈: {showFeedback}</h3><button onClick={() => setShowFeedback(null)}><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-1 justify-center">{[1,2,3,4,5].map(i => <button key={i} onClick={() => setFeedbackForm(f => ({ ...f, rating: i }))}><Star className={cn('w-6 h-6', i <= feedbackForm.rating ? 'text-amber-500 fill-amber-500' : 'text-neutral-300')} /></button>)}</div>
              <textarea className="w-full px-3 py-2 rounded-lg border text-sm" rows={3} value={feedbackForm.content} onChange={e => setFeedbackForm(f => ({ ...f, content: e.target.value }))} placeholder="分享您的学习体验和建议..." />
              <Button variant="brand" size="md" className="w-full" onClick={submitFeedback} disabled={!feedbackForm.content}><MessageSquare className="w-4 h-4 mr-2" />提交反馈</Button>
            </div>
          </motion.div>
        </motion.div>)}
      </AnimatePresence>
    </div>
  );
};
