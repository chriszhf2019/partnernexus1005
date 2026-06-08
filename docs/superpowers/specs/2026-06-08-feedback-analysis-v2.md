# FeedbackAnalysis v2 — 设计规格

**日期：** 2026-06-08 | **范围：** `FeedbackAnalysis.tsx` 重写

## 确认设计

| 功能 | 决策 |
|------|------|
| 筛选器 | 时间(7d/30d/all) + 课程 + 公司，三个下拉联动 |
| 评分分布 | 保留 + 趋势「较上月 ↑0.2」+ 情绪比例「负面 18%」 |
| 关键词云 | 绿/橙/红三色编码，点击关键词筛选列表 |
| 反馈列表 | 学员/公司/课程/评分/内容/AI标签/时间/操作 |
| AI标签 | 前端规则匹配 ~30 关键词，三色编码 |
| 回复闭环 | 内联回复框 + 标记已处理，数据存 course_feedback 表 |
| 预警联动 | KPI 预警中心 → 跳转 feedbackTab + 预筛选低分 |
| TOP5 问题 | 词云右侧新增高频问题列表 |
| 导出 | CSV 导出，8 列完整数据 |
| 布局 | 上层 40%(左1/3评分 + 右2/3词云+TOP5) + 下层 60%(列表全宽) |

## 数据库变更

course_feedback 表新增字段：
- `admin_reply` TEXT — 管理员回复内容
- `admin_reply_at` TIMESTAMPTZ — 回复时间
- `status` TEXT DEFAULT 'pending' — pending/processed
- `tags` TEXT[] — AI 标签数组

## 实现范围

重写 `FeedbackAnalysis.tsx`，新增：
- `aiTags.ts` — 标签匹配规则引擎
- `FeedbackFilterBar.tsx` — 筛选器组件
- `FeedbackList.tsx` — 反馈详情列表 + 回复
