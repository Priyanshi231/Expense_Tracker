let transactions = [];

// Reset data
function resetData() {
  localStorage.clear();
  transactions = [];
  render();
}

// Navigation
document.querySelectorAll(".nav-link").forEach(link=>{
  link.addEventListener("click",()=>{
    document.querySelectorAll(".nav-link").forEach(l=>l.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    link.classList.add("active");
    document.getElementById(link.dataset.page).classList.add("active");
  });
});

// Add transaction
const form=document.getElementById("transaction-form");
form?.addEventListener("submit",e=>{
  e.preventDefault();
  const txn={
    id:Date.now(),
    type:document.getElementById("type").value,
    description:document.getElementById("description").value,
    amount:+document.getElementById("amount").value,
    date:document.getElementById("date").value
  };
  transactions.push(txn);
  localStorage.setItem("transactions",JSON.stringify(transactions));
  form.reset(); render();
});

function deleteTransaction(id){
  transactions=transactions.filter(t=>t.id!==id);
  localStorage.setItem("transactions",JSON.stringify(transactions));
  render();
}

// Charts
let expenseChart,trendChart,dashLineChart;
function renderCharts(income,expense){
  const ctx1=document.getElementById("expenseChart").getContext("2d");
  const ctx2=document.getElementById("trendChart").getContext("2d");
  const ctx3=document.getElementById("dashboardLineChart").getContext("2d");
  if(expenseChart) expenseChart.destroy();
  if(trendChart) trendChart.destroy();
  if(dashLineChart) dashLineChart.destroy();

  expenseChart=new Chart(ctx1,{
    type:"pie",
    data:{labels:["Income","Expense"],datasets:[{data:[income,expense],backgroundColor:["#A5D6A7","#FFCDD2"]}]}
  });

  const monthly={};
  transactions.forEach(t=>{
    const m=t.date.slice(0,7);
    if(!monthly[m]) monthly[m]={income:0,expense:0};
    monthly[m][t.type]+=t.amount;
  });
  const labels=Object.keys(monthly);
  const inc=labels.map(m=>monthly[m].income);
  const exp=labels.map(m=>monthly[m].expense);

  trendChart=new Chart(ctx2,{type:"line",data:{labels,datasets:[
    {label:"Income",data:inc,borderColor:"#81C784",backgroundColor:"#C8E6C9",fill:true},
    {label:"Expense",data:exp,borderColor:"#E57373",backgroundColor:"#FFEBEE",fill:true}
  ]}});
  dashLineChart=new Chart(ctx3,{type:"bar",data:{labels,datasets:[
    {label:"Balance",data:labels.map((m,i)=>inc[i]-exp[i]),backgroundColor:"#90CAF9"}
  ]}});
}

// Render
function render(){
  transactions=JSON.parse(localStorage.getItem("transactions"))||[];
  let income=0,expense=0;
  const tbody=document.getElementById("transactions-list");
  if(tbody) tbody.innerHTML="";
  transactions.forEach(txn=>{
    if(txn.type==="income") income+=txn.amount; else expense+=txn.amount;
    if(tbody){
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${txn.date}</td><td>${txn.description}</td><td>${txn.type}</td>
      <td style="color:${txn.type==='expense'?'#e74c3c':'#2ecc71'}">${txn.type==='expense'?'-':''} ₹${txn.amount.toFixed(2)}</td>
      <td><button onclick="deleteTransaction(${txn.id})">✖</button></td>`;
      tbody.appendChild(tr);
    }
  });
  document.getElementById("total-income").innerText=`₹ ${income.toFixed(2)}`;
  document.getElementById("total-expense").innerText=`₹ ${expense.toFixed(2)}`;
  document.getElementById("balance").innerText=`₹ ${(income-expense).toFixed(2)}`;

  renderCharts(income,expense);
  updateGoal(income-expense);
  smartSuggestions(expense,income);
}

// Suggestions
function smartSuggestions(expense,income){
  const list=document.getElementById("suggestion-list");
  if(!list) return;
  list.innerHTML="";
  const tips=[
    "Track your daily spending to find hidden leaks.",
    "Set a monthly budget and stick to it.",
    "Reduce eating out expenses to save more.",
    "Prioritize needs over wants before buying.",
    "Save at least 20% of your income monthly."
  ];
  if(expense>income*0.8) tips.unshift("⚠️ Your expenses are too high compared to income!");
  tips.forEach(t=>{const li=document.createElement("li");li.textContent=t;list.appendChild(li);});
}

// Goal
let goalAmount=0;
function setGoal(){
  goalAmount=+document.getElementById("goal-amount").value;
  localStorage.setItem("goal",goalAmount);
  updateGoal(getBalance());
}
function getBalance(){return transactions.reduce((acc,t)=>acc+(t.type==="income"?t.amount:-t.amount),0);}
function updateGoal(balance){
  const goal=localStorage.getItem("goal")||0;
  if(goal>0){
    const percent=Math.min(100,(balance/goal)*100);
    document.getElementById("goal-progress").style.width=percent+"%";
    document.getElementById("goal-status").innerText=`Saved ₹${balance} of ₹${goal}`;
  }
}

// Theme
function toggleTheme(){document.body.classList.toggle("dark");}

// Init
render();
