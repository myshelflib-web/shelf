import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://www.rbi.org.in/",
  "https://www.indiabudget.gov.in/",
  "https://mospi.gov.in/",
];

const NI = "GS Paper III — Indian Economy and issues relating to planning, mobilization of resources, growth, development and employment.";
const MP = "GS Paper III — Government Budgeting; Indian Economy — mobilization of resources.";
const EXT = "GS Paper III — Effects of liberalization on the economy, changes in industrial policy and their effects on industrial growth.";
const AGRI = "GS Paper III — Major crops, cropping patterns, irrigation, storage, transport and marketing of agricultural produce; issues related to direct and indirect farm subsidies and MSP; PDS; food security.";
const INFRA = "GS Paper III — Infrastructure: Energy, Ports, Roads, Airports, Railways; Investment models.";

export const UPSC_ECONOMY_CORPUS: SyllabusSubject[] = [
  {
    slug: "upsc-economy",
    name: "Indian Economy",
    description:
      "GS Paper III economy at topic granularity: one page per concept the exam actually tests.",
    paper: "GS Paper III",
    sources: SRC,
    topics: [
      topic("national-income", "National Income Accounting", NI, [
        L("gdp-vs-gva", "GDP versus GVA: Prices, Coverage and Use", [
          "GDP at market prices versus GVA at basic prices, and the product taxes minus subsidies bridge",
          "Why GVA is the production-side workhorse and GDP the expenditure-side headline",
          "Nominal versus real series and what the GDP deflator actually measures",
          "Base-year revision: why the series breaks and how splicing is done conceptually",
          "What GDP does not capture: unpaid work, environmental loss, distribution",
        ], "compare", ["GDP vs GVA UPSC", "GDP deflator"]),
        L("income-methods", "Three Methods of National Income and Why They Diverge", [
          "Production, income and expenditure methods and the identities that link them",
          "Factor cost, basic price and market price — which aggregate sits where",
          "NNP, NDP, personal income and disposable income as derived aggregates",
          "Why statistical discrepancy appears and what it does not mean",
        ], "flow", ["national income methods", "NNP NDP personal income"]),
        L("real-nominal-deflator", "Real Growth, the Deflator and Inflation Accounting", [
          "How real GDP is obtained from a current-price series",
          "Why the GDP deflator is not CPI, and when each is the right price measure",
          "Interpreting a year when real growth and nominal growth diverge sharply",
          "Per capita real income as a welfare proxy and its limits",
        ], "compare", ["real vs nominal GDP", "GDP deflator vs CPI"]),
        L("limitations-of-gdp", "What National Income Numbers Cannot Tell You", [
          "Distribution: a rising mean with a worsening Gini is still a rising GDP",
          "Informal sector measurement and why revisions swing",
          "Cross-border income: GNP versus GDP and when the gap matters for India",
          "Satellite accounts and why environmental accounting is still incomplete",
        ], "cards", ["limitations of GDP UPSC", "GDP welfare measure"]),
      ]),
      topic("inflation", "Inflation: Measurement and Policy", NI, [
        L("cpi-vs-wpi", "CPI and WPI: Baskets, Weights and Why They Diverge", [
          "What each index covers and whose consumption or production it tracks",
          "Headline versus core, and why food and fuel drive the CPI–WPI gap",
          "Which index the Monetary Policy Committee is mandated to target",
          "Base year and weighting: why a revision changes the inflation print",
        ], "compare", ["CPI vs WPI UPSC", "headline vs core inflation"]),
        L("inflation-types", "Demand-Pull, Cost-Push and Built-In Inflation", [
          "The demand-pull channel through the output gap",
          "Cost-push from supply shocks and imported inflation",
          "Wage–price feedback as built-in inflation",
          "Why the policy response differs for each type",
        ], "flow", ["types of inflation UPSC", "cost push vs demand pull"]),
        L("inflation-targeting-india", "Flexible Inflation Targeting in India", [
          "The 2016 RBI Act amendment: MPC composition and the voting rule",
          "The 4 per cent target with a plus-or-minus 2 point band, and what happens on a miss",
          "Why the target is CPI combined, not WPI or core alone",
          "Accountability: the letter to the government after three consecutive misses",
        ], "hierarchy", ["flexible inflation targeting India", "MPC RBI"]),
      ]),
      topic("money-banking", "Money, Banking and Monetary Policy", NI, [
        L("money-supply-measures", "Money Supply: Reserve Money to M3", [
          "Reserve money (M0) and the components of the monetary base",
          "M1, M2, M3 in the Indian classification and what sits in each",
          "The money multiplier as a ratio, and why it is not a constant",
          "Currency in circulation versus deposit money in an Indian context",
        ], "hierarchy", ["money supply M1 M3 India", "reserve money"]),
        L("laf-corridor", "The Liquidity Adjustment Facility and the Policy Corridor", [
          "Repo, SDF and MSF as the three rungs of the corridor",
          "Why the operating target sits inside the corridor, not at a single rate",
          "Reverse repo's changed role after the SDF was introduced",
          "How a durable surplus or deficit shows up in corridor behaviour",
        ], "flow", ["LAF corridor RBI", "repo SDF MSF"]),
        L("crr-slr-omo", "CRR, SLR and Open Market Operations", [
          "What CRR immobilises and why it is not remunerated",
          "SLR as a statutory holding of approved securities, not a cash reserve",
          "Outright OMO versus the LAF as durable versus frictional liquidity tools",
          "Operation Twist as a duration tool, not a quantity tool",
        ], "compare", ["CRR vs SLR", "open market operations RBI"]),
        L("monetary-transmission", "Why Repo Changes Do Not Always Reach Borrowers", [
          "The four channels: interest rate, credit, asset price and exchange rate",
          "External benchmark lending and why it was introduced",
          "The role of administered rates and small savings in blocking transmission",
          "Liquidity surplus as a necessary but not sufficient condition",
        ], "flow", ["monetary policy transmission India", "external benchmark lending"]),
        L("npa-and-ibc", "NPAs, Asset Quality and the Insolvency Code", [
          "The 90-day overdue test and substandard / doubtful / loss classification",
          "Why recognition lagged and what asset quality reviews changed",
          "IBC: creditor-in-control, the 330-day outer timeline, and haircuts as the price of delay",
          "SARFAESI as a secured-creditor tool that does not replace a collective process",
        ], "timeline", ["NPA classification India", "IBC insolvency code"]),
        L("priority-sector-lending", "Priority Sector Lending: Intent, Targets and Leakage", [
          "The 40 per cent of ANBC target and the sub-targets as a category",
          "Why PSL exists: directed credit where markets under-serve",
          "PSL certificates as a market in obligations, not a waiver of the target",
          "The additionality problem: lending that would have happened anyway",
        ], "cards", ["priority sector lending UPSC", "PSL certificates"]),
      ]),
      topic("public-finance", "Public Finance and the Budget", MP, [
        L("budget-structure", "How to Read a Union Budget: Receipts, Expenditure, Deficits", [
          "Revenue versus capital on both the receipts and the expenditure side",
          "Fiscal, revenue, primary and effective revenue deficit — each formula",
          "Why a falling fiscal deficit with a rising revenue deficit is a red flag",
          "The difference between a deficit and a debt stock",
        ], "hierarchy", ["fiscal deficit formula", "revenue vs capital budget"]),
        L("frbm-framework", "FRBM: Targets, Escape Clauses and Off-Budget Borrowing", [
          "What the FRBM Act 2003 set out to constrain and why a law was used",
          "The N.K. Singh Committee review: debt as the anchor, deficit as the path",
          "Escape clauses: when they can be invoked and what they must not become",
          "Off-budget borrowing and why it undermines a deficit target",
        ], "timeline", ["FRBM Act UPSC", "NK Singh committee"]),
        L("gst-architecture", "GST: Destination Principle, Dual Levy and the Council", [
          "Why GST is a destination-based consumption tax, not an origin tax",
          "CGST, SGST and IGST and when each applies",
          "The GST Council: weighted voting and the three-fourths majority",
          "Input tax credit as the mechanism that breaks the cascading chain",
        ], "flow", ["GST Council voting", "CGST SGST IGST"]),
        L("tax-buoyancy", "Tax Buoyancy, Elasticity and the Tax Base", [
          "Buoyancy versus elasticity: which one holds policy constant",
          "Why a wide base at a moderate rate outperforms a narrow base at a high rate",
          "Direct versus indirect tax mix and progressivity",
          "Tax expenditure (the revenue forgone statement) as a hidden spending item",
        ], "compare", ["tax buoyancy vs elasticity", "tax expenditure India"]),
        L("finance-commission-devolution", "Finance Commission Transfers to the States", [
          "Article 280: what a Finance Commission actually recommends",
          "Vertical devolution versus horizontal sharing among states",
          "Tax devolution versus grants-in-aid, and why the mix matters for autonomy",
          "How GST compensation interacted with the devolution architecture",
        ], "hierarchy", ["Finance Commission devolution", "Article 280 UPSC"]),
      ]),
      topic("external-sector", "External Sector and Liberalisation", EXT, [
        L("balance-of-payments", "Reading India's Balance of Payments", [
          "Current account versus capital account: what belongs in each",
          "Trade balance, invisibles and remittances as current-account drivers",
          "How a BOP identity closes through reserves",
          "CAD as a share of GDP: the sustainability question, not a single number",
        ], "flow", ["balance of payments India", "current account deficit"]),
        L("exchange-rate-regimes", "Exchange Rate Policy: From Peg to Managed Float", [
          "The impossible trinity and which two India effectively chooses",
          "Managed float: what RBI intervening in the forex market is for",
          "REER versus NEER and when a REER appreciation is a competitiveness issue",
          "Why a sudden stop is a capital-account problem first",
        ], "compare", ["NEER REER UPSC", "impossible trinity India"]),
        L("forex-reserves", "Foreign Exchange Reserves: Adequacy and Cost", [
          "What Indian reserves are held in, conceptually",
          "Import cover and short-term debt cover as adequacy tests",
          "The opportunity cost of holding reserves",
          "Why reserve accumulation is not the same as a current-account surplus",
        ], "cards", ["forex reserves adequacy", "import cover India"]),
        L("liberalisation-1991", "The 1991 Reforms: What Changed in the Industrial Regime", [
          "Delicensing, de-reservation and the end of the licence-permit raj as industrial policy",
          "Trade opening: tariffs and quantitative restrictions as two different levers",
          "FDI policy as a capital-account counterpart to trade opening",
          "What did not change overnight: labour, land and agriculture",
        ], "timeline", ["1991 economic reforms UPSC", "LPG reforms India"]),
      ]),
      topic("agriculture", "Agriculture, MSP and Food Security", AGRI, [
        L("msp-and-procurement", "MSP: How It Is Set, Who It Reaches, What It Distorts", [
          "Commission for Agricultural Costs and Prices and the cost concepts it uses",
          "Procurement as the instrument that makes MSP operational for some crops",
          "Why MSP without procurement is an announcement, not a price floor",
          "Cropping-pattern effects of a wheat–rice procurement bias",
        ], "flow", ["MSP procurement UPSC", "CACP cost concepts"]),
        L("apmc-and-markets", "Agricultural Markets: APMC, Direct Marketing and e-NAM", [
          "What an APMC yard was designed to do, and how monopoly of first sale arose",
          "Market fees, commission agents and the wedge between farm-gate and retail",
          "e-NAM as a matching layer on top of yards, not a replacement for physical markets",
          "Why inter-state movement and stock limits keep coming back as policy tools",
        ], "compare", ["APMC mandi reform", "e-NAM agriculture"]),
        L("pds-and-food-security", "PDS and the Food Security Architecture", [
          "Procurement–storage–distribution as one chain, not three separate schemes",
          "NFSA: coverage as a category and why exclusion errors dominate inclusion errors in debate",
          "Open market sales and buffer norms as the FCI's two other jobs",
          "DBT in lieu of grain: the leak-versus-nutrition trade-off",
        ], "flow", ["NFSA PDS UPSC", "FCI buffer stocking"]),
        L("farm-subsidies", "Farm Subsidies: Fertiliser, Power, Credit and Income Support", [
          "Input subsidies versus output price support versus income transfers",
          "Why power and fertiliser subsidies show up as environmental as well as fiscal costs",
          "Decoupled income support as a category, without pinning a scheme's current amount",
          "WTO amber, blue and green boxes at the level the exam actually uses",
        ], "compare", ["farm subsidies UPSC", "WTO amber box India"]),
      ]),
      topic("industry-infra", "Industry, PLI and Infrastructure", INFRA, [
        L("industrial-policy-pli", "Industrial Policy after Liberalisation: PLI as an Instrument", [
          "Why production-linked incentives pay on incremental output, not on investment promises",
          "The infant-industry case and its time-consistency problem",
          "Ease of doing business as a complement, not a substitute, for a production subsidy",
          "Sunset clauses: what happens if they are not credible",
        ], "cards", ["PLI scheme UPSC", "industrial policy India"]),
        L("msme-and-credit", "MSMEs: Definition, Credit and Delayed Payments", [
          "How MSMEs are classified (investment and turnover) as a framework",
          "Why formal credit underserves this segment even after priority-sector tagging",
          "Delayed payments from large buyers as a working-capital shock",
          "The productivity gap between registered and unregistered units",
        ], "flow", ["MSME classification India", "MSME credit UPSC"]),
        L("energy-infrastructure", "Energy: Mix, Markets and the Transition Constraint", [
          "Installed capacity versus generation: why the mix in GWh differs from GW",
          "Discom finances as the binding constraint on both RE offtake and thermal PPAs",
          "The merit-order dispatch idea and why must-run status matters",
          "Energy transition as a grid and storage problem, not only a generation problem",
        ], "hierarchy", ["power sector India UPSC", "discom finances"]),
        L("transport-and-logistics", "Ports, Roads, Rail and Logistics Cost", [
          "Why logistics cost as a share of GDP is a competitiveness variable",
          "Dedicated freight corridors and the rail–road split for bulk cargo",
          "Port connectivity and turnaround as trade-cost reducers",
          "PPP in roads: HAM versus BOT as risk-sharing models, conceptually",
        ], "compare", ["logistics cost India", "HAM vs BOT highways"]),
        L("investment-models", "Investment Models: Public, Private and PPP", [
          "Why the public sector still finances lumpy, long-gestation assets",
          "PPP: which risks belong with the concessionaire and which stay with the state",
          "Viability gap funding as a tool when user charges cannot recover cost",
          "Off-balance-sheet liabilities that PPPs can create for the government",
        ], "cards", ["PPP models UPSC", "viability gap funding"]),
      ]),
    ],
  },
];
