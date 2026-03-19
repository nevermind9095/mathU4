// ==========================================
// 1. 終極防呆：自動修復被「吃掉」的底線與空白
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const keyFromUrl = urlParams.get('key');

if (keyFromUrl) {
    // 💡 強制修復：將網址傳遞中可能產生的空白、%20 等全部換回底線
    // 這能解決截圖中看到的 404 空間問題
    const fixedKey = keyFromUrl.trim().replace(/\s/g, '_'); 
    sessionStorage.setItem('gemini_api_key', fixedKey);
    window.history.replaceState({}, document.title, window.location.pathname);
}

// ==========================================
// 2. 遊戲資料庫 (更新第三關數據與本地圖片)
// ==========================================
let currentLevel = 1;
let coins = 0;
let currentStep = 1;

const levelData = {
    1: { 
        monsterImg: "slime.png", 
        monsterName: "史萊姆 👾", qStr: "3.5 × 2.7 = ?", topNum: "3.5", botNum: "2.7",
        estOptions: ["6 ~ 12 之間", "1 ~ 5 之間", "15 ~ 20 之間"], estAns: 0, 
        mulAns: 945, decAns: 2, finAns: 9.45
    },
    2: { 
        monsterImg: "goblin.png", 
        monsterName: "哥布林 👺", qStr: "2.73 × 1.5 = ?", topNum: "2.73", botNum: "1.5",
        estOptions: ["1 ~ 3 之間", "2 ~ 6 之間", "10 ~ 15 之間"], estAns: 1, 
        mulAns: 4095, decAns: 3, finAns: 4.095
    },
    3: { 
        monsterImg: "dragon.png", 
        monsterName: "魔龍 🐉", 
        // 配合教案：調整估算區間 (4x5=20 到 5x6=30)
        qStr: "4.23 × 5.18 = ?", topNum: "4.23", botNum: "5.18",
        estOptions: ["10 ~ 15 之間", "20 ~ 30 之間", "35 ~ 45 之間"], estAns: 1, 
        mulAns: 219114, decAns: 4, finAns: 21.9114
    }
};

const steps = ['step-estimate', 'step-arrange', 'step-multiply', 'step-convert', 'step-decimal'];

// ==========================================
// 3. 戰鬥邏輯與黑板呈現 (仿照教案次序進展)
// ==========================================
function updateMathBoard(stepIndex) {
    const board = document.getElementById('math-content');
    const data = levelData[currentLevel];
    const top = data.topNum;
    const bot = data.botNum;

    if (stepIndex === 1) {
        // 階段一：原始橫式題目
        board.innerHTML = `${data.qStr}`;
    } else if (stepIndex === 2) {
        // 階段二：直式排法，保留小數點，但不顯示計算內容
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div></div>`;
    } else if (stepIndex === 3) {
        // 階段三：【乘】讓學生計算。黑板顯示直式但「遮蔽答案區」
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div><span style="background:rgba(255,255,255,0.2); color:transparent;">????</span></div>`;
    } else if (stepIndex === 4) {
        // 階段四：【換】輸入整數正確後，顯示整數結果
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div>${data.mulAns}</div>`;
    } else if (stepIndex === 5) {
        // 階段五：【點】最終答案，標紅點出小數點
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div><span style="color:#ff5252; font-weight:bold;">${data.finAns}</span></div>`;
    }
}

// ------------------------------------------
// 其餘遊戲核心邏輯 (音效、按鈕綁定等)
// ------------------------------------------
function playSound(type) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if(type === 'correct') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.1); }
    if(type === 'attack') { osc.type = 'square'; osc.frequency.setValueAtTime(150, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0.2, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.3); }
    if(type === 'coin') { osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.1); }
}

function initGame() {
    const data = levelData[currentLevel];
    document.getElementById('current-level').innerText = currentLevel;
    document.getElementById('monster-sprite').src = data.monsterImg;
    document.getElementById('hp-fill').style.width = "100%";
    document.getElementById('monster-sprite').className = ''; 
    updateMathBoard(1);
    currentStep = 1;
    steps.forEach((id, index) => { document.getElementById(id).classList.toggle('hidden', index !== 0); });
    
    const estContainer = document.getElementById('estimate-options');
    estContainer.innerHTML = '';
    data.estOptions.forEach((text, idx) => {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.onclick = () => {
            if (idx === data.estAns) {
                playSound('correct');
                document.body.classList.add('effect-break');
                setTimeout(() => document.body.classList.remove('effect-break'), 1000);
                switchStep(0, 1); updateMathBoard(2);
            } else { alert("再想想看喔！"); }
        };
        estContainer.appendChild(btn);
    });

    const arrContainer = document.getElementById('arrange-options');
    arrContainer.innerHTML = '';
    [{text:"靠左對齊",v:0},{text:"小數點對齊",v:1},{text:"靠右對齊",v:2}].forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt.text;
        btn.onclick = () => {
            if(opt.v === 2) { 
                playSound('correct');
                const board = document.getElementById('math-board');
                board.classList.add('effect-pop');
                setTimeout(() => board.classList.remove('effect-pop'), 800);
                switchStep(1, 2); updateMathBoard(3);
            } else { alert("直式乘法要把誰對齊呢？"); }
        };
        arrContainer.appendChild(btn);
    });
}

function switchStep(cur, nxt) {
    document.getElementById(steps[cur]).classList.add('hidden');
    document.getElementById(steps[nxt]).classList.remove('hidden');
    currentStep = nxt + 1;
}

document.getElementById('btn-multiply').onclick = () => {
    const val = parseInt(document.getElementById('multiply-input').value);
    if (val === levelData[currentLevel].mulAns) {
        playSound('correct');
        const board = document.getElementById('math-board');
        board.classList.add('effect-glow');
        setTimeout(() => board.classList.remove('effect-glow'), 1500);
        switchStep(2, 3); updateMathBoard(4);
    } else { alert("整數相乘算錯囉！再算一次！"); }
};

document.querySelectorAll('#convert-options .option-btn').forEach(btn => {
    btn.onclick = () => {
        const val = parseInt(btn.getAttribute('data-val'));
        if(val === levelData[currentLevel].decAns) {
            playSound('correct');
            const board = document.getElementById('math-board');
            board.classList.add('effect-pulse');
            setTimeout(() => board.classList.remove('effect-pulse'), 1200);
            switchStep(3, 4);
        } else { alert("數數看總共幾位小數？"); }
    };
});

document.getElementById('btn-attack').onclick = () => {
    const val = parseFloat(document.getElementById('final-input').value);
    if (val === levelData[currentLevel].finAns) {
        playSound('attack');
        document.getElementById('monster-sprite').classList.add('effect-attack');
        document.getElementById('hp-fill').style.width = "0%";
        updateMathBoard(5);
        setTimeout(() => {
            if (currentLevel < 3) { alert(`擊敗 ${levelData[currentLevel].monsterName}！`); currentLevel++; initGame(); }
            else { document.getElementById('monster-area').classList.add('hidden'); document.getElementById('action-area').classList.add('hidden'); document.getElementById('chest-area').classList.remove('hidden'); }
        }, 1500);
    } else { alert("小數點位置不對喔！"); }
};

document.getElementById('chest-sprite').onclick = () => {
    if (document.getElementById('chest-msg').innerText === "點擊寶箱開啟") {
        playSound('coin');
        const drop = Math.floor(Math.random() * 5) + 1;
        coins += drop; document.getElementById('coin-count').innerText = coins;
        document.getElementById('chest-sprite').innerText = "✨💰✨";
        document.getElementById('chest-msg').innerHTML = `<span style="color:var(--accent-color); font-size:24px; font-weight:bold;">獲得 ${drop} 枚金幣！</span>`;
    }
};

// 🧚‍♂️ AI 求救小精靈
document.getElementById('btn-ai-help').onclick = async () => {
    const apiKey = sessionStorage.getItem('gemini_api_key');
    const aiModal = document.getElementById('ai-modal');
    const aiText = document.getElementById('ai-response');
    aiModal.classList.remove('hidden'); aiModal.style.display = 'flex';
    
    if (!apiKey) { aiText.innerText = "🚨 請先重新載入帶有金鑰的連結！"; return; }

    aiText.innerText = "精靈思考中... 🔮";
    const prompt = `你是一個數學小助教。題目是 ${levelData[currentLevel].qStr}。學生卡在第 ${currentStep} 步驟 (1:估算, 2:直式排法, 3:整數相乘, 4:找小數位數, 5:點小數點)。請給予可愛且有啟發性的繁體中文提示，50字內，絕不給答案。`;

    try {
        // 💡 改用 v1 端點，增加穩定性
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        aiText.innerText = data.candidates[0].content.parts[0].text;
    } catch (e) { aiText.innerText = "💥 連線被魔物干擾！(請確認金鑰正確且無空白)"; }
};

document.getElementById('btn-close-ai').onclick = () => { document.getElementById('ai-modal').style.display = 'none'; };

initGame();
