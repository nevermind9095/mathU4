// ==========================================
// 1. 終極防彈：自動修復與 API 版本校正
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
let keyFromUrl = urlParams.get('key');

if (keyFromUrl) {
    // 自動將所有空白、%20 轉回底線，並去除前後空格
    const cleanKey = keyFromUrl.trim().replace(/\s/g, '_'); 
    sessionStorage.setItem('gemini_api_key', cleanKey);
    window.history.replaceState({}, document.title, window.location.pathname);
}

// ==========================================
// 2. 遊戲資料庫 (更新第三關：對應教案活動五)
// ==========================================
let currentLevel = 1;
let coins = 0;
let currentStep = 1;

const levelData = {
    1: { 
        monsterImg: "slime.png", monsterName: "史萊姆 👾", qStr: "3.5 × 2.7 = ?", 
        topNum: "3.5", botNum: "2.7", estOptions: ["6 ~ 12 之間", "1 ~ 5 之間", "15 ~ 20 之間"], 
        estAns: 0, mulAns: 945, decAns: 2, finAns: 9.45
    },
    2: { 
        monsterImg: "goblin.png", monsterName: "哥布林 👺", qStr: "2.73 × 1.5 = ?", 
        topNum: "2.73", botNum: "1.5", estOptions: ["1 ~ 3 之間", "2 ~ 6 之間", "10 ~ 15 之間"], 
        estAns: 1, mulAns: 4095, decAns: 3, finAns: 4.095
    },
    3: { 
        monsterImg: "dragon.png", monsterName: "魔龍 🐉", 
        // 💡 針對教案活動五：積的小數點末幾位是0時的特例探討 [cite: 21, 78]
        qStr: "3.25 × 2.38 = ?", topNum: "3.25", botNum: "2.38",
        estOptions: ["1 ~ 4 之間", "7 ~ 12 之間", "15 ~ 20 之間"], estAns: 1, 
        mulAns: 77350, decAns: 4, finAns: 7.735 // 答案為 7.7350，末位0省略 
    }
};

const steps = ['step-estimate', 'step-arrange', 'step-multiply', 'step-convert', 'step-decimal'];

// ==========================================
// 3. 核心邏輯：黑板呈現次序進展 [cite: 1, 2, 3, 4]
// ==========================================
function updateMathBoard(stepIndex) {
    const board = document.getElementById('math-content');
    const data = levelData[currentLevel];
    if (stepIndex === 1) board.innerHTML = `${data.qStr}`;
    else if (stepIndex === 2) board.innerHTML = `<div class="vertical-math">${data.topNum}<br>x ${data.botNum}<br><div class="math-line"></div></div>`;
    else if (stepIndex === 3) board.innerHTML = `<div class="vertical-math">${data.topNum}<br>x ${data.botNum}<br><div class="math-line"></div><span style="color:transparent;">?</span></div>`;
    else if (stepIndex === 4) board.innerHTML = `<div class="vertical-math">${data.topNum}<br>x ${data.botNum}<br><div class="math-line"></div>${data.mulAns}</div>`;
    else if (stepIndex === 5) board.innerHTML = `<div class="vertical-math">${data.topNum}<br>x ${data.botNum}<br><div class="math-line"></div><span style="color:#ff5252; font-weight:bold;">${data.finAns}</span></div>`;
}

// ------------------------------------------
// 初始化與按鈕綁定 (省略部分重複邏輯)
// ------------------------------------------
function playSound(t){const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);if(t==='correct'){o.frequency.setValueAtTime(600,c.currentTime);g.gain.setValueAtTime(0.1,c.currentTime);o.start();o.stop(c.currentTime+0.1)}if(t==='attack'){o.type='square';o.frequency.setValueAtTime(150,c.currentTime);g.gain.setValueAtTime(0.2,c.currentTime);o.start();o.stop(c.currentTime+0.3)}if(t==='coin'){o.frequency.setValueAtTime(1200,c.currentTime);g.gain.setValueAtTime(0.1,c.currentTime);o.start();o.stop(c.currentTime+0.1)}}

function initGame() {
    const d=levelData[currentLevel]; document.getElementById('current-level').innerText=currentLevel;
    document.getElementById('monster-sprite').src=d.monsterImg; document.getElementById('hp-fill').style.width="100%";
    updateMathBoard(1); currentStep=1; steps.forEach((id,i)=>document.getElementById(id).classList.toggle('hidden',i!==0));
    const ec=document.getElementById('estimate-options'); ec.innerHTML='';
    d.estOptions.forEach((t,i)=>{const b=document.createElement('button');b.innerText=t;b.onclick=()=>{if(i===d.estAns){playSound('correct');document.body.classList.add('effect-break');setTimeout(()=>document.body.classList.remove('effect-break'),1000);switchStep(0,1);updateMathBoard(2)}else{alert("估算一下，答案會在哪個範圍？")}};ec.appendChild(b)});
    const ac=document.getElementById('arrange-options'); ac.innerHTML='';
    [{t:"靠左對齊",v:0},{t:"小數點對齊",v:1},{t:"靠右對齊",v:2}].forEach(o=>{const b=document.createElement('button');b.innerText=o.t;b.onclick=()=>{if(o.v===2){playSound('correct');document.getElementById('math-board').classList.add('effect-pop');switchStep(1,2);updateMathBoard(3)}else{alert("直式乘法要把誰對齊呢？")}};ac.appendChild(b)});
}

function switchStep(c,n){document.getElementById(steps[c]).classList.add('hidden');document.getElementById(steps[n]).classList.remove('hidden');currentStep=n+1}

document.getElementById('btn-multiply').onclick=()=>{if(parseInt(document.getElementById('multiply-input').value)===levelData[currentLevel].mulAns){playSound('correct');switchStep(2,3);updateMathBoard(4)}else{alert("整數相乘算錯囉！")}};
document.querySelectorAll('#convert-options .option-btn').forEach(b=>{b.onclick=()=>{if(parseInt(b.getAttribute('data-val'))===levelData[currentLevel].decAns){playSound('correct');switchStep(3,4)}else{alert("總共幾位小數？")}}});
document.getElementById('btn-attack').onclick=()=>{if(parseFloat(document.getElementById('final-input').value)===levelData[currentLevel].finAns){playSound('attack');document.getElementById('hp-fill').style.width="0%";updateMathBoard(5);setTimeout(()=>{if(currentLevel<3){currentLevel++;initGame()}else{document.getElementById('monster-area').classList.add('hidden');document.getElementById('action-area').classList.add('hidden');document.getElementById('chest-area').classList.remove('hidden')}},1500)}else{alert("小數點位置不對喔！")}};

document.getElementById('chest-sprite').onclick=()=>{const drop=Math.floor(Math.random()*5)+1;document.getElementById('coin-count').innerText=drop;document.getElementById('chest-sprite').innerText="✨💰✨";document.getElementById('chest-msg').innerText=`獲得 ${drop} 枚金幣！`};

// 🧚‍♂️ AI 求救：使用 v1beta 增加相容性
document.getElementById('btn-ai-help').onclick = async () => {
    const apiKey = window.tempApiKey || sessionStorage.getItem('gemini_api_key');
    const aiModal = document.getElementById('ai-modal');
    const aiText = document.getElementById('ai-response');
    aiModal.classList.remove('hidden'); aiModal.style.display = 'flex';
    
    if (!apiKey) { aiText.innerText = "🚨 魔法陣失效，請重新載入連結！"; return; }

    aiText.innerText = "精靈思考中... 🔮";
    const prompt = `你是一個溫柔的數學小助教。現在題目是 ${levelData[currentLevel].qStr}。學生卡在步驟 ${currentStep} (1:估算, 2:直式排法, 3:整數相乘, 4:找小數位數, 5:點小數點)。請給予可愛且有啟發性的繁體中文提示，不要給答案。特別注意：如果是魔龍關卡，引導學生思考積末位為 0 的省略規則。`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        aiText.innerText = data.candidates[0].content.parts[0].text;
    } catch (e) { aiText.innerText = "💥 連線被魔物干擾！(請確認金鑰正確無空白)"; }
};

document.getElementById('btn-close-ai').onclick = () => { document.getElementById('ai-modal').style.display = 'none'; };
initGame();
