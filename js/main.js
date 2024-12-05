// Chess Game Analyzer Script

let currentUsername = '';

const pgnFileInput = document.getElementById('pgn-file');
const downloadPgnBtn = document.getElementById('download-pgn-btn');
const downloadUsernameInput = document.getElementById('download-username-input');
const downloadPgnSubmitBtn = document.getElementById('download-pgn-submit-btn');
const downloadModalCloseBtn = document.getElementById('download-modal-close-btn');
const downloadPgnModal = document.getElementById('download-pgn-modal');
const loadingOverlay = document.getElementById('loading-overlay');
const metricsContainer = document.getElementById('metrics-container');
const openingsTable = document.getElementById('openings-table');
const gameDetailsModal = document.getElementById('game-details-modal');
const gameDetailsContent = document.getElementById('game-details-content');
const modalCloseBtn = document.getElementById('modal-close-btn');
const opponentLevelsContainer = document.getElementById('opponent-levels-container');
const usernameGreeting = document.getElementById('username-greeting');
const usernameDisplay = document.getElementById('username-display');

async function loadDefaultPGN() {
    try {
        loadingOverlay.style.display = 'block';

        const response = await fetch('assets/sample/lichess_SeabassEngine_2024-12-02.pgn');
        if (!response.ok) throw new Error('Failed to load default PGN');

        const fileText = await response.text();
        const username = 'SeabassEngine';

        currentUsername = username;
        usernameDisplay.innerHTML = username;
        usernameGreeting.style.display = 'block';

        const { games, eventCounts } = parsePgnContent(fileText);
        const eventSpecificResults = {};

        Object.keys(eventCounts).forEach(eventType => {
            eventSpecificResults[eventType] = {
                won: 0,
                loss: 0,
                draw: 0,
                resignations: { user: { total: 0 }, opponent: { total: 0 } },
                timeouts: { user: { total: 0 }, opponent: { total: 0 } }
            };
        });

        const { openings, results } = analyzeGames(games, username, eventSpecificResults);

        renderMetrics(results, username);
        renderOpeningsTable(openings);

        setTimeout(() => {
            renderEventChart(eventCounts, eventSpecificResults);
            renderChart(results);
        }, 100);

        createRatingProgressChart(games, username);
        createTimeControlChart(games);

    } catch (error) {
        console.error('Error loading default PGN:', error);
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', loadDefaultPGN);

function showDownloadPgnModal() {
    document.body.classList.add('modal-open');
    downloadPgnModal.style.display = 'block';
}

function hideDownloadPgnModal() {
    document.body.classList.remove('modal-open');
    downloadPgnModal.style.display = 'none';
}

downloadPgnBtn.addEventListener('click', showDownloadPgnModal);
downloadModalCloseBtn.addEventListener('click', hideDownloadPgnModal);

downloadPgnSubmitBtn.addEventListener('click', () => {
    const username = downloadUsernameInput.value.trim();
    if (!username) {
        alert('Enter a Lichess username');
        return;
    }

    const apiUrl = `https://lichess.org/api/games/user/${username}?tags=true&clocks=true&evals=true&opening=true&literate=true`;
    window.open(apiUrl, '_blank');
    hideDownloadPgnModal();
});

function parsePgnContent(pgnText) {
    const games = [];
    const eventCounts = {};
    const pgnGames = pgnText.split('\n\n[Event');

    pgnGames.forEach((gameText, index) => {
        if (index > 0) gameText = '[Event' + gameText;

        const headers = {};
        const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
        let headerMatch;

        while ((headerMatch = headerRegex.exec(gameText)) !== null) {
            headers[headerMatch[1]] = headerMatch[2];
        }

        const movesStartIndex = gameText.lastIndexOf(']') + 1;
        headers.Moves = gameText.substring(movesStartIndex).trim();

        if (Object.keys(headers).length > 0) {
            games.push({
                headers: headers,
                ...headers
            });

            const event = headers.Event || 'Unknown Event';
            eventCounts[event] = (eventCounts[event] || 0) + 1;
        }
    });

    return { games, eventCounts };
}

function parseUsernameFromFilename(filename) {
    const match = filename.match(/lichess_(.+?)_\d{4}-\d{2}-\d{2}\.pgn/);
    return match ? match[1] : null;
}

function analyzeGames(games, username, eventSpecificResults = {}) {
    const openings = {};
    const results = {
        total_games: games.length,
        won: 0,
        loss: 0,
        draw: 0,
        first_game_date: null,
        last_game_date: null,
        white: { won: 0, loss: 0, draw: 0, total: 0 },
        black: { won: 0, loss: 0, draw: 0, total: 0 },
        playing_duration: 0,
        resignations: {
            user: { total: 0, white: 0, black: 0 },
            opponent: { total: 0, white: 0, black: 0 }
        },
        timeouts: {
            user: { total: 0, white: 0, black: 0 },
            opponent: { total: 0, white: 0, black: 0 }
        },
        opponentLevels: {
            "Beginner (Under 1000)": { total: 0, won: 0, loss: 0, draw: 0, userResigned: 0, opponentResigned: 0, userTimeout: 0, opponentTimeout: 0 },
            "Novice (1000-1200)": { total: 0, won: 0, loss: 0, draw: 0, userResigned: 0, opponentResigned: 0, userTimeout: 0, opponentTimeout: 0 },
            "Intermediate (1200-1400)": { total: 0, won: 0, loss: 0, draw: 0, userResigned: 0, opponentResigned: 0, userTimeout: 0, opponentTimeout: 0 },
            "Advanced (1400-1600)": { total: 0, won: 0, loss: 0, draw: 0, userResigned: 0, opponentResigned: 0, userTimeout: 0, opponentTimeout: 0 },
            "Club Player (1600-1800)": { total: 0, won: 0, loss: 0, draw: 0, userResigned: 0, opponentResigned: 0, userTimeout: 0, opponentTimeout: 0 },
            "Expert (1800-2000)": { total: 0, won: 0, loss: 0, draw: 0, userResigned: 0, opponentResigned: 0, userTimeout: 0, opponentTimeout: 0 },
            "Candidate Master (2000-2200)": { total: 0, won: 0, loss: 0, draw: 0, userResigned: 0, opponentResigned: 0, userTimeout: 0, opponentTimeout: 0 },
            "FIDE Master (2200-2400)": { total: 0, won: 0, loss: 0, draw: 0, userResigned: 0, opponentResigned: 0, userTimeout: 0, opponentTimeout: 0 },
            "International Master (2400-2500)": { total: 0, won: 0, loss: 0, draw: 0, userResigned: 0, opponentResigned: 0, userTimeout: 0, opponentTimeout: 0 },
            "Grandmaster (2500+)": { total: 0, won: 0, loss: 0, draw: 0, userResigned: 0, opponentResigned: 0, userTimeout: 0, opponentTimeout: 0 }
        }
    };

    let firstGameDate = null;
    let lastGameDate = null;

    games.forEach(game => {
        const isUserWhite = game.White === username;
        const isUserBlack = game.Black === username;
        const result = game.Result;
        const moves = game.Moves || '';
        const date = new Date(game.Date);
        const event = game.Event;
        const opening = game.Opening || 'Unknown Opening';

        if (!firstGameDate || date < firstGameDate) firstGameDate = date;
        if (!lastGameDate || date > lastGameDate) lastGameDate = date;

        const opponentElo = isUserWhite ? parseInt(game.BlackElo) : parseInt(game.WhiteElo);
        const opponentLevel = determineOpponentLevel(opponentElo);

        let userResigned = false;
        let opponentResigned = false;
        let userTimeout = false;
        let opponentTimeout = false;

        if (isUserWhite) {
            results.white.total++;
            if (moves.includes('White resigns')) userResigned = true;
            if (moves.includes('Black resigns')) opponentResigned = true;
            if (moves.includes('Black wins on time')) userTimeout = true;
            if (moves.includes('White wins on time')) opponentTimeout = true;
        } else if (isUserBlack) {
            results.black.total++;
            if (moves.includes('Black resigns')) userResigned = true;
            if (moves.includes('White resigns')) opponentResigned = true;
            if (moves.includes('White wins on time')) userTimeout = true;
            if (moves.includes('Black wins on time')) opponentTimeout = true;
        }

        const isUserWin = (isUserWhite && result === '1-0') || (isUserBlack && result === '0-1');
        const isUserLoss = (isUserWhite && result === '0-1') || (isUserBlack && result === '1-0');
        const isUserDraw = result === '1/2-1/2';

        if (isUserWin) {
            results.won++;
            if (isUserWhite) results.white.won++;
            if (isUserBlack) results.black.won++;
        }
        if (isUserLoss) {
            results.loss++;
            if (isUserWhite) results.white.loss++;
            if (isUserBlack) results.black.loss++;
        }
        if (isUserDraw) {
            results.draw++;
            if (isUserWhite) results.white.draw++;
            if (isUserBlack) results.black.draw++;
        }

        if (userResigned) {
            results.resignations.user.total++;
            if (isUserWhite) results.resignations.user.white++;
            if (isUserBlack) results.resignations.user.black++;
        }
        if (opponentResigned) {
            results.resignations.opponent.total++;
            if (isUserWhite) results.resignations.opponent.white++;
            if (isUserBlack) results.resignations.opponent.black++;
        }
        if (userTimeout) {
            results.timeouts.user.total++;
            if (isUserWhite) results.timeouts.user.white++;
            if (isUserBlack) results.timeouts.user.black++;
        }
        if (opponentTimeout) {
            results.timeouts.opponent.total++;
            if (isUserWhite) results.timeouts.opponent.white++;
            if (isUserBlack) results.timeouts.opponent.black++;
        }

        const levelStats = results.opponentLevels[opponentLevel];
        if (levelStats) {
            levelStats.total++;
            if (isUserWin) levelStats.won++;
            if (isUserLoss) levelStats.loss++;
            if (isUserDraw) levelStats.draw++;
            if (userResigned) levelStats.userResigned++;
            if (opponentResigned) levelStats.opponentResigned++;
            if (userTimeout) levelStats.userTimeout++;
            if (opponentTimeout) levelStats.opponentTimeout++;
        }

        if (event && eventSpecificResults[event]) {
            const eventStats = eventSpecificResults[event];

            if (isUserWin) eventStats.won++;
            if (isUserLoss) eventStats.loss++;
            if (isUserDraw) eventStats.draw++;

            if (userResigned) eventStats.resignations.user.total++;
            if (opponentResigned) eventStats.resignations.opponent.total++;
            if (userTimeout) eventStats.timeouts.user.total++;
            if (opponentTimeout) eventStats.timeouts.opponent.total++;
        }

        // Track openings
        if (!openings[opening]) {
            openings[opening] = {
                total: 0,
                won: 0,
                loss: 0,
                draw: 0,
                games: []
            };
        }

        openings[opening].total++;
        openings[opening].games.push({
            date: game.Date,
            event: game.Event,
            userResult: isUserWhite ?
                (result === '1-0' ? 'Win' : result === '0-1' ? 'Loss' : 'Draw') :
                (result === '0-1' ? 'Win' : result === '1-0' ? 'Loss' : 'Draw'),
            termination: game.Termination,
            playedAs: isUserWhite ? 'White' : 'Black',
            opponentElo: isUserWhite ? game.BlackElo : game.WhiteElo,
            site: game.Site
        });

        if ((isUserWhite && result === '1-0') || (isUserBlack && result === '0-1')) {
            openings[opening].won++;
        } else if ((isUserWhite && result === '0-1') || (isUserBlack && result === '1-0')) {
            openings[opening].loss++;
        } else if (result === '1/2-1/2') {
            openings[opening].draw++;
        }
    });

    results.first_game_date = firstGameDate;
    results.last_game_date = lastGameDate;

    if (firstGameDate && lastGameDate) {
        const timeDiff = lastGameDate - firstGameDate;
        results.playing_duration = timeDiff / (1000 * 60 * 60 * 24 * 365.25);
    }

    return { openings, results };
}

function determineOpponentLevel(elo) {
    if (!elo) return "Unknown";
    if (elo < 1000) return "Beginner (Under 1000)";
    if (elo < 1200) return "Novice (1000-1200)";
    if (elo < 1400) return "Intermediate (1200-1400)";
    if (elo < 1600) return "Advanced (1400-1600)";
    if (elo < 1800) return "Club Player (1600-1800)";
    if (elo < 2000) return "Expert (1800-2000)";
    if (elo < 2200) return "Candidate Master (2000-2200)";
    if (elo < 2400) return "FIDE Master (2200-2400)";
    if (elo < 2500) return "International Master (2400-2500)";
    return "Grandmaster (2500+)";
}


function logTimeoutGames(results) {
    console.log("User Timeout Games:");
    results.timeouts.user.games.forEach(game => {
        console.log(`Date: ${game.Date}, Event: ${game.Event}, Result: ${game.Result}, Termination: ${game.Termination}`);
    });

    console.log("Opponent Timeout Games:");
    results.timeouts.opponent.games.forEach(game => {
        console.log(`Date: ${game.Date}, Event: ${game.Event}, Result: ${game.Result}, Termination: ${game.Termination}`);
    });
}

pgnFileInput.addEventListener('change', async () => {
    const file = pgnFileInput.files[0];
    if (!file) {
        alert('Select a PGN file');
        return;
    }

    try {
        loadingOverlay.style.display = 'block'; // Show loading overlay if you have one

        const fileText = await file.text();
        const username = parseUsernameFromFilename(file.name);
        if (!username) {
            alert('Invalid filename format. Use lichess_username_YYYY-MM-DD.pgn');
            return;
        }

        console.log('Debug: Starting username setup');

        // Get the elements
        const usernameDisplay = document.getElementById('username-display');
        const usernameGreeting = document.getElementById('username-greeting');

        // Check if elements exist
        if (!usernameDisplay || !usernameGreeting) {
            console.error('Debug: Username elements not found', {
                usernameDisplay: !!usernameDisplay,
                usernameGreeting: !!usernameGreeting
            });
            return;
        }

        // Set the username
        currentUsername = username;
        usernameDisplay.innerHTML = username; // Try innerHTML instead of textContent
        console.log('Debug: Username set to', username);

        // Make greeting visible
        usernameGreeting.style.display = 'block';
        console.log('Debug: Greeting display set to block');

        // Force a reflow
        usernameGreeting.offsetHeight;

        const { games, eventCounts } = parsePgnContent(fileText);

        // Ensure eventCounts exists
        if (!eventCounts || Object.keys(eventCounts).length === 0) {
            throw new Error('No valid events found in PGN file');
        }

        // Initialize eventSpecificResults
        const eventSpecificResults = {};
        Object.keys(eventCounts).forEach(eventType => {
            eventSpecificResults[eventType] = {
                won: 0,
                loss: 0,
                draw: 0,
                resignations: {
                    user: { total: 0 },
                    opponent: { total: 0 }
                },
                timeouts: {
                    user: { total: 0 },
                    opponent: { total: 0 }
                }
            };
        });

        const { openings, results } = analyzeGames(games, username, eventSpecificResults);

        // Render in sequence
        renderMetrics(results, username);
        renderOpeningsTable(openings);

        // Ensure the chart container is ready before rendering
        setTimeout(() => {
            renderEventChart(eventCounts, eventSpecificResults);
            renderChart(results);
        }, 100);

        createRatingProgressChart(games, username);
        createTimeControlChart(games);

        const dateRangeElement = document.querySelector('[data-playing-duration-range]');
        if (dateRangeElement) {
            const firstDate = new Date(results.first_game_date).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });
            const lastDate = new Date(results.last_game_date).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });

            dateRangeElement.textContent = `Based on the games from ${firstDate} to ${lastDate}`;
        }

    } catch (error) {
        console.error('Error analyzing PGN:', error);
        alert('Error analyzing PGN file. Please ensure the file is in correct PGN format.');
    } finally {
        loadingOverlay.style.display = 'none'; // Hide loading overlay if you have one
    }
});

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatNumberWithCommas(number) {
    if (number === undefined || number === null) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function renderMetrics(results, username) {
    const elements = [
        '[data-total-games]',
        '[data-won]',
        '[data-loss]',
        '[data-draw]',
        '[data-playing-duration]',
        '[data-playing-duration-range]',
        '[data-white-total]',
        '[data-white-won]',
        '[data-white-loss]',
        '[data-white-draw]',
        '[data-white-user-resigned]',
        '[data-white-opponent-resigned]',
        '[data-black-total]',
        '[data-black-won]',
        '[data-black-loss]',
        '[data-black-draw]',
        '[data-black-user-resigned]',
        '[data-black-opponent-resigned]',
        '[data-user-resigned]',
        '[data-opponent-resigned]',
        '[data-user-timeout]',
        '[data-opponent-timeout]'
    ];

    const values = [
        results.total_games,
        results.won,
        results.loss,
        results.draw,
        `${results.playing_duration.toFixed(1)} Years`,
        `From ${formatDate(results.first_game_date)} to ${formatDate(results.last_game_date)}`,
        results.white.won + results.white.loss + results.white.draw,
        results.white.won,
        results.white.loss,
        results.white.draw,
        results.resignations.user.white || 0,
        results.resignations.opponent.white || 0,
        results.black.won + results.black.loss + results.black.draw,
        results.black.won,
        results.black.loss,
        results.black.draw,
        results.resignations.user.black || 0,
        results.resignations.opponent.black || 0,
        results.resignations.user.total,
        results.resignations.opponent.total,
        results.timeouts.user.total,
        results.timeouts.opponent.total
    ];

    elements.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = formatNumberWithCommas(values[index]);
        }
    });

    const resignedPercentage = (results.resignations.user.total / results.total_games * 100).toFixed(1);
    const timeoutPercentage = (results.timeouts.user.total / results.total_games * 100).toFixed(1);

    // Show the username greeting container
    const greetingContainer = document.getElementById('username-greeting');
    greetingContainer.style.display = 'block';

    // Format the dates
    const firstDate = new Date(results.first_game_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const lastDate = new Date(results.last_game_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    // Update the greeting text
    usernameGreeting.innerHTML = `
        <p class="subtitle">
            Hello, you've selected the user <span id="username-display">${username}</span>, who has been playing chess on Lichess for
            <span data-playing-duration>${results.playing_duration.toFixed(1)} years</span>, with
            <span data-total-games>${formatNumberWithCommas(results.total_games)}</span> games played,
            <span data-user-resigned>${formatNumberWithCommas(results.resignations.user.total)}</span> resignations (${resignedPercentage}%), and
            <span data-user-timeout>${formatNumberWithCommas(results.timeouts.user.total)}</span> losses due to timeouts (${timeoutPercentage}%).
        </p>
        <small data-playing-duration-range>Based on the games from ${firstDate} to ${lastDate}</small>
    `;

    renderOpponentLevelsChart(results.opponentLevels);
    renderChart(results);
}

function renderOpeningsTable(openings) {
    const tbody = document.querySelector('#openings-table tbody');
    tbody.innerHTML = '';

    const sortedOpenings = Object.entries(openings)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([opening, stats], index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td class="opening-name opening-cell">${opening}</td>
                <td>${stats.won}</td>
                <td>${stats.loss}</td>
                <td>${stats.draw}</td>
                <td>${stats.total}</td>
            `;
            row.addEventListener('click', () => showGameDetails(opening, stats.games));
            return row;
        });

    sortedOpenings.forEach(row => tbody.appendChild(row));
}

function showGameDetails(openingName, games) {
    const openingUrl = "https://lichess.org/opening/" + openingName.replace(/ /g, "_");

    // Update header content
    document.getElementById('game-details-header').innerHTML = `
        <h5>${openingName}</h5>
        <p class="explore-button">
            <i class="ph-duotone ph-info"></i>
            <a href="${openingUrl}" target="_blank" rel="noopener noreferrer">
                Explore opening on Lichess
            </a>
        </p>
    `;

    const whiteMetrics = {
        total: games.filter(game => game.playedAs === 'White').length,
        won: games.filter(game => game.playedAs === 'White' && game.userResult === 'Win').length,
        loss: games.filter(game => game.playedAs === 'White' && game.userResult === 'Loss').length,
        draw: games.filter(game => game.playedAs === 'White' && game.userResult === 'Draw').length
    };
    const blackMetrics = {
        total: games.filter(game => game.playedAs === 'Black').length,
        won: games.filter(game => game.playedAs === 'Black' && game.userResult === 'Win').length,
        loss: games.filter(game => game.playedAs === 'Black' && game.userResult === 'Loss').length,
        draw: games.filter(game => game.playedAs === 'Black' && game.userResult === 'Draw').length
    };

    games.sort((a, b) => b.opponentElo - a.opponentElo);

    document.getElementById('game-details-content').innerHTML = `
        <div class="opening-card">
            <div class="metric-card">
                <div class="clubbing">
                    <img class="icon" src="assets/white-king-3.svg" aria-label="white king piece">
                    <h5 class="section-heading">Played as White</h5>
                </div>
                <div class="group-club">
                    <div class="parent-club">
                        <h6>Total</h6>
                        <span class="value">${formatNumberWithCommas(whiteMetrics.total)}</span>
                    </div>
                    <div class="parent-club">
                        <h6>Wins</h6>
                        <span class="value">${formatNumberWithCommas(whiteMetrics.won)}</span>
                    </div>
                    <div class="parent-club">
                        <h6>Losses</h6>
                        <span class="value">${formatNumberWithCommas(whiteMetrics.loss)}</span>
                    </div>
                    <div class="parent-club">
                        <h6>Draws</h6>
                        <span class="value">${formatNumberWithCommas(whiteMetrics.draw)}</span>
                    </div>
                </div>
            </div>
            <div class="metric-card">
                <div class="clubbing">
                    <img class="icon" src="assets/black-king-3.svg" aria-label="black king piece">
                    <h5 class="section-heading">Played as Black</h5>
                </div>
                <div class="group-club">
                    <div class="parent-club">
                        <h6>Total</h6>
                        <span class="value">${formatNumberWithCommas(blackMetrics.total)}</span>
                    </div>
                    <div class="parent-club">
                        <h6>Wins</h6>
                        <span class="value">${formatNumberWithCommas(blackMetrics.won)}</span>
                    </div>
                    <div class="parent-club">
                        <h6>Losses</h6>
                        <span class="value">${formatNumberWithCommas(blackMetrics.loss)}</span>
                    </div>
                    <div class="parent-club">
                        <h6>Draws</h6>
                        <span class="value">${formatNumberWithCommas(blackMetrics.draw)}</span>
                    </div>
                </div>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Result</th>
                    <th>Termination</th>
                    <th>Played as</th>
                    <th>Opp. ELO</th>
                    <th>Links</th>
                </tr>
            </thead>
            <tbody>
                ${games.map((game, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${formatDate(game.date)}</td>
                        <td>${game.event}</td>
                        <td>${game.userResult}</td>
                        <td>${game.termination}</td>
                        <td>${game.playedAs}</td>
                        <td>${game.opponentElo}</td>
                        <td><a href="${game.site}" target="_blank">Game</a> | <a href="https://lichess1.org/game/export/gif/white/${game.site.split('/').pop()}.gif?theme=canvas&piece=tatiana" target="_blank">Gif</a></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.body.classList.add('modal-open');
    gameDetailsModal.style.display = 'block';
}

modalCloseBtn.addEventListener('click', () => {
    document.body.classList.remove('modal-open');
    gameDetailsModal.style.display = 'none';
});

