import type { ActionNode, CodePatch, EvidenceItem, Language, RedTeamCritique, RegionId, Scenario, TelemetryMetrics } from "@/types/resolve";

type Seed = {
  region: RegionId; regionName: string; country: string; flag: string; title: string; shortTitle: string;
  category: string; accent: string; activeCases: number; proofScore: number; claims: number; verifiedCount: number;
  demoName: string; rawNotice: string; ventText: string; sourceQuery: string; officialDomains: string[];
  sources: { title: string; url: string; quote: string; context: string }[];
  condition: string; unknown: string; tasks: [string, string, string, string]; instructions: [string, string, string, string];
  critiques: [string, string, string][]; guide: Partial<Record<Language, string[]>> & { en: string[] };
  facts: string; request: string; friction: string; field: string; fieldLabel: string; policy: string;
};

function portalPatch(seed: Seed): CodePatch {
  return {
    fileName: `components/${seed.region.replace(/\s/g, "").toLowerCase()}-appeal-form.tsx`,
    language: "tsx",
    rootCause: seed.friction,
    wcag: ["1.3.1 Info & Relationships", "2.1.1 Keyboard", "3.3.1 Error Identification", "4.1.3 Status Messages"],
    before: `<div className="text-gray-500">\n  <input placeholder="${seed.fieldLabel}" />\n  <div onClick={submit}>Submit appeal</div>\n  <span>Invalid request. Try again.</span>\n</div>`,
    after: `"use client";\nimport { useState } from "react";\n\nexport function AppealForm({ onSubmitCase }: {\n  onSubmitCase: (reference: string) => Promise<void>;\n}) {\n  const [error, setError] = useState("");\n  const [status, setStatus] = useState("");\n  const [pending, setPending] = useState(false);\n\n  return (\n    <form className="space-y-4" onSubmit={async (event) => {\n      event.preventDefault();\n      if (pending) return;\n      const data = new FormData(event.currentTarget);\n      const reference = String(data.get("${seed.field}") ?? "").trim();\n      if (!reference) { setError("Enter your ${seed.fieldLabel.toLowerCase()}."); return; }\n      setPending(true); setError(""); setStatus("");\n      try {\n        await onSubmitCase(reference);\n        setStatus("Received. Keep your submission receipt.");\n      } catch {\n        setError("Submission failed. Your entry is preserved. Please retry.");\n      } finally { setPending(false); }\n    }}>\n      <label htmlFor="${seed.field}" className="block text-slate-900">\n        ${seed.fieldLabel}\n      </label>\n      <input id="${seed.field}" name="${seed.field}" required\n        aria-invalid={Boolean(error)} aria-describedby="help error"\n        className="border p-3 focus-visible:ring-2 focus-visible:ring-blue-600" />\n      <p id="help">${seed.policy}</p>\n      <p id="error" role="alert" className="text-red-700">{error}</p>\n      <button type="submit" disabled={pending}\n        className="rounded bg-blue-700 px-4 py-3 text-white disabled:opacity-50">\n        {pending ? "Submitting…" : "Submit for review"}\n      </button>\n      <p role="status" aria-live="polite">{status}</p>\n    </form>\n  );\n}`,
  };
}

function makeScenario(seed: Seed): Scenario {
  const evidence: EvidenceItem[] = seed.sources.map((source, index) => ({
    id: `source-${index + 1}`, title: source.title, url: source.url, domain: new URL(source.url).hostname,
    quote: source.quote, rawSource: `${source.context}\n${source.quote}`, status: "VERIFIED",
    provenance: "REPLAY_SNAPSHOT", capturedAt: "2026-10-24", matchScore: 1,
  }));
  evidence.push({ ...evidence[0], id: "source-3", title: "Applicability to your circumstances", status: "NEEDS_CONFIRMATION", condition: seed.condition });
  evidence.push({ id: "source-4", title: "Unsupported assertion — excluded", url: "", domain: "No official source", quote: "", rawSource: "", status: "UNKNOWN", condition: seed.unknown, provenance: "REPLAY_SNAPSHOT", capturedAt: "2026-10-24", matchScore: 0 });
  const actions: ActionNode[] = seed.tasks.map((title, index) => ({
    id: `step-${index + 1}`, title, instruction: seed.instructions[index],
    explanation: index === 0 ? `The notice must be checked against the authority's actual process, not an assumed entitlement. ${seed.condition}` : index === 1 ? `This follows the official guidance: “${seed.sources[0].quote}”` : index === 2 ? "A concise, evidence-linked response addresses the stated rejection rather than making a new unsupported claim." : `The following assertion is not in the verified sources and must not be included: ${seed.unknown}`,
    priority: index < 2 ? "HIGH" : "MEDIUM",
    status: index === 0 ? "NEEDS_CONFIRMATION" : index === 3 ? "UNKNOWN" : "VERIFIED",
    deadline: index === 0 ? "2026-11-03" : "2026-11-05",
    deadlineType: index === 0 ? "CONFIRM_STATUTORY_DATE" : "WORKFLOW_REMINDER",
    evidenceIds: [index === 0 ? "source-3" : index === 3 ? "source-4" : `source-${index}`],
    dependsOn: index === 0 ? [] : [`step-${index}`],
  }));
  const critiques: RedTeamCritique[] = seed.critiques.map(([title, objection, patch], index) => ({ id: `objection-${index + 1}`, title, objection, patch, severity: index === 0 ? "HIGH" : "MEDIUM" }));
  return {
    id: `OR-${seed.region === "INDIA" ? "IN" : seed.region === "EUROPE" ? "EU" : seed.region === "USA" ? "US" : seed.region === "MIDDLE EAST" ? "AE" : seed.region === "SE ASIA" ? "SG" : "AU"}-2026-042`,
    region: seed.region, regionName: seed.regionName, country: seed.country, flag: seed.flag, title: seed.title,
    shortTitle: seed.shortTitle, category: seed.category, accent: seed.accent, activeCases: seed.activeCases,
    proofScore: seed.proofScore, claims: seed.claims, verifiedCount: seed.verifiedCount, urgentCount: seed.region === "AUSTRALIA" ? 1 : 0,
    demoName: seed.demoName, rawNotice: seed.rawNotice, ventText: seed.ventText, sourceQuery: seed.sourceQuery,
    officialDomains: seed.officialDomains, evidence, actions, critiques, guide: seed.guide,
    appealLetter: `To the Reviewing Authority,\n\nSubject: Request for reasoned review — ${seed.shortTitle}\nApplicant: [PERSON_1]\nReference supplied: [ID_1]\n\nI respectfully request a review of the decision described in the attached notice.\n\n${seed.facts}\n\nThe official guidance states: “${seed.sources[0].quote}”\nSource: ${seed.sources[0].url}\n\n${seed.request}\n\nPlease identify the precise reason for the adverse decision, any missing evidence, and the correct procedure for a further review. I do not assert that an unverified entitlement or compensation amount is guaranteed. This request does not waive any applicable deadline.\n\nI will provide the original notice, supporting records and a dated chronology through the authority's secure channel. Please acknowledge receipt and supply a tracking reference.\n\nYours faithfully,\n[PERSON_1]`,
    frictionReport: `ANONYMIZED FRICTION DIAGNOSIS\n\nRegion: ${seed.regionName}\nWorkflow: ${seed.category}\n\nROOT CAUSE\n${seed.friction}\n\nREPRODUCTION\n1. Open the public review form using keyboard navigation.\n2. Enter a syntactically valid reference, leaving a required supporting field empty.\n3. Submit and observe that focus does not move to a useful, associated error.\n\nEXPECTED\nA semantic form, explicit field labels, recoverable validation, a visible submission state, and a receipt.\n\nPOLICY COPY\n${seed.policy}\n\nPRIVACY\nNo personal details, original identifiers, submitted documents or private case text are included in this report.\n\nVALIDATION\nTest the proposed patch with keyboard-only navigation, a screen reader, retry after a failed network request, and the institution's actual submission API before deployment.`,
    codePatch: portalPatch(seed), nextDeadline: "2026-11-05",
    insight: `${seed.shortTitle}: 2 official-source snapshots matched. 3 officer objections addressed. Unverified claims excluded from the reference letter.`,
  };
}

const seeds: Seed[] = [
  {
    region: "INDIA", regionName: "India & South Asia", country: "India", flag: "🇮🇳", title: "An EPF rejection isn't the end of your claim.", shortTitle: "EPF withdrawal review", category: "Public Benefits & EPF", accent: "#f5b544", activeCases: 4, proofScore: 92, claims: 6, verifiedCount: 5,
    demoName: "Aarav Sharma",
    rawNotice: "EMPLOYEES' PROVIDENT FUND — CLAIM RETURNED\nName: Aarav Sharma\nUAN: 100234567890\nClaim ID: EPF/2026/01782\nEmail: aarav.sharma@example.com\nPhone: +91 98765 43210\nDecision date: 22 October 2026\nYour withdrawal request is returned due to a bank KYC name mismatch. Please update the bank record and resubmit. The portal shows a generic error after uploading the corrected document.",
    ventText: "Mera paisa atka hua hai! I corrected my bank KYC twice, but the form still says invalid. I need a clear reason and a working way to upload the proof, not another rejection.",
    sourceQuery: "EPFO official rejected withdrawal bank KYC mismatch grievance EPFiGMS contact escalation 15 days",
    officialDomains: ["epfindia.gov.in", "epfigms.gov.in"],
    sources: [
      { title: "EPFO — official grievance channel", url: "https://www.epfindia.gov.in/site_en/Contact.php", quote: "Kindly register your grievance on EPFiGMS for speedy redressal", context: "EPFO Contact Us. Register a grievance using the official EPFiGMS link." },
      { title: "EPFO — escalation of unresolved grievances", url: "https://pmvbry.epfindia.gov.in/contact-us/", quote: "Track the status of your grievance anytime using your reference number.", context: "How to Raise a Grievance. Provide your UAN / PF Number and select the type of grievance. Attach supporting documents if required." },
    ],
    condition: "Confirm whether the corrected bank KYC is approved in the member portal, not merely uploaded. Verify the rejection date and preserve the exact error.", unknown: "A guaranteed seven-day payout or an automatic penalty payable to the member.",
    tasks: ["Confirm the KYC mismatch", "Build the correction evidence", "File a tracked EPFiGMS grievance", "Exclude guaranteed payout claims"],
    instructions: ["Compare the bank account holder name against the member record. Keep the rejection notice and the KYC approval status.", "Save the corrected bank proof and a dated screenshot of the upload error. Redact screenshots before sharing outside the official portal.", "Use the official EPFiGMS channel. Ask for the exact mismatch field, the correction route, and a trackable acknowledgement.", "Do not demand a seven-day payout or penalties without an applicable, verified rule. This item is excluded from the appeal."],
    critiques: [
      ["Uploaded is not approved", "Your screenshot proves an upload, not that the bank KYC correction was approved.", "The response distinguishes uploaded and approved states and asks the officer to identify the pending approval."],
      ["No reproducible portal failure", "An assertion that the portal is broken does not show the failing step or error.", "Attach the exact error, the step immediately before it, the browser, and the timestamp; remove personal values from the bug report."],
      ["Unsupported payout demand", "You have not established a rule guaranteeing immediate settlement or compensation.", "Replace the guarantee with a reasoned request for correction, reprocessing, and a written status update."],
    ],
    guide: {
      en: ["Check whether the bank KYC is approved, not only submitted.", "Keep the rejection, bank correction evidence, and a dated error screenshot.", "Submit a factual EPFiGMS grievance and retain the reference number."],
      hi: ["बैंक KYC केवल जमा हुई है या स्वीकृत भी हुई है, यह जाँचें।", "अस्वीकृति, बैंक सुधार का प्रमाण और त्रुटि का दिनांक सहित स्क्रीनशॉट रखें।", "EPFiGMS पर तथ्यों के साथ शिकायत दर्ज करें और संदर्भ संख्या सुरक्षित रखें।"],
      de: ["Prüfen Sie, ob die Bank-KYC genehmigt wurde, nicht nur hochgeladen.", "Sichern Sie Ablehnung, Korrekturbeleg und einen datierten Screenshot.", "Reichen Sie eine sachliche EPFiGMS-Beschwerde ein und bewahren Sie die Referenz auf."],
      es: ["Compruebe si la verificación bancaria está aprobada, no solo enviada.", "Conserve el rechazo, la corrección y una captura del error con fecha.", "Presente una reclamación objetiva en EPFiGMS y guarde la referencia."],
      fr: ["Vérifiez que la correction bancaire est approuvée, pas seulement envoyée.", "Conservez le refus, la preuve de correction et une capture datée.", "Déposez une réclamation factuelle sur EPFiGMS et gardez la référence."],
      it: ["Verifichi che la correzione bancaria sia approvata, non solo caricata.", "Conservi il rifiuto, la prova della correzione e una schermata datata.", "Invii un reclamo fattuale su EPFiGMS e conservi il riferimento."],
    },
    facts: "The reference notice states that a bank KYC name mismatch caused the withdrawal request to be returned. A corrected document was uploaded, but approval of that correction has not yet been established. The upload flow subsequently displayed a generic error.",
    request: "Please identify the mismatched field, confirm the status of the submitted KYC correction, and explain how to resubmit or reprocess the request after approval. If the portal error prevents submission, please provide an official alternative route.",
    friction: "The upload flow collapses a recoverable KYC validation failure into a generic error. The submit control is not a semantic button and the field error is not associated with the input.", field: "uan", fieldLabel: "Member reference", policy: "Use the reference on your notice. A KYC upload is not proof of approval.",
  },
  {
    region: "EUROPE", regionName: "Europe", country: "European Union", flag: "🇪🇺", title: "A flight denial. A clearer route to resolution.", shortTitle: "EU-261 flight compensation", category: "Aviation & EU-261", accent: "#2cddaa", activeCases: 4, proofScore: 88, claims: 5, verifiedCount: 4,
    demoName: "Sofia Martin",
    rawNotice: "PASSENGER CLAIM — COMPENSATION DECLINED\nPassenger: Sofia Martin\nBooking reference: LK23Q7\nEmail: sofia.martin@example.com\nFlight: Paris to Rome, 18 October 2026\nYour flight was cancelled on the day of departure. Compensation is declined due to extraordinary operational circumstances. Re-routing was provided the following morning. No incident report or further explanation is enclosed.",
    ventText: "I spent the night at the airport and they just sent a template! They said extraordinary circumstances but won't say what happened. I have the cancellation email and hotel receipt.",
    sourceQuery: "EU official Regulation 261 cancellation extraordinary circumstances airline prove evidence reimbursement care",
    officialDomains: ["europa.eu", "eur-lex.europa.eu"],
    sources: [
      { title: "Your Europe — burden of proof", url: "https://europa.eu/youreurope/citizens/travel/passenger-rights/air/index_en.htm", quote: "The airline has to prove this by providing, for example, extracts from logbooks or incident reports.", context: "Compensation is not due if the carrier can prove extraordinary circumstances that could not have been avoided even if all reasonable measures had been taken." },
      { title: "EUR-Lex — Regulation 261/2004, Article 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A32004R0261", quote: "An operating air carrier shall not be obliged to pay compensation in accordance with Article 7, if it can prove that the cancellation is caused by extraordinary circumstances which could not have been avoided even if all reasonable measures had been taken.", context: "Article 5 — Cancellation. Paragraph 3 concerns the carrier's exemption from compensation." },
    ],
    condition: "Confirm the operating airline, route, cancellation notice time, actual arrival time, and whether EU-261 applies. A statutory limitation date depends on the relevant jurisdiction.", unknown: "A fixed €600 award for this route, or a universal EU-wide 14-day deadline to appeal.",
    tasks: ["Confirm scope and flight chronology", "Request the carrier's evidence", "Submit a conditional, itemized claim", "Exclude assumed compensation amounts"],
    instructions: ["Keep the booking, cancellation notice, re-routing details, and actual arrival time. Verify the operating carrier and applicable jurisdiction.", "Ask the airline to identify the specific event, explain reasonable measures, and provide relevant incident evidence.", "Separate any conditional compensation request from documented care expenses. Attach receipts without asserting a guaranteed award.", "Do not insert €600 or a universal appeal deadline. Neither is established by the reference case."],
    critiques: [
      ["Scope not established", "The draft assumes EU-261 applies without confirming the operating carrier and itinerary.", "Add the itinerary and operating carrier; explicitly make the compensation request conditional on applicability."],
      ["Extraordinary circumstances ignored", "Calling the explanation unfair does not address the statutory exemption.", "Request evidence of the specific event and all reasonable measures, with reference to Article 5(3)."],
      ["Care confused with compensation", "A hotel receipt does not, by itself, establish the amount of statutory compensation.", "Present receipted care expenses separately and avoid an unsupported fixed award."],
    ],
    guide: {
      en: ["Confirm that EU-261 covers the itinerary and operating airline.", "Ask for evidence supporting the extraordinary-circumstances claim.", "Keep care expenses separate from any conditional compensation request."],
      hi: ["यात्रा और संचालन करने वाली एयरलाइन पर EU-261 लागू है या नहीं, जाँचें।", "असाधारण परिस्थितियों के दावे के समर्थन में प्रमाण माँगें।", "देखभाल के खर्च और सशर्त मुआवज़े की माँग अलग रखें।"],
      de: ["Prüfen Sie die Anwendbarkeit der EU-261-Regelung.", "Fordern Sie Nachweise für die außergewöhnlichen Umstände an.", "Trennen Sie Betreuungskosten von einer bedingten Ausgleichsforderung."],
      es: ["Confirme que el itinerario y la aerolínea están cubiertos por EU-261.", "Solicite pruebas de las circunstancias extraordinarias.", "Separe los gastos de asistencia de la compensación condicional."],
      fr: ["Vérifiez que le trajet et le transporteur relèvent du règlement EU-261.", "Demandez les preuves des circonstances extraordinaires.", "Séparez les frais de prise en charge de la demande d'indemnisation."],
      it: ["Verifichi che EU-261 si applichi all'itinerario e al vettore.", "Richieda prove delle circostanze eccezionali.", "Separi le spese di assistenza dalla richiesta condizionata di compensazione."],
    },
    facts: "The reference notice declined compensation for a same-day cancellation, citing extraordinary operational circumstances without supporting incident evidence. Re-routing was provided the following morning. The itinerary, operating carrier and exact chronology should be confirmed from the original records.",
    request: "If Regulation (EC) 261/2004 applies, please provide the specific basis and supporting evidence for the Article 5(3) exemption, including the reasonable measures taken. Please assess any documented care expenses separately. I reserve a conditional request for compensation without asserting an unverified amount.",
    friction: "A generic extraordinary-circumstances rejection omits the event and evidence request route. The portal's booking-reference field has no persistent label and submission errors are not announced.", field: "booking", fieldLabel: "Booking reference", policy: "Compensation depends on scope, circumstances and supporting evidence. Care expenses are assessed separately.",
  },
  {
    region: "USA", regionName: "North America", country: "California, United States", flag: "🇺🇸", title: "An unfair deduction deserves a documented answer.", shortTitle: "Rental deposit deduction", category: "Tenancy & Utilities", accent: "#439bff", activeCases: 3, proofScore: 84, claims: 5, verifiedCount: 4,
    demoName: "Jordan Taylor",
    rawNotice: "SECURITY DEPOSIT — DEDUCTION NOTICE\nTenant: Jordan Taylor\nAccount: 4589201736\nEmail: jordan.taylor@example.com\nProperty jurisdiction: California\nMove-out: 10 October 2026\nDeposit: $2,000. Deduction: $950 for repainting and general cleaning. No invoices, photographs or itemized breakdown were included. The remaining balance is pending processing.",
    ventText: "They took nearly half my deposit for normal wear! I cleaned the apartment and have photos. The portal won't let me upload more than one image and nobody explains the $950.",
    sourceQuery: "California courts official security deposit 21 days itemized statement receipts normal wear tear",
    officialDomains: ["courts.ca.gov", "oag.ca.gov"],
    sources: [
      { title: "California Courts — itemized deposit deductions", url: "https://selfhelp.courts.ca.gov/guide-security-deposits-california", quote: "The itemized statement must list what was deducted and why.", context: "After a tenant moves out, a landlord has 21 days to return the deposit or return it minus deductions with an itemized statement." },
      { title: "California Courts — supporting invoices", url: "https://selfhelp.courts.ca.gov/guide-security-deposits-california", quote: "If the deductions are for more than $125.00, the landlord must attach a copy of any invoices or receipts with the itemized statement.", context: "Returning security deposits. Check the complete guidance for exceptions, good-faith estimates and supporting documentation." },
    ],
    condition: "Confirm the tenancy is governed by California law, the actual date possession was returned, any timely estimate, and the exact documentation supplied.", unknown: "Automatic entitlement to triple damages or proof that every repainting deduction is unlawful.",
    tasks: ["Establish jurisdiction and move-out date", "Request the itemized basis and records", "Send an evidence-led deposit dispute", "Exclude automatic damages"],
    instructions: ["Retain the lease, key-return receipt, deposit payment and dated move-in/move-out photographs. Confirm any estimate already sent.", "Ask for an itemized statement, invoices or receipts, the basis for repainting, and the undisputed balance.", "Compare each deduction to the condition evidence. Request correction without asserting every cleaning charge is automatically invalid.", "Do not demand automatic triple damages. Any penalty claim requires its own verified legal and factual basis."],
    critiques: [
      ["Timing not proved", "The draft assumes the return period expired without establishing possession return or an estimate.", "Anchor the chronology to the key-return evidence and acknowledge any timely estimate."],
      ["No condition comparison", "Calling all damage normal wear is an opinion without move-in and move-out evidence.", "Attach dated condition comparisons and dispute each charge individually."],
      ["Punitive demand unsupported", "The letter demands triple damages without the applicable rule or facts.", "Remove the multiplier and request the undisputed balance plus a documented accounting."],
    ],
    guide: {
      en: ["Confirm California jurisdiction and the date you returned possession.", "Request the itemized deductions and supporting invoices.", "Compare dated condition photos and request the undisputed balance."],
      hi: ["कैलिफ़ोर्निया का कानून और कब्ज़ा लौटाने की तारीख की पुष्टि करें।", "कटौतियों का विवरण और सहायक बिल माँगें।", "दिनांक वाली तस्वीरों की तुलना करें और निर्विवाद राशि वापस माँगें।"],
      de: ["Bestätigen Sie Kalifornien als Rechtsraum und das Rückgabedatum.", "Fordern Sie eine Aufstellung der Abzüge mit Belegen.", "Vergleichen Sie datierte Fotos und verlangen Sie den unstrittigen Restbetrag."],
      es: ["Confirme la jurisdicción de California y la fecha de entrega.", "Solicite el desglose y las facturas de las deducciones.", "Compare fotografías fechadas y solicite el saldo no controvertido."],
      fr: ["Confirmez le droit californien et la date de restitution.", "Demandez le détail des retenues et les justificatifs.", "Comparez les photos datées et réclamez le solde non contesté."],
      it: ["Confermi la giurisdizione californiana e la data di riconsegna.", "Richieda il dettaglio delle detrazioni e le fatture.", "Confronti le foto datate e richieda il saldo non contestato."],
    },
    facts: "The reference notice deducts $950 from a $2,000 California rental deposit for repainting and cleaning without an enclosed itemized breakdown or invoices. The stated move-out date is 10 October 2026; possession return and any prior estimate must be confirmed.",
    request: "Please provide an itemized explanation of each deduction and the supporting records, clarify any lawful estimate or exception, and return the undisputed deposit balance. Please compare the claimed damage against the documented move-in and move-out condition rather than ordinary wear alone.",
    friction: "The dispute portal accepts one photo without explaining an alternative evidence route. A generic error discards the accounting request and keyboard users cannot activate the custom submit control.", field: "tenancy", fieldLabel: "Tenancy reference", policy: "Explain each deduction and provide the applicable documentation. Preserve the tenant's evidence on retry.",
  },
  {
    region: "MIDDLE EAST", regionName: "Middle East", country: "United Arab Emirates", flag: "🇦🇪", title: "A visa refusal needs the right review channel.", shortTitle: "UAE visa status review", category: "Visa & Administrative Review", accent: "#ff6178", activeCases: 2, proofScore: 76, claims: 4, verifiedCount: 3,
    demoName: "Leila Hassan",
    rawNotice: "VISA APPLICATION — STATUS NOT APPROVED\nApplicant: Leila Hassan\nApplication reference: DXB2026A8741\nPassport: N1234567\nEmail: leila.hassan@example.com\nSubmitting authority: Dubai\nStatus date: 21 October 2026\nYour application could not be approved. Please contact your submitting sponsor. The status screen does not identify the missing document and the tracking form reports reference not found.",
    ventText: "I uploaded everything and paid the fee. The sponsor says ask the portal, and the portal says reference not found. I need the actual reason and the correct authority, not a promise of approval.",
    sourceQuery: "UAE official visa application track Dubai GDRFA ICP application reference review sponsor",
    officialDomains: ["u.ae", "gdrfad.gov.ae", "icp.gov.ae"],
    sources: [
      { title: "UAE Government — identify the correct authority", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/Apply-and-track-visa/track-visa-application-and-validity", quote: "If you applied to Dubai, track your visa application through General Directorate of Residency and Foreigners Affairs-Dubai.", context: "Track visa application and validity. Dubai applications use GDRFA; other listed emirates use ICP. Link text and whitespace normalized in this reference snapshot." },
      { title: "GDRFA — application status tracker", url: "https://gdrfad.gov.ae/en/form/application-status-tracker", quote: "Enter the reference number you received when submitting your application", context: "Application Status Tracker. Current Application Reference Number. Email Verification. Status Display." },
    ],
    condition: "Confirm whether the application was submitted to Dubai GDRFA or another emirate's ICP channel. Verify the sponsor's receipt and exact reference.", unknown: "A guaranteed visa approval, a refundable application fee, or a universal statutory appeal period.",
    tasks: ["Identify the issuing authority", "Recover the exact submission reference", "Request a reasoned status clarification", "Exclude visa approval guarantees"],
    instructions: ["Check the sponsor receipt for Dubai GDRFA versus ICP. Do not repeatedly submit to the wrong tracker.", "Ask the sponsor for the official receipt and the exact reference used. Check the tracker's requested identifiers privately.", "Request the rejection reason, missing document, and any available review procedure through the appropriate official channel.", "Do not claim automatic approval, a refund or a fixed appeal deadline without a specific official source."],
    critiques: [
      ["Wrong authority", "The letter is addressed to ICP even though the receipt identifies Dubai.", "Route the inquiry to GDRFA after confirming the sponsor receipt."],
      ["Payment treated as entitlement", "Paying an application fee does not establish a right to visa approval.", "Request reasons and a correction route, not guaranteed issuance."],
      ["Private identifiers overshared", "The draft sends passport details to an unverified support address.", "Keep private identifiers in the official secure channel and use an anonymized technical report elsewhere."],
    ],
    guide: {
      en: ["Check whether GDRFA Dubai or ICP handled the application.", "Obtain the official receipt and exact reference from your sponsor.", "Ask the correct authority for the reason and any review procedure."],
      hi: ["जाँचें कि आवेदन GDRFA Dubai या ICP में जमा हुआ था।", "प्रायोजक से आधिकारिक रसीद और सही संदर्भ संख्या लें।", "सही प्राधिकरण से कारण और उपलब्ध समीक्षा प्रक्रिया पूछें।"],
      de: ["Prüfen Sie, ob GDRFA Dubai oder ICP zuständig ist.", "Holen Sie den offiziellen Beleg und die Referenz vom Sponsor.", "Fragen Sie die richtige Behörde nach Gründen und einer Überprüfung."],
      es: ["Compruebe si la solicitud corresponde a GDRFA Dubái o ICP.", "Obtenga el recibo oficial y la referencia del patrocinador.", "Pida a la autoridad correcta los motivos y el procedimiento de revisión."],
      fr: ["Vérifiez si le dossier relève de GDRFA Dubaï ou d'ICP.", "Obtenez le reçu officiel et la référence auprès du sponsor.", "Demandez les motifs et la procédure de réexamen à l'autorité compétente."],
      it: ["Verifichi se la domanda è gestita da GDRFA Dubai o ICP.", "Ottenga ricevuta ufficiale e riferimento dallo sponsor.", "Chieda all'autorità competente i motivi e l'eventuale procedura di riesame."],
    },
    facts: "The reference status notice says that a Dubai-submitted application was not approved and directs the applicant to the sponsor. The tracker does not locate the supplied reference. The notice does not establish a reason or an available appeal period.",
    request: "Please confirm the responsible authority, verify the official submission reference, and identify the reason or outstanding document associated with this status. Please advise whether a correction or administrative review is available and specify its actual requirements and deadline, if any.",
    friction: "The tracker does not distinguish a wrong-authority reference from a missing record. It omits a persistent reference label, status announcements and a sponsor hand-off route.", field: "application", fieldLabel: "Application reference", policy: "Use the authority shown on the official receipt. A status inquiry does not guarantee visa issuance.",
  },
  {
    region: "SE ASIA", regionName: "Southeast Asia", country: "Singapore", flag: "🇸🇬", title: "New evidence. A stronger employment pass review.", shortTitle: "Employment Pass appeal", category: "Employment & Cross-Border", accent: "#32d9a5", activeCases: 1, proofScore: 90, claims: 4, verifiedCount: 4,
    demoName: "Mei Tan",
    rawNotice: "EMPLOYMENT PASS — APPLICATION UNSUCCESSFUL\nCandidate: Mei Tan\nApplication reference: EP2026SG8421\nEmail: mei.tan@example.com\nRejection date: 20 October 2026\nThe application does not meet the assessment requirements. Your employer should review the rejection advisory in EP eService. The candidate's own portal account does not show an appeal submission option. Revised qualification verification is available.",
    ventText: "I found the missing verification but there is no appeal button in my account. My employer thinks I can file it myself. I need to know who can appeal and how to include the new document.",
    sourceQuery: "Singapore MOM official Employment Pass appeal rejected application employer authorised third party 3 months new information",
    officialDomains: ["mom.gov.sg"],
    sources: [
      { title: "MOM — who may appeal", url: "https://www.mom.gov.sg/passes-and-permits/employment-pass/appeal-against-a-rejected-application", quote: "Only the employer or authorised third party who submitted the application can make enquiries or appeals.", context: "Employment Pass — Appeal against a rejected application. The candidate is not the authorized filing party." },
      { title: "MOM — appeal period and new information", url: "https://www.mom.gov.sg/passes-and-permits/employment-pass/appeal-against-a-rejected-application", quote: "You need to submit your appeal within 3 months of getting the rejection.", context: "Only appeal if the issues in the rejection advisory can be addressed. There will be no change in the outcome unless there is new information." },
    ],
    condition: "Confirm this is an Employment Pass, not a Personalised Employment Pass, the exact rejection date, the authorized submitting party, and the advisory's reasons.", unknown: "A guaranteed approval after six weeks or a candidate's right to file directly for this pass type.",
    tasks: ["Confirm pass type and rejection date", "Route to the authorized employer", "Address the advisory with new evidence", "Exclude guaranteed outcomes"],
    instructions: ["Read the rejection advisory in EP eService. Confirm the pass type and calculate the actual three-month period from the real rejection date.", "Ask the employer or authorized submitting third party to review and lodge the appeal. The missing candidate appeal button is not proof of a defect.", "Connect the revised qualification verification directly to the stated rejection reason. Include only supporting documents requested or relevant to the advisory.", "Do not promise an approval or a fixed processing time. Do not instruct a candidate to bypass the authorized employer."],
    critiques: [
      ["Wrong submitting party", "The candidate proposes to lodge an appeal that only the employer or authorized third party may submit.", "Address the draft to the employer for authorized filing through EP eService."],
      ["No material new information", "The draft repeats the original application rather than answering the rejection advisory.", "Identify the revised verification and explain exactly which rejection issue it addresses."],
      ["Review period misrepresented", "The letter treats a processing estimate as an approval guarantee.", "Remove the guarantee, retain the three-month filing rule, and verify the rejection date."],
    ],
    guide: {
      en: ["Confirm the pass type and rejection date from the advisory.", "Ask the employer or authorized submitting agent to file the appeal.", "Use new information that directly addresses the rejection reasons."],
      hi: ["सलाह-पत्र से पास का प्रकार और अस्वीकृति की तारीख जाँचें।", "नियोक्ता या अधिकृत एजेंट से अपील जमा करवाएँ।", "अस्वीकृति के कारणों का सीधे उत्तर देने वाला नया प्रमाण दें।"],
      de: ["Bestätigen Sie Passart und Ablehnungsdatum.", "Lassen Sie den Arbeitgeber oder bevollmächtigten Einreicher handeln.", "Nutzen Sie neue Informationen, die die Ablehnungsgründe direkt beantworten."],
      es: ["Confirme el tipo de permiso y la fecha del rechazo.", "Solicite que el empleador o agente autorizado presente el recurso.", "Aporte información nueva que responda a los motivos del rechazo."],
      fr: ["Confirmez le type de permis et la date du refus.", "Demandez à l'employeur ou au mandataire autorisé de déposer le recours.", "Apportez des éléments nouveaux répondant directement aux motifs du refus."],
      it: ["Confermi tipo di permesso e data del rifiuto.", "Chieda al datore o all'agente autorizzato di presentare il ricorso.", "Fornisca nuove informazioni pertinenti ai motivi del rifiuto."],
    },
    facts: "The reference Employment Pass application was rejected on 20 October 2026. A revised qualification verification is available. The candidate's account lacks an appeal option, while the rejection advisory directs the employer to EP eService.",
    request: "For filing by the employer or authorized submitting third party: please reassess the application using the revised qualification verification insofar as it addresses the specific rejection advisory. Please confirm the exact issues to be addressed and the applicable filing date. No approval or processing duration is presumed.",
    friction: "The candidate-facing portal fails to explain that the employer or authorized submitting third party must lodge the appeal. The apparent missing button is a role-communication failure, not a permission to bypass authorization.", field: "passReference", fieldLabel: "Employment Pass reference", policy: "Only the employer or authorized submitting third party may lodge this Employment Pass appeal.",
  },
  {
    region: "AUSTRALIA", regionName: "Oceania", country: "New South Wales, Australia", flag: "🇦🇺", title: "Your bond. Your evidence. A time-sensitive response.", shortTitle: "NSW rental bond dispute", category: "Tenancy & Rental Bonds", accent: "#549eff", activeCases: 1, proofScore: 80, claims: 3, verifiedCount: 3,
    demoName: "Alex Morgan",
    rawNotice: "RENTAL BONDS ONLINE — NOTICE OF CLAIM\nTenant: Alex Morgan\nBond number: NSW20268421\nEmail: alex.morgan@example.com\nNotice issued: 22 October 2026\nThe agent has claimed $1,100 from the rental bond for carpet replacement. You disagree with the proposed distribution. The portal requires an NCAT application number to record a formal dispute. You have not yet applied to NCAT.",
    ventText: "The carpet was already worn when I moved in! I clicked dispute but it asks for a tribunal number I don't have. I don't want to miss the time limit just because the form doesn't explain the steps.",
    sourceQuery: "NSW government rental bond notice of claim tenant 14 days NCAT dispute Fair Trading",
    officialDomains: ["nsw.gov.au", "service.nsw.gov.au", "rbo.fairtrading.nsw.gov.au"],
    sources: [
      { title: "NSW Government — notice of claim", url: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/dealing-bond-disputes-for-tenants", quote: "If an amount of the bond is being claimed by the landlord or agent, the tenant will get an email and SMS with the Notice of Claim, with a 14-day notice period to respond.", context: "Dealing with bond disputes for tenants. For paper-lodged bonds, the notice may be mailed." },
      { title: "Rental Bonds Online — tribunal prerequisite", url: "https://rbo.fairtrading.nsw.gov.au/orbshelp/orbshelppage?id=34&detailid=-1", quote: "A dispute must have been lodged with the NSW Civil and Administrative Tribunal (NCAT) prior to disputing the claim in Rental Bonds Online.", context: "Dispute a Refund Claim — Residential Bonds. The tenant will be asked to enter an NCAT Application Number and the date the dispute was lodged." },
    ],
    condition: "Confirm the actual Notice of Claim issue/service date and official deadline. Do not treat this workflow reminder as the legal date. Check NCAT filing requirements promptly.", unknown: "An email disagreement alone automatically stops the bond payment, or that replacement cost is always recoverable in full.",
    tasks: ["Check the notice and actual deadline", "Prepare the NCAT dispute evidence", "Record the formal dispute correctly", "Exclude informal-email protection"],
    instructions: ["Read the issued Notice of Claim and contact Fair Trading if the deadline is unclear. A 14-day period is time-sensitive; the actual notice governs.", "Collect the entry condition report, dated carpet photos, inspection records and the agent's requested amount. Check NCAT's actual application process.", "Once an NCAT dispute is lodged as required, use the actual application number and date in Rental Bonds Online and retain the acknowledgement.", "Do not assume that a complaint email alone stops payout. Do not enter an invented tribunal reference to bypass the form."],
    critiques: [
      ["Informal complaint mistaken for filing", "You emailed the agent but have not established that the required formal dispute was lodged.", "State the NCAT prerequisite and preserve the actual application number and date."],
      ["Deadline guessed", "The draft calculates a date from memory rather than the issued Notice of Claim.", "Require confirmation against the actual notice; treat the exported calendar item only as a workflow reminder."],
      ["Existing wear undocumented", "You say the carpet was old but have not linked the claim to the entry condition report.", "Pair the original condition report with dated photographs and request the basis for the replacement amount."],
    ],
    guide: {
      en: ["Check the actual 14-day notice and confirm the deadline promptly.", "Prepare entry-condition evidence and check NCAT filing requirements.", "Record the genuine NCAT application number in Rental Bonds Online."],
      hi: ["वास्तविक 14-दिन की सूचना पढ़ें और अंतिम तारीख तुरंत जाँचें।", "प्रवेश-समय की स्थिति का प्रमाण रखें और NCAT की प्रक्रिया जाँचें।", "Rental Bonds Online में वास्तविक NCAT आवेदन संख्या दर्ज करें।"],
      de: ["Prüfen Sie die tatsächliche 14-Tage-Mitteilung und Frist sofort.", "Sichern Sie Einzugsbelege und prüfen Sie das NCAT-Verfahren.", "Tragen Sie die echte NCAT-Antragsnummer bei Rental Bonds Online ein."],
      es: ["Compruebe el aviso real de 14 días y confirme el plazo.", "Prepare pruebas del estado inicial y revise los requisitos de NCAT.", "Registre el número auténtico de NCAT en Rental Bonds Online."],
      fr: ["Vérifiez immédiatement l'avis réel de 14 jours et son échéance.", "Préparez l'état des lieux d'entrée et vérifiez la procédure NCAT.", "Saisissez le vrai numéro de dossier NCAT dans Rental Bonds Online."],
      it: ["Verifichi subito l'avviso effettivo di 14 giorni e la scadenza.", "Raccolga le prove dello stato iniziale e verifichi la procedura NCAT.", "Inserisca il vero numero NCAT in Rental Bonds Online."],
    },
    facts: "The reference Notice of Claim is dated 22 October 2026 and seeks $1,100 for carpet replacement. The tenant disputes the condition allegation. No NCAT application has yet been established. The actual notice and its deadline must be checked urgently.",
    request: "Please provide the evidence and calculation supporting the proposed deduction, including its treatment of existing condition and wear. I am checking the required formal NCAT process and do not represent this letter as a substitute for lodging a dispute or notifying Fair Trading as required.",
    friction: "The portal requests a tribunal number before explaining that NCAT filing is a prerequisite. A user may mistakenly believe a generic complaint preserves the deadline. The fix must clarify the sequence without bypassing legal requirements.", field: "bondReference", fieldLabel: "Rental bond reference", policy: "Check the Notice of Claim deadline. Lodge the required NCAT dispute before entering its genuine application number.",
  },
];

export const mockScenarios: Record<RegionId, Scenario> = Object.fromEntries(seeds.map((seed) => [seed.region, makeScenario(seed)])) as Record<RegionId, Scenario>;
export const scenarioList = Object.values(mockScenarios);
export function getScenario(region: RegionId = "INDIA"): Scenario {
  return structuredClone(mockScenarios[region] ?? mockScenarios.INDIA);
}
export function replayTelemetry(reason = "Live API credentials are not configured. Showing a precomputed reference case."): TelemetryMetrics {
  return { mode: "CACHED_REPLAY_SAFEGUARD", latencyMs: 0, nanoLatencyMs: 184, inputTokens: 0, outputTokens: 0, costUSD: 0, costSavingsPercent: 0, stages: [], routedModels: [], fallbackReason: reason, databasePersisted: false };
}
