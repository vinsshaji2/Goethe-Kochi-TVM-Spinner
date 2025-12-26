const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

let offers = [];

const center = 275;
const radius = 240;


let angle = 0;
let spinning = false;

let basePrice = 0;
let selectedModule = "";
let lastWinText = "";
let hasSpun = false;


// 🎨 Draw the wheel
function drawWheel() {
    if (!offers.length) return;

    const slice = 2 * Math.PI / offers.length;

    ctx.clearRect(0, 0, 650, 650);

    for (let i = 0; i < offers.length; i++) {
        const start = angle + i * slice;
        const end = start + slice;

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, start, end);
        ctx.fillStyle = `hsl(${i * 360 / offers.length}, 80%, 50%)`;
        ctx.fill();

        // text
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(start + slice / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        wrapText(ctx, offers[i], radius - 20, -10, 110, 20);
        ctx.restore();
    }
}

// 🎯 Perfect spin logic
function spinTo(index) {
    if (spinning) return;
    spinning = true;

    const slice = 2 * Math.PI / offers.length;
    const fullRotations = 7;
    const pointerAngle = -Math.PI / 2;

    // normalize
    angle = angle % (2 * Math.PI);

    const targetAngle =
        fullRotations * 2 * Math.PI +
        pointerAngle -
        (index * slice + slice / 2);

    const startAngle = angle;
    const delta = targetAngle - startAngle;
    const duration = 4500;
    const startTime = performance.now();

    function animate(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        angle = startAngle + delta * ease;

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            angle = angle % (2 * Math.PI);
            spinning = false;
            showWinPopup(offers[index]);
        }
    }

    requestAnimationFrame(animate);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let lines = [];

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
            lines.push(line);
            line = words[i] + " ";
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, y + i * lineHeight);
    }
}


// 🖱 Button click
document.getElementById("spinBtn").onclick = async () => {
    if (spinning) return;

    const res = await fetch("/spin");
    const data = await res.json();

    offers = data.offers;
    basePrice = data.base_price;
    selectedModule = data.module;

    spinTo(data.index);
};


// 🚀 Initial load
let loaded = false;

function loadWheel() {
    if (loaded) return;
    loaded = true;

    // If already spun in this session
    if (sessionStorage.getItem("hasSpun")) {
        lastWinText = sessionStorage.getItem("winText");
        selectedModule = sessionStorage.getItem("module");
        basePrice = parseInt(sessionStorage.getItem("basePrice"));

        alert("You already spun the wheel! Redirecting you to WhatsApp with your offer...");

        setTimeout(() => {
            closePopup();   // will redirect to WhatsApp with stored offer
        }, 500);

        return;
    }

    fetch("/spin")
        .then(res => res.json())
        .then(data => {
            offers = data.offers;
            basePrice = data.base_price;
            selectedModule = data.module;
            drawWheel();
        });
}

loadWheel();


// 🎉 Popup
function showWinPopup(text) {
    lastWinText = text;

    // Save win in browser session
    sessionStorage.setItem("hasSpun", "true");
    sessionStorage.setItem("winText", text);
    sessionStorage.setItem("module", selectedModule);
    sessionStorage.setItem("basePrice", basePrice);

    document.getElementById("popupText").innerText = "🎉 You Won: " + text;
    document.getElementById("popup").classList.remove("hidden");
}



function closePopup() {

    lastWinText = lastWinText || sessionStorage.getItem("winText");
    selectedModule = selectedModule || sessionStorage.getItem("module");
    basePrice = basePrice || parseInt(sessionStorage.getItem("basePrice"));

    let msg = "";
    const percentMatch = lastWinText.match(/^(\d+)% Discount$/);

    if (percentMatch) {
        const percent = parseInt(percentMatch[1]);
        const finalAmount = basePrice - (basePrice * percent / 100);

        msg =
            `Hey Team, I got ${lastWinText} for ${selectedModule}. ` +
            `The offer amount is ${finalAmount} (${basePrice} - ${percent}% Discount).`;
    }
    else {
        msg = `Hey Team, I got ${lastWinText} for ${selectedModule}.`;
    }

    const academyNumber = "917907817287";
    const url = `https://wa.me/${academyNumber}?text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");

    document.getElementById("popup").classList.add("hidden");
}



