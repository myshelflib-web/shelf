import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://www.indiacode.nic.in/",
  "https://main.sci.gov.in/judgments",
];

const CIV = "Prelims and Mains — Code of Civil Procedure, Indian Contract Act ss. 2–22, Transfer of Property Act ss. 52 and 53A, and the law of torts.";
const CRI = "Prelims and Mains — substantive criminal law and criminal procedure as tested in judicial services. IPC/CrPC section numbers below are from the pre-2024 codes; the 2023 Sanhitas are named, not re-numbered here.";
const EV = "Prelims and Mains — Indian Evidence Act (relevancy, ss. 24–30, dying declaration, burden, s. 65B conceptually) and judgment-writing craft.";

export const JUDICIARY_CORPUS: SyllabusSubject[] = [
  {
    slug: "judiciary-civil-law",
    name: "Civil Law",
    description:
      "CPC jurisdiction and res judicata, pleadings and injunctions, appeals, Contract Act ss. 2–22, TPA lis pendens and part-performance, and torts — the civil judge's working kit.",
    paper: "Prelims and Mains",
    sources: SRC,
    topics: [
      topic("cpc-jurisdiction", "Jurisdiction and Res Judicata (CPC ss. 9–21, 11)", CIV, [
        L("civil-nature-section-9", "Section 9: Courts to Try All Civil Suits Unless Barred", [
          "CPC s. 9: courts have jurisdiction to try all suits of a civil nature unless barred expressly or impliedly",
          "A suit is of a civil nature when the principal question is a civil right; caste or purely religious questions without a civil right are outside",
          "Express bar versus implied bar (special forum, statutory finality); the civil court is not ousted by a vague 'government will decide'",
          "When a statute creates a right and a special tribunal, the civil court's residual role is the construction the Supreme Court has given that statute — not a general presumption of ouster",
        ], "hierarchy", ["CPC section 9 civil nature", "exclusion of civil court jurisdiction"]),
        L("place-of-suing-15-20", "Place of Suing: Sections 15 to 20", [
          "s. 15: sue in the lowest grade competent to try; pecuniary jurisdiction is a grade rule, not a territorial one",
          "ss. 16–18: immovable property — where the property is situated; the proviso to s. 16 for personal-relief suits; s. 17 for property in more than one jurisdiction",
          "s. 19: compensation for wrong to person or movable — where the wrong is done or the defendant resides",
          "s. 20: other suits — where the defendant resides or carries on business, or where the cause of action arises in whole or in part",
        ], "flow", ["CPC sections 15 to 20", "place of suing immovable property"]),
        L("objection-to-jurisdiction-21", "Section 21: Objections to Jurisdiction", [
          "s. 21: no objection to the place of suing is allowed unless taken in the court of first instance at the earliest possible opportunity and there is a consequent failure of justice",
          "s. 21(2): pecuniary objections follow the same discipline",
          "Subject-matter jurisdiction cannot be conferred by consent; territorial and pecuniary objections can be waived in the manner s. 21 prescribes",
          "Kiran Singh is the standard citation for the distinction: a decree without subject-matter jurisdiction is a nullity; a territorial defect is not, unless s. 21 is satisfied",
        ], "compare", ["CPC section 21 objection to jurisdiction", "subject-matter vs territorial jurisdiction"]),
        L("res-subjudice-section-10", "Section 10: Stay of Suit (Res Sub Judice)", [
          "s. 10: no court shall proceed with the trial of any suit in which the matter in issue is also directly and substantially in issue in a previously instituted suit between the same parties, or between parties under whom they or any of them claim, litigating under the same title, where that suit is pending in the same or any other court in India having jurisdiction to grant the relief",
          "The previously instituted suit must be pending; s. 10 stays the later trial, it does not bar the later suit the way s. 11 does",
          "The court 'having jurisdiction to grant the relief' is a competence condition; a suit in a court that could not have granted the relief does not trigger the stay",
          "Explanation: the pendency of a suit in a foreign court does not preclude an Indian court from trying a suit founded on the same cause of action",
        ], "compare", ["CPC section 10 res sub judice", "section 10 vs section 11"]),
        L("res-judicata-section-11", "Section 11: Res Judicata", [
          "s. 11: no court shall try any suit or issue in which the matter directly and substantially in issue has been directly and substantially in issue in a former suit between the same parties (or those claiming under them), litigating under the same title, in a court competent to try the subsequent suit, and has been heard and finally decided",
          "Explanation IV: constructive res judicata — a matter which might and ought to have been made a ground of defence or attack is deemed to have been in issue",
          "s. 10 (res sub judice) stays a parallel suit; s. 11 bars a subsequent one. Do not interchange them",
          "Competence, finality, and 'directly and substantially' are the three places answers go wrong; a dismissal for default is not a decision on merits",
        ], "cards", ["CPC section 11 res judicata", "constructive res judicata Explanation IV"]),
      ]),
      topic("cpc-pleadings-injunction", "Pleadings and Temporary Injunctions", CIV, [
        L("pleadings-order-6", "Order VI: Pleadings", [
          "Order VI r. 2: plead facts, not evidence; material facts on which the party relies, in a concise form",
          "rr. 4–5: particulars of fraud, misrepresentation, breach of trust, wilful default and undue influence must be pleaded",
          "r. 17: amendment of pleadings — necessary for determining the real questions; the 2002 proviso bars amendment after commencement of trial unless the court is satisfied the party could not have raised it earlier despite due diligence",
          "Signing and verification (r. 14–15) and striking out pleadings (r. 16) are the other working rules a trial judge actually uses",
        ], "hierarchy", ["CPC Order 6 pleadings", "Order 6 Rule 17 amendment"]),
        L("plaint-order-7", "Order VII: Plaint, Return and Rejection", [
          "Order VII r. 1: particulars the plaint must contain — name of court, parties, cause of action, jurisdiction facts, value, relief",
          "r. 11: rejection of plaint — no cause of action, undervalued and not corrected, insufficiently stamped and not corrected, suit barred by law, plaint not in duplicate, and the statutory failure to disclose the documents relied on where the rule so requires",
          "Rejection under r. 11 is on a reading of the plaint (and documents that are part of it), not a mini-trial; return under r. 10 is for presentation to the proper court",
          "Limitation as a r. 11(d) bar is available only when it is evident from the plaint itself",
        ], "flow", ["CPC Order 7 Rule 11", "rejection of plaint"]),
        L("temporary-injunction-order-39", "Order XXXIX: Temporary Injunctions", [
          "Order XXXIX rr. 1–2: temporary injunction to restrain waste, damage, alienation, or a breach of contract or other injury — the three-fold test is prima facie case, balance of convenience, irreparable injury",
          "r. 3: notice before injunction is the rule; the proviso allows an ex parte ad-interim order if the object would be defeated by delay, with reasons and immediate notice",
          "r. 2A: consequence of disobedience — attachment of property and/or civil imprisonment, as the court orders",
          "r. 4: discharge, variation or setting aside; a temporary injunction is not a finding on title",
        ], "cards", ["CPC Order 39 temporary injunction", "prima facie balance of convenience irreparable injury"]),
      ]),
      topic("cpc-appeals", "Appeals, Review and Revision", CIV, [
        L("first-appeal-section-96", "First Appeal (ss. 96–99, Order XLI)", [
          "s. 96: an appeal lies from every decree passed by a court exercising original jurisdiction, subject to the Code; no appeal from a consent decree (s. 96(3))",
          "The first appellate court is a court of fact and of law; it must address the evidence and the reasons of the trial court",
          "Order XLI: memorandum of appeal, stay, additional evidence (r. 27), remand, and the duty to decide all issues that arise",
          "s. 99: no decree to be reversed for errors that have not affected the merits or jurisdiction",
        ], "flow", ["CPC section 96 first appeal", "Order 41 additional evidence"]),
        L("second-appeal-section-100", "Second Appeal and Substantial Question of Law", [
          "s. 100: second appeal to the High Court only on a substantial question of law, which the High Court must formulate",
          "A substantial question is one that is not a mere error of fact and that has a bearing on the rights of the parties; reappreciation of evidence is not a second appeal",
          "s. 103: the High Court may determine an issue of fact in the limited situations the section states, once a substantial question is in play",
          "Do not cite 'misreading of evidence' as if it were automatically a substantial question",
        ], "compare", ["CPC section 100 substantial question of law", "second appeal vs first appeal"]),
        L("review-revision-reference", "Review, Revision and Reference", [
          "s. 114 and Order XLVII: review for new and important matter or evidence not within knowledge after due diligence, mistake or error apparent on the face of the record, or any other sufficient reason — not a rehearing",
          "s. 115: High Court revision where no appeal lies, for jurisdictional error — failure to exercise, illegal or material irregularity in exercise; the 1999 amendment narrowed interlocutory revision",
          "s. 113 and Order XLVI: reference of a question of law to the High Court when the court trying the suit doubts the validity of an Act or otherwise as the Order provides",
          "Appeal, review and revision are not interchangeable remedies; choose by whether a decree exists, whether an appeal lies, and whether the error is jurisdictional",
        ], "cards", ["CPC section 115 revision", "Order 47 review"]),
      ]),
      topic("contract-2-22", "Indian Contract Act, Sections 2 to 22", CIV, [
        L("contract-definitions-section-2", "Section 2: Proposal, Promise, Agreement, Contract", [
          "s. 2(a)–(c): proposal, promise, promisor and promisee; a proposal when accepted becomes a promise",
          "s. 2(d): consideration — when, at the desire of the promisor, the promisee or any other person has done or abstained, or does or abstains, or promises to do or to abstain",
          "s. 2(e)–(j): agreement, reciprocal promises, void agreements, contract, voidable contract, and the sense in which an agreement is void",
          "Consideration moving from 'any other person' is why Indian law does not need English privity-of-consideration; privity of contract is a different question",
        ], "hierarchy", ["Contract Act section 2", "consideration section 2(d)"]),
        L("proposal-acceptance-3-9", "Communication of Proposal, Acceptance and Revocation (ss. 3–9)", [
          "ss. 3–4: communication of proposal, acceptance and revocation is complete as against the person making it when it is put into a course of transmission, and as against the addressee when it comes to his knowledge — with the postal-acceptance twist in s. 4",
          "s. 5: a proposal may be revoked until the communication of acceptance is complete as against the proposer; an acceptance may be revoked until its communication is complete as against the acceptor",
          "s. 6: revocation by notice, by lapse of time, by failure of a condition precedent, or by death or insanity of the proposer if the fact comes to the acceptor's knowledge before acceptance",
          "ss. 7–9: acceptance must be absolute and unqualified; performing conditions or receiving consideration may be acceptance; promises are express or implied",
        ], "flow", ["Contract Act sections 3 to 9", "communication of acceptance postal rule"]),
        L("agreements-contracts-10-12", "What Agreements Are Contracts; Capacity (ss. 10–12)", [
          "s. 10: agreements are contracts if made by free consent of parties competent to contract, for a lawful consideration and lawful object, and not expressly declared void",
          "s. 11: every person is competent who is of the age of majority according to the law to which he is subject, of sound mind, and not disqualified from contracting by any law",
          "A minor's agreement is void (Mohori Bibee); it is not voidable at the minor's option",
          "s. 12: a person is of sound mind for contracting if, at the time he makes the contract, he is capable of understanding it and of forming a rational judgment as to its effect upon his interests",
        ], "cards", ["Contract Act section 10", "section 11 minor Mohori Bibee"]),
        L("consent-vitiating-13-19", "Consent and Vitiating Factors (ss. 13–19)", [
          "s. 13: two or more persons are said to consent when they agree upon the same thing in the same sense",
          "s. 14: consent is free when not caused by coercion (s. 15), undue influence (s. 16), fraud (s. 17), misrepresentation (s. 18), or mistake (ss. 20–22)",
          "s. 15: coercion is committing or threatening to commit an act forbidden by the IPC, or the unlawful detaining or threatening to detain property, to the prejudice of any person, with the intention of causing the other to enter into an agreement",
          "s. 16: undue influence — a dominant position used to obtain an unfair advantage; s. 19: agreements caused by coercion, fraud or misrepresentation are voidable at the option of the party whose consent was so caused; s. 19A deals with undue influence",
        ], "compare", ["Contract Act sections 13 to 19", "coercion undue influence fraud"]),
        L("mistake-20-22", "Mistake of Fact and of Law (ss. 20–22)", [
          "s. 20: an agreement is void where both parties are under a mistake as to a matter of fact essential to the agreement; a mistake as to the existence of the subject-matter is the textbook case",
          "Explanation to s. 20: an erroneous opinion as to the value of the thing which forms the subject-matter is not a mistake as to a matter of fact",
          "s. 21: a contract is not voidable because it was caused by a mistake as to any law in force in India; a mistake as to a law not in force in India has the same effect as a mistake of fact",
          "s. 22: a contract is not voidable merely because it was caused by one party being under a mistake as to a matter of fact — unilateral mistake does not, by itself, undo the bargain",
        ], "compare", ["Contract Act section 20 bilateral mistake", "section 22 unilateral mistake"]),
      ]),
      topic("tpa-and-torts", "TPA ss. 52 and 53A, and Torts", CIV, [
        L("lis-pendens-section-52", "Lis Pendens: TPA Section 52", [
          "TPA s. 52: during the pendency in any court having authority of a suit or proceeding which is not collusive, in which any right to immovable property is directly and specifically in question, the property cannot be transferred or otherwise dealt with by any party so as to affect the rights of any other party thereto under any decree or order which may be made, except under the authority of the court and on such terms as it may impose",
          "Pendency starts from the presentation of the plaint (Explanation) and continues until the suit or proceeding is disposed of by a final decree and complete satisfaction or discharge, or has become unobtainable by reason of the expiration of limitation for execution",
          "Lis pendens does not make the transfer void; it makes it subservient to the result of the suit",
          "The suit must not be collusive, and the right to immovable property must be directly and specifically in question — a money suit is not enough",
        ], "flow", ["TPA section 52 lis pendens", "pendency of suit transfer"]),
        L("part-performance-53a", "Part Performance: TPA Section 53A", [
          "s. 53A: a transferee who has taken possession (or continues in possession) under a written contract for transfer of immovable property, signed by the transferor, for consideration, and who has performed or is willing to perform his part, may protect that possession against the transferor and persons claiming under him",
          "It is a shield, not a sword: it does not confer title; it bars the transferor from enforcing a right in the property other than a right expressly provided by the contract",
          "The contract must be in writing and signed; an oral agreement will not found 53A",
          "After the 2001 amendment of s. 17 of the Registration Act, an unregistered contract for sale of the kind that requires registration cannot found 53A — do not state the pre-amendment position as current law",
        ], "cards", ["TPA section 53A part performance", "53A shield not sword"]),
        L("tort-nature-and-defences", "Nature of Tort and General Defences", [
          "Tort is a civil wrong, other than breach of contract, for which the remedy is an unliquidated damages action (and allied remedies); damnum sine injuria is damage without infringement of a legal right; injuria sine damno is the reverse",
          "Volenti non fit injuria, inevitable accident, Act of God, statutory authority, private defence, and plaintiff the wrongdoer are the working general defences",
          "Consent must be free and informed; a statutory authority is only as wide as the statute",
          "Keep tort distinct from crime (different burden, different aim) and from contract (duty fixed by parties versus duty fixed by law)",
        ], "compare", ["damnum sine injuria", "volenti non fit injuria"]),
        L("negligence-duty-care", "Negligence: Duty, Breach and Causation", [
          "Duty of care, breach of the standard of a reasonable person, causation in fact, and remoteness (the kind of damage must be reasonably foreseeable)",
          "Res ipsa loquitur is an aid to inference where the thing is shown to be under the defendant's control and the accident is such as does not ordinarily happen without negligence",
          "Contributory negligence reduces damages; composite negligence is when two independent tortfeasors injure the plaintiff and each is liable for the whole as against the plaintiff",
          "Professional negligence (including medical) uses the standard of a reasonably competent practitioner of that discipline, not a guarantee of outcome",
        ], "flow", ["negligence duty of care", "res ipsa loquitur"]),
        L("vicarious-strict-absolute", "Vicarious, Strict and Absolute Liability", [
          "Vicarious liability: master for servant acting in the course of employment; the course-of-employment test is the usual battleground, not the existence of a salary",
          "State liability: the old 'sovereign functions' distinction has been narrowed by later Supreme Court authority — answer with the current reading, not with a 1960s exception as if it were the whole law",
          "Rylands v Fletcher strict liability: escape of a dangerous thing from land, with the recognised exceptions (plaintiff's default, Act of God, statutory authority, consent, act of a stranger)",
          "Absolute liability (M.C. Mehta / Oleum gas): an enterprise engaged in a hazardous or inherently dangerous activity is liable for the escape without the Rylands exceptions — Indian public law, not English common law",
        ], "compare", ["strict vs absolute liability India", "vicarious liability course of employment"]),
        L("named-torts-nuisance-defamation", "Nuisance, Defamation and Trespass", [
          "Trespass to the person (assault, battery, false imprisonment) is actionable per se; trespass to land is unjustified entry",
          "Private nuisance: unlawful interference with use or enjoyment of land; public nuisance is a crime and a tort for a person who suffers special damage",
          "Defamation: a false statement published about the plaintiff tending to lower him in the estimation of right-thinking people; truth, fair comment, and privilege are the working defences",
          "Malicious prosecution requires prosecution, without reasonable and probable cause, with malice, ending in the plaintiff's favour, plus damage",
        ], "cards", ["private vs public nuisance", "defences to defamation"]),
      ]),
    ],
  },
  {
    slug: "judiciary-criminal-law",
    name: "Criminal Law",
    description:
      "Mens rea, general exceptions, ss. 34 and 149, attempt, homicide, FIR, arrest, bail and charge — with the 2023 Sanhitas identified by name only.",
    paper: "Prelims and Mains",
    sources: SRC,
    topics: [
      topic("mens-rea-exceptions", "Mens Rea and General Exceptions", CRI, [
        L("mens-rea-actus-reus", "Actus Reus and Mens Rea", [
          "A crime is ordinarily a prohibited act (or omission where a duty exists) plus a guilty mind; statutes can create strict-liability offences, but that is the exception and must be read from the text",
          "Intention, knowledge, rashness and negligence are different mental states; motive is not an ingredient of most IPC offences though it may explain conduct",
          "s. 14 IPC ('serves to show') and the definition clauses in s. 39 (voluntarily), s. 52 (good faith) are the working vocabulary for the rest of the Code",
          "Do not assign Bharatiya Nyaya Sanhita section numbers to these ideas; if the notification examines the Sanhita, read the corresponding definition chapter in the bare Act",
        ], "hierarchy", ["mens rea actus reus", "intention vs knowledge IPC"]),
        L("intention-knowledge-negligence", "Intention, Knowledge, Rashness and Negligence", [
          "Intention is the will to bring about the forbidden consequence; knowledge is awareness that the consequence is likely",
          "The same injury can be charged under different sections depending on whether the prosecution can prove intention or only knowledge (homicide is the teaching example)",
          "Rashness is taking a risk with consciousness; negligence is a falling below the standard without that consciousness — s. 304A IPC sits on that distinction",
          "Transferred malice / transferred intention is a common-law label for what the Code does through the definition of 'voluntarily' and the homicide sections; do not invent a section number for it",
        ], "compare", ["intention vs knowledge vs negligence", "IPC section 304A rash negligent"]),
        L("general-exceptions-map", "Chapter IV: Map of the General Exceptions", [
          "IPC ss. 76–106: mistake of fact and judicial acts, accident, necessity, infancy, unsoundness of mind, intoxication, consent, communication in good faith, compulsion, trifling acts, and private defence",
          "An exception, if made out, means there is no offence; it is not a mitigating circumstance at sentence",
          "The burden of bringing the case within an exception is on the accused (Evidence Act s. 105), to the extent of raising a reasonable doubt in a criminal trial",
          "The Bharatiya Nyaya Sanhita, 2023 contains a corresponding general-exceptions chapter; cite it by name if that is the examined statute, without inventing its section numbers here",
        ], "cards", ["IPC general exceptions Chapter IV", "Evidence Act section 105"]),
        L("mistake-accident-necessity", "Mistake, Accident and Necessity (ss. 76–81)", [
          "ss. 76–79: acts done by a person bound by law or justified by law, or by mistake of fact and not by mistake of law, in good faith; judicial acts",
          "s. 80: accident in doing a lawful act, with proper care and without criminal intention or knowledge",
          "s. 81: act likely to cause harm but done without criminal intent to prevent other harm — necessity, not a general licence",
          "Mistake of law is not an excuse under these sections; ignorance of the IPC is not s. 79",
        ], "flow", ["IPC sections 76 to 81", "mistake of fact vs mistake of law"]),
        L("infancy-insanity-intoxication", "Infancy, Unsoundness of Mind and Intoxication (ss. 82–86)", [
          "s. 82: nothing done by a child under seven is an offence; s. 83: a child above seven and under twelve is not liable if he has not attained sufficient maturity of understanding to judge the nature and consequences of his conduct",
          "s. 84: unsoundness of mind — incapable of knowing the nature of the act, or that it is wrong or contrary to law (the McNaughten reading as enacted)",
          "ss. 85–86: involuntary intoxication can found an exception; voluntary intoxication does not, except that a person is dealt with as if he had the same knowledge (not the same intention) as he would have had if not intoxicated",
          "Do not write 'irresistible impulse' as if it were s. 84",
        ], "compare", ["IPC section 84 unsoundness of mind", "IPC 82 83 doli incapax"]),
        L("private-defence-96-106", "Private Defence of Body and Property (ss. 96–106)", [
          "s. 96: nothing is an offence which is done in the exercise of the right of private defence; ss. 97–99 set the scope and the limits (no defence against lawful acts; no more harm than necessary; no right when there is time to recourses to public authorities, subject to the sections)",
          "ss. 100 and 103: when the right extends to causing death — specified grave assaults and specified property crimes (robbery, house-breaking by night, etc.)",
          "ss. 102 and 105: the right commences with a reasonable apprehension and continues as long as the apprehension continues",
          "Exceeding the right is a separate question (and a homicide exception under s. 300 Exception 2); it is not the same as having no right at all",
        ], "hierarchy", ["IPC private defence 96 to 106", "section 100 causing death"]),
      ]),
      topic("joint-liability-attempt-homicide", "ss. 34 and 149, Attempt, Homicide", CRI, [
        L("common-intention-section-34", "Section 34: Common Intention", [
          "s. 34 IPC: when a criminal act is done by several persons in furtherance of the common intention of all, each is liable as if he had done it by himself",
          "Common intention requires a pre-arranged plan, which may form on the spur of the moment; physical presence plus participation is the usual proof pattern, not a recorded conspiracy",
          "s. 34 is a rule of evidence / constructive liability; it is not a substantive offence and cannot be charged alone",
          "Participation in the criminal act is essential; mere presence in a crowd is not s. 34",
        ], "cards", ["IPC section 34 common intention", "section 34 not a substantive offence"]),
        L("common-object-section-149", "Section 149: Common Object of an Unlawful Assembly", [
          "s. 149 IPC: if an offence is committed by any member of an unlawful assembly in prosecution of the common object of that assembly, or such as the members knew to be likely to be committed in prosecution of that object, every person who, at the time of the committing of that offence, is a member of the same assembly is guilty of that offence",
          "Unlawful assembly is s. 141: five or more persons with a common object of the kinds listed",
          "s. 149 is a substantive offence in the sense that a person can be convicted of the offence via 149 without being the actual striker; membership at the time is enough once the object and knowledge tests are met",
          "The common object may develop after the assembly formed; it is proved from the weapons, slogans, and the conduct of the assembly",
        ], "flow", ["IPC section 149 common object", "section 141 unlawful assembly"]),
        L("thirty-four-versus-149", "Section 34 versus Section 149", [
          "s. 34 needs two or more and a common intention; s. 149 needs five or more and a common object of an unlawful assembly",
          "s. 34 is not a substantive offence; s. 149 is a charging section that fastens the assembly's offence on each member",
          "A 34 case can exist without an unlawful assembly; a 149 case can exist without a pre-arranged plan in the 34 sense",
          "In a judgment, choose one theory and find it on facts; charging both in the alternative is common, convicting on a muddled blend is not",
        ], "compare", ["IPC 34 vs 149", "common intention vs common object"]),
        L("attempt-and-preparation", "Attempt: Preparation Distinguished", [
          "Preparation is not punishable except where the Code (or a special law) expressly punishes it; attempt is a step towards the offence after preparation, sufficiently proximate",
          "s. 511 IPC: attempting to commit an offence punishable with imprisonment for life or with imprisonment, and in such attempt doing any act towards the commission of the offence",
          "Attempt to murder is s. 307, a specific provision that is not a mere application of s. 511; do not treat 511 as the attempt-to-murder section",
          "Impossible attempts (empty pocket, unloaded gun unknown to the actor) are still attempts if the actor did an act towards the offence with the required mens rea; the Code does not enact a separate 'impossible attempt' section",
        ], "compare", ["IPC section 511 attempt", "preparation vs attempt"]),
        L("homicide-versus-murder", "Culpable Homicide and Murder (ss. 299–300)", [
          "s. 299: culpable homicide — causing death with intention of causing death, or with intention of causing such bodily injury as is likely to cause death, or with knowledge that the act is likely to cause death",
          "s. 300: culpable homicide is murder if it falls within the four clauses (intention to cause death; intention to cause injury the offender knows to be likely to cause death of the person to whom the harm is caused; intention to cause injury sufficient in the ordinary course of nature to cause death; knowledge that the act is so imminently dangerous that it must in all probability cause death, without excuse)",
          "Every murder is culpable homicide; not every culpable homicide is murder. Sentence follows ss. 302 and 304, not the other way around",
          "Do not invent Bharatiya Nyaya Sanhita numbers for these clauses; if BNS is the examined statute, read its homicide chapter in the bare Act",
        ], "compare", ["IPC 299 vs 300", "culpable homicide not amounting to murder"]),
        L("exceptions-to-murder-300", "The Five Exceptions to Section 300", [
          "Exception 1: grave and sudden provocation, not sought or voluntarily provoked, not as an excuse for killing someone other than the provocateur except as the exception allows",
          "Exception 2: exceeding the right of private defence in good faith, without premeditation and without intention of doing more harm than was necessary for defence",
          "Exception 3: public servant (or aiding one) exceeding powers in good faith, believing himself bound or authorised, without ill-will",
          "Exception 4: sudden fight in the heat of passion upon a sudden quarrel, without premeditation, without taking undue advantage or acting in a cruel or unusual manner; Exception 5: death caused with the consent of the deceased, above eighteen",
        ], "cards", ["IPC section 300 exceptions", "grave and sudden provocation"]),
      ]),
      topic("fir-arrest-bail-charge", "FIR, Arrest, Bail and Charge", CRI, [
        L("fir-section-154", "FIR: Section 154 CrPC", [
          "CrPC s. 154: information relating to the commission of a cognizable offence, given orally or in writing to an officer in charge of a police station, shall be reduced to writing, read over, signed, and entered in the book prescribed",
          "A copy shall be given forthwith, free of cost, to the informant; refusal to register a cognizable FIR is not a discretion (Lalita Kumari: registration is the rule; a limited preliminary inquiry only for the categories that case allowed)",
          "Delay in lodging is a matter of evaluation, not of competence; it may affect credibility but does not, by itself, void the investigation",
          "The Bharatiya Nagarik Suraksha Sanhita, 2023 replaces the CrPC; if that is the examined statute, use its name and the corresponding FIR provision in the bare Act — do not guess its number here",
        ], "flow", ["CrPC section 154 FIR", "Lalita Kumari registration of FIR"]),
        L("statements-to-police-161-162", "Statements to Police (ss. 161–162 CrPC)", [
          "s. 161: any police officer making an investigation may examine a person supposed to be acquainted with the facts, and reduce the statement into writing; the person is bound to answer truly except on questions that would expose him to a criminal charge",
          "s. 162: a statement made to the police in the course of investigation shall not, if reduced to writing, be signed by the maker, and shall not be used for any purpose at an inquiry or trial except as provided — principally to contradict a prosecution witness under the Evidence Act",
          "An FIR under s. 154 is not a s. 161 statement; a confession to the police remains barred by Evidence Act ss. 25–26 regardless of 161/162",
          "A statement under s. 164 is recorded by a magistrate, not by the police; do not collapse 161, 162 and 164 into one 'police statement' category",
        ], "compare", ["CrPC 161 162 statements to police", "section 164 magistrate statement"]),
        L("arrest-safeguards", "Arrest Powers and Constitutional Safeguards", [
          "CrPC ss. 41 and 41A: arrest without warrant in cognizable cases is not automatic; s. 41A notice of appearance is the default where arrest is not required, as the provision and Arnesh Kumar require the police to record reasons",
          "Article 22(1)–(2): grounds of arrest, right to consult a legal practitioner, and production before the nearest magistrate within twenty-four hours excluding the journey time; CrPC ss. 50, 56 and 57 enact the same discipline",
          "D.K. Basu guidelines (memo of arrest, medical examination, intimation to a relative, arrest memo witnesses) are binding directions; they are not a substitute for the Code",
          "Arrest of a woman: the Code's special procedure (including that a woman police officer is to make the arrest, and the restrictions on night arrest) must be applied as written, not paraphrased loosely",
        ], "hierarchy", ["CrPC 41 41A arrest", "Article 22 twenty-four hours"]),
        L("remand-and-custody", "Police Custody, Judicial Custody and Remand", [
          "Production before a magistrate within twenty-four hours is the constitutional and statutory outer limit; further detention needs a remand order",
          "Police custody versus judicial custody: the former is for investigation and is tightly time-capped in the first fifteen days after arrest under the CrPC remand provision; the latter is detention under the court's warrant",
          "Default bail (statutory bail) under s. 167(2) CrPC arises if the charge-sheet is not filed within the prescribed ninety/sixty-day period and the accused is prepared to furnish bail — it is a right, not a discretion, once the conditions are met",
          "BNSS, 2023 is the successor name for this remand architecture; read the notification before quoting any Sanhita section",
        ], "timeline", ["CrPC section 167 remand", "default bail 167(2)"]),
        L("bail-bailable-non-bailable", "Bail in Bailable and Non-Bailable Offences", [
          "CrPC s. 436: in a bailable offence, bail is a matter of right when the accused is prepared to give bail; the police or court shall release him",
          "s. 437: in a non-bailable offence before a magistrate, bail is discretionary, with the statutory cautions for offences punishable with death or life, and the proviso favouring those under sixteen, women, the sick and the infirm",
          "s. 439: High Court and Court of Session have concurrent, wider bail power; cancellation of bail is a separate, sparingly used jurisdiction",
          "Conditions must be proportionate; bail is not punishment, and the presumption of innocence is the starting point, not a slogan added at the end",
        ], "compare", ["CrPC 436 vs 437", "section 439 High Court bail"]),
        L("anticipatory-and-default-bail", "Anticipatory Bail and Default Bail", [
          "s. 438 CrPC: a person who has reason to believe he may be arrested on an accusation of a non-bailable offence may apply to the High Court or the Court of Session for a direction to be released on bail in the event of arrest",
          "The court considers the nature of the accusation, antecedents, the possibility of fleeing, and whether the accusation is meant to injure or humiliate; conditions under s. 438(2) are the usual working tools",
          "Default / statutory bail under s. 167(2) is a different right: it is triggered by investigative delay, not by apprehension of arrest",
          "Special statutes may restrict s. 438 or impose twin conditions for regular bail; those restrictions must be in the special Act — do not import them into the Code",
        ], "cards", ["CrPC section 438 anticipatory bail", "statutory bail vs anticipatory bail"]),
        L("charge-framing-and-joinder", "Charge: Contents, Joinder and Alteration", [
          "CrPC Chapter XVII (ss. 211–224): a charge must state the offence, the law and section, and so much of the particulars of time, place and person as may be necessary to give the accused notice",
          "Errors in the charge are not fatal unless they have misled the accused and occasioned a failure of justice (ss. 215, 464)",
          "Joinder of charges and of accused is permitted only as ss. 218–223 allow: separate charges for distinct offences is the rule; same-transaction, same-kind-within-a-year, and the specified exceptions are the gates",
          "Alteration of charge (s. 216) is allowed at any time before judgment; the court must then permit recall of witnesses as the section requires so that there is no prejudice",
        ], "flow", ["CrPC section 211 charge", "joinder of charges 218 to 223"]),
        L("sanhitas-2023-by-name", "The 2023 Sanhitas: Names, Not Invented Numbers", [
          "Three Acts of 2023 replace the colonial triad by name: the Bharatiya Nyaya Sanhita, 2023 (substantive offences; replaces the Indian Penal Code, 1860), the Bharatiya Nagarik Suraksha Sanhita, 2023 (procedure; replaces the Code of Criminal Procedure, 1973), and the Bharatiya Sakshya Adhiniyam, 2023 (evidence; replaces the Indian Evidence Act, 1872)",
          "They came into force on a notified date in 2024; offences committed before commencement are generally dealt with under the old codes unless a specific saving/transition says otherwise — read the commencement notification and the repeals-and-savings clause",
          "Judicial-service notifications still differ: some papers name the old codes, some name the Sanhitas, some name both. The official notification, not a coaching list, decides what you write in the answer",
          "Do not invent or guess Sanhita section numbers. If the examined statute is a Sanhita, open that bare Act. The IPC/CrPC numbers used on the other pages of this subject are the pre-2024 numbers you can be sure of",
        ], "timeline", ["Bharatiya Nyaya Sanhita 2023", "BNSS BSA 2023 names"]),
      ]),
    ],
  },
  {
    slug: "judiciary-evidence-and-craft",
    name: "Evidence and Craft",
    description:
      "Relevancy, confessions ss. 24–30, dying declarations, burden of proof, electronic records under s. 65B as a concept, and the judgment-writing paper.",
    paper: "Prelims and Mains",
    sources: SRC,
    topics: [
      topic("relevancy-and-confessions", "Relevancy and Confessions (ss. 24–30)", EV, [
        L("relevancy-facts-in-issue", "Facts in Issue and Relevant Facts", [
          "Evidence Act s. 3: a fact in issue is a fact from which, either by itself or in connection with other facts, the existence, non-existence, nature or extent of any right, liability or disability asserted or denied in any suit or proceeding necessarily follows",
          "ss. 5–16: evidence may be given of facts in issue and of relevant facts; relevancy is a closed list, not a common-sense hunch",
          "s. 6 (res gestae): facts forming part of the same transaction; ss. 7–8: occasion, cause, effect, motive, preparation, previous and subsequent conduct",
          "The Bharatiya Sakshya Adhiniyam, 2023 restates relevancy; if that is the examined statute, use its name and its text, not guessed section numbers",
        ], "hierarchy", ["Evidence Act facts in issue", "section 6 res gestae"]),
        L("motive-conduct-conspiracy", "Motive, Conduct and Conspiracy (ss. 8–10)", [
          "s. 8: motive, preparation and conduct (previous or subsequent) are relevant; subsequent conduct includes absconding, but absconding is not a confession",
          "s. 9: facts necessary to explain or introduce a fact in issue or relevant fact, or which support or rebut an inference, identify persons or things, or fix time and place",
          "s. 10: things said or done by a conspirator in reference to their common intention, after the intention was first entertained — a narrow hearsay window, not a licence to dump the entire case diary",
          "Similar-fact evidence is not a free-standing Indian section; character is tightly cabined by ss. 52–55",
        ], "flow", ["Evidence Act section 8 conduct", "section 10 conspiracy"]),
        L("confessions-section-24", "Section 24: Inducement, Threat or Promise", [
          "s. 24: a confession made by an accused is irrelevant in a criminal proceeding if the making of the confession appears to the court to have been caused by any inducement, threat or promise having reference to the charge, proceeding from a person in authority, and sufficient to give the accused grounds which would appear to him reasonable for supposing that by making it he would gain any advantage or avoid any evil of a temporal nature in reference to the proceedings",
          "Person in authority is not limited to police; a village officer or employer may qualify on facts",
          "The test is appearance to the court, not proof beyond doubt that the inducement succeeded",
          "A retracted confession needs independent corroboration as a rule of prudence, even if it has passed s. 24",
        ], "cards", ["Evidence Act section 24 confession", "person in authority inducement"]),
        L("police-confession-25-27", "Sections 25 to 27: Police, Custody and Discovery", [
          "s. 25: no confession made to a police officer shall be proved as against a person accused of any offence — a complete bar, not a voluntariness enquiry",
          "s. 26: no confession made by a person in the custody of a police officer shall be proved as against him, unless it is made in the immediate presence of a magistrate",
          "s. 27: when any fact is deposed to as discovered in consequence of information received from a person accused, in the custody of a police officer, so much of the information as relates distinctly to the fact thereby discovered may be proved — the fact discovered, not the narrative of guilt",
          "s. 27 is a proviso to ss. 25 and 26; it is construed strictly. 'I hid the knife under the mango tree' yields the knife and the hiding-place, not 'I murdered him'",
        ], "compare", ["Evidence Act 25 26 27", "discovery under section 27"]),
        L("confession-28-30", "Sections 28 to 30: Removal of Impression and Co-Accused", [
          "s. 28: a confession that became irrelevant under s. 24 becomes relevant if it is made after the impression caused by the inducement, threat or promise has been fully removed",
          "s. 29: a relevant confession does not become irrelevant merely because it was made under a promise of secrecy, or in consequence of a deception, or when the accused was drunk, or because it was made in answer to questions he need not have answered, or for want of warnings",
          "s. 30: when more persons than one are being jointly tried for the same offence, a confession affecting himself and some other of such persons, proved, may be taken into consideration against the co-accused as well",
          "s. 30 is only a consideration, not substantive evidence against the co-accused; it cannot be the sole basis of conviction (the Kashmira Singh line of authority)",
        ], "flow", ["Evidence Act section 30 co-accused", "section 28 29 confession"]),
      ]),
      topic("dying-burden-electronic", "Dying Declaration, Burden and Electronic Records", EV, [
        L("dying-declaration", "Dying Declaration: Section 32(1)", [
          "s. 32(1): statements, written or verbal, of relevant facts made by a person who is dead (or who cannot be found, etc.), are themselves relevant when the statement is as to the cause of his death, or as to any of the circumstances of the transaction which resulted in his death, in cases in which the cause of that person's death comes into question",
          "The statement may be made before a magistrate, a doctor, a police officer, or a private person; there is no mandatory magistrate-recording rule, though a recorded, coherent declaration carries more weight",
          "Fitness to speak, absence of tutoring, and consistency where there are multiple declarations are the usual tests; a dying declaration can found a conviction without corroboration if it is reliable",
          "It is not an FIR and it is not a s. 161 statement; do not apply s. 162's bar to it",
        ], "cards", ["Evidence Act section 32 dying declaration", "multiple dying declarations"]),
        L("burden-of-proof", "Burden of Proof and Onus (ss. 101–106)", [
          "s. 101: whoever desires any court to give judgment as to any legal right or liability dependent on facts which he asserts, must prove those facts; the burden of proof as a matter of law never shifts",
          "s. 102: the burden of proof in a suit or proceeding lies on that person who would fail if no evidence at all were given on either side — this onus can shift",
          "s. 105: in a criminal case, the court shall presume the absence of circumstances bringing the case within a general exception; the accused has the burden of introducing those circumstances, typically to the standard of a reasonable doubt",
          "s. 106: when any fact is especially within the knowledge of any person, the burden of proving that fact is upon him — last-seen and 'especially within knowledge' arguments must not invert the prosecution's burden on the charge itself",
        ], "compare", ["Evidence Act 101 vs 102", "section 106 especially within knowledge"]),
        L("presumptions-and-standard", "Presumptions and the Criminal Standard", [
          "s. 4: 'may presume', 'shall presume', and 'conclusive proof' are three different intensities; do not write 'the court shall presume' when the section says 'may'",
          "Criminal standard: proof beyond reasonable doubt on the prosecution case; civil standard: preponderance of probabilities",
          "Statutory reverse burdens (dowry death, certain special Acts) must be taken from the parent statute; they do not rewrite s. 101 for every offence",
          "Circumstantial evidence: the chain must be complete and must exclude every reasonable hypothesis of innocence — a slogan only if the judgment actually walks the links",
        ], "hierarchy", ["may presume shall presume conclusive proof", "beyond reasonable doubt"]),
        L("electronic-65b-concept", "Electronic Records: Section 65B as a Concept", [
          "s. 65B: a computer output of an electronic record is admissible as evidence of the original in the circumstances the section states, without production of the original, when the conditions of genuineness of the computer and the process are met",
          "The certificate contemplated by s. 65B(4) — identifying the record, describing the manner of production, and signed by a person occupying a responsible official position in relation to the operation of the device — is the usual practical requirement for secondary electronic evidence",
          "The Supreme Court's reading has shifted on whether the certificate is mandatory at the threshold (Anvar, then Arjun Panditrao): state the current mandatory-certificate position for evidence produced under 65B, and do not treat a printout as a proven original merely because it looks official",
          "The Bharatiya Sakshya Adhiniyam, 2023 treats electronic records as documents more expressly. Name the Adhiniyam if that is the examined statute; do not invent its section numbers here. Chain of custody and hash values are investigation practice, not a substitute for the statutory conditions",
        ], "cards", ["Evidence Act 65B electronic record", "65B certificate conceptually"]),
        L("oral-and-documentary", "Oral Evidence and Documents (ss. 59–65, 91–92)", [
          "s. 59: all facts except the contents of documents (and electronic records) may be proved by oral evidence; s. 60: oral evidence must be direct — the person who saw, heard, or perceived",
          "ss. 61–65: contents of documents proved by primary evidence (the original) or by secondary evidence in the cases s. 65 lists (loss, possession of the adversary, public documents, etc.)",
          "ss. 91–92: when the terms of a contract, grant or other disposition of property have been reduced to a document, no oral evidence may be given in proof of the terms except as s. 92's provisos allow",
          "Public documents and certified copies (ss. 74–77) are a separate, easier proof path; do not prove a public record as if it were a private letter",
        ], "compare", ["primary vs secondary evidence", "Evidence Act 91 92 oral evidence"]),
      ]),
      topic("judgment-writing", "Judgment Writing and Viva", EV, [
        L("civil-judgment-writing", "Writing a Civil Judgment", [
          "Structure: case of the plaintiff, case of the defendant, issues framed (Order XIV), findings on each issue with reasons, the relief, costs, and the decree that will follow under s. 33 / Order XX",
          "Marshal evidence issue-wise; do not summarise witnesses in the order they were examined and then announce a result",
          "Apply one ratio of a binding decision to the facts found; a string of citations without a fact-match is not reasoning",
          "The operative portion must be executable: who pays or delivers what, by when, and what happens on default, without inventing a prayer that was never pleaded",
        ], "flow", ["civil judgment writing judiciary", "Order 20 judgment decree"]),
        L("criminal-judgment-writing", "Writing a Criminal Judgment", [
          "Structure: prosecution case, defence plea, charges framed, points for determination, evidence on each point, finding, and — on conviction — a separate hearing on sentence",
          "The judgment must show that the ingredients of the offence were taken up one by one; a narrative of suspicion is not proof beyond reasonable doubt",
          "Acquittal must be reasoned too; 'benefit of doubt' without identifying the doubt that remains is a mark-losing formula",
          "Do not fill Sanhita section numbers from memory in a judgment paper; quote the statute the question names",
        ], "hierarchy", ["criminal judgment writing", "points for determination conviction"]),
        L("orders-charge-bail-drafts", "Interlocutory Orders, Charge and Bail Drafts", [
          "A bail order records the accusation, the stage, the statutory provision invoked (s. 437 / 438 / 439 CrPC, or the named Sanhita equivalent if that is the paper), the competing factors, and the conditions",
          "A charge is a notice to the accused, not an essay: offence, section, date, place, and the manner in so far as needed under s. 211",
          "An injunction or appointment-of-receiver order must state the three-fold test and the undertaking as to damages where the practice requires it",
          "Common mark-losers: wrong provision, no reasons, conditions that cannot be complied with, and an operative line that contradicts the reasoning",
        ], "cards", ["bail order drafting", "framing of charge draft"]),
        L("viva-and-temperament", "Viva Voce: Law, Temperament and the Notification", [
          "The interview tests judicial temperament, the bare Act you claim to know, and awareness of recent binding decisions — not a current-affairs quiz",
          "Read the latest reported Supreme Court and your High Court's criminal and civil benches for the six months before viva; one accurate ratio beats ten remembered headlines",
          "Situational questions (hostile courtroom, media pressure, a connected litigant) are about recusal, patience, and the record; there is no trick statute",
          "The commission's viva scheme and document list are in the same notification that governed mains; do not assume another state's marking",
        ], "none", ["judiciary interview viva", "judicial temperament"]),
      ]),
    ],
  },
];
