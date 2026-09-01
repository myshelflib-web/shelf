import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://dopt.gov.in/",
  "https://www.isro.gov.in/",
  "https://www.mha.gov.in/",
  "https://upsc.gov.in/examinations/active-examinations",
];

const ETH_H =
  "GS Paper IV — Ethics and Human Interface: Essence, determinants and consequences of Ethics in human actions; dimensions of ethics; ethics in private and public relationships.";
const ETH_V =
  "GS Paper IV — Human Values; Attitude; Aptitude and foundational values for Civil Service; Emotional intelligence; Contributions of moral thinkers and philosophers from India and the world.";
const ETH_P =
  "GS Paper IV — Public/Civil service values and Ethics in Public administration; Probity in Governance; Case Studies on above issues.";
const ST =
  "GS Paper III — Science and Technology- developments and their applications and effects in everyday life; Awareness in the fields of IT, Space, Computers, robotics, nano-technology, bio-technology and issues relating to intellectual property rights.";
const SEC =
  "GS Paper III — Challenges to internal security through communication networks; basics of cyber security; money-laundering and its prevention; Security challenges and their management in border areas; linkages of organized crime with terrorism.";
const CSAT =
  "Prelims Paper II (CSAT) — Comprehension; Logical reasoning and analytical ability; Decision-making and problem-solving; General mental ability; Basic numeracy and Data interpretation (Class X level). Qualifying paper.";

export const UPSC_ETHICS_SCI_CSAT_CORPUS: SyllabusSubject[] = [
  {
    slug: "upsc-ethics",
    name: "Ethics, Integrity & Aptitude",
    description:
      "GS Paper IV at topic granularity: concepts, values, public-service ethics, probity and the case-study method.",
    paper: "GS Paper IV",
    sources: SRC,
    topics: [
      topic("ethics-concepts", "Ethics: Concepts, Dimensions and Relationships", ETH_H, [
        L("essence-determinants-consequences", "Ethics: Essence, Determinants and Consequences", [
          "Ethics as a normative enquiry into right action, distinct from law, etiquette and religion",
          "Determinants: individual (values, will), situational (incentives, culture) and systemic (rules, institutions)",
          "Consequences of ethical and unethical action for the agent, the organisation and the public",
          "Why a legal act can still be unethical, and an illegal act of conscience still needs a public defence",
        ], "flow", ["essence of ethics UPSC", "ethics vs law"]),
        L("dimensions-of-ethics", "Dimensions of Ethics: Consequence, Duty and Virtue", [
          "Consequentialism: rightness from outcomes; the aggregation and rights-violation problems",
          "Deontology: duty and rights that constrain what outcomes may be pursued",
          "Virtue ethics: character and practical wisdom rather than a single decision rule",
          "When a civil servant needs all three rather than a slogan from one school",
        ], "compare", ["consequentialism deontology virtue", "dimensions of ethics"]),
        L("private-public-ethics", "Ethics in Private and Public Relationships", [
          "Private ethics: fidelity, care and honesty in relationships that are not office-based",
          "Public ethics: impersonality, publicity and the duty to treat citizens as equals",
          "Conflict of interest as the hinge where private ties colonise public office",
          "Why 'I would do this for my family' is not a public-reason justification",
        ], "compare", ["private vs public ethics", "conflict of interest civil service"]),
        L("ethical-dilemmas", "Ethical Dilemmas: Structure, Not Slogans", [
          "A dilemma is a conflict of two genuine values, not a conflict between duty and temptation",
          "Rule versus outcome, loyalty versus truth, compassion versus equality as recurring GS-IV patterns",
          "How to name stakeholders, constraints and the least-unjust option before preaching",
          "Why 'balance' is not an answer until the trade-off is specified",
        ], "cards", ["ethical dilemma UPSC", "GS4 case study method"]),
      ]),
      topic("values-attitude-ei", "Values, Attitude, Aptitude and Thinkers", ETH_V, [
        L("human-values-institutions", "Human Values and the Institutions that Inculcate Them", [
          "Terminal versus instrumental values, and why the same virtue can serve opposite ends",
          "Family, school, peer group and workplace as successive value-inculcating institutions",
          "Leaders and administrators as models: what is transferable and what is hagiography",
          "Value crisis as a mismatch between professed and practised norms, not as a nostalgia claim",
        ], "hierarchy", ["human values UPSC", "role of family school values"]),
        L("attitude-components-change", "Attitude: ABC, Functions and Change", [
          "Affective, behavioural and cognitive components and why they can diverge",
          "Functions of attitude: knowledge, ego-defensive, value-expressive, instrumental",
          "Persuasion: source, message and audience; why fear appeals often fail",
          "Cognitive dissonance as a change mechanism, not as a personality insult",
        ], "flow", ["ABC of attitude", "cognitive dissonance UPSC"]),
        L("social-influence-persuasion", "Social Influence, Prejudice and Persuasion", [
          "Conformity, compliance and obedience as three different influence mechanisms",
          "Prejudice, stereotype and discrimination as cognition, attitude and behaviour",
          "How bureaucracy can encode prejudice into procedure without anyone 'being prejudiced'",
          "Persuasion in public communication: why facts without identity never land",
        ], "cards", ["conformity compliance obedience", "prejudice vs stereotype"]),
        L("civil-service-foundational-values", "Foundational Values of Civil Service", [
          "Integrity, impartiality, non-partisanship, objectivity, dedication to public service, empathy, tolerance and compassion as the named set",
          "Why impartiality is not the same as neutrality toward injustice",
          "Objectivity as reason-giving that another officer could follow, not as emotionlessness",
          "How these values collide in a transfer, a relief camp, or a politically timed file",
        ], "hierarchy", ["foundational values civil service", "impartiality vs neutrality"]),
        L("emotional-intelligence-admin", "Emotional Intelligence in Administration", [
          "Self-awareness, self-regulation, motivation, empathy and social skill as the usual five-part map",
          "Why EI is a performance condition in street-level bureaucracy, not a soft extra",
          "Empathy without capture: feeling the citizen's situation without becoming their advocate against the rule",
          "What EI is not: manipulation, or an excuse to skip a hard lawful decision",
        ], "flow", ["emotional intelligence UPSC", "EI civil service"]),
        L("moral-thinkers-india", "Indian Moral Resources: Duty, Non-Violence and Justice", [
          "Nishkama karma as duty without clinging to fruit — and how it is misused to excuse outcomes",
          "Ahimsa and satyagraha as political ethics, not as passivity",
          "Ambedkar: constitutional morality versus public morality",
          "What the paper wants: usable distinctions, not biographical sketches",
        ], "cards", ["nishkama karma UPSC", "constitutional morality Ambedkar"]),
        L("moral-thinkers-world", "Thinkers from the World: Utility, Duty, Justice and Care", [
          "Mill: harm principle and the quality-of-pleasures reply to crude utilitarianism",
          "Kant: treating persons as ends; the problem of rigid duty in famine or riot",
          "Rawls: justice as fairness and the veil of ignorance as a public-reason device",
          "Care ethics as a corrective to an only-rights picture of the citizen",
        ], "compare", ["Kant vs Mill UPSC", "Rawls veil of ignorance"]),
      ]),
      topic("probity-and-cases", "Public Service Ethics, Probity and Case Method", ETH_P, [
        L("laws-rules-conscience", "Laws, Rules, Regulations and Conscience as Guidance", [
          "Law as the enforceable floor; rules as the administrative specification; conscience as the residue",
          "When conscience may justify delay, dissent or resignation — and when it may not justify disobedience",
          "Whistle-blowing as a structured last resort, not as a first leak",
          "Why 'I was following orders' is not a complete defence in public ethics",
        ], "hierarchy", ["conscience vs law UPSC", "whistle blowing ethics"]),
        L("accountability-ethical-governance", "Accountability and Ethical Governance", [
          "Answerability, enforcement and responsiveness as three layers of accountability",
          "Horizontal (CAG, judiciary, CIC, CVC) versus vertical (elections, media, social audit)",
          "Ethical governance as procedure plus motive plus outcome, not as a code on the wall",
          "Why more reports without consequences is not accountability",
        ], "flow", ["accountability UPSC ethics", "CVC CAG CIC"]),
        L("probity-rti-codes", "Probity: Codes, RTI and the Integrity Infrastructure", [
          "Probity as uprightness in the use of public office and public money",
          "Conduct rules and codes of ethics: what a code can do and why it fails without enforcement",
          "RTI as a sunlight tool: suo motu disclosure versus application-based disclosure",
          "Gifts, post-retirement employment and related-party contracts as the usual integrity traps",
        ], "cards", ["probity in governance", "RTI suo motu disclosure"]),
        L("corruption-and-integrity", "Corruption: Types, Incentives and Integrity Systems", [
          "Petty versus grand, collusive versus coercive, as types with different remedies",
          "Discretion plus opacity plus low detection as the incentive triangle",
          "Prevention (e-governance, competition), detection (audit, vigilance) and sanction as a system",
          "Why a new law without changing discretion often relocates the rent",
        ], "flow", ["types of corruption UPSC", "integrity system"]),
        L("case-study-method-gs4", "GS Paper IV Case Studies: How to Write Them", [
          "Facts, stakeholders, values in conflict, options, and a reasoned choice as the five-part skeleton",
          "Why the chosen option must be lawful, implementable and publicly defensible",
          "Short-term containment versus long-term institutional fix — both usually required",
          "What fails: slogans, unnamed committees, and solutions that need a power the officer does not have",
        ], "hierarchy", ["GS4 case study structure", "ethics case writing"]),
      ]),
    ],
  },
  {
    slug: "upsc-science-tech-security",
    name: "Science, Technology & Internal Security",
    description:
      "GS Paper III S&T and internal security at topic granularity: space, biotech, cyber, borders and proceeds of crime.",
    paper: "GS Paper III",
    sources: SRC,
    topics: [
      topic("space-and-biotech", "Space, Biotechnology and IPR", ST, [
        L("isro-launchers-missions", "ISRO: Launch Vehicles, Missions and the Civilian Mandate", [
          "PSLV, GSLV and LVM3 as three different payload-and-orbit jobs, not as a prestige ranking",
          "Why a launch vehicle family and a satellite bus are two industrial competencies",
          "Science missions versus operational EO/NavIC/comms satellites as two different success tests",
          "ISRO as a civilian space agency: what that implies for transparency and for dual-use caution",
        ], "hierarchy", ["ISRO PSLV GSLV LVM3", "NavIC UPSC"]),
        L("satellite-applications", "Satellite Applications: Earth Observation, Nav and Communication", [
          "Earth observation for weather, agriculture, disaster and cartography as named use-classes",
          "Navigation as a timing-and-position public good (NavIC) distinct from imagery",
          "Satellite communication as backhaul where fibre does not yet go",
          "Why data policy (who may access what resolution) is part of the application, not an afterthought",
        ], "cards", ["remote sensing applications India", "NavIC vs GPS conceptually"]),
        L("space-policy-private", "Indian Space Policy: Private Entry and IN-SPACe", [
          "Why a policy was needed once launch and satellite services ceased to be a state monopoly in practice",
          "IN-SPACe as the regulator-facilitator distinct from ISRO as the national agency",
          "NSIL as the commercial arm: what it sells that ISRO itself should not",
          "Liability, spectrum and debris as the three governance problems private entry does not dissolve",
        ], "flow", ["IN-SPACe NSIL", "Indian Space Policy"]),
        L("biotech-applications", "Biotechnology: Tools and Everyday Applications", [
          "rDNA, PCR and monoclonal antibodies as tools, not as three unrelated news items",
          "Health (vaccines, diagnostics), agriculture and industry as the three application theatres",
          "Why a platform (mRNA, viral vector) is not the same as a product",
          "Biosafety levels as a containment idea the page should explain without laboratory recipes",
        ], "cards", ["biotechnology applications UPSC", "rDNA PCR monoclonal"]),
        L("gm-crops-regulation", "GM Crops: Trait, Regulator and the Precaution Argument", [
          "A transgenic trait (insect resistance, herbicide tolerance) is the object of regulation, not 'GM' as a mood",
          "GEAC as the Union appraisal body under the environment rules, conceptually",
          "Field trials, food-feed safety and environmental release as three different decisions",
          "Labelling, farmer seed-saving and liability as the political economy around the science",
        ], "compare", ["GEAC GM crops India", "Bt trait regulation"]),
        L("ipr-and-nanotech", "IPR in S&T: Patents, Traditional Knowledge and Nanotech Caution", [
          "Patent as a time-limited exclusion, not as a scientific certificate of truth",
          "Evergreening versus genuine incremental invention as the pharmaceutical flashpoint",
          "Traditional knowledge: defensive documentation versus positive protection",
          "Nanotechnology: surface-driven properties and why novel exposure routes matter for regulation",
        ], "cards", ["patent evergreening India", "traditional knowledge IPR"]),
      ]),
      topic("it-cyber-internal-security", "IT, Cyber and Internal Security", SEC, [
        L("it-act-intermediaries", "IT Law: Offences, Intermediaries and the Takedown Problem", [
          "The IT Act as the principal cyber statute: offences plus intermediary due diligence",
          "Safe harbour as conditional immunity, not as a free pass",
          "Why takedown without due process is both a speech and a security dilemma",
          "What the page must not do: list every section number as if that were understanding",
        ], "flow", ["IT Act intermediary UPSC", "safe harbour India"]),
        L("cyber-security-architecture", "Cyber Security: CIA Triad, CERT-In and Critical Infrastructure", [
          "Confidentiality, integrity and availability as the three properties being defended",
          "CERT-In as the national incident-response node, not as a police force",
          "Critical information infrastructure and why a power grid is not a website",
          "People, process and patching as the unglamorous bulk of cyber security",
        ], "hierarchy", ["CERT-In UPSC", "CIA triad cyber"]),
        L("social-media-internal-security", "Social Media and Internal Security: Rumour, Radicalisation, Deepfakes", [
          "Virality as a force-multiplier for rumour during riots and disasters",
          "Radicalisation as a pipeline, not as a single video",
          "Deepfakes as an authenticity shock to evidence and to public order",
          "Why a platform takedown is not a substitute for local policing and counter-speech",
        ], "flow", ["social media internal security", "deepfake public order"]),
        L("left-wing-extremism", "Left-Wing Extremism: Causes, Geography and the Two-Track Response", [
          "LWE as a political-violence problem with a forest-and-governance geography, not as a pan-India insurgency",
          "Land, displacement, absence of the civil state and a Maoist party structure as the usual causal stack",
          "Security operations plus development plus rights (FRA, PESA) as the three tracks that must move together",
          "Why a killed-leader statistic is not a strategy",
        ], "cards", ["left wing extremism UPSC", "LWE development security"]),
        L("terrorism-and-agencies", "Terrorism: Definitions, Financing and the Agency Map", [
          "Terrorism as politically motivated violence against civilians, distinct from insurgency and communal riot",
          "UAPA as the principal Union anti-terror statute conceptually — listing, investigation, and the bail design",
          "NIA versus state police: when a case becomes a national investigation",
          "Why intelligence fusion fails when agencies hoard rather than share",
        ], "hierarchy", ["NIA UAPA UPSC", "terrorism vs insurgency"]),
        L("border-management", "Border Management: Land Borders, Fencing and the Local Economy", [
          "Why a border is a security line, a market and a kinship map at once",
          "Fencing, floodlights, border roads and surveillance as a package, not as a wall-only policy",
          "Differentiated borders: Pakistan, Bangladesh, China, Myanmar, Nepal as different problems",
          "Border haats and regulated trade as the alternative to an only-punitive approach",
        ], "compare", ["border management India", "fencing vs development border"]),
        L("coastal-security", "Coastal Security: Layers after 26/11", [
          "Why 26/11 exposed a gap between coastal police, state marine police, Coast Guard and Navy",
          "Three-tier coastal security as a named design: police, Coast Guard, Navy",
          "Registration of boats, transponders and landing-point control as the unglamorous core",
          "Coastal radar and AIS as sensors that still need a human fusion centre",
        ], "flow", ["coastal security India", "26/11 coastal lessons"]),
        L("organised-crime-terror-nexus", "Organised Crime and the Terror Nexus", [
          "Organised crime as a continuing enterprise (extortion, trafficking, arms) with a profit motive",
          "The nexus: shared logistics, fake documents, hawala and weapons, not a full merger of motives",
          "Why a crime-terror case needs both police evidence and financial intelligence",
          "Gold, drugs and wildlife as three trafficking markets that can finance violence",
        ], "cards", ["organised crime terrorism nexus", "hawala terror finance"]),
        L("pmla-money-laundering", "Money Laundering: Placement, Layering, Integration and PMLA", [
          "The three stages as a teaching model of how illicit value is cleaned",
          "PMLA: proceeds of crime, attachment, and the special court as the three distinctive tools",
          "Predicate offence as the necessary upstream crime — laundering is not a free-standing mood",
          "ED as the principal investigating agency under PMLA, conceptually, not as a scorecard",
        ], "flow", ["PMLA UPSC", "placement layering integration"]),
        L("fatf-and-fiu", "FATF Standards and India's Financial-Intelligence Stack", [
          "FATF as a standard-setting body on AML/CFT, not as a treaty court",
          "Grey listing as enhanced monitoring, not as a UN sanction",
          "FIU-IND as the national financial-intelligence unit receiving STRs",
          "KYC and beneficial ownership as the two plumbing rules that make STRs possible",
        ], "hierarchy", ["FATF grey list conceptually", "FIU-IND STR"]),
      ]),
    ],
  },
  {
    slug: "upsc-csat",
    name: "CSAT",
    description:
      "Prelims Paper II method corpus: how to read, reason, calculate and decide under a qualifying cutoff. No blueprint twin.",
    paper: "Prelims Paper II",
    sources: SRC,
    topics: [
      topic("comprehension-method", "Reading Comprehension: Method", CSAT, [
        L("rc-active-reading", "RC Method: Question First, Passage Second", [
          "Why reading the questions before the passage cuts rereading on a timed paper",
          "Marking contrast words, conclusions and scope limits on the one allowed pass",
          "Main idea versus supporting example: the option that is true but not central",
          "When to skip a dense RC and return after the scoring reasoning sets",
        ], "flow", ["CSAT reading comprehension method", "UPSC CSAT RC"]),
        L("rc-inference-tone", "Inference, Assumption and Tone in CSAT RC", [
          "Inference must be forced by the passage, not merely consistent with it",
          "Assumption as an unstated premise the argument needs, not as a restatement",
          "Tone vocabulary: critical, analytical, sceptical, advocacy — pick from evidence, not vibe",
          "Extreme options (always, never, only) as the first to test against a qualifier in the text",
        ], "compare", ["inference vs assumption CSAT", "RC tone UPSC"]),
      ]),
      topic("logical-reasoning", "Logical Reasoning Types", CSAT, [
        L("syllogism-venn", "Syllogisms and Venn: What Must Be True", [
          "All, some, no, some-not as the four standard categorical forms",
          "Why a Venn sketch beats verbal rules when two or three statements interact",
          "Possibility versus certainty: the option that 'can be' is not the option that 'must be'",
          "Complement trick: if 'all A are B' is true, 'some B are not A' is not forced",
        ], "flow", ["CSAT syllogism", "Venn diagram reasoning"]),
        L("statement-assumption-conclusion", "Statement–Assumption, Conclusion and Course of Action", [
          "An assumption is necessary for the statement to make sense, not merely helpful",
          "Conclusion must stay inside the statement's scope; outside knowledge is a trap",
          "Course of action: feasible, relevant, and not an overreaction to a one-line problem",
          "Two-statement questions: check each independently before using 'either' or 'both'",
        ], "cards", ["statement assumption CSAT", "course of action reasoning"]),
        L("coding-blood-relations", "Coding–Decoding and Blood Relations: Systematic Enumeration", [
          "Letter-shift, reverse-order and mixed coding: write the mapping once, then apply",
          "Blood relations: draw, do not narrate; spouse and sibling links as the usual forks",
          "Coded relations: decode the symbols before placing people",
          "Why a generation error is the most common miss, not a vocabulary miss",
        ], "flow", ["blood relations CSAT", "coding decoding method"]),
        L("arrangement-puzzles", "Linear and Circular Arrangement: Constraints First", [
          "List definite constraints before placing anyone; 'who is not' is a later filter",
          "Circular: clockwise/anti-clockwise and left/right as two conventions you must lock",
          "When to draw two parallel sketches rather than force one picture",
          "Stop after the asked question; extra placement is unforced labour",
        ], "cards", ["seating arrangement CSAT", "circular arrangement left right"]),
      ]),
      topic("numeracy-and-di", "Numeracy and Data Interpretation", CSAT, [
        L("percentages-ratios-averages", "Percentages, Ratios and Averages: CSAT Speed Layer", [
          "Percentage change versus percentage-point change",
          "Ratio as a cancelled fraction; mixture as a weighted ratio",
          "Average as total over count; why a combined average is not the mean of averages unless weights match",
          "Approximation: when the options are wide enough to skip the last digit",
        ], "compare", ["percentage vs percentage point", "weighted average CSAT"]),
        L("time-work-speed", "Time–Work and Speed–Distance: Invert and Scale", [
          "Work rate as reciprocal of time; combined rates add only for independent workers",
          "Pipes and cisterns as signed work (fill minus leak)",
          "Speed–distance: average speed is harmonic when the distances are equal, not when times are",
          "Relative speed: same direction subtract, opposite add — and when trains need extra length",
        ], "flow", ["time and work CSAT", "average speed harmonic"]),
        L("data-interpretation", "Data Interpretation: Read the Stem Before the Chart", [
          "Units, base year, stacked versus grouped bars, and whether a pie is of a stated total",
          "Compute only the series the question named; unused rows are bait",
          "Data sufficiency: whether the statements independently or jointly pin a unique answer",
          "A 'cannot be determined' option is live when a base is missing",
        ], "cards", ["CSAT data interpretation", "data sufficiency method"]),
        L("number-series-properties", "Number Series, Odd One Out and Class-X Number Properties", [
          "Series: name the rule (add, multiply, alternate, square) before computing the next term",
          "Odd one out: one property that four share and the fifth breaks, not a story about the fifth",
          "HCF–LCM, remainders and divisibility as the usual Class-X toolkit the paper still uses",
          "Stop algebra when options allow bounding; CSAT rewards the inequality that kills three choices",
        ], "flow", ["CSAT number series", "HCF LCM remainders"]),
      ]),
      topic("decision-and-strategy", "Decision Making and Paper Strategy", CSAT, [
        L("decision-making-cases", "Decision Making: Lawful, Impartial, Feasible", [
          "The CSAT decision set tests public-reason, not private taste",
          "Eliminate options that break a stated rule, show bias, or exceed the officer's power",
          "Prefer the option that records, escalates, or applies a known procedure over a heroic improvisation",
          "When two options are decent, pick the one that is more reversible and more documented",
        ], "hierarchy", ["CSAT decision making", "UPSC interpersonal decision"]),
        L("csat-time-strategy", "CSAT Time Strategy: Qualifying Paper Discipline", [
          "The paper is qualifying: the aim is a stable clearance, not a maximised raw score",
          "First pass: RC you can finish, then reasoning, then DI; park calculation-heavy items",
          "Negative marking: skip a 50–50 that needs a long calculation; attempt a 50–50 that is a one-line logic check",
          "Last fifteen minutes: unanswered easy syllogisms beat a third reread of a philosophy RC",
        ], "flow", ["CSAT time management", "CSAT qualifying strategy"]),
      ]),
    ],
  },
];
