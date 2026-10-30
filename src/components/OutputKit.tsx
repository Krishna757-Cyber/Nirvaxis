"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileDown, CalendarClock, Copy, Check, Printer, FileText, Code2, Gauge,
  ShieldCheck, Coins, Timer, GitCommitHorizontal, Building2, Scale, Languages, ExternalLink,
} from "lucide-react";
import type { Mode, Scenario } from "../lib/types";
import { useCopied } from "../lib/hooks";
import { rehydrateLetter } from "../lib/letterMaps";
import { buildICS, downloadFile } from "../lib/ics";
import { I18N } from "../lib/i18n";

interface Props {
  mode: Mode;
  scenario: Scenario;
  phase: "idle" | "running" | "done";
  onCitationClick: (url: string) => void;
  externalLang?: string;
  onLanguageChange?: (lang: string) => void;
}

type Lang = "en" | "hi" | "de" | "es" | "fr" | "it" | "pt" | "ar" | "ja" | "zh";

interface LetterData {
  salutation: string;
  paragraphs: string[];
  signoff: string;
}

const MULTILINGUAL_LETTERS: Record<Exclude<Lang, "en">, Record<string, LetterData>> = {
  hi: {
    epf: {
      salutation: "सेवा में,\nक्षेत्रीय भविष्य निधि आयुक्त,\nकर्मचारी भविष्य निधि संगठन (EPFO),\nविषय: ईपीएफ फॉर्म 19 अस्वीकृति के विरुद्ध औपचारिक अपील — नाम में प्रत्यय बेमेल (सर्कुलर 2024)",
      paragraphs: [
        'महोदय / महोदया, मैं 27 अक्टूबर 2026 की अपनी अस्वीकृति सूचना के विरुद्ध यह औपचारिक अपील प्रस्तुत कर रहा हूँ। मेरे ईपीएफ फॉर्म 19 के दावे को केवल इसलिए खारिज कर दिया गया कि आधार और ईपीएफओ रिकॉर्ड के बीच नाम में केवल प्रत्यय ("S") का मामूली अंतर है। [1]',
        "1. 30-दिवसीय अनिवार्य समय-सीमा: ईपीएफ योजना 1952 के पैरा 72(7) के अनुसार दावा प्राप्ति के 30 दिनों के भीतर निपटाना अनिवार्य है। किसी भी अनावश्यक देरी को 30-दिवसीय नियम का वैधानिक उल्लंघन माना जाएगा। [1]",
        '2. आधार बनाम ईपीएफओ नाम बेमेल: ईपीएफओ के स्वयं के केवाईसी सुधार परिपत्र के अनुसार, जहां सदस्य का नाम केवल आद्याक्षर, प्रत्यय या मामूली वर्तनी भिन्नता से भिन्न होता है, वह दावे के निपटान के लिए अपात्रता नहीं माना जाएगा। मेरा आधार [AADHAAR_1], पैन [PAN_1], यूएएन [UAN_1], और रद्द चेक एक ही पहचान स्थापित करते हैं। [2]',
        "3. सुधार साधन: मैं उक्त परिपत्र के तहत संयुक्त घोषणा (नियोक्ता + सदस्य) तंत्र को औपचारिक रूप से संलग्न कर रहा हूँ। ये दस्तावेज अस्वीकृति के हर तथ्यात्मक आधार को समाप्त करते हैं। [3]",
        "4. माँग: मैं ईपीएफ योजना 1952 के पैरा 69(2) के तहत ₹1,84,500 के मेरे संचित कोष के तत्काल संवितरण का अनुरोध करता हूँ। [1]",
      ],
      signoff: "भवदीय,\n\n[PERSON_1]\nUAN [UAN_1] · PAN [PAN_1] · Aadhaar [AADHAAR_1]\n[PHONE_1] · [EMAIL_1]\nदिनांक: 27 अक्टूबर 2026",
    },
    eu261: {
      salutation: "सेवा में: Iberia / Passenger Claims Directorate\nविषय: EC-261/2004 के तहत €400 मुआवजे की औपचारिक माँग — उड़ान संख्या IB3675 (5 घंटे 22 मिनट देरी)",
      paragraphs: [
        "महोदय / महोदया, यह पत्र बर्लिन ब्रैंडेनबर्ग (BER) से मैड्रिड (MAD) की उड़ान IB3675 के संबंध में विनियमन (EC) No 261/2004 के अनुच्छेद 7 के तहत €400 के वैधानिक मुआवजे की औपचारिक माँग है। [1]",
        "1. उड़ान 5 घंटे 22 मिनट की देरी से पहुंची, जो 3 घंटे की कानूनी सीमा से अधिक है (अनुच्छेद 7(1)(b))। [1]",
        '2. "क्रू रोटेशन" कोई असाधारण परिस्थिति नहीं है — इसका प्रमाण एयरलाइन को समकालीन रिकॉर्ड से देना होगा, जो नहीं दिया गया। [2]',
        "3. 14 दिनों के भीतर भुगतान सुनिश्चित करें अन्यथा राष्ट्रीय प्रवर्तन निकाय और कोर्ट में कार्यवाही की जाएगी। [4]",
      ],
      signoff: "भवदीय,\n\n[PERSON_1]\nBooking [PNR_1] · Date: 27 October 2026",
    },
    deposit: {
      salutation: "सेवा में: Austin Property Management LLC\nविषय: टेक्सास संपत्ति संहिता § 92.109 के तहत $2,400 सुरक्षा जमा वापसी हेतु कानूनी नोटिस",
      paragraphs: [
        "महोदय, यह टेक्सास संपत्ति संहिता अध्याय 92 के तहत मेरी $2,400 की सुरक्षा जमा राशि की पूर्ण वापसी हेतु औपचारिक नोटिस है। [1]",
        "1. 30 दिनों की वैधानिक समय-सीमा समाप्त हो चुकी है। कोई लिखित मदवार विवरण प्रदान नहीं किया गया। [1]",
        "2. विवरण न देना § 92.109(c) के तहत कानूनी रूप से दुर्भावना (bad faith) का साक्ष्य माना जाता है। [2]",
        "3. 26 नवंबर 2026 तक $2,400 का भुगतान करें अन्यथा जस्टिस कोर्ट में तीन गुना हर्जाना ($7,300) और कानूनी फीस की माँग की जाएगी। [2]",
      ],
      signoff: "भवदीय,\n\n[PERSON_1]\nFormer tenant · Date: 27 October 2026",
    },
  },
  de: {
    epf: {
      salutation: "An: Regionaler Beauftragter für den Vorsorgefonds (EPFO)\nBetreff: Formeller Widerspruch gegen die Ablehnung des EPF-Antrags Form 19 — Namenssuffix-Diskrepanz (Rundschreiben 2024)",
      paragraphs: [
        "Sehr geehrte Damen und Herren, hiermit lege ich formellen Widerspruch gegen Ihren Ablehnungsbescheid vom 27. Oktober 2026 ein. Mein Auszahlungsantrag (Form 19) wurde unberechtigt abgelehnt, lediglich aufgrund einer minimalen Suffix-Abweichung („S“) zwischen den Aadhaar- und EPFO-Datensätzen. [1]",
        "1. 30-tägige gesetzliche Frist: Gemäß Ziffer 72(7) der EPF-Regelung 1952 ist über Anträge innerhalb von 30 Tagen ab Eingang zu entscheiden. Jede unbegründete Verzögerung stellt eine Verletzung dieser gesetzlichen Frist dar. [1]",
        "2. Namensdiskrepanz laut eigenem KYC-Rundschreiben unschädlich: Das offizielle EPFO-Korrekturrundschreiben besagt ausdrücklich, dass geringfügige Abweichungen bei Suffixen oder Initialen nicht zur Ablehnung berechtigen, solange die Identität zweifelsfrei durch Dokumente belegt ist. Aadhaar [AADHAAR_1], PAN [PAN_1] und UAN [UAN_1] belegen eindeutig dieselbe Person. [2]",
        "3. Nachbesserungsverfahren: Ich reiche hiermit die im Rundschreiben vorgesehene gemeinsame Erklärung (Arbeitgeber + Mitglied) ein. Sämtliche Ablehnungsgründe sind damit gegenstandslos. [3]",
        "4. Zahlungsaufforderung: Ich fordere die unverzügliche Auszahlung des Guthabens in Höhe von ₹1,84,500 gemäß Ziffer 69(2) der EPF-Regelung 1952. [1]",
      ],
      signoff: "Mit freundlichen Grüßen,\n\n[PERSON_1]\nUAN [UAN_1] · PAN [PAN_1] · Aadhaar [AADHAAR_1]\n[PHONE_1] · [EMAIL_1]\nDatum: 27. Oktober 2026",
    },
    eu261: {
      salutation: "An: Iberia Líneas Aéreas / Passagierbeschwerdestelle\nBetreff: Geltendmachung von Ausgleichszahlungen nach Art. 7 Abs. 1 lit. b VO (EG) Nr. 261/2004 — Flug IB3675 (5 Std. 22 Min. Verspätung)",
      paragraphs: [
        "Sehr geehrte Damen und Herren, bezugnehmend auf den Flug IB3675 von Berlin Brandenburg (BER) nach Madrid (MAD) fordere ich die gesetzliche Ausgleichsleistung in Höhe von 400 € gemäß Artikel 7 der Verordnung (EG) Nr. 261/2004. [1]",
        "1. Der Flug erreichte sein Ziel mit einer Verspätung von 5 Stunden und 22 Minuten. Dies überschreitet die 3-Stunden-Schwelle für die Flugstrecke von ca. 1.860 km (Art. 7(1)(b)). [1]",
        "2. Eine „Crew-Rotation“ stellt nach ständiger EuGH-Rechtsprechung (u.a. Rs. Wallentin-Hermann, C-549/07) keinen außergewöhnlichen Umstand dar. Die Beweislast liegt bei der Airline und wurde nicht erbracht. [2]",
        "3. Ich setze Ihnen eine Frist von 14 Tagen zur Überweisung von 400 €. Nach fruchtlosem Fristablauf werde ich das Luftfahrt-Bundesamt einschalten und gerichtliche Schritte einleiten. [4]",
      ],
      signoff: "Mit freundlichen Grüßen,\n\n[PERSON_1]\nBuchungscode: [PNR_1] · Datum: 27. Oktober 2026",
    },
    deposit: {
      salutation: "An: Austin Property Management LLC\nBetreff: Formelle Zahlungsaufforderung zur Kautionsrückerstattung ($2.400) gemäß Texas Property Code § 92.109",
      paragraphs: [
        "Sehr geehrte Damen und Herren, dies ist die formelle Aufforderung zur vollständigen Rückerstattung der Sicherheitsleistung in Höhe von $2.400 gemäß Chapter 92 des Texas Property Code. [1]",
        "1. Die gesetzliche Frist von 30 Tagen ab Auszug (30. September 2026) ist abgelaufen. Eine schriftliche, aufgeschlüsselte Abrechnung wurde nicht übermittelt. [1]",
        "2. Das Unterlassen der Abrechnung begründet gemäß § 92.109(c) die gesetzliche Vermutung böswilligen Handelns (bad faith). Ohne Übergabeprotokoll sind angebliche Schäden unbegründet. [2]",
        "3. Ich fordere die Auszahlung von $2.400 bis zum 26. November 2026. Andernfalls werde ich vor dem Justice Court auf den dreifachen Kautionsbetrag ($7.300) zzgl. $100 Strafpauschale und Anwaltskosten klagen. [2]",
      ],
      signoff: "Mit freundlichen Grüßen,\n\n[PERSON_1]\nEhemaliger Mieter · Datum: 27. Oktober 2026",
    },
  },
  es: {
    epf: {
      salutation: "A la atención de: Comisionado Regional del Fondo de Previsión (EPFO)\nAsunto: Recurso formal contra la denegación de la solicitud EPF Formulario 19 — Discrepancia de sufijo de nombre (Circular 2024)",
      paragraphs: [
        "Estimado/a Comisionado/a, presento recurso formal contra la notificación de rechazo del 27 de octubre de 2026. Mi reclamación del Formulario 19 de EPF fue indebidamente denegada únicamente por una discrepancia de sufijo (\"S\") entre los registros de Aadhaar y EPFO. [1]",
        "1. Plazo obligatorio de 30 días: Conforme al Párrafo 72(7) del Plan EPF 1952, la resolución debe emitirse dentro de los 30 días siguientes a la recepción. Todo retraso constituye un incumplimiento legal. [1]",
        "2. La circular KYC de EPFO prohíbe la descalificación: La propia circular oficial establece que las variaciones menores de sufijos o iniciales no descalifican al miembro cuando la identidad está debidamente acreditada. Aadhaar [AADHAAR_1], PAN [PAN_1] y UAN [UAN_1] prueban inequívocamente la misma identidad. [2]",
        "3. Mecanismo de rectificación: Adjunto la Declaración Conjunta (empleador + miembro) prevista por la circular, dejando sin fundamento el motivo de denegación. [3]",
        "4. Solicitud de pago: Solicito el desembolso inmediato de ₹1,84,500 en virtud del Párrafo 69(2) del Plan EPF 1952. [1]",
      ],
      signoff: "Atentamente,\n\n[PERSON_1]\nUAN [UAN_1] · PAN [PAN_1] · Aadhaar [AADHAAR_1]\n[PHONE_1] · [EMAIL_1]\nFecha: 27 de octubre de 2026",
    },
    eu261: {
      salutation: "A la atención de: Iberia Líneas Aéreas de España / Dirección de Reclamaciones de Pasajeros\nAsunto: Reclamación formal de compensación según el Reglamento (CE) nº 261/2004, Art. 7 — Vuelo IB3675 (retraso de 5 h 22 min)",
      paragraphs: [
        "Estimados señores, por medio de la presente interpongo reclamación formal de compensación legal de 400 € al amparo del Artículo 7 del Reglamento (CE) nº 261/2004 por el retraso del vuelo IB3675 de Berlín Brandeburgo (BER) a Madrid (MAD). [1]",
        "1. El vuelo arribó con un retraso efectivo de 5 horas y 22 minutos, superando holgadamente el umbral legal de 3 horas para una distancia de ~1.860 km (Art. 7(1)(b)). [1]",
        "2. La mera alegación de \"rotación de tripulación\" no constituye causa de fuerza mayor ni circunstancia extraordinaria según la jurisprudencia consolidada del TJUE (asunto C-549/07 Wallentin-Hermann). La aerolínea no ha aportado prueba fehaciente alguna. [2]",
        "3. Concedo un plazo perentorio de 14 días para el abono de los 400 € adeudados, antes de proceder ante la Agencia Estatal de Seguridad Aérea (AESA) y la vía judicial correspondiente. [4]",
      ],
      signoff: "Atentamente,\n\n[PERSON_1]\nCódigo de reserva: [PNR_1] · Fecha: 27 de octubre de 2026",
    },
    deposit: {
      salutation: "A la atención de: Austin Property Management LLC\nAsunto: Reclamación formal y demanda de devolución de depósito de garantía ($2,400) bajo el Código de Propiedad de Texas § 92.109",
      paragraphs: [
        "Estimados señores, la presente constituye notificación legal formal exigiendo la devolución íntegra del depósito de seguridad de $2,400 conforme al Capítulo 92 del Código de Propiedad de Texas. [1]",
        "1. El plazo legal improrrogable de 30 días contados desde mi desocupación el 30 de septiembre de 2026 ha vencido sin que hayan entregado la lista detallada y por escrito. [1]",
        "2. Según el § 92.109(c), la falta de entrega oportuna constituye presunción legal de mala fe (bad faith). Al no existir reporte inicial de entrega, cualquier cargo es jurídicamente improcedente. [2]",
        "3. Exijo el pago de $2,400 antes del 26 de noviembre de 2026. En caso contrario, radicaré demanda ante la Corte de Justicia reclamando daños triplicados ($7,300), sanción de $100 y honorarios de abogado. [2]",
      ],
      signoff: "Atentamente,\n\n[PERSON_1]\nEx-arrendatario/a · Fecha: 27 de octubre de 2026",
    },
  },
  fr: {
    epf: {
      salutation: "À l'attention de : Commissaire régional du Fonds de prévoyance (EPFO)\nObjet : Recours formel contre le rejet de la demande EPF Formulaire 19 — Mésappariement de suffixe (Circulaire 2024)",
      paragraphs: [
        "Madame, Monsieur le Commissaire, je forme par la présente un recours officiel contre la décision de rejet du 27 octobre 2026 relative à ma demande Form 19, rejetée pour une simple divergence de suffixe (« S ») entre Aadhaar et EPFO. [1]",
        "1. Délai statutaire de 30 jours : En application du paragraphe 72(7) du régime EPF 1952, toute demande doit être traitée sous 30 jours à compter de sa réception. [1]",
        "2. La circulaire KYC de l'EPFO prohibe le rejet : Les directives officielles stipulent expressément que les écarts mineurs de suffixe ou d'initiale ne sauraient motiver un rejet dès lors que l'identité est établie par les pièces fournies (Aadhaar [AADHAAR_1], PAN [PAN_1], UAN [UAN_1]). [2]",
        "3. Régularisation : Je joins la Déclaration Conjointe (employeur + affilié) prévue par la circulaire, levant ainsi tout fondement au rejet. [3]",
        "4. Demande de versement : Je demande le déblocage immédiat de mes fonds de ₹1,84,500 conformément au paragraphe 69(2) du régime EPF 1952. [1]",
      ],
      signoff: "Veuillez agréer mes salutations distinguées,\n\n[PERSON_1]\nUAN [UAN_1] · PAN [PAN_1] · Aadhaar [AADHAAR_1]\n[PHONE_1] · [EMAIL_1]\nDate : 27 octobre 2026",
    },
    eu261: {
      salutation: "À l'attention de : Iberia Líneas Aéreas / Direction des réclamations passagers\nObjet : Réclamation d'indemnisation légale au titre du Règlement (CE) n° 261/2004, Art. 7 — Vol IB3675 (retard de 5h22)",
      paragraphs: [
        "Madame, Monsieur, je sollicite par la présente l'indemnisation forfaitaire légale de 400 € prévue à l'article 7 du Règlement (CE) n° 261/2004 en raison du retard de 5 heures et 22 minutes subi sur le vol IB3675 reliant Berlin Brandenburg (BER) à Madrid (MAD). [1]",
        "1. Le retard effectif à l'arrivée excède le seuil légal de 3 heures pour un vol intracommunautaire de ~1 860 km (Art. 7(1)(b)). [1]",
        "2. Une « rotation d'équipage » ne relève nullement d'une circonstance extraordinaire selon la jurisprudence constante de la CJUE (affaire C-549/07 Wallentin-Hermann). La charge de la preuve incombe au transporteur et fait totalement défaut. [2]",
        "3. Je vous mets en demeure de me verser la somme de 400 € sous un délai strict de 14 jours, à défaut de quoi le dossier sera transmis à l'autorité nationale de contrôle et à la juridiction compétente. [4]",
      ],
      signoff: "Veuillez agréer mes salutations distinguées,\n\n[PERSON_1]\nRéférence de réservation : [PNR_1] · Date : 27 octobre 2026",
    },
    deposit: {
      salutation: "À l'attention de : Austin Property Management LLC\nObjet : Mise en demeure formelle pour la restitution intégrale du dépôt de garantie (2 400 $) sous le Texas Property Code § 92.109",
      paragraphs: [
        "Madame, Monsieur, la présente vaut mise en demeure formelle d'avoir à restituer l'intégralité de mon dépôt de garantie de 2 400 $ conformément au chapitre 92 du Texas Property Code. [1]",
        "1. Le délai légal impératif de 30 jours courant depuis mon départ au 30 septembre 2026 est expiré sans qu'aucun décompte écrit détaillé n'ait été notifié. [1]",
        "2. Conformément à l'article § 92.109(c), le défaut de restitution dans le délai légal caractérise la mauvaise foi (bad faith). En l'absence d'état des lieux d'entrée contradictoire, toute prétention à retenue est juridiquement irrecevable. [2]",
        "3. Je vous somme de procéder au règlement de 2 400 $ d'ici le 26 novembre 2026, faute de quoi une action en dommages et intérêts triplés (7 300 $), majorée de 100 $ d'amende civile et des honoraires d'avocat sera engagée devant la Justice Court. [2]",
      ],
      signoff: "Veuillez agréer mes salutations distinguées,\n\n[PERSON_1]\nAncien locataire · Date : 27 octobre 2026",
    },
  },
  it: {
    epf: {
      salutation: "Alla c.a.: Commissario Regionale del Fondo di Previdenza (EPFO)\nOggetto: Ricorso formale avverso il rigetto della richiesta EPF Modulo 19 — Discrepanza suffisso nominativo (Circolare 2024)",
      paragraphs: [
        'Egregio Commissario, con la presente impugno formalmente la comunicazione di rigetto del 27 ottobre 2026. La richiesta Form 19 è stata ingiustamente respinta per una mera discrepanza di suffisso ("S") tra i registri Aadhaar ed EPFO. [1]',
        "1. Termine perentorio di 30 giorni: Ai sensi del Paragrafo 72(7) dello Schema EPF 1952, la decisione deve essere adottata entro 30 giorni dalla ricezione. Ogni ulteriore ritardo integra violazione di legge. [1]",
        "2. La circolare KYC dell'EPFO vieta la decadenza: Le linee guida ufficiali sanciscono espressamente che scostamenti minimi o suffissi non costituiscono motivo di rigetto quando l'identità è documentata. Aadhaar [AADHAAR_1], PAN [PAN_1] e UAN [UAN_1] attestano inequivocabilmente la medesima identità. [2]",
        "3. Regolarizzazione: Allego la Dichiarazione Congiunta (datore + iscritto) prevista dalla circolare, sanando integralmente il presunto vizio. [3]",
        "4. Richiesta di liquidazione: Chiedo l'immediata erogazione dei fondi pari a ₹1,84,500 ex Paragrafo 69(2) dello Schema EPF 1952. [1]",
      ],
      signoff: "Distinti saluti,\n\n[PERSON_1]\nUAN [UAN_1] · PAN [PAN_1] · Aadhaar [AADHAAR_1]\n[PHONE_1] · [EMAIL_1]\nData: 27 ottobre 2026",
    },
    eu261: {
      salutation: "Alla c.a.: Iberia Líneas Aéreas / Ufficio Reclami Passeggeri\nOggetto: Richiesta formale di indennizzo pecuniario ex Regolamento (CE) n. 261/2004, Art. 7 — Volo IB3675 (5h 22m di ritardo)",
      paragraphs: [
        "Spettabile Compagnia, con la presente richiedo formalmente la compensazione pecuniaria di 400 € prevista dall'Articolo 7 del Regolamento (CE) n. 261/2004 a seguito del ritardo subito sul volo IB3675 da Berlino Brandeburgo (BER) a Madrid (MAD). [1]",
        "1. Il volo è giunto a destinazione con 5 ore e 22 minuti di ritardo, superando ampiamente la soglia di 3 ore per una tratta di ~1.860 km (Art. 7(1)(b)). [1]",
        "2. La \"rotazione dell'equipaggio\" non costituisce circostanza eccezionale secondo la consolidata giurisprudenza CGUE (causa C-549/07 Wallentin-Hermann). L'onere della prova spetta al vettore e non è stato assolto. [2]",
        "3. Si intima il pagamento di 400 € entro il termine perentorio di 14 giorni, riservando ogni azione dinanzi all'ENAC e al giudice ordinario. [4]",
      ],
      signoff: "Distinti saluti,\n\n[PERSON_1]\nCodice prenotazione: [PNR_1] · Data: 27 ottobre 2026",
    },
    deposit: {
      salutation: "Alla c.a.: Austin Property Management LLC\nOggetto: Intimazione formale di restituzione del deposito cauzionale ($2.400) ex Texas Property Code § 92.109",
      paragraphs: [
        "Spettabile Società, la presente costituisce formale messa in mora per la restituzione integrale del deposito cauzionale di $2.400 ai sensi del Chapter 92 del Texas Property Code. [1]",
        "1. Il termine perentorio di 30 giorni dal rilascio dell'immobile (30 settembre 2026) è spirato senza la consegna del prospetto analitico delle deduzioni. [1]",
        "2. Ai sensi del § 92.109(c), la mancata restituzione nei termini costituisce presunzione legale di mala fede (bad faith). In difetto di verbale iniziale di consegna, qualsiasi addebito è legalmente nullo. [2]",
        "3. Intimo il versamento di $2.400 entro il 26 novembre 2026. In difetto, si procederà dinanzi alla Justice Court per danni triplicati ($7.300), $100 di sanzione e spese legali. [2]",
      ],
      signoff: "Distinti saluti,\n\n[PERSON_1]\nEx conduttore · Data: 27 ottobre 2026",
    },
  },
  pt: {
    epf: {
      salutation: "Ao cuidado de: Comissário Regional do Fundo de Previdência (EPFO)\nAssunto: Recurso formal contra o indeferimento do pedido EPF Formulário 19 — Divergência de sufixo no nome (Circular 2024)",
      paragraphs: [
        'Exmo. Senhor Comissário, venho por este meio interpor recurso formal contra a notificação de indeferimento de 27 de outubro de 2026. O meu pedido do Formulário 19 foi indevidamente rejeitado apenas por uma divergência de sufixo ("S") entre os registos do Aadhaar e do EPFO. [1]',
        "1. Prazo legal vinculativo de 30 dias: Nos termos do Parágrafo 72(7) do Regime EPF 1952, a decisão deve ocorrer no prazo de 30 dias a contar da receção. Qualquer mora constitui incumprimento legal expresso. [1]",
        "2. A circular KYC do próprio EPFO afasta a desqualificação: As diretrizes oficiais determinam expressamente que variações menores de sufixos ou iniciais não desqualificam o membro quando a identidade está plenamente comprovada. Aadhaar [AADHAAR_1], PAN [PAN_1] e UAN [UAN_1] comprovam indubitavelmente a mesma identidade. [2]",
        "3. Mecanismo de regularização: Anexo a Declaração Conjunta (empregador + membro) prevista na circular, sanando de imediato qualquer suposta inconformidade. [3]",
        "4. Pedido de liquidação: Requeiro o desembolso imediato do saldo acumulado de ₹1,84,500 ao abrigo do Parágrafo 69(2) do Regime EPF 1952. [1]",
      ],
      signoff: "Com os melhores cumprimentos,\n\n[PERSON_1]\nUAN [UAN_1] · PAN [PAN_1] · Aadhaar [AADHAAR_1]\n[PHONE_1] · [EMAIL_1]\nData: 27 de outubro de 2026",
    },
    eu261: {
      salutation: "À atenção de: Iberia Líneas Aéreas / Direção de Reclamações de Passageiros\nAssunto: Reclamação formal de indemnização ao abrigo do Regulamento (CE) n.º 261/2004, Art. 7.º — Voo IB3675 (atraso de 5h 22m)",
      paragraphs: [
        "Exmos. Senhores, venho por este meio exigir formalmente a indemnização legal de 400 € prevista no Artigo 7.º do Regulamento (CE) n.º 261/2004 pelo atraso verificado no voo IB3675 de Berlim Brandemburgo (BER) para Madrid (MAD). [1]",
        "1. O voo chegou com 5 horas e 22 minutos de atraso, superando o limite legal de 3 horas para uma distância de ~1.860 km (Art. 7(1)(b)). [1]",
        "2. A alegação de \"rotação de tripulação\" não constitui circunstância extraordinária conforme jurisprudência constante do TJUE (Processo C-549/07 Wallentin-Hermann). O ónus da prova cabe à transportadora e não foi cumprido. [2]",
        "3. Concedo o prazo perentório de 14 dias para o pagamento de 400 €, sob pena de queixa imediata à autoridade nacional da aviação civil e ação judicial de cobrança. [4]",
      ],
      signoff: "Com os melhores cumprimentos,\n\n[PERSON_1]\nCódigo de reserva: [PNR_1] · Data: 27 de outubro de 2026",
    },
    deposit: {
      salutation: "À atenção de: Austin Property Management LLC\nAssunto: Notificação formal e interpelação para devolução de caução ($2,400) sob o Código de Propriedade do Texas § 92.109",
      paragraphs: [
        "Exmos. Senhores, a presente serve como notificação judicial prévia exigindo a restituição integral do depósito de caução de $2,400 nos termos do Capítulo 92 do Código de Propriedade do Texas. [1]",
        "1. O prazo legal de 30 dias a partir da desocupação em 30 de setembro de 2026 expirou sem a apresentação de qualquer discriminação discriminada por escrito. [1]",
        "2. Nos termos do § 92.109(c), a falta de entrega tempestiva presume má-fé (bad faith). Sem laudo inicial de vistoria, eventuais deduções são juridicamente nulas. [2]",
        "3. Exijo o pagamento de $2,400 até 26 de novembro de 2026. Em caso de incumprimento, instaurarei ação na Justice Court exigindo indemnização tripla ($7,300), multa de $100 e honorários advocatícios. [2]",
      ],
      signoff: "Com os melhores cumprimentos,\n\n[PERSON_1]\nEx-arrendatário/a · Data: 27 de outubro de 2026",
    },
  },
  ar: {
    epf: {
      salutation: "إلى: المفوض الإقليمي لصندوق الادخار (EPFO)\nالموضوع: استئناف رسمي ضد رفض مطالبة نموذج EPF 19 — اختلاف لاحقة الاسم (التعميم الرسمي 2024)",
      paragraphs: [
        'سيدي / سيدتي، أتقدم بهذا الاستئناف الرسمي ضد إشعار الرفض المؤرخ في 27 أكتوبر 2026. تم رفض طلبي لنموذج EPF 19 بشكل غير قانوني فقط بسبب اختلاف لاحقة ("S") في الاسم بين بطاقة Aadhaar وسجلات EPFO. [1]',
        "1. المهلة القانونية الإلزامية البالغة 30 يوماً: بموجب الفقرة 72(7) من خطة EPF لعام 1952، يتعين البت في المطالبة خلال 30 يوماً من استلامها. أي تأخير غير مبرر يشكل خرقاً للقانون. [1]",
        "2. تعميم تصحيح KYC يمنع استبعاد المطالبة: ينص التعميم الرسمي لمنظمة EPFO صراحة على أن الاختلافات الطفيفة في اللواحق أو الأحرف الأولى لا تعد سبباً للاستبعاد طالما أن الهوية مثبتة قطيعاً بمستندات رسمية (Aadhaar [AADHAAR_1]، PAN [PAN_1]، UAN [UAN_1]). [2]",
        "3. إجراء التصحيح: أرفق بهذا الإعلان المشترك الموقع (صاحب العمل + العضو) المنصوص عليه في التعميم، مما يبطل كل أسس الرفض. [3]",
        "4. طلب الصرف: أطالب بالصرف الفوري لمستحقاتي البالغة 184,500 روبية بموجب الفقرة 69(2) من خطة EPF لعام 1952. [1]",
      ],
      signoff: "وتفضلوا بقبول فائق الاحترام والتقدير،\n\n[PERSON_1]\nUAN [UAN_1] · PAN [PAN_1] · Aadhaar [AADHAAR_1]\n[PHONE_1] · [EMAIL_1]\nالتاريخ: 27 أكتوبر 2026",
    },
    eu261: {
      salutation: "إلى: إدارة مطالبات المسافرين في شركة إيبيريا (Iberia)\nالموضوع: مطالبة رسمية بالتعويض القانوني بموجب اللائحة الأوروبية EC 261/2004 المادة 7 — رحلة IB3675 (تأخير 5 ساعات و22 دقيقة)",
      paragraphs: [
        "تحية طيبة، أتقدم بهذه المطالبة الرسمية للتعويض القانوني بمبلغ 400 يورو بموجب المادة 7 من اللائحة الأوروبية (EC) رقم 261/2004 عن التأخير الواقع على الرحلة IB3675 من برلين براندنبورغ (BER) إلى مدريد (MAD). [1]",
        "1. وصلت الرحلة بتأخير قدره 5 ساعات و22 دقيقة، متجاوزة الحد القانوني البالغ 3 ساعات لمسافة ~1,860 كم (المادة 7(1)(b)). [1]",
        "2. لا يُعد \"تبديل طاقم الطائرة\" ظرفاً استثنائياً وفقاً للسوابق القضائية الراسخة لمحكمة العدل الأوروبية (قضية C-549/07 Wallentin-Hermann). عبء الإثبات يقع على شركة الطيران ولم يتم تقديم أي دليل. [2]",
        "3. أمنحكم مهلة مدتها 14 يوماً لدفع مبلغ 400 يورو قبل تصعيد الشكوى إلى هيئة الإنفاذ الوطنية والقضاء المختص. [4]",
      ],
      signoff: "وتفضلوا بقبول الاحترام،\n\n[PERSON_1]\nرمز الحجز: [PNR_1] · التاريخ: 27 أكتوبر 2026",
    },
    deposit: {
      salutation: "إلى: Austin Property Management LLC\nالموضوع: إنذار رسمي ومطالبة باسترداد مبلغ التأمين (2,400 دولار) بموجب قانون العقارات في تكساس المادة 92.109",
      paragraphs: [
        "تحية طيبة، يمثل هذا الخطاب إخطاراً قانونياً رسمياً للمطالبة باسترداد كامل وديعة التأمين البالغة 2,400 دولار أمريكي بموجب الفصل 92 من قانون الملكية في تكساس. [1]",
        "1. انتهت المهلة القانونية البالغة 30 يوماً من تاريخ تسليم العقار في 30 سبتمبر 2026 دون تقديم أي كشف حساب كتابي مفصل. [1]",
        "2. بموجب المادة 92.109(c)، يشكل عدم الرد في الموعد افتراضاً قانونياً بسوء النية (bad faith). في ظل عدم وجود تقرير استلام أولي، تعد أي ادعاءات أضرار باطلة قانوناً. [2]",
        "3. أطالب بسداد مبلغ 2,400 دولار بحلول 26 نوفمبر 2026، وإلا سأرفع دعوى أمام محكمة العدل للمطالبة بثلاثة أضعاف المبلغ (7,300 دولار) وغرامة 100 دولار وأتعاب المحاماة. [2]",
      ],
      signoff: "وتفضلوا بقبول الاحترام،\n\n[PERSON_1]\nالمستأجر السابق · التاريخ: 27 أكتوبر 2026",
    },
  },
  ja: {
    epf: {
      salutation: "宛先: 地域積立基金コミッショナー (EPFO)\n件名: EPFフォーム19却下処分に対する正式不服申立書 — 氏名末尾差異（2024年公式通達準拠）",
      paragraphs: [
        '拝啓、2026年10月27日付の却下通知に対し、正式に不服を申し立てます。本件EPF Form 19申請は、AadhaarとEPFO記録間の氏名末尾（「S」）の軽微な不一致のみを理由に不当に却下されました。 [1]',
        "1. 30日間の法定処理期限：1952年EPF制度第72条(7)に基づき、受領後30日以内の裁決が義務付けられています。不当な遅延は明確な法定違反を構成します。 [1]",
        "2. EPFO公式KYC通達による却下禁止規定：公式通達は、公的証明により同一人物性が明白である場合、イニシャルや末尾の軽微な差異を請求却下の事由としてはならないと明記しています。Aadhaar [AADHAAR_1]、PAN [PAN_1]、UAN [UAN_1]により身元は明白に実証されています。 [2]",
        "3. 訂正手続きの履行：通達に定める共同申告書（使用者＋組合員）を添付し、却下のすべての事実的根拠を解消いたします。 [3]",
        "4. 支払請求：EPF制度第69条(2)に基づき、積立金₹1,84,500の即時支給を請求いたします。 [1]",
      ],
      signoff: "敬具\n\n[PERSON_1]\nUAN [UAN_1] · PAN [PAN_1] · Aadhaar [AADHAAR_1]\n[PHONE_1] · [EMAIL_1]\n日付: 2026年10月27日",
    },
    eu261: {
      salutation: "宛先: イベリア航空 / 旅客紛争解決部門\n件名: 欧州指令EC 261/2004第7条に基づく法定補償金400ユーロの正式請求書 — IB3675便（5時間22分遅延）",
      paragraphs: [
        "拝啓、ベルリン・ブランデンブルク（BER）発マドリード（MAD）行きIB3675便の大幅遅延に関し、欧州規則 (EC) No 261/2004 第7条に基づき、400ユーロの法定補償金を正式に請求いたします。 [1]",
        "1. 当該航空便は5時間22分遅れて到着し、約1,860kmの路線における3時間の法定基準を大幅に超過しています (第7条(1)(b))。 [1]",
        "2. 「乗務員ローテーションの都合」は、欧州司法裁判所の確立された判例（C-549/07 Wallentin-Hermann事件）において「異常事態」に該当しません。立証責任は航空会社にあり、一切証明されていません。 [2]",
        "3. 本状送達より14日以内の支払いを求めます。期限内に支払われない場合、直ちに国家執行機関（NEB）および少額訴訟手続きへ移行します。 [4]",
      ],
      signoff: "敬具\n\n[PERSON_1]\n予約番号: [PNR_1] · 日付: 2026年10月27日",
    },
    deposit: {
      salutation: "宛先: Austin Property Management LLC\n件名: テキサス州財産法第92.109条に基づく敷金（2,400ドル）全額返還督促通知書",
      paragraphs: [
        "拝啓、テキサス州財産法第92章に基づき、預託敷金2,400ドルの全額即時返還を求める正式な法的催告書を送付いたします。 [1]",
        "1. 2026年9月30日の退去から起算される30日間の法定期間は満了しましたが、書面による明細書は一切交付されていません。 [1]",
        "2. 同法第92.109条(c)に基づき、期限内の未返還は「悪意（bad faith）」と法的に推定されます。入居時現状確認書が存在しない以上、損害控除の主張は法的に無効です。 [2]",
        "3. 2026年11月26日までに2,400ドルの全額返還を求めます。不履行の場合、治安判事裁判所（Justice Court）にて3倍賠償金（7,300ドル）、100ドルの法定過料、弁護士費用の支払いを求めて提訴いたします。 [2]",
      ],
      signoff: "敬具\n\n[PERSON_1]\n元賃借人 · 日付: 2026年10月27日",
    },
  },
  zh: {
    epf: {
      salutation: "致：印度雇员公积金组织（EPFO）区域公积金专员\n事由：关于驳回EPF Form 19公积金提取申请之正式申诉 — 姓名后缀微异（依据2024年官方通达）",
      paragraphs: [
        '尊敬的专员：针对2026年10月27日送达的驳回通知，本人特此提起正式申诉。本人的Form 19提取申请仅因Aadhaar与EPFO档案中姓名存在单个后缀字母（“S”）的轻微差异而遭驳回，该决定显属不当且缺乏法律依据。 [1]',
        "1. 30天法定期限：依据1952年EPF计划第72(7)条，公积金机构必须自受理之日起30天内完成审批。任何无理延误均构成法定违约。 [1]",
        "2. EPFO官方KYC通达明令禁止据此驳回：EPFO官方纠错通达明确规定，若公积金会员姓名仅存在首字母、后缀或轻微拼写差异，且身份证明确无误，绝不得作为驳回申请之理由。Aadhaar [AADHAAR_1]、PAN [PAN_1]及UAN [UAN_1]已充分证实同一身份。 [2]",
        "3. 补正机制：本人正式附上由雇主与会员共同签署之联合声明（Joint Declaration），完全消除了驳回决定的所有事实前提。 [3]",
        "4. 支付请求：依据1952年EPF计划第69(2)条，请求立即向本人发放全部公积金累计余额 ₹1,84,500。 [1]",
      ],
      signoff: "此致，\n\n[PERSON_1]\nUAN [UAN_1] · PAN [PAN_1] · Aadhaar [AADHAAR_1]\n[PHONE_1] · [EMAIL_1]\n日期：2026年10月27日",
    },
    eu261: {
      salutation: "致：西班牙伊比利亚航空（Iberia）旅客投诉管理部\n事由：依据欧盟EC 261/2004法规第7条正式索赔400欧元法定赔偿金 — 航班IB3675（延误5小时22分）",
      paragraphs: [
        "尊敬的负责人：关于柏林勃兰登堡（BER）飞往马德里（MAD）的IB3675次航班严重延误一事，本人依据欧洲议会和欧盟理事会第 (EC) 261/2004 号法规第7条，正式提出400欧元的法定延误赔偿请求。 [1]",
        "1. 航班实际延误达5小时22分，远超法定3小时门槛，航程约1,860公里适用第7(1)(b)条400欧元标准。 [1]",
        "2. 依据欧盟法院既判判例（C-549/07 Wallentin-Hermann案），“机组排班轮换”不构成免责之“非凡情况”。举证责任在承运人，贵司未出具任何法定证据。 [2]",
        "3. 限贵司于本函发出之日起14日内完成赔付，逾期本人将立即向国家主管执行机构（NEB）投诉并提起小额诉讼催告程序。 [4]",
      ],
      signoff: "此致，\n\n[PERSON_1]\n预订参考号：[PNR_1] · 日期：2026年10月27日",
    },
    deposit: {
      salutation: "致：Austin Property Management LLC 房屋管理公司\n事由：依据德克萨斯州财产法典 § 92.109 正式催告全额返还租房押金（$2,400）",
      paragraphs: [
        "尊敬的管理方：本函为根据德克萨斯州财产法典第92章发出的正式法律催告函，要求全额返还本人支付的 $2,400 租房保证金。 [1]",
        "1. 依据法典第92.109(a)条，法定30天退款及书面扣款明细期限已届满（交房日为2026年9月30日），至今未送达任何合法明细。 [1]",
        "2. 依据第92.109(c)条，逾期未还且未送达明细即依法推定为“恶意扣押（bad faith）”。在缺乏入住初检报告的前提下，所谓地毯损坏扣款在法律上完全无效。 [2]",
        "3. 本人限贵方于2026年11月26日前全额电汇 $2,400。若逾期未付，本人将向治安法院起诉追讨三倍赔偿金（$7,300）及 $100 惩罚金和全部律师费。 [2]",
      ],
      signoff: "此致，\n\n[PERSON_1]\n原租客 · 日期：2026年10月27日",
    },
  },
};

export default function OutputKit({
  mode,
  scenario,
  phase,
  onCitationClick,
  externalLang,
  onLanguageChange,
}: Props) {
  const done = phase === "done";
  const [lang, setLang] = useState<Lang>("en");
  const [copiedLetter, copyLetter] = useCopied();
  const [copiedPatch, copyPatch] = useCopied();
  const [copiedPacket, copyPacket] = useCopied();
  const [hoveredCite, setHoveredCite] = useState<number | null>(null);

  /* Synchronize with external language if provided */
  useEffect(() => {
    if (!externalLang) return;
    const clean = externalLang.toLowerCase();
    if (clean === "hi" || clean === "hindi") {
      setLang("hi");
    } else if (clean === "de" || clean === "german") {
      setLang("de");
    } else if (clean === "es" || clean === "spanish") {
      setLang("es");
    } else if (clean === "fr" || clean === "french") {
      setLang("fr");
    } else if (clean === "it" || clean === "italian") {
      setLang("it");
    } else if (clean === "pt" || clean === "portuguese") {
      setLang("pt");
    } else if (clean === "ar" || clean === "arabic") {
      setLang("ar");
    } else if (clean === "ja" || clean === "japanese") {
      setLang("ja");
    } else if (clean === "zh" || clean === "chinese") {
      setLang("zh");
    } else if (clean === "en" || clean === "english") {
      setLang("en");
    }
  }, [externalLang]);

  const switchLanguage = (newLang: Lang) => {
    setLang(newLang);
    onLanguageChange?.(newLang);
  };

  const activeLetterSource = useMemo(() => {
    if (lang !== "en" && MULTILINGUAL_LETTERS[lang as Exclude<Lang, "en">]?.[scenario.id]) {
      return MULTILINGUAL_LETTERS[lang as Exclude<Lang, "en">][scenario.id];
    }
    return scenario.letter;
  }, [scenario, lang]);

  const letterText = useMemo(
    () =>
      `${activeLetterSource.salutation}\n\n${activeLetterSource.paragraphs.join("\n\n")}\n\n${activeLetterSource.signoff}`,
    [activeLetterSource]
  );
  const hydratedLetter = useMemo(() => rehydrateLetter(letterText, scenario.id), [letterText, scenario.id]);

  const patchText = useMemo(
    () =>
      scenario.ownerPatch.diff
        .map((l) =>
          l.type === "add" ? `+${l.text}` : l.type === "del" ? `-${l.text}` : l.type === "hunk" ? l.text : ` ${l.text}`
        )
        .join("\n"),
    [scenario]
  );

  const packetText = useMemo(
    () =>
      [
        `NIRVAXIS — Zero-PII Owner Diagnostic Packet`,
        `Packet: OR-${scenario.id.toUpperCase()}-OWNER-01 · Build seal 6BA95F54`,
        `Severity: ${scenario.ownerPatch.severity}`,
        `Failure class: ${scenario.ownerPatch.failureClass}`,
        `False-negative exposure: ${scenario.ownerPatch.predictedLift}`,
        `Blast radius: ${scenario.ownerPatch.anonymizedReports.toLocaleString()} anonymized cases`,
        ``,
        `ROOT CAUSE`,
        scenario.ownerPatch.rootCause,
        ``,
        `COUNTERFACTUAL`,
        scenario.ownerPatch.counterfactual,
        ``,
        `ANONYMIZED EVENT SIGNALS (Bayesian weights)`,
        ...scenario.ownerPatch.signals.map((s) => `  • ${s.label}  (weight ${s.weight.toFixed(2)})`),
        ``,
        `RECOMMENDED PATCH → ${scenario.ownerPatch.file}`,
        scenario.ownerPatch.patchSummary,
        ``,
        patchText,
      ].join("\n"),
    [scenario, patchText]
  );

  const downloadICS = () => {
    const ics = buildICS({
      summary: `NIRVAXIS — ${scenario.icsTitle} (${scenario.jurisdiction})`,
      description: `Auto-generated deadline artifact. ${scenario.amountNote}. Filing-ready appeal kit sealed by the red-team officer loop. Do not miss this date.`,
      location: scenario.jurisdiction,
      deadlineISO: scenario.deadlineDate,
    });
    downloadFile(`nirvaxis-${scenario.id}-deadline.ics`, ics, "text/calendar");
  };

  const downloadLetter = () =>
    downloadFile(`nirvaxis-${scenario.id}-appeal.txt`, hydratedLetter, "text/plain");

  const i18n = I18N[lang] || I18N.en;
  const t = scenario.telemetry;
  const totalCost = t.nanoCost + t.superCost + t.ultraCost;
  const totalMs = t.nano + t.super + t.ultra;

  const LANG_META: { id: Lang; label: string; name: string; native: string; flag: string; badge?: string }[] = [
    { id: "en", label: "EN", name: "English", native: "English", flag: "🌐" },
    { id: "hi", label: "हिन्दी", name: "Hindi", native: "हिन्दी · Ultra 550B", flag: "🇮🇳", badge: "ULTRA" },
    { id: "de", label: "DE", name: "Deutsch", native: "Deutsch", flag: "🇩🇪" },
    { id: "es", label: "ES", name: "Español", native: "Español", flag: "🇪🇸" },
    { id: "fr", label: "FR", name: "Français", native: "Français", flag: "🇫🇷" },
    { id: "it", label: "IT", name: "Italiano", native: "Italiano", flag: "🇮🇹" },
    { id: "pt", label: "PT", name: "Português", native: "Português", flag: "🇵🇹" },
    { id: "ar", label: "AR", name: "العربية", native: "العربية", flag: "🇦🇪" },
    { id: "ja", label: "JA", name: "日本語", native: "日本語", flag: "🇯🇵" },
    { id: "zh", label: "ZH", name: "中文", native: "中文", flag: "🇨🇳" },
  ];

  /* Active Summary Text Resolution */
  const activeSummaryText = useMemo(() => {
    if (lang === "hi") return scenario.summaries.hiNative || scenario.summaries.hi || scenario.summaries.en;
    if (lang === "de") return scenario.summaries.de || scenario.summaries.en;
    if (lang === "es") return scenario.summaries.es || scenario.summaries.en;
    if (lang === "fr") return scenario.summaries.fr || scenario.summaries.en;
    if (lang === "it") return scenario.summaries.it || scenario.summaries.en;
    if (lang === "pt") return scenario.summaries.pt || scenario.summaries.en;
    if (lang === "ar") return scenario.summaries.ar || scenario.summaries.en;
    if (lang === "ja") return scenario.summaries.ja || scenario.summaries.en;
    if (lang === "zh") return scenario.summaries.zh || scenario.summaries.en;
    return scenario.summaries.en;
  }, [scenario, lang]);

  return (
    <section className="panel flex h-full min-h-0 flex-col overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2.5 bg-slate-900/40">
        <div className="flex items-center gap-2">
          {mode === "citizen" ? <Scale size={13} className="text-lime-400" /> : <Building2 size={13} className="text-cyan-400" />}
          <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-200">
            {mode === "citizen" ? i18n.outputKitTitle : "Dual Output · Owner Diagnostic Packet"}
          </h2>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono-t text-[7.5px] font-bold tracking-widest ${
            done ? "border-lime-400/40 bg-lime-400/10 text-lime-300" : "border-slate-800 text-slate-500"
          }`}
        >
          <ShieldCheck size={9} /> {done ? "SEALED & READY" : "AWAITING RUN"}
        </span>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-3 space-y-3">
        {mode === "citizen" ? (
          <>
            {/* ── CITIZEN · LETTER ON WARM PAPER ─────────────────────────── */}
            <div className="paper-card relative overflow-hidden p-4 shadow-xl">
              {/* Paper masthead */}
              <div className="mb-2.5 flex items-center justify-between border-b border-stone-300/80 pb-2">
                <div>
                  <p className="font-serif-l text-[9.5px] font-semibold uppercase tracking-[0.28em] text-stone-700">
                    {i18n.paperTitle}
                  </p>
                  <p className="font-mono-t text-[7px] uppercase tracking-widest text-stone-500">
                    {i18n.paperSubtitle}
                  </p>
                </div>

                {/* Active Language Badge (Synced Globally with Header) */}
                <div className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-100/90 px-2.5 py-1 text-stone-700 shadow-sm" title="Controlled globally from top master header">
                  <Languages size={10} className="text-stone-500" />
                  <span className="font-mono-t text-[8px] font-bold uppercase tracking-wider text-stone-700">
                    {LANG_META.find((l) => l.id === lang)?.flag} {LANG_META.find((l) => l.id === lang)?.name}
                  </span>
                </div>
              </div>

              {/* Letter body — hydrated serif print */}
              <div
                className={`letter-doc ${lang === "hi" ? "font-deva" : ""} ${lang === "ar" ? "text-right font-sans" : ""}`}
                dir={lang === "ar" ? "rtl" : "ltr"}
                onMouseLeave={() => setHoveredCite(null)}
              >
                <p className="font-semibold text-stone-900">{activeLetterSource.salutation}</p>
                {activeLetterSource.paragraphs.map((p, i) => (
                  <p key={i} className={i === 0 ? "font-semibold" : ""}>
                    {renderWithCitations(p, scenario.citations, onCitationClick, setHoveredCite)}
                  </p>
                ))}
                <p className="whitespace-pre-line font-medium text-stone-900">{activeLetterSource.signoff}</p>
              </div>

              {/* Citation footnote rail */}
              <div className="mt-3 border-t border-stone-300/80 pt-1.5">
                <p className="font-mono-t text-[6.5px] uppercase tracking-[0.25em] text-stone-500">
                  {i18n.sourcesVerified}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {scenario.citations.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => onCitationClick(c.url)}
                      className="group font-mono-t text-[6.5px] text-stone-600 transition-colors hover:text-cyan-700"
                    >
                      [{c.id}]{" "}
                      <span className="underline decoration-dotted underline-offset-2">
                        {c.source.split("—")[0].trim().slice(0, 52)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {hoveredCite && (
                <div className="pointer-events-none absolute bottom-2 right-2 rounded-md border border-cyan-700/40 bg-cyan-50 px-2 py-1 font-mono-t text-[6.5px] font-bold text-cyan-800 shadow">
                  Citing source [{hoveredCite}] — click marker in text to open
                </div>
              )}
            </div>

            {/* ── ACTION ROW: downloads ──────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={downloadLetter}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-lime-400/35 bg-lime-400/10 px-2 py-2 font-mono-t text-[8px] font-bold uppercase tracking-widest text-lime-300 transition-all hover:bg-lime-400/20 active:scale-95"
              >
                <FileDown size={11} /> {i18n.downloadTxt}
              </button>
              <button
                type="button"
                onClick={downloadICS}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-2 py-2 font-mono-t text-[8px] font-bold uppercase tracking-widest text-cyan-300 transition-all hover:bg-cyan-400/20 active:scale-95"
                title="Adds the statutory deadline to your calendar with alarm"
              >
                <CalendarClock size={11} /> {i18n.icsEvent}
              </button>
              <button
                type="button"
                onClick={() => copyLetter(hydratedLetter)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-2 font-mono-t text-[8px] font-bold uppercase tracking-widest text-slate-300 transition-all hover:border-slate-500 hover:text-white active:scale-95"
              >
                {copiedLetter ? <Check size={11} className="text-lime-400" /> : <Copy size={11} />} {copiedLetter ? i18n.copiedBtn : i18n.copyBtn}
              </button>
            </div>

            {/* ── PLAIN-LANGUAGE SUMMARY (Synced to Global Language) ─────────────────────────── */}
            <div className="panel-inset p-3 bg-slate-900/60 border border-slate-800">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono-t text-[8.5px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  <Languages size={11} className="text-cyan-400" /> {i18n.summaryTitle}
                </span>
                <span className="font-mono-t text-[7px] text-lime-400 font-semibold">
                  {lang === "hi"
                    ? "NATIVE HINDI · ULTRA 550B"
                    : lang === "de"
                    ? "GERMAN · SUPER 120B"
                    : lang === "es"
                    ? "SPANISH · SUPER 120B"
                    : lang === "fr"
                    ? "FRENCH · SUPER 120B"
                    : lang === "it"
                    ? "ITALIAN · SUPER 120B"
                    : lang === "pt"
                    ? "PORTUGUESE · SUPER 120B"
                    : lang === "ar"
                    ? "ARABIC · SUPER 120B"
                    : lang === "ja"
                    ? "JAPANESE · SUPER 120B"
                    : lang === "zh"
                    ? "CHINESE · SUPER 120B"
                    : "ENGLISH · VERIFIED GROUNDING"}
                </span>
              </div>

              {/* Dynamic Summary Card */}
              <div className="rounded-lg border border-slate-800/80 bg-black/40 p-3">
                <p
                  className={`text-[10.5px] leading-relaxed text-slate-200 ${lang === "hi" ? "font-deva text-[11px]" : ""} ${
                    lang === "ar" ? "text-right font-sans" : ""
                  }`}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                >
                  {activeSummaryText}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── OWNER · ROOT-CAUSE CARD ────────────────────────────────── */}
            <div className="panel-inset overflow-hidden border border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between border-b border-slate-800/70 bg-cyan-400/5 px-3 py-2">
                <span className="flex items-center gap-2 font-mono-t text-[8.5px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                  <Code2 size={11} /> Zero-PII Root-Cause Analysis
                </span>
                <span className="rounded border border-rose-400/40 bg-rose-400/10 px-1.5 py-0.5 font-mono-t text-[7px] font-bold text-rose-400">
                  {scenario.ownerPatch.severity} · CLUSTER
                </span>
              </div>
              <div className="p-3">
                <p className="font-mono-t text-[7px] uppercase tracking-[0.25em] text-slate-500">Failure class</p>
                <p className="mt-0.5 font-display text-[11px] font-extrabold leading-snug text-slate-100">
                  {scenario.ownerPatch.failureClass}
                </p>

                <p className="mt-2.5 font-mono-t text-[7px] uppercase tracking-[0.25em] text-slate-500">Root cause</p>
                <p className="mt-0.5 font-serif-l text-[9.5px] leading-snug text-slate-300">{scenario.ownerPatch.rootCause}</p>

                {/* Signal weights */}
                <p className="mt-2.5 font-mono-t text-[7px] uppercase tracking-[0.25em] text-slate-500">
                  Anonymized event signals (Bayesian weights)
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {scenario.ownerPatch.signals.map((s) => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[8px] text-slate-400">{s.label}</span>
                        <span className="font-mono-t text-[8px] font-bold text-cyan-300">{(s.weight * 100).toFixed(0)}%</span>
                      </div>
                      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-lime-400"
                          style={{ width: `${s.weight * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Counterfactual */}
            <div className="panel-inset p-3 border border-slate-800 bg-slate-900/40">
              <p className="font-mono-t text-[7px] uppercase tracking-[0.25em] text-slate-500">Counterfactual Replay</p>
              <p className="mt-1 text-[9.5px] leading-relaxed text-slate-300">{scenario.ownerPatch.counterfactual}</p>
            </div>

            {/* Code patch diff */}
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0a0e1c]">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-3 py-1.5">
                <span className="flex min-w-0 items-center gap-1.5 font-mono-t text-[8px] text-slate-300 truncate">
                  <GitCommitHorizontal size={10} className="shrink-0 text-cyan-400" />
                  <span className="truncate">{scenario.ownerPatch.file.split("/").pop()}</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyPatch(patchText)}
                  className="rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 font-mono-t text-[7px] font-bold text-slate-300 hover:text-white"
                >
                  {copiedPatch ? "COPIED" : "COPY PATCH"}
                </button>
              </div>
              <pre className="scroll-slim max-h-44 overflow-auto p-0 font-mono-t text-[8.5px] leading-[1.72]">
                {scenario.ownerPatch.diff.map((l, i) => (
                  <div
                    key={i}
                    className={`flex whitespace-pre px-3 ${
                      l.type === "add" ? "diff-add" : l.type === "del" ? "diff-del" : l.type === "hunk" ? "diff-hunk" : "diff-ctx"
                    }`}
                  >
                    <span className="w-4 shrink-0 select-none text-slate-600">{l.type === "add" ? "+" : l.type === "del" ? "-" : " "}</span>
                    <span>{l.text}</span>
                  </div>
                ))}
              </pre>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => downloadFile(`or-${scenario.id}-patch.diff`, patchText, "text/plain")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-2 py-2 font-mono-t text-[8px] font-bold uppercase tracking-widest text-cyan-300 transition-all hover:bg-cyan-400/20 active:scale-95"
              >
                <FileDown size={11} /> Download .diff
              </button>
              <button
                type="button"
                onClick={() => copyPacket(packetText)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-2 font-mono-t text-[8px] font-bold uppercase tracking-widest text-slate-300 transition-all hover:border-slate-500 hover:text-white active:scale-95"
              >
                {copiedPacket ? <Check size={11} className="text-lime-400" /> : <Copy size={11} />}{" "}
                {copiedPacket ? "Copied" : "Copy full packet"}
              </button>
            </div>
          </>
        )}

        {/* Telemetry Footer */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-800/70 pt-2 font-mono-t">
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2 text-center">
            <span className="text-[7px] text-slate-500 uppercase tracking-widest">Inference Wall Clock</span>
            <p className="mt-0.5 font-display text-[13px] font-extrabold text-slate-100">
              {(totalMs / 1000).toFixed(2)}
              <span className="text-[8px] text-slate-500">s</span>
            </p>
          </div>
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2 text-center">
            <span className="text-[7px] text-slate-500 uppercase tracking-widest">Nebius Cost Accounting</span>
            <p className="mt-0.5 font-display text-[13px] font-extrabold text-lime-400">${totalCost.toFixed(4)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function renderWithCitations(
  text: string,
  citations: Scenario["citations"],
  onCitationClick: (url: string) => void,
  onHover: (id: number | null) => void
) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, idx) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) return part;
    const cid = parseInt(match[1], 10);
    const cite = citations.find((c) => c.id === cid);
    return (
      <button
        type="button"
        key={idx}
        onMouseEnter={() => onHover(cid)}
        onMouseLeave={() => onHover(null)}
        onClick={() => cite && onCitationClick(cite.url)}
        className="cite cursor-pointer font-bold inline-block mx-0.5"
        title={cite ? `${cite.source} — ${cite.title}` : `Source [${cid}]`}
      >
        [{cid}]
      </button>
    );
  });
}
