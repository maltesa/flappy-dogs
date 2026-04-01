# Flappy Dogs

Dieses Projekt ist ein kleines Browser-Spiel ohne Build-Setup.
Ihr braucht kein `npm install` fuer das Spiel selbst.

## Anleitung fuer Linux Mint

Diese Anleitung ist fuer Linux Mint geschrieben.

Wichtig:
Nach meinem Check der offiziellen OpenAI-Doku gibt es aktuell eine Windows-Anleitung fuer Codex, aber ich finde dort keine eigene Desktop-GUI-Anleitung fuer Linux Mint.
Deshalb ist der einfachste sichere Weg auf Linux Mint: **Codex CLI im Terminal benutzen**.

OpenAI-Doku:
[https://developers.openai.com/codex/windows](https://developers.openai.com/codex/windows)

Falls ihr benachrichtigt werden wollt, wenn die Codex-App fuer Linux verfuegbar ist, koennt ihr euch hier eintragen:
[https://openai.com/de-DE/form/codex-app/](https://openai.com/de-DE/form/codex-app/)

## Was einmal eingerichtet werden sollte

Ihr braucht:

1. `git`
2. `python3`
3. `curl`
4. `node`
5. `npm`
6. `Codex CLI`

## Einfache Einrichtung

Oeffnet ein Terminal und installiert zuerst die benoetigten Pakete:

```bash
sudo apt update
sudo apt install -y git python3 curl
```

Dann installiert ihr Node mit `nvm`:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
```

Danach das Terminal einmal neu oeffnen und dann:

```bash
nvm install 22
```

Jetzt Codex installieren:

```bash
npm i -g @openai/codex
```

## Projekt klonen

```bash
mkdir -p ~/code
cd ~/code
git clone https://github.com/maltesa/flappy-dogs.git
cd flappy-dogs
```

## Noch einfacher mit Codex

Ihr koennt Codex auch einfach den Repo-Link geben und Codex die Kommandos ausfuehren lassen.

Zum Beispiel:

- `Bitte clone https://github.com/maltesa/flappy-dogs.git nach ~/code und hilf mir, das Spiel zu starten.`
- `Bitte oeffne dieses Repo und starte das Spiel lokal: https://github.com/maltesa/flappy-dogs.git`
- `Bitte oeffne /home/<euer-name>/code/flappy-dogs und hilf mir, einen neuen Hund einzubauen.`

## Spiel starten

Im Projektordner:

```bash
cd ~/code/flappy-dogs
python3 -m http.server 4173
```

Dann im Browser oeffnen:

[http://127.0.0.1:4173](http://127.0.0.1:4173)

## Codex starten

Im Projektordner:

```bash
cd ~/code/flappy-dogs
codex
```

## Weiterbauen mit Codex

Ihr koennt Codex einfach sagen, was ihr wollt.

Zum Beispiel:

- `Baue einen neuen Hund ein und fuege ihn im Auswahlmenue hinzu.`
- `Mach die Baelle kleiner und langsamer.`
- `Baue ein neues Power-up mit diesem Bild in /assets ein.`
- `Bitte teste das Spiel nach der Aenderung lokal.`

## Neueste Aenderungen holen

```bash
cd ~/code/flappy-dogs
git pull
```

## Eure Aenderungen speichern

```bash
cd ~/code/flappy-dogs
git status
git add .
git commit -m "feat: describe your change"
git push
```

Oder ihr sagt Codex:

- `Bitte committe und pushe meine Aenderungen mit einer Conventional-Commit-Message.`

## Wichtige Dateien

- `index.html` = Seite und Menues
- `styles.css` = Layout und Farben
- `game.js` = Spiellogik
- `assets/` = Bilder fuer Hunde, Wolken, Baelle und Power-ups

## Wenn etwas nicht klappt

- Wenn `python3` fehlt:

```bash
sudo apt install -y python3
```

- Wenn `git` fehlt:

```bash
sudo apt install -y git
```

- Wenn `codex` nicht gefunden wird:

```bash
node -v
npm -v
which codex
```

## Wichtig

Arbeitet am besten in `~/code/flappy-dogs`.
