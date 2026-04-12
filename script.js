// ==========================================
// 1. DEL: KONSTANTE, SPREMENLJIVKE IN OSNOVE (1/3)
// ==========================================

// --- SISTEM ZA JEZIK (SLO, EN, DE) ---
let currentLang = localStorage.getItem('terminal_lang') || 'sl';

const uiText = {
    "sl": {
        "boot": "Sistem S5-OS v1.1.0 naložen.\nPodatkovne baze se naložene (saj tko pravjo).\nDobrodošel uporabik v moj peskovnik \nTukaj boš našel vsa orodja, ki potrebuješ za radioamaterstvo. \nVtipkaj 'help' za začetekai ali 'help ham' za prave majstre.",
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

// Fiksni stream samo za lofi (zanesljiv), ostali se iščejo dinamično
const radioStations = {
    "lofi": "https://lofi.stream.laut.fm/lofi"
};

// Iskalni izrazi za radio-browser.info API
const radioSearchTerms = {
    "balkan":    { tag: "balkan" },
    "techno":    { tag: "techno" },
    "chill":     { tag: "chillout" },
    "rock":      { tag: "rock" },
    "pop":       { tag: "pop" },
    "jazz":      { tag: "jazz" },
    "classical": { tag: "classical" },
    "slo":       { tag: "slovenian" },
    "srb":       { tag: "serbian" },

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





// --- Tu se ustavimo za 1/3 ---

// ==========================================
// 2. DEL: RADIOAMATERSKI UKAZI IN LOGIRANJE (2/3)
// ==========================================

// Razširitev objekta commands z radio funkcijami


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
// Pozicija kurzorja v besedilu
let cursorPos = 0;

// Posodobi vidni display-text in pozicijo kurzorja
function updateDisplay() {
    const val = input.value;
    // Zagotovimo da je cursorPos vedno v mejah
    cursorPos = Math.max(0, Math.min(cursorPos, val.length));

    const before = val.substring(0, cursorPos);
    const after  = val.substring(cursorPos);

    displayText.textContent = before;

    let afterSpan = document.getElementById('after-cursor');
    if (!afterSpan) {
        afterSpan = document.createElement('span');
        afterSpan.id = 'after-cursor';
        afterSpan.style.color = '#23D962';
        // Vstavimo za .cursor elementom
        const cursor = document.querySelector('.cursor');
        cursor.parentNode.insertBefore(afterSpan, cursor.nextSibling);
    }
    afterSpan.textContent = after;
}

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const cmd = input.value;
        input.value = '';
        cursorPos = 0;
        displayText.textContent = '';
        const afterSpan = document.getElementById('after-cursor');
        if (afterSpan) afterSpan.textContent = '';
        if (cmd.trim() !== "") {
            await processCommand(cmd);
            history.push(cmd);
            historyIndex = history.length;
        }
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (cursorPos > 0) cursorPos--;
        updateDisplay();
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (cursorPos < input.value.length) cursorPos++;
        updateDisplay();
    } else if (e.key === 'Home') {
        e.preventDefault();
        cursorPos = 0;
        updateDisplay();
    } else if (e.key === 'End') {
        e.preventDefault();
        cursorPos = input.value.length;
        updateDisplay();
    } else if (e.key === 'Backspace') {
        // Pustimo brskalnik da zbriše znak, nato posodobimo
        if (cursorPos > 0) cursorPos--;
    } else if (e.key === 'Delete') {
        // Delete ne premakne kurzorja
    } else if (e.key === 'ArrowUp') {
        if (historyIndex > 0) {
            e.preventDefault();
            historyIndex--;
            input.value = history[historyIndex];
            cursorPos = input.value.length;
            updateDisplay();
        }
    } else if (e.key === 'ArrowDown') {
        if (historyIndex < history.length - 1) {
            e.preventDefault();
            historyIndex++;
            input.value = history[historyIndex];
            cursorPos = input.value.length;
            updateDisplay();
        } else {
            historyIndex = history.length;
            input.value = '';
            cursorPos = 0;
            displayText.textContent = '';
            const afterSpan = document.getElementById('after-cursor');
            if (afterSpan) afterSpan.textContent = '';
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
input.addEventListener('input', () => {
    cursorPos = input.selectionStart;
    updateDisplay();
});

// Fokus na input ob kliku kjerkoli v terminalu
document.addEventListener('click', () => input.focus());

// Zagon terminala
bootSequence();

window.onload = () => {
    setTimeout(triggerGlitch, 500);
    setTimeout(triggerGlitch, 700); // Dvojni "trzaj" za boljši retro efekt
};

function startAutoGlitch() {
    const minTime = 30000; // 30 sekund
    const maxTime = 90000; // 90 sekund

    const trigger = () => {
        // Izračunaj naslednji naključni čas
        const nextDelay = Math.floor(Math.random() * (maxTime - minTime) + minTime);

        setTimeout(() => {
            // Dodaj efekt
            document.body.classList.add('glitch-active');

            // Odstrani efekt po 150 milisekundah (zelo hiter trzaj)
            setTimeout(() => {
                document.body.classList.remove('glitch-active');
                trigger(); // Ponovi zanko
            }, 150);

        }, nextDelay);
    };

    trigger();
}

// Zaženi ob nalaganju strani
window.addEventListener('load', startAutoGlitch);