# Integrated Chinese Vocabulary Practice

This web application helps you practice vocabulary from the **first five chapters** of the **Integrated Chinese (4th Edition)** textbook. It is a small single‑page app that runs entirely in the browser and can be installed as a Progressive Web App (PWA) for offline use.

You can try the live site at [https://elias-sundqvist.github.io/integrated-chinese-practice/](https://elias-sundqvist.github.io/integrated-chinese-practice/).

## Features

- Vocabulary for Lessons 1‑5, including dialogues and basic phrases
- Multiple practice modes:
  - Chinese → Characters (type characters with your IME)
  - English → Characters
  - Chinese → Pinyin with tone numbers
- Randomized questions and score tracking
- Option to keep practicing only the words you missed
- Works offline after the first visit

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in your browser. (For best results, serve it with a small web server instead of opening the file directly.)
3. Choose a lesson and practice mode, then click **Start/Next Word**.

The app will display a prompt based on your selected mode. Type your answer and click **Check Answer**. Your score updates as you progress through the vocabulary list.
After a section is complete, click **Practice Failed** to drill only the words you missed.

## Adding More Vocabulary

Vocabulary lives in the `vocab/` directory (files named `vocab-lesson*.js`). Each file adds a set of words to the global `allVocabulary` object. To extend the app beyond Lesson 5, create new files in that folder and include them in `index.html` and `js/sw.js`.

## PWA Support

The app includes a Service Worker and `manifest.json` so it can be installed on your device. After visiting the page once, it should continue to work without an internet connection.

Enjoy practicing your Chinese!

## Continuous Deployment

The site is automatically deployed to GitHub Pages whenever changes are pushed
to the `master` branch. The workflow lives in `.github/workflows/deploy.yml` and
uploads the contents of the repository to the GitHub Pages environment.
