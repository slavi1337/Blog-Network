let censoredWords = [];
let lastFetched = 0;
const CACHE_DURATION = 5 * 60 * 1000; // kes liste rijeci 5min

const getCensoredWords = async (pool) => {
  const now = Date.now();
  if (now - lastFetched > CACHE_DURATION || censoredWords.length === 0) {
    console.log("Osvježavam keš cenzurisanih riječi...");
    try {
      const { rows } = await pool.query("SELECT word FROM censored_words");
      censoredWords = rows.map((row) => row.word.toLowerCase());
      lastFetched = now;
    } catch (error) {
      console.error("Greška pri dohvatanju cenzurisanih riječi:", error);
    }
  }
  return censoredWords;
};

const containsCensoredWord = (text, wordList) => {
  if (!text) return false;
  const lowerCaseText = text.toLowerCase();

  return wordList.some((censoredWord) => lowerCaseText.includes(censoredWord));
};

module.exports = {
  getCensoredWords,
  containsCensoredWord,
};
