import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, Users, Target, TrendingUp, Award, BookOpen,
  ChevronRight, ChevronLeft, X, CheckCircle2, Play,
  Building2, BarChart3, Lightbulb, Zap, Shield,
  HelpCircle, ArrowRight, Sparkles, MessageSquare
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  actions: { label: string; action?: () => void; primary?: boolean; navigateTo?: string }[];
  tips: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '欢迎使用 PartnerNexus',
    description: '合作伙伴关系管理的一站式平台。让我们花 2 分钟了解如何快速上手，让您的伙伴管理效率提升 3 倍。',
    icon: <Rocket className="w-8 h-8" />,
    color: 'from-blue-500 to-indigo-600',
    actions: [
      { label: '开始快速上手', primary: true },
    ],
    tips: [
      '系统已预置演示数据，您可以自由探索',
      '所有数据都安全存储在云端',
      '支持多角色协作管理'
    ]
  },
  {
    id: 'partners',
    title: '第一步：管理您的合作伙伴',
    description: '合作伙伴是系统的核心。您可以添加、查看和管理所有伙伴信息，包括基本资料、联系人、资质等级等。',
    icon: <Users className="w-8 h-8" />,
    color: 'from-emerald-500 to-teal-600',
    actions: [
      { label: '去伙伴列表', navigateTo: '/partners' },
      { label: '新建第一个伙伴', navigateTo: '/partners/new' },
    ],
    tips: [
      '点击左侧"合作伙伴"菜单查看所有伙伴',
      '支持按等级、行业、区域等多维度筛选',
      '每个伙伴有独立的档案页，包含商机、联系人、活动记录'
    ]
  },
  {
    id: 'deals',
    title: '第二步：跟踪商机与转化',
    description: '商机管理帮助您跟踪每一笔合作机会，从报备到赢单的全流程可视化，转化率一目了然。',
    icon: <Target className="w-8 h-8" />,
    color: 'from-orange-500 to-red-500',
    actions: [
      { label: '查看商机看板', navigateTo: '/deals' },
      { label: '登记新商机', navigateTo: '/deals/new' },
    ],
    tips: [
      '商机支持多级阶段：报备→审核→方案→商务→赢单/输单',
      '健康度评分自动评估商机质量',
      '商机健康巡检自动识别风险商机'
    ]
  },
  {
    id: 'marketing',
    title: '第三步：营销活动与获客',
    description: '市场营销模块帮助您规划和执行联合营销活动，追踪线索转化，计算营销 ROI。',
    icon: <TrendingUp className="w-8 h-8" />,
    color: 'from-purple-500 to-pink-500',
    actions: [
      { label: '查看营销总览', navigateTo: '/marketing' },
      { label: '创建营销计划', navigateTo: '/marketing/plan' },
    ],
    tips: [
      '年度规划 + 季度执行的双层架构',
      '线索分级（A/B/C级）自动计算',
      '营销决策引擎智能推荐预算分配'
    ]
  },
  {
    id: 'incentives',
    title: '第四步：激励政策管理',
    description: '灵活配置各类激励政策，从渠道返点到专项奖励，自动计算、审批、发放，全程可追溯。',
    icon: <Award className="w-8 h-8" />,
    color: 'from-amber-500 to-orange-500',
    actions: [
      { label: '查看激励政策', navigateTo: '/incentives' },
      { label: '新建激励计划', navigateTo: '/incentives' },
    ],
    tips: [
      '支持拉新激励、活跃奖励、培训补贴等多种类型',
      '政策ROI自动计算，优化预算分配',
      '激励决策引擎智能推荐策略'
    ]
  },
  {
    id: 'analytics',
    title: '第五步：数据分析与洞察',
    description: '全面的数据分析能力，从生态健康度到伙伴画像，让每一个决策都有数据支撑。',
    icon: <BarChart3 className="w-8 h-8" />,
    color: 'from-cyan-500 to-blue-500',
    actions: [
      { label: '查看数据分析', navigateTo: '/analytics' },
      { label: '完成，开始使用', primary: true },
    ],
    tips: [
      '生态健康度评分：覆盖、活跃、效率三大维度',
      '伙伴分级模型：自动识别核心伙伴',
      '区域热力图：一目了然看到机会分布'
    ]
  },
];

const quickStartGuides = [
  {
    icon: <Building2 className="w-5 h-5" />,
    title: '快速创建合作伙伴',
    duration: '30 秒',
    steps: [
      '点击左侧菜单"合作伙伴"',
      '点击右上角"新建伙伴"按钮',
      '填写基本信息和联系人',
      '提交即可完成创建'
    ]
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: '商机报备流程',
    duration: '1 分钟',
    steps: [
      '进入"商机管理"页面',
      '点击"商机报备"',
      '填写客户信息和项目描述',
      '选择合作伙伴后提交审核'
    ]
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: '设置激励政策',
    duration: '2 分钟',
    steps: [
      '进入"激励政策"页面',
      '点击"新建激励计划"',
      '设置规则、预算和时间',
      '发布后自动生效'
    ]
  },
];

const faqItems = [
  {
    q: '如何添加新的合作伙伴？',
    a: '点击左侧导航栏的"合作伙伴"，然后点击右上角的"新建伙伴"按钮，填写基本信息和联系人即可创建。'
  },
  {
    q: '商机报备后多久能审核？',
    a: '商机报备后，系统会自动通知渠道经理。通常在 24 小时内完成审核，您可以在商机详情页查看审核进度。'
  },
  {
    q: '激励奖金如何计算和发放？',
    a: '激励奖金根据政策规则自动计算，经过审批流程后发放。您可以在激励计划详情中查看每笔奖励的计算明细。'
  },
  {
    q: '可以导出数据吗？',
    a: '支持 Excel 导出。在列表页面点击"导出"按钮即可下载当前筛选条件下的数据。'
  },
  {
    q: '如何联系技术支持？',
    a: '您可以通过邮箱 support@partnernexus.com 联系我们，工作时间 2 小时内响应。'
  },
];

const keyboardShortcuts = [
  { key: 'G then P', desc: '跳转到合作伙伴' },
  { key: 'G then D', desc: '跳转到商机管理' },
  { key: 'G then M', desc: '跳转到市场营销' },
  { key: 'G then I', desc: '跳转到激励政策' },
  { key: 'Cmd/Ctrl + K', desc: '全局搜索' },
  { key: '?', desc: '显示快捷键帮助' },
];

interface OnboardingGuideProps {
  open?: boolean;
  onClose?: () => void;
  mode?: 'modal' | 'page';
}

export const OnboardingGuide = ({ open = false, onClose, mode = 'modal' }: OnboardingGuideProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showFaq, setShowFaq] = useState(false);
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  // 重置步骤当模式改变时
  useEffect(() => {
    if (mode === 'page') {
      setCurrentStep(0);
      setIsOpen(false);
    }
  }, [mode]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = (action?: () => void, navigateTo?: string) => {
    if (navigateTo) {
      navigate(navigateTo);
    } else if (action) {
      action();
    }
  };

  const step = onboardingSteps[currentStep];

  const content = (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onboardingSteps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < currentStep
                  ? 'w-8 bg-green-500'
                  : i === currentStep
                  ? 'w-8 bg-blue-500'
                  : 'w-4 bg-neutral-200 dark:bg-neutral-700'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-neutral-500">
          {currentStep + 1} / {onboardingSteps.length}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Left - Icon and Title */}
        <div className="flex-shrink-0 w-48">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg`}>
            {step.icon}
          </div>
          <div className="mt-4 space-y-2">
            {onboardingSteps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  i === currentStep
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                    : i < currentStep
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {i < currentStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-xs rounded-full border border-current">
                      {i + 1}
                    </span>
                  )}
                  <span className="truncate">{s.title.split('：')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right - Content */}
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {step.title}
            </h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Tips */}
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="font-medium text-amber-800 dark:text-amber-300">实用提示</span>
              </div>
              <ul className="space-y-2">
                {step.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            {step.actions.map((action, i) => (
              <Button
                key={i}
                variant={action.primary ? 'brand' : 'outline'}
                onClick={() => {
                  if (action.primary) {
                    nextStep();
                  } else if (action.navigateTo) {
                    navigate(action.navigateTo);
                    handleClose();
                  } else if (action.action) {
                    action.action();
                    handleClose();
                  }
                }}
              >
                {action.label}
                {action.primary && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <Button
          variant="ghost"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          上一步
        </Button>

        <button
          onClick={() => setShowFaq(!showFaq)}
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1"
        >
          <HelpCircle className="w-4 h-4" />
          常见问题
        </button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleClose}>
            跳过
          </Button>
          {currentStep < onboardingSteps.length - 1 && (
            <Button variant="brand" onClick={nextStep}>
              下一步 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      {showFaq && (
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            <HelpCircle className="w-5 h-5 inline mr-2" />
            常见问题
          </h3>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <details key={i} className="group">
                <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 list-none flex items-center justify-between py-2">
                  <span>{item.q}</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 pb-2 pl-4">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (mode === 'page') {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">帮助与指引</h1>
              <p className="text-neutral-500">快速上手 PartnerNexus，掌握核心功能</p>
            </div>
          </div>
        </div>

        {/* New User Guide */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  新手指引
                </h2>
                <p className="text-sm text-neutral-500 mt-1">6 步快速上手，全面了解系统核心功能</p>
              </div>
              <Button variant="brand" onClick={() => { setCurrentStep(0); setIsOpen(true); }}>
                <Play className="w-4 h-4 mr-2" />
                开始指引
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {onboardingSteps.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { setCurrentStep(i); setIsOpen(true); }}
                  className="text-left p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all group"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>
                    {s.icon}
                  </div>
                  <h3 className="font-medium text-neutral-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {s.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{s.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guides */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              快速上手流程
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {quickStartGuides.map((guide, i) => (
                <div key={i} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {guide.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-white text-sm">{guide.title}</h3>
                      <Badge variant="secondary" size="sm" className="text-xs">{guide.duration}</Badge>
                    </div>
                  </div>
                  <ol className="space-y-2">
                    {guide.steps.map((step, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-medium">
                          {j + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              常见问题
            </h2>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {faqItems.map((item, i) => (
                <details key={i} className="group py-3">
                  <summary className="cursor-pointer font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 list-none flex items-center justify-between">
                    <span className="text-sm">{item.q}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 pl-4">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-500" />
              键盘快捷键
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {keyboardShortcuts.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-neutral-700 dark:text-neutral-300">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">需要更多帮助？</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  我们的团队随时准备为您提供支持
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  查看文档
                </Button>
                <Button variant="brand">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  联系支持
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      size="xl"
      className="p-0"
    >
      <div className="p-6">
        {content}
      </div>
    </Modal>
  );
};

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('partnernexus_onboarding_seen');
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissOnboarding = () => {
    localStorage.setItem('partnernexus_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  return { showOnboarding, setShowOnboarding, dismissOnboarding };
};
