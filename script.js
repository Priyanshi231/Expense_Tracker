document.addEventListener("DOMContentLoaded", () => {
    // --- State & Elements ---
    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    let goalAmount = parseFloat(localStorage.getItem("goal")) || 0;
    let expenseChart, trendChart, dashLineChart;

    const loginModal = document.getElementById("login-modal");
    const signupModal = document.getElementById("signup-modal");
    const profileMenu = document.getElementById('profile-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector(".sidebar");

    // --- Authentication Simulation ---
    const checkLoginState = () => {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            document.body.classList.add('logged-in');
        } else {
            document.body.classList.remove('logged-in');
        }
    };
    const handleLogin = (e) => { e.preventDefault(); localStorage.setItem('isLoggedIn', 'true'); checkLoginState(); loginModal.style.display = "none"; signupModal.style.display = "none"; alert("Login successful!"); };
    const handleLogout = () => { localStorage.removeItem('isLoggedIn'); checkLoginState(); switchPage('dashboard'); alert("You have been logged out."); };

    // --- Event Listeners ---
    document.getElementById("login-btn").onclick = () => loginModal.style.display = "block";
    document.getElementById("signup-btn").onclick = () => signupModal.style.display = "block";
    document.getElementById("close-login").onclick = () => loginModal.style.display = "none";
    document.getElementById("close-signup").onclick = () => signupModal.style.display = "none";
    document.getElementById("login-form").addEventListener('submit', handleLogin);
    document.getElementById("signup-form").addEventListener('submit', handleLogin);
    document.getElementById("logout-btn").addEventListener('click', handleLogout);
    document.getElementById("settings-logout-btn").addEventListener('click', handleLogout);
    mobileMenuBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
    document.getElementById('profile-menu-btn').addEventListener('click', (e) => { e.stopPropagation(); profileMenu.classList.toggle('active'); });
    document.getElementById('profile-link').addEventListener('click', (e) => { e.preventDefault(); switchPage('settings'); profileMenu.classList.remove('active'); });
    window.onclick = (event) => { if (event.target == loginModal) loginModal.style.display = "none"; if (event.target == signupModal) signupModal.style.display = "none"; if (!event.target.matches('.profile-menu, .profile-menu *')) profileMenu.classList.remove('active'); };

    // --- Navigation ---
    const switchPage = (pageId) => {
        document.querySelector(".page.active").classList.remove("active");
        document.getElementById(pageId).classList.add("active");
        document.querySelector(".nav-link.active").classList.remove("active");
        document.querySelector(`.nav-link[data-page='${pageId}']`).classList.add("active");
        sidebar.classList.remove("active");
    };
    document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => switchPage(link.dataset.page)));

    // --- Theme Toggle ---
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const themeIcon = themeToggleBtn.querySelector("i");
    const setTheme = (isDark) => { document.body.classList.toggle("dark", isDark); themeIcon.className = isDark ? "fas fa-moon" : "fas fa-sun"; localStorage.setItem("theme", isDark ? "dark" : "light"); };
    setTheme(localStorage.getItem("theme") === "dark");
    themeToggleBtn.addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));
    
    // --- Transaction & Goal Logic ---
    window.deleteTransaction = (id) => { transactions = transactions.filter(t => t.id !== id); render(); };
    window.resetData = () => { if (confirm("Are you sure?")) { transactions = []; goalAmount = 0; render(); }};
    window.setGoal = () => { const val = document.getElementById("goal-amount").value; if (val) { goalAmount = +val; render(); }};

    document.getElementById("transaction-form").addEventListener("submit", e => {
        e.preventDefault();
        transactions.push({ id: Date.now(), type: document.getElementById("type").value, description: document.getElementById("description").value, amount: +document.getElementById("amount").value, date: document.getElementById("date").value });
        e.target.reset();
        render();
    });

    // --- Chatbot Logic ---
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotToggleBtn = document.getElementById('chatbot-toggle-btn');
    const closeChatbotBtn = document.getElementById('close-chatbot-btn');
    const chatbotSendBtn = document.getElementById('chatbot-send-btn');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotBody = document.getElementById('chatbot-body');

    chatbotToggleBtn.addEventListener('click', () => chatbotWindow.classList.toggle('active'));
    closeChatbotBtn.addEventListener('click', () => chatbotWindow.classList.remove('active'));

    const chatbotResponses = {
        "budget": "Budgeting is crucial! Start by tracking your income and expenses for a month. Then, categorize your spending and set limits for each category. The 50/30/20 rule is a great starting point: 50% for needs, 30% for wants, and 20% for savings.",
        "savings": "To save more, try automating your savings. Set up a recurring transfer from your checking to your savings account each payday. Also, look for small expenses to cut, like daily coffees, as they add up over time.",
        "investment": "Investing can grow your wealth. For beginners, low-cost index funds or ETFs are a good start. It's wise to consult a financial advisor to understand your risk tolerance and goals before investing.",
        "debt": "To tackle debt, consider the 'avalanche' method (paying off high-interest debt first) or the 'snowball' method (paying off smallest debts first for motivation). Consolidating debt might also be an option.",
        "default": "I can help with questions about budgeting, savings, investment, or debt. What's on your mind?"
    };

    const getBotResponse = (userInput) => {
        userInput = userInput.toLowerCase();
        for (const keyword in chatbotResponses) {
            if (userInput.includes(keyword)) {
                return chatbotResponses[keyword];
            }
        }
        return chatbotResponses.default;
    };

    const addMessageToChat = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}`;
        messageDiv.textContent = text;
        chatbotBody.appendChild(messageDiv);
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    };

    const handleChatbotSend = () => {
        const userInput = chatbotInput.value.trim();
        if (userInput) {
            addMessageToChat(userInput, 'user');
            chatbotInput.value = '';
            setTimeout(() => {
                const botResponse = getBotResponse(userInput);
                addMessageToChat(botResponse, 'bot');
            }, 500);
        }
    };

    chatbotSendBtn.addEventListener('click', handleChatbotSend);
    chatbotInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChatbotSend(); });

    // --- Main Render Function ---
    const render = () => {
        localStorage.setItem("transactions", JSON.stringify(transactions));
        localStorage.setItem("goal", goalAmount);
        
        let totalIncome = 0, totalExpense = 0;
        const tbody = document.getElementById("transactions-list");
        tbody.innerHTML = "";

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(txn => {
            txn.type === "income" ? totalIncome += txn.amount : totalExpense += txn.amount;
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${txn.date}</td><td>${txn.description}</td><td>${txn.type}</td><td style="color:${txn.type === 'expense' ? '#e74c3c' : '#2ecc71'}">${txn.type === 'expense' ? '-' : ''} ₹${txn.amount.toFixed(2)}</td><td><button onclick="deleteTransaction(${txn.id})">✖</button></td>`;
            tbody.appendChild(tr);
        });

        document.getElementById("total-income").innerText = `₹ ${totalIncome.toFixed(2)}`;
        document.getElementById("total-expense").innerText = `₹ ${totalExpense.toFixed(2)}`;
        const currentBalance = totalIncome - totalExpense;
        document.getElementById("balance").innerText = `₹ ${currentBalance.toFixed(2)}`;
        
        const percent = goalAmount > 0 ? Math.max(0, Math.min(100, (currentBalance / goalAmount) * 100)) : 0;
        document.getElementById("goal-circle").style.background = `conic-gradient(var(--primary) ${percent}%, var(--border-color) ${percent}%)`;
        document.getElementById("goal-percentage").innerText = `${Math.floor(percent)}%`;
        document.getElementById("goal-status").innerText = goalAmount > 0 ? `Saved ₹${currentBalance.toFixed(2)} of ₹${goalAmount.toFixed(2)}` : "No goal set.";
        
        const suggestionList = document.getElementById("suggestion-list");
        const suggestions = [ "Cut down on non-essential spending.", "Set a budget and stick to it.", "Track your daily expenses to spot patterns.",  "Set alerts to avoid overspending.", "Create goals and watch your savings grow!" ];
        suggestionList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');

        renderCharts(totalIncome, totalExpense);
    };
    
    const renderCharts = (income, expense) => {
        if(expenseChart) expenseChart.destroy();
        if(trendChart) trendChart.destroy();
        if(dashLineChart) dashLineChart.destroy();
        
        const monthlyData = {};
        transactions.forEach(t => { const month = t.date.slice(0, 7); if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 }; monthlyData[month][t.type] += t.amount; });
        const labels = Object.keys(monthlyData).sort();
        const incomeByMonth = labels.map(m => monthlyData[m].income);
        const expenseByMonth = labels.map(m => monthlyData[m].expense);

        const chartOptions = { responsive: true, maintainAspectRatio: false };
        expenseChart = new Chart(document.getElementById('expenseChart'), { type: 'doughnut', data: { labels: ["Income", "Expense"], datasets: [{ data: [income, expense], backgroundColor: ["#A5D6A7", "#FFCDD2"], borderWidth: 0 }] }, options: chartOptions });
        trendChart = new Chart(document.getElementById('trendChart'), { type: 'line', data: { labels, datasets: [{ label: "Income", data: incomeByMonth, borderColor: "#81C784", fill: true }, { label: "Expense", data: expenseByMonth, borderColor: "#E57373", fill: true }] }, options: chartOptions });
        dashLineChart = new Chart(document.getElementById('dashboardLineChart'), { type: 'bar', data: { labels, datasets: [{ label: "Balance", data: labels.map((m, i) => incomeByMonth[i] - expenseByMonth[i]), backgroundColor: "#90CAF9" }] }, options: chartOptions });
    };

    // --- Initial Load ---
    checkLoginState();
    render();
});