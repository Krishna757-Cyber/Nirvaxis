import type { Language } from "@/types/resolve";

export interface TranslationStrings {
  // Brand & Hero
  brandTagline: string;
  heroTag1: string;
  heroTag2: string;
  heroHeadline1: string;
  heroHeadline2: string;
  heroDesc: string;
  heroCtaCommand: string;
  heroCtaLoop: string;
  heroTrust1: string;
  heroTrust2: string;
  heroTrust3: string;

  // Header Nav & Badges
  navCommandCenter: string;
  navGlobalMap: string;
  navQualityGates: string;
  navModelSpecs: string;
  citizenAppeal: string;
  ownerDiagnostic: string;
  launchWorkbench: string;

  // Stage Tabs
  stage1Tab: string;
  stage2Tab: string;
  stage3Tab: string;
  stageAllTab: string;

  // Stage 1 Command Center
  stage1Eyebrow: string;
  stage1Title: string;
  stage1Subtitle: string;
  inputShieldTitle: string;
  inputShieldBadge: string;
  loadCaseFile: string;
  dropNotice: string;
  parsedLocally: string;
  browseBtn: string;
  viewRawCase: string;
  hideRawCase: string;
  ventBoxTitle: string;
  ventBoxNote: string;
  whatAiSaw: string;
  showMasked: string;
  rehydrateLocally: string;
  maskedInMs: string;
  tokensFound: string;
  btnResolveDispute: string;
  btnOrchestrating: string;
  btnRunComplete: string;

  // Action Graph
  actionGraphTitle: string;
  stagesSealed: string;
  nodeClassify: string;
  nodeMask: string;
  nodeSources: string;
  nodeVerify: string;
  nodeDraft: string;
  nodeRedTeam: string;
  nodeAssemble: string;
  traceHeader: string;
  traceAwaiting: string;

  // Output Kit
  outputKitTitle: string;
  paperTitle: string;
  paperSubtitle: string;
  summaryTitle: string;
  sourcesVerified: string;
  downloadTxt: string;
  icsEvent: string;
  copyBtn: string;
  copiedBtn: string;
  citizenMode: string;
  ownerMode: string;

  // Stage 2 Global Map & Cockpit
  stage2Eyebrow: string;
  stage2Tagline: string;
  stage2Title: string;
  stage2Subtitle: string;
  kpiActive: string;
  kpiProof: string;
  kpiExposure: string;
  kpiDeadline: string;
  filterScenarios: string;
  filterRegions: string;
  filterModel: string;
  filterLanguage: string;
  dockInspector: string;
  dockCitizenSummary: string;
  dockEvidenceBasis: string;
  dockRedTeam: string;
  btnOpenWorkbench: string;

  // Stage 3 Determinism
  stage3Eyebrow: string;
  stage3Title: string;
  gate1Title: string;
  gate1Desc: string;
  gate2Title: string;
  gate2Desc: string;
  gate3Title: string;
  gate3Desc: string;
  routingTableTitle: string;

  // Stage 4 Why Bilateral
  stage4Eyebrow: string;
  stage4Title: string;
  stage4Desc: string;
  citizenModeTitle: string;
  ownerModeTitle: string;
  flipToCitizen: string;
  flipToOwner: string;

  // Footer & Disclaimer
  footerDisclaimer: string;
  footerRights: string;
}

const EN_STRINGS: TranslationStrings = {
  brandTagline: "Bilateral Evidence Engine",
  heroTag1: "NEBIUS × NVIDIA GLOBAL AI HACKATHON 2026",
  heroTag2: "WORLD-FIRST BILATERAL ENGINE",
  heroHeadline1: "The machine said no.",
  heroHeadline2: "The machine must say why.",
  heroDesc:
    "NIRVAXIS is the first bilateral AI engine for administrative friction — it arms the citizen with a code-verified, red-teamed appeal kit, and hands the institution a zero-PII root-cause packet with a ready-to-merge patch. One dispute. Two deliverables. Deterministic truth on both sides.",
  heroCtaCommand: "ENTER THE COMMAND CENTER →",
  heroCtaLoop: "HOW THE LOOP WORKS",
  heroTrust1: "3/3 QUOTES VERBATIM · 0 LLM TRUST",
  heroTrust2: "0 PII BYTES TRANSMITTED",
  heroTrust3: "$0.021 PER FULL RESOLUTION",

  navCommandCenter: "01 · Command Center",
  navGlobalMap: "02 · Global HQ Map",
  navQualityGates: "03 · Quality Gates",
  navModelSpecs: "04 · Model Specs",
  citizenAppeal: "CITIZEN APPEAL",
  ownerDiagnostic: "OWNER DIAGNOSTIC",
  launchWorkbench: "LAUNCH WORKBENCH",

  stage1Tab: "01 · BILATERAL COMMAND CENTER",
  stage2Tab: "02 · GLOBAL HQ MAP & COCKPIT",
  stage3Tab: "03 · 3 GATES & MODEL SPECS",
  stageAllTab: "SHOW ALL EXPANDED",

  stage1Eyebrow: "STAGE 01 · BILATERAL WORKBENCH",
  stage1Title: "One case file. Two verdicts.",
  stage1Subtitle: "PICK SCENARIO · HIT RESOLVE · FLIP CITIZEN ⇄ OWNER SWITCH",
  inputShieldTitle: "Input · Privacy Shield",
  inputShieldBadge: "ON-DEVICE · ZERO PII LEAVES",
  loadCaseFile: "01 · Load a case file",
  dropNotice: "Drop the rejection letter / PDF / HTML",
  parsedLocally: "Parsed locally · never uploaded raw",
  browseBtn: "BROWSE",
  viewRawCase: "View raw case text",
  hideRawCase: "Hide raw case text",
  ventBoxTitle: "Vent box — say it raw, we'll translate the rage into law",
  ventBoxNote: "Distilled into objective facts before drafting · emotional register never reaches the officer",
  whatAiSaw: "What the AI actually saw",
  showMasked: "SHOW MASKED",
  rehydrateLocally: "RE-HYDRATE LOCALLY",
  maskedInMs: "Masked in",
  tokensFound: "tokens · 6 classes",
  btnResolveDispute: "Resolve This Dispute",
  btnOrchestrating: "Orchestrating",
  btnRunComplete: "Run Complete — Re-resolve",

  actionGraphTitle: "Action Graph · Red-Team Arena",
  stagesSealed: "7/7 STAGES SEALED",
  nodeClassify: "Classify document",
  nodeMask: "Mask PII on-device",
  nodeSources: "Retrieve official sources",
  nodeVerify: "Verify quotes verbatim",
  nodeDraft: "Draft legal position",
  nodeRedTeam: "Red-team the draft",
  nodeAssemble: "Assemble & re-hydrate",
  traceHeader: "orchestrator · nemotron routing trace",
  traceAwaiting: "awaiting case file… press RESOLVE THIS DISPUTE",

  outputKitTitle: "Dual Output · Citizen Appeal Kit",
  paperTitle: "Formal Appeal — Code-Verified",
  paperSubtitle: "Re-hydrated locally on this device · Zero PII leaves your browser",
  summaryTitle: "Plain-Language Summary",
  sourcesVerified: "Official Sources — 100% Verbatim Substring Verified",
  downloadTxt: "Letter (.TXT)",
  icsEvent: "Calendar Alert (.ICS)",
  copyBtn: "Copy Letter",
  copiedBtn: "Copied!",
  citizenMode: "CITIZEN",
  ownerMode: "OWNER",

  stage2Eyebrow: "STAGE 02 / GLOBAL OPERATIONS COCKPIT",
  stage2Tagline: "An official “no” is where we begin.",
  stage2Title: "GLOBAL RESOLUTION MAP — AI ENGINE LIVE",
  stage2Subtitle: "INTELLIGENCE THAT TURNS FRICTION INTO FORWARD MOTION",
  kpiActive: "ACTIVE SCENARIOS",
  kpiProof: "PROOF VERIFIED",
  kpiExposure: "ESTIMATED EXPOSURE",
  kpiDeadline: "DEADLINE RISK",
  filterScenarios: "FILTER SCENARIOS",
  filterRegions: "FILTER REGIONS",
  filterModel: "MODEL ROUTER PREFERENCE",
  filterLanguage: "OUTPUT LANGUAGE",
  dockInspector: "RADAR DISPUTE INSPECTOR",
  dockCitizenSummary: "CITIZEN SUMMARY",
  dockEvidenceBasis: "EVIDENTIARY BASIS",
  dockRedTeam: "OFFICER RED-TEAM LOOP",
  btnOpenWorkbench: "LAUNCH CASE WORKBENCH",

  stage3Eyebrow: "§ Determinism Over Décor",
  stage3Title: "Three quality gates. Zero vibes.",
  gate1Title: "01 · The PII Shield",
  gate1Desc: "A deterministic regex + seeded-literal redactor runs first, on your device. Aadhaar, PAN, UAN, PNR, emails, phones, addresses — tokenized before any network call. Re-hydration happens locally, after the models return. Your PII is never a tensor.",
  gate2Title: "02 · Verbatim Quote Check",
  gate2Desc: "Every legal citation the draft leans on is string-matched against Tavily-retrieved official text. Normalized substring, character class, ratio score — no model grades its homework. A citation that fails the gate never reaches your letter.",
  gate3Title: "03 · The Red-Team Loop",
  gate3Desc: "N3-Ultra is re-instantiated as a hostile reviewing officer. It files three objections — anchor failure, burden misallocation, register mismatch — and the drafter must patch each one. What survives is filing-ready, not model-fluent.",
  routingTableTitle: "Nebius Token Factory — Multi-Tier Routing",

  stage4Eyebrow: "§ Why Bilateral",
  stage4Title: "Every rejection is a bug report nobody filed.",
  stage4Desc: "Today, a wrongfully rejected citizen waits in a grievance queue for months — while the institution that wronged them never learns the wording of its own form. NIRVAXIS closes the loop in both directions with one sealed run.",
  citizenModeTitle: "Citizen Mode: The Appeal Kit",
  ownerModeTitle: "System Owner Mode: The Diagnostic Packet",
  flipToCitizen: "Flip the switch to Citizen Mode →",
  flipToOwner: "Flip the switch to System Owner Mode →",

  footerDisclaimer: "NIRVAXIS drafts filing-ready artifacts; it is not legal advice and does not create an attorney–client relationship. Every artifact is sealed by a red-team loop and should be confirmed before submission. Case data shown is illustrative.",
  footerRights: "© 2026 NIRVAXIS · Built for the Nebius × NVIDIA Global AI Hackathon",
};

const HI_STRINGS: Partial<TranslationStrings> = {
  brandTagline: "द्विपक्षीय विधिक साक्ष्य इंजन",
  heroTag1: "नेबियस × एनवीडिया ग्लोबल AI हैकाथॉन 2026",
  heroTag2: "विश्व का प्रथम द्विपक्षीय समाधान इंजन",
  heroHeadline1: "सिस्टम ने 'ना' कहा।",
  heroHeadline2: "अब सिस्टम को 'क्यों' बताना होगा।",
  heroDesc:
    "NIRVAXIS प्रशासनिक विसंगतियों के समाधान हेतु पहला द्विपक्षीय AI इंजन है — यह नागरिक को कोड-सत्यापित, रेड-टीम्ड अपील किट प्रदान करता है, और संस्था को बिना किसी PII के रूट-कॉज़ पैकेट सौंपता है। एक विवाद। दो समाधान। दोनों पक्षों के लिए अकाट्य सत्य।",
  heroCtaCommand: "कमांड सेंटर में प्रवेश करें →",
  heroCtaLoop: "यह इंजन कैसे काम करता है",
  heroTrust1: "3/3 आधिकारिक उद्धरण शब्दशः सत्यापित",
  heroTrust2: "0 PII डेटा बाहर भेजा गया",
  heroTrust3: "$0.021 प्रति पूर्ण समाधान",

  navCommandCenter: "01 · कमांड सेंटर",
  navGlobalMap: "02 · ग्लोबल मैप",
  navQualityGates: "03 · सुरक्षा गेट्स",
  navModelSpecs: "04 · मॉडल विनिर्देश",
  citizenAppeal: "नागरिक अपील",
  ownerDiagnostic: "सिस्टम डायग्नोस्टिक",
  launchWorkbench: "वर्कबेंच खोलें",

  stage1Tab: "01 · द्विपक्षीय कमांड सेंटर",
  stage2Tab: "02 · ग्लोबल मुख्यालय मैप एवं कॉकपिट",
  stage3Tab: "03 · 3 सुरक्षा गेट्स एवं मॉडल विनिर्देश",
  stageAllTab: "सभी अनुभाग देखें",

  stage1Eyebrow: "चरण 01 · द्विपक्षीय कार्यक्षेत्र",
  stage1Title: "एक केस फ़ाइल। दो परिणाम।",
  stage1Subtitle: "केस चुनें · RESOLVE दबाएँ · CITIZEN ⇄ OWNER स्विच बदलें",
  inputShieldTitle: "इनपुट · डेटा गोपनीयता शील्ड",
  inputShieldBadge: "डिवाइस पर सुरक्षित · शून्य PII रिसाव",
  loadCaseFile: "01 · केस फ़ाइल चुनें",
  dropNotice: "अस्वीकृति पत्र / PDF / HTML यहाँ डालें",
  parsedLocally: "लोकल डिवाइस पर पार्स · कभी बाहर नहीं भेजा जाता",
  browseBtn: "फ़ाइल चुनें",
  viewRawCase: "मूल केस टेक्स्ट देखें",
  hideRawCase: "मूल केस टेक्स्ट छुपाएँ",
  ventBoxTitle: "शिकायत बॉक्स — अपनी बात स्पष्ट कहें, हम उसे कानूनी भाषा में बदल देंगे",
  ventBoxNote: "अपील से पूर्व निष्पक्ष तथ्यों में रूपांतरित · व्यक्तिगत भावना अधिकारी तक नहीं जाती",
  whatAiSaw: "AI मॉडल ने वास्तव में क्या देखा (मास्क्ड डेटा)",
  showMasked: "मास्क्ड डेटा देखें",
  rehydrateLocally: "लोकल डिवाइस पर नाम भरें",
  maskedInMs: "मास्किंग समय",
  tokensFound: "सुरक्षित टोकन · 6 श्रेणियां",
  btnResolveDispute: "विवाद का समाधान निकालें",
  btnOrchestrating: "समाधान प्रगति पर है",
  btnRunComplete: "प्रक्रिया संपन्न — पुनः चलाएं",

  actionGraphTitle: "एक्शन ग्राफ़ · रेड-टीम अखाड़ा",
  stagesSealed: "7/7 चरण पूर्ण रूप से सत्यापित",
  nodeClassify: "दस्तावेज़ वर्गीकरण",
  nodeMask: "ऑन-डिवाइस PII मास्किंग",
  nodeSources: "आधिकारिक स्रोत प्राप्ति",
  nodeVerify: "शब्दशः उद्धरण सत्यापन",
  nodeDraft: "विधिक अपील प्रारूपण",
  nodeRedTeam: "कठोर रेड-टीम समीक्षा",
  nodeAssemble: "संयोजन एवं स्थानीय सत्यापन",
  traceHeader: "ऑर्केस्ट्रेटर · नेमोट्रॉन रूटिंग ट्रेस",
  traceAwaiting: "केस फ़ाइल की प्रतीक्षा… 'विवाद का समाधान निकालें' दबाएँ",

  outputKitTitle: "द्विपक्षीय आउटपुट · नागरिक अपील किट",
  paperTitle: "औपचारिक अपील — कोड-सत्यापित",
  paperSubtitle: "डिवाइस पर री-हाइड्रेटेड · व्यक्तिगत डेटा सुरक्षित",
  summaryTitle: "सरल भाषा में सारांश",
  sourcesVerified: "साक्ष्य स्रोत — आधिकारिक दस्तावेज़ों से शब्दशः सत्यापित",
  downloadTxt: "पत्र (.TXT)",
  icsEvent: "कैलेंडर अलर्ट (.ICS)",
  copyBtn: "कॉपी करें",
  copiedBtn: "कॉपी हो गया",
  citizenMode: "नागरिक",
  ownerMode: "सिस्टम ओनर",

  stage2Eyebrow: "चरण 02 / वैश्विक परिचालन कॉकपिट",
  stage2Tagline: "एक आधिकारिक 'ना' ही हमारी शुरुआत है।",
  stage2Title: "ग्लोबल समाधान मैप — लाइव AI इंजन",
  stage2Subtitle: "प्रशासनिक घर्षण को समाधान में बदलने वाली कृत्रिम बुद्धिमत्ता",
  kpiActive: "सक्रिय केस फ़ाइलें",
  kpiProof: "सत्यापित साक्ष्य स्कोर",
  kpiExposure: "अनुमानित वित्तीय जोखिम",
  kpiDeadline: "समय-सीमा जोखिम",
  filterScenarios: "केस प्रकार चुनें",
  filterRegions: "क्षेत्र फ़िल्टर करें",
  filterModel: "मॉडल चयन प्राथमिकता",
  filterLanguage: "आउटपुट भाषा",
  dockInspector: "रडार विवाद विश्लेषक",
  dockCitizenSummary: "नागरिक सारांश",
  dockEvidenceBasis: "विधिक साक्ष्य आधार",
  dockRedTeam: "अधिकारी रेड-टीम लूप",
  btnOpenWorkbench: "केस वर्कबेंच प्रारंभ करें",

  stage3Eyebrow: "§ ठोस प्रमाण, शून्य दिखावा",
  stage3Title: "तीन सुरक्षा द्वार। सौ प्रतिशत प्रमाण।",
  gate1Title: "01 · PII सुरक्षा कवच",
  gate1Desc: "आपके डिवाइस पर पहले रेगुलर एक्सप्रेशन आधारित रेडैक्टर चलता है। आधार, पैन, यूएएन, बैंक खाता, फोन नंबर सब नेटवर्क कॉल से पहले टोकनाइज हो जाते हैं। री-हाइड्रेशन आपके ब्राउज़र में ही होता है।",
  gate2Title: "02 · शब्दशः उद्धरण सत्यापन",
  gate2Desc: "अपील में इस्तेमाल किया गया हर कानूनी उद्धरण Tavily द्वारा आधिकारिक सरकारी गैजेट से 100% शब्दशः मिलाया जाता है। कोई भी मॉडल कानूनी कल्पना नहीं कर सकता।",
  gate3Title: "03 · रेड-टीम अधिकारी लूप",
  gate3Desc: "N3-Ultra को एक सख्त न्यायिक अधिकारी के रूप में पुनर्गठित किया जाता है। यह ड्राफ्ट पर 3 आपत्तियां दर्ज करता है और ड्राफ्टर को हर एक को पैच करना पड़ता है। जो बचता है वह पूरी तरह सील होता है।",
  routingTableTitle: "नेबियस टोकन फ़ैक्टरी — मल्टी-टियर मॉडल रूटिंग",

  stage4Eyebrow: "§ द्विपक्षीय समाधान क्यों जरूरी है",
  stage4Title: "हर अस्वीकृति एक अनसुलझा बग है जिसे किसी ने दर्ज नहीं किया।",
  stage4Desc: "आज गलत तरीके से खारिज किया गया नागरिक महीनों तक शिकायत कतार में इंतजार करता है — जबकि संस्था कभी नहीं सीखती कि उसका अपना पोर्टल क्या गलती कर रहा है। NIRVAXIS एक ही रन में दोनों को ठीक करता है।",
  citizenModeTitle: "नागरिक मोड: अपील किट",
  ownerModeTitle: "सिस्टम ओनर मोड: डायग्नोस्टिक पैकेट",
  flipToCitizen: "नागरिक मोड पर स्विच करें →",
  flipToOwner: "सिस्टम ओनर मोड पर स्विच करें →",

  footerDisclaimer: "NIRVAXIS आधिकारिक प्रारूप तैयार करता है; यह कानूनी सलाह नहीं है। प्रत्येक दस्तावेज़ को जमा करने से पहले समीक्षा की जानी चाहिए।",
  footerRights: "© 2026 NIRVAXIS · नेबियस × एनवीडिया ग्लोबल AI हैकाथॉन हेतु निर्मित",
};

const DE_STRINGS: Partial<TranslationStrings> = {
  heroTag1: "NEBIUS × NVIDIA GLOBAL AI HACKATHON 2026",
  heroTag2: "WELTWEIT ERSTE BILATERALE ENGINE",
  heroHeadline1: "Die Maschine sagte Nein.",
  heroHeadline2: "Die Maschine muss begründen, warum.",
  heroDesc:
    "NIRVAXIS ist die erste bilaterale KI-Engine für administrative Konflikte — sie rüstet Bürger mit einem verifizierten Widerspruchskit aus und liefert Institutionen ein PII-freies Fehleranalyse-Paket.",
  heroCtaCommand: "ZUM COMMAND CENTER →",
  heroCtaLoop: "FUNKTIONSWEISE DER ENGINE",
  heroTrust1: "3/3 ZITATE WÖRTLICH VERIFIZIERT",
  heroTrust2: "0 PII-DATEN ÜBERTRAGEN",
  heroTrust3: "$0.021 PRO VOLLSTÄNDIGE ANALYSE",
  navCommandCenter: "01 · Command Center",
  navGlobalMap: "02 · Globale Karte",
  navQualityGates: "03 · Sicherheits-Gates",
  navModelSpecs: "04 · Modellspezifikationen",
  citizenAppeal: "BÜRGER-APPEAL",
  ownerDiagnostic: "SYSTEM-DIAGNOSE",
  launchWorkbench: "WORKBENCH STARTEN",
  stage1Tab: "01 · BILATERALES COMMAND CENTER",
  stage2Tab: "02 · GLOBALE ÜBERSICHTSKARTE",
  stage3Tab: "03 · 3 QUALITÄTS-GATES",
  stageAllTab: "ALLE BEREICHE ANZEIGEN",
  stage1Eyebrow: "STUFE 01 · BILATERALE WORKBENCH",
  stage1Title: "Ein Fall. Zwei bindende Ergebnisse.",
  stage1Subtitle: "FALL WÄHLEN · RESOLVE DRÜCKEN · BÜRGER ⇄ BETREIBER WECHSELN",
  inputShieldTitle: "Eingabe · Datenschutz-Schild",
  inputShieldBadge: "LOKAL AUF DEM GERÄT · KEINE PII-WEITERGABE",
  loadCaseFile: "01 · Falldaten laden",
  dropNotice: "Ablehnungsbescheid / PDF / HTML hier ablegen",
  parsedLocally: "Lokal verarbeitet · Niemals im Klartext hochgeladen",
  browseBtn: "DURCHSUCHEN",
  viewRawCase: "Rohdaten anzeigen",
  hideRawCase: "Rohdaten ausblenden",
  ventBoxTitle: "Beschwerdebox — Drücken Sie es direkt aus, wir übersetzen es in Recht",
  whatAiSaw: "Was das KI-Modell gesehen hat (maskiert)",
  showMasked: "MASKIERT ANZEIGEN",
  rehydrateLocally: "LOKAL WIEDERHERSTELLEN",
  btnResolveDispute: "Diesen Streitfall lösen",
  btnOrchestrating: "Wird orchestriert",
  btnRunComplete: "Abgeschlossen — Erneut lösen",
  actionGraphTitle: "Aktionsgraph · Red-Team-Prüfung",
  outputKitTitle: "Doppelte Ausgabe · Bürger-Widerspruchskit",
  summaryTitle: "Verständliche Zusammenfassung",
  sourcesVerified: "Offizielle Quellen — 100% wörtlich verifiziert",
  downloadTxt: "Brief (.TXT)",
  icsEvent: "Kalenderfrist (.ICS)",
  copyBtn: "Kopieren",
  copiedBtn: "Kopiert!",
  citizenMode: "BÜRGER",
  ownerMode: "BETREIBER",
};

const ES_STRINGS: Partial<TranslationStrings> = {
  heroTag1: "NEBIUS × NVIDIA GLOBAL AI HACKATHON 2026",
  heroTag2: "PRIMER MOTOR BILATERAL DEL MUNDO",
  heroHeadline1: "La máquina dijo que no.",
  heroHeadline2: "La máquina debe explicar por qué.",
  heroDesc:
    "NIRVAXIS es el primer motor bilateral de IA para fricciones administrativas: brinda al ciudadano un kit de apelación verificado y a la institución un informe de causa raíz sin PII.",
  heroCtaCommand: "ENTRAR AL CENTRO DE MANDO →",
  heroCtaLoop: "CÓMO FUNCIONA EL MOTOR",
  heroTrust1: "3/3 CITAS VERIFICADAS TEXTUALMENTE",
  heroTrust2: "0 DATOS PII TRANSMITIDOS",
  heroTrust3: "$0.021 POR RESOLUCIÓN COMPLETA",
  navCommandCenter: "01 · Centro de Mando",
  navGlobalMap: "02 · Mapa Global",
  navQualityGates: "03 · Puertas de Calidad",
  navModelSpecs: "04 · Especificaciones",
  citizenAppeal: "APELACIÓN CIUDADANA",
  ownerDiagnostic: "DIAGNÓSTICO DEL SISTEMA",
  launchWorkbench: "ABRIR MESA DE TRABAJO",
  stage1Tab: "01 · CENTRO DE MANDO BILATERAL",
  stage2Tab: "02 · MAPA GLOBAL Y CABINA",
  stage3Tab: "03 · 3 PUERTAS Y MODELOS",
  stageAllTab: "MOSTRAR TODO EXPANDIDO",
  stage1Eyebrow: "ETAPA 01 · MESA DE TRABAJO BILATERAL",
  stage1Title: "Un expediente. Dos dictámenes.",
  stage1Subtitle: "ELEGIR CASO · PULSAR RESOLVE · ALTERNAR CIUDADANO ⇄ SISTEMA",
  inputShieldTitle: "Entrada · Escudo de Privacidad",
  inputShieldBadge: "EN DISPOSITIVO · CERO FUGA DE PII",
  loadCaseFile: "01 · Cargar un expediente",
  dropNotice: "Arrastra la carta de rechazo / PDF / HTML",
  parsedLocally: "Procesado localmente · Nunca subido en bruto",
  browseBtn: "EXAMINAR",
  viewRawCase: "Ver texto original",
  hideRawCase: "Ocultar texto original",
  ventBoxTitle: "Buzón de descargo — Dilo sin filtros, lo traduciremos a ley",
  whatAiSaw: "Lo que la IA realmente vio (enmascarado)",
  showMasked: "VER ENMASCARADO",
  rehydrateLocally: "RESTAURAR LOCALMENTE",
  btnResolveDispute: "Resolver Esta Disputa",
  btnOrchestrating: "Orquestando",
  btnRunComplete: "Completado — Re-resolver",
  actionGraphTitle: "Gráfico de Acción · Auditoría Red-Team",
  outputKitTitle: "Salida Dual · Kit de Apelación Ciudadana",
  summaryTitle: "Resumen en Lenguaje Claro",
  sourcesVerified: "Fuentes Oficiales — 100% Verificadas Textualmente",
  downloadTxt: "Carta (.TXT)",
  icsEvent: "Alerta de Calendario (.ICS)",
  copyBtn: "Copiar",
  copiedBtn: "¡Copiado!",
  citizenMode: "CIUDADANO",
  ownerMode: "SISTEMA",
};

const FR_STRINGS: Partial<TranslationStrings> = {
  heroTag1: "NEBIUS × NVIDIA GLOBAL AI HACKATHON 2026",
  heroTag2: "PREMIER MOTEUR BILATÉRAL AU MONDE",
  heroHeadline1: "La machine a dit non.",
  heroHeadline2: "La machine doit dire pourquoi.",
  heroDesc:
    "NIRVAXIS est le premier moteur bilatéral d'IA pour les frictions administratives — fournissant un kit de recours vérifié au citoyen et un diagnostic sans PII à l'institution.",
  heroCtaCommand: "ENTRER DANS LE CENTRE DE COMMANDE →",
  heroCtaLoop: "FONCTIONNEMENT DU MOTEUR",
  heroTrust1: "3/3 CITATIONS VÉRIFIÉES TEXTUELLEMENT",
  heroTrust2: "0 DONNÉE PII TRANSMISE",
  heroTrust3: "$0.021 PAR RÉSOLUTION COMPLÈTE",
  navCommandCenter: "01 · Centre de Commande",
  navGlobalMap: "02 · Carte Mondiale",
  navQualityGates: "03 · Portes de Qualité",
  navModelSpecs: "04 · Modèles IA",
  citizenAppeal: "RECOURS CITOYEN",
  ownerDiagnostic: "DIAGNOSTIC SYSTÈME",
  launchWorkbench: "OUVRIR L'ÉTABLI",
  stage1Tab: "01 · CENTRE DE COMMANDE BILATÉRAL",
  stage2Tab: "02 · CARTE GLOBALE ET COCKPIT",
  stage3Tab: "03 · 3 PORTES ET MODÈLES",
  stageAllTab: "TOUT AFFICHER",
  stage1Eyebrow: "ÉTAPE 01 · ÉTABLI BILATÉRAL",
  stage1Title: "Un dossier. Deux verdicts scellés.",
  stage1Subtitle: "CHOISIR CAS · APPUYER RESOLVE · BASCULER CITOYEN ⇄ SYSTÈME",
  inputShieldTitle: "Entrée · Bouclier de Confidentialité",
  inputShieldBadge: "LOCAL SUR L'APPAREIL · ZÉRO FUITE PII",
  loadCaseFile: "01 · Charger un dossier",
  dropNotice: "Déposez la lettre de refus / PDF / HTML",
  parsedLocally: "Analysé localement · Jamais téléversé brut",
  browseBtn: "PARCOURIR",
  viewRawCase: "Voir le texte brut",
  hideRawCase: "Masquer le texte brut",
  ventBoxTitle: "Boîte de doléances — Dites-le sans filtre, nous le traduirons en droit",
  whatAiSaw: "Ce que l'IA a réellement vu (masqué)",
  showMasked: "VOIR MASQUÉ",
  rehydrateLocally: "RÉHYDRATER LOCALEMENT",
  btnResolveDispute: "Résoudre Ce Litige",
  btnOrchestrating: "Orchestration en cours",
  btnRunComplete: "Terminé — Réexécuter",
  actionGraphTitle: "Graphe d'Action · Arène Red-Team",
  outputKitTitle: "Sortie Double · Kit de Recours Citoyen",
  summaryTitle: "Résumé en Langage Clair",
  sourcesVerified: "Sources Officielles — Vérifiées Textuellement",
  downloadTxt: "Lettre (.TXT)",
  icsEvent: "Alerte Calendrier (.ICS)",
  copyBtn: "Copier",
  copiedBtn: "Copié !",
  citizenMode: "CITOYEN",
  ownerMode: "SYSTÈME",
};

const IT_STRINGS: Partial<TranslationStrings> = {
  heroHeadline1: "La macchina ha detto no.",
  heroHeadline2: "La macchina deve dire perché.",
  heroDesc:
    "NIRVAXIS è il primo motore bilaterale per contenziosi amministrativi: offre al cittadino un ricorso formale verificato e all'istituzione una diagnosi senza dati PII.",
  navCommandCenter: "01 · Centro di Comando",
  navGlobalMap: "02 · Mappa Globale",
  navQualityGates: "03 · Porte di Qualità",
  navModelSpecs: "04 · Specifiche",
  citizenAppeal: "RICORSO CITTADINO",
  ownerDiagnostic: "DIAGNOSI SISTEMA",
  launchWorkbench: "AVVIA WORKBENCH",
  stage1Tab: "01 · CENTRO DI COMANDO BILATERALE",
  stage2Tab: "02 · MAPPA GLOBALE E COCKPIT",
  stage3Tab: "03 · 3 PORTE DI QUALITÀ",
  stageAllTab: "MOSTRA TUTTO ESPANSO",
  stage1Title: "Un fascicolo. Due verdetti vincolanti.",
  inputShieldTitle: "Input · Scudo per la Privacy",
  inputShieldBadge: "SU DISPOSITIVO · ZERO PERDITA PII",
  btnResolveDispute: "Risolvi Questa Controversia",
  actionGraphTitle: "Grafo delle Azioni · Analisi Red-Team",
  outputKitTitle: "Doppio Output · Kit di Ricorso Cittadino",
  summaryTitle: "Sintesi in Linguaggio Chiaro",
  citizenMode: "CITTADINO",
  ownerMode: "SISTEMA",
};

const PT_STRINGS: Partial<TranslationStrings> = {
  heroHeadline1: "A máquina disse não.",
  heroHeadline2: "A máquina deve justificar o porquê.",
  heroDesc:
    "NIRVAXIS é o primeiro motor bilateral de IA para atritos administrativos: fornece ao cidadão um kit de recurso fundamentado e à instituição um diagnóstico sem PII.",
  navCommandCenter: "01 · Centro de Comando",
  navGlobalMap: "02 · Mapa Global",
  navQualityGates: "03 · Portas de Qualidade",
  navModelSpecs: "04 · Especificações",
  citizenAppeal: "RECURSO DO CIDADÃO",
  ownerDiagnostic: "DIAGNÓSTICO DO SISTEMA",
  launchWorkbench: "ABRIR BANCADA",
  stage1Tab: "01 · CENTRO DE COMANDO BILATERAL",
  stage2Tab: "02 · MAPA GLOBAL E CABINE",
  stage3Tab: "03 · 3 PORTAS DE QUALIDADE",
  stageAllTab: "EXPANDIR TUDO",
  stage1Title: "Um processo. Dois pareceres vinculativos.",
  inputShieldTitle: "Entrada · Escudo de Privacidade",
  inputShieldBadge: "NO DISPOSITIVO · ZERO VAZAMENTO PII",
  btnResolveDispute: "Resolver Esta Disputa",
  actionGraphTitle: "Grafo de Ação · Análise Red-Team",
  outputKitTitle: "Saída Dupla · Kit de Recurso do Cidadão",
  summaryTitle: "Resumo em Linguagem Acessível",
  citizenMode: "CIDADÃO",
  ownerMode: "GESTOR",
};

const AR_STRINGS: Partial<TranslationStrings> = {
  brandTagline: "محرك الأدلة الثنائي",
  heroTag1: "نيبيوس × إنفيديا هاكاثون الذكاء الاصطناعي العالمي 2026",
  heroTag2: "أول محرك ثنائي الاتجاه في العالم",
  heroHeadline1: "المنظومة قالت: لا.",
  heroHeadline2: "يجب على المنظومة تقديم السبب.",
  heroDesc:
    "NIRVAXIS هو أول محرك ذكاء اصطناعي لحل النزاعات الإدارية — يزود المواطن بملف استئناف قانوني موثق، ويمنح المؤسسة حزمة تشخيصية خالية من البيانات الشخصية.",
  heroCtaCommand: "الدخول إلى مركز القيادة ←",
  heroCtaLoop: "كيف يعمل المحرك",
  heroTrust1: "3/3 اقتباسات موثقة حرفياً من مصادر رسمية",
  heroTrust2: "0 بايت من البيانات الشخصية مرسلة",
  heroTrust3: "$0.021 لكل تسوية كاملة",
  navCommandCenter: "01 · مركز القيادة",
  navGlobalMap: "02 · المقر العالمي",
  navQualityGates: "03 · بوابات الجودة",
  navModelSpecs: "04 · مواصفات النماذج",
  citizenAppeal: "استئناف المواطن",
  ownerDiagnostic: "تشخيص المؤسسة",
  launchWorkbench: "فتح منصة العمل",
  stage1Tab: "01 · مركز القيادة الثنائي",
  stage2Tab: "02 · خريطة المقر العالمي وغرفة العمليات",
  stage3Tab: "03 · بوابات الجودة ومواصفات النماذج",
  stageAllTab: "عرض الكل موسعاً",
  stage1Eyebrow: "المرحلة 01 · منصة العمل الثنائية",
  stage1Title: "ملف نزاع واحد. تسويتان حاسمتان.",
  stage1Subtitle: "اختر القضية · اضغط RESOLVE · بدّل بين المواطن والمؤسسة",
  inputShieldTitle: "الإدخال · درع الخصوصية",
  inputShieldBadge: "على جهازك محلياً · لا خروج لأي بيانات",
  loadCaseFile: "01 · تحميل ملف القضية",
  dropNotice: "أفلت خطاب الرفض / PDF / HTML هنا",
  parsedLocally: "معالج محلياً · لا يُرفع مجرداً أبداً",
  browseBtn: "تصفح",
  viewRawCase: "عرض النص الأصلي",
  hideRawCase: "إخفاء النص الأصلي",
  ventBoxTitle: "صندوق الشكاوى — عبّر بحرية وسنحوّله إلى لغة قانونية",
  whatAiSaw: "ما رآه الذكاء الاصطناعي فعلياً (مشفر)",
  showMasked: "عرض مشفراً",
  rehydrateLocally: "استعادة الهوية محلياً",
  btnResolveDispute: "حل هذا النزاع الآن",
  btnOrchestrating: "جارٍ التحليل والحل",
  btnRunComplete: "تم الحل — إعادة التنفيذ",
  actionGraphTitle: "مخطط الإجراءات · حلبة التدقيق",
  outputKitTitle: "المخرج المزدوج · حزمة استئناف المواطن",
  paperTitle: "استئناف رسمي — موثق بالكود",
  paperSubtitle: "مستعاد محلياً على الجهاز · خصوصية تامة",
  summaryTitle: "ملخص بلغة مبسطة",
  sourcesVerified: "المصادر — موثقة رسمياً بمطابقة حرفية",
  downloadTxt: "تحميل الخطاب (.TXT)",
  icsEvent: "تنبيه التقويم (.ICS)",
  copyBtn: "نسخ",
  copiedBtn: "تم النسخ",
  citizenMode: "المواطن",
  ownerMode: "المؤسسة",
};

const JA_STRINGS: Partial<TranslationStrings> = {
  brandTagline: "双方向法的証拠検証エンジン",
  heroTag1: "NEBIUS × NVIDIA GLOBAL AI HACKATHON 2026",
  heroTag2: "世界初の双方向AI紛争解決エンジン",
  heroHeadline1: "システムは「不可」と判定した。",
  heroHeadline2: "システムはその「理由」を証明しなければならない。",
  heroDesc:
    "NIRVAXISは行政不服申立のための世界初双方向AIエンジンです。市民には公式条文検証済みの申立キットを、行政・機関側にはPII漏洩ゼロの根本原因パッチを提供します。",
  heroCtaCommand: "コマンドセンターに入る →",
  heroCtaLoop: "エンジンの仕組み",
  heroTrust1: "3/3 公的条文を完全一致引用",
  heroTrust2: "個人情報（PII）の送信 0バイト",
  heroTrust3: "1案件あたり $0.021",
  navCommandCenter: "01 · コマンドセンター",
  navGlobalMap: "02 · グローバル本部マップ",
  navQualityGates: "03 · セキュリティゲート",
  navModelSpecs: "04 · モデル仕様",
  citizenAppeal: "市民申立書",
  ownerDiagnostic: "システム診断",
  launchWorkbench: "ワークベンチ起動",
  stage1Tab: "01 · 双方向コマンドセンター",
  stage2Tab: "02 · グローバル本部マップ＆コックピット",
  stage3Tab: "03 · 3つのセキュリティゲートとモデル仕様",
  stageAllTab: "全セクションを展開表示",
  stage1Eyebrow: "ステージ 01 · 双方向ワークベンチ",
  stage1Title: "1つの不服申請。2つの確定成果物。",
  stage1Subtitle: "案件を選択 · RESOLVEを実行 · 市民/システム管理者切替",
  inputShieldTitle: "入力 · プライバシーシールド",
  inputShieldBadge: "端末内処理 · 個人情報漏洩ゼロ",
  loadCaseFile: "01 · 案件ファイルの選択",
  dropNotice: "却下通知書 / PDF / HTML をここにドロップ",
  parsedLocally: "ローカル端末で解析 · 外部送信一切なし",
  browseBtn: "ファイル参照",
  viewRawCase: "元のテキストを表示",
  hideRawCase: "元のテキストを隠す",
  ventBoxTitle: "異議申立メモ — 率直な思いを入力してください。法的主張に変換します",
  whatAiSaw: "AIモデルが実際に閲覧したデータ（匿名化後）",
  showMasked: "マスク状態を表示",
  rehydrateLocally: "端末内で個人情報を復元",
  btnResolveDispute: "この紛争を解決する",
  btnOrchestrating: "オーケストレーション実行中",
  btnRunComplete: "解決完了 — 再実行",
  actionGraphTitle: "アクショングラフ · レッドチーム検証",
  outputKitTitle: "デュアル出力 · 市民不服申立キット",
  summaryTitle: "平易な言葉による解説要約",
  sourcesVerified: "公的出典 — Tavily検証済・完全一致引用",
  downloadTxt: "申立書 (.TXT)",
  icsEvent: "カレンダー期限 (.ICS)",
  copyBtn: "コピー",
  copiedBtn: "コピー完了",
  citizenMode: "市民モード",
  ownerMode: "管理者モード",
};

const ZH_STRINGS: Partial<TranslationStrings> = {
  brandTagline: "双向法定证据解决引擎",
  heroTag1: "NEBIUS × NVIDIA 全球 AI 黑客松 2026",
  heroTag2: "全球首创双向行政争议解决引擎",
  heroHeadline1: "系统给出了拒绝。",
  heroHeadline2: "系统必须给出依据。",
  heroDesc:
    "NIRVAXIS 是首个针对行政摩擦的双向 AI 引擎 — 为公民提供经过代码验证的严谨申诉包，同时向机构提供零隐私泄漏的根因诊断补丁包。一个争议，两份交付物。",
  heroCtaCommand: "进入指挥中心 →",
  heroCtaLoop: "运作机制解析",
  heroTrust1: "3/3 官方引文逐字比对验证",
  heroTrust2: "0 隐私字节外传",
  heroTrust3: "完整裁决成本仅 $0.021",
  navCommandCenter: "01 · 指挥中心",
  navGlobalMap: "02 · 全球地图",
  navQualityGates: "03 · 质量门禁",
  navModelSpecs: "04 · 模型规格",
  citizenAppeal: "公民申诉",
  ownerDiagnostic: "机构诊断",
  launchWorkbench: "开启工作台",
  stage1Tab: "01 · 双向裁决指挥中心",
  stage2Tab: "02 · 全球总部全景大屏",
  stage3Tab: "03 · 三道安全门禁与模型规格",
  stageAllTab: "平铺展开所有区块",
  stage1Eyebrow: "阶段 01 · 双向工作台",
  stage1Title: "一份争议卷宗。两份终审交付。",
  stage1Subtitle: "选定案例 · 点击 RESOLVE · 切换公民与机构视角",
  inputShieldTitle: "输入 · 隐私安全盾",
  inputShieldBadge: "本地脱敏 · 个人隐私绝不出机",
  loadCaseFile: "01 · 加载争议卷宗",
  dropNotice: "拖入拒签函 / PDF / HTML 凭证",
  parsedLocally: "端侧本地解析 · 绝不上传原始文件",
  browseBtn: "浏览文件",
  viewRawCase: "查看原始卷宗内容",
  hideRawCase: "收起原始卷宗内容",
  ventBoxTitle: "争议诉求直诉箱 — 倾诉委屈，系统将情绪转化为法律重锤",
  whatAiSaw: "AI 模型实际所见数据（已脱敏）",
  showMasked: "查看脱敏密文",
  rehydrateLocally: "端侧本地重水化身份",
  btnResolveDispute: "裁决并解决此争议",
  btnOrchestrating: "多智能体严密推演中",
  btnRunComplete: "裁决交付完毕 — 重新执行",
  actionGraphTitle: "行动图谱 · 红队实战推演",
  outputKitTitle: "双向交付 · 公民申诉套件",
  summaryTitle: "白话要点速览",
  sourcesVerified: "权威法规源 — Tavily联网核验逐字匹配",
  downloadTxt: "下载申诉函 (.TXT)",
  icsEvent: "法定到期提醒 (.ICS)",
  copyBtn: "复制文本",
  copiedBtn: "已复制",
  citizenMode: "公民视角",
  ownerMode: "机构视角",
};

export const I18N: Record<Language, TranslationStrings> = {
  en: EN_STRINGS,
  hi: { ...EN_STRINGS, ...HI_STRINGS },
  de: { ...EN_STRINGS, ...DE_STRINGS },
  es: { ...EN_STRINGS, ...ES_STRINGS },
  fr: { ...EN_STRINGS, ...FR_STRINGS },
  it: { ...EN_STRINGS, ...IT_STRINGS },
  pt: { ...EN_STRINGS, ...PT_STRINGS },
  ar: { ...EN_STRINGS, ...AR_STRINGS },
  ja: { ...EN_STRINGS, ...JA_STRINGS },
  zh: { ...EN_STRINGS, ...ZH_STRINGS },
};

export function getTranslation(lang: Language): TranslationStrings {
  return I18N[lang] || I18N.en;
}
