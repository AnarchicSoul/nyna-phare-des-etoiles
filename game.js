(() => {
  'use strict';

  const STORAGE_KEY = 'nyna-phare-v2';
  const OLD_STORAGE_KEY = 'mission-etoiles-v1';
  const DEFAULT_TABLES = [2, 3, 4, 5, 10];
  const ALL_TABLES = Array.from({ length: 10 }, (_, index) => index + 1);
  const CHAPTERS = [
    { name: 'La Forêt des Lucioles', icon: '🌿', threshold: 6, description: 'Lumi la luciole a aperçu une lentille sous les arbres brillants. Quelques calculs aideront Nyna à la retrouver.' },
    { name: 'Le Pont de Nuages', icon: '☁️', threshold: 18, description: 'Le pont qui mène à l’île suivante s’est dispersé. Nyna rassemble les morceaux de lumière pour le traverser.' },
    { name: 'Le Jardin des Comètes', icon: '🌠', threshold: 35, description: 'Des graines d’étoiles attendent de refleurir. Chaque résultat juste illumine un nouveau sentier.' },
    { name: 'L’Horloge Lunaire', icon: '🌙', threshold: 55, description: 'Les aiguilles de la vieille horloge se sont arrêtées. Nyna remet le ciel en mouvement.' },
    { name: 'Le Sommet du Phare', icon: '🔭', threshold: 80, description: 'Tout en haut des îles, la dernière lentille attend Nyna. Le phare va bientôt briller à nouveau !' }
  ];
  const DAILY_TASKS = [
    { id: 'expedition', field: 'expeditions', icon: '🚀', title: 'Partir en expédition', target: 1, reward: 10 },
    { id: 'answers', field: 'correct', icon: '⭐', title: 'Trouver 6 bons résultats', target: 6, reward: 12 },
    { id: 'quick', field: 'fast', icon: '⚡', title: 'Faire 3 réponses éclair', target: 3, reward: 8 }
  ];
  const SHOP_ITEMS = [
    { id: 'lumi', icon: '✨', name: 'Lumi la luciole', description: 'Une petite compagne lumineuse pour les chemins sombres.', price: 25 },
    { id: 'cape', icon: '🧣', name: 'Cape des nuages', description: 'Une cape douce qui flotte dans le vent des îles.', price: 45 },
    { id: 'balloon', icon: '🎈', name: 'Montgolfière rose', description: 'Pour regarder l’archipel d’encore plus haut.', price: 70 },
    { id: 'cat', icon: '🐈', name: 'Moka le chat céleste', description: 'Un compagnon curieux qui adore les étoiles.', price: 95 },
    { id: 'crown', icon: '👑', name: 'Diadème des étoiles', description: 'Il scintille quand une nouvelle lentille est retrouvée.', price: 120 },
    { id: 'rainbow', icon: '🌈', name: 'Aurore arc-en-ciel', description: 'Une traînée de couleurs pour fêter le phare rallumé.', price: 150 }
  ];
  const SHOP_IDS = new Set(SHOP_ITEMS.map((item) => item.id));
  const TASK_IDS = new Set(DAILY_TASKS.map((task) => task.id));
  const $ = (id) => document.getElementById(id);
  const ui = {
    home: $('homeScreen'), shop: $('shopScreen'), game: $('gameScreen'), result: $('resultScreen'),
    mainNav: $('mainNav'), homeNav: $('homeNav'), shopNav: $('shopNav'),
    wallet: $('walletAmount'), shopWallet: $('shopWallet'), sound: $('soundButton'), toast: $('toast'),
    heroPlay: $('heroPlayButton'), storySteps: $('storySteps'), lensCount: $('lensCount'),
    chapterIcon: $('chapterIcon'), chapterLabel: $('chapterLabel'), chapterTitle: $('chapterTitle'),
    chapterDescription: $('chapterDescription'), storyProgress: $('storyProgress'),
    storyProgressFill: $('storyProgressFill'), storyProgressText: $('storyProgressText'),
    dailyDate: $('dailyDate'), dailyList: $('dailyList'), tableGrid: $('tableGrid'),
    selectionHint: $('selectionHint'), selectAll: $('selectAllButton'), clear: $('clearButton'),
    start: $('startButton'), playPanel: $('playPanel'), teaserShop: $('teaserShopButton'),
    collectionCount: $('collectionCount'), collectionItems: $('collectionItems'), shopGrid: $('shopGrid'),
    back: $('backButton'), gameChapter: $('gameChapter'), questionCounter: $('questionCounter'),
    sessionCoins: $('sessionCoins'), questionProgress: $('questionProgress'),
    questionProgressFill: $('questionProgressFill'), questionPrompt: $('questionPrompt'),
    equation: $('equation'), answer: $('answerInput'), feedback: $('feedback'), keypad: $('keypad'),
    check: $('checkButton'), next: $('nextButton'), resultTitle: $('resultTitle'),
    resultMessage: $('resultMessage'), chapterReward: $('chapterReward'), resultScore: $('resultScore'),
    resultEarned: $('resultEarned'), resultFast: $('resultFast'), reviewBox: $('reviewBox'),
    reviewList: $('reviewList'), retry: $('retryButton'), practice: $('practiceButton'),
    resultShop: $('resultShopButton'), choose: $('chooseButton')
  };

  function localDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function cleanTables(value) {
    if (!Array.isArray(value)) return [...DEFAULT_TABLES];
    return [...new Set(value.filter((n) => Number.isInteger(n) && n >= 1 && n <= 10))];
  }

  function cleanCount(value) {
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }

  function freshDaily() {
    return { date: localDayKey(), expeditions: 0, correct: 0, fast: 0, claimed: [] };
  }

  function loadData() {
    let saved = null;
    let old = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved) old = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY) || 'null');
    } catch { /* Certaines fenêtres privées bloquent le stockage local. */ }

    if (saved && typeof saved === 'object') {
      const daily = saved.daily && typeof saved.daily === 'object' && saved.daily.date === localDayKey()
        ? {
            date: localDayKey(),
            expeditions: cleanCount(saved.daily.expeditions),
            correct: cleanCount(saved.daily.correct),
            fast: cleanCount(saved.daily.fast),
            claimed: Array.isArray(saved.daily.claimed) ? [...new Set(saved.daily.claimed.filter((id) => TASK_IDS.has(id)))] : []
          }
        : freshDaily();
      return {
        tables: cleanTables(saved.tables), coins: cleanCount(saved.coins), light: cleanCount(saved.light),
        missions: cleanCount(saved.missions), sound: saved.sound === true,
        owned: Array.isArray(saved.owned) ? [...new Set(saved.owned.filter((id) => SHOP_IDS.has(id)))] : [],
        daily
      };
    }

    const oldStars = old && typeof old === 'object' ? cleanCount(old.stars) : 0;
    return {
      tables: old && typeof old === 'object' ? cleanTables(old.tables) : [...DEFAULT_TABLES],
      coins: oldStars * 4, light: oldStars,
      missions: old && typeof old === 'object' ? cleanCount(old.missions) : 0,
      sound: old?.sound === true, owned: [], daily: freshDaily()
    };
  }

  const data = loadData();
  let selectedTables = new Set(data.tables);
  let mission = null;
  let lastMistakes = [];
  let audioContext = null;
  let toastTimer = null;

  function saveData() {
    data.tables = [...selectedTables].sort((a, b) => a - b);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* Le jeu reste jouable pendant cette session. */ }
  }

  function syncDay() {
    if (data.daily.date !== localDayKey()) {
      data.daily = freshDaily();
      saveData();
    }
  }

  function completedChapters() {
    return CHAPTERS.filter((chapter) => data.light >= chapter.threshold).length;
  }

  function updateWallet() {
    ui.wallet.textContent = String(data.coins);
    ui.shopWallet.textContent = `✧ ${data.coins} ${data.coins > 1 ? 'éclats' : 'éclat'}`;
  }

  function updateSoundButton() {
    ui.sound.textContent = data.sound ? '🔊' : '🔇';
    ui.sound.setAttribute('aria-pressed', String(data.sound));
    ui.sound.setAttribute('aria-label', data.sound ? 'Désactiver les sons' : 'Activer les sons');
  }

  function playSound(correct) {
    if (!data.sound) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ||= new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();
      const now = audioContext.currentTime;
      const notes = correct ? [523, 659, 784] : [330, 294];
      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, now + index * .11);
        gain.gain.exponentialRampToValueAtTime(.075, now + index * .11 + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, now + index * .11 + .14);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now + index * .11);
        oscillator.stop(now + index * .11 + .15);
      });
    } catch { /* Les sons sont facultatifs. */ }
  }

  function toast(message) {
    clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.hidden = false;
    toastTimer = setTimeout(() => { ui.toast.hidden = true; }, 3400);
  }

  function showScreen(name) {
    syncDay();
    ui.home.hidden = name !== 'home';
    ui.shop.hidden = name !== 'shop';
    ui.game.hidden = name !== 'game';
    ui.result.hidden = name !== 'result';
    ui.mainNav.hidden = name === 'game';
    ui.homeNav.classList.toggle('is-active', name === 'home');
    ui.shopNav.classList.toggle('is-active', name === 'shop');
    if (name === 'home') ui.homeNav.setAttribute('aria-current', 'page');
    else ui.homeNav.removeAttribute('aria-current');
    if (name === 'shop') ui.shopNav.setAttribute('aria-current', 'page');
    else ui.shopNav.removeAttribute('aria-current');
    if (name === 'home') { renderStory(); renderDaily(); renderTables(); }
    if (name === 'shop') renderShop();
    updateWallet();
    window.scrollTo?.(0, 0);
  }

  function renderStory() {
    const unlocked = completedChapters();
    ui.lensCount.textContent = `${unlocked} / 5 lentilles`;
    ui.storySteps.replaceChildren();
    CHAPTERS.forEach((chapter, index) => {
      const step = document.createElement('span');
      step.className = `story-step ${index < unlocked ? 'done' : index === unlocked ? 'next' : ''}`;
      step.textContent = index < unlocked ? chapter.icon : String(index + 1);
      step.title = `${chapter.name} : ${index < unlocked ? 'lentille retrouvée' : 'à découvrir'}`;
      ui.storySteps.appendChild(step);
    });
    if (unlocked >= CHAPTERS.length) {
      ui.chapterIcon.textContent = '🌟';
      ui.chapterLabel.textContent = 'L’aventure continue';
      ui.chapterTitle.textContent = 'Le phare brille de nouveau !';
      ui.chapterDescription.textContent = 'Grâce à toi, les îles retrouvent leur chemin. Nyna peut encore explorer, s’entraîner et compléter sa collection.';
      ui.storyProgress.setAttribute('aria-valuemax', '1');
      ui.storyProgress.setAttribute('aria-valuenow', '1');
      ui.storyProgressFill.style.width = '100%';
      ui.storyProgressText.textContent = 'Les 5 lentilles ont été retrouvées. Bravo !';
      return;
    }
    const chapter = CHAPTERS[unlocked];
    const previous = unlocked === 0 ? 0 : CHAPTERS[unlocked - 1].threshold;
    const needed = chapter.threshold - previous;
    const current = data.light - previous;
    ui.chapterIcon.textContent = chapter.icon;
    ui.chapterLabel.textContent = `Étape ${unlocked + 1} sur 5`;
    ui.chapterTitle.textContent = chapter.name;
    ui.chapterDescription.textContent = chapter.description;
    ui.storyProgress.setAttribute('aria-valuemax', String(needed));
    ui.storyProgress.setAttribute('aria-valuenow', String(current));
    ui.storyProgressFill.style.width = `${Math.min(100, current / needed * 100)}%`;
    ui.storyProgressText.textContent = `${current} / ${needed} bonnes réponses vers la prochaine lentille`;
  }

  function grantReadyDaily() {
    let reward = 0;
    const names = [];
    for (const task of DAILY_TASKS) {
      if (data.daily[task.field] >= task.target && !data.daily.claimed.includes(task.id)) {
        data.daily.claimed.push(task.id);
        data.coins += task.reward;
        reward += task.reward;
        names.push(task.title);
      }
    }
    return { reward, names };
  }

  function renderDaily() {
    syncDay();
    ui.dailyDate.textContent = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    ui.dailyList.replaceChildren();
    DAILY_TASKS.forEach((task) => {
      const progress = Math.min(data.daily[task.field], task.target);
      const claimed = data.daily.claimed.includes(task.id);
      const row = document.createElement('div');
      row.className = `daily-task ${claimed ? 'complete' : ''}`;
      const icon = document.createElement('span');
      icon.className = 'task-icon';
      icon.textContent = claimed ? '✅' : task.icon;
      icon.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('div');
      copy.className = 'task-copy';
      const title = document.createElement('strong');
      title.textContent = task.title;
      const subtitle = document.createElement('small');
      subtitle.textContent = claimed ? 'Défi réussi !' : `${progress} / ${task.target}`;
      const track = document.createElement('div');
      track.className = 'task-progress';
      const fill = document.createElement('span');
      fill.style.width = `${progress / task.target * 100}%`;
      track.appendChild(fill);
      copy.append(title, subtitle, track);
      const reward = document.createElement('span');
      reward.className = 'task-reward';
      reward.textContent = claimed ? '✓' : `+${task.reward} ✧`;
      row.append(icon, copy, reward);
      ui.dailyList.appendChild(row);
    });
  }

  function renderTables() {
    ui.tableGrid.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', String(selectedTables.has(Number(button.dataset.table))));
    });
    const count = selectedTables.size;
    ui.start.disabled = count === 0;
    ui.selectionHint.textContent = count === 0
      ? 'Choisis au moins une table pour partir.'
      : count === 1 ? '1 table choisie.' : `${count} tables choisies.`;
  }

  function createTableChoices() {
    ALL_TABLES.forEach((table) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'table-choice';
      button.dataset.table = String(table);
      button.textContent = String(table);
      button.setAttribute('aria-label', `Table de ${table}`);
      button.addEventListener('click', () => {
        if (selectedTables.has(table)) selectedTables.delete(table);
        else selectedTables.add(table);
        saveData();
        renderTables();
      });
      ui.tableGrid.appendChild(button);
    });
    renderTables();
  }

  function renderShop() {
    ui.collectionItems.replaceChildren();
    const ownedItems = SHOP_ITEMS.filter((item) => data.owned.includes(item.id));
    ui.collectionCount.textContent = `${ownedItems.length} / ${SHOP_ITEMS.length} trésors découverts`;
    if (ownedItems.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'collection-empty';
      empty.textContent = 'Le sac attend son premier trésor. Une expédition peut déjà t’en offrir assez !';
      ui.collectionItems.appendChild(empty);
    } else {
      ownedItems.forEach((item) => {
        const token = document.createElement('span');
        token.className = 'collection-item';
        token.textContent = item.icon;
        token.title = item.name;
        token.setAttribute('aria-label', item.name);
        ui.collectionItems.appendChild(token);
      });
    }
    ui.shopGrid.replaceChildren();
    SHOP_ITEMS.forEach((item) => {
      const owned = data.owned.includes(item.id);
      const card = document.createElement('article');
      card.className = `shop-item ${owned ? 'is-owned' : ''}`;
      const icon = document.createElement('span');
      icon.className = 'item-icon';
      icon.textContent = item.icon;
      icon.setAttribute('aria-hidden', 'true');
      const title = document.createElement('h3');
      title.textContent = item.name;
      const description = document.createElement('p');
      description.textContent = item.description;
      card.append(icon, title, description);
      if (owned) {
        const label = document.createElement('span');
        label.className = 'owned-label';
        label.textContent = '✓ Dans ton sac';
        card.appendChild(label);
      } else {
        const buy = document.createElement('button');
        buy.type = 'button';
        buy.className = 'button button-sun';
        buy.textContent = `Obtenir · ${item.price} ✧`;
        buy.disabled = data.coins < item.price;
        buy.setAttribute('aria-label', `Obtenir ${item.name} pour ${item.price} éclats`);
        buy.addEventListener('click', () => buyItem(item.id));
        card.appendChild(buy);
        if (data.coins < item.price) {
          const hint = document.createElement('small');
          hint.className = 'afford-hint';
          hint.textContent = `Encore ${item.price - data.coins} éclats à gagner`;
          card.appendChild(hint);
        }
      }
      ui.shopGrid.appendChild(card);
    });
    updateWallet();
  }

  function buyItem(id) {
    const item = SHOP_ITEMS.find((entry) => entry.id === id);
    if (!item || data.owned.includes(id) || data.coins < item.price) return;
    data.coins -= item.price;
    data.owned.push(id);
    saveData();
    renderShop();
    playSound(true);
    toast(`${item.icon} ${item.name} rejoint le sac de Nyna !`);
  }

  function keyOf(a, b) { return `${Math.min(a, b)}-${Math.max(a, b)}`; }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  }

  function buildQuestions(focusKeys = []) {
    const pool = [];
    for (let a = 1; a <= 10; a++) {
      for (let b = a; b <= 10; b++) {
        if (selectedTables.has(a) || selectedTables.has(b)) pool.push({ a, b, key: keyOf(a, b) });
      }
    }
    const chosen = [];
    const included = new Set();
    const byKey = new Map(pool.map((question) => [question.key, question]));
    for (const key of shuffle(focusKeys)) {
      if (byKey.has(key) && chosen.length < 10 && !included.has(key)) {
        chosen.push(byKey.get(key));
        included.add(key);
      }
    }
    for (const question of shuffle(pool)) {
      if (chosen.length >= 10) break;
      if (!included.has(question.key)) {
        chosen.push(question);
        included.add(question.key);
      }
    }
    return shuffle(chosen).map((question) => Math.random() < .5
      ? { ...question }
      : { ...question, a: question.b, b: question.a });
  }

  function focusAnswerOnDesktop() {
    if (!window.matchMedia?.('(pointer: coarse)').matches) ui.answer.focus({ preventScroll: true });
  }

  function startMission(focusKeys = []) {
    if (selectedTables.size === 0) return;
    syncDay();
    mission = {
      base: buildQuestions(focusKeys), nextBase: 0, reviews: [], current: null,
      answered: 0, baseAnswered: 0, reviewAnswered: 0, reviewTotal: 0,
      firstTry: 0, recovered: 0, fast: 0, earned: 0, mistakes: [], locked: false,
      startedChapters: completedChapters(), questionStartedAt: 0, hiddenSince: null, hiddenDuration: 0
    };
    ui.gameChapter.textContent = completedChapters() < 5 ? CHAPTERS[completedChapters()].name : 'Le Phare des Étoiles';
    showScreen('game');
    nextQuestion();
  }

  function nextQuestion() {
    if (!mission) return;
    const dueIndex = mission.reviews.findIndex((item) => item.dueAfter <= mission.answered);
    if (dueIndex !== -1) mission.current = { ...mission.reviews.splice(dueIndex, 1)[0], isReview: true };
    else if (mission.nextBase < mission.base.length) mission.current = { ...mission.base[mission.nextBase++], isReview: false };
    else if (mission.reviews.length) mission.current = { ...mission.reviews.shift(), isReview: true };
    else { finishMission(); return; }

    mission.locked = false;
    mission.questionStartedAt = performance.now();
    mission.hiddenSince = document.hidden ? performance.now() : null;
    mission.hiddenDuration = 0;
    ui.answer.disabled = false;
    ui.answer.value = '';
    ui.check.hidden = false;
    ui.check.disabled = true;
    ui.next.hidden = true;
    ui.feedback.hidden = true;
    ui.feedback.className = 'feedback';
    ui.feedback.replaceChildren();
    setKeypadDisabled(false);
    renderQuestion();
    focusAnswerOnDesktop();
  }

  function renderQuestion() {
    const question = mission.current;
    ui.questionCounter.textContent = question.isReview
      ? `Révision ${mission.reviewAnswered + 1} sur ${mission.reviewTotal}`
      : `Question ${mission.baseAnswered + 1} sur 10`;
    ui.questionPrompt.textContent = question.isReview
      ? 'Tu l’as déjà vu : essaie encore !'
      : 'Prends ton temps, chaque réponse compte.';
    ui.equation.innerHTML = `<span>${question.a}</span><span class="times">×</span><span>${question.b}</span><span class="equal">=</span>`;
    ui.sessionCoins.textContent = `✧ ${mission.earned} ${mission.earned > 1 ? 'éclats' : 'éclat'}`;
    ui.questionProgress.setAttribute('aria-valuenow', String(mission.baseAnswered));
    ui.questionProgressFill.style.width = `${mission.baseAnswered * 10}%`;
  }

  function setKeypadDisabled(disabled) {
    ui.keypad.querySelectorAll('button').forEach((button) => { button.disabled = disabled; });
  }

  function updateCheckButton() {
    ui.answer.value = ui.answer.value.replace(/\D/g, '').slice(0, 3);
    ui.check.disabled = !mission || mission.locked || ui.answer.value.length === 0;
  }

  function activeAnswerSeconds() {
    const now = performance.now();
    const currentHidden = mission.hiddenSince === null ? 0 : now - mission.hiddenSince;
    return Math.max(0, (now - mission.questionStartedAt - mission.hiddenDuration - currentHidden) / 1000);
  }

  function learningTip(a, b) {
    if (a === 1 || b === 1) return 'Astuce : multiplier par 1 laisse le nombre identique.';
    if (a === 10 || b === 10) return `Astuce : ${a === 10 ? b : a} × 10, c’est ${a === 10 ? b : a} dizaines.`;
    if (a === 2 || b === 2) {
      const number = a === 2 ? b : a;
      return `Astuce : le double de ${number}, c’est ${number} + ${number} = ${number * 2}.`;
    }
    if (b >= 6) {
      const rest = b - 5;
      return `Astuce : ${a} × ${b} = ${a} × 5 + ${a} × ${rest} = ${a * 5} + ${a * rest} = ${a * b}.`;
    }
    return `Astuce : ${a} × ${b} = ${Array(b).fill(a).join(' + ')} = ${a * b}.`;
  }

  function showFeedback(title, body, tip, rewardLine, correct) {
    ui.feedback.className = `feedback ${correct ? 'good' : 'try'}`;
    const heading = document.createElement('strong');
    heading.textContent = title;
    const sentence = document.createElement('p');
    sentence.textContent = body;
    ui.feedback.append(heading, sentence);
    if (tip) {
      const hint = document.createElement('p');
      hint.className = 'tip';
      hint.textContent = tip;
      ui.feedback.appendChild(hint);
    }
    if (rewardLine) {
      const reward = document.createElement('p');
      reward.className = 'reward-line';
      reward.textContent = rewardLine;
      ui.feedback.appendChild(reward);
    }
    ui.feedback.hidden = false;
  }

  function checkAnswer() {
    if (!mission || mission.locked || ui.answer.value.length === 0) return;
    syncDay();
    const question = mission.current;
    const correct = Number(ui.answer.value) === question.a * question.b;
    const quick = correct && !question.isReview && activeAnswerSeconds() <= 10;
    mission.locked = true;
    mission.answered++;
    if (question.isReview) mission.reviewAnswered++;
    else mission.baseAnswered++;
    if (correct) {
      if (question.isReview) mission.recovered++;
      else mission.firstTry++;
      if (quick) mission.fast++;
      const baseReward = question.isReview ? 2 : 4 + (quick ? 2 : 0);
      data.coins += baseReward;
      data.light++;
      data.daily.correct++;
      if (quick) data.daily.fast++;
      const daily = grantReadyDaily();
      mission.earned += baseReward + daily.reward;
      const rewardText = `+${baseReward} éclats${quick ? ' (bonus éclair !)' : ''}${daily.reward ? ` · Défi du jour : +${daily.reward} éclats` : ''}`;
      showFeedback(question.isReview ? 'Bien retrouvé ! 🌟' : 'Bravo, le phare brille ! ⭐',
        `${question.a} × ${question.b} = ${question.a * question.b}.`, '', rewardText, true);
    } else {
      if (!question.isReview) {
        mission.mistakes.push(question);
        mission.reviews.push({ ...question, dueAfter: mission.answered + 2 });
        mission.reviewTotal++;
      }
      showFeedback('On apprend ensemble 💫',
        `${question.a} × ${question.b} = ${question.a * question.b}. ${question.isReview ? 'Tu pourras le rejouer à la prochaine expédition.' : 'Ce calcul reviendra un peu plus tard.'}`,
        learningTip(question.a, question.b), 'Aucun éclat perdu. Continue à ton rythme !', false);
    }
    saveData();
    updateWallet();
    playSound(correct);
    ui.answer.disabled = true;
    ui.check.hidden = true;
    ui.next.hidden = false;
    ui.next.textContent = mission.nextBase >= 10 && mission.reviews.length === 0 ? 'Voir le résultat →' : 'Continuer →';
    setKeypadDisabled(true);
    ui.sessionCoins.textContent = `✧ ${mission.earned} ${mission.earned > 1 ? 'éclats' : 'éclat'}`;
    ui.questionProgress.setAttribute('aria-valuenow', String(mission.baseAnswered));
    ui.questionProgressFill.style.width = `${mission.baseAnswered * 10}%`;
    ui.next.focus({ preventScroll: true });
  }

  function finishMission() {
    if (!mission) return;
    syncDay();
    data.missions++;
    data.daily.expeditions++;
    const daily = grantReadyDaily();
    mission.earned += daily.reward;
    saveData();
    updateWallet();
    const newChapters = completedChapters();
    const unlocked = CHAPTERS.slice(mission.startedChapters, newChapters);
    const score = mission.firstTry;
    ui.resultTitle.textContent = score >= 9 ? 'Mission étincelante ! ✨'
      : score >= 6 ? 'Bravo, Nyna et toi !' : 'La lumière grandit !';
    ui.resultMessage.textContent = score >= 9
      ? 'Tu as trouvé presque tous les chemins du premier coup. Nyna est prête pour la suite !'
      : score >= 6
        ? 'Le phare gagne de la lumière grâce à toi. Chaque expédition rapproche Nyna de son but.'
        : 'Chaque essai aide Nyna à apprendre. Repars explorer quand tu veux !';
    ui.resultScore.textContent = `${score}/10`;
    ui.resultEarned.textContent = `+${mission.earned}`;
    ui.resultFast.textContent = String(mission.fast);
    ui.chapterReward.hidden = unlocked.length === 0;
    ui.chapterReward.textContent = unlocked.length === 0 ? ''
      : unlocked.length === 1
        ? `${unlocked[0].icon} Nouvelle lentille retrouvée : ${unlocked[0].name} !`
        : `🌟 ${unlocked.length} nouvelles lentilles retrouvées !`;
    lastMistakes = mission.mistakes.map((question) => question.key);
    ui.reviewBox.hidden = lastMistakes.length === 0;
    ui.practice.hidden = lastMistakes.length === 0;
    ui.reviewList.replaceChildren();
    mission.mistakes.forEach((question) => {
      const chip = document.createElement('span');
      chip.className = 'review-chip';
      chip.textContent = `${question.a} × ${question.b} = ${question.a * question.b}`;
      ui.reviewList.appendChild(chip);
    });
    const dailyReward = daily.reward;
    mission = null;
    showScreen('result');
    if (dailyReward) toast(`Mission du jour réussie : +${dailyReward} éclats !`);
  }

  ui.sound.addEventListener('click', () => {
    data.sound = !data.sound;
    updateSoundButton();
    saveData();
    if (data.sound) playSound(true);
  });
  ui.homeNav.addEventListener('click', () => showScreen('home'));
  ui.shopNav.addEventListener('click', () => showScreen('shop'));
  ui.heroPlay.addEventListener('click', () => ui.playPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  ui.teaserShop.addEventListener('click', () => showScreen('shop'));
  ui.selectAll.addEventListener('click', () => { selectedTables = new Set(ALL_TABLES); saveData(); renderTables(); });
  ui.clear.addEventListener('click', () => { selectedTables.clear(); saveData(); renderTables(); });
  ui.start.addEventListener('click', () => startMission());
  ui.back.addEventListener('click', () => { mission = null; showScreen('home'); });
  ui.answer.addEventListener('input', updateCheckButton);
  ui.answer.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); checkAnswer(); }
  });
  ui.keypad.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !mission || mission.locked) return;
    if (button.dataset.digit !== undefined) ui.answer.value = (ui.answer.value + button.dataset.digit).slice(0, 3);
    else if (button.dataset.action === 'clear') ui.answer.value = '';
    else if (button.dataset.action === 'backspace') ui.answer.value = ui.answer.value.slice(0, -1);
    updateCheckButton();
    focusAnswerOnDesktop();
  });
  ui.check.addEventListener('click', checkAnswer);
  ui.next.addEventListener('click', nextQuestion);
  ui.retry.addEventListener('click', () => startMission());
  ui.practice.addEventListener('click', () => startMission(lastMistakes));
  ui.resultShop.addEventListener('click', () => showScreen('shop'));
  ui.choose.addEventListener('click', () => showScreen('home'));
  document.addEventListener('visibilitychange', () => {
    if (!mission || mission.locked) return;
    if (document.hidden) mission.hiddenSince = performance.now();
    else if (mission.hiddenSince !== null) {
      mission.hiddenDuration += performance.now() - mission.hiddenSince;
      mission.hiddenSince = null;
    }
  });
  window.addEventListener('focus', () => { syncDay(); if (!ui.home.hidden) renderDaily(); });

  window.nynaAndroidBack = () => {
    if (!ui.game.hidden) { mission = null; showScreen('home'); return true; }
    if (!ui.shop.hidden || !ui.result.hidden) { showScreen('home'); return true; }
    return false;
  };

  createTableChoices();
  updateSoundButton();
  saveData();
  showScreen('home');
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'appassets.androidplatform.net') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => { /* La version en ligne reste jouable sans cache. */ });
    });
  }
})();
