let salesTrendChart = null;

let paymentChart = null;



const AUTH_STORAGE_KEY = "amUser";



function getAuthUser() {



    try {



        let raw =

            localStorage.getItem(AUTH_STORAGE_KEY);



        if (!raw) {



            raw =

                sessionStorage.getItem(AUTH_STORAGE_KEY);



            if (raw) {

                localStorage.setItem(AUTH_STORAGE_KEY, raw);

            }



        }



        return raw ? JSON.parse(raw) : null;



    } catch {



        return null;



    }



}



function saveAuthUser(user) {



    const json = JSON.stringify(user);



    localStorage.setItem(AUTH_STORAGE_KEY, json);

    sessionStorage.setItem(AUTH_STORAGE_KEY, json);



}



function clearAuthUser() {



    localStorage.removeItem(AUTH_STORAGE_KEY);

    sessionStorage.removeItem(AUTH_STORAGE_KEY);



}



window.getAuthUser = getAuthUser;

window.saveAuthUser = saveAuthUser;

window.clearAuthUser = clearAuthUser;



async function syncSessionUser() {

    let user = getAuthUser();

    if (!user) {
        return null;
    }

    if (user.id) {
        return user;
    }

    if (!user.username) {
        return null;
    }

    try {

        const result =
            await window.electronAPI.resolveSessionUser(
                user.username
            );

        if (result && result.success && result.user) {

            saveAuthUser(result.user);
            return result.user;

        }

    } catch (err) {
        console.error("Session sync failed:", err);
    }

    return user;

}



window.syncSessionUser = syncSessionUser;



function formatDateInput(d) {



    return d.toISOString().split("T")[0];



}



function initReportDates() {



    const toEl =

        document.getElementById("reportTo");



    const fromEl =

        document.getElementById("reportFrom");



    if (!toEl || !fromEl) {

        return;

    }



    const today = new Date();



    const monthStart = new Date(

        today.getFullYear(),

        today.getMonth(),

        1

    );



    toEl.value = formatDateInput(today);

    fromEl.value = formatDateInput(monthStart);



}



function lastSevenDayLabels() {



    const labels = [];



    for (let i = 6; i >= 0; i--) {



        const d = new Date();

        d.setDate(d.getDate() - i);

        labels.push(formatDateInput(d));



    }



    return labels;



}



async function loadCharts() {



    if (!window.Chart) {

        return;

    }



    const data =

        await window.electronAPI.getAnalytics();



    const labels = lastSevenDayLabels();



    const salesMap = {};



    (data.salesTrend || []).forEach((row) => {

        salesMap[row.day] = Number(row.sales);

    });



    const salesData = labels.map(

        (day) => salesMap[day] || 0

    );



    const trendCtx =

        document.getElementById("salesTrendChart");



    if (trendCtx) {



        if (salesTrendChart) {

            salesTrendChart.destroy();

        }



        salesTrendChart = new Chart(trendCtx, {

            type: "line",

            data: {

                labels: labels.map((d) => d.slice(5)),

                datasets: [{

                    label: "Sales (₹)",

                    data: salesData,

                    borderColor: "#2563eb",

                    backgroundColor: "rgba(37, 99, 235, 0.12)",

                    fill: true,

                    tension: 0.35,

                    pointRadius: 4

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: { legend: { display: false } },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: (v) => "₹" + v

                        }

                    }

                }

            }

        });



    }



    const payCtx =

        document.getElementById("paymentChart");



    if (payCtx) {



        const modes =

            data.paymentSplit || [];



        if (paymentChart) {

            paymentChart.destroy();

        }



        paymentChart = new Chart(payCtx, {

            type: "doughnut",

            data: {

                labels: modes.map((m) => m.mode || "Other"),

                datasets: [{

                    data: modes.map((m) => Number(m.amount)),

                    backgroundColor: [

                        "#2563eb",

                        "#059669",

                        "#d97706",

                        "#7c3aed",

                        "#dc2626"

                    ]

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                }

            }

        });



    }



    const topList =

        document.getElementById("topProductsList");



    if (topList) {



        const items = data.topProducts || [];



        if (!items.length) {



            topList.innerHTML =

                "<li class=\"charts-top__empty\">No sales in the last 30 days</li>";



        } else {



            topList.innerHTML = items.map((item, i) => `

                <li>

                    <span class="charts-top__rank">${i + 1}</span>

                    <span class="charts-top__name">${item.name}</span>

                    <span class="charts-top__qty">${item.qty} sold</span>

                </li>

            `).join("");



        }



    }



}



async function runDateReport() {



    const from =

        document.getElementById("reportFrom").value;



    const to =

        document.getElementById("reportTo").value;



    const output =

        document.getElementById("reportContent");



    if (!from || !to) {

        output.innerHTML =

            "<p class=\"report-output__msg\">Select from and to dates.</p>";

        return;

    }



    if (from > to) {

        output.innerHTML =

            "<p class=\"report-output__msg\">From date must be on or before to date.</p>";

        return;

    }



    const rows =

        await window.electronAPI.getSalesByDate({ from, to });



    if (!rows.length) {



        output.innerHTML =

            `<p class="report-output__msg">No sales between ${from} and ${to}.</p>`;



        return;



    }



    const totalSales =

        rows.reduce((s, r) => s + Number(r.total_sale), 0);



    const totalProfit =

        rows.reduce((s, r) => s + Number(r.profit), 0);



    const bills = new Set(

        rows.map((r) => r.bill_id).filter(Boolean)

    ).size;



    let tableRows = "";



    rows.forEach((sale) => {



        const bill =

            sale.bill_id

                ? `#${String(sale.bill_id).slice(-6)}`

                : "—";



        const date =

            (sale.sale_date || "").replace("T", " ").slice(0, 16);



        tableRows += `

            <tr>

                <td>${date}</td>

                <td>${bill}</td>

                <td><strong>${sale.product_name}</strong></td>

                <td>${sale.qty}</td>

                <td>₹${sale.total_sale}</td>

                <td>₹${sale.profit}</td>

                <td>${sale.payment_mode || "—"}</td>

            </tr>

        `;



    });



    output.innerHTML = `

        <div class="date-report-summary">

            <div><span>Period</span><strong>${from} → ${to}</strong></div>

            <div><span>Bills</span><strong>${bills}</strong></div>

            <div><span>Total sales</span><strong>₹${totalSales}</strong></div>

            <div><span>Total profit</span><strong>₹${totalProfit}</strong></div>

        </div>

        <div class="table-wrap report-table-wrap">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>Date</th>

                        <th>Bill</th>

                        <th>Product</th>

                        <th>Qty</th>

                        <th>Sale</th>

                        <th>Profit</th>

                        <th>Payment</th>

                    </tr>

                </thead>

                <tbody>${tableRows}</tbody>

            </table>

        </div>

    `;



}



async function exportDateReportExcel() {



    const from =

        document.getElementById("reportFrom").value;



    const to =

        document.getElementById("reportTo").value;



    if (!from || !to) {



        if (typeof showToast === "function") {

            showToast("Select date range first.", "warn");

        }



        return;



    }



    const result =

        await window.electronAPI.exportSalesExcel({ from, to });



    if (result.canceled) {

        return;

    }



    if (result.success) {



        if (typeof showToast === "function") {

            showToast("Excel saved successfully.", "success");

        }



    } else {



        if (typeof showToast === "function") {

            showToast(result.error || "Export failed.", "error");

        }



    }



}



function clearLoginPasswordFields() {

    const ids = [
        "accountCurrentPassword",
        "accountNewPassword",
        "accountConfirmPassword"
    ];

    ids.forEach((id) => {

        const el = document.getElementById(id);

        if (el) {
            el.value = "";
        }

    });

}



function closeAccountModal() {

    const modal =
        document.getElementById("accountModal");

    if (modal) {
        modal.style.display = "none";
        modal.hidden = true;
    }

    clearLoginPasswordFields();

}

window.closeAccountModal = closeAccountModal;



async function openAccountModal() {

    const settingsPanel =
        document.getElementById("settingsPanel");

    if (settingsPanel) {
        settingsPanel.style.display = "none";
    }

    const user = await syncSessionUser();

    if (!user) {

        if (typeof showToast === "function") {
            showToast("Please sign in again.", "warn");
        }

        return;

    }

    if (!user.id) {

        if (typeof showToast === "function") {
            showToast(
                "Session error. Sign out and sign in again.",
                "warn"
            );
        }

        return;

    }

    await loadAccountSettings();

    const modal =
        document.getElementById("accountModal");

    if (modal) {
        modal.hidden = false;
        modal.style.display = "flex";
    }

    setTimeout(() => {

        const field =
            document.getElementById("accountUsername");

        if (field) {
            field.focus();
        }

    }, 50);

}



async function loadAccountSettings() {

    const user = await syncSessionUser();

    if (!user || !user.id) {
        return;
    }

    const result =
        await window.electronAPI.getAccount(user.id);

    if (!result || !result.success) {

        if (typeof showToast === "function") {
            showToast(
                result?.error || "Could not load account.",
                "error"
            );
        }

        return;

    }

    const account = result?.account;

    const usernameEl =
        document.getElementById("accountUsername");

    const displayEl =
        document.getElementById("accountDisplayName");

    if (usernameEl) {
        usernameEl.value = account?.username || "";
    }

    if (displayEl) {
        displayEl.value = account?.displayName || "";
    }

    clearLoginPasswordFields();

}



async function saveAccountSettings() {

    const user = await syncSessionUser();

    if (!user || !user.id) {

        if (typeof showToast === "function") {
            showToast("Sign in again to update login details.", "warn");
        }

        return;

    }

    const usernameEl =
        document.getElementById("accountUsername");

    const displayEl =
        document.getElementById("accountDisplayName");

    const currentEl =
        document.getElementById("accountCurrentPassword");

    const newEl =
        document.getElementById("accountNewPassword");

    const confirmEl =
        document.getElementById("accountConfirmPassword");

    if (
        !usernameEl ||
        !currentEl
    ) {
        return;
    }

    const username = usernameEl.value.trim();
    const displayName = (displayEl?.value || "").trim();
    const currentPassword = currentEl.value;
    const newPassword = (newEl?.value || "").trim();
    const confirmPassword = (confirmEl?.value || "").trim();

    if (!username) {

        if (typeof showToast === "function") {
            showToast("Login ID is required.", "warn");
        }

        usernameEl.focus();
        return;

    }

    if (!currentPassword) {

        if (typeof showToast === "function") {
            showToast("Enter your current password.", "warn");
        }

        currentEl.focus();
        return;

    }

    if (newPassword && newPassword.length < 4) {

        if (typeof showToast === "function") {
            showToast(
                "New password must be at least 4 characters.",
                "warn"
            );
        }

        newEl?.focus();
        return;

    }

    if (
        newPassword &&
        newPassword !== confirmPassword
    ) {

        if (typeof showToast === "function") {
            showToast("New passwords do not match.", "warn");
        }

        confirmEl?.focus();
        return;

    }

    const saveBtn =
        document.getElementById("saveLoginBtn");

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving…";
    }

    try {

        if (!window.electronAPI?.updateAccount) {
            throw new Error("Save is not available. Restart the app.");
        }

        const result =
            await window.electronAPI.updateAccount({
                userId: user.id,
                username,
                displayName,
                currentPassword,
                newPassword,
                confirmPassword
            });

        if (!result || !result.success) {

            if (typeof showToast === "function") {
                showToast(
                    result?.error || "Could not save.",
                    "error"
                );
            }

            return;

        }

        saveAuthUser(result.user);

        const nameEl =
            document.getElementById("headerUserName");

        if (nameEl) {
            nameEl.textContent =
                result?.user?.displayName ||
                result?.user?.username ||
                "Owner";
        }

        clearLoginPasswordFields();
        closeAccountModal();

        if (typeof showToast === "function") {

            let msg =
                "Login saved. Logout and sign in with Login ID: " +
                result.user.username;

            if (result.passwordChanged) {
                msg += " and your new password.";
            } else {
                msg += " and your password.";
            }

            showToast(msg, "success");

        }

    } catch (err) {

        if (typeof showToast === "function") {
            showToast(err.message || "Save failed.", "error");
        }

    } finally {

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save changes";
        }

    }

}



window.saveAccountSettings = saveAccountSettings;



window.loadAccountSettings = loadAccountSettings;
window.openAccountModal = openAccountModal;
window.closeAccountModal = closeAccountModal;



function formatBillIdShort(billId) {

    if (!billId) {
        return "—";
    }

    if (typeof billId === "string" && billId.startsWith("RH-")) {
        return billId;
    }

    return "#" + String(billId).slice(-6);

}



function formatMoney(amount) {

    return "₹" + Number(amount || 0).toLocaleString("en-IN");

}



async function openExpenseModal() {

    const modal =
        document.getElementById("expenseModal");

    const categoryEl =
        document.getElementById("expenseCategory");

    const dateEl =
        document.getElementById("expenseDate");

    if (!modal || !categoryEl) {
        return;
    }

    const categories =
        await window.electronAPI.getExpenseCategories();

    categoryEl.innerHTML = categories
        .map((c) => `<option value="${c}">${c}</option>`)
        .join("");

    if (dateEl) {
        dateEl.value = formatDateInput(new Date());
    }

    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseNote").value = "";

    await loadExpenses();

    modal.style.display = "flex";
    modal.hidden = false;

}



function closeExpenseModal() {

    const modal =
        document.getElementById("expenseModal");

    if (modal) {
        modal.style.display = "none";
        modal.hidden = true;
    }

}



async function loadExpenses() {

    const now = new Date();
    const from =
        new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .slice(0, 10);

    const to =
        new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .slice(0, 10);

    const range = { from, to };

    const [expenses, summary] =
        await Promise.all([
            window.electronAPI.getExpenses(range),
            window.electronAPI.getExpenseSummary(range)
        ]);

    const summaryEl =
        document.getElementById("expenseSummary");

    const listEl =
        document.getElementById("expenseListBody");

    if (summaryEl) {

        const total =
            summary.reduce(
                (s, row) => s + Number(row.total),
                0
            );

        let html =
            `<p class="expense-summary__total">This month: <strong>${formatMoney(total)}</strong></p>`;

        if (summary.length) {
            html += '<div class="expense-summary__chips">';
            summary.forEach((row) => {
                html += `<span class="expense-chip">${row.category}: ${formatMoney(row.total)}</span>`;
            });
            html += "</div>";
        }

        summaryEl.innerHTML = html;

    }

    if (!listEl) {
        return;
    }

    if (!expenses.length) {
        listEl.innerHTML =
            `<tr><td colspan="5" class="pos-cart-empty">No expenses this month</td></tr>`;
        return;
    }

    listEl.innerHTML = expenses
        .map((row) => `
            <tr>
                <td>${row.expense_date}</td>
                <td><strong>${row.category}</strong></td>
                <td>${formatMoney(row.amount)}</td>
                <td>${row.note || "—"}</td>
                <td>
                    <button type="button" class="btn btn--ghost btn--sm"
                        onclick="deleteExpenseById(${row.id})">Delete</button>
                </td>
            </tr>
        `)
        .join("");

}



async function submitExpenseForm(e) {

    e.preventDefault();

    const category =
        document.getElementById("expenseCategory").value;

    const amount =
        Number(
            document.getElementById("expenseAmount").value
        );

    const expenseDate =
        document.getElementById("expenseDate").value;

    const note =
        document.getElementById("expenseNote").value.trim();

    const result =
        await window.electronAPI.addExpense({
            category,
            amount,
            expenseDate,
            note
        });

    if (!result.success) {

        if (typeof showToast === "function") {
            showToast(result.error || "Could not add expense.", "error");
        }

        return;

    }

    if (typeof showToast === "function") {
        showToast("Expense added.", "success");
    }

    await loadExpenses();

    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseNote").value = "";

}



window.deleteExpenseById = async function (id) {

    const result =
        await window.electronAPI.deleteExpense(id);

    if (!result.success) {

        if (typeof showToast === "function") {
            showToast("Could not delete expense.", "error");
        }

        return;

    }

    await loadExpenses();

};



async function openBillHistoryModal() {

    const modal =
        document.getElementById("billHistoryModal");

    const body =
        document.getElementById("billHistoryBody");

    if (!modal || !body) {
        return;
    }

    const bills =
        await window.electronAPI.getBills();

    if (!bills.length) {
        body.innerHTML =
            `<tr><td colspan="7" class="pos-cart-empty">No bills yet</td></tr>`;
    } else {

        body.innerHTML = bills
            .map((bill) => {
                const id = bill.bill_id;
                const date =
                    bill.sale_date
                        ? String(bill.sale_date).slice(0, 16).replace("T", " ")
                        : "—";
                const customer =
                    bill.customer_name || "—";

                return `
                    <tr>
                        <td><strong>${formatBillIdShort(id)}</strong></td>
                        <td>${date}</td>
                        <td>${customer}</td>
                        <td>${bill.item_count}</td>
                        <td>${formatMoney(bill.total_sale)}</td>
                        <td>${bill.payment_mode || "—"}</td>
                        <td class="bill-actions">
                            <button type="button" class="btn btn--ghost btn--sm"
                                onclick="printBillById('${id}')">Print</button>
                            <button type="button" class="btn btn--secondary btn--sm"
                                onclick="exportBillPdfById('${id}')">PDF</button>
                        </td>
                    </tr>
                `;
            })
            .join("");

    }

    modal.style.display = "flex";

}



function closeBillHistoryModal() {

    const modal =
        document.getElementById("billHistoryModal");

    if (modal) {
        modal.style.display = "none";
    }

}



window.openExpenseModal = openExpenseModal;
window.openBillHistoryModal = openBillHistoryModal;



function bindFeatureEvents() {



    const runBtn =

        document.getElementById("runDateReportBtn");



    const exportBtn =

        document.getElementById("exportExcelBtn");



    if (runBtn) {

        runBtn.addEventListener("click", runDateReport);

    }



    if (exportBtn) {

        exportBtn.addEventListener("click", exportDateReportExcel);

    }






    const saveLoginBtn =

        document.getElementById("saveLoginBtn");



    const accountForm =
        document.getElementById("accountForm");

    if (accountForm) {

        accountForm.addEventListener("submit", (e) => {

            e.preventDefault();
            saveAccountSettings();

        });

    }



    const closeAccountModalBtn =

        document.getElementById("closeAccountModal");



    const cancelAccountBtn =

        document.getElementById("cancelAccountBtn");



    if (closeAccountModalBtn) {

        closeAccountModalBtn.addEventListener("click", closeAccountModal);

    }



    if (cancelAccountBtn) {

        cancelAccountBtn.addEventListener("click", closeAccountModal);

    }

    const expenseForm =
        document.getElementById("expenseForm");

    if (expenseForm) {
        expenseForm.addEventListener("submit", submitExpenseForm);
    }

    const closeExpenseModalBtn =
        document.getElementById("closeExpenseModal");

    if (closeExpenseModalBtn) {
        closeExpenseModalBtn.addEventListener("click", closeExpenseModal);
    }

}



window.printBillById = async function (billId) {

    if (!billId) {
        return;
    }

    try {

        const result =
            await window.electronAPI.printBill(billId);

        if (
            result &&
            !result.success &&
            typeof showToast === "function"
        ) {
            showToast(result.error || "Print cancelled.", "warn");
        }

    } catch (err) {

        if (typeof showToast === "function") {
            showToast(err.message || "Print failed.", "error");
        }

    }

};



window.exportBillPdfById = async function (billId) {

    if (!billId) {
        return;
    }

    try {

        const result =
            await window.electronAPI.exportBillPdf(billId);

        if (result.cancelled) {
            return;
        }

        if (!result.success) {

            if (typeof showToast === "function") {
                showToast(result.error || "Could not save PDF.", "error");
            }

            return;

        }

        if (typeof showToast === "function") {
            showToast("Bill PDF saved.", "success");
        }

        if (result.path && window.electronAPI.openFile) {
            await window.electronAPI.openFile(result.path);
        }

    } catch (err) {

        if (typeof showToast === "function") {
            showToast(err.message || "PDF export failed.", "error");
        }

    }

};



async function initFeatures() {



    let user = getAuthUser();



    // Login is disabled; continue loading the app without authentication.
    user = await syncSessionUser();



    if (!user || !user.id) {

        clearAuthUser();
        user = null;

    }



    const nameEl =

        document.getElementById("headerUserName");



    if (nameEl) {

        nameEl.textContent = user?.displayName || user?.username || "Owner";

    }



    initReportDates();

    bindFeatureEvents();



    try {

        await loadCharts();

    } catch (err) {

        console.error("Charts failed to load:", err);

    }



    return true;



}


