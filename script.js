// ==========================================
// 1. 遊戲資料庫
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
        qStr: "4.23 × 5.18 = ?", topNum: "4.23", botNum: "5.18",
        estOptions: ["10 ~ 15 之間", "20 ~ 30 之間", "35 ~ 45 之間"], estAns: 1, 
        mulAns: 219114, decAns: 4, finAns: 21.9114
    }
};

const steps = ['step-estimate', 'step-arrange', 'step-multiply', 'step-convert', 'step-decimal'];

// ==========================================
// 2. 黑板呈現邏輯
// ==========================================
function updateMathBoard(stepIndex) {
    const board = document.getElementById('math-content');
    const data = levelData[currentLevel];
    const top = data.topNum;
    const bot = data.botNum;

    if (stepIndex === 1) {
        board.innerHTML = `${data.qStr}`;
    } else if (stepIndex === 2) {
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div></div>`;
    } else if (stepIndex === 3) {
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div><span style="color:transparent;">?</span></div>`;
    } else if (stepIndex === 4) {
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div>${data.mulAns}</div>`;
    } else if (stepIndex === 5) {
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div><span style="color:#ff5252; font-weight:bold;">${data.finAns}</span></div>`;
    }
}

// ==========================================
// 3. 遊戲流程
// ==========================================
function initGame() {
    const data = levelData[currentLevel];
    document.getElementById('current-level').innerText = currentLevel;
    document.getElementById('monster-sprite').src = data.monsterImg;
    document.getElementById('hp-fill').style.width = "100%";
    updateMathBoard(1);
    currentStep = 1;
    steps.forEach((id, index) => { document.getElementById(id).classList.toggle('hidden', index !== 0); });

    // 估算
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

    // 排法
    const arrContainer = document.getElementById('arrange-options');
    arrContainer.innerHTML = '';
    [{text:"靠左對齊",v:0},{text:"小數點對齊",v:1},{text:"靠右對齊",v:2}].forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt.text;
        btn.onclick = () => {
            if(opt.v === 2) { 
                playSound('correct');
                document.getElementById('math-board').classList.add('effect-pop');
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
    } else { alert("相乘算錯囉！"); }
};

document.querySelectorAll('#convert-options .option-btn').forEach(btn => {
    btn.onclick = () => {
        if(parseInt(btn.getAttribute('data-val')) === levelData[currentLevel].decAns) {
            playSound('correct');
            document.getElementById('math-board').classList.add('effect-pulse');
            switchStep(3, 4);
        } else { alert("位數不對喔！"); }
    };
});

document.getElementById('btn-attack').onclick = () => {
    if (parseFloat(document.getElementById('final-input').value) === levelData[currentLevel].finAns) {
        playSound('attack');
        document.getElementById('monster-sprite').classList.add('effect-attack');
        document.getElementById('hp-fill').style.width = "0%";
        updateMathBoard(5);
        setTimeout(() => {
            if (currentLevel < 3) { currentLevel++; initGame(); }
            else { 
                document.getElementById('monster-area').classList.add('hidden');
                document.getElementById('action-area').classList.add('hidden');
                document.getElementById('chest-area').classList.remove('hidden');
            }
        }, 1500);
    } else { alert("位置不對喔！"); }
};

function playSound(type) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if(type==='correct'){osc.frequency.setValueAtTime(600,ctx.currentTime);gain.gain.setValueAtTime(0.1,ctx.currentTime);osc.start();osc.stop(ctx.currentTime+0.1)}
    if(type==='attack'){osc.type='square';osc.frequency.setValueAtTime(150,ctx.currentTime);gain.gain.setValueAtTime(0.2,ctx.currentTime);osc.start();osc.stop(ctx.currentTime+0.3)}
}

document.getElementById('chest-sprite').onclick = () => {
    const drop = Math.floor(Math.random() * 5) + 1;
    document.getElementById('coin-count').innerText = drop;
    document.getElementById('chest-sprite').innerText = "✨💰✨";
    document.getElementById('chest-msg').innerText = `獲得 ${drop} 枚金幣！`;
};

initGame();
