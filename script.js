// ==== Firebase config (твои данные) ====
const firebaseConfig = {
  apiKey: "AIzaSyBoiTckDNOeqLDCdNxhaWVpMiCXAk5qS-o",
  authDomain: "finance-zone-185a3.firebaseapp.com",
  projectId: "finance-zone-185a3",
  storageBucket: "finance-zone-185a3.appspot.com",
  messagingSenderId: "889137097349",
  appId: "1:889137097349:web:1264e941b950d1856a6c3c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==== Настройки ====
const LIMIT = 6000;
const CURRENCY = "₪"; // можешь сменить на "₽" если надо

// ==== UI элементы (новый интерфейс) ====
const listEl = document.getElementById("list");

const balanceValueEl = document.getElementById("balanceValue");
const incomeValueEl = document.getElementById("incomeValue");
const expenseValueEl = document.getElementById("expenseValue");
const monthPillEl = document.getElementById("monthPill"); // optional

const amountEl = document.getElementById("amount");
const categoryEl = document.getElementById("category");
const noteEl = document.getElementById("note");

const addBtnEl = document.getElementById("addBtn");

const typeExpenseBtn = document.getElementById("typeExpense");
const typeIncomeBtn = document.getElementById("typeIncome");

const searchEl = document.getElementById("search"); // optional
const filterEl = document.getElementById("filter"); // optional

const btnAddOpen = document.getElementById("btnAddOpen"); // optional
const addPanel = document.getElementById("addPanel"); // optional

// ==== Состояние ====
let currentType = "expense"; // default
let allTransactions = []; // кеш снимка
let currentSearch = "";
let currentFilter = "all";

// ==== helpers ====
function formatMoney(n) {
  const num = Number(n || 0);
  // без Intl чтобы работало везде одинаково
  return `${CURRENCY} ${num.toLocaleString("ru-RU")}`;
}

function formatDate(ts) {
  // ts может быть firebase Timestamp или null (пока serverTimestamp не пришёл)
  let d;
  try {
    d = ts?.toDate ? ts.toDate() : new Date();
  } catch {
    d = new Date();
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function getMonthName(date = new Date()) {
  const m = date.getMonth();
  const names = [
    "Январь","Февраль","Март","Апрель","Май","Июнь",
    "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
  ];
  return names[m] || "Месяц";
}

function setType(type) {
  currentType = type;

  if (typeExpenseBtn && typeIncomeBtn) {
    if (type === "expense") {
      typeExpenseBtn.classList.add("active");
      typeIncomeBtn.classList.remove("active");
    } else {
      typeIncomeBtn.classList.add("active");
      typeExpenseBtn.classList.remove("active");
    }
  }
}

function safeText(str) {
  return String(str || "").replace(/[<>]/g, "");
}

// ==== UI events ====
if (typeExpenseBtn) typeExpenseBtn.addEventListener("click", () => setType("expense"));
if (typeIncomeBtn) typeIncomeBtn.addEventListener("click", () => setType("income"));
setType("expense");

if (searchEl) {
  searchEl.addEventListener("input", (e) => {
    currentSearch = (e.target.value || "").toLowerCase().trim();
    render();
  });
}

if (filterEl) {
  filterEl.addEventListener("change", (e) => {
    currentFilter = e.target.value || "all";
    render();
  });
}

if (btnAddOpen && addPanel) {
  btnAddOpen.addEventListener("click", () => {
    addPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => amountEl?.focus(), 250);
  });
}

// ==== Добавление транзакции ====
async function addTransaction() {
  const amount = parseFloat(amountEl?.value);
  const category = categoryEl?.value?.trim();
  const note = noteEl?.value?.trim() || "";

  if (!amount || !category) {
    alert("Заполни сумму и категорию");
    return;
  }

  await db.collection("transactions").add({
    amount,
    category,
    note,
    type: currentType,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  if (amountEl) amountEl.value = "";
  if (noteEl) noteEl.value = "";
  // category оставим выбранной — удобно, но можешь очистить:
  // if (categoryEl) categoryEl.value = "";
}

if (addBtnEl) addBtnEl.addEventListener("click", addTransaction);

// Enter для суммы/коммента
if (amountEl) amountEl.addEventListener("keydown", (e) => { if (e.key === "Enter") addTransaction(); });
if (noteEl) noteEl.addEventListener("keydown", (e) => { if (e.key === "Enter") addTransaction(); });

// ==== Удаление ====
async function deleteTransaction(id) {
  await db.collection("transactions").doc(id).delete();
}

// ==== Рендер ====
function applyFilters(items) {
  let res = items.slice();

  if (currentFilter === "income") res = res.filter(x => x.type === "income");
  if (currentFilter === "expense") res = res.filter(x => x.type === "expense");

  if (currentSearch) {
    res = res.filter(x => {
      const cat = (x.category || "").toLowerCase();
      const note = (x.note || "").toLowerCase();
      return cat.includes(currentSearch) || note.includes(currentSearch);
    });
  }

  return res;
}

function render() {
  if (!listEl) return;

  // Считаем суммы по ВСЕМ транзакциям (а не по фильтру)
  let balance = 0;
  let income = 0;
  let expense = 0;

  for (const t of allTransactions) {
    const amt = Number(t.amount || 0);
    if (t.type === "income") {
      income += amt;
      balance += amt;
    } else {
      expense += amt;
      balance -= amt;
    }
  }

  if (balanceValueEl) balanceValueEl.textContent = formatMoney(balance);
  if (incomeValueEl) incomeValueEl.textContent = `+ ${formatMoney(income)}`;
  if (expenseValueEl) expenseValueEl.textContent = `- ${formatMoney(expense)}`;

  // pill: месяц + статус
  if (monthPillEl) {
    const monthName = getMonthName(new Date());
    let status = "🟡 Риск";
    if (balance > LIMIT * 0.5) status = "🟢 Ок";
    else if (balance <= 0) status = "🔴 Лимит";
    monthPillEl.textContent = `${monthName} • ${status}`;
  }

  // Список с фильтрами
  const shown = applyFilters(allTransactions);

  listEl.innerHTML = "";
  if (shown.length === 0) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.style.marginTop = "8px";
    empty.textContent = "Пока нет транзакций по этому фильтру.";
    listEl.appendChild(empty);
    return;
  }

  for (const t of shown) {
    const isIncome = t.type === "income";
    const item = document.createElement("div");
    item.className = "item";

    const icon = document.createElement("div");
    icon.className = `icon ${isIncome ? "pos" : "neg"}`;
    icon.textContent = isIncome ? "+" : "−";

    const meta = document.createElement("div");
    meta.className = "meta";

    const name = document.createElement("div");
    name.className = "name";
    name.innerHTML = `${safeText(t.category || "Без категории")}${
      t.note ? ` <span class="tag">${safeText(t.note)}</span>` : ""
    }`;

    const date = document.createElement("div");
    date.className = "date";
    date.textContent = formatDate(t.createdAt);

    meta.appendChild(name);
    meta.appendChild(date);

    const rightWrap = document.createElement("div");
    rightWrap.style.display = "flex";
    rightWrap.style.alignItems = "center";
    rightWrap.style.gap = "10px";

    const sum = document.createElement("div");
    sum.className = `sum ${isIncome ? "pos" : "neg"}`;
    sum.textContent = `${isIncome ? "+" : "-"} ${formatMoney(t.amount)}`;

    const del = document.createElement("button");
    del.className = "btn ghost";
    del.style.padding = "8px 10px";
    del.style.borderRadius = "12px";
    del.textContent = "🗑";
    del.title = "Удалить";
    del.addEventListener("click", () => deleteTransaction(t.id));

    rightWrap.appendChild(sum);
    rightWrap.appendChild(del);

    item.appendChild(icon);
    item.appendChild(meta);
    item.appendChild(rightWrap);

    listEl.appendChild(item);
  }
}

// ==== Firestore realtime ====
db.collection("transactions")
  .orderBy("createdAt", "desc")
  .onSnapshot((snapshot) => {
    allTransactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    render();
  });