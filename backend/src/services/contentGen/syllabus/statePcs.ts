import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://legislative.gov.in/constitution-of-india",
  "https://panchayat.gov.in/",
  "https://fincomindia.nic.in/",
];

const POL = "General Studies — Indian Constitution, state executive and legislature, local bodies and public administration.";
const ECO = "General Studies — state public finance, fiscal federalism, scheme architecture, agriculture and rural development as implemented in a state.";
const SPEC = "General Studies — the compulsory state-specific module: a method for assembling facts from primary sources, not a list of any one state's schemes.";

export const STATE_PCS_CORPUS: SyllabusSubject[] = [
  {
    slug: "state-pcs-polity",
    name: "Polity & Public Administration",
    description:
      "The Constitution as it actually governs a state: Governor, legislature, local bodies, the Collector, and All-India Services. Look up your state's equivalent officers and Acts; do not memorise another state's organogram.",
    paper: "General Studies",
    sources: SRC,
    topics: [
      topic("governor-and-council", "The Governor and the State Executive (Arts 153–167)", POL, [
        L("governor-office-153-159", "Governor: Appointment, Qualifications and Conditions of Office", [
          "Articles 153–159: one Governor per state (or more than one state), appointment by the President, term at pleasure, qualifications, oath, and the bar on holding another office of profit",
          "Article 160: how functions are discharged when the office is vacant or the Governor is unable to act",
          "Why the Governor is not elected, and why that design sits at the centre of Union–state tension",
          "Find your state's current Governor's office page for the warrant of appointment and oath text — never treat a news profile as the constitutional rule",
        ], "hierarchy", ["Article 153 Governor", "Article 155 156 157 158 159"]),
        L("state-executive-power-154-162", "Executive Power of the State (Arts 154 and 162)", [
          "Article 154: executive power of the state is vested in the Governor and is exercised by him directly or through officers subordinate",
          "Article 162: extent of executive power is co-extensive with the state's legislative competence, subject to Union laws on concurrent subjects",
          "Why 'vested in the Governor' does not mean personal government once a Council of Ministers is in office",
          "Map your state's allocation-of-business rules from the secretariat site; the Constitution does not name departments",
        ], "flow", ["Article 154", "Article 162 executive power of State"]),
        L("governor-discretion-163", "Aid, Advice and Discretion under Article 163", [
          "Article 163(1): a Council of Ministers to aid and advise, except where the Constitution requires the Governor to act in his discretion",
          "Article 163(2): the Governor's decision on whether a matter is discretionary is final and not justiciable as a question of fact",
          "The classic discretionary cluster: choosing a Chief Minister when no majority is clear, testing majority, reserving Bills, and reporting under Article 356",
          "Samsher Singh as the reading that aid-and-advice is the rule; do not pad a list of 'discretionary powers' from coaching notes",
        ], "compare", ["Article 163 discretion", "Samsher Singh Governor"]),
        L("cm-council-164-167", "Chief Minister, Council of Ministers and Article 167", [
          "Article 164: Chief Minister appointed by the Governor; other Ministers on the CM's advice; collective responsibility to the Legislative Assembly",
          "Article 164(1A) (91st Amendment): ministry size capped at 15 per cent of the Assembly's strength — apply the cap to your Assembly's present size, do not memorise another state's headcount",
          "Article 164(4): a Minister who is not a member of the legislature for six consecutive months ceases to be a Minister",
          "Article 167: the Chief Minister's duty to communicate decisions, to furnish information the Governor calls for, and to submit a matter to the Council if the Governor so requires",
        ], "hierarchy", ["Article 164 Council of Ministers", "Article 167 Chief Minister"]),
        L("governor-pardon-161", "Pardoning Power: Article 161 versus Article 72", [
          "Article 161: the Governor may grant pardons, reprieves, respites or remissions, or suspend, remit or commute sentences for offences against any law relating to a matter to which the executive power of the state extends",
          "Article 72 is the Union analogue; death sentences and offences against Union law sit with the President, not the Governor",
          "Pardon is an executive act, not a judicial sitting-in-appeal; courts review process, not the merits of mercy as a retrial",
          "Locate your state's home-department mercy petition rules; the article does not prescribe the file path",
        ], "compare", ["Article 161 pardon", "Article 72 vs 161"]),
        L("advocate-general-business-165-166", "Advocate-General and Conduct of Government Business", [
          "Article 165: Advocate-General appointed by the Governor from persons qualified to be a High Court judge; holds office during pleasure; rights of audience in the state's courts",
          "Article 166: all executive action is expressed to be taken in the name of the Governor; orders and instruments are authenticated as the rules of business prescribe",
          "Rules of business and allocation of business are the real organogram — pull them from your secretariat, not from a generic 'state administration' chapter",
          "The Advocate-General is not the Attorney-General; do not mix Articles 76 and 165",
        ], "cards", ["Article 165 Advocate General", "Article 166 rules of business"]),
      ]),
      topic("state-legislature", "The State Legislature", POL, [
        L("unicameral-bicameral-168-171", "Unicameral and Bicameral States (Arts 168–171)", [
          "Article 168: a state has a Legislative Assembly, and a Legislative Council only if the Constitution so provides for that state",
          "Article 169: Parliament may create or abolish a Council if the Assembly passes a resolution by a majority of the total membership and a two-thirds majority of members present and voting",
          "Article 171: Council composition by categories (Assembly nominees, local-body, graduates, teachers, Governor's nominees) — check whether your state has a Council at all before memorising seats",
          "A Council is not a Rajya Sabha clone: it cannot reject a Money Bill and can only delay ordinary legislation",
        ], "compare", ["Article 169 Legislative Council", "Article 171 composition"]),
        L("assembly-sessions-officers-170-174", "Assembly Composition, Sessions and Officers", [
          "Article 170: Assembly composition and the 500-seat outer limit; actual strength is a Delimitation Act fact for your state, not a coaching average",
          "Articles 172 and 174: five-year duration unless sooner dissolved; the Governor summons, prorogues and dissolves",
          "Speaker and Deputy Speaker: election, resignation, removal, and the casting vote — same logic as the Lok Sabha, different House",
          "Find your Assembly's latest session calendar and rules of procedure; the Constitution does not write the question hour",
        ], "hierarchy", ["Article 170 Legislative Assembly", "Article 174 sessions"]),
        L("state-money-bills-198-199", "Money Bills in a State (Arts 198 and 199)", [
          "Article 199: what is a Money Bill in a state — taxation, borrowing, the Consolidated Fund, and the Speaker's certificate",
          "Article 198: a Money Bill originates only in the Assembly; a Council may recommend within fourteen days and the Assembly may accept or reject",
          "Why the Council's limited role on money is the operational difference between bicameralism at the Centre and in a state",
          "Read your state's latest Appropriation and Finance Bills from the Assembly site; do not quote another state's deficit as yours",
        ], "flow", ["Article 198 Money Bill", "Article 199 state Money Bill"]),
        L("state-legislative-procedure", "Ordinary Bills and the Council's Limited Power", [
          "Ordinary Bills may originate in either House where there is a Council; deadlock is not resolved by a joint sitting (that is a Parliament device under Article 108)",
          "If the Council rejects, amends unacceptably, or sits on a Bill, the Assembly can repass and send it on — the Council delays, it does not veto",
          "Governor's options after passage are Articles 200 and 201, not a fourth reading in the House",
          "Pull one ordinary Bill and one Money Bill from your Assembly's last session and trace each path; the contrast is the lesson",
        ], "compare", ["state legislative procedure", "no joint sitting in states"]),
        L("anti-defection-state-houses", "Anti-Defection in State Legislatures", [
          "The Tenth Schedule applies to state legislators: disqualification for voluntary resignation from the party or a vote contrary to the whip, subject to the merger exception",
          "The Speaker (or Chairman of the Council) decides; judicial review exists after Kihoto Hollohan, but it is not a substitute for the original decision",
          "91st Amendment: the one-third split exception is gone; merger requires two-thirds of the legislature party",
          "Do not memorise another state's recent floor-test drama as doctrine — the text is the Schedule plus the Supreme Court's reading",
        ], "cards", ["Tenth Schedule state legislature", "anti-defection Speaker"]),
      ]),
      topic("assent-and-reservation", "Assent, Withholding and Reservation (Arts 200–201)", POL, [
        L("bill-assent-200", "Article 200: Assent, Withholding and Return", [
          "Article 200: when a Bill passed by the state legislature is presented, the Governor may assent, withhold assent, return a non-Money Bill once for reconsideration, or reserve the Bill for the President",
          "If the House(s) repass a returned Bill, with or without amendment, the Governor shall not withhold assent — the second presentation closes the return option",
          "Withholding is not a pocket veto in the constitutional text; delay without a decision is the controversy the courts have had to police",
          "Ordinance-making under Article 213 is a separate power: it is not a way to enact a Bill the House has not passed",
        ], "flow", ["Article 200 Governor assent", "return of Bill Article 200"]),
        L("bill-reservation-201", "Article 201: Bills Reserved for the President", [
          "Article 201: a Bill reserved for the President is assented to, withheld, or (if not a Money Bill) returned to the state legislature with a message",
          "Mandatory reservation where a Bill would derogate from High Court powers is the one case the proviso to Article 200 itself flags",
          "Reservation is a federal check, not a second House; the President acts on Union advice",
          "When you meet a current reserved-Bill controversy, identify which limb of 200/201 is in play before taking a side",
        ], "compare", ["Article 201 reserved Bill", "Article 200 proviso High Court"]),
      ]),
      topic("local-bodies", "73rd and 74th Amendments", POL, [
        L("seventy-third-part-ix", "Part IX: Panchayats and the Gram Sabha", [
          "The 73rd Amendment inserted Part IX (Articles 243 to 243-O): three tiers at village, intermediate and district level, with the Gram Sabha as the foundation",
          "Direct elections, five-year term, and the bar on supersession without a fresh election in time are constitutional, not optional courtesy",
          "Reservation of seats and chairperson offices for SCs, STs and women (not less than one-third) is in the text — your state's rotation rules are in its Panchayati Raj Act",
          "Start from panchayat.gov.in and your state's PR Act; do not treat a neighbouring state's three-tier names as universal",
        ], "hierarchy", ["73rd Amendment Part IX", "Gram Sabha Article 243A"]),
        L("eleventh-schedule-devolution", "Eleventh Schedule: Listing Is Not Devolution", [
          "The Eleventh Schedule lists twenty-nine subjects; listing does not itself transfer funds, functions and functionaries",
          "Activity mapping and the state's conformity Act decide what a Gram Panchayat actually does; many states list more than they devolve",
          "Parallel bodies and centrally sponsored schemes that bypass the panchayat are the usual reason devolution looks strong on paper and weak on the ground",
          "For your state: open the PR Act's functional schedule and the latest State Finance Commission report, not a generic '29 subjects' mnemonic",
        ], "compare", ["Eleventh Schedule devolution", "funds functions functionaries"]),
        L("sec-and-sfc-243", "State Election Commission and State Finance Commission", [
          "Article 243K: superintendence, direction and control of panchayat elections vest in a State Election Commission; the SEC is not the Election Commission of India",
          "Article 243-I: a State Finance Commission at five-year intervals to review the financial position of panchayats and recommend distribution of taxes, duties, tolls and grants",
          "The Union Finance Commission's local-body grants ride on the SFC's existence and on the state's own devolution — two commissions, two mandates",
          "Find your SEC's latest panchayat/municipal election notification and your SFC's latest report; dates and names change, the articles do not",
        ], "cards", ["Article 243K State Election Commission", "Article 243-I State Finance Commission"]),
        L("seventy-fourth-part-ixa", "Part IXA: Municipalities and the Twelfth Schedule", [
          "The 74th Amendment inserted Part IXA: Nagar Panchayat, Municipal Council and Municipal Corporation as the three constitutional classes",
          "Twelfth Schedule lists eighteen functions; again, listing is not devolution — property tax, user charges and assigned revenues are the real fiscal test",
          "Ward committees (Article 243S) in larger municipalities are the urban analogue of proximity that the Gram Sabha provides in villages",
          "Read your state's municipal Act for the names and population cut-offs actually used; the Constitution does not name your city corporation",
        ], "hierarchy", ["74th Amendment Part IXA", "Twelfth Schedule municipalities"]),
        L("dpc-mpc-scheduled-areas", "District and Metropolitan Planning; Scheduled Areas", [
          "Article 243ZD: a District Planning Committee consolidates panchayat and municipal plans into a draft district development plan",
          "Article 243ZE: a Metropolitan Planning Committee for metropolitan areas — check whether your state has notified any, rather than assuming the article populates itself",
          "Article 243M: Part IX does not apply of its own force to Scheduled Areas and certain north-eastern states; PESA and state Acts fill the gap where Parliament so provides",
          "If your state has Fifth or Sixth Schedule areas, the local-body question is PESA/ADC first, Part IX second — do not paste a plains organogram onto them",
        ], "flow", ["Article 243ZD DPC", "Article 243M Scheduled Areas"]),
      ]),
      topic("district-and-ais", "District Administration and All-India Services", POL, [
        L("district-collector-three-hats", "The District Collector's Three Hats", [
          "The Collector is a statutory and administrative office, not a constitutional one: revenue head, District Magistrate, and development coordinator",
          "Revenue: land records, mutation, acquisition process, disaster relief drawings from the district treasury",
          "Magisterial: preventive powers, licensing, and the law-and-order interface with the Superintendent of Police — the DM does not 'command' the police in the colonial sense everywhere; your state's police Act is the source",
          "Find your district's official handbook or gazetteer chapter on administration for the local titles (Collector / DM / DC) and subdivisions",
        ], "hierarchy", ["District Collector roles", "District Magistrate development"]),
        L("revenue-hierarchy-and-magistracy", "Revenue Hierarchy and the Police–Magistracy Interface", [
          "A typical chain is division → district → subdivision/tehsil → circle/riyatwari village — names differ; copy your state's revenue code, not a north-Indian default",
          "Record of rights, jamabandi/khatoni equivalents, and mutation are the prelims-dense facts; the exam rewards the local vocabulary",
          "Divisional Commissioner as the first appellate/supervisory tier where the state still uses the office",
          "Disaster management at district level sits on the Collector's development hat; the statute is the Disaster Management Act plus your state's DM plan",
        ], "flow", ["tehsil revenue hierarchy", "DM SP interface"]),
        L("all-india-services-312", "All-India Services under Article 312", [
          "Article 312: if the Rajya Sabha so resolves by two-thirds of members present and voting, Parliament may create an All-India Service common to the Union and the states",
          "IAS, IPS and the Indian Forest Service are the services so created; they are not 'central services' in the Article 312 sense",
          "Cadre is a state (or joint) cadre: the officer serves the state government on cadre posts and the Union on central deputation",
          "Do not recite another state's cadre strength; the rule is dual control, the numbers are in DoPT/cadre reviews",
        ], "cards", ["Article 312 All-India Services", "IAS IPS Forest Service"]),
        L("ais-cadre-dual-control", "Cadre Control: Union and State", [
          "Appointment, dismissal and the All-India Services Act framework sit with the Union; day-to-day posting, leave and departmentation sit with the state",
          "The state cannot dismiss an AIS officer; it can recommend and it can relieve from a cadre post subject to the rules",
          "Central deputation is not an escape from the cadre: tenure and the cooling-off rules are service-rule facts, not constitutional text",
          "When a prelims question says 'who controls the IAS', answer with the split, not with a single government",
        ], "compare", ["All-India Services dual control", "cadre versus central deputation"]),
      ]),
    ],
  },
  {
    slug: "state-pcs-economy",
    name: "Economy & Development",
    description:
      "State public finance after GST, Finance Commission transfers, state FRBM, CSS versus Central Sector, and agriculture/rural programmes as a state actually delivers them. Always localise numbers from your budget and the RBI study of state finances.",
    paper: "General Studies",
    sources: SRC,
    topics: [
      topic("state-gst-revenue", "State GST and Own Revenue", ECO, [
        L("gst-destination-dual-levy", "GST as a Destination Tax and the State's Slice", [
          "GST is a destination-based consumption tax: the consuming state, not the producing state, keeps the SGST on intra-state supply",
          "CGST + SGST on intra-state supply; IGST on inter-state supply, with a settlement mechanism that is meant to replicate destination",
          "The 101st Amendment and Article 246A are the competence provisions; Article 269A covers IGST",
          "Read your state's latest SGST outturn from the budget at a glance — a single year's print is not a trend",
        ], "flow", ["SGST destination principle", "CGST SGST IGST state"]),
        L("gst-council-279a", "GST Council: Composition and Voting", [
          "Article 279A: Union Finance Minister in the chair, Union Minister of State, and each state's Finance Minister",
          "Weighted voting: one-third Union, two-thirds states; a decision needs three-fourths of the weighted votes of members present and voting",
          "The Council recommends rates, exemptions and the model law; the legal levy is still by Union and state statutes",
          "Do not treat a Council press note as an amendment of the Constitution",
        ], "hierarchy", ["Article 279A GST Council", "GST Council weighted voting"]),
        L("state-own-tax-after-gst", "What States Still Tax after GST", [
          "Taxes subsumed into GST versus handles states kept: stamp duty and registration, excise on liquor, motor-vehicle taxes, and (where levied) electricity duty and property tax at the local level",
          "Own non-tax revenue: royalties on minerals, forestry receipts, user charges, interest and dividends — the mix is state-specific",
          "A state that looks 'GST-dependent' on the receipts side may still have a large stamp-duty or royalty story; read the budget, do not import another state's mix",
          "Find the 'own tax revenue / GSDP' table in your latest economic survey or in the RBI study of state finances",
        ], "cards", ["state own tax revenue after GST", "stamp duty liquor excise"]),
        L("gst-compensation-architecture", "Compensation: Design, Cess and What Remains", [
          "The original compensation design was a guaranteed revenue path for a fixed number of years, funded by a compensation cess on specified supplies",
          "Cess collections, back-to-back loans and the end of the guarantee period are three different instruments — do not collapse them into 'GST compensation'",
          "After the guarantee window, the fiscal question for a state is SGST buoyancy plus remaining cess earmarks, not a permanent top-up",
          "Cite the GST (Compensation to States) Act and Council decisions; do not memorise a year-specific rupee figure as if it were the law",
        ], "timeline", ["GST compensation cess", "GST compensation to states"]),
      ]),
      topic("finance-commission", "Finance Commission and Transfers", ECO, [
        L("article-280-finance-commission", "Article 280: What a Finance Commission Actually Does", [
          "Article 280: the President constitutes a Finance Commission every five years (or earlier) to recommend distribution of Union taxes, grants-in-aid, and related matters in the terms of reference",
          "Recommendations are recommendatory until the Union government lays an Action Taken Report and implements them; they are not self-executing law",
          "Vertical devolution is the states' share of the divisible pool; horizontal devolution is the split among states",
          "Read the latest Commission's report summary from fincomindia.nic.in; the formula changes with each Commission",
        ], "hierarchy", ["Article 280 Finance Commission", "vertical vs horizontal devolution"]),
        L("vertical-horizontal-devolution", "Divisible Pool, Criteria and Tax Effort", [
          "What enters the divisible pool (shareable Union taxes) versus what stays out (typically cesses and surcharges) is a first-order revenue fact for every state",
          "Horizontal criteria in recent Commissions have included population, area, income distance, forest and ecology, demographic performance and tax effort — weights are Commission-specific",
          "Income distance favours poorer states; tax effort and demographic performance are the 'reward' legs; know the logic, look up the current weights",
          "Never carry another state's share percentage as yours; the report has a state-wise table",
        ], "compare", ["Finance Commission horizontal criteria", "divisible pool cess surcharge"]),
        L("grants-275-and-local-body", "Article 275 Grants and Local-Body Grants", [
          "Article 275: grants-in-aid of revenues to such states as Parliament may determine, including specific-purpose and revenue-deficit grants when a Commission so recommends",
          "Local-body grants from the Union Finance Commission are distinct from the State Finance Commission's devolution inside the state",
          "Tied grants (health, rural roads, and the like in a given award) change the state's spending mix even when the headline devolution looks 'untied'",
          "For your state: open the latest FC report's grant annex and the state budget's receipt of 'grants from the Centre'",
        ], "flow", ["Article 275 grants-in-aid", "Finance Commission local body grants"]),
        L("cess-surcharge-outside-pool", "Why Cesses and Surcharges Matter to a State", [
          "A cess or surcharge that never enters the divisible pool shrinks the pie that Article 270 sharing can reach",
          "This is the structural complaint in fiscal federalism debates; it is not a claim that cesses are unconstitutional",
          "GST compensation cess is earmarked; other cesses may or may not be — read the levy's parent Act",
          "When a question asks 'why states feel squeezed despite a higher devolution percentage', this is the mechanism",
        ], "cards", ["cess surcharge divisible pool", "Article 270 shareable taxes"]),
      ]),
      topic("state-frbm-borrowing", "State FRBM and Borrowing", ECO, [
        L("state-frbm-law", "State FRBM: Targets, Escape Clauses and Off-Budget Borrowing", [
          "Each state has its own FRBM (or equivalent) statute setting deficit and debt paths; there is no single 'state FRBM number' for India",
          "Escape clauses and additional borrowing windows (including those linked to power-sector or capex conditions in a given year) are notified, not implied",
          "Guarantees, special-purpose vehicles and unpaid dues of state utilities are how a headline deficit can look compliant while risk accumulates",
          "Open your state's FRBM Act and the latest fiscal-policy statement in the budget; quote those targets, not a neighbour's",
        ], "timeline", ["state FRBM Act", "off-budget borrowing states"]),
        L("article-293-state-borrowing", "Article 293: State Borrowing and Union Consent", [
          "Article 293: a state may borrow within India upon the security of its Consolidated Fund, subject to any limit the state legislature fixes",
          "If any Union loan (or guarantee) is outstanding, the state needs the Union government's consent to raise a fresh loan; consent may be conditional",
          "This is the constitutional hook for Union conditions on state borrowing; it is not a general veto over an unindebted state",
          "Net borrowing ceilings communicated each year are an administrative overlay — check the latest letter, do not treat last year's ceiling as the article",
        ], "flow", ["Article 293 state borrowing", "Union consent state loans"]),
        L("reading-state-deficits", "Reading a State Budget: Deficits and the Public Account", [
          "Revenue, fiscal and primary deficit on the state accounts use the same logic as the Union; the trap is mixing GSDP ratios with rupee levels",
          "Consolidated Fund, Contingency Fund and Public Account of the state (Articles 266 and 267) — small savings and provident funds in the Public Account are not 'free revenue'",
          "The RBI's annual study of state finances is the comparable cross-state source; your economic survey is the local one",
          "Never memorise a deficit print without the year and whether it is BE, RE or actual",
        ], "compare", ["state fiscal deficit GSDP", "Public Account of the state"]),
      ]),
      topic("css-versus-cs", "Centrally Sponsored versus Central Sector", ECO, [
        L("css-versus-central-sector", "CSS versus Central Sector: Who Pays and Who Runs", [
          "Central Sector schemes: fully Union-funded and typically Union-implemented (or implemented through Union agencies)",
          "Centrally Sponsored Schemes: Union–state cost sharing, implemented by the state machinery, often on a 'core / core-of-the-core / optional' classification that has changed with budget reforms",
          "The sharing ratio is not always 60:40; Himalayan and NE states often have a different notified ratio — look up your category, do not assume the general ratio",
          "A scheme's name on a state portal does not tell you the funding pattern; the ministry guidelines do",
        ], "compare", ["CSS vs Central Sector", "centrally sponsored cost sharing"]),
        L("cost-sharing-and-sna", "Fund Flow, SNA and Utilisation Certificates", [
          "Single Nodal Agency accounts and just-in-time release are meant to cut parking of Union funds in state treasuries",
          "The state's matching share, treasury processes and utilisation certificates are where implementation actually stalls",
          "DBT and beneficiary databases are plumbing, not a separate 'scheme'; duplication with a state's own top-up is the usual audit finding",
          "For any scheme you revise: write objective, statutory basis, funding pattern, implementing department, and the state top-up if any — leave the rupee figure to the current guidelines",
        ], "flow", ["single nodal agency SNA", "utilisation certificate CSS"]),
        L("scheme-template-not-names", "A Template Instead of a List of Scheme Names", [
          "Do not memorise another state's branded welfare names; they will not appear in your paper and will crowd out the template",
          "Buckets that almost every state fills: food/livelihood, farm input or income support, health insurance or public health, housing, skilling, women and child, social pensions",
          "For each bucket, find your state's equivalent on the department site and fill the template; that is the state-specific paper, not this page",
          "Convergence and double-counting of the same beneficiary across CSS and state schemes is a standard mains evaluation point",
        ], "cards", ["how to find your state's equivalent scheme", "CSS state top-up template"]),
      ]),
      topic("agri-rural-state", "Agriculture and Rural Development at State Level", ECO, [
        L("agriculture-as-state-list-work", "Agriculture as State-List Work with Union Overlays", [
          "Agriculture is a State List subject; MSP, FCI procurement and many CSS overlays are Union instruments that a state chooses how far to plug into",
          "Irrigation, extension, APMC/market reform and land records are where the state is the real principal; names of market yards and water-resource departments are local",
          "Cropping pattern and irrigation source for your state come from the agricultural statistics handbook, not from an all-India pie chart",
          "When a question asks 'issues of farmers in the state', answer with agro-climatic zone, water, and market access — not with a national slogan",
        ], "hierarchy", ["agriculture State List", "MSP procurement state role"]),
        L("rural-development-state-delivery", "Rural Development: State Delivery of National Frames", [
          "Employment guarantee, rural housing, rural roads and livelihoods missions are typically CSS frames delivered by the state's rural-development and panchayat departments",
          "The Gram Panchayat and the Gram Sabha are the intended last-mile; parallel societies and line departments are why last-mile looks different on the ground",
          "Social audit, job-card/job-record equivalents and geo-tagging are the verification tools — find the names your state uses",
          "Do not quote another state's wage notification or house-unit cost; open your RD department's current order",
        ], "flow", ["rural development state implementation", "panchayat last mile CSS"]),
      ]),
    ],
  },
  {
    slug: "state-pcs-state-specific",
    name: "State-Specific Preparation",
    description:
      "A repeatable method for the compulsory state module: four GK buckets, census tables, GI and culture, and the prelims–mains–interview scheme. Never paste another state's facts; always find your equivalent source.",
    paper: "General Studies",
    sources: SRC,
    topics: [
      topic("four-bucket-method", "The Four-Bucket GK Method", SPEC, [
        L("four-bucket-gk-method", "Four Buckets: History, Geography, Polity, Economy", [
          "Every state paper's local component collapses into four buckets: history and heritage; geography and resources; polity and administration; economy and schemes",
          "Build one working notebook per bucket with a fixed source list; do not start with random current-affairs PDFs",
        "Geography and resources (bucket 2) are executed through census tables and a district-map drill — not through a copied neighbouring-state chapter",
          "A fact without a primary source (gazetteer, census table, budget, Act, or official portal) does not enter the notebook",
        ], "cards", ["state PCS four bucket method", "state-specific GK method"]),
        L("bucket-history-heritage", "History and Heritage — How to Localise", [
          "Build a one-page chronology from earliest archaeological evidence to reorganisation/state formation, using the state board textbook and the district gazetteers",
          "National-movement chapter: only events, organisations and people with a documented footprint in your state — not a copy of the all-India timeline",
          "Monuments, inscriptions and museums as a names-and-sites checklist; the ASI and state archaeology department are the sources, not travel blogs",
          "If a neighbouring state's dynasty is taught in your board book, keep it; if it is not, do not import it to look thorough",
        ], "timeline", ["state history chronology method", "district gazetteer heritage"]),
        L("bucket-polity-admin", "Polity and Administration — How to Localise", [
          "Assembly size, whether a Council exists, reserved seats, and the current delimitation order — all from the Assembly and CEO sites",
          "Secretariat departments, the revenue hierarchy's local names, and the police range/district map from the state's own organogram",
          "SEC, SPSC, SIC, Human Rights Commission, Lokayukta/Lokayukta-equivalent: existence, appointing authority, and the parent Act — not a copied list from another state",
          "Special constitutional provisions (Fifth/Sixth Schedule, Part XXI, hill councils) apply only if they actually apply to your state",
        ], "hierarchy", ["state administration organogram", "how to find your state's commissions"]),
        L("bucket-economy-schemes", "Economy and Schemes — How to Localise", [
          "GSDP sectoral shares, per-capita income trend, and the latest fiscal-deficit/GSDP print from the state economic survey and the RBI study — year-stamped",
          "Scheme work is the template from the CSS page, filled with your departments' current guidelines; do not harvest branded names from another state",
          "PSUs, mineral royalties and power-utility losses are often the real fiscal story; they hide in the budget's statements, not in the highlights pamphlet",
          "Human-development indicators: compare your state with the all-India figure from the same table, never with an unsourced rank list",
        ], "flow", ["state economic survey method", "how to find your state's equivalent scheme"]),
      ]),
      topic("census-tables", "Census Tables as a Method", SPEC, [
        L("census-tables-method", "How to Read Census Tables for a State Paper", [
          "Population, decadal growth, density, sex ratio, literacy, urban share, SC/ST share, and workforce participation are table facts, not essay opinions",
          "Always take the same census year across districts; mixing 2001 and 2011 (or a later official update) is the usual error",
          "Census definitions (urban, household, main/marginal worker, literacy) matter more than a rank; the question often tests the definition",
          "Primary source is the census tables for your state; a coaching compilation is a index, not a source",
        ], "cards", ["census tables state PCS", "literacy sex ratio density"]),
        L("district-demography-drill", "District-Level Drill from the Same Tables", [
          "Highest/lowest density, literacy and sex ratio districts are standard prelims items — make the table once, revise the extremes, ignore the middle",
          "Aspirational or notified backward districts, if your state uses such a list, come from a government order, not from memory of a newspaper map",
          "Migration: the census migration tables plus the economic survey's labour chapter; do not invent a 'largest migrant stream' without the table",
          "Redraw the district map from memory monthly; map questions punish approximation",
        ], "hierarchy", ["district census drill", "state district map PCS"]),
        L("urban-rural-census-categories", "Urban Categories, Census Towns and Municipal Status", [
          "Statutory town versus census town is a definition question; municipal status comes from the state's municipal Act, not from the census urban flag",
          "Class-size of towns and the metropolitan/UA idea: use the census urban agglomeration tables for your state",
          "The 74th Amendment's three classes will not match census town classes one-for-one — keep the two taxonomies separate",
          "Find your state's list of municipal corporations and the population cut-off it actually uses",
        ], "compare", ["census town vs statutory town", "urban agglomeration census"]),
      ]),
      topic("gi-and-culture", "GI Tags and Culture as a Method", SPEC, [
        L("gi-and-crafts-method", "Geographical Indications: A Checklist Method", [
          "GI is a statutory IP tag under the Geographical Indications of Goods Act; the registry list, not a tourism brochure, is the source",
          "For each GI: good, district/region, and the producer community if the registry names it — that is enough for prelims",
          "Do not memorise another state's GI list; export the registry filter for your state and update it the month before prelims",
          "Handicraft / agricultural / manufactured is the only classification worth carrying besides the name",
        ], "cards", ["GI tags method state PCS", "geographical indications registry"]),
        L("festivals-language-literature-method", "Festivals, Language and Literature without Lore", [
          "State-recognised official language(s) and script from the Official Language Act or notification, not from a cultural essay",
          "Literary milestones that appear in the state board book or Sahitya Akademi lists; keep dates only where the book gives them",
          "Festivals: a short list tied to an official calendar or gazetteer, with the district if the festival is regional — skip undated folklore",
          "Folk dance, music and theatre forms: one-line identifier plus district; if you cannot source it, it does not go in the sheet",
        ], "timeline", ["state official language method", "folk arts state PCS"]),
        L("gazetteers-monuments-method", "Gazetteers, Monuments and the Names Sheet", [
          "Imperial/district gazetteers and the state gazette are the anti-lore filter: if a 'first' or a 'largest' is not there, treat it as unsafe",
          "ASI-protected and state-protected monuments as two lists; UNESCO inscriptions as a third, tiny list",
          "One revision sheet of names, sites and districts beats narrative history for prelims",
          "Mains: one heritage paragraph is enough; the rest of the answer should use the polity or economy bucket the question actually asked",
        ], "flow", ["district gazetteer method", "ASI monuments state list"]),
      ]),
      topic("exam-scheme", "Prelims, Mains and Interview", SPEC, [
        L("prelims-mains-interview-scheme", "Three Stages: Read This Year's Notification", [
          "State commissions differ on papers, optionals, language papers, negative marking and interview weight — last year's scheme is not this year's",
          "Prelims: usually an objective GS paper plus a qualifying aptitude/CSAT-like paper; confirm the qualifying mark and whether negatives apply",
          "Mains: essay, GS papers, a language paper, and an optional only if the commission still has one; word limits and paper hours are in the notification",
          "Final merit: some commissions add prelims, most do not; never assume the UPSC formula",
        ], "hierarchy", ["state PCS exam scheme", "prelims mains interview notification"]),
        L("language-paper-and-notification", "Language Paper, Interview and the Official PDF", [
          "A qualifying language paper still eliminates; precis, translation, letter/report and grammar are skills, not GS leftover time",
          "Interview weight and the list of documents are commission-specific; temperament plus the four-bucket notebook is the content",
          "Every cycle: download the official notification and syllabus PDF from the commission site on day one; coaching summaries lag and omit language rules",
          "Build a one-page differences sheet versus UPSC (papers, optionals, language, negatives, interview) so you do not leak UPSC habits into a state paper",
        ], "cards", ["state PCS language paper", "state public service commission notification"]),
      ]),
    ],
  },
];
