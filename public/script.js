document.addEventListener("DOMContentLoaded", () => {
    // --- STATE MANAGEMENT ---
    let transactions = [];
    let goalAmount = 0;
    let currentUser = null;
    let expenseChart, trendChart, dashLineChart;

    // --- DOM ELEMENT SELECTORS ---
    const modals = {
        login: document.getElementById("login-modal"),
        signup: document.getElementById("signup-modal"),
        editProfile: document.getElementById("edit-profile-modal"),
    };
    const sidebar = document.querySelector(".sidebar");
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const messagePopup = document.getElementById('message-popup');

    // --- DATA & USER MANAGEMENT ---
    const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];
    const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));
    const getLoggedInUser = () => JSON.parse(localStorage.getItem('loggedInUser'));
    const setLoggedInUser = (user) => localStorage.setItem('loggedInUser', JSON.stringify(user));
    const removeLoggedInUser = () => localStorage.removeItem('loggedInUser');

    const loadUserData = () => {
        currentUser = getLoggedInUser();
        if (currentUser) {
            transactions = JSON.parse(localStorage.getItem(`${currentUser.email}_transactions`)) || [];
            goalAmount = parseFloat(localStorage.getItem(`${currentUser.email}_goal`)) || 0;
        } else {
            transactions = [];
            goalAmount = 0;
        }
    };
    const saveUserData = () => {
        if (currentUser) {
            localStorage.setItem(`${currentUser.email}_transactions`, JSON.stringify(transactions));
            localStorage.setItem(`${currentUser.email}_goal`, goalAmount);
        }
    };

    // --- UI UPDATE FUNCTIONS ---
    const updateUIForLoginState = () => {
        if (currentUser) {
            document.body.classList.remove('logged-out');
            document.body.classList.add('logged-in');
            document.getElementById('header-avatar').src = currentUser.avatar || 'https://i.pravatar.cc/40';
            updateProfilePage();
        } else {
            document.body.classList.remove('logged-in');
            document.body.classList.add('logged-out');
        }
    };

    const updateProfilePage = () => {
        if (currentUser) {
            document.getElementById('profile-page-name').textContent = currentUser.name;
            document.getElementById('profile-page-email').textContent = currentUser.email;
            document.getElementById('profile-page-phone').textContent = currentUser.phone || 'Not set';
            document.getElementById('profile-page-joined').textContent = currentUser.joinedDate || 'N/A';
            document.getElementById('profile-page-avatar').src = currentUser.avatar || 'https://i.pravatar.cc/120';
            
            const expenseTransactions = transactions.filter(t => t.type === 'expense');
            const totalExpenses = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
            const expenseCount = expenseTransactions.length;
            const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;
            const largestExpense = expenseCount > 0 ? Math.max(...expenseTransactions.map(t => t.amount)) : 0;
            
            document.getElementById('profile-page-income-count').textContent = transactions.filter(t => t.type === 'income').length;
            document.getElementById('profile-page-expense-count').textContent = expenseCount;
            document.getElementById('profile-page-avg-expense').textContent = `₹${avgExpense.toFixed(2)}`;
            document.getElementById('profile-page-largest-expense').textContent = `₹${largestExpense.toFixed(2)}`;
        }
    };
    
    const showMessage = (message) => {
        messagePopup.textContent = message;
        messagePopup.classList.add('show');
        setTimeout(() => messagePopup.classList.remove('show'), 3000);
    };

    const switchPage = (pageId) => {
        document.querySelectorAll(".page.active").forEach(p => p.classList.remove("active"));
        const newPage = document.getElementById(pageId);
        if (newPage) newPage.classList.add("active");
        
        document.querySelectorAll(".nav-link.active").forEach(l => l.classList.remove("active"));
        const activeLink = document.querySelector(`.nav-link[data-page='${pageId}']`);
        if (activeLink) activeLink.classList.add("active");
        
        sidebar.classList.remove("active");
    };

    // --- AUTHENTICATION & PROFILE HANDLERS ---
    const handleSignUp = (e) => {
        e.preventDefault();
        const users = getUsers();
        const email = document.getElementById('signup-email').value;
        if (users.find(user => user.email === email)) {
            alert("An account with this email already exists.");
            return;
        }
        users.push({ 
            name: document.getElementById('signup-name').value, 
            email: email, 
            password: document.getElementById('signup-password').value, 
            joinedDate: new Date().toLocaleDateString('en-IN'), 
            phone: '', 
            avatar: 'https://i.pravatar.cc/120' 
        });
        saveUsers(users);
        alert("Sign up successful! Please log in.");
        modals.signup.classList.add("hidden");
        document.getElementById("signup-form").reset();
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const user = getUsers().find(u => u.email === document.getElementById('login-email').value && u.password === document.getElementById('login-password').value);
        if (user) {
            setLoggedInUser(user);
            initialize();
            switchPage('dashboard');
            modals.login.classList.add("hidden");
            document.getElementById("login-form").reset();
        } else {
            alert("Invalid email or password.");
        }
    };

    const handleLogout = () => {
        removeLoggedInUser();
        initialize();
        switchPage('home');
    };
    
    const handleEditProfile = (e) => {
        e.preventDefault();
        let users = getUsers();
        let userIndex = users.findIndex(u => u.email === currentUser.email);
        
        if(userIndex !== -1) {
            users[userIndex].name = document.getElementById('edit-name').value;
            users[userIndex].phone = document.getElementById('edit-phone').value;
            users[userIndex].avatar = document.getElementById('edit-avatar').value;
            
            saveUsers(users);
            setLoggedInUser(users[userIndex]);
            
            loadUserData();
            updateUIForLoginState();
            modals.editProfile.classList.add("hidden");
        }
    };
    
    // --- CHATBOT LOGIC ---
    const getAIResponse = (userInput) => {
        userInput = userInput.toLowerCase();
        
        if (userInput.includes("budget")) {
            return "A great way to budget is the 50/30/20 rule: 50% of your income for needs (rent, bills), 30% for wants (hobbies, dining out), and 20% for savings and debt repayment. Would you like to know more about setting one up?";
        }
        if (userInput.includes("saving") || userInput.includes("save money")) {
            return "To save more effectively, consider automating your savings. You can set up automatic transfers to a high-yield savings account each payday. Also, cutting down on small, frequent expenses like daily coffee can make a big difference over time.";
        }
        if (userInput.includes("invest")) {
            return "For beginners, investing in low-cost index funds or ETFs is a popular strategy. They offer diversification and are generally less risky than individual stocks. It's always a good idea to consult a financial advisor for personalized advice.";
        }
        if (userInput.includes("debt")) {
            return "There are two popular methods for tackling debt: the 'Avalanche' method (paying off high-interest debts first) and the 'Snowball' method (paying off the smallest debts first for motivation). Which one sounds more appealing to you?";
        }
        if (userInput.includes("credit score")) {
            return "Improving your credit score involves paying bills on time, keeping your credit card balances low, and avoiding opening too many new accounts at once. A higher score can get you better loan rates.";
        }
        return "I can help with questions about budgeting, saving, investing, and managing debt. How can I assist you with your finances?";
    };

    const addMessageToChat = (text, sender) => {
        const chatbotBody = document.getElementById('chatbot-body');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}`;
        messageDiv.textContent = text;
        chatbotBody.appendChild(messageDiv);
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    };

    const handleChatbotSend = () => {
        const chatbotInput = document.getElementById('chatbot-input');
        const userInput = chatbotInput.value.trim();
        if (userInput) {
            addMessageToChat(userInput, 'user');
            chatbotInput.value = '';
            setTimeout(() => {
                const botResponse = getAIResponse(userInput);
                addMessageToChat(botResponse, 'bot');
            }, 600);
        }
    };

    // --- EVENT LISTENERS SETUP ---
    const setupEventListeners = () => {
        // Modal and Auth Buttons
        document.getElementById("login-btn").onclick = () => modals.login.classList.remove("hidden");
        document.getElementById("signup-btn").onclick = () => modals.signup.classList.remove("hidden");
        document.getElementById("home-signup-btn").onclick = () => modals.signup.classList.remove("hidden");
        document.getElementById("close-login").onclick = () => modals.login.classList.add("hidden");
        document.getElementById("close-signup").onclick = () => modals.signup.classList.add("hidden");
        document.getElementById("close-edit-profile").onclick = () => modals.editProfile.classList.add("hidden");
        document.getElementById("switchToSignup").onclick = (e) => { e.preventDefault(); modals.login.classList.add("hidden"); modals.signup.classList.remove("hidden"); };
        document.getElementById("switchToLogin").onclick = (e) => { e.preventDefault(); modals.signup.classList.add("hidden"); modals.login.classList.remove("hidden"); };

        // Forms
        document.getElementById("signup-form").addEventListener('submit', handleSignUp);
        document.getElementById("login-form").addEventListener('submit', handleLogin);
        document.getElementById("edit-profile-form").addEventListener('submit', handleEditProfile);
        document.getElementById("transaction-form").addEventListener("submit", addTransaction);

        // Navigation and Profile
        document.getElementById("profile-logout-btn").addEventListener('click', handleLogout);
        mobileMenuBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
        document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => switchPage(link.dataset.page)));
        document.getElementById('edit-profile-btn').onclick = () => {
            if (!currentUser) return;
            document.getElementById('edit-name').value = currentUser.name;
            document.getElementById('edit-phone').value = currentUser.phone || '';
            document.getElementById('edit-avatar').value = currentUser.avatar || '';
            modals.editProfile.classList.remove("hidden");
        };

        // Theme Toggles
        const themeToggleBtn = document.getElementById("theme-toggle-btn");
        const settingsThemeToggleBtn = document.getElementById("settings-theme-toggle");
        const toggleTheme = () => {
            const isDark = document.body.classList.toggle("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");
            if (currentUser) render();
        };
        themeToggleBtn.addEventListener("click", toggleTheme);
        settingsThemeToggleBtn.addEventListener("click", toggleTheme);

        // Other Buttons
        document.querySelectorAll('.link-btn').forEach(button => {
            button.addEventListener('click', () => {
                showMessage("This feature is currently under development. Stay tuned!");
            });
        });

        // Chatbot Event Listeners
        const chatbotWindow = document.getElementById('chatbot-window');
        const chatbotToggleBtn = document.getElementById('chatbot-toggle-btn');
        const closeChatbotBtn = document.getElementById('close-chatbot-btn');
        const chatbotSendBtn = document.getElementById('chatbot-send-btn');
        const chatbotInput = document.getElementById('chatbot-input');

        chatbotToggleBtn.addEventListener('click', () => chatbotWindow.classList.toggle('active'));
        closeChatbotBtn.addEventListener('click', () => chatbotWindow.classList.remove('active'));
        chatbotSendBtn.addEventListener('click', handleChatbotSend);
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleChatbotSend();
            }
        });
    };
    
    // --- CORE APP LOGIC ---
    window.deleteTransaction = (id) => { transactions = transactions.filter(t => t.id !== id); render(); };
    window.resetData = () => { if (confirm("Are you sure? This will delete all your transaction data.")) { transactions = []; goalAmount = 0; render(); }};
    window.setGoal = () => { const val = document.getElementById("goal-amount").value; if (val) { goalAmount = +val; render(); }};

    const addTransaction = (e) => {
        e.preventDefault();
        if (!currentUser) { alert("Please log in to add transactions."); return; }
        transactions.push({ id: Date.now(), type: document.getElementById("type").value, description: document.getElementById("description").value, amount: +document.getElementById("amount").value, date: document.getElementById("date").value });
        e.target.reset();
        render();
    };

    // --- RENDER FUNCTIONS ---
    const render = () => {
        if (!currentUser) return;
        saveUserData();
        
        let totalIncome = 0, totalExpense = 0;
        const tbody = document.getElementById("transactions-list");
        tbody.innerHTML = "";
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(txn => {
            txn.type === "income" ? totalIncome += txn.amount : totalExpense += txn.amount;
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${txn.date}</td><td>${txn.description}</td><td>${txn.type}</td><td style="color:var(${txn.type === 'expense' ? '--expense-color' : '--income-color'})">${txn.type === 'expense' ? '-' : ''} ₹${txn.amount.toFixed(2)}</td><td><button onclick="deleteTransaction(${txn.id})">✖</button></td>`;
            tbody.appendChild(tr);
        });

        document.getElementById("total-income").innerText = `₹ ${totalIncome.toFixed(2)}`;
        document.getElementById("total-expense").innerText = `₹ ${totalExpense.toFixed(2)}`;
        const currentBalance = totalIncome - totalExpense;
        document.getElementById("balance").innerText = `₹ ${currentBalance.toFixed(2)}`;
        
        const percent = goalAmount > 0 ? Math.max(0, Math.min(100, (currentBalance / goalAmount) * 100)) : 0;
        document.getElementById("goal-circle").style.background = `conic-gradient(var(--primary-color) ${percent}%, var(--border-color) ${percent}%)`;
        document.getElementById("goal-percentage").innerText = `${Math.floor(percent)}%`;
        document.getElementById("goal-status").innerText = goalAmount > 0 ? `Saved ₹${currentBalance.toFixed(2)} of ₹${goalAmount.toFixed(2)}` : "No goal set.";
        
        // --- FIX STARTS HERE ---
        const suggestionList = document.getElementById("suggestion-list");
        if (suggestionList) {
            const suggestions = [
                "Review your subscriptions for potential savings.",
                "Set a budget for discretionary spending like dining out.",
                "Try a 'no-spend' weekend challenge once a month.",
                "Automate your savings by setting up recurring transfers.",
                "Use cash for small purchases to better visualize spending."
            ];
            suggestionList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
        }
        // --- FIX ENDS HERE ---
        
        updateProfilePage();
        renderCharts(totalIncome, totalExpense);
    };
    
    const renderCharts = (income, expense) => {
        if(expenseChart) expenseChart.destroy();
        if(trendChart) trendChart.destroy();
        if(dashLineChart) dashLineChart.destroy();
        
        const style = getComputedStyle(document.body);
        const textColor = style.getPropertyValue('--text-color');
        const incomeColor = style.getPropertyValue('--income-color');
        const expenseColor = style.getPropertyValue('--expense-color');
        const balanceColor = style.getPropertyValue('--balance-color');
        
        const monthlyData = {};
        transactions.forEach(t => { const m = t.date.slice(0, 7); if(!monthlyData[m]) monthlyData[m] = {i:0, e:0}; if(t.type==='income') monthlyData[m].i += t.amount; else monthlyData[m].e += t.amount; });
        const labels = Object.keys(monthlyData).sort();
        const incomeData = labels.map(m => monthlyData[m].i);
        const expenseData = labels.map(m => monthlyData[m].e);

        const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor }}}};
        const chartScales = { ...chartOptions, scales: { x: { ticks: { color: textColor }}, y: { ticks: { color: textColor }}}};

        if(document.getElementById('expenseChart')) {
            expenseChart = new Chart('expenseChart', { type: 'doughnut', data: { labels: ["Income", "Expense"], datasets: [{ data: [income, expense], backgroundColor: [incomeColor, expenseColor], borderWidth: 0 }] }, options: chartOptions });
        }
        if(document.getElementById('trendChart')) {
            trendChart = new Chart('trendChart', { type: 'line', data: { labels, datasets: [{ label: "Income", data: incomeData, borderColor: incomeColor, tension: 0.3 }, { label: "Expense", data: expenseData, borderColor: expenseColor, tension: 0.3 }] }, options: chartScales });
        }
        if(document.getElementById('dashboardLineChart')) {
            dashLineChart = new Chart('dashboardLineChart', { type: 'bar', data: { labels, datasets: [{ label: "Balance", data: labels.map((m, i) => incomeData[i] - expenseData[i]), backgroundColor: balanceColor }] }, options: chartScales });
        }
    };

    // --- INITIALIZATION ---
    const initialize = () => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") document.body.classList.add("dark");
        else document.body.classList.remove("dark");
        
        loadUserData();
        updateUIForLoginState();
        
        if (currentUser) {
            switchPage('dashboard');
            render();
        } else {
            switchPage('home');
        }
    };

    setupEventListeners();
    initialize();
});