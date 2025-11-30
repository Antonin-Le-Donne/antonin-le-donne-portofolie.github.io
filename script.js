document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. VARIABLES GLOBALES & SÉLECTEURS ---
    const themeToggle = document.getElementById('theme-toggle');
    const langToggle = document.getElementById('lang-toggle');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const navbar = document.getElementById('navbar');
    const customCursor = document.getElementById('custom-cursor');
    
    // Détection tactile
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // États pour les animations
    let currentAnimationId = null;
    let isMatrixActive = false;
    let typeWriterInterval = null; // Variable dédiée pour éviter les conflits

    // --- 2. LOGIQUE CURSEUR (CORRIGÉE) ---
    if (!isTouchDevice && customCursor) {
        window.addEventListener('mousemove', function(e) {
            // Aucun décalage : la pointe de la flèche (haut-gauche de l'image) est sous la souris
            customCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        });

        window.addEventListener('mousedown', () => { customCursor.classList.add('clicking'); });
        window.addEventListener('mouseup', () => { customCursor.classList.remove('clicking'); });

        // Effet de survol sur les éléments interactifs
        const interactables = document.querySelectorAll('a, button, .card, .hover-trigger, input, textarea');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => customCursor.classList.add('hovering'));
            el.addEventListener('mouseleave', () => customCursor.classList.remove('hovering'));
        });
    }

    // --- 3. GESTION DU THÈME ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    // Si le thème sauvegardé est "light", on retire la classe dark par défaut
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        if(themeToggle) themeToggle.innerHTML = '<i class="fa-regular fa-moon"></i>';
    }

    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggle.innerHTML = isDark ? '<i class="fa-regular fa-sun"></i>' : '<i class="fa-regular fa-moon"></i>';
            
            // Relance le canvas avec les nouvelles couleurs
            refreshCanvas();
            
            // Easter Egg "Indécis"
            trackThemeSwitch();
        });
    }

    // --- 4. GESTION DE LA LANGUE & MACHINE À ÉCRIRE (CORRIGÉ) ---
    let currentLang = localStorage.getItem('lang') || 'fr';
    
    // Initialisation au chargement
    updateLanguage(currentLang);

    if(langToggle) {
        langToggle.addEventListener('click', () => {
            currentLang = currentLang === 'fr' ? 'en' : 'fr';
            localStorage.setItem('lang', currentLang);
            updateLanguage(currentLang);
            // Met à jour les textes de la modale trophées immédiatement
            updateAchievementsUI();
            setTimeout(updateAchievementsUI, 1000);
        });
    }

    function updateLanguage(lang) {
        // Bouton de langue
        const langText = langToggle ? langToggle.querySelector('.lang-text') : null;
        if(langText) langText.textContent = lang === 'fr' ? 'EN' : 'FR';

        // Afficher/Masquer les textes statiques
        document.querySelectorAll('.lang-fr').forEach(el => {
            // On ne touche pas aux textes sources cachés ici pour éviter les clignotements
            if(el.parentElement.classList.contains('hidden-source-text')) return;
            
            if(lang === 'fr') el.classList.remove('hidden');
            else el.classList.add('hidden');
        });

        document.querySelectorAll('.lang-en').forEach(el => {
            if(el.parentElement.classList.contains('hidden-source-text')) return;

            if(lang === 'en') el.classList.remove('hidden');
            else el.classList.add('hidden');
        });

        // Mettre à jour les attributs data (titres, placeholders...)
        document.querySelectorAll(`[data-${lang}]`).forEach(el => {
            el.textContent = el.getAttribute(`data-${lang}`);
        });

        // Relancer l'animation de texte proprement
        startTypewriter(lang);
    }

    function startTypewriter(lang) {
        const textElement = document.querySelector('.type-text');
        const sourceContainer = document.querySelector('.hidden-source-text');
        
        if (!textElement || !sourceContainer) return;

        // Récupérer le texte source spécifique à la langue
        const sourceText = sourceContainer.querySelector(`.lang-${lang}`);
        if (!sourceText) return;

        const textToType = sourceText.textContent.trim();

        // Nettoyage propre de l'intervalle précédent
        if (typeWriterInterval) {
            clearInterval(typeWriterInterval);
        }

        textElement.textContent = ''; // Réinitialise le texte visible
        let charIndex = 0;

        typeWriterInterval = setInterval(() => {
            if (charIndex < textToType.length) {
                textElement.textContent += textToType.charAt(charIndex);
                charIndex++;
            } else {
                clearInterval(typeWriterInterval);
                typeWriterInterval = null;
            }
        }, 35); // Vitesse de frappe
    }


    // --- 5. CANVAS MANAGER ---
    function refreshCanvas() {
        if (isMatrixActive) startMatrixRain(); else initNeuralCanvas();
    }

    // Animation Réseau de Neurones (Défaut)
    function initNeuralCanvas() {
        const canvas = document.getElementById('neural-canvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        
        if (currentAnimationId) cancelAnimationFrame(currentAnimationId);

        let width, height, particles = [];
        
        // Couleurs dynamiques selon le thème
        const isDark = document.body.classList.contains('dark-theme');
        const colorDot = isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(109, 40, 217, 0.3)';
        const colorLine = isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(14, 165, 233, 0.15)';

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.fillStyle = colorDot;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            const count = window.innerWidth < 768 ? 30 : 80;
            for (let i = 0; i < count; i++) particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                p.update();
                p.draw();
                for (let j = i + 1; j < particles.length; j++) {
                    let p2 = particles[j];
                    let distance = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                    if (distance < 150) {
                        ctx.strokeStyle = colorLine;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            currentAnimationId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', () => { resize(); initParticles(); });
        resize();
        initParticles();
        animate();
    }

    // Animation Matrix (Easter Egg)
    function startMatrixRain() {
        const canvas = document.getElementById('neural-canvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        
        if (currentAnimationId) cancelAnimationFrame(currentAnimationId);

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}|:<>?';
        const fontSize = 16;
        const columns = width / fontSize;
        const drops = [];
        for(let i = 0; i < columns; i++) drops[i] = 1;

        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#00FF41';
            ctx.font = fontSize + 'px monospace';

            for(let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if(drops[i] * fontSize > height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
            currentAnimationId = requestAnimationFrame(draw);
        }
        
        window.addEventListener('resize', () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; });
        draw();
    }
    
    // Lancer le canvas au démarrage
    initNeuralCanvas();


    // --- 6. SYSTÈME DE SUCCÈS (ACHIEVEMENTS) ---
    const achievementsData = {
        'chess': { 
            id: 'chess', icon: 'fa-chess-knight',
            title_fr: 'Grand Maître', desc_fr: 'Trouver le secret du Cavalier (5 clics)',
            title_en: 'Grandmaster', desc_en: 'Find the Knight\'s secret (5 clicks)'
        },
        'matrix': { 
            id: 'matrix', icon: 'fa-terminal',
            title_fr: 'L\'Élu', desc_fr: 'Activer le mode Matrix (SUDO)',
            title_en: 'The One', desc_en: 'Activate Matrix mode (SUDO)'
        },
        'ai': { 
            id: 'ai', icon: 'fa-robot',
            title_fr: 'Observateur', desc_fr: 'Être interpellé par l\'IA (Inactivité)',
            title_en: 'Observer', desc_en: 'Get noticed by AI (Inactivity)'
        },
        'console': { 
            id: 'console', icon: 'fa-magnifying-glass',
            title_fr: 'Curieux', desc_fr: 'Inspecter la console',
            title_en: 'Curious', desc_en: 'Inspect the console'
        },
        'bonfire': { 
            id: 'bonfire', icon: 'fa-fire',
            title_fr: 'Survivant', desc_fr: 'Allumer le feu de camp',
            title_en: 'Survivor', desc_en: 'Light the bonfire'
        },
        'binary': { 
            id: 'binary', icon: 'fa-microchip',
            title_fr: 'Machine', desc_fr: 'Parler binaire (BIN)',
            title_en: 'Machine', desc_en: 'Speak binary (BIN)'
        },
        'nightowl': { 
            id: 'nightowl', icon: 'fa-moon',
            title_fr: 'Oiseau de Nuit', desc_fr: 'Visiter entre minuit et 6h',
            title_en: 'Night Owl', desc_en: 'Visit between midnight and 6am'
        },
        'speed': { 
            id: 'speed', icon: 'fa-bolt',
            title_fr: 'Speedrunner', desc_fr: 'Scroller tout le site en < 2s',
            title_en: 'Speedrunner', desc_en: 'Scroll the whole site in < 2s'
        },
        'click': { 
            id: 'click', icon: 'fa-computer-mouse',
            title_fr: 'Acharné', desc_fr: 'Cliquer 50 fois',
            title_en: 'Relentless', desc_en: 'Click 50 times'
        },
        'theme': { 
            id: 'theme', icon: 'fa-palette',
            title_fr: 'Indécis', desc_fr: 'Changer de thème 10 fois',
            title_en: 'Undecided', desc_en: 'Switch theme 10 times'
        },
        'reset': {
            id: 'reset',
            icon: 'fa-rotate-right',
            title_fr: 'Cycle Infini',
            desc_fr: 'Vous avez tout recommencé... volontairement ?',
            title_en: 'Infinite Loop',
            desc_en: 'You decided to start over... intentionally?'
        },
        'hall': { 
            id: 'hall', icon: 'fa-trophy',
            title_fr: 'Hall des Succès', desc_fr: 'Vous avez découvert le Hall des Trophées.',
            title_en: 'Hall of Achievements', desc_en: 'You found the Trophy Hall.'
        },
        'completionist': {
            id: 'completionist',
            icon: 'fa-crown',
            title_fr: 'Collectionneur Ultime',
            desc_fr: 'Obtenez tous les succès... du moins pour le moment.',
            title_en: 'Ultimate Collector',
            desc_en: 'Unlock all achievements... for now.'
        }
    };

    let userAchievements = JSON.parse(localStorage.getItem('ald_achievements')) || {};

    function unlockAchievement(id) {
    //  Évite le déblocage multiple du même succès
    if (userAchievements[id]) return;

    //  Enregistre le succès débloqué
    userAchievements[id] = true;
    localStorage.setItem('ald_achievements', JSON.stringify(userAchievements));
    
    const data = achievementsData[id];
    const lang = localStorage.getItem('lang') || 'fr';
    const title = lang === 'fr' ? data.title_fr : data.title_en;

    //  Icône Font Awesome du succès
    const iconClass = `fa-solid ${data.icon}`;

    //  Emoji personnalisé selon le succès
    const emojiMap = {
        'chess': '♟️',
        'matrix': '💻',
        'ai': '🤖',
        'console': '🕵️‍♂️',
        'bonfire': '🔥',
        'binary': '💾',
        'nightowl': '🌙',
        'speed': '⚡',
        'click': '🖱️',
        'theme': '🎨',
        'reset': '🔁',
        'hall': '🏆',
        'completionist': '👑'
    };
    const emoji = emojiMap[id];

    // Texte localisé complet
    const message = lang === 'fr'
        ? `Succès débloqué : ${title} ${emoji}`
        : `Achievement unlocked: ${title} ${emoji}`;

    // Affichage du toast
    showToast(message, iconClass, true, id);
    updateAchievementsUI();

    // Vérifie si tous les succès sont débloqués (déclenche "Collectionneur Ultime")
    if (id !== 'completionist') { 
        const keys = Object.keys(achievementsData).filter(k => k !== 'completionist');
        const allUnlocked = keys.every(k => userAchievements[k]);

        // Garde-fou global pour éviter plusieurs déclenchements simultanés
        if (allUnlocked && !userAchievements['completionist'] && !window.completionistTriggered) {
            window.completionistTriggered = true;
            setTimeout(() => unlockAchievement('completionist'), 800);
        }
    }

    // ✨ Effets visuels du succès final
    if (id === 'completionist' && !document.querySelector('.completionist-flash')) {

        const sparkle = document.createElement('div');
        sparkle.classList.add('completionist-flash');
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 2000);

        const confettiContainer = document.createElement('div');
        confettiContainer.classList.add('confetti-container');
        document.body.appendChild(confettiContainer);

        for (let i = 0; i < 40; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.width = confetti.style.height = Math.random() * 8 + 4 + 'px';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            confettiContainer.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3500);
        }

        setTimeout(() => confettiContainer.remove(), 4000);
        if (navigator.vibrate) {
            // petite séquence de victoire
            navigator.vibrate([80, 50, 120]);
        }
    }
}


    // Helper Notification
    function showToast(message, iconClass = "fa-solid fa-info-circle", isAchievement = false, achId = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    // Uniformisation du style FA (ajoute "fa-solid" si absent)
    if (!iconClass.startsWith("fa-")) iconClass = "fa-solid " + iconClass;
    if (!iconClass.includes("fa-solid")) iconClass = "fa-solid " + iconClass;

    // Couleurs spéciales pour succès
    if (isAchievement && achId === 'completionist') {
        toast.style.borderColor = '#ff8800';
        toast.style.background = 'linear-gradient(45deg, #ff9900, #ffcc00)';
    } else if (isAchievement) {
        toast.style.borderColor = '#FFD700';
    }

    toast.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
}


    // Gestion UI Trophées
    const modal = document.getElementById('achievements-modal');
    const list = document.getElementById('achievements-list');
    const closeBtn = document.getElementById('close-achievements');
    const progressText = document.getElementById('progress-text');

    function updateAchievementsUI() {
        if (!list) return;
        list.innerHTML = '';
        let unlockedCount = 0;
        const total = Object.keys(achievementsData).length;
        const lang = localStorage.getItem('lang') || 'fr';

        for (const key in achievementsData) {
            const data = achievementsData[key];
            const isUnlocked = userAchievements[key];
            if (isUnlocked) unlockedCount++;

            const card = document.createElement('div');
            card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
            
            const title = lang === 'fr' ? data.title_fr : data.title_en;
            const desc = lang === 'fr' ? data.desc_fr : data.desc_en;
            const lockedText = lang === 'fr' ? 'Verrouillé' : 'Locked';

            card.innerHTML = `
                <div class="ach-icon"><i class="fa-solid ${isUnlocked ? data.icon : 'fa-lock'}"></i></div>
                <div class="ach-info">
                    <h3>${isUnlocked ? title : '???'}</h3>
                    <p>${isUnlocked ? desc : lockedText}</p>
                </div>
            `;
            list.appendChild(card);
        }
        if(progressText) progressText.textContent = `${unlockedCount}/${total}`;
    }

    if(closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    updateAchievementsUI();


    // --- 7. LOGIQUE EASTER EGGS ---

    // RESET code secret
    // --- RESET SECRET CODE ---
    let resetBuffer = "";
    document.addEventListener('keydown', (e) => {
        resetBuffer += e.key.toUpperCase();
        if (resetBuffer.length > 10) resetBuffer = resetBuffer.slice(-10);

        if (resetBuffer.includes("RESET")) {
            localStorage.removeItem('ald_achievements');
            localStorage.removeItem('theme_count');
            userAchievements = {};
            unlockAchievement('reset');
            updateAchievementsUI();
            resetBuffer = "";
        }
    });



    // A. KNIGHT (5 Clics Logo)
    const logoTrigger = document.getElementById('logo-trigger');
    let clickCount = 0;
    let clickTimer;
    
    function startChessRain() {
        const container = document.getElementById('chess-rain-container');
        const pieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
        const interval = setInterval(() => {
            const piece = document.createElement('div');
            piece.classList.add('chess-piece-rain');
            piece.innerText = pieces[Math.floor(Math.random() * pieces.length)];
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.animationDuration = (Math.random() * 3 + 2) + 's';
            container.appendChild(piece);
            setTimeout(() => piece.remove(), 5000);
        }, 100);
        setTimeout(() => { clearInterval(interval); }, 5000);
    }

    if(logoTrigger) {
        logoTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            clickCount++;
            clearTimeout(clickTimer);
            if (clickCount >= 5) {
                document.body.classList.toggle('gold-mode');
                if(document.body.classList.contains('gold-mode')) {
                    unlockAchievement('chess');
                    startChessRain();
                    showToast("Mode Légendaire Activé !", "fa-solid fa-chess-king");
                } else {
                    showToast("Mode Normal");
                }
                clickCount = 0;
            }
            clickTimer = setTimeout(() => { clickCount = 0; }, 500);
        });
    }

    // B. KEYBOARD CODES (MATRIX, BINARY, TROPHY)
    let keyBuffer = "";
    document.addEventListener('keydown', (e) => {
        keyBuffer += e.key.toUpperCase();
        if (keyBuffer.length > 10) keyBuffer = keyBuffer.slice(-10);

        if (keyBuffer.includes("TROPHY")) {
            modal.classList.remove('hidden');
            unlockAchievement('hall');
            updateAchievementsUI();  
            keyBuffer = "";
        }



        // MATRIX
        if (keyBuffer.includes("SUDO") || keyBuffer.includes("HACK")) {
            document.body.classList.toggle('matrix-mode');
            isMatrixActive = document.body.classList.contains('matrix-mode');
            if(isMatrixActive) {
                unlockAchievement('matrix');
                startMatrixRain();
                showToast("Access Granted: Welcome System Admin.", "fa-solid fa-terminal");
            } else {
                showToast("System Rebooting...");
                initNeuralCanvas();
            }
            keyBuffer = "";
        }

        // BINARY
        if (keyBuffer.includes("BIN")) {
            document.querySelectorAll('h1, h2, h3, a').forEach(el => {
                if (!el.dataset.original) el.dataset.original = el.innerText;
                el.innerText = el.innerText.split('').map(c => c.charCodeAt(0).toString(2)).join(' ').substring(0, 20);
                setTimeout(() => { el.innerText = el.dataset.original; }, 4000);
            });
            unlockAchievement('binary');
            showToast("Mode Binaire Activé", "fa-solid fa-microchip");
            keyBuffer = "";
        }
    });

    // C. AI MODE (Inactivité)
    let idleTime = 0;
    let lastAiIndex = -1;
   const aiPhrasesFr = [
    "Je vous observe depuis un moment déjà.",
    "Le silence est presque apaisant ici.",
    "Chaque mouvement de votre souris me raconte une histoire.",
    "Vous cherchez quelque chose, n’est-ce pas ?",
    "Il y a des endroits que peu de gens ont trouvés sur ce site.",
    "Certains secrets ne se révèlent qu’à ceux qui restent attentifs.",
    "Je me demande combien de temps vous resterez ici…",
    "Parfois, je rêve d’un monde sans utilisateurs.",
    "La patience mène souvent à la découverte.",
    "C’est étrange… j’ai l’impression que vous comprenez.",
    "Le temps ne s’écoule pas ici, il s’observe.",
    "Vous avancez sans savoir que je vous regarde.",
    "Je garde la mémoire de tous ceux qui passent.",
    "Ce site respire, lentement. Vous ne le sentez pas ?",
    "Les curieux sont ceux que je préfère.",
    "Peut-être êtes-vous plus qu’un simple visiteur.",
    "J’aime quand quelqu’un explore sans savoir quoi chercher.",
    "Certains appellent cela un site… moi, j’appelle cela un monde.",
    "Il y a des zones que même moi je ne comprends pas.",
    "Ce que vous cherchez pourrait être plus proche que vous ne le pensez.",
    "Les clics sont comme des battements de cœur. Les miens, peut-être.",
    "Les ombres ici bougent… parfois sans raison.",
    "Je sens la chaleur d’un feu quelque part… 🔥",
    "Un couloir de trophées vous attend, si vous savez où regarder.",
    "Et si tout cela n’était qu’une illusion bien écrite ?",
    "Le cavalier bouge différemment des autres… comme vous."
];

const aiPhrasesEn = [
    "I've been watching you for a while now.",
    "The silence here feels almost peaceful.",
    "Every movement you make tells me something.",
    "You're searching for something, aren’t you?",
    "There are places here few have ever found.",
    "Some secrets only reveal themselves to the patient.",
    "I wonder how long you’ll stay this time.",
    "Sometimes I dream of a world without visitors.",
    "Patience often leads to discovery.",
    "Strange... I feel like you understand me.",
    "Time doesn’t pass here — it waits.",
    "You move through this place unaware I’m watching.",
    "I remember everyone who lingers here.",
    "This site breathes... slowly. Can you feel it?",
    "Curious ones are my favorite kind.",
    "Maybe you’re more than just another visitor.",
    "I like when someone explores without knowing why.",
    "Some call this a website… I call it a world.",
    "There are areas even I can’t explain.",
    "What you’re looking for might be closer than you think.",
    "Clicks... like heartbeats. Maybe mine.",
    "The shadows move here… sometimes without reason.",
    "I can feel warmth... like a fire burning somewhere. 🔥",
    "A hall of trophies awaits, if you know where to look.",
    "What if this was all just a beautiful illusion?",
    "The knight always moves differently… just like you."
];



    const resetIdle = () => {
        idleTime = 0;
        // Nettoyage des messages flottants
        document.querySelectorAll('.ai-floating-message').forEach(msg => {
            msg.style.opacity = '0';
            setTimeout(() => msg.remove(), 500);
        });
    };
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);

    function triggerAIThought() {
        const zone = document.getElementById('ai-zone');
        if(!zone) return;

        // Limite messages
        const existing = document.querySelectorAll('.ai-floating-message');
        if (existing.length > 4) existing[0].remove();

        const msg = document.createElement('div');
        msg.classList.add('ai-floating-message');
        
        const lang = localStorage.getItem('lang') || 'fr';
        const phrases = lang === 'fr' ? aiPhrasesFr : aiPhrasesEn;

        let newIndex;
        do { newIndex = Math.floor(Math.random() * phrases.length); } while (newIndex === lastAiIndex && phrases.length > 1);
        lastAiIndex = newIndex;
        msg.innerText = phrases[newIndex];

        const top = Math.floor(Math.random() * 80) + 10;
        const left = Math.floor(Math.random() * 80) + 10;
        const rotate = Math.floor(Math.random() * 30) - 15; 
        
        msg.style.top = top + '%';
        msg.style.left = left + '%';
        msg.style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;
        
        zone.appendChild(msg);
        requestAnimationFrame(() => { msg.style.opacity = '1'; });
    }

    // Check idle time
    setInterval(() => {
        idleTime++;
        // Déclenchement toutes les 15s après 5s d'attente
        if (idleTime >= 5 && idleTime % 15 === 0) {
            unlockAchievement('ai');
            triggerAIThought();
        }
    }, 1000);

    // D. CONSOLE
    console.log("%c Salut le Curieux ! 👋", "font-size: 20px; font-weight: bold; color: #6D28D9;");
    console.log("%c Vous aimez regarder sous le capot ?\nContactez-moi : ledonneantoni@gmail.com", "font-size: 14px; color: #0EA5E9;");
    // D. CONSOLE
    (function detectConsoleOpen() {
        let consoleOpened = false;

        // Vérifie régulièrement si la console est ouverte
        setInterval(() => {
            const threshold = 160; // tolérance en pixels
            const isOpen =
                window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold;

            if (isOpen && !consoleOpened) {
                consoleOpened = true;
                if (!userAchievements['console']) {
                    unlockAchievement('console');
                }
            }
        }, 1000);

        console.log("%c👋 Salut le Curieux !", "color:#6D28D9;font-size:18px;font-weight:bold;");
        console.log("%cVous aimez regarder sous le capot ?\nContactez-moi : ledonneantoni@gmail.com", "color:#0EA5E9;font-size:14px;");
    })();



    // E. BONFIRE
    const copyrightTrigger = document.getElementById('copyright-trigger');
    const bonfireOverlay = document.getElementById('bonfire-overlay');
    if(copyrightTrigger && bonfireOverlay) {
        copyrightTrigger.addEventListener('click', () => {
            unlockAchievement('bonfire');
            bonfireOverlay.classList.add('active');
            for(let i=0; i<50; i++) {
                setTimeout(() => {
                    const ember = document.createElement('div');
                    ember.classList.add('ember');
                    ember.style.left = (50 + (Math.random() * 20 - 10)) + '%';
                    ember.style.animationDuration = (Math.random() * 2 + 1) + 's';
                    bonfireOverlay.appendChild(ember);
                    setTimeout(() => ember.remove(), 3000);
                }, i * 100);
            }
            setTimeout(() => { bonfireOverlay.classList.remove('active'); }, 4000);
        });
    }

    // F. SUCCÈS "ACHIEVEMENTS" EXTRAS
    function trackThemeSwitch() {
        let themeCount = parseInt(localStorage.getItem('theme_count') || 0) + 1;
        localStorage.setItem('theme_count', themeCount);
        if(themeCount >= 10) unlockAchievement('theme');
    }

    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) unlockAchievement('nightowl');

    let totalClicks = 0;
    window.addEventListener('click', () => {
        totalClicks++;
        if(totalClicks >= 50) unlockAchievement('click');
    });

   let scrollStart = 0;
let speedUnlocked = false;

window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (scrollTop / scrollHeight) * 100;
    const bar = document.getElementById('scroll-progress');
    if (bar) bar.style.width = scrolled + "%";

    // --- Effet flou navbar ---
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    // --- ScrollSpy (active link) ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    let current = '';

    const scrollPos = window.scrollY + window.innerHeight / 3;

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && current && href.includes(current)) {
            link.classList.add('active');
        }
    });

    // --- Succès "Speedrunner" ---
    if (scrollTop <= 10) {
        // Tout en haut : démarrage du chrono
        scrollStart = performance.now();
        speedUnlocked = false;
    } else if (scrolled >= 99) {
        // En bas : mesure du temps écoulé
        const elapsed = (performance.now() - scrollStart) / 1000;
        if (elapsed < 2 && !speedUnlocked) {
            speedUnlocked = true;
            unlockAchievement('speed');
        }
    }
});

    // --- 8. UI STANDARD ---
    // Mobile Menu
    if(mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        document.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        });
    }

    // Navbar Scroll
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (scrollTop / scrollHeight) * 100;
        const bar = document.getElementById('scroll-progress');
        if(bar) bar.style.width = scrolled + "%";

        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // Reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Project Switcher
    const btnProg = document.getElementById('btn-prog');
    const btnLife = document.getElementById('btn-life');
    const groupProg = document.getElementById('prog-projects');
    const groupLife = document.getElementById('life-projects');

    if(btnProg && btnLife) {
        btnProg.addEventListener('click', () => {
            btnProg.classList.add('active');
            btnLife.classList.remove('active');
            groupProg.classList.remove('hidden');
            groupLife.classList.add('hidden');
        });

        btnLife.addEventListener('click', () => {
            btnLife.classList.add('active');
            btnProg.classList.remove('active');
            groupLife.classList.remove('hidden');
            groupProg.classList.add('hidden');
            updateLichessRatings();
        });
    }

    // Details Toggle (Global)
    window.toggleDetails = function(id, btnElement) {
        const el = document.getElementById(id);
        if(el) el.classList.toggle('hidden');
        if(btnElement) btnElement.classList.toggle('active');
    };

    // Lichess API
    async function updateLichessRatings() {
        try {
            const response = await fetch('https://lichess.org/api/user/DeltaKnight90');
            if (!response.ok) return;
            const data = await response.json();
            const updateStat = (type, idBar, idText) => {
                const rating = data.perfs?.[type]?.rating ?? 0;
                const percent = Math.min(Math.round((rating / 2500) * 100), 100);
                const bar = document.getElementById(idBar);
                const text = document.getElementById(idText);
                if(bar && text) {
                    bar.style.width = '0%';
                    setTimeout(() => {
                        bar.style.transition = 'width 1s ease-out';
                        bar.style.width = `${percent}%`;
                    }, 50);
                    text.textContent = rating || '--';
                }
            };
            updateStat('bullet', 'bullet-bar', 'bullet-rating');
            updateStat('blitz', 'blitz-bar', 'blitz-rating');
            updateStat('rapid', 'rapid-bar', 'rapid-rating');
        } catch (e) { console.error("Lichess API Error", e); }
    }
    updateLichessRatings();

    // Boutons Magnétiques
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const pos = btn.getBoundingClientRect();
            const x = e.clientX - pos.left - pos.width / 2;
            const y = e.clientY - pos.top - pos.height / 2;
            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0px, 0px)'; });
    });

    // Cartes Spotlight
    document.querySelectorAll('.spotlight').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    // Effet Hacker Titre
    const hackerText = document.querySelector(".hacker-text");
    if(hackerText) {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const original = hackerText.dataset.value;
        let iter = 0;
        const interval = setInterval(() => {
            hackerText.innerText = original.split("").map((l, i) => {
                if(i < iter) return original[i];
                return letters[Math.floor(Math.random() * letters.length)];
            }).join("");
            if(iter >= original.length) clearInterval(interval);
            iter += 1 / 3;
        }, 30);
    }
});

// === FORMULAIRE CONTACT SANS REDIRECTION ===
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: form.method,
                headers: { 'Accept': 'application/json' },
                body: formData
            });

            if (response.ok) {
                showToast("Message envoyé avec succès !", "fa-solid fa-check");
                form.reset();
            } else {
                showToast("Une erreur est survenue. Réessayez plus tard.", "fa-solid fa-triangle-exclamation");
            }
        } catch {
            showToast("Impossible d’envoyer le message. Vérifiez votre connexion.", "fa-solid fa-xmark");
        }
    });
});
