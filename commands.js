Object.assign(commands, {
    "hamclock": () => {
        window.open("https://openhamclock.com/", "_blank");
        return "Odpiram OpenHamClock... 73!";
    },

"google": async (args) => {
    if (!args || args.length === 0) return "Uporaba: google [vsebina]";
    
    const query = args.join(" ");
    printOutput(`> Iščem bazo podatkov: ${query.toUpperCase()}...`, "#23D962");

    try {
        // Uporabimo DuckDuckGo API za pridobivanje rezultatov
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
        const data = await res.json();

        let outputHTML = `<br><span style="color: #ffff00">REZULTATI ZA: ${query}</span><br>`;
        outputHTML += `--------------------------------------------------<br>`;

        // 1. Glavni povzetek (Abstract)
        if (data.AbstractText) {
            outputHTML += `<div style="margin-bottom: 10px;">`;
            outputHTML += `<span style="color: #00ff00">[POVZETEK]</span><br>${data.AbstractText}<br>`;
            outputHTML += `<a href="${data.AbstractURL}" target="_blank" style="color: #5555ff;">Preberi več na viru...</a></div>`;
        }

        // 2. Seznam povezav (Related Topics)
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            outputHTML += `<span style="color: #00ff00">[POVEZAVE]</span><br>`;
            // Vzamemo prvih 5 rezultatov, da ne zasmetimo terminala
            data.RelatedTopics.slice(0, 5).forEach((item, i) => {
                if (item.Text && item.FirstURL) {
                    // Ustvarimo klikljivo povezavo
                    outputHTML += `${i+1}. <a href="${item.FirstURL}" target="_blank" style="color: #5555ff; text-decoration: underline;">${item.Text}</a><br>`;
                }
            });
        }

        outputHTML += `--------------------------------------------------<br>Ready.`;
        
        // Ker uporabljamo async, moramo izpisati ročno in vrniti prazen niz
        printOutput(outputHTML);
        return "";

    } catch (e) {
        return "❌ Napaka: Neuspešna povezava z iskalnim vozliščem.";
    }
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


    "note": (args) => {
    // Pridobimo podatke iz lokalne shrambe brskalnika
    let notes = JSON.parse(localStorage.getItem("terminal_notes") || "[]");

    // 1. IZPIS SEZNAMA (če ni argumenta ali je 'seznam')
    if (!args || args.length === 0 || args[0] === "seznam") {
        if (notes.length === 0) return "Beležnica je prazna. Dodaj zapis z 'note dodaj [besedilo]'.";
        let output = "📝 TVOJI ZAPISKI:\n-------------------------------------------\n";
        notes.forEach((n, i) => {
            output += `${(i + 1).toString().padEnd(3)} | [${n.date}] ${n.text}\n`;
        });
        return output;
    }

    const subCommand = args[0].toLowerCase();
    const subArg = args[1]; // Številka zapiska (pri edit/brisi)
    const content = args.slice(2).join(' '); // Novo besedilo

    // 2. DODAJANJE NOVEGA ZAPISKA
    if (subCommand === "dodaj") {
        const textToAdd = args.slice(1).join(' ');
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

"radio": async (args) => {
    const action = args[0]?.toLowerCase();
    
    // 1. IZKLOP RADIJA
    if (action === "off" || action === "stop") {
        if (currentRadio) {
            currentRadio.pause();
            currentRadio = null;
            return "📻 Radio ugasnjen. Tišina v etru.";
        }
        return "Radio že tako ne igra.";
    }
    
    // 2. SEZNAM FIKSNIH POSTAJ
    if (action === "list") {
        const fiksne = Object.keys(radioStations);
        return `FIKSNE POSTAJE: ${fiksne.join(", ")}\n\n(Vse ostalo se išče v živo preko Radio-Browser API-ja!)`;
    }
    
    if (!action) return "Uporaba: radio [postaja] ali radio off. Tipkaj 'radio list' za fiksne postaje.";
    
    // 3. PREDVAJANJE FIKSNE POSTAJE (če obstaja v tvojem objektu)
    if (radioStations[action]) {
        if (currentRadio) currentRadio.pause();
        currentRadio = new Audio(radioStations[action]);
        currentRadio.play().catch(() => {});
        triggerGlitch();
        return `📡 Predvajam: ${action.toUpperCase()}`;
    }
    
    // 4. PROSTO ISKANJE (Za vse ostale besede)
    // Združimo vse argumente v en iskalni niz (npr. "radio big r rock" -> "big r rock")
    const searchQuery = args.join(" "); 
    printOutput(`📡 Iščem delujoč stream za: ${searchQuery.toUpperCase()}...`, "#ffff00");
    
    try {
        // Uporabimo splošni iskalni endpoint, ki išče po imenu in tagih hkrati
        const url = `https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(searchQuery)}&limit=10&order=clickcount&reverse=true&hidebroken=true&codec=MP3&ssl=true`;
        
        const res = await fetch(url, { headers: { 'User-Agent': 'S5-OS-Terminal/1.1' } });
        const data = await res.json();
        
        // Poiščemo prvo postajo, ki ima varen (HTTPS) stream
        const station = data.find(s => s.url_resolved && s.url_resolved.startsWith('https'));
        
        if (!station) {
            // Če nismo našli ničesar po imenu, poskusimo še enkrat strogo po tagu kot fallback
            const fallbackUrl = `https://de1.api.radio-browser.info/json/stations/bytag/${encodeURIComponent(searchQuery)}?limit=10&order=clickcount&reverse=true&hidebroken=true&codec=MP3&ssl=true`;
            const fallbackRes = await fetch(fallbackUrl, { headers: { 'User-Agent': 'S5-OS-Terminal/1.1' } });
            const fallbackData = await fallbackRes.json();
            const fallbackStation = fallbackData.find(s => s.url_resolved && s.url_resolved.startsWith('https'));
            
            if (!fallbackStation) {
                return `❌ Ni delujoče postaje za: "${searchQuery}". Poskusi z drugim iskanjem.`;
            }
            
            return playRadio(fallbackStation);
        }
        
        return playRadio(station);
        
    } catch(e) {
        console.log("Radio napaka:", e);
        return `❌ Napaka pri iskanju streama: ${e.message}`;
    }
    
    // Pomožna funkcija za zagon radia, da ne podvajava kode
    function playRadio(station) {
        if (currentRadio) currentRadio.pause();
        currentRadio = new Audio(station.url_resolved);
        currentRadio.play().catch(() => {});
        triggerGlitch();
        return `📡 Predvajam: ${station.name}\n📶 ${station.url_resolved.substring(0, 60)}...`;
    }
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
            endGame();
            alert("GAME OVER! Rezultat: " + score);
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

    const originalKeydown = window.onkeydown;
    window.onkeydown = (e) => {
        if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
        if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
        if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
        if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
    };

    const endGame = () => {
        clearInterval(game);
        canvas.remove();
        window.onkeydown = originalKeydown; // Obnovi originalni handler
    };

    canvas.onclick = () => { endGame(); };
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
        const player = document.getElementById('spotify-container');
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
            // Priprava datuma iz shranjenega UTC timestampa (format: "2026-02-19 15:30z")
            let dateStr, timeStr;
            try {
                const parts = l.timestamp.split(' ');
                dateStr = parts[0].replace(/-/g, ''); // "20260219"
                timeStr = parts[1].replace('z', '').replace(':', ''); // "1530"
            } catch(e) {
                // Fallback na današnji datum, če parsanje spodleti
                const d = new Date();
                dateStr = d.getUTCFullYear().toString() + 
                          (d.getUTCMonth() + 1).toString().padStart(2, '0') + 
                          d.getUTCDate().toString().padStart(2, '0');
                timeStr = d.getUTCHours().toString().padStart(2, '0') + 
                          d.getUTCMinutes().toString().padStart(2, '0');
            }

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
        // 1. Pridobimo osnovni RSS vir
        const rssRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://www.rtvslo.si/feeds/00.xml`);
        const rssData = await rssRes.json();
        
        // Če ni podane številke, izpišemo seznam
        if (!args || args.length === 0) {
            let list = "🗞️ ZADNJE NOVICE (RTV SLO):\n";
            list += "-------------------------------------------\n";
            rssData.items.slice(0, 10).forEach((item, i) => {
                list += `${(i + 1).toString().padEnd(2)} | ${item.title}\n`;
            });
            return list + "\nVtipkaj 'rtv [številka]' za cel članek.";
        }
        
        const index = parseInt(args[0]) - 1;
        const item = rssData.items[index];
        if (!item) return "Neveljavna številka. Izberi od 1 do 10.";
        
        printOutput(`Nalagam članek...`, "#ffff00");
        
        // 2. PRIDOBIVANJE VSEBINE - uporabimo različne proxy-je
        let html = "";
        let success = false;
        
        // Poskusi več proxy rešitev
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(item.link)}`,
            `https://corsproxy.io/?${encodeURIComponent(item.link)}`,
        ];
        
        for (const proxyUrl of proxies) {
            try {
                const response = await fetch(proxyUrl);
                html = await response.text();
                if (html.length > 1000) { // Preveri, če je dejansko dobil vsebino
                    success = true;
                    break;
                }
            } catch (e) {
                console.log(`Proxy ${proxyUrl} ni deloval, poskušam naslednjega...`);
            }
        }
        
        if (!success) {
            // Če vsi proxyji odpovejo, uporabi vsaj RSS description
            let content = `📖 ${item.title.toUpperCase()}\n`;
            content += `Objavljeno: ${item.pubDate}\n`;
            content += "-------------------------------------------\n\n";
            const cleanDesc = item.description.replace(/<[^>]*>?/gm, '');
            content += cleanDesc;
            content += `\n\n[OPOMBA]: Celotna vsebina ni dostopna zaradi omejitev.\nPreberi na: ${item.link}`;
            return content;
        }
        
        // 3. PARSANJE HTML-ja
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // RTV Slovenija uporablja različne selectore, poskusi vse
        const selectors = [
            'article p',
            '.article-body p',
            '.article__body p',
            '.article-content p',
            '[class*="article"] p',
            '.lead',
            'main p'
        ];
        
        let paragraphs = [];
        for (const selector of selectors) {
            paragraphs = Array.from(doc.querySelectorAll(selector))
                .map(p => p.innerText.trim())
                .filter(text => text.length > 30 && !text.includes('©') && !text.includes('RTV'));
            
            if (paragraphs.length > 0) break;
        }
        
        let content = `📖 ${item.title.toUpperCase()}\n`;
        content += `Objavljeno: ${item.pubDate}\n`;
        content += "-------------------------------------------\n\n";
        
        // 4. GENERIRANJE ASCII NASLOVNICE
        let imageUrl = item.thumbnail || (item.enclosure ? item.enclosure.link : null);
        
        if (imageUrl) {
            try {
                if (imageUrl.startsWith('/')) {
                    imageUrl = 'https://www.rtvslo.si' + imageUrl;
                }
                
                // Poskusi pridobiti sliko preko proxy-ja
                const imgProxy = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=100&output=png`;
                
                if (typeof convertToAscii === "function") {
                    const asciiImg = await convertToAscii(imgProxy);
                    content += `<pre style="font-family: 'Courier New', monospace; font-size: 0.6rem; line-height: 1; white-space: pre; color: #23D962; background: black; padding: 10px; border: 1px solid #444; overflow-x: auto;">${asciiImg}</pre>\n\n`;
                }
            } catch (err) {
                console.log("ASCII konverzija ni uspela:", err);
            }
        }
        
        // 5. SESTAVLJANJE VSEBINE
        if (paragraphs.length === 0) {
            // Če HTML parsing odpove, uporabi RSS description
            const fallback = item.description.replace(/<[^>]*>?/gm, '');
            content += fallback + "\n\n[OPOMBA]: Celotna vsebina ni bila dosegljiva.";
        } else {
            // Dodaj povzetek/lead, če obstaja
            const lead = doc.querySelector('.lead, .article-lead, [class*="lead"]');
            if (lead) {
                content += `${lead.innerText.trim()}\n\n`;
            }
            
            content += paragraphs.join("\n\n");
        }
        
        content += `\n\n--- KONEC ČLANKA ---\nVir: ${item.link}`;
        return content;
        
    } catch (e) {
        console.error("RTV Command Error:", e);
        return `Napaka: ${e.message}\nRTV strežnik trenutno ne odgovarja ali pa je težava s proxy-jem.`;
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
    
    // HELP
    if (args && (args[0] === "help" || args[0] === "?")) {
        return `📝 BELEŽNICA - NAVODILA
-------------------------------------------
note                → Prikaže vse zapiske
note nov [tekst]    → Ustvari NOV zapis
note dodaj [tekst]  → Doda vrstico k zadnjemu zapisku
note [številka]     → Prikaže polno vsebino zapiska
note edit [št] [nov tekst] → Uredi zapis
note brisi [št]     → Izbriše zapis
note išči [beseda]  → Išče po zapiskah
note export         → Izvozi kot .txt datoteko
note prazni         → Izbriše vse (zahteva potrditev)
-------------------------------------------
Primer: 
  note nov S59REP 145.700 MHz
  note dodaj Potreben tone 123.0 Hz
  note dodaj Lokacija: Krvavec`;
    }
    
    // 1. IZPIS SEZNAMA (če ni argumentov)
    if (!args || args.length === 0) {
        if (notes.length === 0) {
            return "📝 Beležnica je prazna.\n💡 Vtipkaj 'note nov [tekst]' za nov zapis ali 'note help' za pomoč.";
        }
        
        let output = "📝 TVOJI ZAPISKI:\n-------------------------------------------\n";
        notes.forEach((n, i) => {
            // Vzemi prvo vrstico za pregled
            const firstLine = n.text.split('\n')[0];
            const preview = firstLine.length > 60 ? firstLine.substring(0, 60) + "..." : firstLine;
            const lineCount = n.text.split('\n').length;
            const lineInfo = lineCount > 1 ? ` (${lineCount} vrstic)` : "";
            
            output += `${(i + 1).toString().padEnd(3)} | ${preview}${lineInfo}\n`;
            output += `      └─ ${n.date}\n`;
        });
        output += `\n💡 Vtipkaj 'note [številka]' za polno vsebino`;
        return output;
    }
    
    const command = args[0].toLowerCase();
    
    // 2. PRIKAZ POSAMEZNEGA ZAPISKA (samo številka)
    if (!isNaN(parseInt(command))) {
        const index = parseInt(command) - 1;
        if (!notes[index]) return `❌ Zapis #${command} ne obstaja. Imaš ${notes.length} zapiskov.`;
        
        return `📄 ZAPIS #${command}
-------------------------------------------
${notes[index].text}
-------------------------------------------
📅 ${notes[index].date}
💡 Dodaj vrstico: note dodaj [tekst]
💡 Uredi z: note edit ${command} [novo besedilo]`;
    }
    
    const subArg = args[1];
    const content = args.slice(2).join(' ');
    
    // 3. NOV ZAPIS (prej "dodaj")
    if (command === "nov" || command === "new") {
        const textToAdd = args.slice(1).join(' ');
        if (!textToAdd) return "❌ Napaka: Vpiši besedilo.\n💡 Primer: note nov Testiraj S59REP 145.700";
        
        notes.push({
            text: textToAdd,
            date: new Date().toLocaleDateString('sl-SI') + " " + new Date().toLocaleTimeString('sl-SI', {hour: '2-digit', minute:'2-digit'})
        });
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        return `✅ Nov zapis ustvarjen pod št. ${notes.length}\n📝 "${textToAdd}"`;
    }
    
    // 4. DODAJ VRSTICO K ZADNJEMU ZAPISKU
    if (command === "dodaj" || command === "add" || command === "append") {
        const textToAppend = args.slice(1).join(' ');
        if (!textToAppend) return "❌ Napaka: Vpiši besedilo.\n💡 Primer: note dodaj Potreben tone 123.0 Hz";
        
        if (notes.length === 0) {
            // Če ni še nobenega zapiska, ustvari prvega
            notes.push({
                text: textToAppend,
                date: new Date().toLocaleDateString('sl-SI') + " " + new Date().toLocaleTimeString('sl-SI', {hour: '2-digit', minute:'2-digit'})
            });
            localStorage.setItem("terminal_notes", JSON.stringify(notes));
            return `✅ Nov zapis ustvarjen (beležnica je bila prazna)\n📝 "${textToAppend}"`;
        }
        
        // Dodaj k zadnjemu zapisku
        const lastIndex = notes.length - 1;
        notes[lastIndex].text += "\n" + textToAppend;
        notes[lastIndex].date = new Date().toLocaleDateString('sl-SI') + " " + 
                               new Date().toLocaleTimeString('sl-SI', {hour: '2-digit', minute:'2-digit'}) + " (posodobljeno)";
        
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        
        return `✅ Dodano k zapisku #${notes.length}
-------------------------------------------
${notes[lastIndex].text}
-------------------------------------------
💡 Nadaljuj z 'note dodaj [še več teksta]'`;
    }
    
    // 5. DODAJ K DOLOČENEMU ZAPISKU
    if (command === "dodajk" || command === "appendto") {
        const index = parseInt(subArg) - 1;
        const textToAppend = args.slice(2).join(' ');
        
        if (isNaN(index) || !notes[index]) {
            return `❌ Neveljavna številka zapiska.\n💡 Uporaba: note dodajk [številka] [tekst]`;
        }
        
        if (!textToAppend) return "❌ Vpiši besedilo za dodajanje.";
        
        notes[index].text += "\n" + textToAppend;
        notes[index].date = new Date().toLocaleDateString('sl-SI') + " " + 
                           new Date().toLocaleTimeString('sl-SI', {hour: '2-digit', minute:'2-digit'}) + " (posodobljeno)";
        
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        
        return `✅ Dodano k zapisku #${subArg}
-------------------------------------------
${notes[index].text}
-------------------------------------------`;
    }
    
    // 6. UREJANJE (PREPIŠE CEL ZAPIS)
    if (command === "edit" || command === "uredi") {
        const index = parseInt(subArg) - 1;
        if (isNaN(index) || !notes[index]) {
            return `❌ Neveljavna številka zapiska.\n💡 Uporaba: note edit [številka] [novo besedilo]`;
        }
        
        if (!content) {
            return `📄 TRENUTNA VSEBINA #${subArg}:
-------------------------------------------
${notes[index].text}
-------------------------------------------
💡 Uporaba: note edit ${subArg} [novo besedilo]`;
        }
        
        const oldText = notes[index].text;
        notes[index].text = content;
        notes[index].date = new Date().toLocaleDateString('sl-SI') + " " + 
                           new Date().toLocaleTimeString('sl-SI', {hour: '2-digit', minute:'2-digit'}) + " (urejeno)";
        
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        return `🔄 ZAPIS #${subArg} PREPISAN!
-------------------------------------------
Prej: 
${oldText}
-------------------------------------------
Zdaj: 
${content}`;
    }
    
    // 7. BRISANJE
    if (command === "brisi" || command === "delete" || command === "del") {
        const index = parseInt(subArg) - 1;
        if (isNaN(index) || !notes[index]) {
            return `❌ Neveljavna številka.\n💡 Primer: note brisi 3`;
        }
        
        const deleted = notes.splice(index, 1);
        localStorage.setItem("terminal_notes", JSON.stringify(notes));
        return `🗑️ IZBRISANO (${deleted[0].date}):
"${deleted[0].text}"`;
    }
    
    // 8. ISKANJE
    if (command === "išči" || command === "search" || command === "find") {
        const searchTerm = args.slice(1).join(' ').toLowerCase();
        if (!searchTerm) return "❌ Vnesi iskalni izraz.\n💡 Primer: note išči repeater";
        
        const found = notes.filter((n, i) => {
            return n.text.toLowerCase().includes(searchTerm);
        }).map((n, originalIndex) => {
            const idx = notes.indexOf(n);
            const firstLine = n.text.split('\n')[0];
            return `${(idx + 1).toString().padEnd(3)} | ${firstLine}\n      └─ ${n.date}`;
        });
        
        if (found.length === 0) return `🔍 Ni zadetkov za "${searchTerm}"`;
        
        return `🔍 NAJDENO ${found.length} ZADETKOV ZA "${searchTerm}":
-------------------------------------------
${found.join('\n')}`;
    }
    
    // 9. EXPORT
    if (command === "export" || command === "izvozi") {
        if (notes.length === 0) return "❌ Beležnica je prazna, ni kaj izvoziti.";
        
        let exportText = "=== MOJI ZAPISKI S5-OS TERMINAL ===\n";
        exportText += `Izvoženo: ${new Date().toLocaleString('sl-SI')}\n`;
        exportText += "=".repeat(50) + "\n\n";
        
        notes.forEach((n, i) => {
            exportText += `[${i + 1}] ${n.date}\n`;
            exportText += `${n.text}\n`;
            exportText += "-".repeat(50) + "\n\n";
        });
        
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zapiski_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        return `✅ Datoteka izvožena!\n📁 zapiski_${new Date().toISOString().split('T')[0]}.txt\n📊 Skupaj ${notes.length} zapiskov`;
    }
    
    // 10. ČIŠČENJE
    if (command === "prazni" || command === "clear") {
        const lastClearAttempt = sessionStorage.getItem("note_clear_attempt");
        const now = Date.now();
        
        if (!lastClearAttempt || (now - parseInt(lastClearAttempt)) > 5000) {
            sessionStorage.setItem("note_clear_attempt", now.toString());
            return `⚠️ POZOR: To bo izbrisalo VSE zapiske (${notes.length})!
🔁 Ponovi ukaz 'note prazni' v 5s za potrditev.`;
        } else {
            sessionStorage.removeItem("note_clear_attempt");
            const count = notes.length;
            localStorage.removeItem("terminal_notes");
            return `🔥 Beležnica izpraznjena. Izbrisanih ${count} zapiskov.`;
        }
    }
    
    // 11. STATISTIKA
    if (command === "stat" || command === "stats") {
        if (notes.length === 0) return "📊 Beležnica je prazna.";
        
        const totalChars = notes.reduce((sum, n) => sum + n.text.length, 0);
        const totalLines = notes.reduce((sum, n) => sum + n.text.split('\n').length, 0);
        const avgLength = Math.round(totalChars / notes.length);
        const longest = notes.reduce((max, n) => n.text.length > max.text.length ? n : max);
        const newest = notes[notes.length - 1];
        const oldest = notes[0];
        
        return `📊 STATISTIKA BELEŽNICE
-------------------------------------------
📝 Skupaj zapiskov: ${notes.length}
📄 Skupaj vrstic: ${totalLines}
📏 Povprečna dolžina: ${avgLength} znakov
📐 Najdaljši zapis: ${longest.text.split('\n')[0].substring(0, 40)}... (${longest.text.length} znakov)
🆕 Najnovejši: ${newest.date}
📅 Najstarejši: ${oldest.date}`;
    }
    
    return `❌ Neznan ukaz: "${command}"
💡 Vtipkaj 'note help' za navodila.`;
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
},

"propagation": async (args) => {
    printOutput("📡 Pridobivam podatke o solarni aktivnosti...", "#23D962");

    try {
        const res = await fetch("https://www.hamqsl.com/solar101vhfper.php");
        const text = await res.text();

        // Parsamo ključne vrednosti iz XML/HTML odgovora
        const get = (tag) => {
            const m = text.match(new RegExp(`<${tag}[^>]*>([^<]+)<\/${tag}>`));
            return m ? m[1].trim() : "N/A";
        };

        const sfi      = get("solarflux");
        const aIndex   = get("aindex");
        const kIndex   = get("kindex");
        const xRay     = get("xray");
        const sunspots = get("sunspots");
        const updated  = get("updated");

        // Barvni indikator za K-indeks
        const kNum = parseInt(kIndex);
        let kStatus, kColor;
        if (kNum <= 1)      { kStatus = "ODLIČNO  "; kColor = "#23D962"; }
        else if (kNum <= 3) { kStatus = "DOBRO    "; kColor = "#88ffad"; }
        else if (kNum <= 5) { kStatus = "ZMERNO   "; kColor = "#ffff00"; }
        else                { kStatus = "MOTNJE!  "; kColor = "#ff4444"; }

        // Band conditions vizualni prikaz
        const bands = [
            { name: "160m", freq: "1.8 MHz",  kThresh: 1 },
            { name: "80m",  freq: "3.5 MHz",  kThresh: 2 },
            { name: "40m",  freq: "7 MHz",    kThresh: 3 },
            { name: "20m",  freq: "14 MHz",   kThresh: 4 },
            { name: "15m",  freq: "21 MHz",   kThresh: 5 },
            { name: "10m",  freq: "28 MHz",   kThresh: 6 },
            { name: "6m",   freq: "50 MHz",   kThresh: 7 },
            { name: "2m",   freq: "144 MHz",  kThresh: 8 },
        ];

        let bandBar = "";
        bands.forEach(b => {
            const sfiNum = parseInt(sfi);
            // Grob izračun odprtosti pasu glede na SFI in K-indeks
            const open = sfiNum > 100 && kNum < b.kThresh;
            const partial = sfiNum > 70 && kNum < b.kThresh + 2;
            const sym  = open ? "██" : partial ? "▓▓" : "░░";
            const col  = open ? "#23D962" : partial ? "#ffff00" : "#555555";
            bandBar += `<span style="color:${col}">${b.name.padEnd(5)} ${sym}  ${open ? "ODPRT" : partial ? "DELNO" : "ZAPRT"}</span>\n`;
        });

        const out = `
<span style="color:#88ffad">╔══════════════════════════════════════════╗
║     S5-OS SOLARNI PROPAGACIJSKI MODUL    ║
╚══════════════════════════════════════════╝</span>

<span style="color:#23D962">SOLARNI FLUX (SFI):</span> ${sfi}          <span style="color:#888">(>150 = odlično DX)</span>
<span style="color:#23D962">SONČEVE PEGE:     </span> ${sunspots}
<span style="color:#23D962">A-INDEKS:         </span> ${aIndex}          <span style="color:#888">(<10 = mirno)</span>
<span style="color:#23D962">K-INDEKS:         </span> <span style="color:${kColor}">${kIndex} — ${kStatus}</span>
<span style="color:#23D962">X-RAY AKTIVNOST:  </span> ${xRay}

<span style="color:#88ffad">STANJE PASOV (DAN):</span>
${bandBar}
<span style="color:#555">Posodobljeno: ${updated}</span>
<span style="color:#555">Vir: HamQSL.com | Tipkaj 'dx' za live DX spote</span>`;

        printOutput(out);
        return "";

    } catch(e) {
        return "❌ Napaka: Ne morem doseči solarnih senzorjev.\nPreveri: https://www.hamqsl.com/solar.html";
    }
},

"dx": async (args) => {
    printOutput("📡 Iščem DX spote po svetu...", "#23D962");

    try {
        // DX Cluster RSS feed preko proxyja
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent("https://www.dxwatch.com/dxsd1/s.php?s=0&r=20&cdx=1")}`;
        const res = await fetch(proxyUrl);
        const data = await res.json();
        const text = data.contents;

        // Parsamo vrstice: format je "DX de SPOTTER: FREQ CALLSIGN kommt..."
        const lines = text.split('\n').filter(l => l.includes(':'));
        
        if (!lines.length) return "❌ Ni DX spotov trenutno ali strežnik ne odgovarja.";

        let table = `<span style="color:#88ffad">╔═══════════════════════════════════════════════════════╗
║               LIVE DX SPOTI — DXWatch.com             ║
╚═══════════════════════════════════════════════════════╝</span>\n\n`;
        table += `<span style="color:#555">FREKVENCA  KLIC         SPOTTER      ČAS    KOM.\n`;
        table += `---------- ------------ ------------ ------ -------</span>\n`;

        lines.slice(0, 15).forEach(line => {
            // Format: "DX de SPOTTER-#:    FREQ    CALLSIGN   comment   HHMM"
            const m = line.match(/DX de\s+(\S+)[:#\s]+(\d+\.?\d*)\s+(\S+)\s+(.*?)\s+(\d{4})Z?\s*$/i);
            if (m) {
                const spotter  = m[1].replace(/-\d+$/, '').substring(0, 11).padEnd(12);
                const freq     = m[2].padEnd(10);
                const callsign = m[3].padEnd(12);
                const time     = m[5].replace(/(\d{2})(\d{2})/, '$1:$2');
                const comment  = m[4].trim().substring(0, 7);

                // Obarvamo glede na pas
                const freqNum = parseFloat(m[2]);
                let color = "#23D962";
                if (freqNum < 10)        color = "#88ffad";
                else if (freqNum < 30)   color = "#23D962";
                else if (freqNum < 100)  color = "#ffff00";
                else                     color = "#88aaff";

                table += `<span style="color:${color}">${freq} ${callsign} ${spotter} ${time}  ${comment}</span>\n`;
            }
        });

        table += `\n<span style="color:#555">Vir: DXWatch.com | Posodobljeno pravkar\nTipkaj 'prefix [klic]' za info o kateri koli postaji</span>`;

        printOutput(table);
        return "";

    } catch(e) {
        return "❌ DX klaster nedosegljiv.\nRočno: https://www.dxwatch.com";
    }
},

"antenna": (args) => {
    const tipovi = ["dipol", "vertical", "yagi", "quad", "groundplane"];

    const getBand = (f) => {
        if (f >= 1.8  && f <= 2.0)   return "160m";
        if (f >= 3.5  && f <= 4.0)   return "80m";
        if (f >= 7.0  && f <= 7.3)   return "40m";
        if (f >= 10.1 && f <= 10.15) return "30m";
        if (f >= 14.0 && f <= 14.35) return "20m";
        if (f >= 18.0 && f <= 18.17) return "17m";
        if (f >= 21.0 && f <= 21.45) return "15m";
        if (f >= 24.8 && f <= 25.0)  return "12m";
        if (f >= 28.0 && f <= 29.7)  return "10m";
        if (f >= 50   && f <= 54)    return "6m";
        if (f >= 144  && f <= 148)   return "2m";
        if (f >= 430  && f <= 440)   return "70cm";
        return `${f} MHz`;
    };

    if (!args || args.length === 0) {
        return `📡 ANTENA KALKULATOR — S5-OS v1.1
-------------------------------------------
Uporaba: antenna [tip] [frek. MHz] (opcija: elementi)

Podprti tipi:
  dipol       - Polovičnovalovni dipol
  vertical    - Četrtvalovni vertikalni
  yagi        - Yagi-Uda direktivna (2–6 el.)
  quad        - Quad zanka (1 element)
  groundplane - Ground plane z radiali

Primeri:
  antenna dipol 14.2
  antenna vertical 145.5
  antenna yagi 144 3
  antenna quad 28.5
  antenna groundplane 435`;
    }

    const tip      = args[0].toLowerCase();
    const freq     = parseFloat(args[1]);
    const elements = parseInt(args[2]) || 3;

    if (!tipovi.includes(tip))
        return `❌ Neznan tip antene. Poskusi: ${tipovi.join(", ")}`;
    if (isNaN(freq) || freq <= 0)
        return "❌ Vnesi veljavno frekvenco v MHz. Primer: antenna dipol 14.200";

    const lambda = 300 / freq;

    if (tip === "dipol") {
        const total = (143 / freq).toFixed(3);
        const half  = (total / 2).toFixed(3);
        const band  = getBand(freq);
        return `
📡 POLOVIČNOVALOVNI DIPOL — ${freq} MHz (${band})
-------------------------------------------
Skupna dolžina:    ${total} m
En krak (L/2):     ${half} m
Valovna dolžina:   ${lambda.toFixed(3)} m
Impedanca:         ~73 Ω
Napajalni kabel:   50Ω ali 75Ω koaksialni kabel
Dobitek:           ~2.15 dBi

    |←————————— ${total} m —————————→|
    |←——— ${half} m ———→|←——— ${half} m ———→|
    ____________/____________
   /            |            \\
~~~~            |            ~~~~
          Napajalna točka
          (koaks / balun)

NASVET: Dvigni vsaj λ/4 nad tla za boljši kot sevanja.`;
    }

    if (tip === "vertical") {
        const vert   = (71.5 / freq).toFixed(3);
        const radial = vert;
        const band   = getBand(freq);
        return `
📡 ČETRTVALOVNI VERTIKALNI — ${freq} MHz (${band})
-------------------------------------------
Dolžina elementa:  ${vert} m
Dolžina radiala:   ${radial} m  (min. 4 radiali)
Valovna dolžina:   ${lambda.toFixed(3)} m
Impedanca:         ~50 Ω
Napajalni kabel:   50Ω koaksialni kabel

        |
        | ← ${vert} m
        |
  ──────┼──────  ← tla / reflektor
  / / / | \\ \\ \\
 r  r   |   r  r  ← radiali (${radial} m vsak)

NASVET: 4 radiali minimum, 8+ za optimalno delovanje.`;
    }

    if (tip === "yagi") {
        const el    = Math.max(2, Math.min(elements, 6));
        const refl  = (0.500 * lambda).toFixed(3);
        const driv  = (0.473 * lambda).toFixed(3);
        const dir1  = (0.440 * lambda).toFixed(3);
        const dir2  = (0.435 * lambda).toFixed(3);
        const sp_rd = (0.250 * lambda).toFixed(3);
        const sp_dd = (0.310 * lambda).toFixed(3);
        const sp_d  = (0.350 * lambda).toFixed(3);
        const gain  = (5.9 + (el - 2) * 1.5).toFixed(1);
        const band  = getBand(freq);

        let elLines = `  REFLEKTOR:     ${refl} m\n`;
        elLines    += `  SEVALNI EL.:   ${driv} m  ← napajanje\n`;
        if (el >= 3) elLines += `  DIREKTOR 1:    ${dir1} m\n`;
        if (el >= 4) elLines += `  DIREKTOR 2:    ${dir2} m\n`;
        if (el >= 5) elLines += `  DIREKTOR 3:    ${(0.430 * lambda).toFixed(3)} m\n`;
        if (el >= 6) elLines += `  DIREKTOR 4:    ${(0.425 * lambda).toFixed(3)} m\n`;

        let boom = `  R─(${sp_rd}m)─D`;
        if (el >= 3) boom += `─(${sp_dd}m)─D1`;
        if (el >= 4) boom += `─(${sp_d}m)─D2`;
        if (el >= 5) boom += `─D3`;
        if (el >= 6) boom += `─D4`;

        return `
📡 YAGI-UDA ${el} EL. — ${freq} MHz (${band})
-------------------------------------------
Elementi:
${elLines}
Razpored (boom):
${boom}

Skupna dolžina booma: ~${((el - 1) * parseFloat(sp_d)).toFixed(2)} m
Impedanca:            ~28 Ω → gama ujemanje → 50 Ω
Ocenjen dobitek:      ~${gain} dBi
F/B razmerje:         ~${10 + el * 2} dB

NASVET: Za 50Ω napajanje dodaj gama match ali hairpin.`;
    }

    if (tip === "quad") {
        const side  = (lambda / 4).toFixed(3);
        const perim = lambda.toFixed(3);
        const band  = getBand(freq);
        return `
📡 QUAD ZANKA — ${freq} MHz (${band})
-------------------------------------------
Obseg zanke:       ${perim} m  (1× λ)
Ena stranica:      ${side} m   (λ/4)
Impedanca:         ~100–130 Ω
Napajalni kabel:   75Ω koaks (ali 50Ω + λ/4 transformer)
Dobitek:           ~2.1 dBi

    ┌────── ${side} m ──────┐
    │                      │
${side} m │         ●           │ ${side} m
    │    Napajanje         │
    └──────────────────────┘

NASVET: Napajanje spodaj = vertikalna polarizacija.
        Napajanje na strani = horizontalna polarizacija.`;
    }

    if (tip === "groundplane") {
        const vert   = (71.5 / freq).toFixed(3);
        const radial = (72.5 / freq).toFixed(3);
        const band   = getBand(freq);
        return `
📡 GROUND PLANE — ${freq} MHz (${band})
-------------------------------------------
Navpični element:  ${vert} m
Radiali (×4):      ${radial} m  (5% daljši → 50Ω)
Kot radialov:      45° navzdol
Impedanca:         ~50 Ω
Napajalni kabel:   50Ω koaksialni kabel

         | ← ${vert} m
         |
   ──────┼──────  ← SO-239 konektor
  /  /       \\  \\
 /  /    45°  \\  \\  ← radiali (${radial} m vsak)

NASVET: Radiali pod 45° dajo direktno 50Ω ujemanje.`;
    }
},

"elektrika": (args) => {
    // Uporaba: elektrika [priključna moč kW] [poraba kWh] (opcija: vt% sezona)
    // Primer:  elektrika 7 350
    //          elektrika 7 350 60 zima

    if (!args || args.length < 2) {
        return `⚡ KALKULATOR ELEKTRIKE — Slovenija 2026
-------------------------------------------
Uporaba: elektrika [priključna moč kW] [poraba kWh/mes] (VT% sezona)

Argumenti:
  priključna moč  - iz soglasja za priključitev (npr. 7 ali 17)
  poraba kWh      - mesečna poraba iz položnice
  VT%             - delež porabe v VT tarifi (privzeto: 60)
  sezona          - 'zima' (nov-feb) ali 'poletje' (mar-okt)

Primeri:
  elektrika 7 350
  elektrika 7 350 60 zima
  elektrika 17 600 70 poletje

OPOMBA: Izračun je informativen. Dejanski znesek se razlikuje
glede na dobavitelja, dogovorjeno obračunsko moč in tarifo.`;
    }

    const prikljucnaMoc = parseFloat(args[0]);
    const porabaKwh    = parseFloat(args[1]);
    const vtDelez      = parseFloat(args[2]) || 60;   // % porabe v VT
    const sezona       = (args[3] || "").toLowerCase() === "zima" ? "zima" : "poletje";

    if (isNaN(prikljucnaMoc) || isNaN(porabaKwh))
        return "❌ Napaka: Vpiši veljavno priključno moč in porabo. Primer: elektrika 7 350";

    // ─── TARIFE 2026 (informativne vrednosti) ───────────────────────────────
    // Cena energije (GEN-I/Petrol/ECE povprečje ~0.20 €/kWh vse skupaj)
    const cenaVT       = 0.11290;  // €/kWh VT energija brez DDV
    const cenaMT       = 0.07610;  // €/kWh MT energija brez DDV

    // Omrežnina za energijo (distribucija + prenos, ČB2-4 povprečje)
    const omrVT        = 0.02800;  // €/kWh
    const omrMT        = 0.01200;  // €/kWh

    // Obračunska moč (brez pametnega števca = % priključne moči)
    // Enofazni ≤ 7kW: 45%, Trifazni ≤ 17kW: 32%
    const jeEnofazni   = prikljucnaMoc <= 7;
    const omrMocFaktor = jeEnofazni ? 0.45 : 0.32;
    const omrMoc       = prikljucnaMoc * omrMocFaktor;

    // Tarifna postavka za moč po blokih (€/kW/mesec) — 2026 tarife
    // Blok 1 (zima VT): 50% od 3.82301 = 1.91151 (mar-okt) / 2.67611 (nov-dec)
    // Bloki 2-4 (ostalo): ~0.55 €/kW povprečje
    // Blok 5 (nizka sezona): 0.00245 €/kW
    let tarifaMoc;
    if (sezona === "zima") {
        // Nov-Feb: blok 1 (50% postopnost za 2025/26 sezono) + bloki 2-4
        tarifaMoc = (1.71126 + 0.5523 + 0.1832 + 0.0412) ; // €/kW/mes skupaj
    } else {
        // Mar-Oct: ni bloka 1, samo bloki 2-5
        tarifaMoc = (0.5523 + 0.1832 + 0.0412 + 0.00245);
    }

    // ─── IZRAČUN ────────────────────────────────────────────────────────────
    const porabaVT  = porabaKwh * (vtDelez / 100);
    const porabaMT  = porabaKwh * (1 - vtDelez / 100);

    const energija  = (porabaVT * cenaVT) + (porabaMT * cenaMT);
    const omrEnerg  = (porabaVT * omrVT)  + (porabaMT * omrMT);
    const omrMocMes = omrMoc * tarifaMoc;

    // Prispevki in dajatve (OVE/SPTE, trošarina, EUT)
    const trošarina  = porabaKwh * 0.00153;   // €/kWh
    const ove        = omrMoc * 0.08;          // prispevek OVE/SPTE na kW moči
    const eut        = porabaKwh * 0.00020;    // energetska učinkovitost

    const skupajBrezDDV = energija + omrEnerg + omrMocMes + trošarina + ove + eut;
    const ddv           = skupajBrezDDV * 0.22;
    const skupajZDDV    = skupajBrezDDV + ddv;

    // Cena na kWh skupaj
    const cenaKwh = skupajZDDV / porabaKwh;

    // ─── IZPIS ──────────────────────────────────────────────────────────────
    const sezonaStr = sezona === "zima" ? "ZIMA (nov–feb)" : "POLETJE (mar–okt)";
    const fazStr    = jeEnofazni ? "enofazni (45%)" : "trifazni ≤17kW (32%)";

    return `
⚡ IZRAČUN ELEKTRIKE — ${sezonaStr}
-------------------------------------------
Priključna moč:      ${prikljucnaMoc.toFixed(1)} kW (${fazStr})
Obračunska moč:      ${omrMoc.toFixed(2)} kW
Mesečna poraba:      ${porabaKwh} kWh  (VT: ${porabaVT.toFixed(0)} / MT: ${porabaMT.toFixed(0)} kWh)

POSTAVKE (brez DDV):
  Električna energija:  ${energija.toFixed(2)} €
  Omrežnina - energija: ${omrEnerg.toFixed(2)} €
  Omrežnina - moč:      ${omrMocMes.toFixed(2)} €
  Trošarina:            ${trošarina.toFixed(2)} €
  Prispevki (OVE/EUT):  ${(ove + eut).toFixed(2)} €
  ─────────────────────────────────────
  Skupaj brez DDV:      ${skupajBrezDDV.toFixed(2)} €
  DDV (22%):            ${ddv.toFixed(2)} €
  ─────────────────────────────────────
  SKUPAJ Z DDV:         ${skupajZDDV.toFixed(2)} €

Povprečna cena:      ${cenaKwh.toFixed(4)} €/kWh

⚠ Informativni izračun (tarife 2026, dobavitelj ~0.112 €/kWh VT).
  Dejanski znesek preverite na mojelektro.si ali pri dobavitelju.`;
},

"ura": (args) => {
    const sub = args && args[0] ? args[0].toLowerCase() : null;

    // --- ASCII CIFRE ---
    const cifre = {
        '0':["███","█ █","█ █","█ █","███"],
        '1':[" █ "," █ "," █ "," █ "," █ "],
        '2':["███","  █","███","█  ","███"],
        '3':["███","  █","███","  █","███"],
        '4':["█ █","█ █","███","  █","  █"],
        '5':["███","█  ","███","  █","███"],
        '6':["███","█  ","███","█ █","███"],
        '7':["███","  █","  █","  █","  █"],
        '8':["███","█ █","███","█ █","███"],
        '9':["███","█ █","███","  █","███"],
        ':':[" "," ","█"," ","█"],
        ' ':["   ","   ","   ","   ","   "],
    };

    const render = (str) => {
        let vrstice = ["","","","",""];
        str.split('').forEach(c => {
            const d = cifre[c] || cifre[' '];
            for (let i = 0; i < 5; i++) vrstice[i] += (d[i] || "   ") + "  ";
        });
        return vrstice.join('\n');
    };

    // --- PRIDOBI ALI USTVARI ELEMENT ---
    const getEl = (id, top, color) => {
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement('div');
            el.id = id;
            Object.assign(el.style, {
                position: 'fixed', top: top, right: '20px',
                fontFamily: "'Courier New', monospace",
                fontSize: '14px', color: color,
                textShadow: `0 0 8px ${color}`,
                whiteSpace: 'pre', zIndex: '1000',
                lineHeight: '1.3', pointerEvents: 'none',
            });
            document.body.appendChild(el);
        }
        el.style.color = color;
        el.style.textShadow = `0 0 8px ${color}`;
        return el;
    };

    // =====================
    // URA (lokalni čas)
    // =====================
    if (!sub || sub === "on") {
        if (window.uraInterval) {
            clearInterval(window.uraInterval);
            const el = document.getElementById('ura-display');
            if (el) el.remove();
            window.uraInterval = null;
            return "🕐 Ura ugasnjena.";
        }
        const el = getEl('ura-display', '20px', '#23D962');
        const tick = () => {
            const d = new Date();
            const h = d.getHours().toString().padStart(2,'0');
            const m = d.getMinutes().toString().padStart(2,'0');
            const s = d.getSeconds().toString().padStart(2,'0');
            el.innerText = render(`${h}:${m}:${s}`);
        };
        tick();
        window.uraInterval = setInterval(tick, 1000);
        return "🕐 Ura vklopljena. Vpiši 'ura' znova za izklop.";
    }

    // =====================
    // OFF — ugasni vse
    // =====================
    if (sub === "off") {
        ['ura-display','stopwatch-display','countdown-display','datum-display'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        ['uraInterval','stopwatchInterval','countdownInterval','datumInterval'].forEach(k => {
            if (window[k]) { clearInterval(window[k]); window[k] = null; }
        });
        return "🕐 Vse ure ugasnjene.";
    }

    // =====================
    // ŠTOPARICA
    // =====================
    if (sub === "stopwatch") {
        const action = args[1]?.toLowerCase();

        if (action === "stop" || action === "off") {
            clearInterval(window.stopwatchInterval);
            window.stopwatchInterval = null;
            const el = document.getElementById('stopwatch-display');
            if (el) el.remove();
            return "⏱️ Štoparica ustavljena.";
        }

        if (action === "reset") {
            window.stopwatchStart = Date.now();
            return "⏱️ Štoparica resetirana.";
        }

        // Zaženi
        window.stopwatchStart = Date.now() - (window.stopwatchPaused || 0);
        window.stopwatchPaused = 0;
        const el = getEl('stopwatch-display', '120px', '#ffff00');
        clearInterval(window.stopwatchInterval);
        window.stopwatchInterval = setInterval(() => {
            const elapsed = Date.now() - window.stopwatchStart;
            const h = Math.floor(elapsed / 3600000).toString().padStart(2,'0');
            const m = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2,'0');
            const s = Math.floor((elapsed % 60000) / 1000).toString().padStart(2,'0');
            el.innerText = render(`${h}:${m}:${s}`);
        }, 1000);
        return "⏱️ Štoparica zagotovljena. Ustavi z 'ura stopwatch stop'.";
    }

    // =====================
    // ODŠTEVANJE
    // =====================
    if (sub === "countdown") {
        const action = args[1]?.toLowerCase();

        if (action === "stop" || action === "off") {
            clearInterval(window.countdownInterval);
            window.countdownInterval = null;
            const el = document.getElementById('countdown-display');
            if (el) el.remove();
            return "⏳ Odštevanje ustavljeno.";
        }

        // Format: ura countdown 25:00 ali ura countdown 1:30:00
        const timeStr = args[1] || "25:00";
        const parts = timeStr.split(':').map(Number);
        let totalSec;
        if (parts.length === 2) totalSec = parts[0]*60 + parts[1];
        else if (parts.length === 3) totalSec = parts[0]*3600 + parts[1]*60 + parts[2];
        else return "❌ Format: ura countdown MM:SS ali HH:MM:SS";

        if (isNaN(totalSec) || totalSec <= 0) return "❌ Neveljaven čas.";

        let secsLeft = totalSec;
        const el = getEl('countdown-display', '120px', '#ff9900');
        clearInterval(window.countdownInterval);

        const tick = () => {
            if (secsLeft <= 0) {
                clearInterval(window.countdownInterval);
                el.style.color = '#ff4444';
                el.innerText = render("00:00:00");
                printOutput("🔔 ODŠTEVANJE KONČANO!", "#ff4444");
                return;
            }
            const h = Math.floor(secsLeft / 3600).toString().padStart(2,'0');
            const m = Math.floor((secsLeft % 3600) / 60).toString().padStart(2,'0');
            const s = (secsLeft % 60).toString().padStart(2,'0');
            el.innerText = render(`${h}:${m}:${s}`);
            // Zadnjih 10 sekund — utripa rdeče
            if (secsLeft <= 10) {
                el.style.color = secsLeft % 2 === 0 ? '#ff4444' : '#ff9900';
            }
            secsLeft--;
        };
        tick();
        window.countdownInterval = setInterval(tick, 1000);
        return `⏳ Odštevanje začeto: ${timeStr}. Ustavi z 'ura countdown stop'.`;
    }

    // =====================
    // KOLIKO ČASA DO DATUMA
    // =====================
    if (sub === "do") {
        const action = args[1]?.toLowerCase();

        if (action === "stop" || action === "off") {
            clearInterval(window.datumInterval);
            window.datumInterval = null;
            const el = document.getElementById('datum-display');
            if (el) el.remove();
            return "📅 Odštevalnik datuma ugasnjen.";
        }

        // Format: ura do 25.12.2025 ali ura do 25.12.2025 "Božič"
        const dateStr = args[1];
        const label   = args.slice(2).join(' ') || "CILJ";
        if (!dateStr) return "❌ Format: ura do DD.MM.YYYY [ime]";

        const dateParts = dateStr.split('.').map(Number);
        if (dateParts.length !== 3) return "❌ Format datuma: DD.MM.YYYY";
        const target = new Date(dateParts[2], dateParts[1]-1, dateParts[0]);
        if (isNaN(target)) return "❌ Neveljaven datum.";

        const el = getEl('datum-display', '20px', '#88aaff');
        clearInterval(window.datumInterval);

        const tick = () => {
            const diff = target - Date.now();
            if (diff <= 0) {
                clearInterval(window.datumInterval);
                el.innerText = render("00:00:00") + `\n         ${label}`;
                printOutput(`🎉 ${label} JE DANES!`, "#88aaff");
                return;
            }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000).toString().padStart(2,'0');
            const m = Math.floor((diff % 3600000)  / 60000).toString().padStart(2,'0');
            const s = Math.floor((diff % 60000)    / 1000).toString().padStart(2,'0');
            el.innerText = render(`${h}:${m}:${s}`) + `\n  ŠE ${d} DNI DO: ${label.toUpperCase()}`;
        };
        tick();
        window.datumInterval = setInterval(tick, 1000);
        return `📅 Odštevalnik za ${label} (${dateStr}) zagotovljen. Ugasni z 'ura do stop'.`;
    }

    return `Ukazi:
  ura              - vklopi/izklopi uro
  ura off          - ugasni vse
  ura stopwatch    - zaženi štoparico
  ura stopwatch stop
  ura countdown 25:00  - odštevanje
  ura countdown stop
  ura do 25.12.2025 Bozic  - koliko dni do datuma
  ura do stop`;
},

"boss": (args) => {
    if (args && args[0] === "off") {
        const el = document.getElementById('boss-overlay');
        if (el) el.remove();
        return "Dobrodošel nazaj. 😄";
    }

    const overlay = document.createElement('div');
    overlay.id = 'boss-overlay';
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100vw', height: '100vh',
        backgroundColor: '#ffffff',
        zIndex: '99999',
        fontFamily: 'Calibri, Arial, sans-serif',
        fontSize: '13px',
        color: '#000000',
        overflow: 'hidden',
    });

    overlay.innerHTML = `
    <!-- EXCEL TOOLBAR -->
    <div style="background:#217346;color:white;padding:4px 10px;font-size:13px;display:flex;align-items:center;gap:20px;">
        <span style="font-size:16px;font-weight:bold;">X</span>
        <span>Microsoft Excel - Proracun_2026.xlsx</span>
        <div style="margin-left:auto;display:flex;gap:8px;font-size:11px;">
            <span>─</span><span>□</span><span>✕</span>
        </div>
    </div>
    <!-- MENU BAR -->
    <div style="background:#f3f3f3;border-bottom:1px solid #ccc;padding:3px 10px;display:flex;gap:15px;font-size:12px;">
        <span>Datoteka</span><span>Urejanje</span><span>Pogled</span><span>Vstavljanje</span><span>Oblika</span><span>Orodja</span><span>Podatki</span><span>Okno</span><span>Pomoč</span>
    </div>
    <!-- RIBBON -->
    <div style="background:#f9f9f9;border-bottom:1px solid #ccc;padding:4px 10px;display:flex;gap:10px;align-items:center;font-size:12px;">
        <button style="padding:2px 8px;font-size:11px;">B</button>
        <button style="padding:2px 8px;font-size:11px;font-style:italic;">I</button>
        <button style="padding:2px 8px;font-size:11px;text-decoration:underline;">U</button>
        <span style="margin-left:10px;">|</span>
        <span style="margin-left:10px;">Calibri</span>
        <span style="margin-left:10px;">11</span>
        <span style="margin-left:20px;color:#217346;">∑ AutoSum ▾</span>
    </div>
    <!-- FORMULA BAR -->
    <div style="background:#fff;border-bottom:1px solid #ccc;padding:3px 10px;display:flex;gap:10px;align-items:center;font-size:12px;">
        <span style="border:1px solid #ccc;padding:1px 6px;min-width:40px;">A1</span>
        <span>fx</span>
        <span style="flex:1;border-left:1px solid #ccc;padding-left:8px;">=VSOTA(B2:B13)</span>
    </div>
    <!-- SPREADSHEET -->
    <div style="overflow:auto;height:calc(100vh - 130px);">
        <table style="border-collapse:collapse;width:100%;min-width:800px;">
            <tr style="background:#f3f3f3;">
                <td style="border:1px solid #ccc;width:30px;text-align:center;padding:2px;"></td>
                ${['A','B','C','D','E','F','G','H','I','J'].map(c =>
                    `<td style="border:1px solid #ccc;min-width:90px;text-align:center;padding:2px;background:#f3f3f3;font-weight:bold;">${c}</td>`
                ).join('')}
            </tr>
            ${[
                ['1','POSTAVKA','JAN','FEB','MAR','APR','MAJ','JUN','SKUPAJ','OPOMBA'],
                ['2','Plača','2.100,00','2.100,00','2.100,00','2.100,00','2.100,00','2.100,00','=VSOTA(B2:G2)','Redna'],
                ['3','Najemnina','-850,00','-850,00','-850,00','-850,00','-850,00','-850,00','=VSOTA(B3:G3)','Fiksno'],
                ['4','Elektrika','-87,50','-91,20','-78,40','-65,30','-62,10','-59,80','=VSOTA(B4:G4)',''],
                ['5','Internet','-29,99','-29,99','-29,99','-29,99','-29,99','-29,99','=VSOTA(B5:G5)','A1'],
                ['6','Hrana','-320,00','-298,50','-341,20','-315,80','-289,40','-334,60','=VSOTA(B6:G6)',''],
                ['7','Prevoz','-85,00','-85,00','-85,00','-85,00','-85,00','-85,00','=VSOTA(B7:G7)','Mesečna karta'],
                ['8','Zavarovanje','-45,00','-45,00','-45,00','-45,00','-45,00','-45,00','=VSOTA(B8:G8)',''],
                ['9','Telefon','-19,99','-19,99','-19,99','-19,99','-19,99','-19,99','=VSOTA(B9:G9)',''],
                ['10','Prihranek','200,00','200,00','200,00','200,00','200,00','200,00','=VSOTA(B10:G10)',''],
                ['11','Ostalo','-120,00','-145,30','-98,70','-201,40','-167,20','-134,80','=VSOTA(B11:G11)',''],
                ['12','','','','','','','','',''],
                ['13','SKUPAJ','=VSOTA(B2:B11)','=VSOTA(C2:C11)','=VSOTA(D2:D11)','=VSOTA(E2:E11)','=VSOTA(F2:F11)','=VSOTA(G2:G11)','',''],
            ].map((row, ri) => `
                <tr style="background:${ri === 13 ? '#e2efda' : ri % 2 === 0 ? '#ffffff' : '#f9f9f9'}">
                    <td style="border:1px solid #ccc;text-align:center;padding:2px 4px;background:#f3f3f3;font-weight:bold;">${row[0]}</td>
                    ${row.slice(1).map((cell, ci) => `
                        <td style="border:1px solid #ccc;padding:2px 6px;${ci === 0 ? 'font-weight:bold;' : 'text-align:right;'}${ri === 13 ? 'font-weight:bold;background:#e2efda;' : ''}${cell.startsWith('=') ? 'color:#217346;' : ''}">${cell}</td>
                    `).join('')}
                </tr>
            `).join('')}
        </table>
    </div>
    <!-- STATUS BAR -->
    <div style="position:fixed;bottom:0;left:0;width:100%;background:#217346;color:white;padding:2px 10px;font-size:11px;display:flex;justify-content:space-between;">
        <span>Pripravljen</span>
        <span>Povprečje: 743,25 | Število: 8 | Vsota: 5.946,00</span>
        <span>🔍 100%</span>
    </div>`;

    // Klik kjerkoli zapre overlay
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);

    return "";
},

"graf": (args) => {
    if (!args || args.length === 0) {
        return `📊 IZRIS GRAFOV FUNKCIJ
-------------------------------------------
Uporaba: graf [funkcija] [od] [do]

Primeri:
  graf sin(x) -10 10
  graf x^2 -5 5
  graf cos(x)*2 0 6.28
  graf 1/x -10 10
  graf abs(x) -5 5
  graf log(x) 0.1 10
  graf sqrt(x) 0 10
  graf tan(x) -3.14 3.14

Podprte funkcije:
  sin, cos, tan, abs, sqrt, log, exp
  Operatorji: +, -, *, /, ^, ()
  Konstante: pi, e

💡 Graf se izriše v retro osciloskop stilu!`;
    }

    try {
        // Parsanje argumentov
        let funcString = args[0];
        let xMin = args[1] ? parseFloat(args[1]) : -10;
        let xMax = args[2] ? parseFloat(args[2]) : 10;

        // Če uporabnik da funkcijo z presledki
        if (args.length > 3) {
            let numStart = args.findIndex(a => !isNaN(parseFloat(a)));
            if (numStart > 0) {
                funcString = args.slice(0, numStart).join('');
                xMin = parseFloat(args[numStart]);
                xMax = parseFloat(args[numStart + 1]) || 10;
            }
        }

        // Zamenjaj ^ z ** za eksponente
        funcString = funcString.replace(/\^/g, '**');
        funcString = funcString.replace(/pi/gi, Math.PI);
        funcString = funcString.replace(/\be\b/gi, Math.E);

        if (xMin >= xMax) {
            return "❌ Napaka: Začetna vrednost mora biti manjša od končne!";
        }

        // VEČJE DIMENZIJE za boljšo resolucijo
        const width = 120;  // Povečano s 80 na 120
        const height = 40;  // Povečano s 25 na 40

        // Funkcija za evaluacijo
        const evaluateFunc = (x) => {
            try {
                const sin = Math.sin;
                const cos = Math.cos;
                const tan = Math.tan;
                const abs = Math.abs;
                const sqrt = Math.sqrt;
                const log = Math.log;
                const exp = Math.exp;
                const ln = Math.log;
                const floor = Math.floor;
                const ceil = Math.ceil;
                const round = Math.round;

                return eval(funcString);
            } catch (e) {
                return NaN;
            }
        };

        // VEČJE VZORČENJE - 3x več točk kot širina
        const samples = width * 3;
        const points = [];
        const step = (xMax - xMin) / samples;
        
        for (let i = 0; i <= samples; i++) {
            const x = xMin + i * step;
            const y = evaluateFunc(x);
            if (!isNaN(y) && isFinite(y)) {
                points.push({ x, y });
            }
        }

        if (points.length === 0) {
            return "❌ Funkcija ni veljavna ali nima definiranih vrednosti v tem območju!";
        }

        // Najdi min/max Y za skaliranje
        const yValues = points.map(p => p.y);
        let yMin = Math.min(...yValues);
        let yMax = Math.max(...yValues);

        const yRange = yMax - yMin;
        yMin -= yRange * 0.1;
        yMax += yRange * 0.1;

        // Ustvari 2D array za graf
        const canvas = Array(height).fill(null).map(() => Array(width).fill(' '));

        // Izriši grid (osciloskop stil)
        for (let y = 0; y < height; y += 5) {
            for (let x = 0; x < width; x++) {
                canvas[y][x] = '·';
            }
        }
        for (let x = 0; x < width; x += 10) {
            for (let y = 0; y < height; y++) {
                if (canvas[y][x] === ' ') canvas[y][x] = '·';
            }
        }

        // Izriši osi
        const xAxisY = Math.round(height * (yMax / (yMax - yMin)));
        const yAxisX = Math.round(width * (-xMin / (xMax - xMin)));

        // X os
        if (xAxisY >= 0 && xAxisY < height) {
            for (let x = 0; x < width; x++) {
                canvas[xAxisY][x] = '─';
            }
        }

        // Y os
        if (yAxisX >= 0 && yAxisX < width) {
            for (let y = 0; y < height; y++) {
                canvas[y][yAxisX] = '│';
            }
        }

        // Presečišče
        if (xAxisY >= 0 && xAxisY < height && yAxisX >= 0 && yAxisX < width) {
            canvas[xAxisY][yAxisX] = '┼';
        }

        // Izriši funkcijo z interpolacijo
        points.forEach(point => {
            const x = Math.round((point.x - xMin) / (xMax - xMin) * (width - 1));
            const y = Math.round((yMax - point.y) / (yMax - yMin) * (height - 1));
            
            if (x >= 0 && x < width && y >= 0 && y < height) {
                canvas[y][x] = '█';
            }
        });

        // Sestavi izpis z osciloskop CSS
        let output = `
<div style="
    background: linear-gradient(180deg, #001a33 0%, #000d1a 100%);
    border: 3px solid #00ffff;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 100, 150, 0.3);
    font-family: 'Courier New', monospace;
    margin: 10px 0;
    max-width: 100%;
    overflow-x: auto;
">
    <div style="
        color: #00ffff;
        text-align: center;
        font-size: 1.2rem;
        margin-bottom: 10px;
        text-shadow: 0 0 10px #00ffff;
        letter-spacing: 2px;
    ">
        ═══ OSCILLOSCOPE S5-OS ═══
    </div>
    
    <div style="
        color: #00ff00;
        text-align: center;
        margin-bottom: 5px;
        font-size: 0.9rem;
    ">
        f(x) = ${funcString.replace(/\*\*/g, '^')}
    </div>
    
    <div style="
        background: #000a14;
        border: 2px solid #004466;
        border-radius: 5px;
        padding: 10px;
        box-shadow: inset 0 0 15px rgba(0, 100, 150, 0.5);
    ">
        <div style="
            color: #00ffff;
            font-size: 0.8rem;
            margin-bottom: 3px;
            text-shadow: 0 0 5px #00ffff;
        ">Y: ${yMax.toFixed(3)}</div>
        
        <pre style="
            font-family: 'Courier New', monospace;
            line-height: 1.1;
            color: #00ff00;
            background: transparent;
            margin: 0;
            padding: 0;
            text-shadow: 0 0 8px #00ff00;
            font-size: 0.75rem;
            letter-spacing: 1px;
        ">${canvas.map(row => row.join('')).join('\n')}</pre>
        
        <div style="
            color: #00ffff;
            font-size: 0.8rem;
            margin-top: 3px;
            text-shadow: 0 0 5px #00ffff;
        ">Y: ${yMin.toFixed(3)}</div>
    </div>
    
    <div style="
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        color: #00ffff;
        font-size: 0.85rem;
    ">
        <span>X MIN: ${xMin.toFixed(2)}</span>
        <span>SAMPLES: ${samples}</span>
        <span>X MAX: ${xMax.toFixed(2)}</span>
    </div>
    
    <div style="
        text-align: center;
        margin-top: 10px;
        color: #888;
        font-size: 0.7rem;
    ">
        RESOLUTION: ${width}×${height} | RANGE: [${xMin.toFixed(2)}, ${xMax.toFixed(2)}]
    </div>
</div>`;

        return output;

    } catch (e) {
        return `❌ Napaka pri izrisu grafa: ${e.message}
💡 Preveri sintakso funkcije in poskusi ponovno.`;
    }
},

});