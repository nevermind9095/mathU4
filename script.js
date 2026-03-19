const urlParams = new URLSearchParams(window.location.search);
const keyFromUrl = urlParams.get('key');
if (keyFromUrl) {
    sessionStorage.setItem('gemini_api_key', keyFromUrl);
    window.history.replaceState({}, document.title, window.location.pathname);
}

// ==========================================
// 2. 遊戲資料庫 (更新：本地圖片檔名、第三關全新數字)
// ==========================================
let currentLevel = 1;
let coins = 0;
let currentStep = 1;

const levelData = {
    1: { 
        monsterImg: "slime.png", // 已更改為本地檔名
        monsterName: "史萊姆 👾", qStr: "3.5 × 2.7 = ?", topNum: "3.5", botNum: "2.7",
        estOptions: ["1 ~ 5 之間", "6 ~ 12 之間", "15 ~ 20 之間"], estAns: 1, 
        mulAns: 945, decAns: 2, finAns: 9.45
    },
    2: { 
        monsterImg: "goblin.png", // 已更改為本地檔名
        monsterName: "哥布林 👺", qStr: "2.73 × 1.5 = ?", topNum: "2.73", botNum: "1.5",
        estOptions: ["1 ~ 3 之間", "2 ~ 6 之間", "10 ~ 15 之間"], estAns: 1, 
        mulAns: 4095, decAns: 3, finAns: 4.095
    },
    3: { 
        monsterImg: "dragon.png", // 已更改為本地檔名
        monsterName: "魔龍 🐉", 
        // 第三關數字更新：增加難度與不同估算區間 (4x5=20 ~ 5x6=30)
        qStr: "4.23 × 5.18 = ?", topNum: "4.23", botNum: "5.18",
        estOptions: ["10 ~ 15 之間", "20 ~ 30 之間", "35 ~ 45 之間"], estAns: 1, 
        mulAns: 219114, decAns: 4, finAns: 21.9114
    }
};

const steps = ['step-estimate', 'step-arrange', 'step-multiply', 'step-convert', 'step-decimal'];

function playSound(type) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    
    if(type === 'correct') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime); 
        gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.1); 
    }
    if(type === 'attack') { 
        osc.type = 'square'; osc.frequency.setValueAtTime(150, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3); 
        gain.gain.setValueAtTime(0.2, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.3); 
    }
    if(type === 'coin') { 
        osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1); 
        gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.1); 
    }
}

function initGame() {
    const data = levelData[currentLevel];
    document.getElementById('current-level').innerText = currentLevel;
    
    // 載入魔物圖片 (若找不到本地圖片，會有替代文字顯示)
    document.getElementById('monster-sprite').src = data.monsterImg;
    document.getElementById('hp-fill').style.width = "100%";
    document.getElementById('monster-sprite').className = ''; 
    
    updateMathBoard(1);
    currentStep = 1;
    
    steps.forEach((id, index) => {
        document.getElementById(id).classList.toggle('hidden', index !== 0);
    });

    const estContainer = document.getElementById('estimate-options');
    estContainer.innerHTML = '';
    data.estOptions.forEach((text, idx) => {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.onclick = () => {
            if (idx === data.estAns) {
                playSound('correct');
                document.body.classList.add('effect-break');
                setTimeout(() => document.body.classList.remove('effect-break'), 1000); // 延長特效時間
                switchStep(0, 1);
                updateMathBoard(2);
            } else {
                alert("根據無條件捨去和進位，你想想看區間應該落在哪裡呢？");
            }
        };
        estContainer.appendChild(btn);
    });

    const arrContainer = document.getElementById('arrange-options');
    arrContainer.innerHTML = '';
    const arrOptions = [
        { text: "靠左對齊", val: 0 },
        { text: "小數點對齊", val: 1 },
        { text: "靠右對齊", val: 2 }
    ];
    arrOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt.text;
        btn.onclick = () => {
            if(opt.val === 2) { 
                playSound('correct');
                const board = document.getElementById('math-board');
                board.classList.add('effect-pop');
                setTimeout(() => board.classList.remove('effect-pop'), 800); // 延長特效時間
                switchStep(1, 2); 
                updateMathBoard(3);
            } else {
                alert("再想想看喔！直式乘法要把誰對齊呢？");
            }
        };
        arrContainer.appendChild(btn);
    });

    document.getElementById('multiply-input').value = '';
    document.getElementById('final-input').value = '';
}

function switchStep(currentIndex, nextIndex) {
    document.getElementById(steps[currentIndex]).classList.add('hidden');
    document.getElementById(steps[nextIndex]).classList.remove('hidden');
    currentStep = nextIndex + 1;
}

// ==========================================
// 【重要修正】更新戰鬥黑板邏輯，防止提前洩題
// ==========================================
function updateMathBoard(stepIndex) {
    const board = document.getElementById('math-content');
    const data = levelData[currentLevel];
    const top = data.topNum;
    const bot = data.botNum;

    if (stepIndex === 1) {
        board.innerHTML = `${data.qStr}`;
    } else if (stepIndex === 2) {
        // 步驟 2【排】：顯示直式，等待下一步
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div></div>`;
    } else if (stepIndex === 3) {
        // 步驟 3【乘】：只顯示直式底線，絕對不能秀出答案，逼學生自己算！
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div><span style="color:transparent;">?</span></div>`;
    } else if (stepIndex === 4) {
        // 步驟 4【換】：學生輸入正確整數後，黑板才秀出剛算好的整數結果
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div>${data.mulAns}</div>`;
    } else if (stepIndex === 5) {
        // 步驟 5【點】：最終結果，顯示小數點
        board.innerHTML = `<div class="vertical-math">&nbsp;&nbsp;${top}<br>x &nbsp;${bot}<br><div class="math-line"></div><span style="color:var(--accent-color);">${data.finAns}</span></div>`;
    }
}

// 綁定按鈕
document.getElementById('btn-multiply').onclick = () => {
    const val = parseInt(document.getElementById('multiply-input').value);
    if (val === levelData[currentLevel].mulAns) {
        playSound('correct');
        const board = document.getElementById('math-board');
        board.classList.add('effect-glow');
        setTimeout(() => board.classList.remove('effect-glow'), 1500); // 延長發光特效
        switchStep(2, 3);
        updateMathBoard(4); // 答對了才呼叫 step 4 的黑板更新
    } else {
        alert("整數相乘算錯囉！拿出計算紙再算一次！");
    }
};

document.querySelectorAll('#convert-options .option-btn').forEach(btn => {
    btn.onclick = () => {
        const val = parseInt(btn.getAttribute('data-val'));
        if(val === levelData[currentLevel].decAns) {
            playSound('correct');
            const board = document.getElementById('math-board');
            board.classList.add('effect-pulse');
            setTimeout(() => board.classList.remove('effect-pulse'), 1200); // 延長脈衝特效
            switchStep(3, 4);
        } else {
            alert("不對喔！數數看被乘數和乘數總共有幾位小數？");
        }
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
            if (currentLevel < 3) {
                alert(`太棒了！給予致命一擊！前往下一關！`);
                currentLevel++;
                initGame();
            } else {
                document.getElementById('monster-area').classList.add('hidden');
                document.getElementById('action-area').classList.add('hidden');
                document.getElementById('chest-area').classList.remove('hidden');
            }
        }, 1500);
    } else {
        alert("小數點點錯位置囉！差一點點！");
    }
};

document.getElementById('chest-sprite').onclick = () => {
    if (document.getElementById('chest-msg').innerText === "點擊寶箱開啟") {
        playSound('coin');
        const dropCoins = Math.floor(Math.random() * 5) + 1; 
        coins += dropCoins;
        document.getElementById('coin-count').innerText = coins;
        document.getElementById('chest-sprite').innerText = "✨💰✨";
        document.getElementById('chest-sprite').style.cursor = "default";
        document.getElementById('chest-sprite').style.animation = "none";
        document.getElementById('chest-msg').innerHTML = `<span style="color:#d84315; font-size:24px; font-weight:bold;">恭喜獲得 ${dropCoins} 枚金幣！</span><br>請舉手讓老師登記分數！`;
    }
};

const aiModal = document.getElementById('ai-modal');
const aiResponseText = document.getElementById('ai-response');

document.getElementById('btn-ai-help').onclick = async () => {
    const apiKey = sessionStorage.getItem('gemini_api_key');
    aiModal.classList.remove('hidden');
    aiModal.style.display = 'flex';
    
    if (!apiKey) {
        aiResponseText.innerText = "🚨 老師沒有施放魔法陣 (未找到 API Key)，小精靈無法降臨喔！";
        return;
    }

    aiResponseText.innerText = "小精靈思考中... 🔮";
    const prompt = `你是一個數學小精靈，教導國小五年級學生小數乘法。題目是 ${levelData[currentLevel].qStr}。學生卡在第 ${currentStep} 步驟 (1:估算, 2:直式排法, 3:整數相乘, 4:找小數位數, 5:點小數點)。請給予簡短可愛提示，絕對不能直接給答案！繁體中文，50字內。`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        aiResponseText.innerText = data.candidates[0].content.parts[0].text;
    } catch (error) {
        aiResponseText.innerText = "💥 連線被干擾！請稍後再試！";
    }
};

document.getElementById('btn-close-ai').onclick = () => { aiModal.style.display = 'none'; };

initGame();