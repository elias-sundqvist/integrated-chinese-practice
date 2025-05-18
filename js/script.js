document.addEventListener('DOMContentLoaded', () => {
    const lessonSelect = document.getElementById('lesson-select');
    const modeSelect = document.getElementById('mode-select');
    const startPracticeButton = document.getElementById('start-practice');
    const questionPromptDiv = document.getElementById('question-prompt');
    const questionDisplayDiv = document.getElementById('question-display');
    const answerInput = document.getElementById('answer-input');
    const checkAnswerButton = document.getElementById('check-answer');
    const feedbackDiv = document.getElementById('feedback');
    const scoreDiv = document.getElementById('score');
    const currentWordInfoDiv = document.getElementById('current-word-info');

    let currentVocabList = [];
    let currentWord = null;
    let practiceActive = false;
    let score = 0;
    let totalAsked = 0;
    let askedIndices = new Set();

    // Populate lesson select from the globally loaded allVocabulary
    // Ensure allVocabulary is populated by the separate vocab JS files before this script runs.
    if (window.allVocabulary && Object.keys(window.allVocabulary).length > 0) {
        // Add special option to practice all lessons combined
        const allOption = document.createElement('option');
        allOption.value = '__ALL__';
        allOption.textContent = 'All Lessons';
        lessonSelect.appendChild(allOption);

        // Sort keys for consistent order, e.g., by lesson number then by dialogue/section
        const sortedLessonKeys = Object.keys(window.allVocabulary).sort((a, b) => {
            // Basic sort, can be made more sophisticated if needed
            const extractNum = (s, prefix) => {
                const match = s.match(new RegExp(`${prefix}(\\d+)`));
                return match ? parseInt(match[1]) : Infinity;
            };

            if (a.startsWith("Basics") && !b.startsWith("Basics")) return -1;
            if (!a.startsWith("Basics") && b.startsWith("Basics")) return 1;

            const lessonNumA = extractNum(a, "Lesson ");
            const lessonNumB = extractNum(b, "Lesson ");

            if (lessonNumA !== lessonNumB) {
                return lessonNumA - lessonNumB;
            }
            // Further sort by dialogue or other sub-identifier if lesson numbers are same
            const dialogueNumA = extractNum(a, "Dialogue ");
            const dialogueNumB = extractNum(b, "Dialogue ");
             if (dialogueNumA !== dialogueNumB) {
                return dialogueNumA - dialogueNumB;
            }
            return a.localeCompare(b); // Fallback to alphabetical for same lesson/dialogue
        });

        sortedLessonKeys.forEach(lessonName => {
            const option = document.createElement('option');
            option.value = lessonName;
            option.textContent = lessonName;
            lessonSelect.appendChild(option);
        });
        if (lessonSelect.options.length > 0) {
            lessonSelect.value = lessonSelect.options[0].value; // Select first lesson by default
        }
    } else {
        console.error("allVocabulary is not defined or empty. Make sure vocab JS files are loaded correctly.");
        const option = document.createElement('option');
        option.textContent = "No Vocabulary Loaded";
        option.disabled = true;
        lessonSelect.appendChild(option);
    }


    function loadVocabulary() {
        const selectedLesson = lessonSelect.value;
        // allVocabulary should be populated by the individual vocab JS files now
        if (selectedLesson === '__ALL__') {
            // Combine vocabulary from all lessons
            currentVocabList = [];
            Object.values(window.allVocabulary).forEach(list => {
                currentVocabList = currentVocabList.concat(list);
            });
        } else {
            currentVocabList = window.allVocabulary[selectedLesson] || [];
        }
        askedIndices.clear();
        resetScore();
        if (currentVocabList.length === 0 && selectedLesson) { // only show error if a lesson was actually selected
            questionDisplayDiv.textContent = `No vocabulary for "${selectedLesson}".`;
            console.warn(`No vocabulary found for key: ${selectedLesson}`);
            practiceActive = false;
        } else if (!selectedLesson) {
             questionDisplayDiv.textContent = "Please select a lesson.";
             practiceActive = false;
        }
    }

    function startPractice() {
        // loadVocabulary is called when the select changes, or on initial setup.
        // Here, we ensure it's up-to-date if the user clicks start without changing selection.
        loadVocabulary(); // This will set currentVocabList

        if (!currentVocabList || currentVocabList.length === 0) {
            alert("Please select a lesson/section with vocabulary or add vocabulary to it.");
            return;
        }
        practiceActive = true;
        feedbackDiv.textContent = "";
        currentWordInfoDiv.innerHTML = "";
        answerInput.value = "";
        answerInput.disabled = false;
        checkAnswerButton.disabled = false;
        nextWord();
    }

    function nextWord() {
        if (askedIndices.size >= currentVocabList.length) {
            questionDisplayDiv.textContent = "Section Complete!";
            feedbackDiv.textContent = `Final Score: ${score} / ${totalAsked}`;
            currentWordInfoDiv.innerHTML = "";
            practiceActive = false;
            answerInput.disabled = true;
            checkAnswerButton.disabled = true;
            return;
        }

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * currentVocabList.length);
        } while (askedIndices.has(randomIndex));

        askedIndices.add(randomIndex);
        currentWord = currentVocabList[randomIndex];

        displayQuestion();
        feedbackDiv.textContent = "";
        currentWordInfoDiv.innerHTML = "";
        answerInput.value = "";
        answerInput.focus();
    }

    function displayQuestion() {
        const mode = modeSelect.value;
        answerInput.placeholder = "Type your answer here";
        answerInput.lang = ""; // Reset language attribute

        switch (mode) {
            case 'chineseToChars':
                questionPromptDiv.textContent = "Write the Chinese characters for:";
                questionDisplayDiv.textContent = currentWord.chinese;
                answerInput.placeholder = "Type Chinese characters (e.g., 你好)";
                answerInput.lang = "zh";
                break;
            case 'englishToChars':
                questionPromptDiv.textContent = "Write the Chinese characters for:";
                questionDisplayDiv.textContent = currentWord.english;
                answerInput.placeholder = "Type Chinese characters (e.g., 你好)";
                answerInput.lang = "zh";
                break;
            case 'chineseToPinyin':
                questionPromptDiv.textContent = "Write the Pinyin (with tone numbers, e.g., ni3 hao3) for:";
                questionDisplayDiv.textContent = currentWord.chinese;
                answerInput.placeholder = "e.g., ni3 hao3 (use 5 for neutral)";
                break;
        }
    }

    function normalizePinyin(pinyinStr) {
        if (!pinyinStr) return "";
        // Normalize to lowercase, remove spaces, handle ü -> u or v (user might type u or v)
        // The stored pinyinNumbered should consistently use 'u' for 'ü' if this normalization is applied.
        // Or, make pinyinNumbered in vocab files use 'v' if you want to strictly check for 'v'.
        // For simplicity, this example treats user 'u' or 'v' as potentially matching 'ü'.
        let normalized = pinyinStr.toLowerCase().replace(/\s+/g, '');
        normalized = normalized.replace(/ü/g, 'v'); // Standardize to 'v' for 'ü' internally
        normalized = normalized.replace(/u:/g, 'v'); // Also accept u: for ü
        return normalized;
    }

    function checkAnswer() {
        if (!practiceActive || !currentWord) return;

        const userAnswer = answerInput.value.trim();
        const mode = modeSelect.value;
        let isCorrect = false;
        let correctAnswerText = "";

        switch (mode) {
            case 'chineseToChars':
                isCorrect = userAnswer === currentWord.chinese;
                correctAnswerText = currentWord.chinese;
                break;
            case 'englishToChars':
                isCorrect = userAnswer === currentWord.chinese;
                correctAnswerText = currentWord.chinese;
                break;
            case 'chineseToPinyin':
                const normalizedUserAnswer = normalizePinyin(userAnswer);
                // Ensure pinyinNumbered in vocab.js uses 'v' for 'ü' if you use the normalization above that converts ü to v.
                // Example: { chinese: "女", pinyin: "nǚ", pinyinNumbered: "nv3", english: "female" }
                const normalizedCorrectPinyin = normalizePinyin(currentWord.pinyinNumbered);
                isCorrect = normalizedUserAnswer === normalizedCorrectPinyin;
                correctAnswerText = currentWord.pinyinNumbered;
                break;
        }

        if (isCorrect) {
            feedbackDiv.textContent = "Correct!";
            feedbackDiv.className = 'correct';
            if (!checkAnswerButton.disabled) {
                 score++;
            }
        } else {
            feedbackDiv.textContent = `Incorrect. The answer is: ${correctAnswerText}`;
            feedbackDiv.className = 'incorrect';
        }

        if (!checkAnswerButton.disabled) {
            totalAsked++;
        }
        updateScore();
        displayCurrentWordInfo();

        checkAnswerButton.disabled = true;
        answerInput.disabled = true;
        startPracticeButton.textContent = "Next Word";
    }

    function displayCurrentWordInfo() {
        if (!currentWord) return;
        currentWordInfoDiv.innerHTML = `
            <strong>Chinese:</strong> ${currentWord.chinese}<br>
            <strong>Pinyin (marks):</strong> ${currentWord.pinyin}<br>
            <strong>Pinyin (numbered):</strong> ${currentWord.pinyinNumbered}<br>
            <strong>English:</strong> ${currentWord.english}
        `;
    }

    function updateScore() {
        scoreDiv.textContent = `Score: ${score} / ${totalAsked}`;
    }

    function resetScore() {
        score = 0;
        totalAsked = 0;
        updateScore();
    }

    startPracticeButton.addEventListener('click', () => {
        if (!practiceActive) {
            // Begin a new practice session
            startPracticeButton.textContent = "Start/Next Word";
            checkAnswerButton.disabled = false;
            answerInput.disabled = false;
            startPractice();
        } else {
            // Continue with the next word without resetting progress
            checkAnswerButton.disabled = false;
            answerInput.disabled = false;
            nextWord();
        }
    });

    checkAnswerButton.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !checkAnswerButton.disabled) {
            checkAnswer();
        }
    });

    lessonSelect.addEventListener('change', () => {
        practiceActive = false;
        questionDisplayDiv.textContent = "Press 'Start/Next Word' to begin.";
        feedbackDiv.textContent = "";
        currentWordInfoDiv.innerHTML = "";
        resetScore();
        askedIndices.clear();
        loadVocabulary(); // Load vocab for newly selected lesson
    });

    modeSelect.addEventListener('change', () => {
        practiceActive = false;
        questionDisplayDiv.textContent = "Press 'Start/Next Word' to begin.";
        feedbackDiv.textContent = "";
        currentWordInfoDiv.innerHTML = "";
        // Score and askedIndices can persist if only mode changes for the same word list
        if (currentWord && practiceActive) { // If a word is already displayed, re-display for new mode
            displayQuestion();
        } else { // Otherwise, reset fully for next "start"
            resetScore();
            askedIndices.clear();
        }
    });

    // Initial load
    if (lessonSelect.options.length > 0 && lessonSelect.options[0].value) {
         loadVocabulary(); // Load vocab for the initially selected lesson
    }
    questionDisplayDiv.textContent = "Press 'Start/Next Word' to begin.";


    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('js/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
});