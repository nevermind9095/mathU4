// ==========================================
// 1. 遊戲資料庫 (對應教學進度與教案活動)
// ==========================================
let currentLevel = 1;
let coins = 0;
let currentStep = 1;

const levelData = {
    1: { 
        monsterImg: "slime.png", 
        monsterName: "史萊姆 👾", qStr: "3.5 × 2.7 = ?", topNum: "3.5", botNum: "2.7",
        // 估算邏輯：3x2=6 ~ 4x3=12
        estOptions: ["6 ~ 12 之間", "1 ~ 5 之間", "15 ~ 20 之間"], estAns: 0, 
        mulAns: 945, decAns: 2, finAns: 9.45
    },
    2: { 
        monsterImg: "goblin.png", 
        monsterName: "哥布林 👺", qStr: "2.73 × 1.5 = ?", topNum: "2.73", botNum: "1.5",
        // 估算邏輯：2x1=2 ~ 3x2=6
        estOptions: ["1 ~ 3 之間", "2 ~ 6 之間", "10 ~ 15 之間"], estAns: 1, 
        mulAns: 4095, decAns: 3, finAns: 4.095
    },
    3: { 
        monsterImg: "dragon.png", 
        monsterName: "魔龍 🐉", 
        // 調整魔龍數據：增加估算變化 (4x5=20 ~ 5x6=30)
        qStr: "4.23 × 5.18 = ?", topNum: "4.23", botNum: "5.18",
        estOptions: ["10 ~ 15 之間", "20 ~ 30 之間", "35 ~ 45 之間"], estAns: 1, 
        mulAns: 219114, decAns: 4, finAns: 21.9114
    }
};

const steps = ['step-estimate', 'step-arrange', 'step-multiply', 'step-convert', 'step-decimal'];

// ==========================================
// 2. 核心功能：動態黑板呈現 (仿照教案次序進展)
// ==========================================
function updateMathBoard(stepIndex) {
    const board = document.getElementById('math-content');
    const data = levelData[currentLevel];
    const top = data.topNum;
    const bot = data.botNum;

    if (stepIndex === 1) {
        // 階段一：顯示橫式問題
        board.innerHTML = `${data.qStr}`;
    } else if (stepIndex === 2) {
        // 階段二：直式排法，靠右對齊並保留小數點
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div></div>`;
    } else if (stepIndex === 3) {
        // 階段三：【乘】讓學生計算，黑板暫時隱藏結果
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div><span style="background:rgba(255,255,255,0.2); color:transparent;">????</span></div>`;
    } else if (stepIndex === 4) {
        // 階段四：【換】顯示整數計算後的結果
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div>${data.mulAns}</div>`;
    } else if (stepIndex === 5) {
        // 階段五：【點】點出紅點小數點
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div><span style="color:#ff5252; font-weight:bold;">${data.finAns}</span></div>`;
    }
}

// ==========================================
// 3. 遊戲流程邏輯
// ==========================================
function initGame() {
    const data = levelData[currentLevel];
    document.getElementById('current-level').innerText = currentLevel;
    document.getElementById('monster-sprite').src = data.monsterImg;
    document.getElementById('hp-fill').style.width = "100%";
    updateMathBoard(1);
    currentStep = 1;
    steps.forEach((id, index) => { document.getElementById(id).classList.toggle('hidden', index !== 0); });

    // 載入【估】選項
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
            } else { alert("根據無條件捨去和進位，想想看區間在哪？"); }
        };
        estContainer.appendChild(btn);
    });

    // 載入【排】選項
    const arrContainer = document.getElementById('arrange-options');
    arrContainer.innerHTML = '';
    [{text:"靠左對齊",v:0},{text:"小數點對齊",v:1},{text:"靠右對齊",v:2}].forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt.text;
        btn.onclick = () => {
            if(opt.v === 2) { 
                playSound('correct');
                document.getElementById('math-board').classList.add('effect-pop');
                setTimeout(() => document.getElementById('math-board').classList.remove('effect-pop'), 800);
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
    if (parseInt(document.getElementById('multiply-input').value) === levelData[currentLevel].mulAns) {
        playSound('correct');
        document.getElementById('math-board').classList.add('effect-glow');
        switchStep(2, 3); updateMathBoard(4);
    } else { alert("整數相乘算錯囉！再算一次！"); }
};

document.querySelectorAll('#convert-options .option-btn').forEach(btn => {
    btn.onclick = () => {
        if(parseInt(btn.getAttribute('data-val')) === levelData[currentLevel].decAns) {
            playSound('correct');
            document.getElementById('math-board').classList.add('effect-pulse');
            switchStep(3, 4);
        } else { alert("數數看被乘數和乘數總共有幾位小數？"); }
    };
});

document.getElementById('btn-attack').onclick = () => {
    if (parseFloat(document.getElementById('final-input').value) === levelData[currentLevel].finAns) {
        playSound('attack');
        document.getElementById('monster-sprite').classList.add('effect-attack');
        document.getElementById('hp-fill').style.width = "0%";
        updateMathBoard(5);
        setTimeout(() => {
            if (currentLevel < 3) { alert(`擊敗成功！前往下一關！`); currentLevel++; initGame(); }
            else { 
                document.getElementById('monster-area').classList.add('hidden');
                document.getElementById('action-area').classList.add('hidden');
                document.getElementById('chest-area').classList.remove('hidden');
            }
        }, 1500);
    } else { alert("小數點位置不對喔！"); }
};

// ==========================================
// 4. 音效與獎勵
// ==========================================
function playSound(type) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if(type === 'correct') { osc.frequency.setValueAtTime(600, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.1); }
    if(type === 'attack') { osc.type = 'square'; osc.frequency.setValueAtTime(150, ctx.currentTime); gain.gain.setValueAtTime(0.2, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.3); }
    if(type === 'coin') { osc.frequency.setValueAtTime(1200, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.1); }
}

document.getElementById('chest-sprite').onclick = () => {
    playSound('coin');
    const drop = Math.floor(Math.random() * 5) + 1;
    document.getElementById('coin-count').innerText = drop;
    document.getElementById('chest-sprite').innerText = "✨💰✨";
    document.getElementById('chest-msg').innerHTML = `<span style="color:#d84315; font-size:24px; font-weight:bold;">恭喜獲得 ${drop} 枚金幣！</span>`;
};

// ==========================================
// 5. 🧚‍♂️ AI 小精靈：終極鎖死版 (無視網址金鑰)
// ==========================================
document.getElementById('btn-ai-help').onclick = async () => {
    const aiModal = document.getElementById('ai-modal');
    const aiText = document.getElementById('ai-response');
    aiModal.classList.remove('hidden'); aiModal.style.display = 'flex';
    
    // 直接鎖定正確金鑰，不再讀取 sessionStorage
    const finalKey = "AIzaSyCuqVFZDICVyU_YgJtDpjRJYsbr_mS1jeU"; 

    aiText.innerText = "精靈思考中... 🔮";
    const prompt = `你是一個數學小助教。題目是 ${levelData[currentLevel].qStr}。學生卡在步驟 ${currentStep} (1:估算, 2:直式排法, 3:整數相乘, 4:找小數位數, 5:點小數點)。請給予可愛且有啟發性的繁體中文提示，不要給答案。特別注意：如果是第三關魔龍，引導學生思考積末位為 0 是否可省略的例外情形。`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${finalKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        aiText.innerText = data.candidates[0].content.parts[0].text;
    } catch (e) {
        aiText.innerText = "💥 連線被魔物干擾！建議重新整理網頁後重試。";
    }
};

document.getElementById('btn-close-ai').onclick = () => { document.getElementById('ai-modal').style.display = 'none'; };

initGame();
