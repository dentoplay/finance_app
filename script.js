// Firebase config
const firebaseConfig = {
  apiKey: "ТВОЙ_API_KEY",
  authDomain: "finance-zone-185a3.firebaseapp.com",
  projectId: "finance-zone-185a3",
  storageBucket: "finance-zone-185a3.appspot.com",
  messagingSenderId: "889137097349",
  appId: "1:889137097349:web:1264e941b950d1856a6c3c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let balance = 0;
const limit = 6000;

async function addTransaction() {
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;

  if (!amount || !category) {
    alert("Заполни все поля");
    return;
  }

  await db.collection("transactions").add({
    amount,
    category,
    type,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  loadTransactions();
}

async function loadTransactions() {
  const snapshot = await db.collection("transactions").orderBy("createdAt").get();

  const history = document.getElementById("history");
  history.innerHTML = "";

  balance = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

    if (data.type === "income") {
      balance += data.amount;
    } else {
      balance -= data.amount;
    }

    const li = document.createElement("li");
    li.innerText = `${data.type === "income" ? "+" : "-"} ${data.amount} ₽ | ${data.category}`;
    history.appendChild(li);
  });

  document.getElementById("balance").innerText = balance;

  const status = document.getElementById("status");
  const box = document.querySelector(".balance-box");

  if (balance > limit * 0.5) {
    status.innerText = "🟢 Финансовая зона безопасности";
    box.style.background = "#0f5132";
  } else if (balance > 0) {
    status.innerText = "🟡 Ты в зоне риска";
    box.style.background = "#664d03";
  } else {
    status.innerText = "🔴 Превышен лимит!";
    box.style.background = "#842029";
  }
}

loadTransactions();