# Vorlage Projektstruktur & Dokumente

Das Repository enthält die Vorlage einer Projektstruktur und Template-Dokumente
im AsciiDoc-Format. Dies wird für die Bearbeitung der Belegarbeit in Software
Engineering I und II benötigt. Im Detail sind das:

- Projektstruktur anhand
- Templates der benötigten Dokumente (AsciiDoc-Format)
- Vorlage für die Belegabgabe in SE I (AsciiDoc-Format)

> [!NOTE]
> Dieses Repository enthält keinen Code.

**Inhaltsverzeichnis**

- [Projektstruktur](#projektstruktur)
- [Dokumentvorlagen](#dokumentvorlagen)
- [Hinweise zu den AsciiDoc-Vorlagen](#hinweise-zu-den-asciidoc-vorlagen)
- [Belegabgabe in SE I](#belegabgabe-in-se-i)
- [Lizenz](#lizenz)

## Projektstruktur

Die Projektstruktur im Verzeichnis **docs** orientiert sich an den wesentlichen Aspekten im Software Engineering und den für die <ins>Abgabe im SE 1 Beleg</ins> geforderten Dokumenten.

```text
docs
├── _includes
│   └── default-attributes.inc.adoc
├── architecture
│   └── architecture_notebook.adoc
├── deployment
├── development
│   └── design.adoc
├── environment
├── project_management
│   └── project_plan.adoc
├── requirements
│   ├── glossary.adoc
│   ├── ux-concept.adoc
│   └── vision.adoc
└── test
    └── test_cases.adoc
```

## Dokumentvorlagen

Dieses Repository enthält Vorlagen im AsciiDoc-Format zur Dokumentation der verschiedenen Arbeitsergebnisse. Sie sind vereinfachte Varianten der Vorlagen aus dem Open Unified Process, Version 1.5.

### Hinweis

Falls Sie Fehler korrigieren oder Verbesserungen machen möchten, können Sie
dies gern über einen _Pull Request_ tun.

## Hinweise zu den AsciiDoc-Vorlagen

Die Datei _default-attributes.inc.adoc_ im **docs/\_includes** Verzeichnis
enthält die gemeinsamen Dokumentenattribute für alle AsciiDoc-Dokumente. In
jedem Dokument selbst können, nach dem include der Datei, entsprechend noch
extra benötigte Attribute mit aufgenommen werden.

### Projektname und Systemname definieren

In der _default-attributes.inc.adoc_ Datei ist am Anfang der **Projektname**
und der **Systemname** als Attribute global definiert. Diese können über
`{project-name}` und `{project-system-name}` in der Dokumentation an beliebiger
Stelle verwendet werden.

- **Projektname** `:project-name:`: Enthält das Belegthema inklusive der Projekt-ID
- **Systemname** `:project-system-name:`: Enthält den Systemnamen der Software

```asciidoc
// Meta
:project-name: FinanzTracker (T1C)
:project-system-name: FinApp
```

- `T` ... steht als Platzhalter für `I` ein internes bzw. `E` für ein externes Projektthema
- `<Platzhalter>` ... die Platzhalter inkl. der `<` und `>` ersetzen

### Bilder und Diagramme einbinden

In dem Dokumentenattribut `:imagesdir: images` ist das Standardverzeichnis
**images** für die Bilder festgelegt. Somit reicht es, in den jeweiligen
Dokumenten, die Bilder ohne Angabe des **images** Verzeichnis einzubinden:

```asciidoc
// vision.adoc
image::example.jpg[Beispielbild]
```

In dem Dokumentenattribut `:plantumlsdir: plantuml` ist das Standardverzeichnis
**plantuml** für die Diagramme in plantUML-Notation festgelegt. Im
Dokumentenattribut `:diagramsdir: diagrams` ist das Verzeichnis für die
generierten Diagramme angegeben, welches unter dem `:imagesdir:` angelegt
wird.

```asciidoc
requirements
├── images
│   ├── diagrams
│   │   └── diagram.jpg
│   └── example.jpg
├── plantuml
│   └── diagram.puml
├── ...
└── vision.adoc
```

## Belegabgabe in SE I

Im Verzeichnis **belegabgabe_se1** finden Sie die Vorlagedatei
_se1_belegabgabe_t00.adoc_, welche alle Ihre erzeugten Dokumente für die Abgabe
als PDF in <ins>ein</ins> Dokument bündelt.

(Nutzen Sie nicht die Projektvorlage **Projektstruktur_OpenUP-Templates**,
kopieren sie sich die Vorlagedatei _se1_belegabgabe_t00.adoc_ in Ihr
Projektrepository)

Folgende Schritte sind für eine Belegabgabe durchzuführen:

1. Ändern Sie die Themennummer **t00** in der Vorlagedatei
   _se1_belegabgabe_t00.adoc_ in Ihre Themennummer (i01, i02, ..., e01, e02,
   ...).
2. Inhalt der Vorlagedatei anpassen:

   - Ist in Ihrem Projekt in der Datei
     _docs/\_includes/default-attributes.inc.adoc_ der Projektname im Attribut
     `:project-name:` nicht gesetzt bzw. nutzen Sie eine andere Struktur, können
     Sie im Dokumententitel nach dem `:` das `{project-name}` mit Ihrem
     Projektthema ersetzen:

     ```asciidoc
     // --- 1. Projektthema -------------------------
     = SE I - Belegabgabe: {project-name}
     ```

   - Tragen Sie **alle** Teammitglieder als Autoren ein:

     ```asciidoc
     // --- 2. Teammitglieder -----------------------
     Vorname Nachname <s00000@htw-dresden.de>; Vorname Nachname <s00000@htw-dresden.de>; ...
     ```

     > Lange Autorennamen (mehr als 3 Teile) in den Dokumentenattributen müssen
     > mit einem `_` (Unterstrich) zu einer Gruppe von Vor- bzw. Nachnamen
     > zusammengefasst werden. Es treten sonst Formatierungsfehler beim
     > erzeugen der HTML- oder PDF-Dokumente auf. Der `_` (Unterstrich) wird im
     > erzeugten Dokument nicht dargestellt.
     >
     > - `Vorname1_Vorname2 Nachname1_Nachname2 <mail@example.com>`
     > - `Vorname Nachname1_Nachname2_Nachname3 <mail@example.com>`

   - Tragen Sie als Versionsdatum Ihr **Abgabedatum** ein:

     ```asciidoc
     // --- 3. Abgabedatum --------------------------
     01. Januar 2020
     ```

   - Passen Sie bei abweichender Projektstruktur die **include-Pfade** und
     **Dateinamen** zu den einzelnen Dateien (_path/to/file.adoc_) an bzw.
     erweitern Sie es für zusätzliche Dokumente:

     ```asciidoc
     include::path/to/file.adoc[lines=1..1;4..-1,leveloffset=+1]
     ```

     > Beim `include` wird über die `lines=1..1;4..-1` Angabe jeweils die 1.
     > und alles ab der 4. Zeile übernommen. Jedes Dokument ist eigenständig
     > und somit werden über die Zeilen 2 und 3 die jeweiligen Autoren und das
     > Versionsdatum nicht mit übernommen.

3. Erzeugen Sie das Abgabe-PDF _*se1_belegabgabe_t00.pdf*_ ([Hinweise aus dem Praktikum](https://www.informatik.htw-dresden.de/~zirkelba/praktika/se/arbeiten-mit-git-und-asciidoc/praktikumsaufgaben-teil-02.html#_2_generieren_des_ausgabeformates)):

   ```sh
   asciidoctor-pdf se1_belegabgabe_t00.adoc
   ```

   ```sh
   # mit PlantUML
   asciidoctor-pdf -r asciidoctor-diagram se1_belegabgabe_t00.adoc
   ```

   oder:

   ```sh
   asciidoctor -r asciidoctor-pdf -b pdf se1_belegabgabe_t00.adoc
   ```

   ```sh
   # mit PlantUML
   asciidoctor -r asciidoctor-diagram -r asciidoctor-pdf -b pdf se1_belegabgabe_t00.adoc
   ```

4. Prüfen Sie, dass das korrekte **Projektthema**, alle **Teammitglieder** und
   das **Abgabedatum** auf dem Deckblatt stehen und dass ebenfalls alle
   erforderlichen **Dokumente** mit ihren Inhalten enthalten sind.

5. Geben Sie das finale Abgabe-PDF _*se1_belegabgabe_t00.pdf*_ über den
   mitgeteilten Weg ab.

## Lizenz

### Dokumentation

Die Templates im Ordner `docs` und `belegabgabe_se1` unterliegen der
[CC-BY-4.0](https://choosealicense.com/licenses/cc-by-4.0/) Lizenz.

## Quick Dev Setup

Wir benutzen `pnpm` + monorepo bitte stellen sie also sicher das `pnpm` installiert ist. Dafür können sie die Anleitung von pnpm [hier](https://pnpm.io/installation) nachlesen.

Dependencies installieren: `pnpm i` (im root dir) 

- möglicher weise muss noch im backend also `cd src/backend` prisma generiert werden mit `pnpm prisma generate`

- Backend starten: `pnpm dev:backend` bzw `cd src/backend && pnpm dev`
- Frontend starten: `pnpm dev:frontend` bzw `cd src/frontend && pnpm dev`
- oder beides: `pnpm dev` (im root dir) Frontend auf `http://localhost:3000` und Backend auf `http://localhost:3111` (im root dir)

Dependencies hinzufügen für explicit backend/frontend: `pnpm add --filter <backend|frontend> <package-name>` bzw `cd src/backend|frontend && pnpm add <package-name>`

### Quellcode / Anderes

Für das Repository bzw. die entstehende Software kann/muss eine separate Lizenz
festgelegt werden.
