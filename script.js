// Configuration initiale
let counters = {
    cafes: 0,
    cigarettes: 0,
    bieres: 0,
    junkfood: 0,
    cocazero: 0,
    painblanc: 0,
    totalPoints: 0
};

let history = [];
let chartInstance = null;  // Variable pour stocker l'instance du graphique

// Initialisation de l'interface utilisateur
function initUI() {
    const items = ['cafes', 'cigarettes', 'bieres', 'junkfood', 'cocazero', 'painblanc'];
    const itemNames = ['☕ Cafés', '🚬 Cigarettes', '🍺 Bières', '🍔 Junk Food', '🥤 Coca Zéro', '🍞 Pain Blanc'];
    const trackersDiv = document.getElementById('trackers');

    items.forEach((item, index) => {
        const trackerDiv = document.createElement('div');
        trackerDiv.className = 'tracker d-flex align-items-center mb-3';

        const label = document.createElement('span');
        label.className = 'me-2';  // Ajout de marge pour l'espacement
        label.textContent = itemNames[index];
        trackerDiv.appendChild(label);

        const minusButton = document.createElement('button');
        minusButton.className = 'btn btn-outline-danger me-2';
        minusButton.textContent = '-';
        minusButton.onclick = () => decrement(item);
        trackerDiv.appendChild(minusButton);

        const countSpan = document.createElement('span');
        countSpan.id = item + 'Count';
        countSpan.className = 'me-2 fw-bold';  // Ajout de marge et texte en gras
        countSpan.textContent = counters[item];
        trackerDiv.appendChild(countSpan);

        const plusButton = document.createElement('button');
        plusButton.className = 'btn btn-outline-success';
        plusButton.textContent = '+';
        plusButton.onclick = () => increment(item);
        trackerDiv.appendChild(plusButton);

        trackersDiv.appendChild(trackerDiv);
    });

    document.getElementById('currentDate').textContent = `Date: ${new Date().toLocaleDateString()}`;
}

// Sauvegarder les compteurs dans Firebase
function saveToFirebase() {
    firebase.database().ref('counters').set(counters)
        .then(() => {
            console.log('Counters saved to Firebase:', counters);
        })
        .catch(error => {
            console.error('Error saving counters:', error);
        });
}

// Sauvegarder l'historique dans Firebase
function saveHistoryToFirebase() {
    const today = new Date().toDateString(); // Récupère la date actuelle
    let historyItem = history.find(item => new Date(item.date).toDateString() === today);

    if (historyItem) {
        // Si un historique pour la date actuelle existe, mettez à jour les compteurs
        historyItem.cafes += counters.cafes;
        historyItem.cigarettes += counters.cigarettes;
        historyItem.bieres += counters.bieres;
        historyItem.junkfood += counters.junkfood;
        historyItem.cocazero += counters.cocazero;
        historyItem.painblanc += counters.painblanc;
        historyItem.totalPoints = calculateTotalPoints(historyItem);
    } else {
        // Sinon, créez une nouvelle entrée
        historyItem = {
            date: today,
            cafes: counters.cafes,
            cigarettes: counters.cigarettes,
            bieres: counters.bieres,
            junkfood: counters.junkfood,
            cocazero: counters.cocazero,
            painblanc: counters.painblanc,
            totalPoints: counters.totalPoints
        };
        history.push(historyItem);
    }

    // Sauvegarder l'historique mis à jour dans Firebase
    firebase.database().ref('history').set(history)
        .then(() => {
            console.log('Latest history saved to Firebase:', historyItem);
        })
        .catch(error => {
            console.error('Error saving history:', error);
        });
}

// Charger les compteurs depuis Firebase
function loadFromFirebase() {
    const countersRef = firebase.database().ref('counters');
    countersRef.once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (data) {
                counters = data;
                console.log('Counters loaded from Firebase:', counters);
                updateUI();
            } else {
                console.log('No counters data found in Firebase.');
            }
        })
        .catch(error => {
            console.error('Error loading counters:', error);
        });
}

// Charger l'historique depuis Firebase
function loadHistoryFromFirebase() {
    const historyRef = firebase.database().ref('history');
    historyRef.once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (data) {
                history = Object.values(data);
                console.log('History loaded from Firebase:', history);
                displayHistory();  // Affiche uniquement les données uniques
                generateWeeklyReport(); // Par défaut, afficher le rapport hebdomadaire
                calculateTrends(); // Calculer les tendances après le chargement de l'historique
            } else {
                console.log('No history data found in Firebase.');
            }
        })
        .catch(error => {
            console.error('Error loading history:', error);
        });
}

// Mettre à jour l'interface utilisateur en fonction des compteurs actuels
function updateUI() {
    Object.keys(counters).forEach(item => {
        if (item !== 'totalPoints') {
            document.getElementById(item + 'Count').textContent = counters[item];
        }
    });
    document.getElementById('totalPoints').textContent = 'Total Points: ' + counters.totalPoints;
}

// Incrémenter le compteur pour un élément spécifique
function increment(item) {
    counters[item]++;
    calculatePoints();
    saveToFirebase();
    updateUI();
}

// Décrémenter le compteur pour un élément spécifique
function decrement(item) {
    if (counters[item] > 0) {
        counters[item]--;
        calculatePoints();
        saveToFirebase();
        updateUI();
    }
}

// Calculer les points totaux en fonction des compteurs actuels
function calculatePoints() {
    counters.totalPoints = (counters.cafes * 2) + 
                           (counters.cigarettes * 1) + 
                           (counters.bieres * 10) + 
                           (counters.junkfood * 20) + 
                           (counters.cocazero * 5) + 
                           (counters.painblanc * 3);
}

// Calculer les points totaux pour un item d'historique spécifique
function calculateTotalPoints(item) {
    return (item.cafes * 2) + 
           (item.cigarettes * 1) + 
           (item.bieres * 10) + 
           (item.junkfood * 20) + 
           (item.cocazero * 5) + 
           (item.painblanc * 3);
}

// Calculer les tendances (augmentation, diminution ou stable) en fonction de l'historique
function calculateTrends() {
    if (history.length < 2) {
        document.getElementById('yesterdayTrend').textContent = "Not enough data";
        document.getElementById('weekTrend').textContent = "Not enough data";
        return;
    }

    const yesterday = history[history.length - 2];
    const today = history[history.length - 1];

    const yesterdayTrend = today.totalPoints > yesterday.totalPoints ? "En hausse" :
                           today.totalPoints < yesterday.totalPoints ? "En baisse" : "Stable";

    document.getElementById('yesterdayTrend').textContent = yesterdayTrend;

    if (history.length < 8) {
        document.getElementById('weekTrend').textContent = "Not enough data";
    } else {
        const lastWeek = history[history.length - 8];
        const weekTrend = today.totalPoints > lastWeek.totalPoints ? "En hausse" :
                          today.totalPoints < lastWeek.totalPoints ? "En baisse" : "Stable";

        document.getElementById('weekTrend').textContent = weekTrend;
    }
}

// Générer un rapport hebdomadaire avec Chart.js
function generateWeeklyReport() {
    const last7Days = history.slice(-7);
    const labels = last7Days.map(item => item.date);
    const dataPoints = last7Days.map(item => item.totalPoints);

    const ctx = document.getElementById('reportChart').getContext('2d');

    // Vérifiez si un graphique existe déjà, et s'il existe, détruisez-le
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Créez un nouveau graphique et stockez l'instance dans la variable chartInstance
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Points',
                data: dataPoints,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Filtrer l'historique en fonction de la période sélectionnée (semaine, mois, trimestre, année)
function filterHistory(period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
        case 'quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
        case 'year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        default:
            startDate = new Date(0); // Prend en compte tout l'historique
            break;
    }

    const filteredHistory = history.filter(item => new Date(item.date) >= startDate);
    console.log(`Filtered history for ${period}:`, filteredHistory);

    displayHistory(filteredHistory);
    generateReport(filteredHistory);
}

// Afficher l'historique filtré
function displayHistory(filteredHistory = history) {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = ''; // Clear the history display
    let displayedDates = new Set(); // To track already displayed dates
    
    filteredHistory.slice().reverse().forEach(item => {
        const itemDate = new Date(item.date).toDateString();
        if (!displayedDates.has(itemDate)) {
            console.log('Displaying history item:', item);
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = `${itemDate}: ${item.totalPoints} points`;
            historyDiv.appendChild(historyItem);
            displayedDates.add(itemDate); // Mark this date as displayed
        }
    });
}

// Générer un rapport à l'aide de Chart.js pour l'historique filtré
function generateReport(filteredHistory = history) {
    const labels = filteredHistory.map(item => item.date);
    const dataPoints = filteredHistory.map(item => item.totalPoints);

    const ctx = document.getElementById('reportChart').getContext('2d');

    // Vérifiez si un graphique existe déjà, et s'il existe, détruisez-le
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Points',
                data: dataPoints,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Réinitialiser les compteurs à minuit et sauvegarder dans l'historique
function resetDailyCounters() {
    const now = new Date();
    const lastResetDate = localStorage.getItem('lastResetDate');

    if (lastResetDate !== now.toDateString()) {
        saveHistoryToFirebase(); // Sauvegarder l'historique avant de réinitialiser

        // Réinitialisation des compteurs
        counters = {
            cafes: 0,
            cigarettes: 0,
            bieres: 0,
            junkfood: 0,
            cocazero: 0,
            painblanc: 0,
            totalPoints: 0
        };

        saveToFirebase();
        localStorage.setItem('lastResetDate', now.toDateString());
        updateUI();
        loadHistoryFromFirebase(); // Recharger l'historique pour s'assurer qu'il est bien affiché
        displayHistory(); // Afficher l'historique mis à jour
        generateReport();
        calculateTrends();
    }
}

// Initialiser l'application
initUI();
loadFromFirebase();
loadHistoryFromFirebase();
resetDailyCounters(); // Assurez-vous que les compteurs sont réinitialisés à chaque début de journée
