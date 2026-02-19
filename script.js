// ==========================================
// 1. DEL: KONSTANTE, SPREMENLJIVKE IN OSNOVE (1/3)
// ==========================================

console.log("Preverjam bazo:", typeof dxcc !== 'undefined' ? "Najdena!" : "Ni je!");

const input = document.getElementById('command-input');
const displayText = document.getElementById('display-text');
const output = document.getElementById('output');
const terminal = document.getElementById('terminal');

let history = [];
let historyIndex = -1;
let currentFreq = "145.500"; 
let currentMode = "FM"; // Popravljeno: dodana začetna vrednost

const jokes = [
    "Electrical Engineers only strip to make ends meet.",
    "What's ham radio called in italian?\nRadioprosciutto.",
    "Did you hear about the two antennas that got married?\nThe ceremony wasn't much, but the reception was great!",
    "Old hams don’t die, they just become better grounded.",
    "The dummy load is between the chair and the microphone...",
    "Never trust an electrical engineer without eyebrows."
];
const commands = {
    "help": (arg) => {
        // --- POMOČ ZA RADIOAMATERJE ---
        if (arg === "ham") {
            return `📡 [S5-HAM] RADIOAMATERSKI UKAZI:
-----------------------------------------------------------
log [klic] [s] [r] (ref) - Zabeleži zvezo v dnevnik.
showlog    - Prikaže vse shranjene zveze.
export     - Prenese dnevnik v ADIF formatu (za QRZ/eQSL).
clearlog   - Izbriše vse zapise v dnevniku.
prefix [iskanje] - DXCC info (npr. 'prefix s5' ali 'prefix italy').
q [koda]   - Pomen Q-kod (npr. 'q qth'). Brez arg za seznam.
rpt [niz]  - Iskanje repetitorjev (npr. 'rpt nanos' ali 'rpt 2m').
phonetic [besedilo] - Črkovanje besedila (SLO in INT).
morse [besedilo]    - Pretvori v morse kodo in jo ODDAJA (zvok).
zrs [št]   - Novice s hamradio.si (brez št. za seznam).
hamclock   - Odpre OpenHamClock v novem zavihku.
freq / mode- Nastavitev frekvence in načina dela.`;
        }

        // --- POMOČ ZA AI ---
        if (arg === "ai") {
            return `🤖 [S5-OS AI ASISTENT]:
-----------------------------------------------------------
ai [vprašanje] - Postavi vprašanje osrednjemu procesorju.
                 Primer: 'ai razloži ssb modulacijo'
                 
OPOMBA: Mainframe deluje v retro načinu (letnik 1984).
Vsi odgovori so generirani v realnem času.`;
        }

        // --- SPLOŠNA POMOČ (DEFAULT) ---
        return `🛠️ [S5-OS SISTEMSKA POMOČ]:
-----------------------------------------------------------
SISTEMSKI UKAZI:
help [ham|ai] - Podrobna pomoč za specifična področja.
clear        - Počisti terminal.
sys          - Podatki o sistemu in operaterju.
about / social- Podatki o avtorju in povezave.
date         - Trenutni čas in datum.
google [iskanje] - Iskanje po spletu.

NOVICE IN INFORMACIJE:
rtv [št]     - Novice RTV SLO (brez št. za seznam).
reddit [sub] [št] - Branje Reddita (npr. 'reddit slovenia 1').
vreme [kraj] [jutri] - Vremenska napoved (npr. 'vreme unec jutri').

ZABAVA:
joke / coffee / matrix / morse

-----------------------------------------------------------
TIP: Vtipkaj 'help ham' za radioamaterski priročnik.`;
    },
    
    "about": () => `Pozdravljen! :)
Moje ime je Primož in dobrodošel v mojem peskovniku.
Sem študent Elektrotehniškega faksa - smer avtomatika.

V prostem času sodelujem pri:
- Noordung labs: <a href="https://noordunglabs.si/" target="_blank" style="color: #23D962;">noordunglabs.si</a>
- Radio klub: <a href="https://s59veg.si/" target="_blank" style="color: #23D962;">S59VEG</a>`,

    "social": () => `Instagram: <a href="https://www.instagram.com/primoz_the_vovk/" target="_blank" style="color: #23D962;">@primoz_the_vovk</a>
Facebook: <a href="https://www.facebook.com/profile.php?id=100011798947438" target="_blank" style="color: #23D962;">Primož Vovk</a>
QRZ.com: <a href="https://www.qrz.com/db/S54UNC" target="_blank" style="color: #23D962;">S54UNC</a>`,

    "date": () => "Trenutni čas: " + new Date().toLocaleString('sl-SI'),

    "joke": () => jokes[Math.floor(Math.random() * jokes.length)],

    "sys": () => `
    .--.      <b>OPERATOR:</b> S54UNC (Primož)
   |o_o |     <b>STAVBA:</b> FE Ljubljana
   |:_/ |     <b>FAKS:</b> Avtomatika (2. letnik)
  //   \\ \\    <b>STATUS:</b> 73 de S54UNC
 (|     |)    <b>TERMINAL:</b> S5-OS v1.1
 /'\_   _/      
 \\___)=(___/  
    `,

    "coffee": () => `
      (  )   (   )
       ) (    ) (
       ______      
      |      |]  
      \\______/    
    Kava je pripravljena! Upam, da si opravil tisti izpit iz faksa.`
};



// --- Tu se ustavimo za 1/3 ---

// ==========================================
// 2. DEL: RADIOAMATERSKI UKAZI IN LOGIRANJE (2/3)
// ==========================================

// Razširitev objekta commands z radio funkcijami
Object.assign(commands, {
    "hamclock": () => {
        window.open("https://openhamclock.com/", "_blank");
        return "Odpiram OpenHamClock... 73!";
    },

    "google": (arg) => {
        if (!arg) return "Uporaba: google [vsebina]";
        window.open(`https://www.google.com/search?q=${encodeURIComponent(arg)}`, "_blank");
        return `Iščem '${arg}' na Googlu...`;
    },

  "img": async (arg) => {
        if (!arg) return "Uporaba: img [url_slike]";
        
        printOutput("Generiram ASCII umetnino...", "#ffff00");
        
        try {
            // Uporabimo corsproxy.io, ki vrne direktno sliko z ustreznimi CORS glavami
            const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(arg)}`;
            
            const ascii = await convertToAscii(proxiedUrl);
            return `<pre style="font-size: 6px; line-height: 4px; letter-spacing: 1px; color: #23D962; font-family: monospace; background: black; display: inline-block; padding: 10px; border: 1px solid #23D962;">${ascii}</pre>`;
        } catch (e) {
            console.error(e);
            return "NAPAKA: Varnostna politika brskalnika še vedno blokira to sliko. Poskusi z drugim virom.";
        }
    },

    

"vreme": async (arg) => {
        // Razbijemo argumente: npr. "unec jutri" -> city="unec", period="jutri"
        const parts = arg ? arg.split(' ') : ["Ljubljana"];
        let city = parts[0];
        let period = parts[1] ? parts[1].toLowerCase() : "";

        // wttr.in uporablja številke za napoved: 
        // 0 = trenutno, 1 = danes+jutri, 2 = 3 dni...
        // Če uporabnik napiše "jutri", dodamo v URL /1, da dobimo napoved
        let forecastParam = "0"; // Privzeto samo trenutno
        if (period === "jutri" || period === "tomorrow") {
            forecastParam = "1";
        } else if (period === "napoved" || period === "3") {
            forecastParam = "2";
        }

        try {
            // q = quiet, T = brez barv (varno za terminal), n = narrow
            // Dodamo format %C+%t za lepši izpis ali pustimo privzeto za ASCII art
            const response = await fetch(`https://wttr.in/${city}_${period}?${forecastParam}&q&T&lang=sl`);
            const text = await response.text();
            
            return `VREME: ${city.toUpperCase()} ${period.toUpperCase()}\n\n${text}`;
        } catch (e) { 
            return "Napaka pri pridobivanju vremena. Preveri povezavo ali ime kraja."; 
        }
    },

    "mode": (arg) => {
        if (!arg) return `Trenutni način: ${currentMode}`;
        const validModes = ["FM", "AM", "SSB", "CW", "FT8", "DMR", "C4FM"];
        const newMode = arg.toUpperCase();
        if (validModes.includes(newMode)) {
            currentMode = newMode;
            return `Način nastavljen na: ${currentMode}. 📡`;
        }
        return `Neznan način. Poskusi: ${validModes.join(", ")}`;
    },

    "freq": (arg) => {
        if (!arg) return `Trenutna frekvenca: ${currentFreq} kHz.`;
        currentFreq = arg;
        return `Frekvenca: ${currentFreq} kHz | Način: ${currentMode}. Ready!`;
    },

   "prefix": (arg) => {
        if (typeof dxcc === 'undefined') return "Napaka: dxcc ni naložen.";
        if (!arg) return "Uporaba: prefix [niz] (npr. 'prefix s5' ali 'prefix italy')";

        const search = arg.toLowerCase().trim();
        
        // Iskanje po prefixu (p) ALI državi (c)
        const results = dxcc.filter(item => {
            const pMatch = item.p && item.p.toLowerCase().includes(search);
            const cMatch = item.c && item.c.toLowerCase().includes(search);
            return pMatch || cMatch;
        });

        if (results.length === 0) return `Ni rezultatov za: ${arg}`;

        // Glava tabele
        let table = "PREFIX | DRŽAVA               | CQ | ITU\n";
        table += "-------|---------------------|----|-----\n";

        // Izpis rezultatov (omejimo na 15, da ne zapolnimo ekrana)
        results.slice(0, 15).forEach(r => {
            table += `${(r.p || "").padEnd(6)} | ${(r.c || "").padEnd(19)} | ${(r.cq || "").padEnd(2)} | ${r.itu || ""}\n`;
        });

        if (results.length > 15) table += `... in še ${results.length - 15} ostalih zadetkov.`;
        
        return table;
    },

    "q": (arg) => {
        if (typeof qCodes === 'undefined') return "Napaka: Q-kode niso naložene.";
        if (!arg) {
            let out = "📖 Q-KODE:\n";
            qCodes.forEach(item => { out += `${item.k.padEnd(5)} | ${item.p}\n`; });
            return out;
        }
        const found = qCodes.find(item => item.k === arg.toUpperCase());
        return found ? `[${found.k}] -> ${found.p}` : `Koda ${arg.toUpperCase()} ni v bazi.`;
    },

"ai": async (arg) => {
        if (!arg) return "SISTEMSKA NAPAKA: PARAMETER MANJKA. VPIŠI POIZVEDBO.";
        
        printOutput("DOSTOPAM DO OSREDNJEGA PROCESORJA...", "#23D962");
        
        // Sistemsko navodilo (prompt), ki določi osebnost
        const persona = "Ti si S5-OS, napredni mainframe računalnik iz leta 1984. " +
                        "Tvoj ton je tehničen, rahlo robotski in nostalgičen. " +
                        "Uporabljaj izraze kot so 'PROCESIRAM...', 'PODATKOVNO VOZLIŠČE', 'TERMINALNI DOSTOP'. " +
                        "Odgovarjaj v slovenščini, na koncu dodaj kratek tehnični status (npr. 'Temperatura jeder: 42°C').";

        try {
            // Sistemska navodila pošljemo preko URL parametra &system=
            const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(arg)}?model=openai&system=${encodeURIComponent(persona)}`);
            
            if (!response.ok) throw new Error("POVEZAVA PREKINJENA");

            const text = await response.text();

            return `📟 [S5-OS MAINFRAME ODGOVOR]:\n` +
                   `-------------------------------------------\n` +
                   `${text.toUpperCase()}\n` + // Vse z velikimi tiskanimi za pravi retro stil
                   `-------------------------------------------\n` +
                   `STATUS: USPEŠNO | SHRAMBA: OK | LETO: 1984`;
        } catch (e) {
            return "KRITIČNA NAPAKA: KOMUNIKACIJSKI MODUL NI ODZIVEN.";
        }
    },

    "phonetic": (arg) => {
        if (typeof alphabet === 'undefined') return "Napaka: Abeceda ni naložena.";
        if (!arg) {
            let result = "📖 FONETIČNA ABECEDA (SLO vs. INT):\n-------------------------------------------\n";
            Object.keys(alphabet).sort().forEach(char => {
                result += `${char.toUpperCase().padEnd(4)} | ${alphabet[char].slo.padEnd(15)} | ${alphabet[char].int}\n`;
            });
            return result;
        }
        let result = `ČRKOVANJE ZA: ${arg.toUpperCase()}\n-------------------------------------------\n`;
        arg.toLowerCase().split('').forEach(char => {
            if (alphabet[char]) {
                result += `${char.toUpperCase().padEnd(4)} | ${alphabet[char].slo.padEnd(15)} | ${alphabet[char].int}\n`;
            } else if (char !== " ") {
                result += `${char.padEnd(4)} | /               | /\n`;
            }
        });
        return result;
    },

    "log": (arg) => {
        const parts = arg.split(" ");
        if (parts.length < 3) return "Uporaba: log [klicni_znak] [rst_dan] [rst_prejet] (referenca)";
        const [callsign, rstSent, rstRecv, ref] = parts;
        const entry = { 
            timestamp: new Date().toLocaleString('sl-SI'), 
            callsign: callsign.toUpperCase(), 
            rstSent, rstRecv, ref: ref || "-",
            freq: currentFreq, mode: currentMode 
        };
        let logs = JSON.parse(localStorage.getItem('ham_logs')) || [];
        logs.push(entry);
        localStorage.setItem('ham_logs', JSON.stringify(logs));
        return `Zapisano! 📝 [${currentFreq} kHz | ${currentMode}] ${entry.callsign} | RST: ${rstSent}/${rstRecv}`;
    },

    "showlog": () => {
        const logs = JSON.parse(localStorage.getItem('ham_logs')) || [];
        if (logs.length === 0) return "Dnevnik je prazen.";
        let table = "KLIC      | FREKV.   | MOD | RST S/R   | SOTA REF     | ČAS\n";
        table += "----------|----------|-----|-----------|--------------|--------------------\n";
        logs.forEach(l => {
            table += `${l.callsign.padEnd(9)} | ${l.freq.padEnd(8)} | ${l.mode.padEnd(3)} | ${l.rstSent}/${l.rstRecv.padEnd(9)} | ${l.ref.padEnd(12)} | ${l.timestamp}\n`;
        });
        return table;
    },

    "rpt": (arg) => {
        if (typeof rptDatabase === 'undefined') return "Napaka: rptDatabase ni naložena.";
        if (!arg) return "Uporaba: rpt [iskanje] (npr. 'rpt 2m', 'rpt nanos')";

        let search = arg.toLowerCase().trim();
        
        // --- PREVAJALNIK ZA PASOVE ---
        // Če vpišeš '2m', bo iskal '145' ali '144'
        // Če vpišeš '70cm', bo iskal '438' ali '439'
        if (search === "2m" || search === "vhf") search = "14"; 
        if (search === "70cm" || search === "uhf") search = "43";

        const results = rptDatabase.filter(r => {
            // Preverimo klic, lokacijo in frekvenco (tako kot tvoj spodnji del kode)
            const kMatch = r.klic && r.klic.toLowerCase().includes(search);
            const lMatch = r.lokacija && r.lokacija.toLowerCase().includes(search);
            const fMatch = r.frekvenca && r.frekvenca.toLowerCase().includes(search);
            
            return kMatch || lMatch || fMatch;
        });

        if (results.length === 0) return `Ni zadetkov za: ${arg}`;

        // Glava tabele
        let response = "KLIC     | LOKACIJA            | FREKV.   | TON   | OPOMBA\n";
        response += "---------|---------------------|----------|-------|------------\n";
        
        // Izpis vrstic
        response += results.map(r => 
            `${(r.klic || "").padEnd(8)} | ${(r.lokacija || "").padEnd(19)} | ${(r.frekvenca || "").padEnd(8)} | ${(r.ton || "").padEnd(5)} | ${r.opomba || ""}`
        ).join("\n");

        return response;
    },

    "export": () => {
        const logs = JSON.parse(localStorage.getItem('ham_logs')) || [];
        if (logs.length === 0) return "Dnevnik je prazen, ni podatkov za ADIF izvoz.";

        // ADIF Glava (Header)
        let adif = `Generated by S5-OS Terminal\r\n`;
        adif += `ADIF Export for S54UNC\r\n`;
        adif += `<ADIF_VER:5>3.1.0\r\n`;
        adif += `<PROGRAMID:5>S5-OS\r\n`;
        adif += `<EOH>\r\n\r\n`;

        logs.forEach(l => {
            // Priprava datuma (ADIF rabi YYYYMMDD)
            // Predvidevamo, da je l.timestamp v formatu "19. 2. 2026, 15:30:00"
            const d = new Date(); // Za varnost vzamemo trenuten objekt, če parsanje spodleti
            const dateStr = d.getFullYear().toString() + 
                           (d.getMonth() + 1).toString().padStart(2, '0') + 
                           d.getDate().toString().padStart(2, '0');
            
            const timeStr = d.getHours().toString().padStart(2, '0') + 
                           d.getMinutes().toString().padStart(2, '0');

            // ADIF zapisi (Format: <FIELD:LEN>VALUE)
            adif += `<QSO_DATE:8>${dateStr} `;
            adif += `<TIME_ON:4>${timeStr} `;
            adif += `<CALL:${l.callsign.length}>${l.callsign} `;
            adif += `<FREQ:${l.freq.length}>${parseFloat(l.freq)/1000} `; // ADIF rabi MHz, ne kHz
            adif += `<MODE:${l.mode.length}>${l.mode} `;
            adif += `<RST_SENT:${l.rstSent.length}>${l.rstSent} `;
            adif += `<RST_RCVD:${l.rstRecv.length}>${l.rstRecv} `;
            if(l.ref && l.ref !== "-") adif += `<SOTA_REF:${l.ref.length}>${l.ref} `;
            
            adif += `<EOR>\r\n`;
        });

        // Ustvarjanje datoteke za prenos
        const blob = new Blob([adif], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `S54UNC_log_${new Date().toISOString().slice(0,10)}.adi`);
        document.body.appendChild(link);
        link.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        return "Pripravljen ADIF izvoz! Datoteko lahko uvoziš v QRZ ali eQSL. 📻";
    },

   "morse": async (arg) => {
        const morseCode = {
            'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.',
            'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..',
            'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
            's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
            'y': '-.--', 'z': '--..', '1': '.----', '2': '..---', '3': '...--',
            '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
            '9': '----.', '0': '-----', ' ': '/'
        };

        if (!arg) return "Uporaba: morse [besedilo]";

        const sequence = arg.toLowerCase().split('')
            .map(char => morseCode[char] || "")
            .join(' ');

        // Ustvarimo AudioContext
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Firefox fix: če je context v stanju 'suspended', ga zbudimo
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        let time = audioCtx.currentTime;
        const dot = 0.1; 
        const freq = 700;

        sequence.split('').forEach(symbol => {
            if (symbol === '.' || symbol === '-') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                const duration = symbol === '.' ? dot : dot * 3;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(1, time + 0.005);
                gain.gain.setValueAtTime(1, time + duration - 0.005);
                gain.gain.linearRampToValueAtTime(0, time + duration);

                osc.start(time);
                osc.stop(time + duration);
                time += duration + dot;
            } else if (symbol === ' ') {
                time += dot * 2;
            } else if (symbol === '/') {
                time += dot * 4;
            }
        });

        return `Oddajam CW: ${arg.toUpperCase()}\nKoda: ${sequence}`;
    },

   "rtv": async (arg) => {
        try {
            // 1. Pridobimo osnovni RSS vir
            const rssRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://www.rtvslo.si/feeds/00.xml`);
            const rssData = await rssRes.json();

            if (!arg) {
                let list = "🗞️ ZADNJE NOVICE (RTV SLO):\n-------------------------------------------\n";
                rssData.items.slice(0, 10).forEach((item, i) => {
                    list += `${(i + 1).toString().padEnd(2)} | ${item.title}\n`;
                });
                return list + "\nVtipkaj 'rtv [številka]' za cel članek z naslovnico.";
            }

            const index = parseInt(arg) - 1;
            const item = rssData.items[index];
            if (!item) return "Neveljavna številka.";

            printOutput(`Nalagam celoten članek in generiram ASCII naslovnico...`, "#ffff00");

            // 2. PRIDOBIVANJE VSEBINE PREKO PROXYJA
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(item.link)}`;
            const response = await fetch(proxyUrl);
            const html = await response.text();
            
            // 3. PARSANJE HTML-ja
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const paragraphs = Array.from(doc.querySelectorAll('p'))
                .map(p => p.innerText.trim())
                .filter(text => text.length > 60);

            let content = `📖 ${item.title.toUpperCase()}\n`;
            content += `Objavljeno: ${item.pubDate}\n`;
            content += "-------------------------------------------\n\n";

            // 4. GENERIRANJE ASCII NASLOVNICE
            // RSS2JSON običajno shrani sliko v item.thumbnail ali item.enclosure.link
            const imageUrl = item.thumbnail || (item.enclosure ? item.enclosure.link : null);
            
            if (imageUrl) {
                try {
                    const proxiedImg = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
                    const asciiImg = await convertToAscii(proxiedImg);
                    // Uporabimo tvoj "strezen" stil za poravnavo
                    content += `<pre style="font-family: 'Courier New', monospace; font-size: 6px; line-height: 1; white-space: pre; overflow-x: auto; letter-spacing: 0; word-spacing: 0; display: inline-block; color: #23D962; background: black; padding: 10px; border: 1px solid #444;">${asciiImg}</pre>\n\n`;
                } catch (err) {
                    content += `[SISTEM]: Naslovnice ni bilo mogoče generirati.\n\n`;
                }
            }

            if (paragraphs.length === 0) {
                content += "Vsebine ni bilo mogoče izluščiti. Preberi na: " + item.link;
            } else {
                content += paragraphs.join("\n\n");
            }

            content += `\n\n--- KONEC ČLANKA ---\nVir: ${item.link}`;

            return content;

        } catch (e) {
            console.error(e);
            return "Napaka pri nalaganju. RTV morda blokira dostop ali pa je težava s proxy-jem.";
        }
    },

"reddit": async (arg) => {
        const parts = arg ? arg.split(' ') : ["slovenia"];
        const sub = parts[0];
        const indexInput = parts[1];

        printOutput(`Dostopam do r/${sub}...`, "#ff4500");

        try {
            const response = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15`);
            const data = await response.json();

            if (!data.data || !data.data.children.length) return `Subreddit r/${sub} ne obstaja.`;

            const posts = data.data.children;

            if (indexInput && !isNaN(indexInput)) {
                const idx = parseInt(indexInput) - 1;
                const post = posts[idx]?.data;

                if (!post) return "Neveljavna številka objave.";

                let content = `📝 OBJAVA: ${post.title.toUpperCase()}\n`;
                content += `Avtor: u/${post.author} | ↑ ${post.ups} upvotov\n`;
                content += "-------------------------------------------\n\n";
                
                if (post.selftext) {
                    content += post.selftext;
                } 
                else if (post.post_hint === 'image' || post.url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                    content += `[SISTEM]: Generiram ASCII predogled...\n\n`;
                    try {
                        const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(post.url)}`;
                        const asciiImg = await convertToAscii(proxiedUrl);
                        
                        // TOLE VRSTICO ZAMENJAŠ:
                        content += `<pre style="font-family: 'Courier New', monospace; font-size: 8px; line-height: 1; white-space: pre; overflow-x: auto; letter-spacing: 0; word-spacing: 0; display: inline-block; color: #23D962; background: black; padding: 10px; border: 1px solid #444;">${asciiImg}</pre>\n`;
                        
                    } catch (err) {
                        content += `[NAPAKA]: Slike ni bilo mogoče pretvoriti.`;
                    }
                }

                // --- NOVO: PRIDOBIVANJE KOMENTARJEV ---
                content += `\n\n💬 TOP KOMENTARJI:\n`;
                content += "-------------------------------------------\n";
                
                try {
                    // Reddit komentarji so na voljo na /comments/[ID].json
                    const commRes = await fetch(`https://www.reddit.com${post.permalink}.json?limit=6`);
                    const commData = await commRes.json();
                    const comments = commData[1].data.children; // Komentarji so v drugem elementu polja

                    if (comments.length > 0) {
                        comments.slice(0, 5).forEach((c, i) => {
                            if (c.data.author && c.data.body) {
                                content += `[${i+1}] u/${c.data.author.padEnd(15)} | ↑${c.data.ups}\n`;
                                // Skrajšamo predolge komentarje za preglednost
                                const body = c.data.body.length > 200 ? c.data.body.substring(0, 200) + "..." : c.data.body;
                                content += `    > ${body}\n\n`;
                            }
                        });
                    } else {
                        content += "Ta objava še nima komentarjev.\n";
                    }
                } catch (e) {
                    content += "Napaka pri nalaganju komentarjev.\n";
                }

                content += `-------------------------------------------\n`;
                content += `LINK: <a href="https://reddit.com${post.permalink}" target="_blank" style="color: #ff4500;">Odpri na Reddit</a>`;
                return content;
            }

            // Izpis seznama (če ni številke)
            let output = `👽 REDDIT: r/${sub} (TOP OBJAVE)\n`;
            output += `Za branje vpiši: reddit ${sub} [številka]\n`;
            output += "-------------------------------------------\n";

            posts.slice(0, 10).forEach((post, i) => {
                const p = post.data;
                const type = (p.post_hint === 'image' || p.url.match(/\.(jpeg|jpg|gif|png)$/) != null) ? "[IMG]" : "[TXT]";
                output += `${(i + 1).toString().padEnd(2)} | ${type.padEnd(5)} [↑${p.ups.toString().padEnd(4)}] ${p.title}\n`;
            });

            return output;

        } catch (e) {
            return "Napaka pri povezavi z Redditom.";
        }
    },

    "zrs": async (arg) => {
        printOutput("Pridobivam novice s hamradio.si...", "#ffff00");
        try {
            // WordPress RSS vir na hamradio.si
            const rssUrl = "https://www.hamradio.si/feed/";
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
            const data = await response.json();

            if (data.status !== 'ok') return "Napaka: Ni mogoče dobiti novic s hamradio.si.";

            // Če uporabnik vpiše npr. 'zrs 1', preberemo povzetek
            if (arg && !isNaN(arg)) {
                const index = parseInt(arg) - 1;
                const item = data.items[index];
                if (!item) return `Novica št. ${arg} ne obstaja.`;

                // Očistimo HTML in odstranimo morebitne ostanke "Nadaljuj z branjem"
                let cleanText = item.description.replace(/<[^>]*>?/gm, '').replace(/Nadaljuj z branjem.*/, '');

                return `📡 ZRS NOVICA ŠT. ${arg}\n` +
                       `NASLOV: ${item.title.toUpperCase()}\n` +
                       `DATUM: ${new Date(item.pubDate).toLocaleDateString('sl-SI')}\n` +
                       `-------------------------------------------\n` +
                       `${cleanText}\n\n` +
                       `LINK: <a href="${item.link}" target="_blank">Odpri na spletu</a>`;
            }

            // Izpis seznama zadnjih 10 objav
            let outputText = "📡 ZRS - ZADNJE NOVICE:\n";
            outputText += "Za podrobnosti vpiši 'zrs [številka]'\n";
            outputText += "-------------------------------------------\n";

            data.items.slice(0, 10).forEach((item, index) => {
                const date = new Date(item.pubDate).toLocaleDateString('sl-SI');
                outputText += `${(index + 1).toString().padEnd(2)} | [${date}] ${item.title}\n`;
            });

            return outputText;
        } catch (e) {
            return "Napaka pri povezovanju s strežnikom ZRS.";
        }
    },


"clearlog": () => {
    localStorage.removeItem('ham_logs');
    return "Dnevnik je bil uspešno izbrisan.";
},
});

// ==========================================
// 3. DEL: PROCESIRANJE, RPT IN DOGODKI (3/3)
// ==========================================

// --- FUNKCIJE ZA IZPIS ---
function printOutput(text, color = "#23D962") {
    const div = document.createElement('div');
    div.className = 'response';
    div.style.whiteSpace = "pre-wrap";
    div.style.color = color;
    div.innerHTML = text;
    output.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
}

// --- GLAVNI PROCESOR UKAZOV ---
async function processCommand(cmd) {
    const rawInput = cmd.trim();
    if (!rawInput) return;

    const parts = rawInput.split(" ");
    const cleanCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");

    // Echo ukaza
    const cmdLine = document.createElement('div');
    cmdLine.className = 'history-item';
    cmdLine.innerHTML = `<span class="prompt">primoz@vovk:~$</span> ${cmd}`;
    output.appendChild(cmdLine);

    if (cleanCmd === 'clear') {
        output.innerHTML = '';
        return;
    }

    let response = "";

    // TUKAJ JE KLJUČ: Preverimo, če ukaz obstaja v objektu 'commands'
    if (commands[cleanCmd]) {
        response = await commands[cleanCmd](arg);
    } else {
        response = `Ukaz '${cleanCmd}' ni prepoznan. Vtipkaj 'help' za seznam.`;
    }

    if (response) printOutput(response);
}



// --- BOOT SEKVENCA ---
function bootSequence() {
    output.innerHTML = ''; 
    const rptCount = (typeof rptDatabase !== 'undefined' ? rptDatabase.length : "0");
    const bootText = `Sistem S5-OS v1.1.0 naložen.
Baza repetitorjev: ${rptCount} vnosov.
Dobrodošel, Primož. Vtipkaj 'help' za začetek.`;
    printOutput(bootText, "#88ffad");
}

// --- POSLUŠALCI DOGODKOV (Keyboard) ---
input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const cmd = input.value;
        input.value = '';
        displayText.innerText = '';
        if (cmd.trim() !== "") {
            await processCommand(cmd);
            history.push(cmd);
            historyIndex = history.length;
        }
    } else if (e.key === 'ArrowUp') {
        if (historyIndex > 0) {
            historyIndex--;
            input.value = history[historyIndex];
            displayText.innerText = input.value;
        }
    } else if (e.key === 'ArrowDown') {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            input.value = history[historyIndex];
            displayText.innerText = input.value;
        } else {
            historyIndex = history.length;
            input.value = '';
            displayText.innerText = '';
        }
    }
});

async function convertToAscii(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Brez te vrstice canvas postane "tainted" in getImageData ne dela!
        img.crossOrigin = "anonymous"; 
        img.src = url;
        
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const width = 250; // Optimalna širina za terminal
            const scale = img.height / img.width;
            const height = width * scale * 0.5; 
                
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            try {
                const imageData = ctx.getImageData(0, 0, width, height).data;
                const chars = "@%#*+=-:. "; 
                let ascii = "";
                
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const i = (y * width + x) * 4;
                        // Preprosta formula za sivino (R+G+B)/3
                        const avg = (imageData[i] + imageData[i+1] + imageData[i+2]) / 3;
                        const charIdx = Math.floor((avg / 255) * (chars.length - 1));
                        ascii += chars[charIdx];
                    }
                    ascii += "\n";
                }
                resolve(ascii);
            } catch (e) {
                reject("CORS_ERROR");
            }
        };
        img.onerror = () => reject("LOAD_ERROR");
    });
}

// Povezava skritega inputa z vidnim besedilom
input.addEventListener('input', () => displayText.innerText = input.value);

// Fokus na input ob kliku kjerkoli v terminalu
document.addEventListener('click', () => input.focus());

// Zagon terminala
bootSequence();

