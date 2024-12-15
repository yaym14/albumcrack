class AlbumQuiz {
    constructor() {
        this.username = '';
        this.currentQuestion = 0;
        this.score = 0;
        this.albums = [];
        this.currentAlbum = null;
        this.questionStartTime = 0;
        this.genres = ['Pop', 'Hip-Hop', 'Rock', 'R&B', 'Electronic', 'Alternative'];
        
        // Initialize DOM elements
        this.initializeElements();
        this.addEventListeners();
    }

    initializeElements() {
        // Screens
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.countdownScreen = document.getElementById('countdown');
        this.quizContainer = document.getElementById('quiz-container');
        this.finishScreen = document.getElementById('finish-screen');
        this.leaderboardScreen = document.getElementById('leaderboard-screen');

        // Input and buttons
        this.usernameInput = document.getElementById('username-input');
        this.startButton = document.getElementById('start-button');
        
        // Quiz elements
        this.albumCover = document.getElementById('album-cover');
        this.albumTitle = document.getElementById('album-title');
        this.yearOptions = document.getElementById('year-options');
        this.genreOptions = document.getElementById('genre-options');
        this.questionCount = document.getElementById('question-count');
        this.currentScoreElement = document.getElementById('current-score');
        this.finalScoreElement = document.getElementById('final-score');
    }

    addEventListeners() {
        this.usernameInput.addEventListener('input', () => {
            this.startButton.disabled = !this.usernameInput.value.trim();
        });

        this.startButton.addEventListener('click', () => this.startQuiz());
        document.getElementById('leaderboard-button').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('play-again-button').addEventListener('click', () => this.resetQuiz());
    }

    async startQuiz() {
        this.username = this.usernameInput.value.trim();
        this.welcomeScreen.classList.add('hidden');
        await this.showCountdown();
        await this.loadAlbums();
        this.showQuiz();
    }

    async showCountdown() {
        const countdownElement = document.querySelector('.countdown-number');
        this.countdownScreen.classList.remove('hidden');

        for (let i = 3; i > 0; i--) {
            countdownElement.textContent = i;
            countdownElement.classList.add('animate__animated', 'animate__bounceIn');
            await new Promise(resolve => setTimeout(resolve, 1000));
            countdownElement.classList.remove('animate__bounceIn');
        }

        this.countdownScreen.classList.add('hidden');
    }

    async loadAlbums() {
        const genres = ['rap', 'hip-hop', 'pop', 'rock'];
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        const url = `https://itunes.apple.com/search?term=${randomGenre}&entity=album&limit=200&attribute=genreTerm`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            // Filter out compilations and various artists albums
            this.albums = this.shuffleArray(data.results.filter(album => {
                // Check if album has a release date
                if (!album.releaseDate) return false;
                
                const title = album.collectionName.toLowerCase();
                // Filter out common compilation indicators
                const compilationKeywords = [
                    'greatest hits',
                    'best of',
                    'collection',
                    'anthology',
                    'compilation',
                    'various artists',
                    'mixtape',
                    'mix tape',
                    'deluxe',
                    'remastered',
                    'live',
                    'remix'
                ];
                
                return !compilationKeywords.some(keyword => title.includes(keyword));
            }));
        } catch (error) {
            console.error('Error loading albums:', error);
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    showQuiz() {
        this.quizContainer.classList.remove('hidden');
        this.nextQuestion();
    }

    nextQuestion() {
        if (this.currentQuestion >= 15) {
            this.endQuiz();
            return;
        }

        this.currentAlbum = this.albums[this.currentQuestion];
        this.questionCount.textContent = this.currentQuestion + 1;
        this.questionStartTime = Date.now();

        // Display album
        this.albumCover.src = this.currentAlbum.artworkUrl100.replace('100x100', '600x600');
        this.albumTitle.textContent = this.currentAlbum.collectionName;

        // Generate options
        this.displayYearOptions();
        this.displayGenreOptions();
    }

    displayYearOptions() {
        const correctYear = new Date(this.currentAlbum.releaseDate).getFullYear();
        const years = this.generateYearOptions(correctYear);
        
        this.yearOptions.innerHTML = years.map(year => `
            <button class="option-button year-option" data-year="${year}">${year}</button>
        `).join('');

        this.yearOptions.querySelectorAll('.year-option').forEach(button => {
            button.addEventListener('click', () => this.handleYearGuess(parseInt(button.dataset.year)));
        });
    }

    displayGenreOptions() {
        const genres = this.shuffleArray([...this.genres]).slice(0, 4);
        if (!genres.includes(this.currentAlbum.primaryGenreName)) {
            genres[0] = this.currentAlbum.primaryGenreName;
        }
        
        this.genreOptions.innerHTML = this.shuffleArray(genres).map(genre => `
            <button class="option-button genre-option" data-genre="${genre}">${genre}</button>
        `).join('');

        this.genreOptions.querySelectorAll('.genre-option').forEach(button => {
            button.addEventListener('click', () => this.handleGenreGuess(button.dataset.genre));
        });
    }

    generateYearOptions(correctYear) {
        const options = [correctYear];
        const range = 3;
        
        while (options.length < 4) {
            const year = correctYear + Math.floor(Math.random() * range * 2) - range;
            if (!options.includes(year)) {
                options.push(year);
            }
        }
        
        return this.shuffleArray(options);
    }

    handleYearGuess(selectedYear) {
        const correctYear = new Date(this.currentAlbum.releaseDate).getFullYear();
        const timeTaken = (Date.now() - this.questionStartTime) / 1000;
        const yearDifference = Math.abs(selectedYear - correctYear);
        
        const buttons = this.yearOptions.getElementsByClassName('option-button');
        for (let button of buttons) {
            button.disabled = true;
            if (parseInt(button.dataset.year) === correctYear) {
                button.classList.add('correct');
            } else if (parseInt(button.dataset.year) === selectedYear) {
                button.classList.add('incorrect');
            }
        }

        // Calculate points
        if (yearDifference === 0) {
            this.score += Math.max(1000 - (timeTaken * 50), 500);
        } else if (yearDifference <= 2) {
            this.score += Math.max(500 - (timeTaken * 25), 250);
        }

        this.currentScoreElement.textContent = Math.round(this.score);
    }

    handleGenreGuess(selectedGenre) {
        const correctGenre = this.currentAlbum.primaryGenreName;
        const timeTaken = (Date.now() - this.questionStartTime) / 1000;
        
        const buttons = this.genreOptions.getElementsByClassName('option-button');
        for (let button of buttons) {
            button.disabled = true;
            if (button.dataset.genre === correctGenre) {
                button.classList.add('correct');
            } else if (button.dataset.genre === selectedGenre) {
                button.classList.add('incorrect');
            }
        }

        if (selectedGenre === correctGenre) {
            this.score += Math.max(1000 - (timeTaken * 50), 500);
        }

        this.currentScoreElement.textContent = Math.round(this.score);

        // Wait and show next question
        setTimeout(() => {
            this.currentQuestion++;
            this.nextQuestion();
        }, 1500);
    }

    async endQuiz() {
        this.quizContainer.classList.add('hidden');
        this.finishScreen.classList.remove('hidden');

        // Animate final score
        const finalScore = Math.round(this.score);
        const duration = 2000; // 2 seconds
        const steps = 50;
        const increment = finalScore / steps;
        let currentCount = 0;

        // Trigger confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        for (let i = 0; i <= steps; i++) {
            await new Promise(resolve => setTimeout(resolve, duration / steps));
            currentCount += increment;
            this.finalScoreElement.textContent = Math.round(currentCount);
        }

        // Save score to leaderboard
        this.saveScore();
    }

    saveScore() {
        const leaderboard = JSON.parse(localStorage.getItem('albumQuizLeaderboard') || '[]');
        leaderboard.push({
            username: this.username,
            score: Math.round(this.score),
            date: new Date().toISOString()
        });

        leaderboard.sort((a, b) => b.score - a.score);
        localStorage.setItem('albumQuizLeaderboard', JSON.stringify(leaderboard.slice(0, 10)));
    }

    showLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('albumQuizLeaderboard') || '[]');
        const leaderboardEntries = document.getElementById('leaderboard-entries');
        
        leaderboardEntries.innerHTML = leaderboard.map((entry, index) => `
            <div class="leaderboard-entry">
                <span class="rank">#${index + 1}</span>
                <span>${entry.username}</span>
                <span>${Math.round(entry.score)}</span>
            </div>
        `).join('');

        this.finishScreen.classList.add('hidden');
        this.leaderboardScreen.classList.remove('hidden');
    }

    resetQuiz() {
        this.currentQuestion = 0;
        this.score = 0;
        this.leaderboardScreen.classList.add('hidden');
        this.welcomeScreen.classList.remove('hidden');
        this.usernameInput.value = '';
        this.startButton.disabled = true;
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AlbumQuiz();
});
