/* ──────────────────────────────────────────────────────────────────────────
   NIRVAXIS — Scenario corpus
   Three pre-loaded bilateral disputes. Every scenario carries both sides of
   the resolution: the citizen's code-verified appeal kit AND the zero-PII
   owner diagnostic packet + ready-to-merge UI/policy patch.
   ────────────────────────────────────────────────────────────────────────── */

export type Mode = 'citizen' | 'owner';

export interface PIISegment {
  token: string;
  value: string;
  type: 'NAME' | 'ID' | 'AADHAAR' | 'PAN' | 'ACCT' | 'PHONE' | 'EMAIL' | 'AMOUNT' | 'PNR' | 'ADDR';
}

export interface Citation {
  id: number;
  source: string;
  title: string;
  url: string;
  verbatimQuote: string;
  verified: boolean;
  domain: '.gov' | '.org';
}

export interface RedTeamObjection {
  id: number;
  objection: string;
  vulnerability: string;
  patch: string;
  model: string;
}

export interface DiffLine {
  type: 'ctx' | 'add' | 'del' | 'hunk';
  text: string;
}

export interface OwnerPatch {
  file: string;
  failureClass: string;
  severity: 'SEV-1' | 'SEV-2' | 'SEV-3';
  signals: { label: string; weight: number }[];
  rootCause: string;
  counterfactual: string;
  patchSummary: string;
  anonymizedReports: number;
  predictedLift: string;
  diff: DiffLine[];
}

export interface Scenario {
  id: string;
  label: string;
  tag: string;
  jurisdiction: string;
  amountAtStake: string;
  amountNote: string;
  deadlineDays: number;
  deadlineLabel: string;
  deadlineDate: string;
  rawNotice: string;
  ventText: string;
  pii: PIISegment[];
  classification: string;
  classificationKind: 'document' | 'notice' | 'claim';
  confidence: number;
  failureMode: string;
  telemetry: { nano: number; super: number; ultra: number; nanoCost: number; superCost: number; ultraCost: number; tokens: number };
  citations: Citation[];
  redTeam: RedTeamObjection[];
  letter: { salutation: string; paragraphs: string[]; signoff: string };
  summaries: {
    en: string;
    hi: string;
    hiNative?: string;
    de?: string;
    es?: string;
    fr?: string;
    it?: string;
    pt?: string;
    ar?: string;
    ja?: string;
    zh?: string;
  };
  hindiNative: boolean;
  ownerPatch: OwnerPatch;
  icsTitle: string;
  icsAlarm: number;
}

export const SCENARIOS: Scenario[] = [
  /* ══════════════════════════ 1 · INDIA — EPFO ══════════════════════════ */
  {
    id: 'epf',
    label: 'EPFO Claim Rejected',
    tag: 'INDIA · EPFO PORTAL',
    jurisdiction: 'Republic of India · Employees’ Provident Fund',
    amountAtStake: '₹1,84,500',
    amountNote: 'Provident fund balance at stake',
    deadlineDays: 30,
    deadlineLabel: '15 Nov 2026',
    deadlineDate: '2026-11-15T09:00:00',
    rawNotice: `EPFO e-SEWA · Claim Status
UAN: 1002 3456 7892  |  Claim ID: CLM-2026-88412

Claim for FULL WITHDRAWAL (Form 19) — REJECTED.
Reason code: E-KYC-014 — Name in Aadhaar (PRIYA LAKSHMI) does not match EPFO member records (PRIYA LAKSHMI S). Fund transfer/withdrawal cannot be processed until KYC is rectified.

Secondary remark: Bank account 50200112345678 IFSC HDFC0001203 not verified against UAN 1002 3456 7892.

Grievance may be raised on EPFiGMS within 30 days of this notice.
Ref: EEFGF/2041/2026/CLM88412 · Date: 27 Oct 2026`,
    ventText:
      "They rejected my PF claim for a single missing 'S' in my name — I've waited 4 years for this money and they treat me like a form. My father's surgery was 3 months ago. I can't keep running to the EPFO office every week. Please just help me get what is mine.",
    pii: [
      { token: '[PERSON_1]', value: 'PRIYA LAKSHMI S', type: 'NAME' },
      { token: '[UAN_1]', value: '1002 3456 7892', type: 'ID' },
      { token: '[CLAIM_1]', value: 'CLM-2026-88412', type: 'ID' },
      { token: '[AADHAAR_1]', value: '9821 4455 2210', type: 'AADHAAR' },
      { token: '[PAN_1]', value: 'ABXPS4471K', type: 'PAN' },
      { token: '[ACCT_1]', value: '50200112345678', type: 'ACCT' },
      { token: '[IFSC_1]', value: 'HDFC0001203', type: 'ID' },
      { token: '[PHONE_1]', value: '+91 98765 43210', type: 'PHONE' },
      { token: '[EMAIL_1]', value: 'priya.lakshmi.s88@gmail.com', type: 'EMAIL' },
      { token: '[AMOUNT_1]', value: '₹1,84,500', type: 'AMOUNT' },
    ],
    classification: 'Statutory Benefit Claim — Employees’ Provident Fund (Form 19)',
    classificationKind: 'document',
    confidence: 0.97,
    failureMode: 'KYC Name-Match False Negative (thin suffix tolerance)',
    telemetry: { nano: 182, super: 744, ultra: 2140, nanoCost: 0.0004, superCost: 0.0031, ultraCost: 0.0148, tokens: 4187 },
    citations: [
      {
        id: 1,
        source: 'Employees’ Provident Funds Scheme, 1952 — Para 69(2)',
        title: 'EPF Scheme 1952, Ministry of Labour & Employment, Govt. of India',
        url: 'https://www.indiacode.nic.in/bitstream/123456789/1730/1/epf-scheme-1952.pdf',
        verbatimQuote:
          'any member who has ceased to be an employee in any factory or other establishment to which this Scheme applies and who has not obtained a new employment within a period of two months shall, on application, be entitled to receive the full amount standing to his credit in the Fund',
        verified: true,
        domain: '.gov',
      },
      {
        id: 2,
        source: 'EPFiGMS — Grievance Redressal Mandate (30-day resolution)',
        title: 'EPFO Grievance Management System, Employees’ Provident Fund Organisation',
        url: 'https://epfigms.gov.in/',
        verbatimQuote:
          'Every grievance registered on EPFiGMS shall be examined by the concerned officer and a resolution shall be provided to the grievant within 30 days of registration of the grievance, with the matter tracked to closure by the Grievance Officer',
        verified: true,
        domain: '.gov',
      },
      {
        id: 3,
        source: 'EPFO Circular — Joint Declaration for KYC Correction (EPFO/KYC/2024/11)',
        title: 'EPFO Circular on rectification of member records through Joint Declaration',
        url: 'https://www.epfindia.gov.in/site_docs/Circulars/Circulars/JD_correction_circular.pdf',
        verbatimQuote:
          'Where the member name as recorded with the EPFO differs from the name on the Aadhaar card merely by omission or addition of initials, suffixes, or minor spelling variance, the mismatch shall not be construed as a disqualification for settlement of claims, provided the member identity is otherwise unambiguous and supported by documentary evidence',
        verified: true,
        domain: '.gov',
      },
      {
        id: 4,
        source: 'Right to Information Act, 2005 — § 7(1)',
        title: 'RTI Act 2005, Government of India — disposal of request',
        url: 'https://rti.gov.in/act.html',
        verbatimQuote:
          'subject to the proviso to sub-section (2), as expeditiously as possible and in any case within thirty days of the receipt of the request, the Central Public Information Officer or State Public Information Officer shall either provide the information on payment of such fee as may be prescribed',
        verified: true,
        domain: '.gov',
      },
    ],
    redTeam: [
      {
        id: 1,
        objection:
          'The draft demand letter asserts a right to withdraw under Para 69(2) but never establishes the mandatory two-month cessation of employment — Without this predicate, Para 69 is inapposite and the officer can dispose off the appeal as premature on its face.',
        vulnerability: 'Predicate failure — entitlement anchor unproven',
        patch:
          'Inserted recital paragraph: “The claimant ceased employment on 31 August 2026 and has remained unemployed for a continuous period exceeding two months as on the date of this appeal, satisfying the threshold condition precedent to Para 69(2).”',
        model: 'Nemotron-3-Ultra-550B',
      },
      {
        id: 2,
        objection:
          'The letter demands correction of records but cites no procedural vehicle. Under EPFO practice, the grievant must invoke the Joint Declaration mechanism specifically — a bare “please correct my records” is routinely closed as “not actionable” by field officers.',
        vulnerability: 'Wrong remedy vehicle — appeal would be administratively closed',
        patch:
          'Recast prayer clause (ii): the letter now explicitly invokes Joint Declaration (JD) under EPFO Circular EPFO/KYC/2024/11 as the rectification instrument, names the counter-signatory (employer), and encloses the two required supporting documents.',
        model: 'Nemotron-3-Ultra-550B',
      },
      {
        id: 3,
        objection:
          'Tone is coercive — “release my money immediately or face action.” Officers act on citable law, not pressure. A coercive letter invites a defensive rejection and forecloses the informal correction channel entirely.',
        vulnerability: 'Register mismatch — coercive framing weakens enforceable ask',
        patch:
          'Normalised tone to “respectful, statutory, and specific”: every demand is now paired with its exact legal anchor (Para 69(2), EPFiGMS 30-day mandate, JD circular), closing with an amicable request and an RTI fallback only as a stated next step.',
        model: 'Nemotron-3-Ultra-550B',
      },
    ],
    letter: {
      salutation: 'To The Regional Provident Fund Commissioner, EPFO, Chennai — 600006',
      paragraphs: [
        'Sir/Madam,',
        'Re: Appeal against rejection of Form 19 claim — Claim ID [CLAIM_1] · UAN [UAN_1] · Member [PERSON_1]',
        'I write in respect of the rejection communicated on 27 October 2026 with reason code E-KYC-014, to the effect that my name as it appears on my Aadhaar card (“PRIYA LAKSHMI”) does not match the EPFO member record (“PRIYA LAKSHMI S”), and that bank account [ACCT_1] (IFSC [IFSC_1]) stands unverified. I humbly submit that this rejection is legally unsustainable and factually erroneous, and request that it be set aside and the claim settled expeditiously.',
        '1. Entitlement to withdrawal. Your kind records reflect that I ceased employment on 31 August 2026 and have remained unemployed since. I have thus completed a continuous period exceeding two months as of the date hereof, satisfying the condition precedent to Para 69(2) of the Employees’ Provident Funds Scheme, 1952, which entitles a member who has ceased employment and has not obtained new employment within two months, on application, to “receive the full amount standing to his credit in the Fund.” [1] The statutory right has crystallised; the claim is not premature.',
        '2. The “mismatch” is not a mismatch in law. The supposed discrepancy is the presence of the suffix “S” in the EPFO record and its omission on Aadhaar. EPFO’s own KYC correction circular states in terms that where the member name differs “merely by omission or addition of initials, suffixes, or minor spelling variance,” the difference “shall not be construed as a disqualification for settlement of claims,” provided identity is otherwise unambiguous and supported by documentary evidence. [3] My Aadhaar [AADHAAR_1], PAN [PAN_1], UAN [UAN_1], specimen signature, and cancelled cheque all unambiguously establish a single identity. The bank seeding error is likewise remediable by the same rectification and does not implicate entitlement.',
        '3. Rectification vehicle. I hereby invoke the Joint Declaration mechanism under the aforesaid circular. A signed Joint Declaration (employer + member) correcting the member name to “PRIYA LAKSHMI” and confirming the bank account [ACCT_1] is enclosed, along with (i) a self-attested Aadhaar masked copy, (ii) a self-attested PAN card, and (iii) the cancelled cheque bearing my name in full. These documents remove every factual predicate for the rejection.',
        '4. Mode and timeline of redress. This letter itself is also registered as a grievance on EPFiGMS. Under the grievance mandate governing EPFiGMS, every grievance “shall be examined by the concerned officer and a resolution shall be provided to the grievant within 30 days of registration of the grievance.” [2] I trust the matter will therefore be disposed of within that window.',
        '5. Reservation of rights. Should no speaking order or settlement issue within 30 days, I shall, without prejudice, invoke my rights under the Right to Information Act, 2005, § 7(1), requiring disposal of my request “within thirty days of the receipt of the request,” [4] and thereafter pursue such further remedies as are available in law.',
        'PRAYER. It is most humbly prayed that this Authority may be pleased to (i) set aside the rejection dated 27 October 2026 under reason code E-KYC-014; (ii) direct acceptance of the enclosed Joint Declaration and settlement of Claim ID [CLAIM_1] forthwith; and (iii) remit the full corpus of [AMOUNT_1] to the verified bank account [ACCT_1] (IFSC [IFSC_1]) within 30 days.',
        'I remain at Your disposal for any further document. I have not suppressed any material fact. Thanking You in anticipation of an expeditious and sympathetic disposal.',
      ],
      signoff: 'Yours faithfully,\n\n[PERSON_1]\nUAN [UAN_1] · PAN [PAN_1] · Aadhaar [AADHAAR_1]\n[PHONE_1] · [EMAIL_1]\nDate: 27 October 2026',
    },
    summaries: {
      en: 'Your EPF withdrawal was rejected only because your name differs by one suffix (“S”) between Aadhaar and EPFO records. Under Para 69(2) of the EPF Scheme 1952 you have a right to full withdrawal after 2+ months of unemployment — and EPFO’s own KYC circular says a suffix mismatch is NOT a disqualification. File this letter via EPFiGMS; resolution is mandated within 30 days.',
      hi: 'आपका EPF क्लेम सिर्फ़ इसलिए अस्वीकार हुआ कि आपके Aadhaar और EPFO रिकॉर्ड में नाम में “S” प्रत्यय का अंतर है। EPF स्कीम 1952 के पैरा 69(2) के तहत 2+ महीने बेरोज़गारी पर पूर्ण निकासी का अधिकार है — और EPFO का KYC परिपत्र स्वयं कहता है कि प्रत्यय अंतर अपात्रता नहीं है। यह पत्र EPFiGMS पर दर्ज करें; 30 दिन में समाधान अनिवार्य है।',
      hiNative: 'आपका EPF क्लेम सिर्फ़ इसलिए अस्वीकार हुआ कि आपके आधार और EPFO रिकॉर्ड में नाम में “S” प्रत्यय का अंतर है। EPF स्कीम 1952 के पैरा 69(2) के तहत 2+ महीने बेरोज़गारी पर पूर्ण निकासी का अधिकार है — और EPFO का KYC परिपत्र स्वयं कहता है कि प्रत्यय अंतर अपात्रता नहीं है। यह पत्र EPFiGMS पर दर्ज करें; 30 दिन में समाधान अनिवार्य है।',
      de: 'Ihr EPF-Antrag wurde nur wegen eines Namenssuffixes („S“) zwischen Aadhaar und EPFO abgelehnt. Nach Para 69(2) der EPF Scheme 1952 haben Sie Anspruch auf volle Auszahlung nach 2+ Monaten Arbeitslosigkeit — und EFPOs eigenes KYC-Rundschreiben erklärt Suffix-Abweichungen ausdrücklich für zulässig. Reichen Sie diesen Brief über EPFiGMS ein; eine Entscheidung ist innerhalb von 30 Tagen vorgeschrieben.',
      es: 'Su reclamo de EPF fue rechazado solo por un sufijo (“S”) en su nombre entre Aadhaar y los registros de EPFO. Bajo el Párrafo 69(2) del Plan EPF 1952 usted tiene derecho al retiro total tras 2+ meses de desempleo — y la propia circular KYC de EPFO indica que una diferencia de sufijo NO es descalificante. Presente esta carta vía EPFiGMS; la resolución está mandatada en 30 días.',
      fr: 'Votre demande EPF a été rejetée uniquement pour un suffixe (« S ») de nom entre Aadhaar et EPFO. Selon l’alinéa 69(2) du Plan EPF 1952, vous avez droit au retrait intégral après 2+ mois de chômage — et la circulaire KYC de l’EPFO précise qu’une différence de suffixe n’est PAS disqualifiante. Déposez cette lettre via EPFiGMS ; une décision est requise sous 30 jours.',
      it: 'La tua richiesta di prelievo EPF è stata respinta solo per un suffisso («S») tra Aadhaar ed EPFO. Secondo il Para 69(2) dello Schema EPF 1952 hai diritto al prelievo completo dopo 2+ mesi di disoccupazione — e la circolare KYC di EPFO stabilisce che la variazione di suffisso non è motivo di decadenza. Invia tramite EPFiGMS; riscontro obbligatorio entro 30 giorni.',
      pt: 'O seu pedido de levantamento do EPF foi rejeitado apenas por um sufixo («S») entre o Aadhaar e o EPFO. Ao abrigo do Para 69(2) do Regime EPF 1952, tem direito ao resgate total após 2+ meses de desemprego — e a circular KYC do EPFO esclarece que a divergência de sufixo NÃO é desqualificante. Submeta via EPFiGMS; resolução obrigatória em 30 dias.',
      ar: 'تم رفض طلب سحب مستحقات EPF لمجرد اختلاف لاحقة («S») بين بطاقة Aadhaar وسجلات EPFO. بموجب الفقرة 69(2) يحق لك السحب الكامل بعد شهرين من البطالة — وتعميم KYC يؤكد أن اختلاف اللاحقة لا يمنع الصرف. أرسل هذا الخطاب عبر EPFiGMS؛ والرد إلزامي خلال 30 يوماً.',
      ja: 'AadhaarとEPFOの記録間で氏名の末尾（「S」）が1文字異なるだけでEPF引出申請が却下されました。1952年EPF制度第69条(2)により2か月以上の失業で全額引出の権利があり、公式KYC通達でも末尾不一致は却下理由にならないと明記されています。本状をEPFiGMS経由で提出してください。30日以内の裁決が義務付けられています。',
      zh: '您的EPF公积金提取仅因Aadhaar与EPFO记录中相差一个后缀字母（“S”）而被驳回。依据1952年EPF计划第69(2)条，失业满2个月即可全额提取 — EPFO官方KYC通达亦明确后缀不一致绝非驳回理由。通过EPFiGMS提交本函，官方必须在30天内出具解决方案。',
    },
    hindiNative: true,
    icsTitle: 'EPFO Grievance — 30-Day Statutory Deadline',
    icsAlarm: 3,
    ownerPatch: {
      file: 'apps/epfo-portal/src/pages/ClaimReview/KycMismatchGuard.tsx',
      failureClass: 'Deterministic False-Rejection — KYC Name-Match False Negative',
      severity: 'SEV-2',
      signals: [
        { label: 'Aadhaar vs member record diff = suffix-only tokens', weight: 0.44 },
        { label: 'Claim code Form 19 + 2-month unemployment predicate met', weight: 0.27 },
        { label: 'Bank IFSC verified OK in marketplace signals', weight: 0.18 },
        { label: 'Zero prior fraud flags for UAN (lifetime)', weight: 0.11 },
      ],
      rootCause:
        'The e-SEWA claim adjudicator performs a byte-level string equality check on (Aadhaar name vs member name). The 2024 KYC circular mandating suffix/initial tolerance was codified in the Manual Review SOP but never ported into the automated rejection path. Result: an unknown-but-large volume of fully-entitled claims (primarily women with post-marriage suffix additions) are auto-rejected with E-KYC-014, and the citizen bears a 30–45 day grievance loop.',
      counterfactual:
        'Had the tolerant matcher shipped, this claim would have auto-approved: suffix-diff score 0.94 ≥ τ(0.90), Aadhaar OTP valid, IFSC verified, unemployment predicate satisfied. Estimated wrongful-rejection rate for this reason code: 71.3%.',
      patchSummary:
        'Drop-in fuzzy matcher (Jaro-Winkler + token-suffix strip) into the rejection path; claims above threshold route to silent auto-approval, between τ_low–τ_high route to officer queue with pre-filled JD form, below τ_low retain rejection. Zero UI redesign — renders behind existing ReasonCode component.',
      anonymizedReports: 12847,
      predictedLift: '−71% wrongful rejections · est. ₹312 Cr/yr restored to members',
      diff: [
        { type: 'hunk', text: '@@ -88,14 +88,26 @@ export function adjudicateClaim(c: ClaimRecord) {' },
        { type: 'ctx', text: '  const aadhaarName = normalize(c.aadhaar.name);' },
        { type: 'ctx', text: '  const memberName  = normalize(c.memberName);' },
        { type: 'del', text: '  if (aadhaarName !== memberName) {' },
        { type: 'del', text: '    return reject(c, "E-KYC-014");' },
        { type: 'del', text: '  }' },
        { type: 'add', text: '  const sim = jaroWinkler(aadhaarName, memberName);' },
        { type: 'add', text: '  const suffixOnly = suffixTokenDiff(aadhaarName, memberName);' },
        { type: 'add', text: '  // EPFO/KYC/2024/11 — suffix & initial variance is NOT a disqualification' },
        { type: 'add', text: '  if (suffixOnly || sim >= 0.90) {' },
        { type: 'add', text: '    return approve(c, { basis: "KYC_SUFFIX_TOLERANCE_v2" });' },
        { type: 'add', text: '  }' },
        { type: 'add', text: '  if (sim >= 0.78) {' },
        { type: 'add', text: '    return routeToOfficer(c, prefillJointDeclaration(c));' },
        { type: 'add', text: '  }' },
        { type: 'add', text: '  return reject(c, "E-KYC-014", { telemetry: { sim, suffixOnly } });' },
      ],
    },
  },

  /* ════════════════════ 2 · EU — EU-261 FLIGHT DELAY ════════════════════ */
  {
    id: 'eu261',
    label: 'EU-261 Compensation Denied',
    tag: 'EU · EUROPEAN FLIGHT RIGHTS',
    jurisdiction: 'European Union · Regulation (EC) 261/2004',
    amountAtStake: '€400',
    amountNote: 'Fixed statutory compensation (1,500–3,500 km)',
    deadlineDays: 365,
    deadlineLabel: '27 Oct 2027',
    deadlineDate: '2027-10-27T09:00:00',
    rawNotice: `NordStar Airways · Customer Relations
Booking Ref: KX7R2P  |  Flight: SN-442 · BER 08:45 → MAD 12:55
Date of travel: 14 October 2026

Your compensation claim (EC 261/2004) has been REJECTED.
Arrival delay: 5h 22m (actual arrival 18:17).

Reason: Extraordinary circumstances — crew shortage at base station following unplanned crew rotation shortfall. Compensation is therefore excluded under Article 5(3) and Article 7 of Regulation (EC) No 261/2004.

You may escalate to the National Enforcement Body.
Ref: NSA/CX/2026/00981`,
    ventText:
      "They cancelled our morning slot, jammed us into a night flight, arrived 5 hours late into Madrid, and now they refuse €400 because of some 'crew rotation' excuse. I have the boarding passes, the delay certificate, everything. A corporate auto-response can't be the final word.",
    pii: [
      { token: '[PERSON_1]', value: 'DANIEL REYES', type: 'NAME' },
      { token: '[PNR_1]', value: 'KX7R2P', type: 'PNR' },
      { token: '[TICKET_1]', value: '220-4321789-01', type: 'ID' },
      { token: '[FLIGHT_1]', value: 'SN-442', type: 'ID' },
      { token: '[EMAIL_1]', value: 'daniel.reyes@mailbox.es', type: 'EMAIL' },
      { token: '[PHONE_1]', value: '+34 612 555 210', type: 'PHONE' },
      { token: '[AMOUNT_1]', value: '€400', type: 'AMOUNT' },
    ],
    classification: 'EU Air Passenger Compensation Claim — EC 261/2004, Art. 7(1)(b)',
    classificationKind: 'claim',
    confidence: 0.96,
    failureMode: 'Extraordinary-Circumstances Overreach (Art. 5(3) misapplied)',
    telemetry: { nano: 171, super: 812, ultra: 2360, nanoCost: 0.0004, superCost: 0.0034, ultraCost: 0.0164, tokens: 4523 },
    citations: [
      {
        id: 1,
        source: 'Regulation (EC) No 261/2004 — Article 7(1)(b)',
        title: 'Regulation (EC) No 261/2004 of 11 February 2004, EUR-Lex',
        url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004R0261',
        verbatimQuote:
          'where reference is made to this Article, passengers shall be entitled to compensation amounting to: (a) EUR 250 for all flights of 1500 kilometres or less; (b) EUR 400 for all intra-Community flights of more than 1500 kilometres, and for all other flights between 1500 and 3500 kilometres',
        verified: true,
        domain: '.org',
      },
      {
        id: 2,
        source: 'Regulation (EC) No 261/2004 — Article 5(3)',
        title: 'Regulation (EC) No 261/2004, EUR-Lex — extraordinary circumstances defence',
        url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004R0261',
        verbatimQuote:
          'An operating air carrier shall not be obliged to pay compensation in accordance with Article 7, if it can prove that the cancellation is caused by extraordinary circumstances which could not have been avoided even if all reasonable measures had been taken',
        verified: true,
        domain: '.org',
      },
      {
        id: 3,
        source: 'CJEU — Joined Cases C-402/07 & C-432/07 (Sturgeon v Condor / Böck v Air France)',
        title: 'Judgment of the Court (Fourth Chamber) of 19 November 2009',
        url: 'https://curia.europa.eu/juris/document/document.jsf?docid=75825',
        verbatimQuote:
          'Passengers whose flights are delayed have the right to compensation under Articles 5 and 7 of Regulation No 261/2004 where they suffer, by reason of the delay, a loss of time equal to or greater than three hours by comparison with the time of arrival originally scheduled, as regards flights of more than 1500 kilometres',
        verified: true,
        domain: '.org',
      },
      {
        id: 4,
        source: 'CJEU — Case C-294/10 (Eglitis and Ratnieks v Latvijas Republikas)',
        title: 'Judgment of 12 May 2011 — scope of “extraordinary circumstances”',
        url: 'https://curia.europa.eu/juris/document/document.jsf?docid=88198',
        verbatimQuote:
          'technical problems which come to light during maintenance of aircraft or on account of failure to carry out such maintenance cannot, in themselves, constitute extraordinary circumstances; extraordinary circumstances must be understood as referring to events which are not inherent in the normal exercise of the activity of the air carrier concerned and are beyond its actual control',
        verified: true,
        domain: '.org',
      },
    ],
    redTeam: [
      {
        id: 1,
        objection:
          'The draft concedes the airline invoked Article 5(3) but never forces it to prove the defence. Under the Regulation the burden is expressly on the carrier (“if it CAN PROVE that the cancellation is caused by…”) — a demand letter that does not allocate that burden invites another templated rejection.',
        vulnerability: 'Burden-of-proof misallocation — airline escapes unexamined',
        patch:
          'Inserted paragraph 3: the letter now expressly allocates the burden — “Article 5(3) places the burden of proof on the operating carrier. You have adduced no evidence beyond an unattributed assertion of ‘crew rotation shortfall.’ A bare assertion is not proof.”',
        model: 'Nemotron-3-Ultra-550B',
      },
      {
        id: 2,
        objection:
          'The draft accepts “crew shortage” at face value and only argues consequences. Crew rotation shortfalls are res ipsa inherent in the carrier’s normal operations (Eglitis C-294/10; Wallentin-Hermann C-549/07) — the letter must contest the premise, not just the framing.',
        vulnerability: 'Premise unchallenged — defeated on the facts conceded',
        patch:
          'Rewrote paragraph 2: the letter now contests the premise directly — crew scheduling is an operational matter within the carrier’s control and is “inherent in the normal exercise of the activity of the air carrier.” It was not, and cannot be, an extraordinary circumstance.',
        model: 'Nemotron-3-Ultra-550B',
      },
      {
        id: 3,
        objection:
          'No deadline and no escalation ladder. Airlines ride out passive claimants for months. The draft lacks a 14-day demand horizon and named enforcement escalation (German Luftfahrt-Bundesamt / Spanish AESA where applicable), which is what converts pressure into payment.',
        vulnerability: 'No enforcement vector — demand without consequence',
        patch:
          'Appended enforcement clause: payment demanded within 14 calendar days; absent payment, the matter is lodged simultaneously with (i) the National Enforcement Body, (ii) the applicable Small Claims / Mahnverfahren, and (iii) the airline’s ADR scheme — referencing Art. 16 of the Regulation.',
        model: 'Nemotron-3-Ultra-550B',
      },
    ],
    letter: {
      salutation: 'To NordStar Airways — Customer Relations & Claims Department',
      paragraphs: [
        'Dear Sir or Madam,',
        'Re: Claim SN-442 · Booking [PNR_1] · Flight of 14 October 2026 · BER 08:45 → MAD 12:55 · Arrival delay 5h 22m',
        'I refer to your letter of rejection dated 16 October 2026, by which you declined my claim for compensation under Regulation (EC) No 261/2004 on the ground of “extraordinary circumstances — crew rotation shortfall.” I respectfully submit that the rejection is unfounded in fact and unlawful in law, and that compensation of €400 is due and payable.',
        '1. Right to compensation arises at 3+ hours’ arrival delay. Under Article 5 of Regulation 261/2004, passengers whose flights are rerouted and who reach their final destination three hours or more after the scheduled arrival time have a right to compensation pursuant to Article 7. [3] My flight arrived at 18:17 against a scheduled 12:55 — a delay of 5 hours and 22 minutes, comfortably exceeding the threshold.',
        '2. The route qualifies for the €400 tier. BER → MAD covers approximately 1,860 km, placing this flight within Article 7(1)(b) of the Regulation: “EUR 400 for all intra-Community flights of more than 1500 kilometres, and for all other flights between 1500 and 3500 kilometres.” [1] €400 is therefore the statutory figure, not the €250 tier that might attach to a short-haul route.',
        '3. The burden of proof is yours — and you have discharged none of it. Article 5(3) provides that the carrier “shall not be obliged to pay compensation in accordance with Article 7, if it can prove that the cancellation is caused by extraordinary circumstances which could not have been avoided even if all reasonable measures had been taken.” [2] Your rejection cites an unattributed, undated “crew rotation shortfall.” No crew rosters, incident reports, or operational data have been adduced. A bald assertion is not proof, and no assertion has been made at all regarding the reasonable-measures Limb of Article 5(3).',
        '4. Crew rotation shortfall is not an extraordinary circumstance as a matter of settled law. The Court of Justice has consistently held that extraordinary circumstances “must be understood as referring to events which are not inherent in the normal exercise of the activity of the air carrier concerned and are beyond its actual control.” [4] Crew scheduling, rostering, and rotation are paradigmatically inherent in that activity. Technical problems routinely arising from that activity are likewise not extraordinary. A crew shortfall on a scheduled intra-Community rotation is an operational failure of the airline’s own making, not an act of nature, security event, or air-traffic restriction beyond control.',
        '5. Demand. I hereby demand payment of €400 within fourteen (14) calendar days of the date of this letter. In default, I shall, without further notice, (i) lodge this matter with the National Enforcement Body designated under Article 16 of the Regulation, (ii) commence the applicable small-claims/Mahnverfahren procedure, and (iii) refer the file to the airline’s approved Alternative Dispute Resolution entity. All enclosures — boarding passes, PNR confirmation, delay certificate, and your rejection letter — are retained in original.',
        'Please treat this letter as a formal pre-action notice. I look forward to your confirmation of payment.',
      ],
      signoff: 'Yours faithfully,\n\n[PERSON_1]\nBooking [PNR_1] · E-ticket [TICKET_1]\n[PHONE_1] · [EMAIL_1]\nDate: 27 October 2026',
    },
    summaries: {
      en: 'Your flight landed 5h 22m late — over the EU-261 3-hour threshold. BER→MAD is ~1,860 km, so you are owed €400 (Art. 7(1)(b)). “Crew rotation” is not an extraordinary circumstance — the airline must prove it, and has proven nothing. Send this letter; they have 14 days before you escalate to the National Enforcement Body and small claims.',
      hi: 'आपकी फ़्लाइट 5 घंटे 22 मिनट देर से पहुंची — EU-261 की 3 घंटे की सीमा से अधिक। BER→MAD ~1,860 किमी है, इसलिए ₹/€400 (अनुच्छेद 7(1)(b)) देय है। “क्रू रोटेशन” अप्रत्याशित परिस्थिति नहीं है — एयरलाइन को साबित करना होगा, और उन्होंने कुछ साबित नहीं किया। यह पत्र भेजें; राष्ट्रीय प्रवर्तन निकाय और लघु वाद अदालत जाने से पहले उनके पास 14 दिन हैं।',
      hiNative: 'आपकी फ़्लाइट 5 घंटे 22 मिनट देर से पहुंची — EU-261 की 3 घंटे की सीमा से अधिक। BER→MAD ~1,860 किमी है, इसलिए €400 (अनुच्छेद 7(1)(b)) देय है। “क्रू रोटेशन” अप्रत्याशित परिस्थिति नहीं है — एयरलाइन को साबित करना होगा, और उन्होंने कुछ साबित नहीं किया। यह पत्र भेजें; राष्ट्रीय प्रवर्तन निकाय और लघु वाद अदालत जाने से पहले उनके पास 14 दिन हैं।',
      de: 'Ihr Flug landete mit 5 Std. 22 Min. Verspätung — weit über der 3-Stunden-Schwelle der EU-261. BER→MAD (~1.860 km) qualifiziert nach Art. 7(1)(b) für 400 €. „Crew-Rotation“ ist kein außergewöhnlicher Umstand — die Beweislast liegt bei der Airline, und sie hat nichts bewiesen. Senden Sie diesen Brief; danach haben Sie 14 Tage bis zur Eskalation an die nationale Aufsichtsbehörde und das Mahnverfahren.',
      es: 'Su vuelo llegó con 5h 22m de retraso — supera el umbral de 3 horas del EU-261. BER→MAD (~1.860 km) da derecho a €400 (Art. 7(1)(b)). La “rotación de tripulación” no es circunstancia extraordinaria — la carga de la prueba es de la aerolínea y no ha probado nada. Envíe esta carta; tienen 14 días antes de escalar al Organismo Nacional de Aplicación y a un proceso monitorio.',
      fr: 'Votre vol est arrivé avec 5h22 de retard — au-delà du seuil de 3 heures de l’EU-261. BER→MAD (~1 860 km) ouvre droit à 400 € (art. 7(1)(b)). La « rotation d’équipage » n’est pas une circonstance extraordinaire — la charge de la preuve incombe à la compagnie, qui n’a rien démontré. Envoyez cette lettre ; vous avez 14 jours avant de saisir l’organisme national d’application et la procédure d’injonction.',
      it: 'Il tuo volo è atterrato con 5h 22m di ritardo — oltre la soglia di 3 ore (EU-261). Tratta BER→MAD (~1.860 km), hai diritto a 400 € (Art. 7(1)(b)). La «rotazione equipaggio» non è causa eccezionale. Invia questa lettera; hanno 14 giorni prima dell’azione dinanzi a ENAC e giudici.',
      pt: 'O seu voo aterrou com 5h 22m de atraso — acima do limiar de 3 horas da UE-261. Rota BER→MAD (~1.860 km), tem direito a 400 € (Art. 7(1)(b)). «Rotação de tripulação» não é circunstância extraordinária. Envie esta carta; têm 14 dias antes do recurso à autoridade da aviação.',
      ar: 'هبطت رحلتك بتأخير 5 ساعات و22 دقيقة — متجاوزة حد الـ 3 ساعات (EU-261). لمسافة BER→MAD (~1,860 كم) يحق لك 400 يورو (المادة 7(1)(b)). تبديل طاقم الطائرة ليس ظرفاً استثنائياً. أرسل هذا الخطاب؛ ولديهم 14 يوماً للدفع قبل التصعيد القانوني.',
      ja: '航空便が5時間22分遅延し、EU-261の3時間基準を超過しました。BER→MAD線（約1,860km）により400ユーロが請求可能です（第7条(1)(b)）。「乗務員繰り」は異常事態に該当しません。本状を送付してください。管轄当局への告発・少額訴訟まで14日間の猶予が与えられます。',
      zh: '您的航班实际延误5小时22分 — 超出欧盟EU-261法规3小时法定门槛。BER→MAD航线约1,860公里，依法享400欧元赔偿（第7(1)(b)条）。机组轮换并非不可抗力异常情况。寄出此函，航司在您向航空监管局起诉前有14天赔付期。',
    },
    hindiNative: true,
    icsTitle: 'EU-261 Appeal — Escalation Window Closes (14 days)',
    icsAlarm: 2,
    ownerPatch: {
      file: 'apps/claims-api/src/lib/extraordinaryCircumstances.ts',
      failureClass: 'Deterministic False-Rejection — Article 5(3) Extraordinary-Circumstances Overreach',
      severity: 'SEV-1',
      signals: [
        { label: 'Rejection cites “crew rotation / scheduling” family', weight: 0.41 },
        { label: 'Arrival delay ≥ 3h & route intra-Community >1500 km', weight: 0.29 },
        { label: 'No evidence fields populated in claim record', weight: 0.19 },
        { label: 'NEB escalation rate for reason code EC-STAT = 68%', weight: 0.11 },
      ],
      rootCause:
        'The claims adjudication engine maps the free-text reason string “crew shortage/rotation” to an extraordinary-circumstances flag without evidence capture. Article 5(3) requires proof of both prongs (event not inherent + all reasonable measures). The classifier hard-rejects on keyword match alone — an unsafe default that contradicts Sturgeon and Eglitis, and drives 8-figure annual NEB-escalation exposure and EMT-equivalent penalties under Regulation 261/2004 fines.',
      counterfactual:
        'Had the evidence-gated path run, this claim auto-pays €400: no extraordinary event descriptor on file, no reasonable-measures log, intra-Community route, 5h22m arrival delay. Estimated wrongful-rejection rate for EC-STAT: 76.8%.',
      patchSummary:
        'Gate the Art. 5(3) short-circuit behind an evidence checklist (event descriptor + reasonable-measures log). Claims without evidence route to human adjudicator; claims with evidence still run the C-294/10 inherent-activity test. Includes a regression suite seeded from 34k historic NEB-escalated files.',
      anonymizedReports: 34210,
      predictedLift: '−77% wrongful rejections · est. €96M/yr avoided NEB exposure',
      diff: [
        { type: 'hunk', text: '@@ -141,16 +141,33 @@ function evaluateClaim(claim: ClaimFile): Verdict {' },
        { type: 'ctx', text: '  const delay = arrivalDelayMinutes(claim);' },
        { type: 'del', text: '  if (/crew shortage|crew rotation/i.test(claim.reason)) {' },
        { type: 'del', text: '    return { decision: "REJECT", basis: "EC-STAT" };' },
        { type: 'del', text: '  }' },
        { type: 'add', text: '  const ec = claim.evidence?.extraordinaryEvent;' },
        { type: 'add', text: '  const rm = claim.evidence?.reasonableMeasuresLog;' },
        { type: 'add', text: '  // Art. 5(3) requires BOTH prongs of proof — burden is on the carrier' },
        { type: 'add', text: '  if (ec && rm && ec.notInherent && rm.length >= 2) {' },
        { type: 'add', text: '    return reject(claim, "EC_5_3_REASONED");' },
        { type: 'add', text: '  }' },
        { type: 'add', text: '  // C-294/10: crew scheduling is inherent — never extraordinary on keyword' },
        { type: 'add', text: '  if (/crew shortage|crew rotation|scheduling|roster/i.test(claim.reason)) {' },
        { type: 'add', text: '    return adjudicateCompensation(claim); // pay Art. 7 tier' },
        { type: 'add', text: '  }' },
        { type: 'add', text: '  return routeToHuman(claim, "EVIDENCE_INCOMPLETE");' },
      ],
    },
  },

  /* ═══════════════ 3 · US — TEXAS DEPOSIT WITHHELD ═══════════════ */
  {
    id: 'deposit',
    label: 'Security Deposit Withheld',
    tag: 'US · TEXAS PROPERTY CODE',
    jurisdiction: 'United States · Texas, Prop. Code § 92.109',
    amountAtStake: '$2,400',
    amountNote: 'Deposit + potential treble damages ($100 + 3×)',
    deadlineDays: 30,
    deadlineLabel: '26 Nov 2026',
    deadlineDate: '2026-11-26T09:00:00',
    rawNotice: `Oakwood Residential LLC · Leasing Office
Lease: OAK-2024-118 · Unit 311 · 4802 Burnet Rd, Austin TX 78756

Move-out 30 September 2026. Security deposit: $2,400.

Disposition: WITHHELD IN FULL.
Itemization — Cleaning $900 · Carpet replacement $1,200 · “General wear” $300. Enclosed: one (1) photo of carpet dated 03 Oct 2026 (no move-in baseline on file).

No itemized statement provided within 30 days of surrender as required.
Contact: austin@oakwoodres.example.com`,
    ventText:
      "Two years of spotless living and one blurry carpet photo after I left — they kept my entire $2,400 with no itemized list, no receipts, nothing. I need that money for the deposit on my next place. This is just theft with letterhead.",
    pii: [
      { token: '[PERSON_1]', value: 'JORDAN WHITMORE', type: 'NAME' },
      { token: '[ADDR_1]', value: '4802 Burnet Rd #311, Austin TX 78756', type: 'ADDR' },
      { token: '[LEASE_1]', value: 'OAK-2024-118', type: 'ID' },
      { token: '[EMAIL_1]', value: 'jordan.whitmore94@gmail.com', type: 'EMAIL' },
      { token: '[PHONE_1]', value: '+1 (512) 555-0148', type: 'PHONE' },
      { token: '[AMOUNT_1]', value: '$2,400', type: 'AMOUNT' },
    ],
    classification: 'Landlord-Tenant Security Deposit Dispute — Tex. Prop. Code § 92.109',
    classificationKind: 'notice',
    confidence: 0.95,
    failureMode: 'Statutory Deadline Miss — 30-day itemization violation (presumed bad faith)',
    telemetry: { nano: 165, super: 790, ultra: 2210, nanoCost: 0.0004, superCost: 0.0033, ultraCost: 0.0152, tokens: 4311 },
    citations: [
      {
        id: 1,
        source: 'Texas Property Code § 92.109(a)',
        title: 'Tex. Prop. Code ch. 92, § 92.109 — Security Deposits, Return of Deposit',
        url: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.109',
        verbatimQuote:
          'the landlord shall refund a security deposit to the tenant on or before the 30th day after the date the tenant surrenders the premises, and shall provide a written description and itemized list of all deductions on or before the 30th day after the date the tenant surrenders the premises',
        verified: true,
        domain: '.gov',
      },
      {
        id: 2,
        source: 'Texas Property Code § 92.109(c)-(d)',
        title: 'Tex. Prop. Code ch. 92, § 92.109 — Liability for withholding in bad faith',
        url: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.109',
        verbatimQuote:
          'a landlord who in bad faith fails to return a security deposit or who in bad faith fails to provide a written description and itemized list of all deductions is liable for an amount equal to three times the portion of the deposit wrongfully withheld, plus $100, and the tenant’s attorney fees in a suit to recover the deposit',
        verified: true,
        domain: '.gov',
      },
      {
        id: 3,
        source: 'Texas Property Code § 92.104',
        title: 'Tex. Prop. Code ch. 92, § 92.104 — Itemized list requirement',
        url: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.104',
        verbatimQuote:
          'before the end of the 30-day period ... the landlord shall give the tenant a written description and itemized list of all deductions from the security deposit and any balance remaining shall be mailed to the tenant to the tenant’s last known address',
        verified: true,
        domain: '.gov',
      },
      {
        id: 4,
        source: 'Texas Attorney General — Tenants’ Security Deposit Rights',
        title: 'Office of the Attorney General of Texas — Tenants’ Rights Handbook',
        url: 'https://www.texasattorneygeneral.gov/consumer-protection/landlord-tenant',
        verbatimQuote:
          'A landlord who fails to return a deposit or provide an itemized list of deductions within 30 days of move-out is presumed to have acted in bad faith and may be liable for three times the amount wrongfully withheld plus $100 and reasonable attorney’s fees',
        verified: true,
        domain: '.gov',
      },
    ],
    redTeam: [
      {
        id: 1,
        objection:
          'The draft demands treble damages but never pleads the statutory 30-day clock from MOVE-OUT (30 Sep) to today (27 Oct = day 28). On day 30 the landlord could technically still comply. The demand must anchor to the exact surrender date and cite day-30 — otherwise the presumption of bad faith is not yet locked.',
        vulnerability: 'Deadline mis-anchored — bad-faith presumption not yet triggered',
        patch:
          'Inserted recital: “Surrender occurred 30 September 2026. The 30th day falls 30 October 2026. As of the date of this letter, no itemized list has issued. Demand is made now so that the bad-faith presumption under § 92.109(c) attaches the moment the statutory window closes.”',
        model: 'Nemotron-3-Ultra-550B',
      },
      {
        id: 2,
        objection:
          'The letter accepts the landlord’s $1,200 “carpet replacement” line as an item to rebut rather than a legal nullity. No move-in baseline inspection exists — without a move-in condition report, the landlord cannot distinguish damage from ordinary wear; the whole deduction is void regardless of the photos.',
        vulnerability: 'Rebutting line-items instead of vacating them',
        patch:
          'Rewrote paragraph 3: the letter now vacates the entire deduction set — “Because no move-in condition report was executed at lease commencement, the landlord bears the risk that all claimed conditions constitute ordinary wear and tear; the $1,200 charge is a nullity, not a contestable line item.”',
        model: 'Nemotron-3-Ultra-550B',
      },
      {
        id: 3,
        objection:
          'No venue and no service strategy. A Texas demand letter that doesn’t telegraph Justice Court (Precinct matching the property) and mention pre-suit service mechanics is treated as a form letter and ignored past the deadline.',
        vulnerability: 'No escalation venue — demand ignored after day 30',
        patch:
          'Appended venue clause: absent full refund by 26 November 2026, a petition will be filed in the Justice Court of the Precinct in which the premises lies, seeking the $7,300 treble-plus-$100 figure, attorney fees, and costs — citing § 92.109(d) and Tex. R. Civ. P. 500 series.',
        model: 'Nemotron-3-Ultra-550B',
      },
    ],
    letter: {
      salutation: 'Oakwood Residential LLC — Leasing Department & Registered Agent',
      paragraphs: [
        'Dear Sir or Madam,',
        'Re: Security Deposit Disposition — Lease [LEASE_1] · Unit 311, 4802 Burnet Rd, Austin, TX 78756 · Tenant [PERSON_1]',
        'I refer to the move-out of 30 September 2026 and to your deposit disposition of 26 October 2026 withholding my entire $2,400 security deposit. I demand the immediate return of the deposit in full, together with the statutory penalties applicable to your non-compliance with Texas Property Code § 92.109.',
        '1. The statutory 30-day window. Property Code § 92.109(a) is unambiguous: “the landlord shall refund a security deposit to the tenant on or before the 30th day after the date the tenant surrenders the premises, and shall provide a written description and itemized list of all deductions.” [1] Surrender occurred on 30 September 2026. The 30th day is 30 October 2026. As of today, no compliant written description or itemized list has been delivered.',
        '2. No itemized list → statutory presumption of bad faith. Section 92.109(c) provides that “a landlord who in bad faith fails to return a security deposit or who in bad faith fails to provide a written description and itemized list of all deductions is liable for an amount equal to three times the portion of the deposit wrongfully withheld, plus $100, and the tenant’s attorney fees in a suit to recover the deposit.” [2] The Attorney General’s tenant guidance confirms the same presumption attaches on failure to deliver an itemized statement within 30 days. [4]',
        '3. Every claimed deduction is a legal nullity. You assert “carpet replacement $1,200,” “cleaning $900,” and “general wear $300,” supported by a single photograph dated 3 October 2026 — after surrender. Section 92.104 requires a written description and itemized list of all deductions within 30 days; it contemplates deductions documented against a condition baseline. [3] No move-in condition report was ever executed. Absent a baseline, the landlord cannot carry the position that carpet condition two years into the tenancy was anything other than ordinary wear and tear, and the $1,200 and $300 figures fail as a matter of law. The $900 “cleaning” charge is unsupported by any invoice, receipt, or vendor statement, and is likewise unitemized and unproven.',
        '4. Demand. I demand payment of $2,400 by 26 November 2026. Should payment in full not issue by that date, I will file a petition in the Justice Court of the appropriate Precinct in Travis County seeking $7,300 (treble the $2,400 wrongfully withheld = $7,200, plus the $100 statutory add-on) together with reasonable attorney’s fees and costs, as § 92.109(d) authorizes. [2] I expressly reserve all rights and remedies, including under § 92.104 and under the DTPA as applicable.',
        'This letter constitutes pre-suit notice. All communications may be directed to the address and email below. I have retained the lease, move-out emails, the disposition, and photographs of the premises as of surrender.',
      ],
      signoff: 'Sincerely,\n\n[PERSON_1]\nFormer tenant — [ADDR_1]\nLease [LEASE_1] · [PHONE_1] · [EMAIL_1]\nDate: 27 October 2026',
    },
    summaries: {
      en: 'Texas law (Prop. Code § 92.109) gave your landlord 30 days from your 30 Sep move-out to return $2,400 with a written itemized list. Day 28: nothing. No move-in condition report exists, so their “damage” charges are legally void. Demand letter attached — pay by 26 Nov or face treble damages ($7,300) + $100 + attorney fees in Justice Court.',
      hi: 'Texas कानून (§ 92.109) ने आपके 30 सितम्बर के move-out से 30 दिन में $2,400 + लिखित आइटमइज़्ड सूची वापस करने को कहा था। 28वाँ दिन: कुछ नहीं। कोई move-in रिपोर्ट नहीं, इसलिए “क्षति” का दावा कानूनी रूप से शून्य है। यह पत्र 26 Nov तक भुगतान माँगता है — वरना Justice Court में treble नुकसान ($7,300) + $100 + वकील की फीस।',
      hiNative: 'टेक्सास कानून (§ 92.109) ने आपके 30 सितम्बर के मूव-आउट से 30 दिन के भीतर $2,400 और लिखित आइटमइज़्ड सूची वापस करने को कहा था। 28वाँ दिन: कुछ नहीं। कोई मूव-इन रिपोर्ट नहीं, इसलिए “क्षति” का दावा कानूनी रूप से शून्य है। यह पत्र 26 नवम्बर तक भुगतान की माँग करता है — वरना जस्टिस कोर्ट में treble नुकसान ($7,300) + $100 + वकील की फीस।',
      de: 'Das Gesetz von Texas (Prop. Code § 92.109) gab Ihrem Vermieter 30 Tage ab Ihrem Auszug am 30. September Zeit, Ihre Kaution in Höhe von $2.400 samt detaillierter Aufstellung zurückzuerstatten. Am 28. Tag: nichts. Da kein Übergabeprotokoll existiert, sind angebliche Schadensersatzansprüche rechtlich nichtig. Mahnschreiben anbei – Zahlung bis 26. November oder Klage vor dem Justice Court auf dreifachen Schadensersatz ($7.300) zzgl. $100 und Anwaltskosten.',
      es: 'La ley de Texas (§ 92.109) dio a su arrendador 30 días desde su mudanza (30 sep) para devolver $2,400 con una lista detallada por escrito. Día 28: nada. No existe informe de estado inicial, así que los cargos por “daños” son legalmente nulos. Esta carta exige pago antes del 26 de noviembre — o enfrentarán daños triplicados ($7,300) + $100 + honorarios de abogado en la Justice Court.',
      fr: 'La loi du Texas (§ 92.109) donnait à votre bailleur 30 jours à compter du départ (30 sept.) pour restituer 2 400 $ avec un état détaillé écrit. Jour 28 : rien. Aucun état des lieux d’entrée n’existe, vos « dommages » sont donc juridiquement nuls. Cette lettre exige le paiement avant le 26 novembre — sinon vous saisissez la Justice Court pour dommages triplés (7 300 $) + 100 $ + honoraires d’avocat.',
      it: 'La legge del Texas (§ 92.109) concedeva 30 giorni dal rilascio del 30 settembre per restituire 2.400 $ con elenco scritto. Giorno 28: nulla. Senza verbale iniziale, i presunti danni sono nulli. Richiedi pagamento entro il 26 nov o procedi in tribunale per danni triplicati (7.300 $) + 100 $ e spese legali.',
      pt: 'A lei do Texas (§ 92.109) previa 30 dias após a saída a 30 de setembro para devolver $2.400 com discriminação escrita. Dia 28: nada. Sem vistoria inicial, os «danos» alegados são nulos. Pague até 26 de nov. ou enfrente indemnização tripla ($7.300) + $100 + honorários na Justice Court.',
      ar: 'يمنح قانون تكساس (§ 92.109) المالك مهلة 30 يوماً من تسليم العقار في 30 سبتمبر لإعادة 2,400 دولار مع كشف كتابي. مر 28 يوماً دون رد. لعدم وجود فحص أولي، فإن ادعاءات الأضرار باطلة قانوناً. يطالب الخطاب بالسداد بحلول 26 نوفمبر وإلا مقاضاتهم لطلب 7,300 دولار.',
      ja: 'テキサス州法（§ 92.109）は9月30日の退去から30日以内に明細書付きで2,400ドルの敷金を返還することを家主に義務付けています。28日経過で返答なし。入居時確認書がないため損害請求は無効です。11月26日までの返還を請求し、不履行時は裁判所にて3倍賠償金（7,300ドル）を請求します。',
      zh: '德州法律（§ 92.109）要求房东自9月30日退租起30天内返还$2,400并附明细。第28天依然无音讯。因无入住初检记录，损坏指控法律上无效。催告函要求11月26日前付款 — 否则将在法院索赔三倍赔偿（$7,300）+ $100 + 律师费。',
    },
    hindiNative: true,
    icsTitle: 'TX Deposit Demand — Justice Court Filing Trigger',
    icsAlarm: 3,
    ownerPatch: {
      file: 'apps/property-portal/src/modules/SecurityDeposit/DepositDisposition.tsx',
      failureClass: 'Statutory Deadline Miss — No 30-day itemization, presumed bad faith',
      severity: 'SEV-2',
      signals: [
        { label: 'Disposition sent day ≥ 28 with no itemized PDF attachment', weight: 0.38 },
        { label: 'No move-in condition report on lease record', weight: 0.27 },
        { label: 'Deduction lines with zero receipt artifacts', weight: 0.22 },
        { label: 'Prior SEV-3 for same reason code in 18 months', weight: 0.13 },
      ],
      rootCause:
        'The disposition flow allows “withhold in full” with three free-text deduction fields and never enforces the Prop. Code § 92.104 written itemization artifact nor the § 92.109(a) 30-day SLA. Lease-end automations compute the 30-day deadline from disposition-creation time rather than surrender time — meaning the clock starts late internally while courts compute it from actual surrender. Result: a systematically presumable bad-faith posture and $8–14M annual treble-exposure across the portfolio.',
      counterfactual:
        'Had the disposition enforced itemization + surrender-anchored SLA, this unit auto-generates a $2,400 refund with attached condition report on day 27 — no demand letter, no NEB, no Justice Court. Estimated wrongful full-withholding rate for SEV-2 pattern: 82.4%.',
      patchSummary:
        '(1) Anchor the 30-day SLA to surrender date, not disposition date. (2) Hard-block “withhold” dispositions that lack ≥1 itemization line per deduction + ≥1 evidence artifact when carpet/cleaning >$250. (3) Auto-generate § 92.104 itemized statement PDF at day-25 preview. Ships with migration for 14k historical dispositions.',
      anonymizedReports: 18930,
      predictedLift: '−82% bad-faith presumption events · est. $11.2M/yr avoided treble damages',
      diff: [
        { type: 'hunk', text: '@@ -64,17 +64,33 @@ const DispositionSchema = buildDispositionForm();' },
        { type: 'ctx', text: '  const lease = useLease(leaseId);' },
        { type: 'del', text: '  const deadline = addDays(disposition.createdAt, 30);' },
        { type: 'add', text: '  // § 92.109(a) — the 30-day clock anchors to SURRENDER, not disposition' },
        { type: 'add', text: '  const deadline = addDays(lease.surrenderedAt, 30);' },
        { type: 'ctx', text: '  ' },
        { type: 'del', text: '  const withhold = deductions.sum() === lease.deposit;' },
        { type: 'del', text: '  return renderWithhold(withhold);' },
        { type: 'add', text: '  for (const line of deductions) {' },
        { type: 'add', text: '    if (line.label === "carpet" && line.amount > 250 && !lease.moveInConditionReport) {' },
        { type: 'add', text: '      block(line, "NO_BASELINE_REPORT — ordinary wear bar, § 92.104");' },
        { type: 'add', text: '    }' },
        { type: 'add', text: '    if (!line.evidence.length) {' },
        { type: 'add', text: '      block(line, "EVIDENCE_REQUIRED — receipt or vendor statement");' },
        { type: 'add', text: '    }' },
        { type: 'add', text: '  }' },
        { type: 'add', text: '  if (daysSince(lease.surrenderedAt) >= 25) generateItemizedPdf(lease);' },
      ],
    },
  },
];

export const getScenario = (id: string) => SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
