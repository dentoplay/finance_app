let balance = localStorage.getItem("balance")
    ? parseFloat(localStorage.getItem("balance"))
    : 0;

let historyData = localStorage.getItem("history")
    ? JSON.parse(localStorage.getItem("history"))
    : [];

const limit = 6000;

function addTransaction() {
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const type = document.getElementById("type").value;

    if (!amount || !category) {
        alert("Заполни все поля");
        return;
    }

    if (type === "income") {
        balance += amount;
    } else {
        balance -= amount;
    }

    historyData.push({
        type,
        amount,
        category
    });

    saveData();
    render();
}

function saveData() {
    localStorage.setItem("balance", balance);
    localStorage.setItem("history", JSON.stringify(historyData));
}

function render() {
    document.getElementById("balance").innerText = balance;

    const history = document.getElementById("history");
    history.innerHTML = "";

    historyData.forEach(item => {
        const li = document.createElement("li");
        li.innerText = `${item.type === "income" ? "+" : "-"} ${item.amount} ₽ | ${item.category}`;
        history.appendChild(li);
    });

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

render();