const wordsDatabase = {
    letters_en: [
        { word: "A", img: "A" }, { word: "B", img: "B" }, { word: "C", img: "C" }, { word: "D", img: "D" }, { word: "E", img: "E" }
    ],
    easy: [
        { word: "cat", img: "🐱" }, { word: "dog", img: "🐶" }, { word: "sun", img: "☀️" }, { word: "car", img: "🚗" }, { word: "tree", img: "🌳" },
        { word: "ball", img: "⚽" }, { word: "book", img: "📚" }, { word: "cake", img: "🎂" }, { word: "fish", img: "🐟" }, { word: "moon", img: "🌙" }
    ],
    medium: [
        { word: "apple", img: "🍎" }, { word: "house", img: "🏠" }, { word: "clock", img: "⏰" }, { word: "train", img: "🚂" }, { word: "plane", img: "✈️" },
        { word: "chair", img: "🪑" }, { word: "shirt", img: "👕" }, { word: "candy", img: "🍬" }, { word: "pizza", img: "🍕" }, { word: "mouse", img: "🐭" }
    ],
    hard: [
        { word: "banana", img: "🍌" }, { word: "monkey", img: "🐵" }, { word: "rocket", img: "🚀" }, { word: "guitar", img: "🎸" }, { word: "laptop", img: "💻" },
        { word: "castle", img: "🏰" }, { word: "flower", img: "🌸" }, { word: "spider", img: "🕷️" }, { word: "burger", img: "🍔" }, { word: "orange", img: "🍊" }
    ]
};

let activeWordsList = [];
let availableWordsPool = []; 
let aiWrongWordsPool = []; // حافظة ذكية لتسجيل الكلمات الصعبة التي يخطئ بها الطفل لامتحانه فيها لاحقاً
let score = 0;
let time = 60; 
let isPlaying = false;
let isExamMode = false;
let timer = null;
let currentItem = null;
let currentDifficulty = 'easy';
let childAge = 6;

const ageBox = document.getElementById('age-box');
const difficultySelection = document.getElementById('difficulty-selection');
const gamePlayground = document.getElementById('game-playground');
const wordDisplay = document.getElementById('word');
const wordEmoji = document.getElementById('word-emoji');
const inputField = document.getElementById('input-field');
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const aiFeedback = document.getElementById('ai-feedback');
const aiStatus = document.getElementById('ai-status');

// دالة الذكاء الاصطناعي لتخصيص اللعبة تلقائياً بحسب عمر الطفل
function initAIByAge(age) {
    childAge = age;
    ageBox.style.display = 'none';
    difficultySelection.style.display = 'flex';
    
    if (age <= 5) {
        aiStatus.textContent = `🤖 نظام الذكاء الاصطناعي تم ضبطه لوضع التأسيس (الأعمار الصغيرة 4-5)`;
        localStorage.setItem('childHighScore_easy', 100); // فتح المستويات تلقائياً للأطفال الصغار للمرح
    } else if (age <= 7) {
        aiStatus.textContent = `🤖 نظام الذكاء الاصطناعي مضبوط للمستوى المتوسط (أعمار 6-7)`;
    } else {
        aiStatus.textContent = `🤖 نظام الذكاء الاصطناعي مضبوط لوضع التحدي والامتحانات (أعمار 8+)`;
    }
    checkUnlockedLevels();
    updateAllHighScores();
}

// دالة تشغيل وضع الامتحان المبني على أخطاء الطفل السابقة
function startAIExamMode() {
    isExamMode = true;
    // إذا لم يخطئ الطفل بعد، يتم تحميل كلمات عشوائية من المستوى الصعب لامتحانه
    activeWordsList = aiWrongWordsPool.length > 0 ? [...aiWrongWordsPool] : [...wordsDatabase['hard']];
    availableWordsPool = [...activeWordsList];
    
    aiStatus.textContent = `🔥 وضع الامتحان الذكي نشط: يتم اختبار الطفل في الكلمات الصعبة والمخطوءة!`;
    difficultySelection.style.display = 'none';
    gamePlayground.style.display = 'block';
    startBtn.style.display = 'inline-block';
    showNextItem();
}

function setDifficulty(level) {
    isExamMode = false;
    currentDifficulty = level;
    activeWordsList = wordsDatabase[level];
    availableWordsPool = [...activeWordsList]; 
    difficultySelection.style.display = 'none';
    gamePlayground.style.display = 'block';
    startBtn.style.display = 'inline-block';
    showNextItem();
}

function speakWord() {
    if (currentItem && currentItem.word) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(currentItem.word);
            utterance.lang = 'en-US'; utterance.rate = childAge <= 5 ? 0.7 : 0.85; // إبطاء النطق للصغار جداً
            window.speechSynthesis.speak(utterance);
        }
    }
}

startBtn.addEventListener('click', () => {
    if (!isPlaying) {
        startBtn.style.display = 'none';
        inputField.disabled = false;
        isPlaying = true;
        score = 0; time = 60;
        scoreDisplay.textContent = score;
        timeDisplay.textContent = time;
        inputField.value = ''; inputField.focus();
        showNextItem();
        timer = setInterval(countdown, 1000);
    }
});

function showNextItem() {
    if (availableWordsPool.length === 0) {
        availableWordsPool = [...activeWordsList];
    }
    const randomIndex = Math.floor(Math.random() * availableWordsPool.length);
    currentItem = availableWordsPool.splice(randomIndex, 1)[0]; 
    
    wordDisplay.textContent = currentItem.word;
    wordEmoji.textContent = currentItem.img;
    aiFeedback.style.display = 'none'; // تصفية التلميحات السابقة
    if (isPlaying) { speakWord(); }
}

// نظام الذكاء الاصطناعي لمراقبة الأخطاء والكتابة الخاطئة فوراً
inputField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const userValue = inputField.value.trim().toLowerCase();
        
        if (userValue === currentItem.word.toLowerCase()) {
            // نقاط مضاعفة بناءً على الحروف والنجاح
            score += currentDifficulty.includes('letters') ? 5 : currentItem.word.length * 2;
            scoreDisplay.textContent = score;
            inputField.value = '';
            inputField.style.borderColor = '#00ff87';
            setTimeout(() => inputField.style.borderColor = 'rgba(255, 255, 255, 0.3)', 400);
            showNextItem();
        } else {
            // رصد ذكي للخطأ: حفظ الكلمة الصعبة ليتم امتحانه بها لاحقاً
            if (!aiWrongWordsPool.some(item => item.word === currentItem.word)) {
                aiWrongWordsPool.push(currentItem);
            }
            
            // لوحة عدم كتابة الاسم الصحيح وتوليد التلميح الذكي
            inputField.style.borderColor = '#ff4a4a';
            aiFeedback.textContent = `❌ خطأ برمي! تلميح الذكاء الاصطناعي: الكلمة تبدأ بحرف "${currentItem.word[0].toUpperCase()}" وتنتهي بـ "${currentItem.word[currentItem.word.length-1]}"`;
            aiFeedback.style.display = 'block';
            
            // نطق صوتي تلميحي مساعد للطفل
            speakWord();
            setTimeout(() => inputField.style.borderColor = 'rgba(255, 255, 255, 0.3)', 400);
        }
    }
});

function countdown() {
    if (time > 0) { time--; timeDisplay.textContent = time; } else { gameOver(); }
}

function checkUnlockedLevels() {
    const easyHighScore = parseInt(localStorage.getItem('childHighScore_easy') || 0);
    const mediumHighScore = parseInt(localStorage.getItem('childHighScore_medium') || 0);
    const btnMedium = document.getElementById('btn-medium');
    const btnHard = document.getElementById('btn-hard');
    if (btnMedium && easyHighScore >= 100) { btnMedium.classList.remove('locked'); btnMedium.disabled = false; }
    if (btnHard && mediumHighScore >= 100) { btnHard.classList.remove('locked'); btnHard.disabled = false; }
}

function updateAllHighScores() {
    const levels = ['easy', 'medium', 'hard'];
    levels.forEach(level => {
        const savedScore = localStorage.getItem('childHighScore_' + level) || 0;
        const savedName = localStorage.getItem('childBestName_' + level) || '';
        const element = document.getElementById('rank-' + level);
        if (element) element.textContent = savedScore > 0 ? `${savedName} (${savedScore} نقطة)` : "لا يوجد بطل 🌟";
    });
}

function gameOver() {
    clearInterval(timer);
    isPlaying = false;
    wordDisplay.textContent = isExamMode ? "انتهى الامتحان! 📝" : "انتهى الوقت! 🏆";
    wordEmoji.textContent = "🏆";
    inputField.disabled = true;
    
    if (!currentDifficulty.includes('letters') && !isExamMode) {
        const currentHighScore = parseInt(localStorage.getItem('childHighScore_' + currentDifficulty) || 0);
        if (score > currentHighScore) {
            setTimeout(() => {
                const childName = prompt("🎉 بطل السكور القياسي الجديد! ما اسمك؟") || "بطل ذكي";
                localStorage.setItem('childHighScore_' + currentDifficulty, score);
                localStorage.setItem('childBestName_' + currentDifficulty, childName);
                resetToMenu();
            }, 500);
            return;
        }
    }
    alert(`امتحان ممتاز من البطل! المجموع الذكي: ${score} نقطة! 🎉`);
    resetToMenu();
}

function resetToMenu() {
    gamePlayground.style.display = 'none';
    difficultySelection.style.display = 'flex';
    checkUnlockedLevels(); 
    updateAllHighScores();
}
