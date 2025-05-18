// Pinyin with tone marks uses standard pinyin.
// pinyinNumbered uses numbers 1-4 for tones, 5 or no number for neutral.
// Ensure pinyinNumbered is what the user is expected to type for that mode.
const allVocabulary = {
    "Lesson 1: Greetings - Dialogue 1": [
        { chinese: "你", pinyin: "nǐ", pinyinNumbered: "ni3", english: "you" },
        { chinese: "好", pinyin: "hǎo", pinyinNumbered: "hao3", english: "fine, good, nice, OK, it’s settled" },
        { chinese: "请", pinyin: "qǐng", pinyinNumbered: "qing3", english: "please, to treat or to invite" },
        { chinese: "问", pinyin: "wèn", pinyinNumbered: "wen4", english: "to ask (a question)" },
        { chinese: "贵", pinyin: "guì", pinyinNumbered: "gui4", english: "honorable, expensive" },
        { chinese: "姓", pinyin: "xìng", pinyinNumbered: "xing4", english: "(one’s) family name is . . . ; family name" },
        { chinese: "我", pinyin: "wǒ", pinyinNumbered: "wo3", english: "I, me" },
        { chinese: "呢", pinyin: "ne", pinyinNumbered: "ne5", english: "(question particle)" }, // or "ne" if neutral tone is no number
        { chinese: "小姐", pinyin: "xiǎojiě", pinyinNumbered: "xiao3jie3", english: "Miss, young lady" },
        { chinese: "叫", pinyin: "jiào", pinyinNumbered: "jiao4", english: "to be called, to call" },
        { chinese: "什么", pinyin: "shénme", pinyinNumbered: "shen2me5", english: "what" },
        { chinese: "名字", pinyin: "míngzi", pinyinNumbered: "ming2zi5", english: "name" },
        { chinese: "先生", pinyin: "xiānsheng", pinyinNumbered: "xian1sheng5", english: "Mr., husband, teacher" },
        { chinese: "李友", pinyin: "Lǐ Yǒu", pinyinNumbered: "Li3 You3", english: "(a personal name)" },
        { chinese: "李", pinyin: "Lǐ", pinyinNumbered: "Li3", english: "(a family name); plum" },
        { chinese: "王朋", pinyin: "Wáng Péng", pinyinNumbered: "Wang2 Peng2", english: "(a personal name)" },
        { chinese: "王", pinyin: "Wáng", pinyinNumbered: "Wang2", english: "(a family name); king" }
    ],
    "Lesson 1: Greetings - Dialogue 2": [
        // Add vocab from Lesson 1, Dialogue 2 here
        // Example:
        { chinese: "是", pinyin: "shì", pinyinNumbered: "shi4", english: "to be" },
        { chinese: "老师", pinyin: "lǎoshī", pinyinNumbered: "lao3shi1", english: "teacher" },
        { chinese: "吗", pinyin: "ma", pinyinNumbered: "ma5", english: "(question particle)" },
        { chinese: "不", pinyin: "bù", pinyinNumbered: "bu4", english: "not, no" }, // Note: tone changes, but base is bu4
        { chinese: "学生", pinyin: "xuésheng", pinyinNumbered: "xue2sheng5", english: "student" },
        { chinese: "也", pinyin: "yě", pinyinNumbered: "ye3", english: "too, also" },
        { chinese: "人", pinyin: "rén", pinyinNumbered: "ren2", english: "people, person" },
        { chinese: "中国", pinyin: "Zhōngguó", pinyinNumbered: "Zhong1guo2", english: "China" },
        { chinese: "北京", pinyin: "Běijīng", pinyinNumbered: "Bei3jing1", english: "Beijing" },
        { chinese: "美国", pinyin: "Měiguó", pinyinNumbered: "Mei3guo2", english: "America" },
        { chinese: "纽约", pinyin: "Niǔyuē", pinyinNumbered: "Niu3yue1", english: "New York" }
    ]
    // Add more lessons like:
    // "Lesson 2: Family - Dialogue 1": [ ... ],
    // "Lesson 2: Family - Dialogue 2": [ ... ],
};