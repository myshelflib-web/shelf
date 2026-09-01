import type { StarterSubject } from "../types.js";

const CONSTITUTION = "https://legislative.gov.in/constitution-of-india";
const PANCHAYAT = "https://panchayat.gov.in/";
const MOHUA = "https://mohua.gov.in/";
const FINCOM = "https://fincomindia.nic.in/";
const RBI = "https://www.rbi.org.in/";
const CENSUS = "https://censusindia.gov.in/";
const INDIA_GOV = "https://www.india.gov.in/";
const DOPT = "https://dopt.gov.in/";

export const STATE_POLITY: StarterSubject = {
  slug: "state-pcs-polity",
  name: "Polity & Public Administration",
  description:
    "The state executive, legislature, local bodies and field administration as State PCS General Studies asks them.",
  paper: "General Studies",
  topics: [
    {
      slug: "state-government",
      title: "The State Executive and Legislature",
      articles: [
        {
          slug: "governor-and-the-state-executive",
          title: "The Governor: Appointment, Powers and Assent to Bills",
          syllabusAnchor:
            "State GS — Indian Constitution: the State Executive; Governor, Chief Minister and Council of Ministers, powers and position.",
          mustCover: [
            "Articles 153-156: one Governor for each state, appointment by warrant of the President, and holding office during the President's pleasure",
            "Articles 157-159: qualifications, conditions of office, and the oath administered by the Chief Justice of the High Court",
            "Article 161: power to pardon, remit and commute, and why it does not reach death sentences or court-martial cases",
            "Article 163: aid and advice as the rule, and the clause carving out matters the Governor must decide in discretion",
            "Article 164: appointing the Chief Minister, the 15 per cent ministry-size cap added by the 91st Amendment, and the six-month rule in 164(4)",
            "Articles 165-167: the Advocate General, rules of business, and the Chief Minister's duty to furnish information",
            "Article 200: assent, withholding assent, returning a non-money bill for reconsideration, and reserving a bill for the President",
            "Article 201: what the President may do with a reserved bill, and why reconsideration by the House does not compel assent",
            "The recurring Raj Bhavan friction: delay in acting on bills, summoning and floor tests, and the report that precedes Article 356",
          ],
          worked: [
            "Trace one ordinary state bill from passage to assent under Article 200, marking every branch the Governor may take and what follows each",
          ],
          traps: [
            "Treating every act of the Governor as discretionary — Article 163 makes aid and advice the rule",
            "Merging Article 200 reservation with the Article 201 stage, which is the President's decision and not the Governor's",
            "Assuming the state has a joint sitting or an identical pocket veto; neither follows from Articles 200 and 201",
          ],
          officialSources: [CONSTITUTION],
          diagram: "flow",
          keywords: [
            "Governor powers Article 163",
            "Article 200 assent to bills",
            "state executive State PCS",
            "reservation of bills Article 201",
          ],
          order: 0,
        },
        {
          slug: "state-legislature-and-council",
          title: "State Legislature: Assembly, Council and Money Bills",
          syllabusAnchor:
            "State GS — State legislature: structure, functioning, conduct of business, powers and privileges.",
          mustCover: [
            "Article 168: what a state legislature consists of, and why only some states are bicameral",
            "Article 169: creating or abolishing a Legislative Council by an Act of Parliament on a special-majority resolution of the Assembly",
            "Article 170: Assembly strength between 60 and 500, filled by direct election from territorial constituencies",
            "Article 171: Council strength capped at one-third of the Assembly with a floor of 40, and its five electoral segments including nomination by the Governor",
            "Article 172: the five-year Assembly term against a permanent Council with one-third retiring every two years",
            "Articles 197-198: the Council can only delay an ordinary bill, and there is no joint sitting at state level",
            "Article 199: the money bill definition, the Speaker's certificate, and the Council's 14-day return window",
            "Articles 202-207: annual financial statement, demands for grants, appropriation, and the Governor's recommendation for financial bills",
          ],
          worked: [
            "Run an ordinary bill and a money bill through both Houses side by side, marking exactly where the Council's power differs",
          ],
          traps: [
            "Applying the Article 108 joint sitting to states; that device exists only for Parliament",
            "Treating Article 169 as a constitutional amendment under Article 368 rather than ordinary law plus an Assembly resolution",
            "Assuming a Legislative Council can reject a money bill instead of merely delaying it",
          ],
          officialSources: [CONSTITUTION],
          diagram: "compare",
          keywords: [
            "Legislative Council Article 169",
            "money bill Article 199",
            "state legislature powers",
            "bicameral state legislature India",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "local-government",
      title: "Panchayati Raj and Urban Local Bodies",
      articles: [
        {
          slug: "panchayati-raj-73rd-amendment",
          title: "73rd Amendment: Panchayati Raj Structure and Devolution",
          syllabusAnchor:
            "State GS — Panchayati Raj institutions: constitutional provisions, structure, powers and problems of rural local self-government.",
          mustCover: [
            "Part IX, Articles 243 to 243-O, in force from 24 April 1993",
            "Article 243A: the Gram Sabha as the body of registered voters of a village, and what a state law may empower it to do",
            "Article 243B: the three-tier structure, and the exemption from an intermediate tier for states below twenty lakh population",
            "Article 243D: reservation of seats and chairperson posts for Scheduled Castes and Scheduled Tribes, and not less than one-third for women",
            "Article 243E: the five-year term and the duty to hold elections before expiry or within six months of dissolution",
            "Article 243G with the Eleventh Schedule: the 29 subjects a state may devolve, and why devolution is enabling rather than automatic",
            "Articles 243H and 243I: panchayat taxes and grants, and the State Finance Commission constituted every five years",
            "Article 243K: the State Election Commission, and how its independence compares with the Election Commission of India",
            "Article 243M and the PESA Act 1996, which extends Part IX to Fifth Schedule areas with modifications",
          ],
          worked: [
            "Pick three Eleventh Schedule subjects and check in your own state's panchayati raj act whether funds, functions and functionaries have actually moved",
          ],
          traps: [
            "Saying the Eleventh Schedule transfers 29 subjects by itself — Article 243G leaves the transfer to the state legislature",
            "Confusing the State Election Commission under Article 243K with the Election Commission of India under Article 324",
            "Treating the Gram Sabha as an elected body; it is the entire electorate of the village",
          ],
          officialSources: [CONSTITUTION, PANCHAYAT],
          diagram: "hierarchy",
          keywords: [
            "73rd Amendment Part IX",
            "Eleventh Schedule subjects",
            "State Finance Commission panchayat",
            "panchayati raj State PCS notes",
          ],
          order: 0,
        },
        {
          slug: "municipalities-74th-amendment",
          title: "74th Amendment: Municipalities and Planning Committees",
          syllabusAnchor:
            "State GS — Urban local bodies: constitutional provisions, types of municipalities, functions and municipal finance.",
          mustCover: [
            "Part IXA, Articles 243P to 243ZG, with the Twelfth Schedule listing 18 subjects",
            "Article 243Q: Nagar Panchayat for a transitional area, Municipal Council for a smaller urban area, Municipal Corporation for a larger urban area, specified by the Governor",
            "Article 243S: ward committees made mandatory in municipalities with a population of three lakh or more",
            "Article 243W: functions and powers, in the same enabling language as Article 243G",
            "Articles 243Y and 243ZA: the State Finance Commission and State Election Commission cover municipalities as well",
            "Article 243ZD: the District Planning Committee consolidating panchayat and municipal plans into a district plan",
            "Article 243ZE: the Metropolitan Planning Committee for metropolitan areas of ten lakh or more",
            "Why municipal finance stays weak: a narrow own-revenue base, dependence on transfers, and parastatals that retain planning and service functions",
          ],
          worked: [
            "Compare the three municipality types on the criteria that decide classification, the functions actually devolved, and who holds planning powers",
          ],
          traps: [
            "Assuming the population thresholds for classification are fixed nationally; the Governor specifies them for the state",
            "Mixing up the District Planning Committee with the Metropolitan Planning Committee and their triggering conditions",
          ],
          officialSources: [CONSTITUTION, MOHUA],
          diagram: "compare",
          keywords: [
            "74th Amendment Part IXA",
            "Twelfth Schedule functions",
            "district planning committee 243ZD",
            "urban local bodies State PCS",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "public-administration",
      title: "District Administration and the Services",
      articles: [
        {
          slug: "district-administration-and-collector",
          title: "District Administration and the Office of the Collector",
          syllabusAnchor:
            "State GS — Public administration: district administration, the role of the Collector, and field-level coordination.",
          mustCover: [
            "The three strands the office carries: revenue collection, executive magistracy and development coordination",
            "Land revenue and land records work under the state land revenue code, and the Collector's role in acquisition and compensation under the 2013 land acquisition law",
            "Executive magistracy: preventive and prohibitory powers under the criminal procedure code as re-enacted in the Bharatiya Nagarik Suraksha Sanhita 2023",
            "Election duties as District Election Officer and Returning Officer under the Representation of the People Act 1951",
            "Chairing the District Disaster Management Authority under the Disaster Management Act 2005",
            "Coordination with the Superintendent of Police, and the dual-control arrangement inherited from the Police Act 1861",
            "The tiers around the office: division, district, sub-division and tehsil, alongside district-level line departments",
            "Why the development role has thinned as missions, parastatals and district societies took over scheme delivery",
          ],
          worked: [
            "Map one district-level emergency or scheme rollout and list every officer and tier the Collector must coordinate with",
          ],
          traps: [
            "Calling the Collector the head of the district police; operational police powers rest with the Superintendent of Police",
            "Assuming the designation is uniform — Collector, District Magistrate and Deputy Commissioner name different roles of the same officer",
          ],
          officialSources: [INDIA_GOV],
          diagram: "hierarchy",
          keywords: [
            "role of district collector",
            "district administration India",
            "district magistrate powers",
            "public administration State PCS",
          ],
          order: 0,
        },
        {
          slug: "state-services-and-all-india-services",
          title: "State Civil Services and the All-India Services",
          syllabusAnchor:
            "State GS — State services, the State Public Service Commission, and the relationship between the state and the All-India Services.",
          mustCover: [
            "Article 312: creating a new All-India Service needs a Rajya Sabha resolution supported by two-thirds of members present and voting",
            "The All India Services Act 1951 and the services constituted under it, with cadres allocated to states",
            "Dual control in practice: state cadre postings, central deputation, and the concurrence the state must give",
            "Where disciplinary authority sits: the state initiates, but major penalties for All-India Service officers rest with the Centre",
            "Articles 315-317: constitution of the State Public Service Commission, appointment by the Governor, and removal only by the President on a Supreme Court reference",
            "Article 320: the Commission's advisory functions on recruitment, promotion and disciplinary matters, and the effect of departing from its advice",
            "Article 311: safeguards against dismissal, removal and reduction in rank, and the exceptions to the inquiry requirement",
            "Promotion of state civil service officers into the Indian Administrative Service through the selection committee process",
          ],
          worked: [
            "Compare a state service officer with an All-India Service officer on recruitment route, cadre, disciplinary authority and career ceiling",
          ],
          traps: [
            "Assuming the Governor can remove a State Public Service Commission member; only the President can, after a Supreme Court inquiry",
            "Treating the Commission's advice as binding rather than advisory with a reporting obligation",
          ],
          officialSources: [CONSTITUTION, DOPT],
          diagram: "compare",
          keywords: [
            "All India Services Article 312",
            "State Public Service Commission Article 315",
            "state civil services cadre",
            "Article 311 protection",
          ],
          order: 1,
        },
      ],
    },
  ],
};

export const STATE_ECONOMY: StarterSubject = {
  slug: "state-pcs-economy",
  name: "Economy & Development",
  description:
    "State finances after GST, budget and debt, and how central and state schemes actually reach the district.",
  paper: "General Studies",
  topics: [
    {
      slug: "state-finances",
      title: "State Finances and Central Transfers",
      articles: [
        {
          slug: "state-revenue-after-gst",
          title: "State Revenue after GST: Own Taxes and Transfers",
          syllabusAnchor:
            "State GS — State finances: sources of revenue, tax reform, and Centre-state financial relations.",
          mustCover: [
            "The 101st Amendment: Article 246A on concurrent taxing power, Article 269A on inter-state supply, and Article 279A on the GST Council",
            "What GST subsumed, and what stayed with states — state excise on alcohol for human consumption and sales tax on the five excluded petroleum products",
            "The remaining own tax heads: stamp duty and registration fees, taxes on vehicles, electricity duty and land revenue",
            "Own non-tax revenue: mineral royalties, interest receipts, dividends from state undertakings, and user charges",
            "The compensation guarantee under the GST (Compensation to States) Act 2017 and the end of the five-year window in June 2022",
            "Article 270 and the divisible pool, and why cesses and surcharges outside it matter to states",
            "Article 280: how the Finance Commission fixes the vertical share and the horizontal criteria used to distribute it",
            "Article 275 grants-in-aid, including revenue deficit grants and sector-specific and state-specific grants",
            "How to locate your own state's revenue mix from its receipts budget and from the RBI study of state budgets",
          ],
          worked: [
            "Split your own state's latest revenue receipts into own tax, own non-tax, devolution and grants, and identify which line is most volatile",
          ],
          traps: [
            "Counting cess and surcharge collections as shareable; they sit outside the divisible pool",
            "Saying GST replaced every state indirect tax when alcohol and the five petroleum products remained outside it",
          ],
          officialSources: [FINCOM, RBI],
          diagram: "hierarchy",
          keywords: [
            "state own tax revenue GST",
            "Finance Commission devolution",
            "grants in aid Article 275",
            "state finances State PCS",
          ],
          order: 0,
        },
        {
          slug: "state-budget-and-liabilities",
          title: "State Budget, FRBM Limits and Off-Budget Debt",
          syllabusAnchor:
            "State GS — State budget, fiscal responsibility legislation, public debt and contingent liabilities.",
          mustCover: [
            "Article 202 annual financial statement, Article 203 voting of demands, Article 204 appropriation bill and Article 205 supplementary grants",
            "Article 266 Consolidated Fund and Public Account of the state, and the Contingency Fund under Article 267(2)",
            "The budget documents a candidate should be able to open: budget at a glance, receipts budget, demands for grants and the fiscal policy statements",
            "The revenue and capital split, and why a revenue deficit is treated as more serious than the headline fiscal deficit",
            "State fiscal responsibility legislation: the deficit path, the debt anchor, and additional borrowing space tied to conditions",
            "Article 293(3): the Centre's consent for state borrowing while a central loan remains outstanding",
            "Off-budget borrowing by state undertakings serviced from the budget, and its treatment against the borrowing ceiling",
            "Guarantees and other contingent liabilities, and power distribution company losses and dues, including the reform attempted through UDAY in 2015",
          ],
          worked: [
            "Open your own state's budget at a glance and reconstruct the three deficit indicators and the debt-to-GSDP ratio from it",
          ],
          traps: [
            "Using revenue deficit and fiscal deficit as interchangeable terms",
            "Assuming off-budget borrowing does not count as state debt when borrowing limits now treat it as such",
          ],
          officialSources: [RBI, CONSTITUTION],
          diagram: "flow",
          keywords: [
            "state budget Article 202",
            "state FRBM act deficit",
            "Article 293 state borrowing",
            "off budget borrowing states",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "development-and-schemes",
      title: "Schemes, Agriculture and Rural Delivery",
      articles: [
        {
          slug: "centrally-sponsored-vs-central-sector",
          title: "Centrally Sponsored and Central Sector Schemes",
          syllabusAnchor:
            "State GS — Government schemes: design, funding pattern and implementation at state and district level.",
          mustCover: [
            "Central sector schemes: fully funded by the Union, on Union subjects, implemented largely through central agencies",
            "Centrally sponsored schemes: shared funding on subjects in the State List, implemented through state machinery",
            "The standard cost-sharing ratio for general states, the more favourable ratio for North Eastern and Himalayan states, and full central funding for union territories without a legislature",
            "The post-2015 rationalisation into core of the core, core and optional schemes, and what the core of the core protects",
            "Fund flow through the single nodal agency and just-in-time release on the public financial management system",
            "Why the state share must be budgeted, and what happens to delivery when releases are delayed at either end",
            "Agriculture as Entry 14 and agricultural markets as Entry 28 of the State List, and the model marketing law a state may choose to adopt",
            "Rural delivery machinery: the district rural development agency, the zila parishad and gram panchayats as implementing units",
            "How to locate your own state's equivalent scheme for a central scheme, and how to compare coverage, outlay and delivery agency",
          ],
          worked: [
            "Take one centrally sponsored scheme, state its funding split, and trace the money from central release to the last-mile implementing agency",
          ],
          traps: [
            "Calling every scheme with a central name a central sector scheme",
            "Assuming a state may redesign a centrally sponsored scheme freely; the guidelines bind the shared component",
          ],
          officialSources: [INDIA_GOV, PANCHAYAT],
          diagram: "compare",
          keywords: [
            "centrally sponsored vs central sector",
            "scheme funding pattern 60 40",
            "single nodal agency scheme funds",
            "rural development schemes State PCS",
          ],
          order: 0,
        },
      ],
    },
  ],
};

export const STATE_SPECIFIC: StarterSubject = {
  slug: "state-pcs-state-specific",
  name: "State-Specific Preparation",
  description:
    "A repeatable method for building the state module from primary sources, and the exam craft the scheme demands.",
  paper: "General Studies",
  topics: [
    {
      slug: "building-state-gk",
      title: "Building the State Module",
      articles: [
        {
          slug: "state-module-buckets-and-sources",
          title: "Building a State Module: Four Buckets, Primary Sources",
          syllabusAnchor:
            "State GS — State-specific general studies: history, geography, polity, economy and current developments of the state.",
          mustCover: [
            "The four recurring buckets: history and heritage, geography and resources, polity and administration, economy and schemes",
            "History bucket: the ancient and medieval polities of the region, the freedom movement in the area, and how the present state was formed",
            "Geography bucket: physiography, rivers and irrigation, soils and crops, minerals, forests and protected areas",
            "Polity bucket: whether the legislature is bicameral, the state panchayati raj and municipal acts, state commissions, and any Article 371 provision that applies",
            "Economy bucket: composition of gross state domestic product, sectoral shares, workforce, and the departments that run flagship programmes",
            "Primary sources for economy data: the state Economic Survey and the budget at a glance, read chapter by chapter rather than through compilations",
            "Census tables at district level for population, literacy, sex ratio, urbanisation and worker classification",
            "State department portals, the state gazetteer and state statistical handbooks as the verification layer for one-line facts",
            "A revision discipline: one page per bucket, updated monthly, with the source and year noted beside every figure",
          ],
          worked: [
            "Build a one-page fact sheet for your own state using only its Economic Survey and Census tables, citing the table or chapter behind each figure",
          ],
          traps: [
            "Taking state facts from coaching compilations without checking the reference year",
            "Quoting decadal Census figures as if they were current estimates",
          ],
          officialSources: [CENSUS, INDIA_GOV],
          diagram: "hierarchy",
          keywords: [
            "state GK preparation method",
            "state Economic Survey reading",
            "Census district tables state",
            "State PCS state specific syllabus",
          ],
          order: 0,
        },
        {
          slug: "state-culture-and-heritage",
          title: "State Culture and Heritage the Way Papers Ask It",
          syllabusAnchor:
            "State GS — Art, culture, heritage, festivals, tribes and folk traditions of the state.",
          mustCover: [
            "Geographical indication tags: what the Geographical Indications of Goods Act 1999 protects, and how to list the registrations credited to your state",
            "Monuments: the difference between centrally protected monuments under the 1958 Act and monuments protected by the state archaeology department",
            "World Heritage inscriptions and tentative-list entries located in the state, and what each was inscribed for",
            "Festivals and fairs, tied to the agricultural or religious calendar that explains their timing",
            "Folk theatre, dance, music and painting traditions, and the artisan crafts associated with each region",
            "Scheduled Tribes notified for the state under Article 342, and whether Fifth Schedule areas are declared there",
            "Language and dialects of the state, and its literary or classical traditions",
            "The answer format that scores: one line to identify, one line to locate, one line for significance",
          ],
          worked: [
            "Prepare a ten-row table of heritage items from your own state with type, location and one distinguishing feature each",
          ],
          traps: [
            "Listing geographical indication tags without knowing the product category or which state holds the registration",
            "Assuming every notable monument is protected by the Archaeological Survey of India rather than the state",
          ],
          officialSources: [INDIA_GOV],
          diagram: "none",
          keywords: [
            "state art and culture PCS",
            "GI tags of states",
            "state festivals and folk dances",
            "tribes of the state Article 342",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "exam-craft",
      title: "Exam Scheme and Preparation Cycle",
      articles: [
        {
          slug: "state-pcs-scheme-and-cycle",
          title: "The State PCS Scheme and a Realistic Prep Cycle",
          syllabusAnchor:
            "State GS — Scheme of examination, syllabus coverage and preparation strategy for the state civil services examination.",
          mustCover: [
            "Prelims: a general studies paper plus an aptitude paper, and whether the aptitude paper is qualifying or counted in your commission's scheme",
            "Negative marking, commonly a fraction of the marks carried by each question — confirm the fraction from the notification rather than assuming it",
            "Mains: compulsory language papers, the essay, the general studies papers, and whether an optional subject still exists in your scheme",
            "Why the qualifying language papers still eliminate candidates, and how much writing practice they actually need",
            "The interview or personality test, with the detailed application form as its main input",
            "The heavier factual recall load compared with the national examination, and what that implies for revision frequency",
            "What transfers from national-level preparation: polity, economy, environment, modern history and general science",
            "What does not transfer: the state module, the language papers, and the state-weighted current affairs",
            "A workable cycle: the shared core through the year, the state module as a parallel weekly track, and full-length tests in the final quarter",
          ],
          worked: [
            "Place your own commission's notification beside the national syllabus and mark each paper as shared, partly shared or state-only",
          ],
          traps: [
            "Assuming every commission follows the national pattern; schemes differ on the optional subject and on the aptitude paper",
            "Leaving the state module to the last month, when it is the component that separates the merit list",
            "Skipping the compulsory language paper because it is only qualifying",
          ],
          officialSources: [INDIA_GOV],
          diagram: "flow",
          keywords: [
            "State PCS exam pattern",
            "state civil services mains papers",
            "UPSC and State PCS overlap",
            "State PCS preparation strategy",
          ],
          order: 0,
        },
      ],
    },
  ],
};
