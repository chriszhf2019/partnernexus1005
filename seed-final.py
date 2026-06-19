import requests

# Supabase配置 - 使用service_role key
SUPABASE_URL = 'https://ezkbjufluczpxdixplxu.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDA5NCwiZXhwIjoyMDk0OTY2MDk0fQ.oPeUBuyHl2Zh-9ueOO7yCWHKG0oAxgdzjYGIUgzVw7E'

API_URL = f'{SUPABASE_URL}/rest/v1'
headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 获取伙伴映射
print("Fetching existing partners...")
r = requests.get(f'{API_URL}/partners?select=id,name,type', headers=headers, timeout=10)
all_partners = r.json()
print(f"Total partners: {len(all_partners)}")

def find_partner(name):
    for p in all_partners:
        if p['name'] == name:
            return p
    return None

# 使用snake_case字段名
deals_data = [
    {
        "title": "2025年萧山区政务云(信创)服务项目",
        "customer_name": "杭州市萧山区大数据发展管理局",
        "customer_industry": "政务",
        "value": 18100000,
        "partner_id": find_partner("神州数码集团股份有限公司")['id'] if find_partner("神州数码集团股份有限公司") else None,
        "partner_name": "神州数码集团股份有限公司",
        "partner_type": "VAD",
        "stage": "Approved",
        "status": "Approved",
        "region": "华东",
        "sales_name": "高波",
        "sales_team": "政务事业部",
        "product_type": "信创云平台",
        "created_date": "2025-06-01",
        "last_activity_date": "2025-06-15",
        "expected_close_date": "2025-12-31",
        "description": "基于鲲鹏/飞腾架构的信创云服务，替代原有x86云平台"
    },
    {
        "title": "某大型三甲医院智慧医院整体解决方案",
        "customer_name": "某省人民医院",
        "customer_industry": "医疗",
        "value": 22000000,
        "partner_id": find_partner("东软集团股份有限公司")['id'] if find_partner("东软集团股份有限公司") else None,
        "partner_name": "东软集团股份有限公司",
        "partner_type": "ISV",
        "stage": "Solution",
        "status": "Approved",
        "region": "华东",
        "sales_name": "王浩",
        "sales_team": "医疗事业部",
        "product_type": "智慧医院整体解决方案",
        "created_date": "2025-05-10",
        "last_activity_date": "2025-07-01",
        "expected_close_date": "2026-06-30",
        "description": "包含HIS、PACS、LIS、HRP等核心系统重构"
    },
    {
        "title": "某头部保险企业核心系统云化迁移",
        "customer_name": "中国平安保险集团",
        "customer_industry": "金融",
        "value": 9800000,
        "partner_id": find_partner("东软集团股份有限公司")['id'] if find_partner("东软集团股份有限公司") else None,
        "partner_name": "东软集团股份有限公司",
        "partner_type": "ISV",
        "stage": "Commercial",
        "status": "Approved",
        "region": "华南",
        "sales_name": "刘洋",
        "sales_team": "金融事业部",
        "product_type": "金融云平台",
        "created_date": "2025-03-20",
        "last_activity_date": "2025-07-10",
        "expected_close_date": "2025-12-31",
        "description": "保险核心系统迁移至金融云平台",
        "has_conflict": True
    },
    {
        "title": "国家电网数据安全合规改造",
        "customer_name": "国家电网有限公司",
        "customer_industry": "能源",
        "value": 8500000,
        "partner_id": find_partner("神州数码集团股份有限公司")['id'] if find_partner("神州数码集团股份有限公司") else None,
        "partner_name": "神州数码集团股份有限公司",
        "partner_type": "VAD",
        "stage": "ClosedWon",
        "status": "Approved",
        "region": "华北",
        "sales_name": "高波",
        "sales_team": "能源事业部",
        "product_type": "安全合规",
        "created_date": "2024-11-10",
        "last_activity_date": "2025-06-15",
        "expected_close_date": "2025-06-30",
        "actual_close_date": "2025-06-15",
        "description": "电网关键基础设施安全改造，等保三级合规建设"
    },
    {
        "title": "深圳福田区智慧城区AI视觉系统",
        "customer_name": "深圳市福田区政务服务数据管理局",
        "customer_industry": "政务",
        "value": 9500000,
        "partner_id": find_partner("东软集团股份有限公司")['id'] if find_partner("东软集团股份有限公司") else None,
        "partner_name": "东软集团股份有限公司",
        "partner_type": "ISV",
        "stage": "Approved",
        "status": "Approved",
        "region": "华南",
        "sales_name": "陈可",
        "sales_team": "智慧城市事业部",
        "product_type": "AI视觉平台",
        "created_date": "2025-06-05",
        "last_activity_date": "2025-07-01",
        "expected_close_date": "2025-12-31",
        "description": "城区级视频AI分析系统，覆盖10000路视频监控"
    },
    {
        "title": "招商银行分布式核心系统改造",
        "customer_name": "招商银行股份有限公司",
        "customer_industry": "金融",
        "value": 12000000,
        "partner_id": find_partner("太极计算机股份有限公司")['id'] if find_partner("太极计算机股份有限公司") else None,
        "partner_name": "太极计算机股份有限公司",
        "partner_type": "SI",
        "stage": "Negotiation",
        "status": "Approved",
        "region": "华南",
        "sales_name": "赵华",
        "sales_team": "金融事业部",
        "product_type": "分布式核心系统",
        "created_date": "2025-05-25",
        "last_activity_date": "2025-07-15",
        "expected_close_date": "2026-03-31",
        "description": "银行核心系统分布式改造，提升交易处理能力"
    },
    {
        "title": "心血管病高质量数据集建设项目",
        "customer_name": "国家心血管病中心",
        "customer_industry": "医疗",
        "value": 13000000,
        "partner_id": find_partner("华为技术有限公司")['id'] if find_partner("华为技术有限公司") else None,
        "partner_name": "华为技术有限公司",
        "partner_type": "OEM",
        "stage": "Commercial",
        "status": "Approved",
        "region": "华北",
        "sales_name": "李娜",
        "sales_team": "医疗事业部",
        "product_type": "医疗AI平台",
        "created_date": "2025-07-01",
        "last_activity_date": "2025-07-15",
        "expected_close_date": "2026-06-30",
        "description": "高质量数据集建设，包含影像数据标注和AI模型训练"
    },
    {
        "title": "某省政务云二期扩容及信创改造",
        "customer_name": "某省大数据局",
        "customer_industry": "政务",
        "value": 15000000,
        "partner_id": find_partner("浪潮电子信息产业股份有限公司")['id'] if find_partner("浪潮电子信息产业股份有限公司") else None,
        "partner_name": "浪潮电子信息产业股份有限公司",
        "partner_type": "OEM",
        "stage": "Registered",
        "status": "Pending",
        "region": "华北",
        "sales_name": "王强",
        "sales_team": "政务事业部",
        "product_type": "信创云平台",
        "created_date": "2025-06-15",
        "last_activity_date": "2025-06-15",
        "expected_close_date": "2026-03-31",
        "description": "省级政务云平台扩容，新增信创资源池"
    }
]

print("\nInserting deals...")
success = 0
failed = 0
for deal in deals_data:
    if not deal.get('partner_id'):
        print(f"  ✗ {deal['title']}: No partner ID")
        failed += 1
        continue
    
    try:
        r = requests.post(f'{API_URL}/deals', headers=headers, json=deal, timeout=10)
        if r.status_code in [200, 201]:
            print(f"  ✓ {deal['title']}")
            success += 1
        else:
            print(f"  ✗ {deal['title']}: {r.status_code} - {r.text[:200]}")
            failed += 1
    except Exception as e:
        print(f"  ✗ {deal['title']}: {e}")
        failed += 1

print(f"\nSuccess: {success}, Failed: {failed}")

print("\nVerifying...")
r = requests.get(f'{API_URL}/deals?select=id,title,value,stage', headers=headers, timeout=10)
deals = r.json()
print(f"Total deals now: {len(deals)}")
total_value = sum(d.get('value', 0) or 0 for d in deals)
print(f"Total value: ¥{total_value:,.0f}")
