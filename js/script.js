document.addEventListener('DOMContentLoaded', () => {
    const lessonSelect = document.getElementById('lesson-select');
    const modeSelect = document.getElementById('mode-select');
    const startPracticeButton = document.getElementById('start-practice');
    const questionPromptDiv = document.getElementById('question-prompt');
    const questionDisplayDiv = document.getElementById('question-display');
    const speakWordButton = document.getElementById('speak-word');
    const practiceFailedButton = document.getElementById('practice-failed');
    const ttsSupported = 'speechSynthesis' in window;
    speakWordButton.disabled = true;
    if (!ttsSupported) {
        speakWordButton.style.display = 'none';
    }
    const answerInput = document.getElementById('answer-input');
    const checkAnswerButton = document.getElementById('check-answer');
    const feedbackDiv = document.getElementById('feedback');
    const scoreDiv = document.getElementById('score');
    const progressDiv = document.getElementById('progress');
    const currentWordInfoDiv = document.getElementById('current-word-info');
    const sessionReportDiv = document.getElementById('session-report');

    const state = {
        currentVocabList: [],
        currentWord: null,
        practiceActive: false,
        score: 0,
        totalAsked: 0,
        totalQuestions: 0,
        askedIndices: new Set(),
        attemptedCurrent: false, // track if the current word has been attempted
        results: []
    };

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
            state.currentVocabList = [];
            Object.values(window.allVocabulary).forEach(list => {
                state.currentVocabList = state.currentVocabList.concat(list);
            });
        } else {
            state.currentVocabList = window.allVocabulary[selectedLesson] || [];
        }
        state.totalQuestions = state.currentVocabList.length;
        state.askedIndices.clear();
        resetScore();
        if (state.currentVocabList.length === 0 && selectedLesson) { // only show error if a lesson was actually selected
            questionDisplayDiv.textContent = `No vocabulary for "${selectedLesson}".`;
            console.warn(`No vocabulary found for key: ${selectedLesson}`);
            state.practiceActive = false;
        } else if (!selectedLesson) {
             questionDisplayDiv.textContent = "Please select a lesson.";
             state.practiceActive = false;
        }
    }

    function startPractice(listOverride = null) {
        if (listOverride) {
            state.currentVocabList = listOverride;
            state.totalQuestions = state.currentVocabList.length;
            state.askedIndices.clear();
            resetScore();
        } else {
            // loadVocabulary is called when the select changes, or on initial setup.
            // Here, we ensure it's up-to-date if the user clicks start without changing selection.
            loadVocabulary(); // This will set state.currentVocabList

            if (!state.currentVocabList || state.currentVocabList.length === 0) {
                alert("Please select a lesson/section with vocabulary or add vocabulary to it.");
                return;
            }
        }
        state.practiceActive = true;
        state.results = [];
        sessionReportDiv.innerHTML = '';
        feedbackDiv.textContent = "";
        currentWordInfoDiv.innerHTML = "";
        answerInput.value = "";
        answerInput.disabled = false;
        checkAnswerButton.disabled = false;
        practiceFailedButton.disabled = true;
        nextWord();
    }

    function nextWord() {
        if (state.askedIndices.size >= state.currentVocabList.length) {
            questionDisplayDiv.textContent = "Section Complete!";
            feedbackDiv.textContent = `Final Score: ${state.score} / ${state.totalAsked}`;
            currentWordInfoDiv.innerHTML = "";
            state.practiceActive = false;
            answerInput.disabled = true;
            checkAnswerButton.disabled = true;
            speakWordButton.disabled = true;
            startPracticeButton.disabled = false;
            startPracticeButton.textContent = "Start/Next Word";
            const hasFails = state.results.some(r => !r.correct);
            practiceFailedButton.disabled = !hasFails;
            updateProgress();
            showSessionReport();
            return;
        }

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * state.currentVocabList.length);
        } while (state.askedIndices.has(randomIndex));

        state.askedIndices.add(randomIndex);
        state.currentWord = state.currentVocabList[randomIndex];

        displayQuestion();
        feedbackDiv.textContent = "";
        currentWordInfoDiv.innerHTML = "";
        answerInput.value = "";
        answerInput.focus();
        if (ttsSupported) speakWordButton.disabled = false;
        startPracticeButton.disabled = true;
        checkAnswerButton.disabled = false;
        answerInput.disabled = false;
        state.attemptedCurrent = false;
        updateProgress();
    }

    function displayQuestion() {
        const mode = modeSelect.value;
        answerInput.placeholder = "Type your answer here";
        answerInput.lang = ""; // Reset language attribute

        switch (mode) {
            case 'chineseToChars':
                questionPromptDiv.textContent = "Write the Chinese characters for:";
                questionDisplayDiv.textContent = state.currentWord.chinese;
                answerInput.placeholder = "Type Chinese characters (e.g., 你好)";
                answerInput.lang = "zh";
                break;
            case 'englishToChars':
                questionPromptDiv.textContent = "Write the Chinese characters for:";
                questionDisplayDiv.textContent = state.currentWord.english;
                answerInput.placeholder = "Type Chinese characters (e.g., 你好)";
                answerInput.lang = "zh";
                break;
            case 'chineseToPinyin':
                questionPromptDiv.textContent = "Write the Pinyin (with tone numbers, e.g., ni3 hao3) for:";
                questionDisplayDiv.textContent = state.currentWord.chinese;
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

    function normalizeChineseChars(str) {
        if (!str) return "";
        return str
            .replace(/（/g, '(')
            .replace(/）/g, ')')
            .replace(/\s+/g, '')
            .trim();
    }

    function generateChineseAnswerVariants(str) {
        const normalized = normalizeChineseChars(str);
        const withoutParens = normalized.replace(/\([^)]*\)/g, '');
        const withContent = normalized.replace(/[()]/g, '');
        return new Set([normalized, withoutParens, withContent]);
    }

    function checkAnswer() {
        if (!state.practiceActive || !state.currentWord) return;

        const userAnswer = answerInput.value.trim();
        const mode = modeSelect.value;
        let isCorrect = false;
        let correctAnswerText = "";

        switch (mode) {
            case 'chineseToChars':
            case 'englishToChars':
                const normalizedUserChars = normalizeChineseChars(userAnswer);
                const acceptableAnswers = generateChineseAnswerVariants(state.currentWord.chinese);
                isCorrect = acceptableAnswers.has(normalizedUserChars);
                correctAnswerText = state.currentWord.chinese;
                break;
            case 'chineseToPinyin':
                const normalizedUserAnswer = normalizePinyin(userAnswer);
                // Ensure pinyinNumbered in vocab.js uses 'v' for 'ü' if you use the normalization above that converts ü to v.
                // Example: { chinese: "女", pinyin: "nǚ", pinyinNumbered: "nv3", english: "female" }
                const normalizedCorrectPinyin = normalizePinyin(state.currentWord.pinyinNumbered);
                isCorrect = normalizedUserAnswer === normalizedCorrectPinyin;
                correctAnswerText = state.currentWord.pinyinNumbered;
                break;
        }

        if (!state.attemptedCurrent) {
            state.totalAsked++;
            state.results.push({
                word: state.currentWord,
                correct: isCorrect
            });
            if (isCorrect) {
                state.score++;
            }
        }

        state.attemptedCurrent = true;

        if (isCorrect) {
            feedbackDiv.textContent = "Correct!";
            feedbackDiv.className = 'correct';
            answerInput.disabled = true;
            checkAnswerButton.disabled = true;
            startPracticeButton.disabled = false;
            startPracticeButton.textContent = "Next Word";
        } else {
            feedbackDiv.textContent = `Incorrect. The answer is: ${correctAnswerText}`;
            feedbackDiv.className = 'incorrect';
            answerInput.disabled = false;
            checkAnswerButton.disabled = false;
            startPracticeButton.disabled = true;
        }

        updateScore();
        displayCurrentWordInfo();
    }

    function displayCurrentWordInfo() {
        if (!state.currentWord) return;
        currentWordInfoDiv.innerHTML = `
            <strong>Chinese:</strong> ${state.currentWord.chinese}<br>
            <strong>Pinyin (marks):</strong> ${state.currentWord.pinyin}<br>
            <strong>Pinyin (numbered):</strong> ${state.currentWord.pinyinNumbered}<br>
            <strong>English:</strong> ${state.currentWord.english}
        `;
    }

    function speakCurrentWord() {
        if (!state.currentWord || !('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(state.currentWord.chinese);
        utterance.lang = 'zh-CN';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    function updateScore() {
        scoreDiv.textContent = `Score: ${state.score} / ${state.totalAsked}`;
    }

    function updateProgress() {
        if (state.totalQuestions > 0 && state.practiceActive) {
            progressDiv.textContent = `Progress: ${state.askedIndices.size} / ${state.totalQuestions}`;
        } else if (state.totalQuestions > 0) {
            progressDiv.textContent = `Progress: 0 / ${state.totalQuestions}`;
        } else {
            progressDiv.textContent = '';
        }
    }

    function resetScore() {
        state.score = 0;
        state.totalAsked = 0;
        updateScore();
        updateProgress();
    }

    function showSessionReport() {
        if (state.results.length === 0) {
            sessionReportDiv.innerHTML = '';
            return;
        }
        let html = '<h2>Practice Report</h2><ul>';
        state.results.forEach(res => {
            const label = `${res.word.chinese} (${res.word.english})`;
            html += `<li class="${res.correct ? 'correct' : 'incorrect'}">${label}: ${res.correct ? '✓' : '✗'}</li>`;
        });
        html += '</ul>';
        sessionReportDiv.innerHTML = html;
    }

    startPracticeButton.addEventListener('click', () => {
        if (!state.practiceActive) {
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

    practiceFailedButton.addEventListener('click', () => {
        const failed = state.results.filter(r => !r.correct).map(r => r.word);
        if (failed.length === 0) {
            return;
        }
        startPractice(failed);
    });

    checkAnswerButton.addEventListener('click', checkAnswer);
    speakWordButton.addEventListener('click', speakCurrentWord);
    // Allow pressing Enter anywhere to check the answer or move to the next word
    // even when the answer input is disabled after a correct response.
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            if (!checkAnswerButton.disabled) {
                checkAnswer();
            } else if (!practiceFailedButton.disabled) {
                practiceFailedButton.click();
            } else if (!startPracticeButton.disabled) {
                // Enables using Enter to proceed without requiring a click
                startPracticeButton.click();
            }
        }
    });

    lessonSelect.addEventListener('change', () => {
        state.practiceActive = false;
        questionDisplayDiv.textContent = "Press 'Start/Next Word' to begin.";
        feedbackDiv.textContent = "";
        currentWordInfoDiv.innerHTML = "";
        sessionReportDiv.innerHTML = '';
        state.results = [];
        speakWordButton.disabled = true;
        practiceFailedButton.disabled = true;
        resetScore();
        state.askedIndices.clear();
        loadVocabulary(); // Load vocab for newly selected lesson
    });

    modeSelect.addEventListener('change', () => {
        state.practiceActive = false;
        questionDisplayDiv.textContent = "Press 'Start/Next Word' to begin.";
        feedbackDiv.textContent = "";
        currentWordInfoDiv.innerHTML = "";
        sessionReportDiv.innerHTML = '';
        state.results = [];
        speakWordButton.disabled = true;
        practiceFailedButton.disabled = true;
        // Score and askedIndices can persist if only mode changes for the same word list
        if (state.currentWord && state.practiceActive) { // If a word is already displayed, re-display for new mode
            displayQuestion();
        } else { // Otherwise, reset fully for next "start"
            resetScore();
            state.askedIndices.clear();
        }
    });

    // Initial load
    if (lessonSelect.options.length > 0 && lessonSelect.options[0].value) {
         loadVocabulary(); // Load vocab for the initially selected lesson
    }
    questionDisplayDiv.textContent = "Press 'Start/Next Word' to begin.";
    practiceFailedButton.disabled = true;


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
