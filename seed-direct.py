import os
import requests
import json

# Supabase配置
SUPABASE_URL = 'https://ezkbjufluczpxdixplxu.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDA5NCwiZXhwIjoyMDk0OTY2MDk0fQ.oPeUBuyHl2Zh-9ueOO7yCWHKG0oAxgdzjYGIUgzVw7E'

# 使用anon key (因为线上应用也在用)
API_URL = f'{SUPABASE_URL}/rest/v1'

headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 合作伙伴数据
partners = [
    {
        "name": "神州数码集团股份有限公司",
        "tier": "Platinum",
        "status": "Cooperating",
        "type": "VAD",
        "manager": "高波",
        "location": "北京海淀区中关村大街1号",
        "region": "华北",
        "province": "北京",
        "city": "北京市",
        "start_date": "2018-03-15",
        "years": 7,
        "prev_tier": "Gold",
        "tags": ["VAD", "信创", "全国覆盖", "金融"],
        "win_rate": 72,
        "industry": "金融",
        "is_core_partner": True,
        "cooperation_scope": "全国总代理",
        "unified_social_credit_code": "911100001000056537"
    },
    {
        "name": "华为技术有限公司",
        "tier": "Diamond",
        "status": "Cooperating",
        "type": "OEM",
        "manager": "李娜",
        "location": "深圳市龙岗区华为总部",
        "region": "华南",
        "province": "广东",
        "city": "深圳市",
        "start_date": "2016-05-01",
        "years": 9,
        "prev_tier": "Diamond",
        "tags": ["OEM", "全行业"],
        "win_rate": 75,
        "industry": "制造",
        "is_core_partner": True,
        "cooperation_scope": "全行业基础设施",
        "unified_social_credit_code": "914403001922038216"
    },
    {
        "name": "东软集团股份有限公司",
        "tier": "Platinum",
        "status": "Cooperating",
        "type": "ISV",
        "manager": "陈明",
        "location": "沈阳市浑南区东软软件园",
        "region": "华北",
        "province": "辽宁",
        "city": "沈阳市",
        "start_date": "2017-06-01",
        "years": 8,
        "prev_tier": "Gold",
        "tags": ["ISV", "医疗行业"],
        "win_rate": 68,
        "industry": "医疗",
        "is_core_partner": True,
        "cooperation_scope": "医疗行业核心ISV",
        "unified_social_credit_code": "91210100701796354X"
    },
    {
        "name": "浪潮电子信息产业股份有限公司",
        "tier": "Diamond",
        "status": "Cooperating",
        "type": "OEM",
        "manager": "王强",
        "location": "济南市高新区浪潮路1036号",
        "region": "华东",
        "province": "山东",
        "city": "济南市",
        "start_date": "2017-01-10",
        "years": 8,
        "prev_tier": "Platinum",
        "tags": ["OEM", "政务", "信创"],
        "win_rate": 70,
        "industry": "政务",
        "is_core_partner": True,
        "cooperation_scope": "政务云基础设施",
        "unified_social_credit_code": "91370000267181296N"
    },
    {
        "name": "太极计算机股份有限公司",
        "tier": "Gold",
        "status": "Cooperating",
        "type": "SI",
        "manager": "张伟",
        "location": "北京海淀区信息路18号",
        "region": "华北",
        "province": "北京",
        "city": "北京市",
        "start_date": "2017-11-20",
        "years": 7,
        "prev_tier": "Silver",
        "tags": ["SI", "政务", "信创"],
        "win_rate": 63,
        "industry": "政务",
        "is_core_partner": True,
        "cooperation_scope": "政务行业SI",
        "unified_social_credit_code": "91110108100007789R"
    }
]

# 商机数据
deals = [
    {
        "title": "2025年萧山区政务云(信创)服务项目",
        "customer_name": "杭州市萧山区大数据发展管理局",
        "customer_industry": "政务",
        "value": 18100000,
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
        "description": "基于鲲鹏/飞腾架构的信创云服务",
        "lifecycle": [
            {"stage": "Registered", "date": "2025-06-01", "description": "合作伙伴提交商机报备", "actor": "高波"},
            {"stage": "Approved", "date": "2025-06-05", "description": "渠道经理审核通过", "actor": "渠道总监"}
        ]
    },
    {
        "title": "某大型三甲医院智慧医院整体解决方案",
        "customer_name": "某省人民医院",
        "customer_industry": "医疗",
        "value": 22000000,
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
        "description": "包含HIS、PACS、LIS、HRP等核心系统重构",
        "lifecycle": [
            {"stage": "Registered", "date": "2025-05-10", "description": "合作伙伴提交商机报备", "actor": "王浩"},
            {"stage": "Approved", "date": "2025-05-15", "description": "渠道经理审核通过", "actor": "渠道总监"},
            {"stage": "Solution", "date": "2025-06-01", "description": "进入解决方案设计阶段", "actor": "技术总监"}
        ]
    },
    {
        "title": "某头部保险企业核心系统云化迁移",
        "customer_name": "中国平安保险集团",
        "customer_industry": "金融",
        "value": 9800000,
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
        "has_conflict": True,
        "lifecycle": [
            {"stage": "Registered", "date": "2025-03-20", "description": "合作伙伴提交商机报备", "actor": "刘洋"},
            {"stage": "Approved", "date": "2025-03-25", "description": "渠道经理审核通过", "actor": "渠道总监"},
            {"stage": "Commercial", "date": "2025-06-15", "description": "进入商务谈判阶段", "actor": "销售总监"}
        ]
    },
    {
        "title": "国家电网数据安全合规改造",
        "customer_name": "国家电网有限公司",
        "customer_industry": "能源",
        "value": 8500000,
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
        "description": "电网关键基础设施安全改造，等保三级合规建设",
        "lifecycle": [
            {"stage": "Registered", "date": "2024-11-10", "description": "合作伙伴提交商机报备", "actor": "高波"},
            {"stage": "Approved", "date": "2024-11-15", "description": "渠道经理审核通过", "actor": "渠道总监"},
            {"stage": "Commercial", "date": "2025-01-10", "description": "商机转化成功", "actor": "渠道总监"},
            {"stage": "ClosedWon", "date": "2025-06-15", "description": "项目签约", "actor": "销售总监"}
        ]
    },
    {
        "title": "深圳福田区智慧城区AI视觉系统",
        "customer_name": "深圳市福田区政务服务数据管理局",
        "customer_industry": "政务",
        "value": 9500000,
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
        "description": "城区级视频AI分析系统",
        "lifecycle": [
            {"stage": "Registered", "date": "2025-06-05", "description": "合作伙伴提交商机报备", "actor": "陈可"},
            {"stage": "Approved", "date": "2025-06-08", "description": "渠道经理审核通过", "actor": "渠道总监"}
        ]
    },
    {
        "title": "招商银行分布式核心系统改造",
        "customer_name": "招商银行股份有限公司",
        "customer_industry": "金融",
        "value": 12000000,
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
        "description": "银行核心系统分布式改造",
        "lifecycle": [
            {"stage": "Registered", "date": "2025-05-25", "description": "合作伙伴提交商机报备", "actor": "赵华"},
            {"stage": "Approved", "date": "2025-05-30", "description": "渠道经理审核通过", "actor": "渠道总监"},
            {"stage": "Solution", "date": "2025-06-15", "description": "方案设计完成", "actor": "技术总监"},
            {"stage": "Negotiation", "date": "2025-07-01", "description": "进入商务谈判阶段", "actor": "销售总监"}
        ]
    },
    {
        "title": "心血管病高质量数据集建设项目",
        "customer_name": "国家心血管病中心",
        "customer_industry": "医疗",
        "value": 13000000,
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
        "description": "高质量数据集建设，包含影像数据标注和AI模型训练",
        "lifecycle": [
            {"stage": "Registered", "date": "2025-07-01", "description": "合作伙伴提交商机报备", "actor": "李娜"},
            {"stage": "Approved", "date": "2025-07-03", "description": "渠道经理审核通过", "actor": "渠道总监"},
            {"stage": "Commercial", "date": "2025-07-10", "description": "进入商务阶段", "actor": "销售总监"}
        ]
    },
    {
        "title": "某省政务云二期扩容及信创改造",
        "customer_name": "某省大数据局",
        "customer_industry": "政务",
        "value": 15000000,
        "partner_name": "浪潮电子信息产业股份有限公司",
        "partner_type": "OEM",
        "stage": "Registered",
        "status": "Approved",
        "region": "华北",
        "sales_name": "王强",
        "sales_team": "政务事业部",
        "product_type": "信创云平台",
        "created_date": "2025-06-15",
        "last_activity_date": "2025-06-15",
        "expected_close_date": "2026-03-31",
        "description": "省级政务云平台扩容，新增信创资源池",
        "lifecycle": [
            {"stage": "Registered", "date": "2025-06-15", "description": "合作伙伴提交商机报备", "actor": "王强"}
        ]
    }
]

def seed_data():
    print("Testing connection to Supabase...")
    
    # Test connection
    try:
        r = requests.get(f'{API_URL}/partners?select=count', headers=headers, timeout=10)
        print(f"Partners count: {r.status_code} - {r.text[:200]}")
    except Exception as e:
        print(f"Connection error: {e}")
        return False
    
    # Insert partners
    print("\nInserting partners...")
    for partner in partners:
        try:
            r = requests.post(f'{API_URL}/partners', headers=headers, json=partner, timeout=10)
            if r.status_code in [200, 201]:
                print(f"  ✓ {partner['name']}")
            else:
                print(f"  ✗ {partner['name']}: {r.status_code} - {r.text[:200]}")
        except Exception as e:
            print(f"  ✗ {partner['name']}: {e}")
    
    # Get partner IDs
    print("\nFetching partner IDs...")
    r = requests.get(f'{API_URL}/partners?select=id,name', headers=headers, timeout=10)
    if r.status_code == 200:
        partner_map = {p['name']: p['id'] for p in r.json()}
        print(f"  Found {len(partner_map)} partners")
    else:
        print(f"  Error: {r.status_code} - {r.text[:200]}")
        return False
    
    # Insert deals with partner IDs
    print("\nInserting deals...")
    for deal in deals:
        deal_data = deal.copy()
        partner_name = deal_data.pop('partner_name', '')
        deal_data['partner_id'] = partner_map.get(partner_name, '')
        
        try:
            r = requests.post(f'{API_URL}/deals', headers=headers, json=deal_data, timeout=10)
            if r.status_code in [200, 201]:
                print(f"  ✓ {deal_data['title']}")
            else:
                print(f"  ✗ {deal_data['title']}: {r.status_code} - {r.text[:200]}")
        except Exception as e:
            print(f"  ✗ {deal_data['title']}: {e}")
    
    print("\nDone!")
    return True

if __name__ == '__main__':
    seed_data()
