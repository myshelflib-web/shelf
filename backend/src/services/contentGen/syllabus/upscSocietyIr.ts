import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://censusindia.gov.in/",
  "https://www.mea.gov.in/",
];

const SOC =
  "GS Paper I — Salient features of Indian Society, Diversity of India; Role of women and women's organisation, population and associated issues, poverty and developmental issues, urbanisation; Effects of globalisation on Indian society; Social empowerment, communalism, regionalism and secularism.";
const SJ =
  "GS Paper II — Welfare schemes for vulnerable sections; mechanisms, laws, institutions and Bodies for their protection; Issues relating to development and management of Social Sector/Services relating to Health, Education, Human Resources; Issues relating to poverty and hunger.";
const IR_N =
  "GS Paper II — India and its neighborhood- relations.";
const IR_G =
  "GS Paper II — Bilateral, regional and global groupings and agreements involving India and/or affecting India's interests; Effect of policies and politics of developed and developing countries on India's interests, Indian diaspora; Important International institutions, agencies and fora — their structure, mandate.";

export const UPSC_SOCIETY_IR_CORPUS: SyllabusSubject[] = [
  {
    slug: "upsc-society",
    name: "Indian Society & Social Justice",
    description:
      "GS I society and GS II social justice at topic granularity: diversity, demography, and the welfare architecture for vulnerable sections.",
    paper: "GS Paper I & II",
    sources: SRC,
    topics: [
      topic("diversity-and-cleavages", "Diversity, Caste and Identity Cleavages", SOC, [
        L("unity-in-diversity", "Indian Society: Unity, Diversity and the Binding Institutions", [
          "Linguistic, religious, caste, tribal and regional diversity as overlapping, not nested, cleavages",
          "Why 'unity in diversity' is a political project as well as a social description",
          "Joint family, village, caste and now class and market as competing organising principles",
          "What Census religion, language and SC/ST tables can and cannot tell you about lived identity",
        ], "cards", ["unity in diversity UPSC", "salient features Indian society"]),
        L("caste-structure-and-change", "Caste: Hierarchy, Change and the Limits of Sanskritisation", [
          "Varna as a textual schema versus jati as the lived endogamous unit",
          "Sanskritisation and Westernisation as Srinivas's two change paths, and what they leave out",
          "Caste in urban labour markets and marriage: persistence without the village hierarchy",
          "Why a caste census is a statistical and a political question at once",
        ], "compare", ["caste system UPSC", "sanskritisation vs westernisation"]),
        L("tribal-communities", "Tribal Communities: Identity, Land and the Fifth–Sixth Schedules", [
          "How 'Scheduled Tribe' is a constitutional-administrative category, not an ethnographic one",
          "Fifth Schedule (Governor, Tribes Advisory Council) versus Sixth Schedule (autonomous councils)",
          "Land alienation, forests and PESA as the three recurring conflict sites",
          "Integration versus isolation versus assimilation as the three historical policy frames",
        ], "compare", ["Fifth vs Sixth Schedule", "PESA tribal land"]),
        L("communalism", "Communalism: Ideology, Riot Sequence and the Secular State", [
          "Communalism as a political ideology that constructs a religious community as a political majority or minority",
          "Why a riot is an organised sequence, not a spontaneous crowd event",
          "How colonial enumeration and separate electorates entered the story, without treating them as the whole cause",
          "What the Constitution's secular design is trying to prevent, and where it is silent",
        ], "flow", ["communalism UPSC", "secularism vs communalism"]),
        L("regionalism", "Regionalism: Language, Resources and the Federal Bargain", [
          "Regionalism as a claim on the Centre, not as secession by default",
          "Linguistic reorganisation as the first major accommodation of regional identity",
          "Sons-of-the-soil, river water and fiscal transfers as the three usual fuels",
          "When regionalism is a safety valve for federalism and when it becomes a security problem",
        ], "cards", ["regionalism India UPSC", "linguistic reorganisation"]),
        L("secularism-indian-model", "Secularism: Indian Doctrine versus the Strict-Separation Model", [
          "Principled distance versus wall-of-separation as two different secular designs",
          "Articles 25–28 as the constitutional text the page must actually use",
          "Sarva dharma sambhava as a political slogan, not as a constitutional clause",
          "Uniform Civil Code as a Directive Principle and why it is not a secularism synonym",
        ], "compare", ["Indian secularism UPSC", "Articles 25-28"]),
        L("globalisation-indian-society", "Globalisation and Indian Society: Work, Culture and Kinship", [
          "Globalisation as flows of capital, people, media and norms — not as a single Westernisation",
          "How IT-enabled work remade middle-class kinship time without abolishing the joint-family ideal",
          "Consumer culture and the new middle class as a status order, not only an income band",
          "Why globalisation can intensify caste and religious branding even as it weakens village hierarchy",
        ], "flow", ["globalisation Indian society", "effects of globalisation UPSC"]),
      ]),
      topic("population-urban-gender", "Population, Urbanisation and Gender", SOC, [
        L("population-census-dynamics", "Population: Census Categories, Transition and the Dividend Claim", [
          "Census as a de facto count with religion, language, SC/ST and urban–rural as published axes",
          "Demographic transition: falling mortality first, then fertility, then age-structure change",
          "Demographic dividend as a working-age bulge that pays only if education and jobs exist",
          "Why a TFR below replacement is not the same as an immediate population decline",
        ], "timeline", ["demographic transition India", "demographic dividend UPSC"]),
        L("migration-internal", "Internal Migration: Streams, Causes and the Missing Portability", [
          "Rural–rural, rural–urban, urban–urban and urban–rural as the four Census streams",
          "Push versus pull, and why distress migration is not the same as aspirational migration",
          "Why ration cards, PDS and social security are still origin-tied",
          "Circular and seasonal migration as the pattern the city undercounts",
        ], "flow", ["internal migration India", "Census migration streams"]),
        L("urbanisation-problems-remedies", "Urbanisation: Agglomeration, Informality and Governance", [
          "Urbanisation versus urban growth: share versus absolute numbers",
          "Census urban (statutory plus census towns) versus the governance map of ULBs",
          "Housing, water, mobility and solid waste as the four recurring service failures",
          "Why the 74th Amendment did not by itself create fiscally capable cities",
        ], "cards", ["urbanisation problems UPSC", "census towns India"]),
        L("women-status-and-law", "Women: Patriarchy, Work and the Legal Stack", [
          "Patriarchy as control over labour, sexuality and property, not as a synonym for sexism",
          "LFPR for women as the statistic that reframes 'status' into an economic question — without quoting a year's print",
          "Personal law, workplace law and criminal law as three different feminist legal sites",
          "Women's organisations: from social reform to autonomous movements to SHGs as three generations",
        ], "hierarchy", ["role of women UPSC", "women LFPR India"]),
        L("gender-and-development", "Gender and Development: From WID to Intersection", [
          "Women in Development versus Gender and Development as two policy frames",
          "Why a scheme named for women can still leave unpaid care untouched",
          "Intersection: caste, minority status and disability change what 'women' as a category hides",
          "Political representation: reservation in local bodies versus the parliamentary debate, conceptually",
        ], "compare", ["WID vs GAD", "women political representation India"]),
      ]),
      topic("social-justice-welfare", "Social Justice, Health, Education and Poverty", SJ, [
        L("welfare-sc-st-obc", "Welfare of SCs, STs and OBCs: Law, Institutions and Leakage", [
          "Reservation as a representation tool, not as a poverty programme",
          "NCSC, NCST and NCBC as constitutional or statutory watchdogs with recommendatory teeth",
          "Atrocities law, Forest Rights Act and OBC creamy-layer as three different instruments",
          "Why targeting by caste and targeting by income keep colliding in scheme design",
        ], "hierarchy", ["NCSC NCST NCBC", "reservation vs poverty scheme"]),
        L("vulnerable-sections-stack", "Vulnerable Sections: Children, Elderly, Disability and Minorities", [
          "Why 'vulnerable sections' is a syllabus basket, not a single statutory definition",
          "Child: JJ Act and POCSO as protection statutes; RTE as an entitlement statute",
          "Disability: RPwD Act's shift from charity to rights and reasonable accommodation",
          "Minorities: NCM as a watchdog; personal law and educational rights as the two usual sites",
        ], "cards", ["RPwD Act UPSC", "vulnerable sections welfare"]),
        L("poverty-and-hunger", "Poverty and Hunger: Measurement, Entitlements and the Last Mile", [
          "Poverty as a consumption line versus multidimensional deprivation — two different objects",
          "Why a poverty ratio and a hunger metric (undernourishment, wasting, stunting) can move differently",
          "PDS, ICDS and mid-day meals as food-entitlement architecture, not as income policy",
          "Exclusion error versus inclusion error: which one the rights-based design tries to cut first",
        ], "compare", ["poverty vs hunger UPSC", "multidimensional poverty"]),
        L("health-systems-india", "Health: Public Goods, Insurance and the Three-Tier System", [
          "Primary, secondary and tertiary as a referral design that fails when primary is empty",
          "Why communicable, non-communicable and reproductive health are different delivery problems",
          "Insurance (risk pooling) versus public provision: what each can and cannot buy",
          "Health as a State List subject with Union money and regulation sitting on top",
        ], "flow", ["three-tier health system India", "health State List"]),
        L("education-and-human-resources", "Education: Rights, Federalism and the Employability Gap", [
          "RTE as a justiciable right in a defined age band, not as a quality guarantee",
          "School versus higher education as two different federal and regulatory stacks",
          "Learning outcomes versus enrolment: why one can stall while the other rises",
          "Skill as a labour-market bridge, not as a substitute for foundational literacy",
        ], "compare", ["RTE Act UPSC", "education enrolment vs learning"]),
        L("poverty-developmental-issues", "Developmental Issues: Inequality, Region and Social Mobility", [
          "Growth that does not move occupational or caste mobility is still growth",
          "Regional disparity as a historical and a policy-choice problem",
          "Why SHGs, MGNREGA and DBT are three different theories of how the poor get bargaining power",
          "Aspirational districts as a convergence frame, not as a new constitutional tier",
        ], "cards", ["inclusive growth society UPSC", "MGNREGA SHG DBT"]),
        L("social-empowerment", "Social Empowerment: Voice, Assets and the State", [
          "Empowerment as voice plus assets plus the capacity to make the state answer",
          "Why a self-help group is a financial and a political technology at once",
          "Legal aid, RTI and social audits as three accountability tools the syllabus expects by name",
          "The risk of empowerment-as-scheme: participation without power over the budget",
        ], "flow", ["social empowerment UPSC", "SHG social audit RTI"]),
        L("poverty-scheme-design", "Scheme Design: Targeting, Universalism and Federal Delivery", [
          "Universal versus targeted benefits: leakage, stigma and fiscal cost as the three trade-offs",
          "Centrally sponsored versus central sector: who pays and who delivers",
          "Aadhaar and DBT as last-mile plumbing, not as a substitute for a well-designed entitlement",
          "Why outcome indicators (learning, nutrition, LFPR) are harder to buy than output indicators (toilets, accounts)",
        ], "compare", ["targeted vs universal welfare", "CSS vs central sector"]),
      ]),
    ],
  },
  {
    slug: "upsc-international-relations",
    name: "International Relations",
    description:
      "GS Paper II IR at topic granularity: doctrine, neighbourhood, major powers, institutions and the diaspora.",
    paper: "GS Paper II",
    sources: SRC,
    topics: [
      topic("foreign-policy-evolution", "Indian Foreign Policy: Doctrine and Instruments", IR_G, [
        L("nam-to-multi-alignment", "From Non-Alignment to Multi-Alignment", [
          "NAM as autonomy in a bipolar world, not as equidistance-as-moralism",
          "What 1991 changed: economic opening as a foreign-policy constraint and opportunity",
          "Multi-alignment as issue-based coalitions, not as a new formal bloc",
          "Strategic autonomy as the continuing thread the exam wants named",
        ], "timeline", ["NAM UPSC", "strategic autonomy India"]),
        L("neighbourhood-first-gujral", "Neighbourhood First and the Gujral Doctrine", [
          "Gujral Doctrine: non-reciprocity toward smaller neighbours as a named set of principles",
          "Neighbourhood First as a priority claim, not as a treaty",
          "Why connectivity, water, trade and domestic politics of neighbours travel together",
          "When non-reciprocity collides with security and migration shocks",
        ], "cards", ["Gujral Doctrine UPSC", "Neighbourhood First"]),
        L("look-east-act-east", "Look East to Act East: ASEAN, Connectivity and the Indo-Pacific", [
          "Look East as post-1991 economic reorientation toward Southeast Asia",
          "Act East as the later, more security-and-connectivity reading of the same vector",
          "ASEAN centrality as the diplomatic price of the Indo-Pacific language",
          "Why a land corridor through Myanmar is a different problem from a maritime supply chain",
        ], "timeline", ["Act East Policy", "ASEAN centrality India"]),
        L("nuclear-doctrine-india", "India's Nuclear Doctrine: Conceptual Structure", [
          "Credible minimum deterrence and No First Use as the two headline tenets",
          "Why NFU is a political declaration, not a physical feature of a warhead",
          "Civilian nuclear deal logic: separating civil and military facilities under IAEA safeguards",
          "What the doctrine does not require you to invent: yields, inventories, or targeting lists",
        ], "hierarchy", ["India NFU doctrine", "credible minimum deterrence"]),
        L("diaspora-and-soft-power", "Indian Diaspora: Categories, Leverage and Limits", [
          "NRI, PIO and OCI as legal-administrative categories, not as sociological types",
          "Remittances, lobbying and knowledge networks as three different diaspora channels",
          "Why a diaspora can be an asset in one capital and a bilateral irritant in another",
          "Soft power (culture, democracy, development partnership) as influence without compulsion",
        ], "cards", ["Indian diaspora UPSC", "NRI PIO OCI"]),
      ]),
      topic("neighbourhood-and-powers", "Neighbourhood and Major Powers", IR_N, [
        L("india-pakistan", "India–Pakistan: Cross-border Terrorism, Water and the Diplomatic Pause", [
          "Simla and Lahore as the two named bilateral frames still cited",
          "Why terrorism as a method collapsed composite dialogue more than any single territorial dispute",
          "Indus Waters Treaty as a World Bank-brokered water regime, not as a peace treaty",
          "What 'pause' and back-channel mean when high-level dialogue is politically costly",
        ], "timeline", ["Indus Waters Treaty", "Simla Agreement UPSC"]),
        L("india-china", "India–China: Border, Trade Asymmetry and the Wider Contest", [
          "LAC as a notional line, not a mutually agreed boundary",
          "Why 1962, 1993–96 CBMs and 2020 are three different layers of the same dispute",
          "Trade interdependence with a lopsided basket as a vulnerability, not only as a statistic",
          "The wider contest: connectivity, the Indian Ocean and membership of the same plurilateral clubs",
        ], "compare", ["LAC India China", "India China CBMs"]),
        L("south-asia-neighbours", "Smaller Neighbours: Bangladesh, Nepal, Sri Lanka, Bhutan, Maldives", [
          "Why each is a different mix of connectivity, water, ethnicity and extra-regional presence",
          "Transit and energy as the positive-sum offer India actually has",
          "Domestic political cycles in neighbours as the binding constraint on treaties",
          "Why a one-neighbourhood policy cannot be one-size-fits-all",
        ], "cards", ["India neighbourhood relations", "India Bangladesh Nepal Sri Lanka"]),
        L("india-united-states", "India–United States: From Estrangement to Issue-Based Partnership", [
          "Why the nuclear issue was the freeze and the civil nuclear understanding was the thaw",
          "Defence logistics, foundational agreements and technology as the hard core",
          "The partnership is not an alliance: what that sentence allows and forbids",
          "Diaspora, campuses and capital markets as the societal ballast",
        ], "timeline", ["India US civil nuclear", "foundational agreements India US"]),
        L("india-russia", "India–Russia: Defence Legacy, Energy and Strategic Autonomy", [
          "Why the defence inventory creates path dependence long after the Cold War",
          "Energy and fertiliser as the newer, quieter stakes",
          "How a Russia partnership is a test of multi-alignment when the West is the other pole",
          "What 'time-tested' does not mean: a blank cheque on every third-country conflict",
        ], "cards", ["India Russia defence", "strategic autonomy Russia"]),
        L("indian-ocean-maritime", "Indian Ocean: SAGAR, Sea Lanes and Extra-Regional Navies", [
          "SAGAR as a named maritime doctrine-lite, not as a treaty organisation",
          "Sea lanes, chokepoints and EEZ security as three different naval tasks",
          "Why extra-regional bases and dual-use ports are read as strategic, even when labelled commercial",
          "IORA and IONS as the thin regional institutions India actually sits in",
        ], "flow", ["SAGAR India", "Indian Ocean security UPSC"]),
      ]),
      topic("institutions-and-groupings", "UN, WTO and Plurilateral Groupings", IR_G, [
        L("un-system-mandate", "The UN System: Charter, Principal Organs and Reform Debates", [
          "General Assembly, Security Council, ECOSOC, ICJ and the Secretariat as principal organs",
          "P5 veto as the Charter's power-political core, not as a procedural quirk",
          "Peacekeeping versus Chapter VII enforcement as two different uses of force",
          "UNSC reform: expansion, veto and G4 as the Indian ask, conceptually",
        ], "hierarchy", ["UN principal organs", "UNSC reform G4"]),
        L("wto-trade-rules", "WTO: Non-Discrimination, Dispute Settlement and the Agriculture Knot", [
          "MFN and national treatment as the two non-discrimination rules",
          "WTO as a member-driven contract with a dispute system, not as a world government",
          "Agriculture: domestic support boxes as the exam-level vocabulary",
          "Why consensus and the appellate-body vacancy are two different governance failures",
        ], "compare", ["WTO MFN national treatment", "WTO agriculture boxes"]),
        L("quad-indo-pacific", "Quad: Agenda, Limits and What It Is Not", [
          "Quad as a diplomatic quadrilateral, not as a mutual-defence treaty",
          "Maritime security, quality infrastructure, health and critical technology as the usual agenda baskets",
          "Why ASEAN centrality is the diplomatic constraint on how far Quad can go",
          "What calling it an 'Asian NATO' gets wrong",
        ], "cards", ["Quad grouping UPSC", "Quad vs NATO"]),
        L("brics-group", "BRICS: Origin, New Development Bank and the Expansion Question", [
          "BRICS as a consultation group of large emerging economies, not as a customs union",
          "New Development Bank and the Contingent Reserve Arrangement as the two named financial arms",
          "Why expansion changes cohesion even when it increases headline weight",
          "De-dollarisation talk versus the actual invoicing and payment plumbing",
        ], "hierarchy", ["BRICS NDB", "BRICS CRA"]),
        L("sco-eurasia", "SCO: Eurasian Security Grouping and India's Awkward Fit", [
          "SCO as a Eurasian security and connectivity forum with a China–Russia core",
          "RATS as the named counter-terror structure",
          "Why India and Pakistan's simultaneous entry changed the table",
          "Connectivity projects that cut across India's Belt and Road objection",
        ], "cards", ["SCO RATS UPSC", "SCO India Pakistan"]),
        L("g20-and-minilaterals", "G20 and Minilaterals: Steering Groups without a Charter", [
          "G20 as a crisis steering group of systemically large economies, not a treaty UN",
          "Why the presidency's theme is agenda-setting, not law-making",
          "Minilaterals (I2U2, trilaterals) as issue-specific, not as replacements for the UN",
          "The legitimacy trade-off: speed versus representativeness",
        ], "compare", ["G20 UPSC", "minilateralism India"]),
        L("international-law-lite", "International Institutions: Mandate, Voting and India's Ask", [
          "IMF and World Bank: weighted voting versus UNGA equality as two legitimacy models",
          "Specialised agencies (WHO, IAEA, IMO) as functional, not political, first",
          "Why India seeks both a larger quota and a larger political seat",
          "Treaty versus political declaration: which one actually binds",
        ], "hierarchy", ["IMF World Bank voting", "IAEA WHO mandate"]),
      ]),
    ],
  },
];
