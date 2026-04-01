# Flappy Dogs

Dieses Projekt ist ein kleines Browser-Spiel ohne Build-Setup.
Ihr braucht fuer das Spiel selbst kein `npm install`.

## Was Papa einmal einrichten sollte

Diese Schritte sind fuer einen Windows-Rechner mit WSL gedacht, weil das laut OpenAI der einfachste Weg ist, Codex auf Windows zu nutzen:

1. Windows Terminal oder PowerShell **als Administrator** oeffnen.
2. WSL installieren:

```powershell
wsl --install
```

3. Den Rechner neu starten, falls Windows darum bittet.
4. Ubuntu in WSL fertig einrichten.
5. VS Code installieren.
6. In VS Code die Erweiterung **WSL** installieren.
7. In WSL diese Pakete installieren:

```bash
sudo apt update
sudo apt install -y git python3 curl
```

8. Node in WSL installieren:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
```

Danach ein neues WSL-Terminal oeffnen und dann:

```bash
nvm install 22
```

9. Codex in WSL installieren:

```bash
npm i -g @openai/codex
```

Offizielle OpenAI-Anleitung fuer Codex auf Windows:
[https://developers.openai.com/codex/windows](https://developers.openai.com/codex/windows)

## Projekt nach Hause klonen

Am einfachsten ist es, das Repo in WSL unter dem Linux-Home-Ordner zu speichern, nicht unter `C:\`.

```bash
mkdir -p ~/code
cd ~/code
git clone https://github.com/maltesa/flappy-dogs.git
cd flappy-dogs
```

Wenn das Repo privat ist und HTTPS nicht klappt, muss Papa GitHub-Zugang oder einen SSH-Key einrichten.

## Das Projekt in VS Code oeffnen

Immer **aus WSL heraus** starten:

```bash
cd ~/code/flappy-dogs
code .
```

In VS Code sollte unten links `WSL: Ubuntu` oder etwas Aehnliches stehen.

## Vor dem Loslegen den neuesten Stand holen

```bash
cd ~/code/flappy-dogs
git pull
```

## Das Spiel starten

Im Projektordner:

```bash
cd ~/code/flappy-dogs
python3 -m http.server 4173
```

Dann im Browser oeffnen:

[http://127.0.0.1:4173](http://127.0.0.1:4173)

## Mit Codex weiterbauen

Im Projektordner:

```bash
cd ~/code/flappy-dogs
codex
```

Dann koennt ihr Codex zum Beispiel so etwas schreiben:

- `Add a new dog and let me choose it in the menu.`
- `Make the balls smaller and slower.`
- `Add a new power-up with this image in /assets.`
- `Please test the game locally after the change.`

## Welche Dateien wichtig sind

- `index.html` = die Seite und die Menues
- `styles.css` = Farben, Layout und Buttons
- `game.js` = die komplette Spiellogik
- `assets/` = Hunde, Wolken, Baelle und Power-ups

## Typischer Ablauf fuer euch

1. Repo in WSL oeffnen.
2. `python3 -m http.server 4173` starten.
3. `codex` starten.
4. Codex sagen, was ihr aendern wollt.
5. Browser neu laden und ausprobieren.

## Eure Aenderungen speichern

Wenn ihr etwas Cooles gebaut habt:

```bash
cd ~/code/flappy-dogs
git status
git add .
git commit -m "feat: describe your change"
git push
```

Oder ihr sagt Codex einfach:

- `Please commit and push my changes with a conventional commit message.`

## Wenn etwas nicht klappt

- Wenn `code .` nicht funktioniert, in VS Code `WSL: Reopen Folder in WSL` ausfuehren.
- Wenn `python3` fehlt, in WSL nochmal ausfuehren:

```bash
sudo apt install -y python3
```

- Wenn `git` fehlt:

```bash
sudo apt install -y git
```

- Wenn `codex` nicht gefunden wird, zuerst pruefen:

```bash
node -v
npm -v
codex
```

## Wichtig

Arbeitet am besten immer in WSL unter `~/code/flappy-dogs`.
Das ist fuer Codex und VS Code auf Windows meist deutlich einfacher und schneller als ein Ordner unter `C:\`.
