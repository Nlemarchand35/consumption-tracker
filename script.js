// Le code Firebase est déjà initialisé dans `index.html`, donc pas besoin de ré-importer ici.

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

// Initialize the UI with Bootstrap components
function initUI() {
    const items = ['cafes', 'cigarettes', 'bieres', 'junkfood', 'cocazero', 'painblanc'];
    const itemNames = ['Cafés', 'Cigarettes', 'Bières', 'Junk Food', 'Coca Zéro', 'Pain Blanc'];
    const trackersDiv = document.getElementById('trackers');

    items.forEach((item, index) => {
        const trackerDiv = document.createElement('div');
        trackerDiv.className = 'tracker';

        const label = document.createElement('span');
        label.textContent = itemNames[index] + ':';
        trackerDiv.appendChild(label);

        const minusButton = document.createElement('button');
        minusButton.className = 'btn btn-outline-danger';
        minusButton.textContent = '-';
        minusButton.onclick = () => decrement(item);
        trackerDiv.appendChild(minusButton);

        const countSpan = document.createElement('span');
        countSpan.id = item + 'Count';
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

// Save the counters to Firebase
function saveToFirebase() {
    firebase.database().ref('counters').set(counters);
    console.log('Counters saved to Firebase:', counters);
}

// Save the history to Firebase
function saveHistoryToFirebase() {
    const latestHistory = history[history.length - 1];
    firebase.database().ref('history').push(latestHistory);
    console.log('Latest history item saved to Firebase:', latestHistory);
}

// Load counters from Firebase
function loadFromFirebase() {
    const countersRef = firebase.database().ref('counters');
    countersRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            counters = data;
            console.log('Counters loaded from Firebase:', counters);
            updateUI();
        } else {
            console.log('No counters data found in Firebase.');
        }
    });
}

// Load history from Firebase
function loadHistoryFromFirebase() {
    const historyRef = firebase.database().ref('history');
    historyRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            history = Object.values(data);
            console.log('History loaded from Firebase:', history);
            displayHistory();
            generateWeeklyReport(); // Générer un rapport hebdomadaire
            calculateTrends(); // Calculate trends after loading history
        } else {
            console.log('No history data found in Firebase.');
        }
    });
}

// Update the UI based on the current counters
function updateUI() {
    Object.keys(counters).forEach(item => {
        if (item !== 'totalPoints') {
            document.getElementById(item + 'Count').textContent = counters[item];
        }
    });
    document.getElementById('totalPoints').textContent = 'Total Points: ' + counters.totalPoints;
}

// Increment the counter for a specific item
function increment(item) {
    counters[item]++;
    calculatePoints();
    saveToFirebase();
    updateUI();
}

// Decrement the counter for a specific item
function decrement(item) {
    if (counters[item] > 0) {
        counters[item]--;
        calculatePoints();
        saveToFirebase();
        updateUI();
    }
}

// Calculate the total points based on current counters
function calculatePoints() {
    counters.totalPoints = (counters.cafes * 2) + 
                           (counters.cigarettes * 1) + 
                           (counters.bieres * 10) + 
                           (counters.junkfood * 20) + 
                           (counters.cocazero * 5) + 
                           (counters.painblanc * 3);
}

// Calculate trends (increase, decrease, or stable) based on the history
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

// Generate a weekly report using Chart.js
function generateWeeklyReport() {
    const last7Days = history.slice(-7);
    const labels = last7Days.map(item => item.date);
    const dataPoints = last7Days.map(item => item.totalPoints);

    const ctx = document.getElementById('reportChart').getContext('2d');
    new Chart(ctx, {
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

// Filter history based on the selected period (week, month, quarter, year)
function filterHistory(period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
    }

    const filteredHistory = history.filter(item => new Date(item.date) >= startDate);
    console.log(`Filtered history for ${period}:`, filteredHistory);

    displayHistory(filteredHistory);
    generateReport(filteredHistory);
}

// Display the filtered history
function displayHistory(filteredHistory = history) {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = ''; // Clear the history display
    filteredHistory.slice().reverse().forEach(item => {
        console.log('Displaying history item:', item);
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = `${item.date}: ${item.totalPoints} points`;
        historyDiv.appendChild(historyItem);
    });
}

// Generate a report using Chart.js for the filtered history
function generateReport(filteredHistory = history) {
    const labels = filteredHistory.map(item => item.date);
    const dataPoints = filteredHistory.map(item => item.totalPoints);

    const ctx = document.getElementById('reportChart').getContext('2d');
    new Chart(ctx, {
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

// Simulate data for August 16 and 17, 2024
function simulatePreviousDayData() {
    const dataFor16th = {
        date: '2024-08-16',
        cafes: Math.floor(Math.random() * 5) + 1,
        cigarettes: Math.floor(Math.random() * 10) + 1,
        bieres: Math.floor(Math.random() * 3) + 1,
        junkfood: Math.floor(Math.random() * 2),
        cocazero: Math.floor(Math.random() * 3),
        painblanc: Math.floor(Math.random() * 4),
        totalPoints: 0 // Will be calculated
    };
    dataFor16th.totalPoints = (dataFor16th.cafes * 2) + 
                              (dataFor16th.cigarettes * 1) + 
                              (dataFor16th.bieres * 10) + 
                              (dataFor16th.junkfood * 20) + 
                              (dataFor16th.cocazero * 5) + 
                              (dataFor16th.painblanc * 3);

    const dataFor17th = {
        date: '2024-08-17',
        cafes: Math.floor(Math.random() * 5) + 1,
        cigarettes: Math.floor(Math.random() * 10) + 1,
        bieres: Math.floor(Math.random() * 3) + 1,
        junkfood: Math.floor(Math.random() * 2),
        cocazero: Math.floor(Math.random() * 3),
        painblanc: Math.floor(Math.random() * 4),
        totalPoints: 0 // Will be calculated
    };
    dataFor17th.totalPoints = (dataFor17th.cafes * 2) + 
                              (dataFor17th.cigarettes * 1) + 
                              (dataFor17th.bieres * 10) + 
                              (dataFor17th.junkfood * 20) + 
                              (dataFor17th.cocazero * 5) + 
                              (dataFor17th.painblanc * 3);

    history.push(dataFor16th);
    history.push(dataFor17th);
    console.log('Simulated history items for 2024-08-16 and 2024-08-17:', dataFor16th, dataFor17th);
    saveHistoryToFirebase();
    saveHistoryToFirebase(); // Save both entries
}

// Reset the counters at midnight and save to history
function resetDailyCounters() {
    const now = new Date();
    const lastResetDate = localStorage.getItem('lastResetDate');

    if (lastResetDate !== now.toDateString()) {
        const historyItem = {
            date: now.toDateString(),
            ...counters
        };
        
        history.push(historyItem);
        console.log('Saving history item to Firebase:', historyItem);
        saveHistoryToFirebase();
        localStorage.setItem('lastResetDate', now.toDateString());

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
        updateUI();
        displayHistory();
        generateReport();
        calculateTrends();
    }
}

// Initialize the app
initUI();
loadFromFirebase();
loadHistoryFromFirebase();
simulatePreviousDayData();  // Simulate data for August 16 and 17, 2024
resetDailyCounters();
