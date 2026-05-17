# Market Sizing Analysis

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `examples/market-sizing-analysis/`

## Guidance

### From `market-sizing-analysis-skill.md`

_Source topic: market-sizing-analysis_

**Purpose:** Calculate TAM/SAM/SOM for market opportunities using top-down, bottom-up, and value theory methodologies. Use this skill when sizing markets, estimating addressable revenue, validating market opportunity for a new venture, or building investor-ready market analysis for a startup pitch or business plan.

# Market Sizing Analysis

Comprehensive market sizing methodologies for calculating Total Addressable Market (TAM), Serviceable Available Market (SAM), and Serviceable Obtainable Market (SOM) for startup opportunities.

## Overview

Market sizing provides the foundation for startup strategy, fundraising, and business planning. Calculate market opportunity using three complementary methodologies: top-down (industry reports), bottom-up (customer segment calculations), and value theory (willingness to pay).

## Core Concepts

### The Three-Tier Market Framework

- Total revenue opportunity if achieving 100% market share
- Defines the universe of potential customers
- Used for long-term vision and market validation
- Example: All email marketing software revenue globally

- Portion of TAM targetable with current product/service
- Accounts for geographic, segment, or capability constraints
- Represents realistic addressable opportunity
- Example: AI-powered email marketing for e-commerce in North America

- Realistic market share achievable in 3-5 years
- Accounts for competition, resources, and market dynamics
- Used for financial projections and fundraising
- Example: 2-5% of SAM based on competitive landscape

### When to Use Each Methodology

- Use when established market research exists
- Best for mature, well-defined markets
- Validates market existence and growth
- Starts with industry reports and narrows down

- Use when targeting specific customer segments
- Best for new or niche markets
...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: market-sizing-analysis
Source path: `skills/product-business/market-sizing-analysis`
Canonical skill: `skills/product-business/startup-finance`

### From `saas-market-sizing.md`

_Source topic: saas-market-sizing_

# SaaS Market Sizing Example: AI-Powered Email Marketing for E-Commerce

Complete TAM/SAM/SOM calculation for a B2B SaaS startup using bottom-up and top-down methodologies.

## Company Overview

**Product:** AI-powered email marketing automation platform
**Target:** E-commerce companies with $1M+ annual revenue

## Methodology 1: Bottom-Up Analysis (Primary)

### Step 1: Define Target Customer Segments

- E-commerce companies (D2C and marketplace sellers)
- $1M+ in annual revenue
- North America based
- Currently using email marketing

| Segment               | Annual Revenue | Count  | ACV     | Priority |
| --------------------- | -------------- | ------ | ------- | -------- |
| Small E-commerce      | $1M-$5M        | 85,000 | $3,600  | High     |
| Mid-Market E-commerce | $5M-$50M       | 18,000 | $9,600  | High     |
| Enterprise E-commerce | $50M+          | 2,500  | $24,000 | Medium   |

- U.S. Census Bureau: E-commerce business counts
- Shopify, BigCommerce, WooCommerce: Published merchant counts
- Statista: E-commerce market statistics
- LinkedIn Sales Navigator: Company search validation

### Step 2: Calculate TAM (Total Addressable Market)

```
TAM = Σ (Segment Count × Annual Contract Value)
```

```
Small E-commerce:   85,000 × $3,600  = $306M
Mid-Market:         18,000 × $9,600  = $173M
Enterprise:          2,500 × $24,000 = $60M
                                      --------
TAM (North America):                  $539M
```

...


### From `data-sources.md`

_Source topic: data-sources_

# Market Sizing Data Sources

Curated list of credible sources for market research and sizing analysis.

## Industry Research Reports

### Premium Research Firms

- Technology market forecasts and sizing
- Magic Quadrants for competitive positioning
- Typical cost: $5K-$50K per report
- Best for: Enterprise software, IT services, emerging tech

- Business technology and digital transformation
- Wave evaluations for vendor comparison
- Typical cost: $3K-$30K per report
- Best for: Marketing tech, customer experience, B2B

- IT market intelligence and sizing
- Detailed segment breakdowns
- Typical cost: $4K-$40K per report
- Best for: Hardware, software, IT services

- Free insights and reports
- Strategic industry analysis
- Best for: Industry trends, macroeconomic context

### Accessible Research

- Cost: $39/month individual, $199/month business
- Coverage: 80,000+ topics across industries
- Best for: Quick market size estimates, charts, trends

- Cost: Custom pricing (typically $10K+/year)
- Coverage: Venture capital, startup markets
- Best for: Emerging markets, competitive intelligence
...
