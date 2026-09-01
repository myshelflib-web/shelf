import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://legislative.gov.in/constitution-of-india",
  "https://main.sci.gov.in/judgments",
];

const CF = "GS Paper II — Indian Constitution—historical underpinnings, evolution, features, amendments, significant provisions and basic structure.";
const UG = "GS Paper II — Parliament and State Legislatures—structure, functioning, conduct of business, powers & privileges; Structure, organization and functioning of the Executive.";
const JF = "GS Paper II — Functions and responsibilities of the Union and the States, issues and challenges pertaining to the federal structure; Separation of powers; Judiciary.";
const LB = "GS Paper II — Devolution of powers and finances up to local levels; Appointment to various Constitutional posts; Statutory, regulatory and various quasi-judicial bodies.";
const GR = "GS Paper II — Salient features of the Representation of People's Act; Important aspects of governance, transparency and accountability; Role of civil services in a democracy; Pressure groups and formal/informal associations.";

export const UPSC_POLITY_CORPUS: SyllabusSubject[] = [
  {
    slug: "upsc-polity",
    name: "Indian Polity & Constitution",
    description:
      "GS Paper II polity at topic granularity: one page per concept the exam actually tests.",
    paper: "GS Paper II",
    sources: SRC,
    topics: [
      topic("constitutional-framework", "Constitutional Framework", CF, [
        L("making-of-the-constitution", "Making of the Constitution: Assembly to Commencement", [
          "Constituent Assembly first sitting 9 December 1946; Objectives Resolution moved by Nehru on 13 December 1946",
          "Drafting Committee chaired by Ambedkar (29 August 1947) and the three readings of the Draft",
          "Adopted 26 November 1949; commenced 26 January 1950 — which provisions operated from adoption itself",
          "Original scheme: 395 Articles and 8 Schedules, and why later growth is mostly via amendment and interpretation",
        ], "timeline", ["Constituent Assembly UPSC", "26 November 1949"]),
        L("preamble-status-and-words", "Preamble: Status, Words and Amendability", [
          "Sovereign Socialist Secular Democratic Republic; Justice, Liberty, Equality, Fraternity as the stated objects",
          "Berubari (1960) treated the Preamble as not a source of power; Kesavananda Bharati (1973) held it is part of the Constitution",
          "42nd Amendment 1976 inserted Socialist, Secular and integrity — what those words do and do not legally add",
          "Preamble can be amended under 368 but not so as to destroy the basic structure",
        ], "compare", ["Preamble basic structure", "42nd Amendment Preamble"]),
        L("citizenship-part-ii", "Citizenship: Articles 5–11 and Parliamentary Power", [
          "Articles 5–10 as commencement rules; Article 11 as the continuing power of Parliament",
          "Citizenship Act 1955 modes: birth, descent, registration, naturalisation, incorporation of territory",
          "Why Indian law does not recognise dual citizenship as a constitutional status",
          "Termination, deprivation and renunciation as statutory tracks, not Part III rights",
        ], "flow", ["Article 11 citizenship", "Citizenship Act 1955"]),
        L("basic-structure-doctrine", "Basic Structure: Kesavananda to IR Coelho", [
          "Kesavananda Bharati (1973): amendatory power under 368 is wide but cannot damage basic structure",
          "Indira Nehru Gandhi v Raj Narain (1975): the doctrine can strike an ordinary law that attacks free and fair elections",
          "Minerva Mills (1980): unlimited amendatory power and the 14/19 versus DPSP imbalance both fail",
          "IR Coelho (2007): Ninth Schedule laws inserted after 24 April 1973 are open to basic-structure review",
        ], "timeline", ["Kesavananda Bharati 1973", "IR Coelho Ninth Schedule"]),
        L("fundamental-rights-architecture", "Part III Architecture: State, Laws and Clusters", [
          "Article 12 definition of State and why instrumentalities get pulled in",
          "Article 13: pre-existing law void to the extent of inconsistency; 13(2) bars future abridging laws",
          "Clusters: 14–18 equality, 19–22 freedom, 23–24 exploitation, 25–28 religion, 29–30 culture, 32 remedies",
          "44th Amendment moved property out of Part III to Article 300A — a legal right, not a fundamental right",
        ], "hierarchy", ["Article 12 State", "Article 300A property"]),
        L("equality-articles-14-18", "Equality: Articles 14 to 18", [
          "Article 14: equality before law and equal protection; reasonable classification needs intelligible differentia plus rational nexus",
          "Arbitrariness as a 14 test after E.P. Royappa and Maneka Gandhi",
          "15 and 16: non-discrimination and equality of opportunity; 15(4)/16(4) as enabling clauses, 15(6)/16(6) as the 103rd EWS clauses",
          "17 abolishes untouchability; 18 bars titles except military and academic distinctions",
        ], "compare", ["Article 14 classification", "103rd Amendment EWS"]),
        L("freedoms-article-19", "Article 19 Freedoms and Reasonable Restrictions", [
          "19(1)(a)–(g) as six freedoms after the 44th dropped 19(1)(f)",
          "Restrictions must be by law and on the grounds listed in 19(2)–(6) — not a general public-interest clause for speech",
          "Freedom of the press as a judicial reading of 19(1)(a), not a separate clause",
          "19(1)(g) versus professional regulation: restriction must still be reasonable and purpose-linked",
        ], "cards", ["Article 19 reasonable restrictions", "freedom of press 19(1)(a)"]),
        L("article-21-life-liberty", "Article 21: From Gopalan to Puttaswamy", [
          "A.K. Gopalan (1950): 'procedure established by law' read as any enacted procedure",
          "Maneka Gandhi (1978): procedure must be fair, just and reasonable; 21 is read with 14 and 19",
          "Judicial expansion: speedy trial, legal aid, livelihood, clean environment — as 21 corollaries, not new articles",
          "K.S. Puttaswamy (2017): privacy as a fundamental right; 21A (86th Amendment) as a distinct education right",
        ], "timeline", ["Maneka Gandhi Article 21", "Puttaswamy privacy"]),
        L("articles-20-22-and-32", "Articles 20, 22 and 32: Safeguards and Remedies", [
          "Article 20: no ex post facto criminal law, no double jeopardy, no compelled self-incrimination",
          "Article 22: rights of the arrested, and the separate preventive-detention track with its advisory-board scheme",
          "Article 32 as the constitutional remedy; five writs and Ambedkar's 'heart and soul' characterisation",
          "32 versus 226: High Court writ is wider in purpose and in the persons it can reach",
        ], "compare", ["Article 32 vs 226", "Article 20 double jeopardy"]),
        L("dpsp-part-iv", "Directive Principles: Part IV and Harmony with Rights", [
          "Articles 36–51; Article 37 — not enforceable in court but fundamental in governance",
          "Champakam Dorairajan (1951): Fundamental Rights prevail if they clash; the First Amendment as the political reply",
          "Minerva Mills: FRs and DPSPs are to be read in harmony, not with either erased",
          "42nd added 39A, 43A, 48A; 44 UCC and 50 separation of judiciary as perennial exam clauses",
        ], "compare", ["Article 37 DPSP", "Minerva Mills FR DPSP"]),
        L("fundamental-duties-51a", "Fundamental Duties: Article 51A", [
          "42nd Amendment inserted 51A on the Swaran Singh Committee's recommendation",
          "86th Amendment added 51A(k): parent or guardian to provide education to the child",
          "Duties are not directly justiciable; they inform interpretation and reasonable-restriction analysis",
          "Duty versus right: 51A does not create a cause of action against a private person by itself",
        ], "cards", ["Article 51A duties", "86th Amendment 51A(k)"]),
        L("amendment-article-368", "Amendment: Article 368 and the Three Tracks", [
          "Simple-majority changes outside 368 (e.g. new states under 3, 4; quorum and procedure items)",
          "Special majority under 368 for the general amendatory track",
          "Special majority plus ratification by at least half the states for federal provisions (including 368 itself and the Seventh Schedule)",
          "24th Amendment confirmed Parliament's power to amend Part III; Kesavananda then capped that power",
        ], "flow", ["Article 368 ratification", "types of amendments UPSC"]),
      ]),
      topic("union-government", "Union Government", UG, [
        L("president-election-and-office", "President: Election, Tenure and Removal", [
          "Article 52 office; 58 qualifications; 56 five-year term and the holding-over rule",
          "Article 54 electoral college: elected MPs plus elected MLAs of states and specified UTs — nominated members do not vote",
          "Article 55: proportional representation by single transferable vote and the parity formula between Union and states",
          "Article 61 impeachment for violation of the Constitution; 71 election disputes go to the Supreme Court",
        ], "hierarchy", ["Article 54 electoral college", "Article 61 impeachment"]),
        L("president-powers-ordinance-pardon", "President: Ordinance, Pardon and Aid-and-Advice", [
          "Article 74: Council of Ministers to aid and advise; 42nd/44th made that advice binding and kept the one-return rule",
          "Article 123 ordinance: circumstances, duration, and why re-promulgation was condemned in D.C. Wadhwa and Krishna Kumar Singh (2017)",
          "Article 72 pardon: Kehar Singh — the power is wide but not beyond judicial review for arbitrariness",
          "Pocket and suspensive veto as working labels for 111 assent behaviour, not separate constitutional clauses",
        ], "flow", ["Article 123 ordinance", "Article 72 pardon"]),
        L("vice-president", "Vice-President and the Rajya Sabha Chair", [
          "Articles 63–69: election by both Houses without state assemblies, unlike the President",
          "Ex-officio Chairman of the Rajya Sabha under 64, with a casting vote in the Chair's role",
          "Removal by a Rajya Sabha resolution agreed to by the Lok Sabha — not impeachment",
          "Vacancy: the Vice-President does not automatically become President; 65 is discharge of functions",
        ], "compare", ["Vice-President election", "Article 65 acting President"]),
        L("prime-minister-and-cabinet", "Prime Minister, Cabinet and the Council of Ministers", [
          "Article 75: President appoints the Prime Minister and, on PM advice, other ministers",
          "Council of Ministers, Cabinet and kitchen cabinet as concentric circles — only the CoM is in the text",
          "Article 78: PM's duty to communicate and to furnish information the President calls for",
          "91st Amendment: CoM size capped at 15 per cent of the House; 75(1B) bars a disqualified defector from ministership",
        ], "hierarchy", ["Article 75 Council of Ministers", "91st Amendment 15 percent"]),
        L("collective-responsibility", "Collective Responsibility and the Pleasure Doctrine", [
          "Article 75(3): the Council is collectively responsible to the Lok Sabha, not to the Rajya Sabha",
          "Individual ministerial responsibility and the pleasure doctrine under 75(2)",
          "Defeat on a no-confidence motion, or PM resignation, drops the whole Council",
          "Cabinet secrecy and joint answerability as conventions that make 75(3) operational",
        ], "flow", ["Article 75(3) collective responsibility", "no-confidence motion"]),
        L("lok-sabha-and-rajya-sabha", "Lok Sabha and Rajya Sabha: Composition and Special Powers", [
          "Article 79 Parliament; 80 Rajya Sabha — twelve nominated members from literature, science, art and social service",
          "Article 81 ceilings and the delimitation freeze (84th/87th) — do not treat a current seat tally as the constitutional number",
          "Rajya Sabha cannot be dissolved; 83 duration; Money Bills cannot originate there (109)",
          "Special RS powers: 249 (state list in national interest) and 312 (All-India Services)",
        ], "compare", ["Article 80 nominated members", "Article 249 Rajya Sabha"]),
        L("parliamentary-sessions-and-procedure", "Sessions, Quorum, Voting and Joint Sitting", [
          "Article 85: summon, prorogue, dissolve; six-month outer gap between sittings",
          "Article 100: quorum as one-tenth of the membership; Speaker's casting vote except on a tie-breaking reading of the clause",
          "Question Hour as rules-of-procedure; Zero Hour as a practice, not a constitutional slot",
          "Article 108 joint sitting: ordinary bills only — not Money Bills and not 368 amendments",
        ], "cycle", ["Article 108 joint sitting", "Article 85 sessions"]),
        L("types-of-bills", "Ordinary, Financial and Constitution Amendment Bills", [
          "Ordinary bill path: three readings, passage in both Houses, 111 assent, 108 as the deadlock device",
          "Financial bills under 117: Category I wears Money-Bill clothes; Category II only needs LS recommendation to introduce",
          "Constitution amendment bills follow 368, never 108",
          "President's assent, withhold, or (for ordinary bills) one-time return — the 111 menu",
        ], "flow", ["Article 111 assent", "Article 117 financial bill"]),
        L("money-bill-article-110", "Money Bill: Article 110 and the Speaker's Certificate", [
          "110(1)(a)–(g) as an exhaustive list: tax, borrowing, Consolidated Fund, appropriation, and kindred items",
          "Speaker's certificate under 110(3) is final inside Parliament; judicial review is the live debate, not a settled bar",
          "Rajya Sabha has 14 days under 109 and cannot amend a Money Bill — only recommend",
          "A Finance Bill is not automatically a Money Bill; only the 110-certified text is",
        ], "compare", ["Article 110 Money Bill", "Money Bill vs Finance Bill"]),
        L("parliamentary-committees", "Parliamentary Committees: Financial and Departmental", [
          "Public Accounts Committee reads CAG reports; Estimates Committee and COPU as the other two financial committees",
          "Departmentally Related Standing Committees (from 1993) as the scrutiny layer before the House",
          "Select and joint committees as ad-hoc devices; Business Advisory Committee as the timetable organ",
          "A committee can recommend; it cannot pass a law or a Money Bill",
        ], "cards", ["PAC CAG reports", "DRSC Parliament"]),
        L("anti-defection-tenth-schedule", "Anti-Defection: Tenth Schedule and the 91st Amendment", [
          "52nd Amendment 1985: disqualification for voluntarily giving up membership or voting against the whip",
          "91st Amendment deleted the one-third split; only a two-thirds merger still saves members",
          "Kihoto Hollohan (1992): the Speaker/Chairman's decision is a Tribunal act, open to judicial review",
          "Whip versus conscience: the Schedule punishes voting behaviour, not speech inside the party",
        ], "timeline", ["Tenth Schedule defection", "Kihoto Hollohan"]),
        L("parliamentary-privileges-and-speaker", "Privileges, the Speaker and Codification", [
          "Articles 105 and 194: freedom of speech in the House and the 'other privileges' clause",
          "Privileges are largely uncodified; breach versus contempt as two different House processes",
          "Speaker: 93–96, resignation, removal, and the 100 casting vote",
          "Why a privilege claim cannot be used to shut down 19(1)(a) reporting of what is already on the record",
        ], "cards", ["Article 105 privileges", "Speaker casting vote"]),
      ]),
      topic("judiciary-federalism", "Judiciary and Federalism", JF, [
        L("supreme-court-jurisdiction", "Supreme Court: Original, Appellate, Advisory and SLP", [
          "Article 131 original jurisdiction for Union–State and inter-State legal disputes (not political questions as such)",
          "132–134 appellate tracks; 136 special leave as the residual, discretionary gateway",
          "143 advisory opinion: not a binding decree, but treated with high persuasive force",
          "141 law declared is binding on all courts; 137 review sits with the Court itself",
        ], "hierarchy", ["Article 136 SLP", "Article 143 advisory"]),
        L("high-courts-and-article-226", "High Courts: 226, 227 and Subordinate Courts", [
          "Article 214 High Courts; 226 writs for fundamental rights and 'for any other purpose'",
          "227 superintendence over courts and tribunals throughout the territories",
          "228: shift a substantial constitutional question from a subordinate court to the High Court",
          "233–237 district judiciary: appointment and control as a High Court–Governor joint field",
        ], "compare", ["Article 226 writs", "Article 227 superintendence"]),
        L("collegium-and-njac", "Appointments: Collegium, Memorandum of Procedure and NJAC", [
          "Second Judges Case (1993): collegium primacy in appointment and transfer",
          "Third Judges Case (1998): the consultation circle around the CJI",
          "99th Amendment (NJAC) struck down in Supreme Court Advocates-on-Record Association (2015)",
          "Memorandum of Procedure as the executive–judiciary working text, not a substitute for 124 and 217",
        ], "timeline", ["Second Judges Case 1993", "NJAC 99th Amendment"]),
        L("judicial-review", "Judicial Review and Public Interest Litigation", [
          "Review is built from 13, 32, 226 and the appellate articles — not a single 'review clause'",
          "Basic structure is a limit on 368, not a free-standing cause of action against every statute",
          "PIL: liberalised locus after S.P. Gupta / Bandhua Mukti Morcha — epistolary jurisdiction as practice",
          "Review versus appeal versus curative petition as three different post-decision tracks",
        ], "flow", ["judicial review India", "PIL locus standi"]),
        L("seventh-schedule-lists", "Seventh Schedule: Union, State and Concurrent Lists", [
          "Article 246 and the three lists: Union List I, State List II, Concurrent List III",
          "Residuary power: 248 read with Union List entry 97",
          "254: Union law prevails on a Concurrent field; 254(2) state law with Presidential assent can occupy a notified patch",
          "Repugnancy is a Concurrent-list problem; occupied field is the doctrinal label, not a separate article",
        ], "hierarchy", ["Article 246 Seventh Schedule", "Article 254 repugnancy"]),
        L("union-state-legislative-relations", "Union–State Legislative and Administrative Relations", [
          "245 territorial extent; extra-territorial Union legislation is expressly allowed",
          "249 Rajya Sabha resolution, 250 during emergency, 252 by consent of states, 253 for treaties",
          "256–257: state compliance with Union laws and Union directions; 365 as the compliance hook for 356",
          "Why 256 is not a general power to run a state department from Delhi",
        ], "cards", ["Article 249 State List", "Article 256 Union directions"]),
        L("article-356-bommai", "Article 356: President's Rule after S.R. Bommai", [
          "356: failure of constitutional machinery; 365 as one (not the only) trigger for that satisfaction",
          "S.R. Bommai (1994): the floor of the House is the proving ground; mala fides are justiciable",
          "Secularism as basic structure used in Bommai to test a dismissal",
          "44th Amendment: proclamation must be before Parliament; dissolution is not automatic on the day of the proclamation",
        ], "timeline", ["Article 356 Bommai", "President's Rule judicial review"]),
        L("interstate-council-and-water", "Inter-State Council and Water Disputes", [
          "Article 263 Inter-State Council: inquiry, discussion, recommendation — not a court",
          "Article 262: Parliament may keep the Supreme Court out of a water-dispute statute",
          "Sarkaria and Punchhi reports as the reform vocabulary for Union–State machinery",
          "A water tribunal is a statutory forum; it does not repeal 131 for non-water disputes",
        ], "compare", ["Article 263 Inter-State Council", "Article 262 water disputes"]),
        L("gst-council-article-279a", "GST Council as a Federal Body: Article 279A", [
          "101st Amendment: 246A concurrent GST power; 269A IGST; 279A the Council",
          "279A(9): Union one-third weight, states two-thirds; decision by not less than three-fourths of weighted votes cast",
          "Recommendations versus legislation: Parliament and state legislatures still have to enact",
          "Union of India v Mohit Minerals (2022): Council recommendations are not a binding third legislative chamber",
        ], "flow", ["Article 279A GST Council", "101st Amendment GST"]),
        L("cooperative-competitive-federalism", "Cooperative and Competitive Federalism in the Text", [
          "Cooperative devices already in the text: 263, 282 grants, 293 borrowing, All-India Services under 312",
          "Competitive federalism as a policy label for investment-seeking states — not a constitutional clause",
          "Finance Commission (280) as the rule-based transfer organ versus scheme-tied Union grants",
          "Why a centrally sponsored scheme is an administrative bargain, not a Seventh Schedule amendment",
        ], "compare", ["cooperative federalism UPSC", "Article 312 All-India Services"]),
      ]),
      topic("local-bodies-and-constitutional-bodies", "Local Bodies and Constitutional Bodies", LB, [
        L("seventy-third-amendment", "73rd Amendment: Panchayats and the Eleventh Schedule", [
          "Part IX, Articles 243–243-O; Gram Sabha under 243A as the base unit",
          "Three-tier design 243B (village, intermediate, district) with a small-state exception",
          "243D reservations; 243E five-year term; 243K State Election Commission; 243I State Finance Commission",
          "243G plus the Eleventh Schedule (29 items) as a devolution list — not a self-executing power grant",
        ], "hierarchy", ["73rd Amendment Panchayati Raj", "Eleventh Schedule 29 subjects"]),
        L("seventy-fourth-amendment", "74th Amendment: Municipalities and the Twelfth Schedule", [
          "Part IXA, 243P–243ZG: Nagar Panchayat, Municipal Council, Municipal Corporation as types",
          "Twelfth Schedule: 18 functions that the state may endow — again a list, not automatic transfer",
          "District Planning Committee 243ZD and Metropolitan Planning Committee 243ZE",
          "Why a state municipal law still has to move funds, functionaries and functions for the amendment to bite",
        ], "hierarchy", ["74th Amendment municipalities", "Twelfth Schedule"]),
        L("election-commission-article-324", "Election Commission: Article 324", [
          "324: superintendence, direction and control of elections to Parliament, state legislatures, President and Vice-President",
          "CEC and Election Commissioners; 324(2) appointment by the President until Parliament occupies the field by law",
          "CEC removal like a Supreme Court judge; another EC is removed on the CEC's recommendation",
          "Model Code of Conduct as an instruction of the Commission, not a statute",
        ], "cards", ["Article 324 ECI", "CEC removal procedure"]),
        L("comptroller-and-auditor-general", "Comptroller and Auditor General: Articles 148–151", [
          "148: appointed by the President; removal on like grounds as a Supreme Court judge",
          "149 duties as prescribed by Parliament; reports under 151 go to the President/Governor and then the House",
          "CAG audits; the Controller General of Accounts compiles Union accounts — do not collapse the two offices",
          "PAC is the parliamentary reader of CAG reports, not the auditor itself",
        ], "flow", ["Article 148 CAG", "Article 151 CAG report"]),
        L("union-public-service-commission", "UPSC and Public Service Commissions: 315–323", [
          "315: UPSC and State PSCs; a joint commission is possible under 315(2)",
          "320 functions: recruitment, promotions, disciplinary advice — advice, not a veto on the government",
          "322 expenses charged on the Consolidated Fund; 323 reports laid in the House",
          "Why a recruiting body is not the cadre-controlling authority",
        ], "cards", ["Article 320 UPSC", "SPSC vs UPSC"]),
        L("finance-commission-article-280", "Finance Commission: Article 280", [
          "280: constituted every fifth year (or earlier); 281 requires the recommendations and the Action Taken Report to be tabled",
          "Vertical devolution versus horizontal shares among states",
          "Tax devolution versus grants-in-aid under 275 — autonomy sits more with the former",
          "State Finance Commission under 243-I is a different organ for local bodies",
        ], "hierarchy", ["Article 280 Finance Commission", "Article 275 grants"]),
        L("attorney-general-article-76", "Attorney-General: Article 76", [
          "76: appointed by the President; must be qualified to be a Supreme Court judge",
          "Right of audience in all Indian courts; may take part in Parliament under 88 but not vote",
          "Not a member of the Council of Ministers; holds office during the President's pleasure",
          "Advocate-General of the state is the 165 analogue, not a subordinate of the Attorney-General",
        ], "compare", ["Article 76 Attorney-General", "Article 165 Advocate-General"]),
        L("national-commissions-338", "National Commissions: 338, 338A and 338B", [
          "338 NCSC, 338A NCST (89th Amendment), 338B NCBC (102nd Amendment) as constitutional bodies",
          "Investigative and recommendatory powers; they are not criminal courts",
          "Reports to the President, laid in Parliament, with the memorandum of action taken",
          "Constitutional status versus a statutory commission: removal, charging of expenses, and the 338 duty to inquire",
        ], "compare", ["Article 338 NCSC", "102nd Amendment NCBC"]),
        L("nhrc-statutory-contrast", "NHRC as a Statutory Contrast to Constitutional Bodies", [
          "Protection of Human Rights Act 1993 creates the NHRC — it is not in the Constitution",
          "Recommendatory findings; it cannot issue a 32/226-style writ of its own",
          "Chairperson eligibility is statutory (a former Chief Justice of India in the original design) and can be amended by Parliament",
          "Contrast with ECI/CAG: those offices have constitutional removal and charging protections NHRC does not",
        ], "compare", ["NHRC Protection of Human Rights Act", "constitutional vs statutory body"]),
        L("state-election-commission", "State Election Commission versus the ECI", [
          "243K (panchayats) and 243ZA (municipalities) vest local-body elections in the SEC, not in the ECI",
          "SEC is appointed by the Governor; removal is on the pattern of a High Court judge",
          "ECI still runs Parliament, Assembly, Presidential and Vice-Presidential elections under 324",
          "Delimitation of local wards is a state/SEC field; parliamentary delimitation is a Union statutory field",
        ], "compare", ["Article 243K SEC", "ECI vs SEC"]),
      ]),
      topic("governance-rights", "Governance and Political Rights", GR, [
        L("rti-act-2005", "Right to Information: Act, Exemptions and Information Commissions", [
          "RTI Act 2005: public authority under section 2; section 4 suo motu disclosure as the first duty",
          "Section 8 exemptions (including national security, fiduciary, and personal information) and the public-interest override",
          "Central and State Information Commissions as the appellate statutory forums",
          "Constitutional hook is 19(1)(a) (S.P. Gupta / Raj Narain lineage); Official Secrets Act 1923 is the overlapping bar",
        ], "flow", ["RTI Act section 8", "Article 19(1)(a) information"]),
        L("all-india-services-and-311", "Services: Pleasure, Article 311 and All-India Services", [
          "Part XIV, 308–323; 310 pleasure doctrine as the default tenure rule",
          "311: no dismissal/removal by an authority below the appointing authority; reasonable opportunity to be heard, with the three proviso exceptions",
          "312: Rajya Sabha special resolution to create an All-India Service; IAS, IPS, IFoS as the present AIS set",
          "Dual control: Union cadre rules, state day-to-day posting — the federal steel frame in one sentence",
        ], "hierarchy", ["Article 311 safeguards", "Article 312 All-India Services"]),
        L("pressure-groups", "Pressure Groups and Formal/Informal Associations", [
          "Interest groups versus cause groups; insider versus outsider tactics",
          "Methods: lobbying, litigation, strikes, media — none of these is a constitutional office",
          "Contrast with political parties: parties seek office and are registered under the RPA; pressure groups seek to influence those who hold it",
          "When a group captures a statutory board, the exam question is capture, not the group's existence",
        ], "cards", ["pressure groups UPSC", "pressure group vs political party"]),
        L("representation-of-people-acts", "Representation of the People Acts 1950 and 1951", [
          "RPA 1950: electoral rolls, ordinary residence, and the allocation/qualification skeleton",
          "RPA 1951: conduct of elections, nominations, and corrupt practices under section 123",
          "Disqualifications: 8 (conviction), 8A (corrupt practice finding), 9–10A (office, contracts, failure of account)",
          "Section 29A registration of political parties — a statutory status, not a fundamental right to a symbol",
        ], "compare", ["RPA 1950 vs 1951", "RPA section 123 corrupt practices"]),
        L("office-of-profit-and-disqualification", "Office of Profit and Legislative Disqualification", [
          "Articles 102 and 191: office of profit under the Union or a state as a disqualification",
          "Parliament (Prevention of Disqualification) Act as the exempting schedule — exemption is statutory, not inherent",
          "Tests the courts use: appointment by government, remuneration, and whether the office can influence the holder",
          "RPA disqualification tracks sit beside 102/191; they are not substitutes for each other",
        ], "flow", ["Article 102 office of profit", "office of profit UPSC"]),
        L("citizen-charters-and-transparency", "Citizen Charters, Sevottam and E-Governance", [
          "A citizen charter is an administrative promise of standards, not a justiciable Part III right",
          "Second ARC on charters: consultation, measurable standards, grievance redress — and why most charters failed those tests",
          "Sevottam as a quality framework for service delivery, not a statute",
          "E-governance is a delivery channel; it does not by itself create an RTI record or a legal entitlement",
        ], "cards", ["citizen charter Second ARC", "Sevottam e-governance"]),
        L("civil-services-in-democracy", "Role of Civil Services in a Democracy", [
          "Permanence, neutrality and anonymity as the Westminster inheritance that 311 partly hardens",
          "Ministerial responsibility versus official advice: the file records the advice; the minister owns the decision",
          "Lateral entry and specialised regulators as complements to the career service, not a constitutional replacement",
          "Accountability routes: 311 process, CAG/PAC, RTI, and criminal law — four different clocks",
        ], "compare", ["civil services neutrality UPSC", "minister vs civil servant"]),
        L("ngos-and-civil-society", "NGOs, SHGs and Civil Society in the GS-II Syllabus", [
          "Development-process actors: NGOs, SHGs, cooperatives — they deliver and they advocate",
          "FCRA as the foreign-contribution regulatory overlay; it is a statute, not a ban on domestic association",
          "19(1)(c) association is the constitutional floor; licensing and funding rules are the statutory ceiling",
          "Complement versus substitute: a service NGO does not discharge the state's 21/21A duties",
        ], "cards", ["FCRA NGOs UPSC", "Article 19(1)(c) association"]),
      ]),
    ],
  },
];
