// Firebase config (ТВОИ реальные данные)
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

let balance = 0;
const limit = 6000;

const history = document.getElementById("history");
const balanceEl = document.getElementById("balance");
const statusEl = document.getElementById("status");
const box = document.querySelector(".balance-box");

async function addTransaction() {
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value.trim();
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

  document.getElementById("amount").value = "";
  document.getElementById("category").value = "";
}

// Удаление
async function deleteTransaction(id) {
  await db.collection("transactions").doc(id).delete();
}

// РЕАЛЬНОЕ ВРЕМЯ (авто обновление)
db.collection("transactions")
  .orderBy("createdAt", "desc")
  .onSnapshot(snapshot => {

    history.innerHTML = "";
    balance = 0;

    snapshot.forEach(doc => {
      const data = doc.data();

      if (data.type === "income") {
        balance += data.amount;
      } else {
        balance -= data.amount;
      }

      const div = document.createElement("div");
      div.className = "transaction";

      div.innerHTML = `
        <div class="left">
          <span class="type ${data.type}">
            ${data.type === "income" ? "💰 Доход" : "💸 Расход"}
          </span>
          <div class="category">${data.category}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="right ${data.type}">
            ${data.type === "income" ? "+" : "-"}${data.amount} ₽
          </div>
          <button class="delBtn">🗑</button>
        </div>
      `;

      div.querySelector(".delBtn").addEventListener("click", () => {
        deleteTransaction(doc.id);
      });

      history.appendChild(div);
    });

    balanceEl.innerText = balance;

    if (balance > limit * 0.5) {
      statusEl.innerText = "🟢 Финансовая зона безопасности";
      box.style.background = "#0f5132";
    } else if (balance > 0) {
      statusEl.innerText = "🟡 Ты в зоне риска";
      box.style.background = "#664d03";
    } else {
      statusEl.innerText = "🔴 Превышен лимит!";
      box.style.background = "#842029";
    }

  });