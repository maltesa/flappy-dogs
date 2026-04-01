# Flappy Dogs

Dieses Projekt ist ein kleines Browser-Spiel ohne Build-Setup.
Ihr braucht fuer das Spiel selbst kein `npm install`.

## Was Papa einmal einrichten sollte

Diese Schritte sind fuer einen Windows-Rechner gedacht. Der einfachste Weg ist:

1. **Codex Desktop fuer Windows installieren**
2. **WSL installieren**, damit das Projekt in einer Linux-Umgebung laeuft
3. **Git und Python in WSL installieren**

So muss Papa `npm` nicht extra nur fuer Codex installieren.

OpenAI-Doku:

- [Codex auf Windows](https://developers.openai.com/codex/windows)
- [OpenAI Developers](https://developers.openai.com/)

### Einfache Einrichtung mit Codex Desktop

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

8. Codex Desktop installieren und mit dem OpenAI/ChatGPT-Account anmelden.

Danach kann Codex Desktop die Kommandos in eurem Projekt fuer euch ausfuehren.

## Projekt nach Hause klonen

Am einfachsten ist es, das Repo in WSL unter dem Linux-Home-Ordner zu speichern, nicht unter `C:\`.

Wenn ihr mit Codex arbeitet, koennt ihr Codex auch einfach den Repo-Link geben und zum Beispiel sagen:

- `Please clone https://github.com/maltesa/flappy-dogs.git into ~/code and help me run it.`
- `Open this repo and start the game locally: https://github.com/maltesa/flappy-dogs.git`

Dann kann Codex die noetigen Terminal-Kommandos in WSL fuer euch ausfuehren.

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

Am einfachsten ist Codex Desktop. Ihr koennt Codex einfach den Repo-Link oder den Projektordner geben und zum Beispiel schreiben:

- `Please open this repo and help me run the game: https://github.com/maltesa/flappy-dogs.git`
- `Please clone this repo into ~/code and run it for me: https://github.com/maltesa/flappy-dogs.git`
- `Please open /home/<euer-name>/code/flappy-dogs and help me add a new dog.`

Codex kann dann die noetigen Terminal-Kommandos fuer euch ausfuehren.

### Optional: Codex CLI statt Desktop

Nur wenn ihr lieber die Terminal-Version von Codex nutzen wollt, braucht ihr zusaetzlich Node und npm.

Dann im Projektordner:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
```

Neues WSL-Terminal oeffnen, dann:

```bash
nvm install 22
npm i -g @openai/codex
```

Und danach:

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

- Wenn ihr Codex Desktop benutzt, betrifft euch dieser letzte Punkt meist nicht. Dann ist die CLI gar nicht noetig.

## Wichtig

Arbeitet am besten immer in WSL unter `~/code/flappy-dogs`.
Das ist fuer Codex und VS Code auf Windows meist deutlich einfacher und schneller als ein Ordner unter `C:\`.
