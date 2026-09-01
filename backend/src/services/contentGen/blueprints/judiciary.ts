import type { StarterSubject } from "../types.js";

const INDIA_CODE = "https://www.indiacode.nic.in/";
const SCI = "https://main.sci.gov.in/judgments";
const DOJ = "https://doj.gov.in/";

export const JUDICIARY_CIVIL: StarterSubject = {
  slug: "judiciary-civil-law",
  name: "Civil Law",
  description: "Civil procedure, contract, property and tort essentials.",
  paper: "Prelims & Mains",
  topics: [
    {
      slug: "civil-procedure",
      title: "Code of Civil Procedure",
      articles: [
        {
          slug: "cpc-scheme-jurisdiction-and-bars",
          title: "CPC Scheme, Civil Jurisdiction and Statutory Bars",
          syllabusAnchor:
            "Civil Law Paper — Code of Civil Procedure 1908: scheme of the Code, jurisdiction of civil courts, res judicata and res sub judice.",
          mustCover: [
            "The two-part scheme: the sections carry the framework and are amended by Parliament, while the Orders and Rules in the First Schedule govern procedure and can be amended by High Courts",
            "Section 9: a civil court tries all suits of a civil nature unless cognisance is expressly or impliedly barred",
            "Section 15: the suit must be instituted in the court of the lowest grade competent to try it, and how valuation fixes both pecuniary jurisdiction and court fee",
            "Territorial jurisdiction over immovable property under Sections 16 to 18, and Section 19 for wrongs to the person or to movable property",
            "Section 20: the residuary rule — the defendant resides, carries on business, or the cause of action arises wholly or in part",
            "Section 21: objections to place of suing and to pecuniary limits are lost unless taken at the earliest opportunity and a failure of justice is shown",
            "Section 10: a later suit is stayed where the matter in issue is directly and substantially in issue in a previously instituted suit between the same parties",
            "Section 11: same matter directly and substantially in issue, same parties or those claiming under them, a competent court and a decision on merits, with constructive res judicata under Explanation IV",
          ],
          worked: [
            "Take a money suit against a defendant residing outside the district and work out the competent court under Sections 15, 19 and 20",
          ],
          traps: [
            "Treating every jurisdictional defect as fatal — a territorial or pecuniary defect does not make the decree a nullity the way an absence of subject-matter jurisdiction does",
            "Confusing Section 10, which only stays the trial of the later suit, with Section 11, which bars the suit altogether",
          ],
          officialSources: [INDIA_CODE, SCI],
          diagram: "hierarchy",
          keywords: [
            "CPC jurisdiction Sections 15 to 20",
            "res judicata Section 11 CPC",
            "res sub judice Section 10",
            "judicial services CPC notes",
          ],
          order: 0,
        },
        {
          slug: "pleadings-plaint-and-interim-relief",
          title: "Pleadings, Rejection of Plaint and Interim Relief",
          syllabusAnchor:
            "Civil Law Paper — Institution of suits, pleadings under Orders VI and VII, and interim orders under the Code of Civil Procedure 1908.",
          mustCover: [
            "Order VI Rule 2: pleadings state material facts, not the evidence by which those facts are to be proved, and not propositions of law",
            "Order VI Rule 4: particulars must be pleaded where fraud, misrepresentation, undue influence or breach of trust is alleged",
            "Order VI Rule 17: amendment of pleadings, and the proviso barring amendment after the trial has begun unless due diligence is shown",
            "Order VII Rule 1: the particulars a plaint must contain, including the facts constituting the cause of action and the valuation of the suit",
            "Order VII Rule 11: the grounds on which a plaint is rejected, decided on the plaint averments alone, and how this differs from return of the plaint under Order VII Rule 10",
            "Order XXXIX Rules 1 and 2: the three-fold test of prima facie case, balance of convenience and irreparable injury, with Rule 2A on disobedience",
            "Order XXXVIII Rule 5: attachment before judgment requires material showing the defendant is about to dispose of or remove property to obstruct a decree",
          ],
          worked: [
            "Write the reasoning on a temporary injunction application limb by limb, showing what material supports each of the three findings",
          ],
          traps: [
            "Deciding an Order VII Rule 11 application by reading the written statement or the defendant's documents",
            "Invoking the inherent power under Section 151 where the Code already provides a specific remedy",
          ],
          officialSources: [INDIA_CODE],
          diagram: "flow",
          keywords: [
            "Order VII Rule 11 rejection of plaint",
            "temporary injunction Order 39 CPC",
            "attachment before judgment Order 38",
            "pleadings amendment Order 6 Rule 17",
          ],
          order: 1,
        },
        {
          slug: "appeal-reference-review-and-revision",
          title: "Appeal, Reference, Review and Revision Distinguished",
          syllabusAnchor:
            "Civil Law Paper — Appeals, reference, review and revision under the Code of Civil Procedure 1908.",
          mustCover: [
            "Section 96: a first appeal lies against a decree on both fact and law, and no appeal lies from a decree passed with the consent of parties",
            "Order XLI: the memorandum of appeal, the requirement to state grounds, and the appellate court's powers of remand and of framing issues",
            "Section 100: a second appeal lies only on a substantial question of law, which the High Court must formulate",
            "Section 104 read with Order XLIII Rule 1: only the orders listed there are appealable",
            "Section 113 read with Order XLVI: a reference is made by the subordinate court itself on a question of law",
            "Section 114 read with Order XLVII: review lies to the same court on discovery of new evidence, an error apparent on the face of the record, or any other sufficient reason",
            "Section 115: revision lies to the High Court on jurisdictional error and cannot be used to reappraise findings of fact",
          ],
          traps: [
            "Re-appreciating evidence in a second appeal, which Section 100 does not permit",
            "Treating every interlocutory order as appealable instead of checking the Order XLIII Rule 1 list",
          ],
          officialSources: [INDIA_CODE, SCI],
          diagram: "compare",
          keywords: [
            "difference between review and revision CPC",
            "second appeal substantial question of law",
            "Section 115 CPC revision",
            "Order 43 Rule 1 appealable orders",
          ],
          order: 2,
        },
      ],
    },
    {
      slug: "contract-and-specific-relief",
      title: "Contract & Specific Relief",
      articles: [
        {
          slug: "formation-of-contract-and-free-consent",
          title: "Formation of Contract and the Vitiating Factors",
          syllabusAnchor:
            "Civil Law Paper — Indian Contract Act 1872: formation of contract, free consent, and void and voidable agreements.",
          mustCover: [
            "Section 2: proposal, acceptance, promise, consideration, agreement and contract as a chain of defined terms",
            "Sections 3 to 9: communication of proposal and acceptance, acceptance that is absolute and unqualified, and express against implied promises",
            "Section 10 read with Section 11 on competency and Section 23 on lawful object: the ingredients of an enforceable contract",
            "Sections 13 and 14: what consent is, and when consent is free",
            "Section 15 coercion and Section 16 undue influence, including the presumption where one party is in a position to dominate the will of the other",
            "Section 17 fraud and Section 18 misrepresentation, the role of intention to deceive, and why mere silence is generally not fraud",
            "Sections 20, 21 and 22: a bilateral mistake of fact essential to the agreement makes it void, a mistake of law does not, and a unilateral mistake generally does not",
            "Sections 19 and 19A: consent caused by coercion, fraud or misrepresentation makes the contract voidable, and the court may set aside a contract induced by undue influence on terms",
          ],
          worked: [
            "Apply Sections 17 and 18 to a statement made without knowledge of its falsity and identify which remedy follows from the classification",
          ],
          traps: [
            "Calling an agreement void when the section makes it voidable at the option of the party whose consent was not free",
            "Assuming every unilateral mistake gives a ground to avoid the contract",
          ],
          officialSources: [INDIA_CODE],
          diagram: "compare",
          keywords: [
            "free consent Sections 13 to 22",
            "void and voidable agreement difference",
            "undue influence Section 16 presumption",
            "Indian Contract Act judiciary notes",
          ],
          order: 0,
        },
        {
          slug: "breach-damages-and-specific-performance",
          title: "Breach, Damages and Specific Performance",
          syllabusAnchor:
            "Civil Law Paper — Contingent and quasi contracts, discharge and breach of contract, damages, and relief under the Specific Relief Act 1963.",
          mustCover: [
            "Sections 31 to 36: contingent contracts, when they become enforceable and when they become void",
            "Sections 68 to 72: quasi-contractual obligations — necessaries supplied, payment by an interested person, benefit of a non-gratuitous act, finder of goods, and money paid by mistake or coercion",
            "Modes of discharge: performance, agreement and novation, supervening impossibility under Section 56, and breach",
            "Section 73: compensation for loss naturally arising in the usual course of things, and the remoteness rule from Hadley v Baxendale",
            "Section 74: liquidated damages and penalty, and the requirement of reasonable compensation rather than an automatic award of the stipulated sum",
            "Section 75: the party who rightfully rescinds is entitled to compensation for the loss sustained",
            "Section 10 of the Specific Relief Act as substituted in 2018: specific performance is to be enforced as a rule rather than granted as a discretionary remedy",
            "Section 14 on contracts not specifically enforceable, Section 16 on personal bars to relief, and the substituted performance route introduced by the 2018 amendment",
          ],
          worked: [
            "Work out the compensation on a failed sale, separating general damages under Section 73 from a stipulated sum tested under Section 74",
          ],
          traps: [
            "Decreeing the whole liquidated sum under Section 74 without assessing what reasonable compensation the proved loss supports",
            "Describing specific performance as purely discretionary without noting the change made by the 2018 amendment",
          ],
          officialSources: [INDIA_CODE, SCI],
          diagram: "hierarchy",
          keywords: [
            "Section 73 74 damages contract",
            "Specific Relief Amendment Act 2018",
            "quasi contract Sections 68 to 72",
            "specific performance judiciary exam",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "property-and-torts",
      title: "Property & Torts",
      articles: [
        {
          slug: "transfer-of-property-and-tort-doctrines",
          title: "Transfer of Property and Tort: Core Doctrines",
          syllabusAnchor:
            "Civil Law Paper — Transfer of Property Act 1882 and the general principles of the law of torts.",
          mustCover: [
            "Section 5: a transfer of property is an act by a living person conveying property to one or more living persons, and what 'property' covers",
            "Section 6: what cannot be transferred, including a mere chance of an heir apparent succeeding",
            "Section 41 on transfer by an ostensible owner and Section 43 on feeding the grant by estoppel, both protecting a transferee who acted in good faith",
            "Section 52: lis pendens — a transfer during the pendency of a suit does not affect the rights of the other party under the decree",
            "Section 53A: the doctrine of part performance, its conditions, and that it is a shield protecting possession rather than a source of title",
            "Damnum sine injuria set against injuria sine damno, and why only an infringement of a legal right is actionable",
            "Vicarious liability of the master for acts in the course of employment, and the limit where the servant is on a frolic of his own",
            "Strict liability under Rylands v Fletcher with its recognised exceptions, and absolute liability as laid down in M.C. Mehta v Union of India",
          ],
          traps: [
            "Using Section 53A to claim title or to sue for possession, when it only defends possession already taken under the contract",
            "Treating absolute liability as strict liability with the same exceptions — the Indian rule admits none",
          ],
          officialSources: [INDIA_CODE, SCI],
          diagram: "compare",
          keywords: [
            "doctrine of lis pendens Section 52",
            "part performance Section 53A",
            "damnum sine injuria injuria sine damno",
            "strict and absolute liability India",
          ],
          order: 0,
        },
      ],
    },
  ],
};

export const JUDICIARY_CRIMINAL: StarterSubject = {
  slug: "judiciary-criminal-law",
  name: "Criminal Law & Procedure",
  description: "Offences, general exceptions and criminal procedure.",
  paper: "Prelims & Mains",
  topics: [
    {
      slug: "substantive-criminal-law",
      title: "Substantive Criminal Law",
      articles: [
        {
          slug: "criminal-liability-and-general-exceptions",
          title: "Criminal Liability, General Exceptions, Private Defence",
          syllabusAnchor:
            "Criminal Law Paper — General principles of criminal liability, the general exceptions, and the right of private defence under the Indian Penal Code and the Bharatiya Nyaya Sanhita.",
          mustCover: [
            "Actus reus and mens rea, and how the mental element appears in the Code as intention, knowledge, rashness or negligence",
            "Statutory offences of strict liability, and when clear statutory language displaces the presumption of mens rea",
            "The general exceptions in Chapter IV of the Indian Penal Code, Sections 76 to 106, and that they apply to special laws as well",
            "Section 79 mistake of fact and Section 80 accident, contrasted with a mistake of law",
            "Section 84: the test is legal insanity — unsoundness of mind at the time of the act such that the accused could not know its nature or that it was wrong",
            "Sections 85 and 86: involuntary intoxication as a defence, and the knowledge imputed to a voluntarily intoxicated accused",
            "Section 105 of the Evidence Act: the accused must bring the case within an exception, discharged on the preponderance of probabilities",
            "Sections 96 to 106 on private defence of body and property, when it extends to causing death, and the limits in Section 99 including no right against a lawful act and no more harm than necessary",
          ],
          worked: [
            "Apply the Section 99 limits to an accused who kept striking after the aggressor had been disarmed and state the offence that remains",
          ],
          traps: [
            "Reading Section 105 as shifting the whole burden — the prosecution still proves guilt beyond reasonable doubt",
            "Assuming the general exceptions disappeared with the Bharatiya Nyaya Sanhita; they are carried forward, so trace where each corresponding provision now sits",
          ],
          officialSources: [INDIA_CODE, SCI],
          diagram: "hierarchy",
          keywords: [
            "general exceptions IPC Chapter IV",
            "right of private defence Section 99",
            "Section 105 Evidence Act burden",
            "mens rea judicial services notes",
          ],
          order: 0,
        },
        {
          slug: "homicide-joint-liability-and-inchoate-offences",
          title: "Homicide, Joint Liability and Inchoate Offences",
          syllabusAnchor:
            "Criminal Law Paper — Offences affecting the human body, common intention and common object, abetment, criminal conspiracy and attempt.",
          mustCover: [
            "Section 299 set against Section 300: the clauses of culpable homicide read clause by clause against the clauses of murder",
            "The exceptions to Section 300, including grave and sudden provocation and exceeding the right of private defence in good faith",
            "Section 304 Part I and Part II, and how the finding on intention or knowledge decides which limb applies",
            "Section 304A death by a rash or negligent act, and how it stands apart from culpable homicide",
            "Section 34: common intention needs a prior meeting of minds, however brief, together with participation in the criminal act",
            "Section 149 read with Section 141: constructive liability follows from membership of an unlawful assembly prosecuting a common object",
            "The working differences between Section 34 and Section 149, including the number of persons and the need for an overt act",
            "Sections 107 and 108 on abetment, Sections 120A and 120B where the agreement itself is the offence, and Section 511 on the line between preparation and attempt",
          ],
          worked: [
            "Run a single-blow fatal assault through Sections 299 and 300 clause by clause and state which limb and which exception are engaged",
          ],
          traps: [
            "Charging under Section 34 with no material showing a shared plan, and treating mere presence as participation",
            "Carrying the Indian Penal Code numbering into an answer on the Bharatiya Nyaya Sanhita without checking where the offence is now placed",
          ],
          officialSources: [INDIA_CODE, SCI],
          diagram: "compare",
          keywords: [
            "culpable homicide and murder difference",
            "Section 34 vs Section 149 IPC",
            "criminal conspiracy Section 120A",
            "attempt Section 511 IPC",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "criminal-procedure",
      title: "Criminal Procedure",
      articles: [
        {
          slug: "offence-classification-fir-and-arrest",
          title: "Classification of Offences, FIR, Investigation, Arrest",
          syllabusAnchor:
            "Criminal Procedure Paper — Classification of offences, information to the police and investigation, and arrest with its constitutional and statutory safeguards.",
          mustCover: [
            "Cognizable and non-cognizable, bailable and non-bailable, and summons and warrant cases as classified in the First Schedule",
            "Section 320: which offences are compoundable, and which are compoundable only with the permission of the court",
            "Section 154: registration of a first information report in a cognizable case, and the remedies where the police decline to register it",
            "Section 155 for non-cognizable cases, and a direction to investigate under Section 156(3)",
            "Sections 161 and 164: statements recorded by the police and their restricted use, against statements recorded by a magistrate",
            "Section 173: the police report, and the court's options when a closure report is filed",
            "Section 41 arrest without warrant, Section 41A notice of appearance, and the discipline required by Arnesh Kumar v State of Bihar",
            "Section 50 on grounds of arrest, Section 57 with Article 22(2) on production within twenty-four hours, and the safeguards in D.K. Basu v State of West Bengal",
          ],
          worked: [
            "Trace a cognizable case from the first information report to the filing of the police report, naming the governing section at each stage",
          ],
          traps: [
            "Treating the first information report as substantive evidence rather than material used to corroborate or contradict",
            "Ignoring that the Bharatiya Nagarik Suraksha Sanhita re-enacts these stages with added timelines, so the numbering has to be relearnt from the current text",
          ],
          officialSources: [INDIA_CODE, SCI],
          diagram: "flow",
          keywords: [
            "cognizable and non cognizable offence",
            "FIR Section 154 CrPC",
            "Section 41A CrPC Arnesh Kumar",
            "Bharatiya Nagarik Suraksha Sanhita mapping",
          ],
          order: 0,
        },
        {
          slug: "bail-charge-and-the-trial-process",
          title: "Bail, Framing of Charge and the Trial Process",
          syllabusAnchor:
            "Criminal Procedure Paper — Bail, framing of charge, trial before a court of session, and the judgment.",
          mustCover: [
            "Section 436: bail is a matter of right in a bailable offence, while Section 437 governs the magistrate's power in a non-bailable case",
            "What the court weighs before granting bail in a non-bailable case: the gravity of the accusation, the risk of absconding or tampering with evidence, and the antecedents of the accused",
            "Section 438 anticipatory bail and the principles laid down in Gurbaksh Singh Sibbia v State of Punjab",
            "Section 439: the wider powers of the Sessions Court and the High Court, including cancellation of bail already granted",
            "Section 167: remand, and the right to default bail when the investigation is not completed within the statutory period",
            "Sections 227 and 228: discharge or framing of charge in a sessions trial, and why the enquiry at that stage is confined to grave suspicion",
            "Sections 211 to 224 on the contents of a charge, joinder of charges, and the effect of an error in the charge",
            "The sequence of trial through prosecution evidence, examination of the accused under Section 313, defence evidence, arguments and a judgment written as required by Section 354",
          ],
          worked: [
            "Frame a charge for one offence and set out the ingredients each part of the charge must reflect",
          ],
          traps: [
            "Holding a mini-trial at the stage of framing the charge instead of asking whether the material discloses grave suspicion",
            "Treating the Section 313 statement as evidence on oath rather than the accused's explanation of incriminating circumstances",
          ],
          officialSources: [INDIA_CODE, SCI],
          diagram: "flow",
          keywords: [
            "bail in non bailable offence CrPC",
            "anticipatory bail Section 438",
            "framing of charge Section 227 228",
            "Section 313 CrPC examination of accused",
          ],
          order: 1,
        },
      ],
    },
  ],
};

export const JUDICIARY_EVIDENCE_CRAFT: StarterSubject = {
  slug: "judiciary-evidence-and-craft",
  name: "Evidence & Judgment Craft",
  description: "Proof, relevancy and the craft of writing judgments.",
  paper: "Mains & Viva",
  topics: [
    {
      slug: "law-of-evidence",
      title: "Law of Evidence",
      articles: [
        {
          slug: "relevancy-admissions-and-confessions",
          title: "Relevancy, Admissions, Confessions, Dying Declarations",
          syllabusAnchor:
            "Evidence Paper — Relevancy of facts, admissions and confessions, and statements by persons who cannot be called as witnesses.",
          mustCover: [
            "Relevancy under Sections 5 to 16 decides what may be led, while admissibility decides whether the court may receive it, and the two are not interchangeable",
            "Section 6 res gestae and Section 8 motive, preparation and conduct as the relevancy provisions most often argued at trial",
            "Sections 17 to 23: an admission is not conclusive proof but may operate as an estoppel, and who is competent to make one",
            "Section 24: a confession caused by inducement, threat or promise proceeding from a person in authority is irrelevant",
            "Sections 25 and 26: a confession to a police officer, or one made in police custody otherwise than in the immediate presence of a magistrate, cannot be proved",
            "Section 27: only so much of the information as distinctly relates to the fact thereby discovered may be proved",
            "Section 30: the confession of a co-accused can only lend assurance and cannot by itself sustain a conviction",
            "Section 32(1): a dying declaration is relevant, needs no corroboration as a rule of law, and must be found voluntary, truthful and made in a fit state of mind",
          ],
          traps: [
            "Treating an admission as conclusive proof of the fact admitted",
            "Reading the Evidence Act numbering into the Bharatiya Sakshya Adhiniyam without checking where the corresponding provision now sits",
          ],
          officialSources: [INDIA_CODE, SCI],
          diagram: "hierarchy",
          keywords: [
            "relevancy and admissibility difference",
            "confession Sections 24 to 30",
            "Section 27 Evidence Act discovery",
            "dying declaration Section 32",
          ],
          order: 0,
        },
        {
          slug: "burden-of-proof-and-electronic-evidence",
          title: "Burden of Proof, Expert Opinion, Electronic Evidence",
          syllabusAnchor:
            "Evidence Paper — Burden of proof and presumptions, opinion of experts, and proof of documents and electronic records.",
          mustCover: [
            "Sections 101 to 103: the burden lies on the party who would fail if no evidence were given, and the onus of proof can shift as the trial proceeds",
            "Section 105 on bringing a case within a general exception, and Section 106 on facts especially within a person's knowledge",
            "The difference between 'may presume', 'shall presume' and 'conclusive proof', and what each does to the other side's ability to rebut",
            "Section 113B on the presumption in a dowry death, and Section 114 with its illustrations as permissible rather than compulsory inferences",
            "Section 45: expert opinion is advisory, so the court must be shown the reasoning and the data, not only the conclusion",
            "Sections 61 to 65 on proof of documents, and the grounds on which secondary evidence becomes admissible",
            "Section 65B: an electronic record is proved as a document only with the certificate under Section 65B(4), as held in Anvar P.V. v P.K. Basheer and restated in Arjun Panditrao Khotkar v Kailash Kushanrao Gorantyal",
          ],
          worked: [
            "Decide whether a CCTV recording tendered without a certificate can be read, and what direction the court should give to the party who cannot obtain one",
          ],
          traps: [
            "Treating expert opinion as substantive proof that binds the court",
            "Assuming the Bharatiya Sakshya Adhiniyam dispensed with the certificate for electronic records; read the current provision before answering",
          ],
          officialSources: [INDIA_CODE, SCI],
          diagram: "flow",
          keywords: [
            "burden of proof Sections 101 to 106",
            "Section 65B certificate electronic evidence",
            "Arjun Panditrao Khotkar judgment",
            "presumptions under Evidence Act",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "exam-craft",
      title: "Exam Craft",
      articles: [
        {
          slug: "bare-act-judgment-and-answer-craft",
          title: "Bare Act Reading, Judgment Craft and Revision Method",
          syllabusAnchor:
            "Mains and Viva — Reading the bare act, use of precedent, judgment and order writing, drafting and translation, and local laws of the state.",
          mustCover: [
            "Why the bare act is the primary text: examiners quote its language, and answers are marked against the provision rather than a summary of it",
            "How to read a section: the operative words, the proviso, the explanation, the illustrations, and the punishment clause",
            "How to read a judgment: facts, issues, the ratio decidendi, and obiter that must not be cited as binding",
            "Judgment writing: the points for determination, a reasoned finding on each point, and an operative order that disposes of the case",
            "Order writing on an interlocutory application: the prayer, the rival contentions, the governing rule, and a reasoned direction",
            "Drafting a plaint, a written statement, a memorandum of appeal and a simple deed, and translation between English and the state language, which carries qualifying marks in most states",
            "Local laws of the state, such as rent, land revenue and tenancy statutes, and how to locate the current text before relying on it",
            "A revision method for section numbers: fixed bare act passes, self-testing from the doctrine to the number and back, and never learning a number apart from its doctrine",
          ],
          worked: [
            "Write a short order on a temporary injunction application and check it against the four-part structure of prayer, contentions, rule and direction",
          ],
          traps: [
            "Citing a case name without the proposition it stands for",
            "Relying on a commentary summary where the examiner expects the words of the section",
          ],
          officialSources: [INDIA_CODE, DOJ],
          diagram: "flow",
          keywords: [
            "how to read bare act judiciary",
            "judgment writing judicial services",
            "civil judge mains preparation",
            "section number revision technique",
          ],
          order: 0,
        },
      ],
    },
  ],
};
