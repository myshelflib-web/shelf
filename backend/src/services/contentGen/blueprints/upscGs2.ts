import type { StarterSubject } from "../types.js";

const CONSTITUTION = "https://legislative.gov.in/constitution-of-india";
const SCI = "https://main.sci.gov.in/judgments";

export const UPSC_POLITY: StarterSubject = {
  slug: "upsc-polity",
  name: "Indian Polity & Constitution",
  description:
    "Constitutional framework, organs of government and federal relations, mapped to GS Paper II.",
  paper: "GS Paper II",
  topics: [
    {
      slug: "constitutional-framework",
      title: "Constitutional Framework",
      articles: [
        {
          slug: "basic-structure-doctrine",
          title: "Basic Structure Doctrine: Origin, Content and Limits",
          syllabusAnchor:
            "GS Paper II — Indian Constitution: historical underpinnings, evolution, features, amendments, significant provisions and basic structure.",
          mustCover: [
            "Article 368: the amendment procedure, the three amendment routes, and what 'ratification by states' covers",
            "Shankari Prasad (1951) and Sajjan Singh (1965): amendment is not 'law' under Article 13",
            "Golaknath (1967): the reversal, and the doctrine of prospective overruling",
            "Kesavananda Bharati (1973): the 13-judge bench, the 7-6 split, and what the majority actually held",
            "Indira Nehru Gandhi v. Raj Narain (1975): free and fair elections as a basic feature",
            "Minerva Mills (1980): striking down clauses (4) and (5) of Article 368, and the balance between Parts III and IV",
            "Waman Rao (1981): the cut-off date for Ninth Schedule protection, confirmed in I.R. Coelho (2007)",
            "Features courts have recognised as basic: supremacy of the Constitution, rule of law, judicial review, separation of powers, federalism, secularism, free and fair elections",
            "The core criticism: the doctrine has no textual basis and gives unelected judges a veto over the amending power",
          ],
          worked: [
            "Trace one amendment (the 42nd) through the doctrine: which of its provisions survived and which were struck down, and why",
            "Show how the Ninth Schedule cut-off works with a concrete before-and-after example",
          ],
          traps: [
            "Treating Kesavananda as having 'defined' the basic structure — the court deliberately left the list open",
            "Assuming every Ninth Schedule entry is immune from review after I.R. Coelho",
            "Confusing the amendment procedure of Article 368 with ordinary legislative procedure",
          ],
          officialSources: [CONSTITUTION, SCI],
          diagram: "timeline",
          keywords: [
            "basic structure doctrine",
            "Kesavananda Bharati case",
            "Article 368 amendment",
            "Minerva Mills judgment",
            "UPSC polity notes",
          ],
          order: 0,
        },
        {
          slug: "preamble-and-constitutional-philosophy",
          title: "The Preamble: Sovereignty, Socialism, Secularism and Justice",
          syllabusAnchor:
            "GS Paper II — Indian Constitution: historical underpinnings, evolution and features.",
          mustCover: [
            "Text of the Preamble and what each keyword commits the state to",
            "Berubari Union (1960) and Kesavananda (1973): whether the Preamble is part of the Constitution",
            "The 42nd Amendment insertion of 'socialist', 'secular' and 'integrity'",
            "Whether the Preamble is enforceable, and its role as an aid to interpretation",
            "Indian secularism compared with the strict separation model",
            "Justice, liberty, equality and fraternity as they translate into Parts III and IV",
            "The Objectives Resolution and its relationship to the final text",
          ],
          worked: [
            "Show how a court uses the Preamble to resolve an ambiguity, rather than as a standalone right",
          ],
          traps: [
            "Claiming the Preamble can be enforced in court on its own",
            "Saying the Preamble cannot be amended at all — it can, subject to basic structure",
          ],
          officialSources: [CONSTITUTION, SCI],
          diagram: "hierarchy",
          keywords: [
            "Preamble of Indian Constitution",
            "42nd Amendment socialist secular",
            "Berubari Union case",
            "objectives resolution",
          ],
          order: 1,
        },
        {
          slug: "fundamental-rights-vs-dpsp",
          title: "Fundamental Rights and Directive Principles: Conflict and Balance",
          syllabusAnchor:
            "GS Paper II — Separation of powers, Fundamental Rights, Directive Principles of State Policy.",
          mustCover: [
            "Articles 12-35: the structure of Part III, and who counts as 'State' under Article 12",
            "Articles 36-51: classification of Directive Principles as socialist, Gandhian and liberal-intellectual",
            "Article 37: why Directive Principles are non-justiciable yet fundamental to governance",
            "Champakam Dorairajan (1951): Fundamental Rights prevail, and the First Amendment response",
            "Article 31C as inserted by the 25th Amendment, and its expansion by the 42nd Amendment",
            "Minerva Mills: the expansion struck down, harmony restored",
            "The settled position: harmonious construction, with Directive Principles informing the reasonableness of restrictions",
            "Fundamental Duties in Part IVA and their legal status",
          ],
          worked: [
            "Work through one case where a Directive Principle was used to justify a restriction on a Fundamental Right, showing the reasoning step by step",
            "Build a comparison table: justiciability, whom they bind, remedy available, amendment history",
          ],
          traps: [
            "Saying Directive Principles are 'useless' because they are non-justiciable",
            "Forgetting that Article 31C survives in its pre-42nd Amendment form",
            "Treating Fundamental Duties as enforceable",
          ],
          officialSources: [CONSTITUTION, SCI],
          diagram: "compare",
          keywords: [
            "fundamental rights vs directive principles",
            "Article 31C",
            "Minerva Mills case",
            "Part IV DPSP UPSC",
          ],
          order: 2,
        },
        {
          slug: "right-to-equality-and-reservation",
          title: "Right to Equality: Articles 14-18 and the Reservation Framework",
          syllabusAnchor:
            "GS Paper II — Fundamental Rights; mechanisms, laws, institutions and bodies constituted for the protection and betterment of vulnerable sections.",
          mustCover: [
            "Article 14: equality before law and equal protection of laws, and the reasonable classification test",
            "The later arbitrariness test from E.P. Royappa and Maneka Gandhi",
            "Articles 15 and 16: prohibited grounds, and the enabling provisions in 15(3), 15(4), 15(5), 16(4) and 16(4A)",
            "Indra Sawhney (1992): the 50 per cent ceiling, the creamy layer, and no reservation in promotions",
            "The 77th and 85th Amendments restoring reservation in promotion with consequential seniority",
            "The 103rd Amendment and EWS reservation, upheld in Janhit Abhiyan (2022)",
            "Articles 17 and 18: abolition of untouchability and titles",
          ],
          worked: [
            "Apply the reasonable classification test to a hypothetical classification, showing both limbs",
            "Table the ceiling, creamy layer and promotion position before and after each amendment",
          ],
          traps: [
            "Stating the 50 per cent ceiling as absolute after the EWS judgment",
            "Confusing Article 15(4) with 16(4) — one is about educational and social advancement, the other about public employment",
            "Assuming the creamy layer test applies identically to SC/ST and OBC",
          ],
          officialSources: [CONSTITUTION, SCI],
          diagram: "timeline",
          keywords: [
            "Article 14 reasonable classification",
            "Indra Sawhney judgment",
            "EWS reservation 103rd amendment",
            "right to equality UPSC",
          ],
          order: 3,
        },
        {
          slug: "article-21-expanding-liberty",
          title: "Article 21: How the Right to Life Expanded",
          syllabusAnchor:
            "GS Paper II — Fundamental Rights and their evolution through judicial interpretation.",
          mustCover: [
            "A.K. Gopalan (1950): the narrow, compartmentalised reading of Articles 19, 21 and 22",
            "Maneka Gandhi (1978): procedure established by law must be fair, just and reasonable",
            "The golden triangle of Articles 14, 19 and 21",
            "Rights read into Article 21: livelihood, shelter, health, clean environment, speedy trial, legal aid, education before the 86th Amendment",
            "K.S. Puttaswamy (2017): privacy as a fundamental right and the proportionality test",
            "Article 21A and the Right to Education Act",
            "The limits: Article 21 rights are not absolute and are subject to proportionate restriction",
          ],
          worked: [
            "Apply the four-part proportionality test from Puttaswamy to a concrete state measure",
          ],
          traps: [
            "Saying Article 21 was 'amended' to include privacy — it was interpreted, not amended",
            "Treating 'due process' as textually present in Article 21",
          ],
          officialSources: [CONSTITUTION, SCI],
          diagram: "timeline",
          keywords: [
            "Article 21 right to life",
            "Maneka Gandhi case",
            "Puttaswamy privacy judgment",
            "proportionality test India",
          ],
          order: 4,
        },
      ],
    },
    {
      slug: "organs-of-government",
      title: "Union Executive, Legislature and Judiciary",
      articles: [
        {
          slug: "parliament-procedure-and-oversight",
          title: "Parliament: Legislative Procedure and Financial Oversight",
          syllabusAnchor:
            "GS Paper II — Parliament and State legislatures: structure, functioning, conduct of business, powers and privileges.",
          mustCover: [
            "Composition of Lok Sabha and Rajya Sabha, and the difference in their powers",
            "Ordinary bills, money bills under Article 110, financial bills and constitutional amendment bills",
            "The Speaker's certification of a money bill and why it is contentious",
            "Joint sitting under Article 108 and when it cannot be used",
            "The budget cycle: demands for grants, cut motions, guillotine, appropriation and finance bills",
            "Departmentally related standing committees, the Public Accounts Committee and the Estimates Committee",
            "Devices of parliamentary oversight: question hour, zero hour, adjournment motion, no-confidence motion",
            "Anti-defection under the Tenth Schedule and the Speaker's role",
          ],
          worked: [
            "Trace a money bill from introduction to assent, marking every point where Rajya Sabha's role differs from an ordinary bill",
            "Table the four bill types against introduction chamber, Rajya Sabha power, and joint sitting availability",
          ],
          traps: [
            "Assuming a joint sitting can be called for a money bill or a constitutional amendment bill",
            "Treating every bill with financial provisions as a money bill",
            "Confusing an adjournment motion with a no-confidence motion",
          ],
          officialSources: [
            CONSTITUTION,
            "https://sansad.in/",
            "https://prsindia.org/",
          ],
          diagram: "flow",
          keywords: [
            "money bill Article 110",
            "parliamentary committees India",
            "budget process Parliament",
            "anti defection tenth schedule",
          ],
          order: 0,
        },
        {
          slug: "president-and-council-of-ministers",
          title: "The Union Executive: President, Prime Minister and Cabinet",
          syllabusAnchor:
            "GS Paper II — Structure, organisation and functioning of the Executive.",
          mustCover: [
            "Election of the President under Article 54-55 and the single transferable vote",
            "Articles 74 and 75: aid and advice, and the 42nd and 44th Amendment changes",
            "Discretionary space: appointing a Prime Minister in a hung house, dissolution, and the pocket veto",
            "Veto powers: absolute, suspensive and pocket; Article 111 and Article 201",
            "Ordinance-making under Article 123 and the limits from D.C. Wadhwa and Krishna Kumar Singh",
            "Collective responsibility and individual responsibility of ministers",
            "Cabinet committees and the Cabinet Secretariat",
          ],
          worked: [
            "Work through what happens when the President returns a bill under Article 111 and Parliament passes it again",
          ],
          traps: [
            "Calling the President a mere rubber stamp without noting the narrow discretionary situations",
            "Saying an ordinance lapses immediately when Parliament reconvenes — it lapses six weeks after reassembly",
          ],
          officialSources: [CONSTITUTION, "https://sansad.in/"],
          diagram: "hierarchy",
          keywords: [
            "President of India powers",
            "Article 74 aid and advice",
            "ordinance making power Article 123",
            "council of ministers UPSC",
          ],
          order: 1,
        },
        {
          slug: "judiciary-independence-and-review",
          title: "The Judiciary: Independence, Judicial Review and Appointments",
          syllabusAnchor:
            "GS Paper II — Structure, organisation and functioning of the Judiciary; appointment to constitutional posts.",
          mustCover: [
            "Supreme Court jurisdiction: original, appellate, advisory under Article 143, and writ under Article 32",
            "The five writs and what each is used for",
            "High Court writ jurisdiction under Article 226 and how it is wider than Article 32",
            "Judicial review and its basis in Articles 13, 32, 131-136 and 226",
            "The three Judges Cases and the evolution of the collegium",
            "The 99th Amendment, the NJAC, and why it was struck down in 2015",
            "Judicial independence safeguards: tenure, removal procedure under Article 124(4), charged expenditure",
            "Public interest litigation: origin, contribution and the criticism of judicial overreach",
          ],
          worked: [
            "Compare Article 32 and Article 226 across who can be approached, scope of rights covered, and discretion",
          ],
          traps: [
            "Saying judges are 'impeached' — the Constitution uses removal by an address, not impeachment",
            "Assuming Article 32 covers legal rights; it is confined to Fundamental Rights",
          ],
          officialSources: [CONSTITUTION, SCI],
          diagram: "compare",
          keywords: [
            "collegium system India",
            "NJAC judgment",
            "Article 32 vs 226",
            "judicial review UPSC",
          ],
          order: 2,
        },
        {
          slug: "federalism-and-centre-state-relations",
          title: "Indian Federalism: Legislative, Administrative and Financial Relations",
          syllabusAnchor:
            "GS Paper II — Functions and responsibilities of the Union and the States, issues and challenges pertaining to the federal structure.",
          mustCover: [
            "The Seventh Schedule: Union, State and Concurrent Lists, and residuary power under Article 248",
            "Articles 245-255: territorial nexus, repugnancy under Article 254, and Article 249 and 250 exceptions",
            "Doctrines of pith and substance, colourable legislation and incidental encroachment",
            "Articles 256-263: directions to states, all-India services, and the Inter-State Council",
            "Articles 268-281: tax devolution, the Finance Commission and grants-in-aid",
            "Article 356 and the S.R. Bommai safeguards; Sarkaria and Punchhi Commission recommendations",
            "The GST Council under Article 279A as a case study in shared sovereignty",
            "Why India is described as quasi-federal or federal with a strong centre",
          ],
          worked: [
            "Apply the repugnancy test under Article 254 to a hypothetical clash between a central and a state law",
            "Table the three lists with two representative entries each and who legislates on residuary matters",
          ],
          traps: [
            "Assuming the Union can legislate on the State List only during an Emergency — Articles 249 and 252 also allow it",
            "Treating the GST Council's recommendations as binding after the 2022 ruling",
          ],
          officialSources: [
            CONSTITUTION,
            "https://fincomindia.nic.in/",
            "https://interstatecouncil.nic.in/",
          ],
          diagram: "hierarchy",
          keywords: [
            "Indian federalism UPSC",
            "Seventh Schedule lists",
            "Article 356 Bommai",
            "GST Council federalism",
          ],
          order: 3,
        },
      ],
    },
    {
      slug: "governance-and-accountability",
      title: "Governance, Transparency & Accountability",
      articles: [
        {
          slug: "constitutional-and-statutory-bodies",
          title: "Constitutional and Statutory Bodies: Mandate and Independence",
          syllabusAnchor:
            "GS Paper II — Statutory, regulatory and various quasi-judicial bodies; appointment to various constitutional posts, powers, functions and responsibilities.",
          mustCover: [
            "Election Commission: Article 324, composition, and the model code of conduct's legal status",
            "Comptroller and Auditor General: Article 148, types of audit, and the CAG's reports route through the PAC",
            "Union Public Service Commission: Article 315, functions and removal protection",
            "Finance Commission under Article 280 and its terms of reference",
            "National Commissions for SCs, STs and Backward Classes under Articles 338, 338A and 338B",
            "Attorney General under Article 76",
            "Statutory bodies contrasted: NHRC, CIC, Lokpal, NITI Aayog as an executive body",
            "What actually secures independence: tenure, removal procedure, and charged expenditure",
          ],
          worked: [
            "Build a table of five bodies against constitutional or statutory basis, appointing authority, and removal procedure",
          ],
          traps: [
            "Calling NITI Aayog or the NHRC a constitutional body",
            "Assuming all Election Commissioners have the same removal protection as the Chief Election Commissioner",
          ],
          officialSources: [
            CONSTITUTION,
            "https://eci.gov.in/",
            "https://cag.gov.in/",
          ],
          diagram: "compare",
          keywords: [
            "constitutional bodies India",
            "CAG functions UPSC",
            "Election Commission Article 324",
            "statutory vs constitutional body",
          ],
          order: 0,
        },
        {
          slug: "rti-and-transparency",
          title: "Transparency and Accountability: RTI, Social Audit and Citizen Charters",
          syllabusAnchor:
            "GS Paper II — Important aspects of governance, transparency and accountability, e-governance applications, citizens charters.",
          mustCover: [
            "Right to Information Act 2005: who is a public authority, the request process and timelines",
            "Section 8 exemptions and the public interest override in Section 8(2)",
            "The Information Commissions and the 2019 amendment to tenure and service conditions",
            "Whistle-blower protection and its status",
            "Social audit as institutionalised under MGNREGA",
            "Citizen charters: intent, and why enforcement remains weak",
            "E-governance as an accountability tool, and the risk of exclusion",
          ],
          worked: [
            "Trace an RTI application through first appeal and second appeal with the statutory timelines at each stage",
          ],
          traps: [
            "Assuming RTI covers private bodies directly — it reaches them only through substantially financed public authorities",
            "Forgetting that Section 4 proactive disclosure is an obligation, not a response to requests",
          ],
          officialSources: [
            "https://rti.gov.in/",
            "https://cic.gov.in/",
            "https://darpg.gov.in/",
          ],
          diagram: "flow",
          keywords: [
            "Right to Information Act 2005",
            "RTI Section 8 exemptions",
            "social audit MGNREGA",
            "citizen charter governance",
          ],
          order: 1,
        },
      ],
    },
  ],
};

export const UPSC_IR: StarterSubject = {
  slug: "upsc-international-relations",
  name: "International Relations",
  description:
    "India's bilateral, regional and global engagement, and the institutions that shape it — GS Paper II.",
  paper: "GS Paper II",
  topics: [
    {
      slug: "india-and-the-world",
      title: "India and the World",
      articles: [
        {
          slug: "indian-foreign-policy-evolution",
          title: "Indian Foreign Policy: From Non-Alignment to Multi-Alignment",
          syllabusAnchor:
            "GS Paper II — India and its neighbourhood; bilateral, regional and global groupings and agreements involving India.",
          mustCover: [
            "Panchsheel and the logic of non-alignment in the bipolar era",
            "The 1971 Indo-Soviet Treaty and the shift it marked",
            "Post-1991 recalibration: Look East becoming Act East",
            "Strategic autonomy as the organising idea of multi-alignment",
            "Neighbourhood First and its friction points",
            "Membership map: Quad, BRICS, SCO, G20, I2U2, IBSA and what each is for",
            "India's case for UN Security Council reform",
          ],
          worked: [
            "Contrast non-alignment and multi-alignment across drivers, partners and constraints",
          ],
          traps: [
            "Treating non-alignment and neutrality as the same thing",
            "Listing groupings without saying what problem each one addresses",
          ],
          officialSources: ["https://www.mea.gov.in/"],
          diagram: "timeline",
          keywords: [
            "Indian foreign policy evolution",
            "non alignment to multi alignment",
            "Act East policy",
            "strategic autonomy India",
          ],
          order: 0,
        },
        {
          slug: "india-neighbourhood-relations",
          title: "India's Neighbourhood: Interests, Frictions and Instruments",
          syllabusAnchor:
            "GS Paper II — India and its neighbourhood relations.",
          mustCover: [
            "Structural features: asymmetry of size, shared borders, and cross-border ethnic ties",
            "Land boundary and maritime boundary settlements as instruments of trust",
            "Connectivity and energy projects as the main positive lever",
            "The competing external presence in the region and how it shapes choices",
            "Water sharing as a recurring bilateral issue",
            "SAARC's paralysis and the turn to BIMSTEC",
            "Diaspora, remittances and people-to-people ties",
          ],
          worked: [
            "Take one neighbour and lay out interests, irritants and instruments in three columns",
          ],
          traps: [
            "Writing neighbourhood answers as news recaps rather than interest-based analysis",
            "Ignoring the domestic politics of the other country",
          ],
          officialSources: ["https://www.mea.gov.in/"],
          diagram: "compare",
          keywords: [
            "India neighbourhood first policy",
            "SAARC BIMSTEC comparison",
            "India bilateral relations UPSC",
          ],
          order: 1,
        },
      ],
    },
  ],
};
