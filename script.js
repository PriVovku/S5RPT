// ==========================================
// 1. DEL: KONSTANTE, SPREMENLJIVKE IN OSNOVE (1/3)
// ==========================================

// --- SISTEM ZA JEZIK (SLO, EN, DE) ---
let currentLang = localStorage.getItem('terminal_lang') || 'sl';

const uiText = {
    "sl": {
        "boot": "Sistem S5-OS v1.1.0 naložen.\nBaza repetitorjev pripravljena.\nDobrodošel, Primož. Vtipkaj 'help' za začetek.",
        "unknown": "Ukaz ni prepoznan. Vtipkaj 'help' za seznam.",
        "langSet": "Jezik nastavljen na slovenščino.",
        "helpHeader": "SISTEMSKA POMOČ"
    },
    "en": {
        "boot": "System S5-OS v1.1.0 loaded.\nRepeater database ready.\nWelcome, Primoz. Type 'help' to get started.",
        "unknown": "Command not recognized. Type 'help' for list.",
        "langSet": "Language set to English.",
        "helpHeader": "SYSTEM HELP"
    },
    "de": {
        "boot": "System S5-OS v1.1.0 geladen.\nRelais-Datenbank bereit.\nWillkommen, Primoz. Tippe 'help' für Hilfe.",
        "unknown": "Befehl nicht erkannt. Tippe 'help' für eine Liste.",
        "langSet": "Sprache auf Deutsch eingestellt.",
        "helpHeader": "SYSTEMHILFE"
    }
};

const virtualFiles = {
    "navodila.txt": "Dobrodošli v S5-OS. Ukazi: help, lofi, gaser, ai, glitch-mode.",
    "skrivnost.sh": "echo 'Ti si pravi hacker!'",
    "kontakt.txt": "Admin: Primož Vovk [S54UNC]\nEmail: s54unc@s59veg.si",
    "todo.md": "- Popravi glitch efekte\n- Dodaj več hude playlist\n- Najdi boljše GIF-e"
    
};

const radioStations = {
    "balkan": "https://streaming.radiokasaba.com/radio/8000/radio.mp3", // Primer Balkan radia
    "lofi": "https://lofi.stream.laut.fm/lofi",
    "techno": "https://hirschmilch-techno.dnsonline.de/techno.mp3",
    "chill": "https://icecast.ndr.de/ndr/ndr2/hamburg/mp3/128/stream.mp3"
};

let currentRadio = null; // Tukaj bomo shranili audio objekt

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
   "help": (args) => {
    const podrocje = (args && args.length > 0) ? args[0].toLowerCase() : null;

    // --- POMOČ ZA RADIOAMATERJE ---
    if (podrocje === "ham") {
        return `[S5-HAM] RADIOAMATERSKI UKAZI:
-----------------------------------------------------------
log [klic] [s] [r] (ref) - Zabeleži zvezo v dnevnik.
showlog    - Prikaže vse shranjene zveze.
export     - Prenese dnevnik v ADIF formatu.
prefix [iskanje] - DXCC info (npr. 'prefix s5').
q [koda]   - Pomen Q-kod (npr. 'q qth').
rpt [niz]  - Iskanje repetitorjev (npr. 'rpt nanos').
phonetic [tekst] - Črkovanje (SLO/INT).
morse [tekst]    - Pretvori v Morse kodo + zvok.
freq / mode      - Nastavitev frekvence in načina.`;
    }

    // --- POMOČ ZA ZABAVO IN MULTIMEDIJO ---
    if (podrocje === "media") {
        return `[S5-OS MULTIMEDIJA]:
-----------------------------------------------------------
radio [postaja] - Vklopi radio (lofi, balkan, techno, chill).
radio list      - Seznam vseh radijskih postaj.
radio off       - Izklopi radio.
volume [0-100]  - Nastavitev glasnosti radia.
spotify [stil]  - Odpre Spotify predvajalnik (retro, balkan...).
snake           - Zagon retro igrice KAČA.
joke            - Izpiše naključno inženirsko šalo.`;
    }

    // --- POMOČ ZA SISTEMSKA ORODJA ---
    if (podrocje === "tools") {
        return `[S5-OS ORODJA]:
-----------------------------------------------------------
calc [izraz]    - Matematični kalkulator (npr. calc 5*5).
ai [vprašanje]  - Komunikacija z osrednjim procesorjem.
vreme [kraj]    - Trenutna vremenska napoved in ASCII art.
note [ukaz]     - Beležnica (dodaj, seznam, edit, brisi).
img [url]       - Pretvori sliko z neta v ASCII art.
google [niz]    - Odpre iskanje na Googlu.`;
    }

    // --- SPLOŠNA POMOČ (DEFAULT) ---
    return `[S5-OS GLAVNI MENI POMOČI]:
-----------------------------------------------------------
PODROČJA POMOČI:
help ham   - Radioamaterski ukazi in dnevniki.
help media - Radio, Spotify, igrice in zabava.
help tools - Kalkulator, AI, vreme in beležka.
help nomago- Navodila za vozni red avtobusov.

OSNOVNI UKAZI:
ls / cat   - Pregled in branje sistemskih datotek.
sys        - Informacije o sistemu in operaterju.
glitch-mode- Nastavitve vizualnih motenj (on/off).
clear      - Počisti zaslon terminala.
date       - Trenutni čas in datum.

-----------------------------------------------------------
TIP: Vtipkaj 'ls' za ogled datotek na disku!`;
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
    
    printOutput("Pridobivam podatke preko proxyja...", "#ffff00");
    
    try {
        // Uporabimo JSON verzijo proxyja namesto /raw
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(arg)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        // AllOrigins vrne vsebino v data.contents
        // To vsebino moramo spremeniti v format, ki ga convertToAscii razume
        const ascii = await convertToAscii(data.contents); 
        
        return `<pre style="font-size: 6px; line-height: 4px; letter-spacing: 1px; color: #23D962; font-family: monospace; background: black; display: inline-block; padding: 10px; border: 1px solid #23D962;">${ascii}</pre>`;
    } catch (e) {
        console.error("Podrobna napaka:", e);
        return "NAPAKA: Strežnik proxy ne odgovarja (Status 500). Poskusi čez par sekund.";
    }
},


    "note": (arg) => {
    // Pridobimo podatke iz lokalne shrambe brskalnika
    let notes = JSON.parse(localStorage.getItem("terminal_notes") || "[]");

    // 1. IZPIS SEZNAMA (če ni argumenta ali je 'seznam')
    if (!arg || arg === "seznam") {
        if (notes.length === 0) return "Beležnica je prazna. Dodaj zapis z 'note dodaj [besedilo]'.";
        let output = "📝 TVOJI ZAPISKI:\n-------------------------------------------\n";
        notes.forEach((n, i) => {
            output += `${(i + 1).toString().padEnd(3)} | [${n.date}] ${n.text}\n`;
        });
        return output;
    }

    const parts = arg.split(' ');
    const subCommand = parts[0].toLowerCase();
    const subArg = parts[1]; // Številka zapiska (pri edit/brisi)
    const content = parts.slice(2).join(' '); // Novo besedilo

    // 2. DODAJANJE NOVEGA ZAPISKA
    if (subCommand === "dodaj") {
        const textToAdd = parts.slice(1).join(' ');
        if (!textToAdd) return "NAPAKA: Manjka vsebina. Uporaba: note dodaj [besedilo]";
        
        notes.push({
            text: textToAdd,
            date: new Date().toLocaleDateString('sl-SI') + " " + new Date().toLocaleTimeString('sl-SI', {hour: '2-digit', minute:'2-digit'})
        });
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        return `✅ Zapisano pod št. ${notes.length}.`;
    }

    // 3. UREJANJE OBSTOJEČEGA (EDIT)
    if (subCommand === "edit") {
        const index = parseInt(subArg) - 1;
        if (isNaN(index) || !notes[index]) return "NAPAKA: Neveljavna številka zapiska.";
        if (!content) return `Trenutna vsebina zapiska ${subArg}: "${notes[index].text}"\nUporaba: note edit ${subArg} [novo besedilo]`;

        const oldText = notes[index].text;
        notes[index].text = content;
        notes[index].date = new Date().toLocaleDateString('sl-SI') + " " + new Date().toLocaleTimeString('sl-SI', {hour: '2-digit', minute:'2-digit'}) + " (urejeno)";
        
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        return `🔄 Posodobljeno!\nPrej: "${oldText}"\nZdaj: "${content}"`;
    }

    // 4. BRISANJE
    if (subCommand === "brisi" || subCommand === "del") {
        const index = parseInt(subArg) - 1;
        if (isNaN(index) || !notes[index]) return "NAPAKA: Zapisek s to številko ne obstaja.";
        const deleted = notes.splice(index, 1);
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        return `🗑️ Izbrisano: "${deleted[0].text}"`;
    }

    // 5. ČIŠČENJE CELOTNE BELEŽNICE
    if (subCommand === "prazni" || subCommand === "clear") {
        localStorage.removeItem("terminal_notes");
        return "🔥 Vsi zapiski so bili uničeni.";
    }

    return "UKAZI: note [dodaj | seznam | edit | brisi | prazni]";
},
    

"vreme": async (args) => {
    const city = (args && args.length > 0) ? args[0] : "Ljubljana";
    printOutput(`Skeniram atmosferske pogoje za ${city.toUpperCase()}...`, "#23D962");

    try {
        // 1. Najprej dobimo koordinate za mesto (Geocoding - Open-Meteo ne rabi ključa)
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=sl&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            return `Napaka: Kraja '${city}' ni mogoče locirati v bazi.`;
        }

        const { latitude, longitude, name } = geoData.results[0];

        // 2. Pridobimo vremenske podatke
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&windspeed_unit=ms`);
        const w = await weatherRes.json();
        
        const temp = Math.round(w.current_weather.temperature);
        const code = w.current_weather.weathercode;
        const wind = w.current_weather.windspeed;

        // 3. Mapiranje WMO kod v ASCII art
        const getAscii = (c) => {
            if (c === 0) return "    \\   /    \n     .-.     \n  -- (   ) --\n     `-’     \n    /   \\    "; // Jasno
            if (c <= 3) return "    \\  /     \n  _ /\"\"\\  _  \n    \\__/     \n   /    \\    \n  ^^^^^^^^^^ "; // Delno oblačno
            if (c <= 67) return "     .--.    \n    (    ).  \n   (___(__)  \n    ‘ ‘ ‘ ‘  \n   ‘ ‘ ‘ ‘   "; // Dež
            if (c >= 71) return "     .--.    \n    (    ).  \n   (___(__)  \n    * * * * \n   * * * * "; // Sneg
            return "     .--.    \n    (    ).  \n   (___(__)  \n             "; // Oblačno
        };

        const ascii = getAscii(code);

        // 4. Lep retro izpis
        return `
📡 METEO POROČILO: ${name.toUpperCase()}
-------------------------------------------
${ascii}

TEMPERATURA: ${temp}°C
VETER:       ${wind} m/s
STATUS KODA: WMO-${code}
LOKACIJA:    ${latitude.toFixed(2)}N, ${longitude.toFixed(2)}E
-------------------------------------------
Ready.`;

    } catch (e) {
        return "❌ Sistemska napaka pri branju senzorjev (Open-Meteo dosegljivost).";
    }
},

"mode": (args) => {
    // Preverimo, če je uporabnik sploh podal argument
    if (!args || args.length === 0) return `Trenutni način: ${currentMode}`;

    const validModes = ["FM", "AM", "SSB", "CW", "FT8", "DMR", "C4FM"];
    // Vzamemo prvi element iz seznama args
    const newMode = args[0].toUpperCase();

    if (validModes.includes(newMode)) {
        currentMode = newMode; // Predpostavljam, da je currentMode globalna spremenljivka
        return `Način nastavljen na: ${currentMode}. 📡`;
    }
    return `Neznan način. Poskusi: ${validModes.join(", ")}`;
},

"freq": (args) => {
    // Preverimo, če je uporabnik podal frekvenco
    if (!args || args.length === 0) return `Trenutna frekvenca: ${currentFreq} kHz.`;

    // Vzamemo prvi element iz seznama args
    currentFreq = args[0]; // Predpostavljam, da je currentFreq globalna spremenljivka
    return `Frekvenca: ${currentFreq} kHz | Način: ${currentMode}. Ready!`;
},

"prefix": (args) => {
    if (typeof dxcc === 'undefined') return "Napaka: Podatkovna baza DXCC ni naložena.";
    
    // Preverimo, če je uporabnik sploh kaj vpisal
    if (!args || args.length === 0) return "Uporaba: prefix [klicni znak ali država]";

    // Združimo vse besede nazaj v en niz (v primeru držav z več besedami, npr. 'South Shetland')
    const search = args.join(" ").toUpperCase().trim();
    
    // 1. POSKUS: Iskanje po klicnem znaku (npr. S54UNC -> najde S5)
    let foundByCallsign = null;
    // Preverimo dolžine od 4 znakov navzdol do 1
    for (let i = 4; i >= 1; i--) {
        const part = search.substring(0, i);
        const match = dxcc.find(item => item.p === part);
        if (match) {
            foundByCallsign = match;
            break;
        }
    }

    // 2. POSKUS: Če nismo našli po prefixu, iščemo po imenu države
    if (!foundByCallsign) {
        const countryResults = dxcc.filter(item => 
            item.c && item.c.toUpperCase().includes(search)
        );

        if (countryResults.length > 0) {
            let table = "PREFIX | DRŽAVA               | CQ | ITU\n";
            table += "-------|----------------------|----|-----\n";
            countryResults.slice(0, 15).forEach(r => {
                table += `${(r.p || "").padEnd(6)} | ${(r.c || "").padEnd(20)} | ${(r.cq || "").toString().padEnd(2)} | ${r.itu || ""}\n`;
            });
            return table;
        }
        return `Ni rezultatov za: ${search}`;
    }

    // 3. IZPIS: Če smo našli direktno po klicnem znaku
    return `📡 REZULTAT ZA ${search}:\n` +
           `-------------------------------------------\n` +
           `Prefix:  ${foundByCallsign.p}\n` +
           `Država:  ${foundByCallsign.c}\n` +
           `CQ cona: ${foundByCallsign.cq}\n` +
           `ITU:     ${foundByCallsign.itu}`;
},
   "q": (args) => {
    if (typeof qCodes === 'undefined') return "Napaka: Q-kode niso naložene.";

    // Če ni argumentov, izpiši celoten seznam
    if (!args || args.length === 0) {
        let out = "📖 Q-KODE (Pogoste):\n";
        out += "-------------------------------------------\n";
        qCodes.forEach(item => { 
            out += `${item.k.padEnd(5)} | ${item.p}\n`; 
        });
        return out;
    }

    // Vzamemo prvo besedo za ukazom (npr. 'qth')
    const searchCode = args[0].toUpperCase();
    const found = qCodes.find(item => item.k === searchCode);

    if (found) {
        return `[${found.k}] -> ${found.p}`;
    } else {
        return `Koda ${searchCode} ni v bazi. Vtipkaj 'q' brez argumentov za seznam.`;
    }
},

"ai": async (args) => {
    // 1. Preverimo, če je uporabnik sploh kaj vprašal
    if (!args || args.length === 0) return "SISTEMSKA NAPAKA: PARAMETER MANJKA. VPIŠI POIZVEDBO.";
    
    // 2. Združimo vse besede v eno vprašanje
    const query = args.join(" ");
    
    printOutput("VZPOSTAVLJAM POVEZAVO Z OSREDNJIM PROCESORJEM...", "#23D962");
    
    // Sistemsko navodilo (prompt) za osebnost S5-OS
    const persona = "Ti si S5-OS, napredni mainframe računalnik iz leta 1984. " +
                    "Tvoj ton je tehničen, rahlo robotski in nostalgičen. " +
                    "Odgovarjaj v slovenščini, bodi kratek in jedrnat. " +
                    "Na koncu dodaj kratek tehnični status";

    try {
        // 3. Pošljemo zahtevek na Pollinations AI
        // Uporabimo model 'openai' ali 'mistral' za najboljše rezultate v slovenščini
        const url = `https://text.pollinations.ai/${encodeURIComponent(query)}?model=openai&system=${encodeURIComponent(persona)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("POVEZAVA PREKINJENA");

        const text = await response.text();

        // 4. Vrnem odgovor v retro stilu (z velikimi črkami)
        return `📟 [S5-OS MAINFRAME ODGOVOR]:\n` +
               `-------------------------------------------\n` +
               `${text.toUpperCase()}\n` + 
               `-------------------------------------------\n` +
               `STATUS: USPEŠNO | VOZLIŠČE: AKTIVNO | LETO: 1984`;

    } catch (e) {
        console.error("AI Error:", e);
        return "KRITIČNA NAPAKA: KOMUNIKACIJSKI MODUL NI ODZIVEN. PREVERI MREŽNO KARTICO.";
    }
},

"ls": (args) => {
    // Pridobimo vsa imena datotek iz objekta
    const files = Object.keys(virtualFiles);
    
    // Izpišemo jih ločene s presledkom ali v vrstico
    // Uporabimo rumeno ali modro barvo, da izstopajo od navadnega teksta
    printOutput("Imenik datotek v /home/user/:", "#ffff00");
    return files.join("    ");
},

"cat": (args) => {
    if (args.length === 0) return "Uporaba: cat [ime_datoteke]";
    
    const fileName = args[0];
    const content = virtualFiles[fileName];

    if (content) {
        return content;
    } else {
        return `NAPAKA: Datoteka '${fileName}' ne obstaja.`;
    }
    
},

"radio": (args) => {
    const action = args[0]?.toLowerCase();

    // 1. UKAZ: radio off
    if (action === "off" || action === "stop") {
        if (currentRadio) {
            currentRadio.pause();
            currentRadio = null;
            return "📻 Radio ugasnjen. Tišina v etru.";
        }
        return "Radio že tako ne igra.";
    }

    // 2. UKAZ: radio list
    if (action === "list") {
        return "RAZPOLOŽLJIVE POSTAJE: " + Object.keys(radioStations).join(", ");
    }

    // 3. UKAZ: radio [ime_postaje]
    if (radioStations[action]) {
        if (currentRadio) {
            currentRadio.pause(); // Ustavi prejšnjo postajo, če igra
        }

        currentRadio = new Audio(radioStations[action]);
        currentRadio.play().catch(e => {
            return "NAPAKA: Te postaje trenutno ne morem uloviti.";
        });

        // Vizualni efekt ob vklopu
        triggerGlitch(); 
        return `📡 Lovim frekvenco... Predvajam: ${action.toUpperCase()}`;
    }

    return "Uporaba: radio [ime_postaje] ali radio off. Tipkaj 'radio list' za postaje.";
},

"calc": (args) => {
    if (args.length === 0) return "Uporaba: calc [izraz] (npr. calc 5 * 5)";

    // Združimo vse argumente v en niz (da lahko pišeš s presledki ali brez)
    const expression = args.join("");

    try {
        // Uporabimo Math funkcije, da lahko pišeš npr. sin(1) namesto Math.sin(1)
        const result = Function(`"use strict"; return (${expression.replace(/([a-zA-Z]+)/g, 'Math.$1')})`)();
        
        // Lep izpis rezultata
        printOutput(`> IZRAZ: ${expression}`, "#7a7a7a");
        return `> REZULTAT: ${result}`;
    } catch (e) {
        triggerGlitch(); // Če vpišeš neumnost, naj terminal malo "poblesavi"
        return "SISTEMSKA NAPAKA: Neveljaven matematični izraz.";
    }
},

"volume": (args) => {
    if (!currentRadio) return "Radio ni vklopljen.";
    let vol = parseInt(args[0]);
    if (isNaN(vol) || vol < 0 || vol > 100) return "Uporaba: volume 0-100";
    currentRadio.volume = vol / 100;
    return `🔊 Glasnost nastavljena na ${vol}%`;
},

"phonetic": (args) => {
    if (typeof alphabet === 'undefined') return "Napaka: Abeceda ni naložena.";

    // Če ni argumentov, izpiši celotno tabelo
    if (!args || args.length === 0) {
        let result = "📖 FONETIČNA ABECEDA (SLO vs. INT):\n";
        result += "--------------------------------------------------------\n";
        result += "ZNAK | SLOVENSKA       | MEDNARODNA (ICAO)\n";
        result += "-----|-----------------|------------------------\n";
        
        Object.keys(alphabet).sort().forEach(char => {
            result += `${char.toUpperCase().padEnd(4)} | ${alphabet[char].slo.padEnd(15)} | ${alphabet[char].int}\n`;
        });
        return result;
    }

    // Združimo vse argumente v en tekst (npr. "s5 4unc" -> "s5 4unc")
    const input = args.join(" ");
    let result = `📡 ČRKOVANJE ZA: ${input.toUpperCase()}\n`;
    result += "--------------------------------------------------------\n";

    input.toLowerCase().split('').forEach(char => {
        if (alphabet[char]) {
            result += `${char.toUpperCase().padEnd(4)} | ${alphabet[char].slo.padEnd(15)} | ${alphabet[char].int}\n`;
        } else if (char === " ") {
            result += "---- | [PREMOR]       | [SPACE]\n";
        } else {
            result += `${char.padEnd(4)} | /               | /\n`;
        }
    });
    
    return result;
},

"log": (args) => {
    // 1. Preverimo, če imamo dovolj podatkov (klicni znak, RST dan, RST prejet)
    if (!args || args.length < 3) {
        return "❌ Uporaba: log [klicni_znak] [rst_dan] [rst_prejet] (referenca)\n" +
               "Primer: log S59ABC 599 599 SOTA-S5/KS-001";
    }

    // 2. Razporedimo argumente iz polja
    const callsign = args[0].toUpperCase();
    const rstSent = args[1];
    const rstRecv = args[2];
    const ref = args.slice(3).join(" ") || "-"; // Vse ostalo po RST je referenca

    // --- PRIDOBIVANJE UTC ČASA (ZULU) ---
    const d = new Date();
    const utcTime = d.getUTCHours().toString().padStart(2, '0') + ":" + 
                    d.getUTCMinutes().toString().padStart(2, '0');
    const utcDate = d.getUTCFullYear() + "-" + 
                    (d.getUTCMonth() + 1).toString().padStart(2, '0') + "-" + 
                    d.getUTCDate().toString().padStart(2, '0');
    
    const timestampUTC = `${utcDate} ${utcTime}z`;

    // 3. Ustvarimo vnos (pobere trenutno frekvenco in način iz globalnih spremenljivk)
    const entry = { 
        timestamp: timestampUTC, 
        callsign: callsign, 
        rstSent: rstSent, 
        rstRecv: rstRecv, 
        ref: ref,
        freq: typeof currentFreq !== 'undefined' ? currentFreq : "0", 
        mode: typeof currentMode !== 'undefined' ? currentMode : "SSB" 
    };

    // 4. Shranjevanje v lokalno shrambo brskalnika
    try {
        let logs = JSON.parse(localStorage.getItem('ham_logs')) || [];
        logs.push(entry);
        localStorage.setItem('ham_logs', JSON.stringify(logs));
        
        return `✅ Zapisano v dnevnik! [${timestampUTC}]\n` +
               `Klic: ${entry.callsign} | RST: ${entry.rstSent}/${entry.rstRecv} | Freq: ${entry.freq} kHz | Mode: ${entry.mode} | Ref: ${entry.ref}`;
    } catch (e) {
        return "❌ Napaka pri zapisovanju v localStorage.";
    }
},

    "snake": () => {
    printOutput("Zagon igre KAČA... Uporabljaj PUŠČICE. Klikni na zaslon za izhod.", "#00ff00");
    
    const canvas = document.createElement('canvas');
    canvas.id = 'snake-canvas';
    Object.assign(canvas.style, {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', border: '2px solid #23D962',
        zIndex: '100', background: '#05210b', boxShadow: '0 0 20px #23D962'
    });
    canvas.width = 400; canvas.height = 400;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    let dx = 1, dy = 0;
    let score = 0;

    const game = setInterval(() => {
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        
        // Preverjanje trkov (stene ali sam nase)
        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || 
            snake.some(s => s.x === head.x && s.y === head.y)) {
            clearInterval(game);
            alert("GAME OVER! Rezultat: " + score);
            canvas.remove();
            return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            food = {x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20)};
        } else {
            snake.pop();
        }

        // Risanje
        ctx.fillStyle = '#05210b'; ctx.fillRect(0, 0, 400, 400);
        ctx.fillStyle = '#23D962';
        snake.forEach(s => ctx.fillRect(s.x * 20, s.y * 20, 18, 18));
        ctx.fillStyle = '#ff0000'; ctx.fillRect(food.x * 20, food.y * 20, 18, 18);
    }, 100);

    window.onkeydown = (e) => {
        if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
        if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
        if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
        if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
    };

    canvas.onclick = () => { clearInterval(game); canvas.remove(); };
    return "Srečno, krmar!";
},

"spotify": (args) => {
    const playliste = {
        "retro": "37i9dQZF1DXa890v9998p6",
        "balkan": "1o8cVQBpAbW1AaH6uIEpiN",
        "techno": "3EeySPUTHormAL7LZdEedv",
        "rock": "3fPKFuN9X1W2WqWq8pV6bM",
        "default": "7rynP6zofnXaZVeFlucBlj"
    };

    const izbira = (args && args.length > 0) ? args[0].toLowerCase() : "default";
    let playlistId = playliste[izbira] || (args[0]?.length > 15 ? args[0] : playliste["default"]);

    const oldPlayer = document.getElementById('spotify-container');
    if (oldPlayer) oldPlayer.remove();

    // Glavni kontejner za retro izgled
    const container = document.createElement('div');
    container.id = 'spotify-container';
    
    Object.assign(container.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '320px',
        padding: '10px 10px 5px 10px',
        backgroundColor: '#c0c0c0', // Klasična siva (Win95)
        border: '3px solid',
        borderLeftColor: '#ffffff',
        borderTopColor: '#ffffff',
        borderRightColor: '#404040',
        borderBottomColor: '#404040',
        zIndex: '1000',
        boxShadow: '5px 5px 0px rgba(0,0,0,0.5)',
        fontFamily: '"Courier New", Courier, monospace'
    });

    // Naslovna vrstica (Blue Title Bar)
    const titleBar = document.createElement('div');
    Object.assign(titleBar.style, {
        backgroundColor: '#000080',
        color: 'white',
        padding: '3px 5px',
        fontSize: '12px',
        fontWeight: 'bold',
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    });
    titleBar.innerHTML = `<span>S5-OS Player - ${izbira.toUpperCase()}</span><span style="cursor:pointer" onclick="document.getElementById('spotify-container').remove()">[X]</span>`;
    
    // Iframe (sam Spotify predvajalnik)
    const iframe = document.createElement('iframe');
    iframe.src = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
    Object.assign(iframe.style, {
        width: '100%',
        height: '80px',
        border: '2px inset #ffffff',
        backgroundColor: '#000'
    });
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";

    // Dodamo elemente skupaj
    container.appendChild(titleBar);
    container.appendChild(iframe);
    
    // Dodatni "LED" indikator spodaj
    const led = document.createElement('div');
    led.style.fontSize = '9px';
    led.style.marginTop = '5px';
    led.style.color = '#000080';
    led.innerHTML = "● SIGNAL STRENGTH: OPTIMAL | 44kHz 16-BIT";
    container.appendChild(led);

    document.body.appendChild(container);
    
    return `Predvajalnik je naložen: ${izbira.toUpperCase()}\nUživaj v glasbi`;
},

    "stop": () => {
        const player = document.getElementById('spotify-player');
        if (player) {
            player.remove();
            return "Predvajalnik odstranjen.";
        }
        return "Noben predvajalnik ni aktiven.";
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

"rpt": (args) => {
    if (typeof rptDatabase === 'undefined') return "Napaka: Baza repetitorjev (rptDatabase) ni naložena.";
    
    // 1. Preverimo, če je uporabnik sploh kaj vpisal
    if (!args || args.length === 0) return "Uporaba: rpt [iskanje] (npr. 'rpt 2m', 'rpt nanos')";

    // 2. Združimo argumente v iskalni niz
    let rawSearch = args.join(" ");
    let search = rawSearch.toLowerCase().trim();
    
    // --- PREVAJALNIK ZA PASOVE ---
    // Če vpišeš '2m', bo iskal '145' ali '144'
    if (search === "2m" || search === "vhf") search = "14"; 
    if (search === "70cm" || search === "uhf") search = "43";

    // 3. Filtriranje baze
    const results = rptDatabase.filter(r => {
        const kMatch = r.klic && r.klic.toLowerCase().includes(search);
        const lMatch = r.lokacija && r.lokacija.toLowerCase().includes(search);
        const fMatch = r.frekvenca && r.frekvenca.toLowerCase().includes(search);
        
        return kMatch || lMatch || fMatch;
    });

    if (results.length === 0) return `Ni zadetkov za: ${rawSearch}`;

    // 4. Glava tabele (Retro terminal stil)
    let response = "KLIC     | LOKACIJA            | FREKV.   | TON   | OPOMBA\n";
    response += "---------|---------------------|----------|-------|------------\n";
    
    // Izpis vrstic z uporabo padEnd za poravnavo
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

"morse": async (args) => {
    const morseCode = {
        'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.',
        'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..',
        'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
        's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
        'y': '-.--', 'z': '--..', '1': '.----', '2': '..---', '3': '...--',
        '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
        '9': '----.', '0': '-----', ' ': '/'
    };

    // 1. Združimo vse besede v en niz
    if (!args || args.length === 0) return "Uporaba: morse [besedilo]";
    const textToEncode = args.join(" ");

    const sequence = textToEncode.toLowerCase().split('')
        .map(char => morseCode[char] || "")
        .join(' ');

    try {
        // 2. Ustvarimo AudioContext
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Zbudimo context, če "spi"
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        let time = audioCtx.currentTime;
        const dot = 0.1; // Dolžina pike v sekundah
        const freq = 700; // Frekvenca CW tona (Hz)

        // 3. Predvajanje sekvence
        sequence.split('').forEach(symbol => {
            if (symbol === '.' || symbol === '-') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                const duration = symbol === '.' ? dot : dot * 3;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);

                // Anti-click filter (smooth gain)
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(1, time + 0.005);
                gain.gain.setValueAtTime(1, time + duration - 0.005);
                gain.gain.linearRampToValueAtTime(0, time + duration);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(time);
                osc.stop(time + duration);
                
                // Razmik med znaki znotraj črke
                time += duration + dot;
            } else if (symbol === ' ') {
                // Razmik med črkami
                time += dot * 2;
            } else if (symbol === '/') {
                // Razmik med besedami
                time += dot * 4;
            }
        });

        // 4. Zapremo context po koncu predvajanja, da ne trošimo spomina
        setTimeout(() => audioCtx.close(), (time - audioCtx.currentTime) * 1000 + 500);

        return `Oddajam CW: ${textToEncode.toUpperCase()}\nKoda: ${sequence}`;
        
    } catch (e) {
        return "❌ Napaka: Brskalnik ne dovoli predvajanja zvoka. Poskusi klikniti na terminal pred uporabo.";
    }
},

"rtv": async (args) => {
    try {
        // 1. Pridobimo osnovni RSS vir (rss2json deluje kot proxy, zato tukaj ni CORS težav)
        const rssRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://www.rtvslo.si/feeds/00.xml`);
        const rssData = await rssRes.json();

        // Če ni podane številke, izpišemo seznam
        if (!args || args.length === 0) {
            let list = "🗞️ ZADNJE NOVICE (RTV SLO):\n";
            list += "-------------------------------------------\n";
            rssData.items.slice(0, 10).forEach((item, i) => {
                list += `${(i + 1).toString().padEnd(2)} | ${item.title}\n`;
            });
            return list + "\nVtipkaj 'rtv [številka]' za cel članek z naslovnico.";
        }

        const index = parseInt(args[0]) - 1;
        const item = rssData.items[index];
        if (!item) return "Neveljavna številka. Izberi od 1 do 10.";

        printOutput(`Nalagam članek in generiram ASCII naslovnico...`, "#ffff00");

        // 2. PRIDOBIVANJE VSEBINE PREKO PROXYJA (corsproxy.io za tekst)
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(item.link)}`;
        const response = await fetch(proxyUrl);
        const html = await response.text();
        
        // 3. PARSANJE HTML-ja
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Izluščimo odstavke (pazimo na RTV-jevo strukturo)
        const paragraphs = Array.from(doc.querySelectorAll('article p, .article-body p'))
            .map(p => p.innerText.trim())
            .filter(text => text.length > 40);

        let content = `📖 ${item.title.toUpperCase()}\n`;
        content += `Objavljeno: ${item.pubDate}\n`;
        content += "-------------------------------------------\n\n";

        // 4. GENERIRANJE ASCII NASLOVNICE
        let imageUrl = item.thumbnail || (item.enclosure ? item.enclosure.link : null);
        
        if (imageUrl) {
            try {
                // Popravek za relativne poti
                if (imageUrl.startsWith('/')) {
                    imageUrl = 'https://www.rtvslo.si' + imageUrl;
                }

                // Za slike je corsproxy.io ponavadi boljši kot allorigins
                const imgProxy = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
                
                // Preveri, če tvoja funkcija convertToAscii obstaja
                if (typeof convertToAscii === "function") {
                    const asciiImg = await convertToAscii(imgProxy);
                    content += `<pre style="font-family: 'Courier New', monospace; font-size: 5px; line-height: 1; white-space: pre; color: #23D962; background: black; padding: 10px; border: 1px solid #444; overflow-x: auto;">${asciiImg}</pre>\n\n`;
                }
            } catch (err) {
                content += `[SISTEM]: Naslovnice ni bilo mogoče generirati.\n\n`;
            }
        }

        // 5. SESTAVLJANJE VSEBINE
        if (paragraphs.length === 0) {
            // Rezervni načrt: uporabi description iz RSS, če parsanje HTML ne uspe
            const fallback = item.description.replace(/<[^>]*>?/gm, '');
            content += fallback + "\n\n[OPOMBA]: Celotna vsebina ni bila dosegljiva. Preberi na spletu.";
        } else {
            content += paragraphs.slice(0, 8).join("\n\n"); // Omejimo na prvih 8 odstavkov za preglednost
        }

        content += `\n\n--- KONEC ČLANKA ---\nVir: ${item.link}`;

        return content;

    } catch (e) {
        console.error("RTV Command Error:", e);
        return "Napaka: RTV strežnik trenutno ne odgovarja ali pa je težava s proxy-jem.";
    }
},

"reddit": async (args) => {
    // Prilagoditev: args[0] je subreddit, args[1] je številka objave
    const sub = (args && args.length > 0) ? args[0] : "slovenia";
    const indexInput = (args && args.length > 1) ? args[1] : null;

    printOutput(`Dostopam do r/${sub}...`, "#ff4500");

    try {
        // Uporabimo fetch z Reddit JSON API
        const response = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15`);
        const data = await response.json();

        if (!data.data || !data.data.children.length) return `Subreddit r/${sub} ne obstaja.`;

        const posts = data.data.children;

        // --- NAČIN 1: PRIKAZ POSAMEZNE OBJAVE (npr. reddit slovenia 1) ---
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
                    // Uporabimo corsproxy.io, kot si imel v delujoči kodi
                    const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(post.url)}`;
                    const asciiImg = await convertToAscii(proxiedUrl);
                    
                    content += `<pre style="font-family: 'Courier New', monospace; font-size: 8px; line-height: 1; white-space: pre; overflow-x: auto; color: #23D962; background: black; padding: 10px; border: 1px solid #444;">${asciiImg}</pre>\n`;
                    
                } catch (err) {
                    content += `[NAPAKA]: Slike ni bilo mogoče pretvoriti.`;
                }
            }

            // --- PRIDOBIVANJE KOMENTARJEV ---
            content += `\n\n💬 TOP KOMENTARJI:\n`;
            content += "-------------------------------------------\n";
            
            try {
                const commRes = await fetch(`https://www.reddit.com${post.permalink}.json?limit=6`);
                const commData = await commRes.json();
                const comments = commData[1].data.children;

                if (comments.length > 0) {
                    comments.slice(0, 5).forEach((c, i) => {
                        if (c.data.author && c.data.body) {
                            content += `[${i+1}] u/${c.data.author.padEnd(15)} | ↑${c.data.ups}\n`;
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
            content += `LINK: <a href="https://reddit.com${post.permalink}" target="_blank" style="color: #ff4500; text-decoration: underline;">Odpri na Reddit</a>`;
            return content;
        }

        // --- NAČIN 2: SEZNAM OBJAV (npr. reddit slovenia) ---
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
        return "Napaka pri povezavi z Redditom. Preveri internet ali subreddit.";
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

"note": (args) => {
    let notes = JSON.parse(localStorage.getItem("terminal_notes") || "[]");

    // 1. IZPIS SEZNAMA (če ni argumentov ali če je ukaz 'seznam')
    if (!args || args.length === 0 || args[0].toLowerCase() === "seznam") {
        if (notes.length === 0) return "Beležnica je prazna.";
        let output = "📝 TVOJI ZAPISKI:\n-------------------------------------------\n";
        notes.forEach((n, i) => {
            output += `${(i + 1).toString().padEnd(2)} | [${n.date}] ${n.text}\n`;
        });
        return output;
    }

    const command = args[0].toLowerCase();
    const subArg = args[1]; // Številka pri brisi/edit
    const content = args.slice(2).join(' '); // Novo besedilo pri edit

    // 2. DODAJANJE
    if (command === "dodaj") {
        const textToAdd = args.slice(1).join(' '); // Vzamemo vse od prvega elementa naprej
        if (!textToAdd) return "Napaka: Vpiši besedilo. (npr. note dodaj Kupi kruh)";
        
        notes.push({
            text: textToAdd,
            date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        return `✅ Dodano pod št. ${notes.length}.`;
    }

    // 3. UREJANJE (EDIT)
    if (command === "edit") {
        const index = parseInt(subArg) - 1;
        if (isNaN(index) || !notes[index]) return "Napaka: Neveljavna številka zapiska.";
        if (!content) return `Trenutna vsebina: "${notes[index].text}"\nUporaba: note edit ${subArg} [novo besedilo]`;

        const oldText = notes[index].text;
        notes[index].text = content;
        notes[index].date = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " (urejeno)";
        
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        return `🔄 Posodobljeno!\nPrej: "${oldText}"\nZdaj: "${content}"`;
    }

    // 4. BRISANJE
    if (command === "brisi") {
        const index = parseInt(subArg) - 1;
        if (isNaN(index) || !notes[index]) return "Napaka: Neveljavna številka.";
        const deleted = notes.splice(index, 1);
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        return `🗑️ Izbrisano: "${deleted[0].text}"`;
    }

    // 5. ČIŠČENJE
    if (command === "prazni") {
        localStorage.removeItem("terminal_notes");
        return "🔥 Beležnica izpraznjena.";
    }

    return "Neznan ukaz. Možnosti: note [dodaj | seznam | edit | brisi | prazni]";
},

"nomago": (args) => {
        if (!args || args.length === 0) {
            return "Uporaba: \n'nomago ljubljana [jutri]'\n'nomago domov [jutri]'";
        }

        const relacija = args[0].toLowerCase();
        const zaJutri = args[1] === "jutri";
        
        // --- VOZNI REDI ---
        const urnikLJ = [
        { o: "05:29", t: 64 }, { o: "05:54", t: 43 }, { o: "06:19", t: 43 },
        { o: "06:29", t: 43 }, { o: "06:34", t: 64 }, { o: "06:39", t: 43 },
        { o: "06:59", t: 43 }, { o: "07:59", t: 43 }, { o: "08:24", t: 43 },
        { o: "10:34", t: 64 }, { o: "11:39", t: 43 }, { o: "12:39", t: 64 },
        { o: "13:24", t: 43 }, { o: "14:24", t: 43 }, { o: "14:54", t: 43 },
        { o: "15:24", t: 43 }, { o: "15:39", t: 43 }, { o: "15:54", t: 64 },
        { o: "16:39", t: 64 }, { o: "17:24", t: 43 }, { o: "18:24", t: 43 },
        { o: "19:24", t: 43 }, { o: "20:24", t: 43 }, { o: "21:24", t: 43 }
        ];

      // --- URNIK: LJUBLJANA -> RAKEK (Popoln seznam) ---
        const urnikDOMOV = [
            { o: "07:15", t: 43 }, { o: "08:15", t: 43 }, { o: "10:15", t: 64 },
            { o: "11:15", t: 43 }, { o: "11:45", t: 68 }, { o: "12:15", t: 43 },
            { o: "13:15", t: 43 }, { o: "14:00", t: 43 }, { o: "14:15", t: 43 },
            { o: "14:30", t: 43 }, { o: "14:45", t: 43 }, { o: "15:15", t: 43 },
            { o: "15:30", t: 64 }, { o: "15:45", t: 43 }, { o: "16:15", t: 64 },
            { o: "16:45", t: 43 }, { o: "17:15", t: 43 }, { o: "18:15", t: 64 },
            { o: "18:45", t: 43 }, { o: "19:15", t: 43 }, { o: "19:45", t: 43 },
            { o: "20:15", t: 64 }, { o: "21:15", t: 43 }, { o: "22:15", t: 43 }
        ];

        // Izberemo pravi urnik
        let izbranUrnik = [];
        let naslovRelacije = "";
        
        if (relacija === "ljubljana") {
            izbranUrnik = urnikLJ;
            naslovRelacije = "RAKEK -> LJUBLJANA";
        } else if (relacija === "domov") {
            izbranUrnik = urnikDOMOV;
            naslovRelacije = "LJUBLJANA -> RAKEK";
        } else {
            return `Relacija '${relacija}' ni podprta. Poskusi 'ljubljana' ali 'domov'.`;
        }

        // Priprava časa
        const zdaj = new Date();
        const uraZdaj = zaJutri ? "00:00" : zdaj.getHours().toString().padStart(2, '0') + ":" + zdaj.getMinutes().toString().padStart(2, '0');

        // Funkcija za izračun prihoda
        const getPrihod = (odhod, trajanje) => {
            let [h, m] = odhod.split(':').map(Number);
            let total = h * 60 + m + trajanje;
            return `${Math.floor(total / 60 % 24).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
        };

        let res = zaJutri ? `JUTRI: ${naslovRelacije}\n` : `DANES: ${naslovRelacije}\n`;
        res += "--------------------------------------\n";
        res += "ODHOD | PRIHOD | POT\n";
        res += "------|--------|----------------------\n";

        let najden = false;
        izbranUrnik.forEach(b => {
            if (b.o >= uraZdaj) {
                const prihod = getPrihod(b.o, b.t);
                const pot = b.t > 60 ? "STARA CESTA" : "AVTOCESTA";
                res += `${b.o} | ${prihod}  | ${pot}\n`;
                najden = true;
            }
        });

        return najden ? res : res + "Danes ni več odhodov.";
    },



"clearlog": () => {
    localStorage.removeItem('ham_logs');
    return "Dnevnik je bil uspešno izbrisan.";
},

"lofi": async (args) => {
    // 1. SPOTIFY INTEGRACIJA (pokliče tvoj retro player)
    const lofiPlaylistId = "0vvXsWCC9xrXsKd4FyS8kM";
    if (typeof commands["spotify"] === "function") {
        commands["spotify"]([lofiPlaylistId]);
    }

    // 2. VIZUALNA TRANSFORMACIJA (Prosojnost in barve)
    const root = document.body;
    const inputLine = document.querySelector('.input-line');
    const prompt = document.querySelector('.prompt');
    const cursor = document.querySelector('.cursor');
    const terminal = document.getElementById("terminal");

    // Naredimo ozadja prosojna
    root.style.backgroundColor = "transparent";
    if (terminal) terminal.style.backgroundColor = "transparent";
    if (inputLine) {
        inputLine.style.backgroundColor = "transparent";
        inputLine.style.display = "flex"; // Zagotovimo, da ostane vidna
    }

    // Prebarvamo besedilo, prompt in kurzor v Lofi Pink
    const lofiPink = "#ff79c6";
    root.style.color = lofiPink;
    if (prompt) prompt.style.color = lofiPink;
    if (cursor) cursor.style.color = lofiPink;
    if (cursor) cursor.style.backgroundColor = lofiPink; // Kurzor je blok, zato rabimo bg-color

    // 3. OZADJE (Lofi Girl GIF)
    let bg = document.getElementById("lofi-bg");
    if (!bg) {
        bg = document.createElement("div");
        bg.id = "lofi-bg";
        Object.assign(bg.style, {
            position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh",
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHlseHR0OW5wM2xlOW81dnlzbTR4aGxmcmQ3Y3dwaGoyYW9ib3VrZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XbJYBCi69nyVOffLIU/giphy.gif')`,
            backgroundSize: "cover", backgroundPosition: "center", zIndex: "-2", transition: "opacity 1s"
        });
        document.body.appendChild(bg);
    }
    bg.style.opacity = "1";

    // 4. RETRO ŠTEVEC (25 min)
    let timerDiv = document.getElementById("lofi-timer");
    if (!timerDiv) {
        timerDiv = document.createElement("div");
        timerDiv.id = "lofi-timer";
        Object.assign(timerDiv.style, {
            position: "fixed", bottom: "200px", right: "30px", fontSize: "60px",
            fontFamily: "'Courier New', monospace", color: lofiPink,
            textShadow: `0 0 15px ${lofiPink}`, zIndex: "1000", fontWeight: "bold"
        });
        document.body.appendChild(timerDiv);
    }

    let seconds = 25 * 60;
    if (window.lofiInterval) clearInterval(window.lofiInterval);
    window.lofiInterval = setInterval(() => {
        seconds--;
        let m = Math.floor(seconds / 60).toString().padStart(2, '0');
        let s = (seconds % 60).toString().padStart(2, '0');
        timerDiv.innerText = `${m}:${s}`;
        if (seconds <= 0) {
            clearInterval(window.lofiInterval);
            timerDiv.style.color = "red";
            printOutput("\nTIMER: Čas za odmor!", "red");
        }
    }, 1000);

    return "LOFI NAČIN: AKTIVIRAN. Vrstica in kurzor sta pripravljena.";
},

"lofi-off": (args) => {
    // PONASTAVITEV NA ORIGINALNO ZELENO (#23D962) IN TEMNO OZADJE (#05210b)
    const defGreen = "#23D962";
    const defBg = "#05210b";

    document.body.style.backgroundColor = defBg;
    document.body.style.color = defGreen;

    const inputLine = document.querySelector('.input-line');
    const prompt = document.querySelector('.prompt');
    const cursor = document.querySelector('.cursor');
    const terminal = document.getElementById("terminal");

    if (terminal) terminal.style.backgroundColor = defBg;
    if (inputLine) {
        inputLine.style.backgroundColor = defBg;
        inputLine.style.display = "flex";
    }
    if (prompt) prompt.style.color = defGreen;
    if (cursor) {
        cursor.style.color = defGreen;
        cursor.style.backgroundColor = defGreen;
    }

    const bg = document.getElementById("lofi-bg");
    const timer = document.getElementById("lofi-timer");
    if (bg) bg.style.opacity = "0";
    if (timer) timer.remove();
    
    clearInterval(window.lofiInterval);
    return "Sistemi ponastavljeni na retro zeleno.";
},

"timer": (args) => {
    if (!args || args.length === 0) return "Ukazi: timer [work|short|long|pause|resume|custom]";

    const sub = args[0].toLowerCase();
    
    // Inicializacija globalnega stanja, če ne obstaja
    if (!window.s5timerData) {
        window.s5timerData = { 
            interval: null, 
            timeLeft: 0, 
            isPaused: false,
            default: { work: 25, short: 5, long: 10 }
        };
    }

    const clearActiveTimer = () => {
        if (window.s5timerData.interval) clearInterval(window.s5timerData.interval);
        document.title = "S5-OS Terminal";
    };

    const startClock = (minutes) => {
        clearActiveTimer();
        window.s5timerData.timeLeft = minutes * 60;
        window.s5timerData.isPaused = false;

        window.s5timerData.interval = setInterval(() => {
            if (!window.s5timerData.isPaused) {
                window.s5timerData.timeLeft--;
                
                const m = Math.floor(window.s5timerData.timeLeft / 60);
                const s = window.s5timerData.timeLeft % 60;
                const display = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                
                document.title = `[ ${display} ] LOFI TIMER`;

                if (window.s5timerData.timeLeft <= 0) {
                    clearActiveTimer();
                    triggerAlert();
                }
            }
        }, 1000);
    };

    const triggerAlert = () => {
        let count = 0;
        const alertInt = setInterval(() => {
            document.title = count % 2 === 0 ? "!!! 00:00 !!!" : "             ";
            // Tu lahko dodaš še pisk, če želiš
            count++;
            if (count > 20) clearInterval(alertInt);
        }, 500);
        printOutput("\n🔔 ČAS JE POTELKEL! Utripanje aktivirano.", "#ff5555");
    };

    // Logika za podukaze
    switch(sub) {
        case "work": 
            startClock(window.s5timerData.default.work); 
            return `🍅 Timer: Delo (${window.s5timerData.default.work} min)`;
        case "short": 
            startClock(window.s5timerData.default.short); 
            return "☕ Timer: Kratek odmor (5 min)";
        case "long": 
            startClock(window.s5timerData.default.long); 
            return "🏖️ Timer: Dolg odmor (10 min)";
        case "pause": 
            window.s5timerData.isPaused = true; 
            return "⏸️ Pavza.";
        case "resume": 
            window.s5timerData.isPaused = false; 
            return "▶️ Nadaljujemo.";
        case "custom":
            const newTime = parseInt(args[1]);
            if (isNaN(newTime)) return "Vpiši minute. npr: timer custom 45";
            startClock(newTime);
            return `⏱️ Nastavljeno na ${newTime} min.`;
        default:
            return "Neznan ukaz za timer.";
    }
},

"gaser": async (args) => {
    // 1. POKLIČEMO SPOTIFY (tvoj integriran predvajalnik z Balkan playlisto)
    // Playlist ID za balkan imaš že v objektu: "1o8cVQBpAbW1AaH6uIEpiN"
    if (typeof commands["spotify"] === "function") {
        commands["spotify"](["balkan"]);
    }

    // 2. VIZUALNA TRANSFORMACIJA (Depresivna Balkan Estetika)
    const root = document.body;
    const inputLine = document.querySelector('.input-line');
    const prompt = document.querySelector('.prompt');
    const cursor = document.querySelector('.cursor');
    const terminal = document.getElementById("terminal");

    // Barve: Beton siva, umazana bela
    const concreteGray = "#7a7a7a"; // Barva starega betona
    const dirtyWhite = "#d3d3d3";   // Umazano bela za tekst

    root.style.backgroundColor = "transparent";
    if (terminal) {
        terminal.style.backgroundColor = "transparent";
        terminal.style.color = dirtyWhite;
        terminal.style.textShadow = "2px 2px 4px rgba(0,0,0,0.8)"; // Bolj grob tekst
    }
    
    if (inputLine) {
        inputLine.style.backgroundColor = "transparent";
    }

    // Nastavimo barvo prompta in kurzorja na sivo/belo
    if (prompt) {
        prompt.style.color = concreteGray;
        prompt.innerText = "GASER@S5-OS:~$"; // Spremenimo prompt za gaser vibe
    }
    if (cursor) {
        cursor.style.backgroundColor = concreteGray;
    }

    // 3. OZADJE (Tu boš ti dodal svoj GIF)
    let bg = document.getElementById("gaser-bg");
    if (!bg) {
        bg = document.createElement("div");
        bg.id = "gaser-bg";
        Object.assign(bg.style, {
            position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh",
            // TUKAJ ZAMENJAJ URL S SVOJIM GIFOM (npr. kakšen siv blok, beton, dež)
            backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXM1amM4NHNwYXJmOXJheTR0bmJoYTI0dW1jbTlkdmg2Z3B3dnFuMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LRaYw1oWAeAgcM7Gb0/giphy.gif')`,
            backgroundSize: "cover", backgroundPosition: "center", zIndex: "-2", transition: "opacity 1.5s"
        });
        document.body.appendChild(bg);
    }
    bg.style.opacity = "1";

    // 4. "DEPRESIVNI" ŠTEVEC (25 min)
    let timerDiv = document.getElementById("gaser-timer");
    if (!timerDiv) {
        timerDiv = document.createElement("div");
        timerDiv.id = "gaser-timer";
        Object.assign(timerDiv.style, {
            position: "fixed", bottom: "200px", right: "30px", fontSize: "50px",
            fontFamily: "'Courier New', monospace", color: concreteGray,
            zIndex: "1000", fontWeight: "bold", opacity: "1"
        });
        document.body.appendChild(timerDiv);
    }

    let seconds = 25 * 60;
    if (window.gaserInterval) clearInterval(window.gaserInterval);
    window.gaserInterval = setInterval(() => {
        seconds--;
        let m = Math.floor(seconds / 60).toString().padStart(2, '0');
        let s = (seconds % 60).toString().padStart(2, '0');
        timerDiv.innerText = `${m}:${s}`;
        
        if (seconds <= 0) {
            clearInterval(window.gaserInterval);
            timerDiv.style.color = "red";
            timerDiv.innerText = "KONEC BRATE";
        }
    }, 1000);

    return "👟 GASER MODE AKTIVIRAN. Balkan playlista teče. Brate, fokus.";
},

"gaser-off": (args) => {
    // Reset na originalne nastavitve
    const defGreen = "#23D962";
    const defBg = "#05210b";

    document.body.style.backgroundColor = defBg;
    document.body.style.color = defGreen;

    const inputLine = document.querySelector('.input-line');
    const prompt = document.querySelector('.prompt');
    const cursor = document.querySelector('.cursor');
    
    if (inputLine) inputLine.style.backgroundColor = defBg;
    if (prompt) {
        prompt.style.color = defGreen;
        prompt.innerText = ">"; // Vrnemo originalen prompt
    }
    if (cursor) cursor.style.backgroundColor = defGreen;

    const bg = document.getElementById("gaser-bg");
    const timer = document.getElementById("gaser-timer");
    if (bg) bg.style.opacity = "0";
    if (timer) timer.remove();
    
    clearInterval(window.gaserInterval);
    return "🌑 Nazaj v realnost.";
},

"glitch": (args) => {
    triggerGlitch();
    return "SISTEMSKA NESTABILNOST ZAZNANA... Prilagajam frekvenco.";
}

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

    // Razbijemo vnos na besede
    const parts = rawInput.split(/\s+/);
    const cleanCmd = parts[0].toLowerCase();
    const args = parts.slice(1); // To so vsi dodatki za ukazom (npr. ["ljubljana", "jutri"])

    // Izpis ukaza v terminal
    const cmdLine = document.createElement('div');
    cmdLine.className = 'history-item';
    cmdLine.innerHTML = `<span class="prompt">primoz@vovk:~$</span> ${cmd}`;
    output.appendChild(cmdLine);

    if (cleanCmd === 'clear') {
        output.innerHTML = '';
        return;
    }

    let response = "";
    if (commands[cleanCmd]) {
        // Funkciji pošljemo SEZNAM argumentov namesto enega niza
        response = await commands[cleanCmd](args);
    } else {
        response = uiText[currentLang].unknown;
    }

    if (response) printOutput(response);
}

function triggerGlitch() {
    const el = document.body; // Targetiramo celo stran, da ne moreš zgrešiti
    
    // 1. Dodamo class
    el.classList.add('glitch-active');
    
    // 2. Prisilimo odstranitev po natanko 250ms
    setTimeout(() => {
        el.classList.remove('glitch-active');
        
        // Za vsak slučaj ročno pobrišemo stile, če bi kaj ostalo
        el.style.transform = "";
        el.style.filter = "";
    }, 250); 
}



// --- BOOT SEKVENCA ---
function bootSequence() {
    output.innerHTML = ''; 
    const rptCount = (typeof rptDatabase !== 'undefined' ? rptDatabase.length : "0");
    
    // Uporabimo ustrezen pozdrav iz uiText
    const bootText = uiText[currentLang].boot;
    
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
            e.preventDefault(); // PREPREČI, da brskalnik vrže kurzor na začetek
            historyIndex--;
            input.value = history[historyIndex];
            displayText.innerText = input.value;
            
            // Premaknemo kurzor na konec (za vsak slučaj še programsko)
            const len = input.value.length;
            input.setSelectionRange(len, len);
        }
    } else if (e.key === 'ArrowDown') {
        if (historyIndex < history.length - 1) {
            e.preventDefault(); // Prepreči skakanje kurzorja
            historyIndex++;
            input.value = history[historyIndex];
            displayText.innerText = input.value;
            
            const len = input.value.length;
            input.setSelectionRange(len, len);
        } else {
            historyIndex = history.length;
            input.value = '';
            displayText.innerText = '';
        }
    }
});

async function convertToAscii(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        // Če podatki pridejo kot Base64 (preko proxyja), ne rabimo crossOrigin
        // Ampak ga pustimo za vsak slučaj
        if (!dataUrl.startsWith('data:')) {
            img.crossOrigin = "anonymous";
        }

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const width = 100;
            const height = Math.floor(width * (img.height / img.width) * 0.5);
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height).data;
            
            const chars = "@%#*+=-:. ";
            let ascii = "";
            for (let i = 0; i < imageData.length; i += 4) {
                const avg = (imageData[i] + imageData[i+1] + imageData[i+2]) / 3;
                const charIdx = Math.floor((avg / 255) * (chars.length - 1));
                ascii += chars[charIdx];
                if (((i / 4) + 1) % width === 0) ascii += "\n";
            }
            resolve(ascii);
        };
        img.onerror = () => reject("Napaka pri branju slike.");
        img.src = dataUrl; // Tukaj vstavimo vsebino slike
    });
}


// Povezava skritega inputa z vidnim besedilom
input.addEventListener('input', () => displayText.innerText = input.value);

// Fokus na input ob kliku kjerkoli v terminalu
document.addEventListener('click', () => input.focus());

// Zagon terminala
bootSequence();

document.addEventListener('click', () => input.focus());

window.onload = () => {
    setTimeout(triggerGlitch, 500);
    setTimeout(triggerGlitch, 700); // Dvojni "trzaj" za boljši retro efekt
};

