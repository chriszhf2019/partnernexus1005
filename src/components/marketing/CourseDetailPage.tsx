import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, BookOpen, Clock, Star, Users, Award,
  Target, Calendar, CheckCircle2, Play, TrendingUp, BarChart3,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PageLoader } from '../ui/PageLoader';
import { ProgressBar } from '../ui/ProgressBar';

const FRAMEWORK: Record<string, { icon: string; color: string; bg: string; desc: string }> = {
  '技术认证': { icon: '💻', color: 'text-blue-600', bg: 'bg-blue-50', desc: '产品技术能力与解决方案架构' },
  '销售赋能': { icon: '🤝', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: '销售技能与客户关系管理' },
  '市场营销': { icon: '📢', color: 'text-purple-600', bg: 'bg-purple-50', desc: '品牌推广与市场活动执行' },
};

const LEVEL_COLORS: Record<string, string> = {
  '初级': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  '中级': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  '高级': 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  '专家级': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
};

export const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStats, setEnrollmentStats] = useState<any>(null);
  const [recentLearners, setRecentLearners] = useState<any[]>([]);

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    Promise.all([
      supabase.from('certification_programs').select('*').eq('id', courseId).single(),
      supabase.from('user_enrollments').select('*').eq('program_name', courseId).order('last_activity', { ascending: false }).limit(10),
    ]).then(([{ data: cData }, { data: enrData }]) => {
      if (cData) {
        setCourse(cData);
        // Compute enrollment stats
        const allEnrollments = enrData || [];
        const completed = allEnrollments.filter((e: any) => e.status === 'completed' || e.status === 'assessed').length;
        const avgProgress = allEnrollments.length > 0
          ? Math.round(allEnrollments.reduce((s: number, e: any) => s + (e.progress || 0), 0) / allEnrollments.length)
          : 0;
        setEnrollmentStats({
          total: allEnrollments.length,
          completed,
          avgProgress,
          activeUsers: new Set(allEnrollments.map((e: any) => e.user_name)).size,
        });
        setRecentLearners(allEnrollments.slice(0, 10));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [courseId]);

  if (loading) return <PageLoader />;

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <BookOpen className="w-12 h-12 text-neutral-300" />
        <p className="text-lg font-semibold text-neutral-400">未找到该课程</p>
        <button onClick={() => navigate('/enablement')} className="text-sm text-blue-500 hover:underline">
          返回赋能中心
        </button>
      </div>
    );
  }

  const cfg = FRAMEWORK[course.category] || { icon: '📚', color: 'text-neutral-600', bg: 'bg-neutral-50', desc: '' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/enablement')}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{cfg.icon}</span>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{course.name}</h1>
            <Badge variant={course.is_required ? 'danger' : 'info'} size="sm">
              {course.is_required ? '必修' : '选修'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', LEVEL_COLORS[course.level] || 'bg-neutral-100 text-neutral-600')}>
              {course.level}
            </span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.duration || 0}h</span>
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" />{course.points || 0} 积分</span>
            <span className={cn('font-medium', cfg.color)}>{course.category}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="brand" size="sm"><Play className="w-4 h-4" />开始学习</Button>
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <Card>
          <CardHeader><CardTitle>课程简介</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{course.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Course Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card hover>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-neutral-500">分类</p>
            </div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white">{course.category || '-'}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">{cfg.desc}</p>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs text-neutral-500">难度等级</p>
            </div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white">{course.level || '-'}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">学习时长 {course.duration || 0}h</p>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs text-neutral-500">积分奖励</p>
            </div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white">{course.points || 0}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">完成可获积分</p>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-neutral-500">学习人数</p>
            </div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white">{enrollmentStats?.total || 0}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">{enrollmentStats?.activeUsers || 0} 位活跃学员</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Progress */}
      {enrollmentStats && (
        <Card>
          <CardHeader><CardTitle>学习统计</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600">{enrollmentStats.completed}</p>
                <p className="text-xs text-neutral-500 mt-1">已完成人数</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{enrollmentStats.avgProgress}%</p>
                <p className="text-xs text-neutral-500 mt-1">平均进度</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{Math.round((enrollmentStats.completed / Math.max(enrollmentStats.total, 1)) * 100)}%</p>
                <p className="text-xs text-neutral-500 mt-1">完成率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Learners */}
      {recentLearners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              最近学习者
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">学员</th>
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">公司</th>
                    <th className="text-center py-2 px-3 text-xs text-neutral-500 font-medium">进度</th>
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">状态</th>
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">最近活动</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLearners.map((e: any, i: number) => (
                    <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-2 px-3 font-medium text-neutral-900 dark:text-white">{e.user_name || '-'}</td>
                      <td className="py-2 px-3 text-neutral-500">{e.company || '-'}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', (e.progress || 0) >= 100 ? 'bg-emerald-500' : 'bg-blue-500')}
                              style={{ width: `${Math.min(e.progress || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-500">{e.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={
                          e.status === 'completed' || e.status === 'assessed' ? 'success' :
                          e.status === 'in_progress' ? 'info' : 'default'
                        } size="sm">
                          {e.status === 'completed' ? '已完成' :
                           e.status === 'assessed' ? '已评估' :
                           e.status === 'in_progress' ? '进行中' : e.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-xs text-neutral-500">{e.last_activity || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
