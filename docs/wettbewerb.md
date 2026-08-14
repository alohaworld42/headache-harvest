# Wettbewerb und Positionierung

Stand: August 2026. Recherchebasis am Ende des Dokuments.

## Der Markt

Kopfschmerz- und Migräne-Tagebücher sind ein gut besetzter Markt. Die Stiftung Warentest
hat 2022 sechzehn Apps mit Tagebuchfunktion geprüft und **keiner davon eine bessere Note
als „befriedigend"** gegeben; die besten waren *M-sense Migräne* und *Kopfschmerzwissen*
mit jeweils 2,6.

Geprüft wurde nach: Nutzerfreundlichkeit, Umfang des Tagebuchs, Information über
Kopfschmerzen, Warnung vor Medikamentenübergebrauch, Datenschutz und Wirksamkeitsnachweis.

Als Hauptgründe für die schwachen Noten nennt der Test zwei Punkte:

1. **Fehlende Anamnese-Daten** — Vorerkrankungen, Dauermedikation, Arbeitsumstände werden
   von den meisten Apps gar nicht erhoben.
2. **Fehlender wissenschaftlicher Wirksamkeitsnachweis.**

## Die Mitbewerber

| App | Modell | Stärke | Schwäche |
| --- | --- | --- | --- |
| **Migraine Buddy** | kostenlos, Premium 12,99 $/Monat bzw. 89,99 $/Jahr | Größte Nutzerbasis, sehr detaillierte Erfassung, klinische Exporte | Teuer; teilt aggregierte Nutzerdaten mit Pharma- und Forschungspartnern; Konto erforderlich |
| **M-sense Migräne** | Freemium | Testsieger-Niveau, gute Analyse, Entspannungsübungen | Therapiemodule kostenpflichtig |
| **Die Migräne App** (Schmerzklinik Kiel) | kostenlos | Umfangreiches Fachwissen, Entspannung gratis | Dokumentation weniger tief |
| **sinCephalea** | DiGA, **auf Kassenrezept** (PZN 18358966) | Kosten trägt die gesetzliche Krankenkasse | Kein Tagebuch im engeren Sinn, sondern Ernährungsintervention über Blutzucker |
| **DMKG-App** | kostenlos, von der Fachgesellschaft | Wissenschaftliche Legitimation, Kopfschmerzregister | Kein kommerzielles Produkt |
| **Bearable** | Freemium | Sehr flexibles Symptom-Tracking über Migräne hinaus | Export nur CSV, keine arzttauglichen PDFs; Null-Werte fehlen im Export |
| **Migraine Trail** | kostenlos (iOS) | Spracheingabe, klinisches PDF auf einen Tap | Nur iOS |

## Wo Schmerzverlauf steht

**Klarer Vorsprung — Datenschutz.** Alle Wettbewerber sind Konto- und Server-basiert.
Migraine Buddy teilt aggregierte Daten mit Pharmapartnern. Schmerzverlauf speichert
ausschließlich lokal, hat kein Konto, keinen Tracker und lädt nicht einmal Web-Fonts
nach. Das ist bei Gesundheitsdaten nach Art. 9 DSGVO ein echtes und schwer kopierbares
Verkaufsargument — und war im Warentest ein eigenes Prüfkriterium.

**Klarer Vorsprung — Preis.** Migraine Buddy verlangt 89,99 $ pro Jahr. Ein Einmalkauf im
Bereich von 15–20 € ist dagegen leicht zu entscheiden und passt zum Betriebsmodell ohne
laufende Serverkosten.

**Gleichauf.** Erfassungstiefe, Auslöser-Analyse, Arztbericht. Die Warnung vor
Medikamenten-Übergebrauch nach ICHD-3 haben längst nicht alle Wettbewerber — das war ein
eigenes Testkriterium.

**Lücken, bereits geschlossen.**
- *Anamnese* (Hauptkritik des Warentests): Vorerkrankungen, Dauermedikation, Beruf,
  Familienanamnese, Beschwerden seit — erscheinen jetzt im Arztbericht.
- *Schmerzcharakter*: Der DMKG-Kopfschmerzkalender fragt „pulsierend/stechend" gegen
  „dumpf/drückend" ab, weil das Migräne von Spannungskopfschmerz trennt. War vorher gar
  nicht erfassbar, ist jetzt eigenes Feld und eigene Spalte im Bericht.

**Lücken, noch offen.**
- *Validierte Fragebögen*: MIDAS und HIT-6 sind Teil des DMKG-Kopfschmerzfragebogens und
  das, was Neurolog:innen als Verlaufsmaß erwarten. Wäre das stärkste Einzel-Feature für
  den Arztbericht und ein gutes Pro-Argument.
- *Wissensteil*: „Information über Kopfschmerzen" ist ein Warentest-Kriterium, das die App
  aktuell mit null Punkten verlässt.
- *Wirksamkeitsnachweis*: ohne Studie nicht erreichbar — als Einzelprodukt realistisch
  nicht zu schließen und kein Grund, es zu versuchen.
- *Plattform*: alle relevanten Wettbewerber sind native Apps in den Stores. Schmerzverlauf ist
  eine installierbare PWA; das spart Store-Gebühren und Review-Zyklen, kostet aber
  Sichtbarkeit.

## Was der DMKG-Kalender abfragt

Der Kopfschmerzkalender der Deutschen Migräne- und Kopfschmerzgesellschaft ist das
Formular, das deutsche Ärzt:innen kennen. Pro Tag:

Auslöser (codiert 1–6) · Stärke 0–10 · Dauer in Stunden · **Schmerzart und Ort**
(pulsierend/stechend, dumpf/drückend, einseitig, beidseitig) · Vorboten (F Flimmersehen,
G Gefühlsstörung, S Sprachstörung) · Begleitsymptome (Erbrechen, Übelkeit, Lärmscheu,
Lichtscheu, Geruchsempfindlichkeit) · Medikament (A/B/C vorab definiert) · Anzahl der
Einheiten · Wirkung (Ja/Nein/Wenig)

Schmerzverlauf deckt das inzwischen vollständig ab bis auf die *Anzahl der Einheiten* — dort wird
stattdessen die Dosis in mg erfasst, was für die Übergebrauchs-Erkennung ausreicht.

## Empfohlene Positionierung

> Das Kopfschmerz-Tagebuch, das deine Daten nicht anfasst. Einmal zahlen, keine
> Cloud, kein Konto — und ein Arztbericht, der dem DMKG-Kalender folgt.

Zielgruppe sind datenschutzsensible Betroffene im deutschsprachigen Raum, die von
Abo-Apps abgeschreckt sind. Das ist eine Nische, aber eine, in der die Konkurrenz
strukturell nicht folgen kann, ohne ihr Geschäftsmodell aufzugeben.

## Quellen

- [Stiftung Warentest: Kopfschmerz- und Migräne-Apps im Test](https://www.test.de/Kopfschmerz-und-Migraene-Apps-im-Test-Digitale-Schmerzbegleiter-5909363-0/)
- [PTAheute: Stiftung Warentest prüft 16 Apps mit Kopfschmerztagebuchfunktion](https://www.ptaheute.de/aktuelles/2022/09/12/wie-empfehlenswert-sind-apps-bei-kopfschmerzen)
- [Apotheken Umschau: Kopfschmerz-Apps höchstens befriedigend](https://www.apotheken-umschau.de/e-health/stiftung-warentest-kopfschmerz-apps-hoechstens-befriedigend-898685.html)
- [Migraine Buddy – Privacy Policy](https://migrainebuddy.com/privacy-policy/)
- [Migraine Trail vs Migraine Buddy](https://migrainetrail.com/blog/migraine-trail-vs-migraine-buddy)
- [DMKG – Downloads für Patient:innen](https://www.dmkg.de/patienten/downloads-und-studien/)
- [DMKG-Kopfschmerzkalender (PDF)](https://www.dmkg.de/assets/uploads/dateien/kopfschmerzkalender-deutsch-18.3.2021-name.pdf)
- [Der neue DMKG-Kopfschmerzfragebogen](https://www.dmkg.de/news/der-neue-dmkg-kopfschmerzfragebogen/)
- [sinCephalea – DiGA-Informationen](https://sincephalea.de/diga-informationen/)
- [M-sense](https://m-sense.de/)
