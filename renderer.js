let pendingLogoData = null;
let pendingBannerData = null;

function parseNum(value) {

    const cleaned =
        String(value ?? "")
            .trim()
            .replace(/,/g, "");

    if (cleaned === "" || cleaned === "-") {
        return NaN;
    }

    const num = parseFloat(cleaned);

    return Number.isFinite(num) ? num : NaN;

}

const DIALOG_ICONS = {
    success: "✓",
    error: "✕",
    warn: "!",
    info: "i"
};

function showAppDialog(options) {

    return new Promise((resolve) => {

        const root =
            document.getElementById("appDialog");

        const iconEl =
            document.getElementById("appDialogIcon");

        const titleEl =
            document.getElementById("appDialogTitle");

        const messageEl =
            document.getElementById("appDialogMessage");

        const detailEl =
            document.getElementById("appDialogDetail");

        const cancelBtn =
            document.getElementById("appDialogCancel");

        const confirmBtn =
            document.getElementById("appDialogConfirm");

        if (!root) {
            resolve(false);
            return;
        }

        const variant =
            options.variant || "info";

        root.hidden = false;
        root.setAttribute("aria-hidden", "false");
        root.className =
            "app-dialog app-dialog--show app-dialog--" + variant;

        iconEl.textContent =
            DIALOG_ICONS[variant] || DIALOG_ICONS.info;

        titleEl.textContent =
            options.title || "";

        messageEl.textContent =
            options.message || "";

        if (options.detail) {

            detailEl.textContent = options.detail;
            detailEl.hidden = false;

        } else {

            detailEl.textContent = "";
            detailEl.hidden = true;

        }

        const showCancel =
            Boolean(options.showCancel);

        cancelBtn.hidden = !showCancel;
        confirmBtn.textContent =
            options.confirmText || "OK";
        cancelBtn.textContent =
            options.cancelText || "Cancel";

        const cleanup = (value) => {

            root.hidden = true;
            root.setAttribute("aria-hidden", "true");
            root.classList.remove("app-dialog--show");

            cancelBtn.removeEventListener("click", onCancel);
            confirmBtn.removeEventListener("click", onConfirm);
            root.removeEventListener("click", onBackdrop);

            document.removeEventListener("keydown", onKey);

            resolve(value);

        };

        const onCancel = () => cleanup(false);
        const onConfirm = () => cleanup(true);

        const onBackdrop = (e) => {

            if (
                e.target.matches("[data-dialog-close]") &&
                showCancel
            ) {
                onCancel();
            }

        };

        const onKey = (e) => {

            if (e.key === "Escape" && showCancel) {
                onCancel();
            }

        };

        cancelBtn.addEventListener("click", onCancel);
        confirmBtn.addEventListener("click", onConfirm);
        root.addEventListener("click", onBackdrop);
        document.addEventListener("keydown", onKey);

        confirmBtn.focus();

    });

}

function showConfirmDialog(options) {

    return showAppDialog({
        ...options,
        showCancel: true
    });

}

function showToast(message, type) {

    const toast =
        document.getElementById("appToast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.className =
        "app-toast app-toast--" +
        (type || "error") +
        " app-toast--show";

    clearTimeout(showToast._hideTimer);

    showToast._hideTimer =
        setTimeout(() => {

            toast.classList.remove("app-toast--show");

        }, 4500);

}

function clearSellQtyField() {

    const qtyField =
        document.getElementById("sellQty");

    if (qtyField) {
        qtyField.value = "";
    }

}

function restorePosFocus(selectAll) {

    if (sellModal.style.display !== "flex") {
        return;
    }

    requestAnimationFrame(() => {

        const qtyField =
            document.getElementById("sellQty");

        if (!qtyField) {
            return;
        }

        qtyField.focus();

        if (selectAll && qtyField.value) {
            qtyField.select();
        }

    });

}

function setupInputFocusHelpers() {

    document.body.addEventListener(
        "focusin",
        (e) => {

            const field =
                e.target.closest(
                    ".app-input, .cart-qty-input, .search-input"
                );

            if (!field) {
                return;
            }

            document
                .querySelectorAll(".is-focused")
                .forEach((el) => {

                    el.classList.remove("is-focused");

                });

            field.classList.add("is-focused");

            if (
                field.classList.contains("input-num") &&
                field.select &&
                field.id !== "sellQty" &&
                field.id !== "newStock"
            ) {

                setTimeout(() => field.select(), 0);

            }

        }
    );

    document.body.addEventListener(
        "focusout",
        (e) => {

            if (e.target.classList) {
                e.target.classList.remove("is-focused");
            }

        }
    );

    document.body.addEventListener(
        "mousedown",
        (e) => {

            const field =
                e.target.closest(
                    ".app-input, .cart-qty-input, .search-input, select"
                );

            if (field) {
                e.stopPropagation();
            }

        },
        true
    );

    document.body.addEventListener(
        "click",
        (e) => {

            const field =
                e.target.closest(
                    "input.app-input, textarea.app-input, .cart-qty-input"
                );

            if (field && typeof field.focus === "function") {
                field.focus();
            }

        },
        true
    );

}

function paymentBadge(mode) {

    const m = (mode || "").toLowerCase();

    if (m === "cash") {
        return '<span class="badge badge--cash">Cash</span>';
    }

    if (m === "upi") {
        return '<span class="badge badge--upi">UPI</span>';
    }

    return '<span class="badge badge--credit">Credit</span>';

}

function shopInitials(name) {

    return (name || "RH")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "RH";

}

const dashboardDateEl =
    document.getElementById("dashboardDate");

if (dashboardDateEl) {

    dashboardDateEl.textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

}

const profileBtn = document.getElementById("profileBtn");
const profileModal = document.getElementById("profileModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileSettingsBtn = document.getElementById("profileSettingsBtn");
const logoInput = document.getElementById("logoInput");
const removeLogoBtn = document.getElementById("removeLogoBtn");

const profitProductsReportBtn =
    document.getElementById(
        "profitProductsReportBtn"
    );
const bestSellingReportBtn =
    document.getElementById(
        "bestSellingReportBtn"
    );
const paymentReportBtn =
    document.getElementById(
        "paymentReportBtn"
    );
const monthlyReportBtn =
    document.getElementById(
        "monthlyReportBtn"
    );
const profitReportBtn =
    document.getElementById(
        "profitReportBtn"
    );
const todayReportBtn =
    document.getElementById(
        "todayReportBtn"
    );
const closeSellModal =
    document.getElementById(
        "closeSellModal"
    );
const closeEditModal =
    document.getElementById(
        "closeEditModal"
    );const closeStockModal =
    document.getElementById(
        "closeStockModal"
    );
const closeAddModal =
    document.getElementById(
        "closeAddModal"
    );
const closeReportsModal =
    document.getElementById(
        "closeReportsModal"
    );
const priceHistoryModal =
    document.getElementById(
        "priceHistoryModal"
    );

const priceHistoryBody =
    document.getElementById(
        "priceHistoryBody"
    );
    const closePriceHistoryModal =
    document.getElementById(
        "closePriceHistoryModal"
    );

const reportContent =
    document.getElementById(
        "reportContent"
    );
    const lowStockReportBtn =
    document.getElementById(
        "lowStockReportBtn"
    );

const priceHistoryReportBtn =
    document.getElementById(
        "priceHistoryReportBtn"
    );
    const salesHistoryModal =
    document.getElementById(
        "salesHistoryModal"
    );

const salesHistoryBody =
    document.getElementById(
        "salesHistoryBody"
    );

const salesHistoryReportBtn =
    document.getElementById(
        "salesHistoryReportBtn"
    );

const closeSalesHistoryModal =
    document.getElementById(
        "closeSalesHistoryModal"
    );
const reportsBtn =
    document.getElementById("reportsBtn");

    const settingsBtn =
document.getElementById(
    "settingsBtn"
);

const settingsPanel =
document.getElementById(
    "settingsPanel"
);

const closeSettingsBtn =
document.getElementById(
    "closeSettingsBtn"
);

const mainSection =
    document.querySelector(
        ".main"
    );
const backupBtn =
    document.getElementById(
        "backupBtn"
    );

const restoreBtn =
    document.getElementById(
        "restoreBtn"
    );
const reportsModal =
    document.getElementById("reportsModal");
const editModal =
    document.getElementById("editModal");

const saveEditBtn =
    document.getElementById("saveEditBtn");
const searchInput =
    document.getElementById("searchProduct");
const modal = document.getElementById("productModal");
const stockModal = document.getElementById("stockModal");
const sellModal = document.getElementById("sellModal");

const addBtn = document.getElementById("addBtn");
const stockBtn = document.getElementById("stockBtn");
const sellBtn = document.getElementById("sellBtn");

const saveBtn = document.getElementById("saveProduct");
const updateStockBtn = document.getElementById("updateStock");
const sellProductBtn = document.getElementById("sellProductBtn");
const addToBillBtn = document.getElementById("addToBillBtn");
const clearBillBtn = document.getElementById("clearBillBtn");
const sellProductSelect = document.getElementById("sellProduct");

let sellCart = [];
let sellProductsCache = [];
let lastCompletedBillId = null;

const posBillActive =
    document.getElementById("posBillActive");

const posBillDone =
    document.getElementById("posBillDone");

const printBillBtn =
    document.getElementById("printBillBtn");

const shareBillPdfBtn =
    document.getElementById("shareBillPdfBtn");

const posModalTitle =
    document.getElementById("posModalTitle");

const posModalEyebrow =
    document.getElementById("posModalEyebrow");

function formatBillId(billId) {

    if (!billId) {
        return "—";
    }

    if (typeof billId === "string" && billId.startsWith("RH-")) {
        return billId;
    }

    return "#" + String(billId).slice(-6);

}

function openAddProductModal() {

    modal.style.display = "flex";

    setTimeout(() => {
        document.getElementById("name").focus();
    }, 50);

}

function showPosBillActive() {

    if (posBillActive) {
        posBillActive.hidden = false;
    }

    if (posBillDone) {
        posBillDone.hidden = true;
    }

    if (printBillBtn) {
        printBillBtn.hidden = true;
    }

    if (shareBillPdfBtn) {
        shareBillPdfBtn.hidden = true;
    }

    lastCompletedBillId = null;

    if (posModalTitle) {
        posModalTitle.textContent = "New Bill";
    }

    if (posModalEyebrow) {
        posModalEyebrow.textContent = "Point of Sale · F8";
    }

}

function showPosBillDone(result, cartSnapshot, checkout) {

    if (posBillActive) {
        posBillActive.hidden = true;
    }

    if (posBillDone) {
        posBillDone.hidden = false;
    }

    if (printBillBtn) {
        printBillBtn.hidden = false;
    }

    if (shareBillPdfBtn) {
        shareBillPdfBtn.hidden = false;
    }

    lastCompletedBillId = result.billId;

    if (posModalTitle) {
        posModalTitle.textContent =
            "Bill " + formatBillId(result.billId);
    }

    if (posModalEyebrow) {
        posModalEyebrow.textContent = "Completed";
    }

    document.getElementById("posDoneBillId").textContent =
        formatBillId(result.billId);

    document.getElementById("posDoneTotal").textContent =
        "₹" + result.totalSale;

    const metaParts = [];

    if (checkout.paymentMode) {
        metaParts.push(checkout.paymentMode);
    }

    if (checkout.customerName) {
        metaParts.push(checkout.customerName);
    }

    if (checkout.customerMobile) {
        metaParts.push(checkout.customerMobile);
    }

    document.getElementById("posDoneMeta").textContent =
        metaParts.length
            ? metaParts.join(" · ")
            : "";

    const doneBody =
        document.getElementById("posDoneCartBody");

    doneBody.innerHTML = cartSnapshot.map((item) => `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.qty}</td>
            <td>₹${item.sellPrice}</td>
            <td>₹${item.qty * item.sellPrice}</td>
        </tr>
    `).join("");

}

function resetSellBillForm(clearCart, keepDoneView) {

    if (clearCart) {
        sellCart = [];
    }

    clearSellQtyField();
    document.getElementById("customerName").value = "";
    document.getElementById("customerMobile").value = "";
    document.getElementById("paymentMode").value = "Cash";

    if (!keepDoneView) {
        showPosBillActive();
    }

    renderBillCart();
    updateSellProductFields();

}

async function refreshSellProductsCache() {

    const currentId =
        sellProductSelect.value;

    sellProductsCache =
        await window.electronAPI.getProducts();

    sellProductSelect.innerHTML = "";

    sellProductsCache.forEach((product) => {

        const inCart =
            cartQtyForProduct(product.id);

        const available =
            Number(product.stock) - inCart;

        sellProductSelect.innerHTML += `
            <option
                value="${product.id}"
                data-price="${product.sell_price}"
                data-stock="${product.stock}"
                data-available="${available}">
                ${product.name} (Available: ${available})
            </option>
        `;

    });

    if (currentId) {
        sellProductSelect.value = currentId;
    }

    updateSellProductFields();

}

async function openSellBillModal() {

    sellProductsCache =
        await window.electronAPI.getProducts();

    sellProductSelect.innerHTML = "";

    if (sellProductsCache.length === 0) {

        showToast(
            "No products in inventory. Add products first (F7).",
            "warn"
        );
        return;

    }

    await refreshSellProductsCache();

    showPosBillActive();
    sellModal.style.display = "flex";
    renderBillCart();

    clearSellQtyField();

    setTimeout(() => {
        restorePosFocus(false);
    }, 50);

}

function updateSellProductFields() {

    const option =
        sellProductSelect.options[
            sellProductSelect.selectedIndex
        ];

    if (!option) {
        return;
    }

    const price =
        option.getAttribute("data-price");

    document.getElementById("actualSellPrice").value =
        price || "";

}

function cartQtyForProduct(productId) {

    return sellCart
        .filter((item) => item.productId == productId)
        .reduce((sum, item) => sum + item.qty, 0);

}

async function addItemToBill() {

    const productId =
        sellProductSelect.value;

    const product =
        sellProductsCache.find(
            (p) => p.id == productId
        );

    if (!product) {
        showToast("Select a product.", "warn");
        restorePosFocus();
        return;
    }

    const qty =
        parseNum(document.getElementById("sellQty").value);

    const sellPrice =
        parseNum(
            document.getElementById("actualSellPrice").value
        );

    if (!qty || qty <= 0) {
        showToast("Enter a valid quantity.", "warn");
        restorePosFocus();
        return;
    }

    if (Number.isNaN(sellPrice) || sellPrice < 0) {
        showToast("Enter a valid sell price.", "warn");
        restorePosFocus();
        return;
    }

    const alreadyInCart =
        cartQtyForProduct(productId);

    const available =
        Number(product.stock) - alreadyInCart;

    if (available <= 0) {

        showToast(
            `No stock for "${product.name}".`,
            "error"
        );

        restorePosFocus();
        return;

    }

    if (qty > available) {

        showToast(
            `Only ${available} available for "${product.name}" (${alreadyInCart} already in bill).`,
            "error"
        );

        restorePosFocus();
        return;

    }

    const existingLine =
        sellCart.find(
            (item) =>
                item.productId == productId &&
                Number(item.sellPrice) === Number(sellPrice)
        );

    if (existingLine) {

        existingLine.qty += qty;
        existingLine.lineTotal =
            existingLine.qty * existingLine.sellPrice;

    } else {

        sellCart.push({
            productId: product.id,
            productName: product.name,
            qty,
            sellPrice,
            lineTotal: qty * sellPrice
        });

    }

    clearSellQtyField();

    renderBillCart();

    await refreshSellProductsCache();

    showToast(
        `${product.name} added to bill.`,
        "success"
    );

    restorePosFocus(false);

}

window.updateBillItemQty = function (index, rawQty) {

    const item = sellCart[index];

    if (!item) {
        return;
    }

    const qty = parseNum(rawQty);

    if (!qty || qty <= 0) {
        showToast("Quantity must be greater than 0.", "warn");
        renderBillCart();
        restorePosFocus();
        return;
    }

    const product =
        sellProductsCache.find(
            (p) => p.id == item.productId
        );

    const otherInCart =
        sellCart
            .filter((_, i) => i !== index)
            .filter((line) => line.productId == item.productId)
            .reduce((sum, line) => sum + line.qty, 0);

    const maxStock =
        product
            ? Number(product.stock)
            : item.qty + otherInCart;

    if (otherInCart + qty > maxStock) {

        showToast(
            `Not enough stock. Max for this line: ${maxStock - otherInCart}`,
            "error"
        );
        renderBillCart();
        restorePosFocus();
        return;

    }

    item.qty = qty;
    item.lineTotal = item.qty * item.sellPrice;

    renderBillCart();
    refreshSellProductsCache();

};

function renderBillCart() {

    const tbody =
        document.getElementById("billCartBody");

    if (!sellCart.length) {

        tbody.innerHTML = `
            <tr id="billCartEmpty">
                <td colspan="5" class="pos-cart-empty">No items yet — add products to this bill</td>
            </tr>
        `;
        updateBillTotals();
        return;

    }

    tbody.innerHTML = "";

    sellCart.forEach((item, index) => {

        tbody.innerHTML += `
            <tr>
                <td><strong>${item.productName}</strong></td>
                <td>
                    <input
                        type="text"
                        class="cart-qty-input input-num app-input"
                        inputmode="numeric"
                        value="${item.qty}"
                        onchange="updateBillItemQty(${index}, this.value)"
                        onclick="event.stopPropagation()">
                </td>
                <td>₹${item.sellPrice}</td>
                <td>₹${item.lineTotal}</td>
                <td>
                    <button
                        type="button"
                        class="btn--icon-remove"
                        onclick="removeBillItem(${index})"
                        aria-label="Remove">×</button>
                </td>
            </tr>
        `;

    });

    updateBillTotals();

}

function updateBillTotals() {

    const subtotal =
        sellCart.reduce(
            (sum, item) => sum + item.lineTotal,
            0
        );

    const pieces =
        sellCart.reduce(
            (sum, item) => sum + item.qty,
            0
        );

    document.getElementById("billSubtotal").innerText =
        "₹" + subtotal;

    document.getElementById("billGrandTotal").innerText =
        "₹" + subtotal;

    document.getElementById("billItemCount").innerText =
        `${sellCart.length} item${sellCart.length === 1 ? "" : "s"} · ${pieces} pcs`;

}

window.removeBillItem = function (index) {

    sellCart.splice(index, 1);
    renderBillCart();
    refreshSellProductsCache();

};

async function completeBill() {

    if (!sellCart.length) {

        showToast("Add at least one item to the bill.", "warn");
        restorePosFocus();
        return;

    }

    const bill = {

        items: sellCart.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            sellPrice: item.sellPrice
        })),

        paymentMode:
            document.getElementById("paymentMode").value,

        customerName:
            document.getElementById("customerName").value.trim(),

        customerMobile:
            document.getElementById("customerMobile").value.trim()

    };

    try {

        const result =
            await window.electronAPI.sellBill(bill);

        const cartSnapshot = sellCart.map((item) => ({ ...item }));

        const checkout = {
            paymentMode: bill.paymentMode,
            customerName: bill.customerName,
            customerMobile: bill.customerMobile
        };

        showToast(
            `Bill ${formatBillId(result.billId)} saved · ₹${result.totalSale}`,
            "success"
        );

        sellCart = [];
        resetSellBillForm(false, true);

        showPosBillDone(result, cartSnapshot, checkout);

        sellModal.style.display = "flex";

        await loadProducts();
        await loadSales();
        await loadDashboard();

        if (typeof loadCharts === "function") {
            await loadCharts();
        }

    } catch (err) {

        showToast(err.message || String(err), "error");
        restorePosFocus();

    }

}

function closeSellModalFn() {

    sellModal.style.display = "none";
    resetSellBillForm(true);

}

if (printBillBtn) {

    printBillBtn.addEventListener("click", async () => {

        if (
            !lastCompletedBillId ||
            typeof window.printBillById !== "function"
        ) {
            showToast("No bill to print.", "warn");
            return;
        }

        await window.printBillById(lastCompletedBillId);

    });

}

async function shareLastBillPdf() {

    if (
        !lastCompletedBillId ||
        typeof window.exportBillPdfById !== "function"
    ) {
        showToast("No bill to export.", "warn");
        return;
    }

    await window.exportBillPdfById(lastCompletedBillId);

}

if (shareBillPdfBtn) {
    shareBillPdfBtn.addEventListener("click", shareLastBillPdf);
}

const shareBillPdfDoneBtn =
    document.getElementById("shareBillPdfDoneBtn");

if (shareBillPdfDoneBtn) {
    shareBillPdfDoneBtn.addEventListener("click", shareLastBillPdf);
}

const printBillDoneBtn =
    document.getElementById("printBillDoneBtn");

if (printBillDoneBtn) {

    printBillDoneBtn.addEventListener("click", async () => {

        if (
            !lastCompletedBillId ||
            typeof window.printBillById !== "function"
        ) {
            showToast("No bill to print.", "warn");
            return;
        }

        await window.printBillById(lastCompletedBillId);

    });

}

const newBillAfterSaleBtn =
    document.getElementById("newBillAfterSaleBtn");

const closeBillDoneBtn =
    document.getElementById("closeBillDoneBtn");

if (newBillAfterSaleBtn) {

    newBillAfterSaleBtn.addEventListener("click", async () => {

        resetSellBillForm(true);
        await refreshSellProductsCache();
        restorePosFocus(false);

    });

}

if (closeBillDoneBtn) {

    closeBillDoneBtn.addEventListener("click", closeSellModalFn);

}

// --------------------
// ADD PRODUCT
// --------------------

addBtn.addEventListener("click", () => {
    closeAllViews();
    openAddProductModal();
    setActiveTab("addBtn");
});

function closeAddProductModal() {

    modal.style.display = "none";

}

function closeStockModalFn() {

    stockModal.style.display = "none";

}

closeAddModal.addEventListener("click", closeAddProductModal);

const cancelAddBtn =
    document.getElementById("cancelAddBtn");

if (cancelAddBtn) {
    cancelAddBtn.addEventListener("click", closeAddProductModal);
}

closeStockModal.addEventListener("click", closeStockModalFn);

const cancelStockBtn =
    document.getElementById("cancelStockBtn");

if (cancelStockBtn) {
    cancelStockBtn.addEventListener("click", closeStockModalFn);
}

closeSellModal.addEventListener("click", closeSellModalFn);

const cancelSellBtn =
    document.getElementById("cancelSellBtn");

if (cancelSellBtn) {
    cancelSellBtn.addEventListener("click", closeSellModalFn);
}

if (addToBillBtn) {
    addToBillBtn.addEventListener("click", addItemToBill);
}

if (clearBillBtn) {
    clearBillBtn.addEventListener("click", () => {
        if (sellCart.length && !confirm("Clear all items from this bill?")) {
            return;
        }
        sellCart = [];
        renderBillCart();
    });
}

if (sellProductSelect) {
    sellProductSelect.addEventListener("change", updateSellProductFields);
}

sellProductBtn.addEventListener("click", completeBill);

let repDailyChartInstance = null;
let repMonthlyChartInstance = null;
let repProfitChartInstance = null;
let repExpenseChartInstance = null;

async function loadReportsAnalytics(range = null) {
    try {
        const data = await window.electronAPI.getReportsAnalytics(range);
        
        // 1. Summaries
        document.getElementById("repSalesToday").textContent = "₹" + Math.round(data.salesSummary.today);
        document.getElementById("repSalesWeek").textContent = "₹" + Math.round(data.salesSummary.week);
        document.getElementById("repSalesMonth").textContent = "₹" + Math.round(data.salesSummary.month);
        document.getElementById("repSalesYear").textContent = "₹" + Math.round(data.salesSummary.year);

        document.getElementById("repProfitToday").textContent = "₹" + Math.round(data.profitSummary.today);
        document.getElementById("repProfitWeek").textContent = "₹" + Math.round(data.profitSummary.week);
        document.getElementById("repProfitMonth").textContent = "₹" + Math.round(data.profitSummary.month);
        document.getElementById("repProfitYear").textContent = "₹" + Math.round(data.profitSummary.year);

        document.getElementById("repExpenseToday").textContent = "₹" + Math.round(data.expenseSummary.today);
        document.getElementById("repExpenseWeek").textContent = "₹" + Math.round(data.expenseSummary.week);
        document.getElementById("repExpenseMonth").textContent = "₹" + Math.round(data.expenseSummary.month);
        document.getElementById("repExpenseYear").textContent = "₹" + Math.round(data.expenseSummary.year);

        document.getElementById("repInvCount").textContent = data.inventorySummary.productsCount;
        document.getElementById("repInvStock").textContent = data.inventorySummary.stockCount;
        document.getElementById("repInvValue").textContent = "₹" + Math.round(data.inventorySummary.value);
        document.getElementById("repInvSales").textContent = "₹" + Math.round(data.inventorySummary.potentialSales);

        // 2. Payment Breakdown
        const cashVal = data.paymentBreakdown.cash || 0;
        const upiVal = data.paymentBreakdown.upi || 0;
        const creditVal = data.paymentBreakdown.credit || 0;
        const payTotal = cashVal + upiVal + creditVal;

        document.getElementById("payCashVal").textContent = "₹" + Math.round(cashVal);
        document.getElementById("payUpiVal").textContent = "₹" + Math.round(upiVal);
        document.getElementById("payCreditVal").textContent = "₹" + Math.round(creditVal);

        const cashPct = payTotal > 0 ? (cashVal / payTotal) * 100 : 0;
        const upiPct = payTotal > 0 ? (upiVal / payTotal) * 100 : 0;
        const creditPct = payTotal > 0 ? (creditVal / payTotal) * 100 : 0;

        document.getElementById("payCashBar").style.width = cashPct + "%";
        document.getElementById("payUpiBar").style.width = upiPct + "%";
        document.getElementById("payCreditBar").style.width = creditPct + "%";

        // 3. Best/Lowest/Profit lists
        const buildList = (elId, list, type) => {
            const el = document.getElementById(elId);
            if (!el) return;
            if (!list.length) {
                el.innerHTML = `<li style="color: var(--text-muted); font-size: var(--text-sm); text-align: center; padding: 12px 0;">No sales recorded</li>`;
                return;
            }
            el.innerHTML = list.map(item => {
                const labelVal = type === "profit" 
                    ? "₹" + Math.round(item.totalProfit) 
                    : item.totalQty + " sold";
                return `
                    <li style="display: flex; justify-content: space-between; font-size: var(--text-sm); padding: 6px 0; border-bottom: 1px solid var(--border-light);">
                        <span style="font-weight: 700; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 170px;">${item.name}</span>
                        <span style="font-weight: 800; color: var(--accent);">${labelVal}</span>
                    </li>
                `;
            }).join("");
        };

        buildList("repBestSellers", data.bestSellers, "sales");
        buildList("repLowestSellers", data.lowestSellers, "sales");
        buildList("repTopProfit", data.topProfitItems, "profit");

        // 4. Chart.js Daily Sales & Profit Chart
        const dailyCtx = document.getElementById("repDailyChart");
        if (dailyCtx) {
            if (repDailyChartInstance) repDailyChartInstance.destroy();
            const dailyLabels = data.dailySalesTrend.map(d => d.day);
            const dailySalesData = data.dailySalesTrend.map(d => d.sales);
            const dailyProfitData = data.dailySalesTrend.map(d => d.profit);
            
            repDailyChartInstance = new Chart(dailyCtx, {
                type: "line",
                data: {
                    labels: dailyLabels,
                    datasets: [
                        { label: "Sales", data: dailySalesData, borderColor: "#4f46e5", backgroundColor: "rgba(79, 70, 229, 0.1)", fill: true, tension: 0.3 },
                        { label: "Profit", data: dailyProfitData, borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.1)", fill: true, tension: 0.3 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        // Monthly Sales Chart
        const monthlyCtx = document.getElementById("repMonthlyChart");
        if (monthlyCtx) {
            if (repMonthlyChartInstance) repMonthlyChartInstance.destroy();
            const monthlyLabels = data.monthlySalesTrend.map(d => d.month);
            const monthlySalesData = data.monthlySalesTrend.map(d => d.sales);

            repMonthlyChartInstance = new Chart(monthlyCtx, {
                type: "bar",
                data: {
                    labels: monthlyLabels,
                    datasets: [{ label: "Monthly Sales", data: monthlySalesData, backgroundColor: "#0284c7" }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        // Profit Trend Chart
        const profitCtx = document.getElementById("repProfitChart");
        if (profitCtx) {
            if (repProfitChartInstance) repProfitChartInstance.destroy();
            const profitLabels = data.profitTrend.map(d => d.day);
            const profitTrendData = data.profitTrend.map(d => d.profit);

            repProfitChartInstance = new Chart(profitCtx, {
                type: "line",
                data: {
                    labels: profitLabels,
                    datasets: [{ label: "Profit", data: profitTrendData, borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.05)", fill: true, tension: 0.3 }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        // Expense Trend Chart
        const expenseCtx = document.getElementById("repExpenseChart");
        if (expenseCtx) {
            if (repExpenseChartInstance) repExpenseChartInstance.destroy();
            const expLabels = data.expenseTrend.map(d => d.day);
            const expTrendData = data.expenseTrend.map(d => d.amount);

            repExpenseChartInstance = new Chart(expenseCtx, {
                type: "line",
                data: {
                    labels: expLabels,
                    datasets: [{ label: "Expenses", data: expTrendData, borderColor: "#ea580c", backgroundColor: "rgba(234, 88, 12, 0.05)", fill: true, tension: 0.3 }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        // 5. Detailed Sales Log
        await runDateReport();

    } catch (err) {
        console.error("Reports analytics load failed:", err);
    }
}

reportsBtn.addEventListener("click", async () => {
    closeAllViews();
    reportsModal.style.display = "flex";
    
    // Set default dates if empty
    const fromEl = document.getElementById("reportFrom");
    const toEl = document.getElementById("reportTo");
    if (fromEl && !fromEl.value) {
        fromEl.value = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }
    if (toEl && !toEl.value) {
        toEl.value = new Date().toISOString().split("T")[0];
    }
    
    await loadReportsAnalytics();
    setActiveTab("reportsBtn");
});

closeReportsModal.addEventListener("click", () => {
    reportsModal.style.display = "none";
});

// Run report filter click
const runDateReportBtn = document.getElementById("runDateReportBtn");
if (runDateReportBtn) {
    runDateReportBtn.addEventListener("click", async () => {
        const from = document.getElementById("reportFrom").value;
        const to = document.getElementById("reportTo").value;
        await loadReportsAnalytics({ from, to });
    });
}

// Search Reports Log keyup search listener
const reportSearch = document.getElementById("reportSearch");
if (reportSearch) {
    reportSearch.addEventListener("keyup", () => {
        const searchVal = reportSearch.value.toLowerCase().trim();
        const rows = document.querySelectorAll("#reportContent tbody tr");
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchVal) ? "" : "none";
        });
    });
}

// Print Report trigger
const printReportBtn = document.getElementById("printReportBtn");
if (printReportBtn) {
    printReportBtn.addEventListener("click", () => {
        window.print();
    });
}

// Export PDF trigger
const exportPdfBtn = document.getElementById("exportPdfBtn");
if (exportPdfBtn) {
    exportPdfBtn.addEventListener("click", () => {
        window.print();
    });
}

if (priceHistoryReportBtn) {
    priceHistoryReportBtn.addEventListener(
        "click",
        async () => {

            const history =
                await window.electronAPI.getPriceHistory();

            if (priceHistoryBody) {
                priceHistoryBody.innerHTML = "";

                history.forEach(item => {

                    priceHistoryBody.innerHTML += `
                        <tr>
                            <td>${item.product_name}</td>
                            <td>₹${item.old_buy_price}</td>
                            <td>₹${item.new_buy_price}</td>
                            <td>₹${item.old_sell_price}</td>
                            <td>₹${item.new_sell_price}</td>
                            <td>${item.change_date}</td>
                        </tr>
                    `;

                });
            }

            if (priceHistoryModal) {
                priceHistoryModal.style.display =
                    "flex";
            }

        }
    );
}
if (closePriceHistoryModal) {
    closePriceHistoryModal.addEventListener(
        "click",
        () => {

            if (priceHistoryModal) {
                priceHistoryModal.style.display =
                    "none";
            }

        }
    );
}
if (lowStockReportBtn) {
    lowStockReportBtn.addEventListener(
        "click",
        async () => {

            const products =
                await window.electronAPI.getProducts();

            const lowStock =
                products.filter(
                    p => Number(p.stock) <= 10
                );

            if (reportContent) {
                if (lowStock.length === 0) {

                    reportContent.innerHTML =
                        "<h3>All Good</h3><p>No low stock products right now.</p>";

                    return;
                }

                let html =
                    "<h3>Low Stock Products</h3><ul class='report-list'>";

                lowStock.forEach(product => {

                    html += `
                        <li>
                            ${product.name}
                            - Stock:
                            ${product.stock}
                        </li>
                    `;

                });

                html += "</ul>";

                reportContent.innerHTML =
                    html;
            }

        }
    );
}
if (todayReportBtn) {
    todayReportBtn.addEventListener(
        "click",
        async () => {

            const sales =
                await window.electronAPI.getSales();

            let totalSale = 0;
            let totalProfit = 0;
            let totalQty = 0;

            const today =
                new Date()
                    .toISOString()
                    .split("T")[0];

            sales.forEach(sale => {

                if (
                    sale.sale_date &&
                    sale.sale_date.startsWith(today)
                ) {

                    totalSale += Number(sale.total_sale);
                    totalProfit += Number(sale.profit);
                    totalQty += Number(sale.qty);

                }

            });
            if (reportContent) {
                reportContent.innerHTML = `
                    <h3>Today's Report</h3>

                    <p>
                        Total Sales:
                        ₹${totalSale}
                    </p>

                    <p>
                        Total Profit:
                        ₹${totalProfit}
                    </p>

                    <p>
                        Total Items Sold:
                        ${totalQty}
                    </p>
                `;
            }

        }
    );
}
if (profitReportBtn) {
    profitReportBtn.addEventListener(
        "click",
        async () => {

            const sales =
                await window.electronAPI.getSales();

            let totalProfit = 0;
            let todayProfit = 0;

            const today =
                new Date()
                    .toISOString()
                    .split("T")[0];

            sales.forEach(sale => {

                totalProfit +=
                    Number(sale.profit);

                if (
                    sale.sale_date &&
                    sale.sale_date.startsWith(today)
                ) {

                    todayProfit +=
                        Number(sale.profit);

                }

            });

            if (reportContent) {
                reportContent.innerHTML = `
                    <h3>Profit Report</h3>

                    <p>
                        Today's Profit:
                        ₹${todayProfit}
                    </p>

                    <p>
                        Total Profit:
                        ₹${totalProfit}
                    </p>
                `;
            }

        }
    );
}
if (monthlyReportBtn) {
    monthlyReportBtn.addEventListener(
        "click",
        async () => {

            const sales =
                await window.electronAPI.getSales();

            const currentMonth =
                new Date().getMonth();

            const currentYear =
                new Date().getFullYear();

            let totalSales = 0;
            let totalProfit = 0;
            let totalQty = 0;
            let totalTransactions = 0;

            sales.forEach(sale => {

                const saleDate =
                    new Date(sale.sale_date);

                if (
                    saleDate.getMonth() === currentMonth &&
                    saleDate.getFullYear() === currentYear
                ) {

                    totalSales +=
                        Number(sale.total_sale);

                    totalProfit +=
                        Number(sale.profit);

                    totalQty +=
                        Number(sale.qty);

                    totalTransactions++;

                }

            });

            if (reportContent) {
                reportContent.innerHTML = `
                    <h3>Monthly Report</h3>

                    <p>Total Sales: ₹${totalSales}</p>

                    <p>Total Profit: ₹${totalProfit}</p>

                    <p>Products Sold: ${totalQty}</p>

                    <p>Transactions: ${totalTransactions}</p>
                `;
            }

        }
    );
}
if (paymentReportBtn) {
    paymentReportBtn.addEventListener(
        "click",
        async () => {

            const sales =
                await window.electronAPI.getSales();

            let cash = 0;
            let upi = 0;
            let credit = 0;

            sales.forEach(sale => {

                if (sale.payment_mode === "Cash") {

                    cash +=
                        Number(sale.total_sale);

                }

                else if (
                    sale.payment_mode === "UPI"
                ) {

                    upi +=
                        Number(sale.total_sale);

                }

                else if (
                    sale.payment_mode === "Credit"
                ) {

                    credit +=
                        Number(sale.total_sale);

                }

            });

            if (reportContent) {
                reportContent.innerHTML = `
                    <h3>Payment Report</h3>

                    <p>Cash Sales: ₹${cash}</p>

                    <p>UPI Sales: ₹${upi}</p>

                    <p>Credit Sales: ₹${credit}</p>

                    <p>
                        Total Sales:
                        ₹${cash + upi + credit}
                    </p>
                `;
            }

        }
    );
}
if (bestSellingReportBtn) {
    bestSellingReportBtn.addEventListener(
        "click",
        async () => {

            const sales =
                await window.electronAPI.getSales();

            const products = {};

            sales.forEach(sale => {

                if (!products[sale.product_name]) {

                    products[sale.product_name] = 0;

                }

                products[sale.product_name] +=
                    Number(sale.qty);

            });

            const sorted =
                Object.entries(products)
                .sort(
                    (a, b) => b[1] - a[1]
                )
                .slice(0, 10);

            let html =
                "<h3>Best Selling Products</h3><ol>";

            sorted.forEach(item => {

                html += `
                    <li>
                        ${item[0]}
                        - ${item[1]} sold
                    </li>
                `;

            });

            html += "</ol>";

            if (reportContent) {
                reportContent.innerHTML =
                    html;
            }

        }
    );
}
if (profitProductsReportBtn) {
    profitProductsReportBtn.addEventListener(
        "click",
        async () => {

            const sales =
                await window.electronAPI.getSales();

            const products = {};

            sales.forEach(sale => {

                if (!products[sale.product_name]) {

                    products[sale.product_name] = 0;

                }

                products[sale.product_name] +=
                    Number(sale.profit);

            });

            const sorted =
                Object.entries(products)
                .sort(
                    (a, b) => b[1] - a[1]
                )
                .slice(0, 10);

            let html =
                "<h3>Highest Profit Products</h3><ol>";

            sorted.forEach(item => {

                html += `
                    <li>
                        ${item[0]}
                        - ₹${item[1]}
                    </li>
                `;

            });

            html += "</ol>";

            if (reportContent) {
                reportContent.innerHTML =
                    html;
            }

        }
    );
}

const billHistoryReportBtn =
    document.getElementById("billHistoryReportBtn");

if (billHistoryReportBtn) {

    billHistoryReportBtn.addEventListener("click", async () => {

        if (typeof openBillHistoryModal === "function") {
            await openBillHistoryModal();
        }

    });

}

const closeBillHistoryModalBtn =
    document.getElementById("closeBillHistoryModal");

if (closeBillHistoryModalBtn) {

    closeBillHistoryModalBtn.addEventListener("click", () => {

        const modal =
            document.getElementById("billHistoryModal");

        if (modal) {
            modal.style.display = "none";
        }

    });

}

const expensesBtnEl =
    document.getElementById("expensesBtn");

if (expensesBtnEl) {

    expensesBtnEl.addEventListener("click", async () => {
        closeAllViews();
        if (typeof openExpenseModal === "function") {
            await openExpenseModal();
        }
        setActiveTab("expensesBtn");
    });

}

if (salesHistoryReportBtn) {
    salesHistoryReportBtn.addEventListener(
        "click",
        async () => {

            const sales =
                await window.electronAPI.getSales();

            if (salesHistoryBody) {
                salesHistoryBody.innerHTML = "";

                const printedBills = new Set();

                sales.forEach(sale => {

                    let billActions = "—";

                    if (
                        sale.bill_id &&
                        !printedBills.has(sale.bill_id)
                    ) {

                        printedBills.add(sale.bill_id);

                        billActions = `
                            <button type="button" class="btn btn--ghost btn--sm"
                                onclick="printBillById('${sale.bill_id}')">Print</button>
                            <button type="button" class="btn btn--ghost btn--sm"
                                onclick="exportBillPdfById('${sale.bill_id}')">PDF</button>
                        `;

                    }

                    salesHistoryBody.innerHTML += `
                        <tr>
                            <td><strong>${sale.product_name}</strong></td>
                            <td>${sale.qty}</td>
                            <td>₹${sale.total_sale}</td>
                            <td>₹${sale.profit}</td>
                            <td>${sale.bill_id ? `<span class="bill-tag">${formatBillId(sale.bill_id)}</span>` : "—"}</td>
                            <td>${paymentBadge(sale.payment_mode)}</td>
                            <td class="bill-actions">${billActions}</td>
                        </tr>
                    `;

                });
            }

            if (salesHistoryModal) {
                salesHistoryModal.style.display =
                    "flex";
            }

        }
    );
}

if (closeSalesHistoryModal) {
    closeSalesHistoryModal.addEventListener(
        "click",
        () => {

            if (salesHistoryModal) {
                salesHistoryModal.style.display =
                    "none";
            }

        }
    );
}


// --------------------
// STOCK IN / OUT
// --------------------

let stockProductsCache = [];

async function populateStockProductSelect() {

    stockProductsCache =
        await window.electronAPI.getProducts();

    const select =
        document.getElementById("stockProduct");

    const selectedId =
        select.value;

    select.innerHTML = "";

    stockProductsCache.forEach((product) => {

        select.innerHTML += `
            <option value="${product.id}">
                ${product.name}
                (Stock: ${product.stock})
            </option>
        `;

    });

    if (selectedId) {
        select.value = selectedId;
    }

    updateStockCurrentHint();

}

function updateStockCurrentHint() {

    const hint =
        document.getElementById("stockCurrentHint");

    if (!hint) {
        return;
    }

    const select =
        document.getElementById("stockProduct");

    const product =
        stockProductsCache.find(
            (p) => p.id == select.value
        );

    if (!product) {

        hint.textContent =
            "Select a product to see current stock";

        hint.classList.remove("stock-info-card--low");

        return;

    }

    const stock =
        Number(product.stock);

    hint.textContent =
        `${product.name} — Current stock: ${stock} units`;

    if (stock <= 10) {
        hint.classList.add("stock-info-card--low");
    } else {
        hint.classList.remove("stock-info-card--low");
    }

}

const stockProductSelect =
    document.getElementById("stockProduct");

if (stockProductSelect) {

    stockProductSelect.addEventListener(
        "change",
        updateStockCurrentHint
    );

}

document.querySelectorAll("#stockQuickBtns .qty-quick-btn").forEach((btn) => {

    btn.addEventListener("click", () => {

        const input =
            document.getElementById("newStock");

        const delta =
            parseNum(btn.getAttribute("data-qty"));

        const current =
            parseNum(input.value);

        const base =
            Number.isNaN(current) ? 0 : current;

        input.value =
            base + delta > 0
                ? `+${base + delta}`
                : String(base + delta);

        input.focus();

    });

});

stockBtn.addEventListener("click", async () => {
    closeAllViews();
    await populateStockProductSelect();
    stockModal.style.display = "flex";
    setTimeout(() => {
        const newStockEl = document.getElementById("newStock");
        if (newStockEl) {
            newStockEl.value = "";
            newStockEl.focus();
        }
    }, 50);
    setActiveTab("stockBtn");
});

sellBtn.addEventListener("click", async () => {
    closeAllViews();
    await openSellBillModal();
    setActiveTab("sellBtn");
});

// --------------------
// CLOSE MODALS
// --------------------

function setupModalBackdropClose() {

    document.querySelectorAll(".modal").forEach((modalEl) => {

        modalEl.addEventListener("mousedown", (e) => {

            if (e.target !== modalEl) {
                return;
            }

            modalEl.style.display = "none";

            if (modalEl === sellModal) {
                resetSellBillForm(true);
            }

            if (
                modalEl.id === "accountModal" &&
                typeof closeAccountModal === "function"
            ) {
                closeAccountModal();
            }

        });

    });

    document.querySelectorAll(".modal-content").forEach((content) => {

        content.addEventListener("mousedown", (e) => {

            if (e.target === content) {
                e.stopPropagation();
            }

        });

    });

}

setupModalBackdropClose();
setupInputFocusHelpers();

document.addEventListener("click", (e) => {

    if (e.target.closest("#closeAccountModal")) {

        e.preventDefault();
        e.stopPropagation();

        if (typeof closeAccountModal === "function") {
            closeAccountModal();
        } else {

            const modal =
                document.getElementById("accountModal");

            if (modal) {
                modal.style.display = "none";
            }

        }

        return;

    }

    if (e.target.closest("#cancelAccountBtn")) {

        e.preventDefault();
        e.stopPropagation();

        if (typeof closeAccountModal === "function") {
            closeAccountModal();
        }

    }

});

// --------------------
// SAVE PRODUCT
// --------------------

saveBtn.addEventListener("click", async () => {

    const product = {

        name:
            document.getElementById("name").value,

        category:
            document.getElementById("category").value,

        buyPrice:
            document.getElementById("buyPrice").value,

        sellPrice:
            document.getElementById("sellPrice").value,

        stock:
            document.getElementById("stock").value

    };


    try {

        const result =
            await window.electronAPI.saveProduct(product);

        if (result.success) {

            await loadProducts();

            document.getElementById("name").value = "";
            document.getElementById("category").value = "";
            document.getElementById("buyPrice").value = "";
            document.getElementById("sellPrice").value = "";
            document.getElementById("stock").value = "";

            document.getElementById("name").focus();

        }

    } catch (err) {

        console.error(err);

    }

});

// --------------------
// STOCK UPDATE
// --------------------

updateStockBtn.addEventListener("click", async (e) => {

    e.preventDefault();
    e.stopPropagation();

    const id =
        document.getElementById("stockProduct").value;

    const qty =
        parseNum(
            document.getElementById("newStock").value
        );

    if (qty === 0 || Number.isNaN(qty)) {
        showToast("Enter a quantity like +50 or -20.", "warn");
        document.getElementById("newStock").focus();
        return;
    }

    const products =
        await window.electronAPI.getProducts();

    const selectedProduct =
        products.find(
            (p) => p.id == id
        );

    if (!selectedProduct) {
        return;
    }

    const finalStock =
        Number(selectedProduct.stock) + qty;

    if (finalStock < 0) {
        showToast("Stock cannot go below 0.", "error");
        document.getElementById("newStock").focus();
        return;
    }

    await window.electronAPI.updateStock(
        id,
        finalStock
    );

    await loadProducts();
    await populateStockProductSelect();

    document.getElementById("newStock").value = "";

    showToast("Stock updated.", "success");

    stockModal.style.display = "flex";

    setTimeout(() => {
        document.getElementById("newStock").focus();
    }, 50);

});

// --------------------
// DELETE PRODUCT
// --------------------

async function deleteProduct(id) {

    const confirmDelete =
        confirm("Delete this product?");

    if (!confirmDelete) return;

    await window.electronAPI.deleteProduct(id);

    await loadProducts();
await loadSales();
await loadDashboard();

}

window.deleteProduct = deleteProduct;

async function editProduct(id) {


    const products =
        await window.electronAPI.getProducts();

    const product =
        products.find(
            p => p.id == id
        );

    if (!product) return;

    document.getElementById("editId").value =
        product.id;

    document.getElementById("editName").value =
        product.name;

    document.getElementById("editCategory").value =
        product.category;

    document.getElementById("editBuyPrice").value =
        product.buy_price;

    document.getElementById("editSellPrice").value =
        product.sell_price;

    document.getElementById("editModal")
        .style.display = "flex";
        setTimeout(() => {
            document.getElementById("editName").focus();
            
        }, 50);

}

window.editProduct = editProduct;

closeEditModal.addEventListener(
    "click",
    () => {

        editModal.style.display =
            "none";

    }
);

saveEditBtn.addEventListener(
    "click",
    async () => {

        const product = {

            id:
                document.getElementById("editId").value,

            name:
                document.getElementById("editName").value,

            category:
                document.getElementById("editCategory").value,

            buyPrice:
                document.getElementById("editBuyPrice").value,

            sellPrice:
                document.getElementById("editSellPrice").value

        };


        try {

            const result =
                await window.electronAPI.editProduct(
                    product
                );

            console.log(result);

            editModal.style.display = "none";

            await loadProducts();

        } catch (err) {

            console.error(err);

        }

    }
);


// --------------------
// LOAD PRODUCTS
// --------------------

async function loadProducts() {

    const products =
        await window.electronAPI.getProducts();

    const table =
        document.getElementById("inventoryBody");

    if (!table) {
        return;
    }

    table.innerHTML = "";

   products.forEach(product => {

    const lowStock =
        Number(product.stock) <= 10;

    table.innerHTML += `
        <tr class="${lowStock ? "row--low-stock" : ""}">
            <td><strong>${product.name}</strong></td>
            <td>${product.stock}</td>
            <td>
                ${
                    lowStock
                    ? '<span class="badge badge--low">⚠ Low Stock</span>'
                    : '<span class="badge badge--ok">In Stock</span>'
                }
            </td>
            <td>₹${product.buy_price}</td>
            <td>₹${product.sell_price}</td>
            <td class="td-actions">
                <button type="button" class="btn btn--sm btn--edit" onclick="editProduct(${product.id})">Edit</button>
                <button type="button" class="btn btn--sm btn--danger" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        </tr>
    `;

});

    document.getElementById("totalProducts").innerText =
        products.length;

    const totalStock =
        products.reduce(
            (sum, p) => sum + Number(p.stock),
            0
        );

    document.getElementById("totalStock").innerText =
        totalStock;

}

async function refreshAllData() {

    try {
        await loadProducts();
    } catch (err) {
        console.error("Products load failed:", err);
    }

    try {
        await loadSales();
    } catch (err) {
        console.error("Sales load failed:", err);
    }

    try {
        await loadDashboard();
    } catch (err) {
        console.error("Dashboard load failed:", err);
    }

    try {
        await loadProfile();
    } catch (err) {
        console.error("Profile load failed:", err);
    }

    if (typeof loadCharts === "function") {

        try {
            await loadCharts();
        } catch (err) {
            console.error("Charts refresh failed:", err);
        }

    }

}

window.refreshAllData = refreshAllData;

function updateDarkModeButton() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    
    const headerThemeToggle = document.getElementById("headerThemeToggle");
    if (headerThemeToggle) {
        headerThemeToggle.textContent = isDark ? "🌙" : "☀️";
        headerThemeToggle.setAttribute("aria-label", isDark ? "Toggle Light Mode" : "Toggle Dark Mode");
    }
}

function applyTheme(theme) {
    const isDark = theme === "dark";

    if (isDark) {
        document.documentElement.setAttribute("data-theme", "dark");
        mainSection.classList.add("dark-mode");
    } else {
        document.documentElement.removeAttribute("data-theme");
        mainSection.classList.remove("dark-mode");
    }

    updateDarkModeButton();
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark" || savedTheme === "light") {
        applyTheme(savedTheme);
        return;
    }

    // Default to light mode for new users when they first open the app
    applyTheme("light");
}

(async function initApp() {

    const mainEl =
        document.querySelector(".main");

    mainEl?.classList.add("main--loading");

    loadSavedTheme();

    try {

        if (typeof initFeatures === "function") {

            const ok = await initFeatures();

            if (!ok) {
                return;
            }

        }

        const dateEl =
            document.getElementById("dashboardDate");

        if (dateEl) {

            dateEl.textContent =
                new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                });

        }

        await refreshAllData();

    } catch (err) {

        console.error(err);

        showToast(
            "Could not load shop data. " +
            (err.message || "Please restart the app."),
            "error"
        );

    } finally {

        mainEl?.classList.remove("main--loading");

    }

})();

function setMetaLine(el, prefix, value) {

    if (value) {

        el.innerText = prefix + value;
        el.hidden = false;

    } else {

        el.innerText = "";
        el.hidden = true;

    }

}

function openProfileModal() {

    loadProfile().then(() => {

        profileModal.style.display = "flex";

        setTimeout(() => {
            document.getElementById("profileShopName").focus();
        }, 50);

    });

}

function resizeLogoDataUrl(dataUrl, maxSize) {

    return new Promise((resolve) => {

        const img = new Image();

        img.onload = () => {

            let { width, height } = img;

            if (width <= maxSize && height <= maxSize) {

                resolve(dataUrl);
                return;

            }

            const scale =
                maxSize / Math.max(width, height);

            width = Math.round(width * scale);
            height = Math.round(height * scale);

            const canvas =
                document.createElement("canvas");

            canvas.width = width;
            canvas.height = height;

            const ctx =
                canvas.getContext("2d");

            ctx.drawImage(img, 0, 0, width, height);

            resolve(
                canvas.toDataURL("image/jpeg", 0.85)
            );

        };

        img.onerror = () => resolve(dataUrl);

        img.src = dataUrl;

    });

}

function setLogoPreview(imgEl, placeholderEl, logoData) {
    if (!imgEl) return;
    if (logoData) {
        imgEl.src = logoData;
        imgEl.style.display = "block";
        if (placeholderEl) placeholderEl.style.display = "none";
    } else {
        imgEl.removeAttribute("src");
        imgEl.style.display = "none";
        if (placeholderEl) placeholderEl.style.display = "flex";
    }
}

function applyProfileToUI(profile) {

    const shopName =
        (profile?.shop_name || "").trim() || "My Shop";

    const ownerName =
        (profile?.owner_name || "").trim() || "Owner";

    const mobile =
        (profile?.mobile || "").trim() || "-";

    const address =
        (profile?.address || "").trim() || "-";

    const gst =
        (profile?.gst_number || "").trim() || "-";

    const logo = profile?.logo || "";
    
    const email =
        (profile?.email || "").trim() || "-";

    const createdAt =
        (profile?.created_at || "").trim() || "2026-05-27";

    const shopImage = profile?.banner_image || profile?.shop_image || "";

    const initialsEl = document.getElementById("profileLogoPlaceholder");
    if (initialsEl) {
        initialsEl.textContent = shopInitials(shopName);
    }

    const shopNameEl = document.getElementById("sidebarShopName");
    if (shopNameEl) {
        shopNameEl.innerText = shopName;
        // Let CSS handle the dynamic light/dark theme text color of #sidebarShopName
    }

    const isEmpty = (val) => !val || val.trim() === "" || val.trim() === "-" || val.trim() === "—" || val.trim().toLowerCase() === "null";

    const ownerEl = document.getElementById("sidebarOwnerLine");
    if (ownerEl) {
        ownerEl.textContent = "Owner: " + ownerName;
        ownerEl.style.display = (isEmpty(ownerName) || ownerName.trim() === "Owner") ? "none" : "block";
    }

    const mobileEl = document.getElementById("sidebarMobileLine");
    if (mobileEl) {
        mobileEl.textContent = mobile;
        if (mobileEl.parentElement) {
            mobileEl.parentElement.style.display = isEmpty(mobile) ? "none" : "flex";
        }
    }

    const emailEl = document.getElementById("sidebarEmailLine");
    if (emailEl) {
        emailEl.textContent = email;
        if (emailEl.parentElement) {
            emailEl.parentElement.style.display = isEmpty(email) ? "none" : "flex";
        }
    }

    const gstEl = document.getElementById("sidebarGstLine");
    if (gstEl) {
        gstEl.textContent = gst;
        if (gstEl.parentElement) {
            gstEl.parentElement.style.display = isEmpty(gst) ? "none" : "flex";
        }
    }

    const addressEl = document.getElementById("sidebarAddressLine");
    if (addressEl) {
        addressEl.textContent = address;
        if (addressEl.parentElement) {
            addressEl.parentElement.style.display = (isEmpty(address) || address.trim() === "Addr") ? "none" : "flex";
        }
    }

    const createdEl = document.getElementById("sidebarCreatedLine");
    if (createdEl) {
        createdEl.textContent = createdAt;
        if (createdEl.parentElement) {
            createdEl.parentElement.style.display = isEmpty(createdAt) ? "none" : "flex";
        }
    }

    // Hide the entire contact details wrapper block if all contact subfields are hidden
    const contactContainer = mobileEl?.parentElement?.parentElement;
    if (contactContainer) {
        const anyVisible = (!isEmpty(mobile)) || (!isEmpty(email)) || (!isEmpty(gst)) || (!isEmpty(address) && address.trim() !== "Addr");
        contactContainer.style.display = anyVisible ? "flex" : "none";
    }

    setLogoPreview(
        document.getElementById("profileLogoImg"),
        document.getElementById("profileLogoPlaceholder"),
        logo
    );

    // Sidebar banner image setting
    const sidebarBannerImg = document.getElementById("profileBannerImg");
    if (sidebarBannerImg) {
        if (shopImage) {
            sidebarBannerImg.src = shopImage;
            sidebarBannerImg.style.display = "block";
        } else {
            sidebarBannerImg.removeAttribute("src");
            sidebarBannerImg.style.display = "none";
        }
    }

    const modalShopName = document.getElementById("profileShopName");
    if (modalShopName) modalShopName.value = profile?.shop_name || "";

    const modalOwnerName = document.getElementById("profileOwnerName");
    if (modalOwnerName) modalOwnerName.value = profile?.owner_name || "";

    const modalMobile = document.getElementById("profileMobile");
    if (modalMobile) modalMobile.value = profile?.mobile || "";

    const modalEmail = document.getElementById("profileEmail");
    if (modalEmail) modalEmail.value = profile?.email || "";

    const modalGst = document.getElementById("profileGst");
    if (modalGst) modalGst.value = profile?.gst_number || "";

    const modalCreatedAt = document.getElementById("profileCreatedAt");
    if (modalCreatedAt) modalCreatedAt.value = profile?.created_at || "2026-05-27";

    const modalAddress = document.getElementById("profileAddress");
    if (modalAddress) modalAddress.value = profile?.address || "";

    pendingLogoData = logo;
    pendingBannerData = shopImage;

    setLogoPreview(
        document.getElementById("profileUploadImg"),
        document.getElementById("profileUploadPlaceholder"),
        logo
    );

    setLogoPreview(
        document.getElementById("profileUploadBannerImg"),
        document.getElementById("profileUploadBannerPlaceholder"),
        shopImage
    );

}

async function loadProfile() {

    try {

        const profile =
            await window.electronAPI.getProfile();

        applyProfileToUI(profile || {});

    } catch (err) {

        console.error(err);

    }

}

if (profileBtn) {
    profileBtn.addEventListener("click", openProfileModal);
}

if (profileSettingsBtn) {
    profileSettingsBtn.addEventListener("click", () => {
        settingsPanel.style.display = "none";
        openProfileModal();
    });
}

if (closeProfileModal) {
    closeProfileModal.addEventListener("click", () => {
        profileModal.style.display = "none";
    });
}

logoInput.addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {

        pendingLogoData =
            await resizeLogoDataUrl(reader.result, 240);

        setLogoPreview(
            document.getElementById("profileUploadImg"),
            document.getElementById("profileUploadPlaceholder"),
            pendingLogoData
        );

    };

    reader.readAsDataURL(file);

});

const bannerInput = document.getElementById("bannerInput");
if (bannerInput) {
    bannerInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            pendingBannerData = await resizeLogoDataUrl(reader.result, 480);
            setLogoPreview(
                document.getElementById("profileUploadBannerImg"),
                document.getElementById("profileUploadBannerPlaceholder"),
                pendingBannerData
            );
        };
        reader.readAsDataURL(file);
    });
}

removeLogoBtn.addEventListener("click", () => {

    pendingLogoData = "";
    logoInput.value = "";

    setLogoPreview(
        document.getElementById("profileUploadImg"),
        document.getElementById("profileUploadPlaceholder"),
        ""
    );

    pendingBannerData = "";
    if (bannerInput) bannerInput.value = "";

    setLogoPreview(
        document.getElementById("profileUploadBannerImg"),
        document.getElementById("profileUploadBannerPlaceholder"),
        ""
    );

});

saveProfileBtn.addEventListener("click", async () => {

    const profile = {

        shopName:
            document.getElementById("profileShopName").value.trim(),

        ownerName:
            document.getElementById("profileOwnerName").value.trim(),

        mobile:
            document.getElementById("profileMobile").value.trim(),

        address:
            document.getElementById("profileAddress").value.trim(),

        gstNumber:
            document.getElementById("profileGst").value.trim(),

        email:
            document.getElementById("profileEmail").value.trim(),

        createdAt:
            document.getElementById("profileCreatedAt").value.trim(),

        logo: pendingLogoData ?? "",
        shopImage: pendingBannerData ?? ""

    };

    if (!profile.shopName) {

        alert("Please enter a shop name.");
        return;

    }

    try {

        const result =
            await window.electronAPI.saveProfile(profile);

        if (!result || !result.success) {

            alert("Profile could not be saved. Please try again.");
            return;

        }

        await loadProfile();
        profileModal.style.display = "none";

    } catch (err) {

        console.error(err);
        alert("Could not save profile: " + (err.message || err));

    }

});



async function loadDashboard() {

    const dashboard =
        await window.electronAPI.getDashboard();

    document.getElementById("todaySales").innerText =
        "₹" + dashboard.totalSales;

    document.getElementById("totalProfit").innerText =
        "₹" + dashboard.totalProfit;

}

async function loadSales() {

    const sales =
        await window.electronAPI.getSales();

    const table =
        document.getElementById("salesBody");

    if (!table) {
        return;
    }

    table.innerHTML = "";

    sales.forEach(sale => {

        table.innerHTML += `
            <tr>
                <td><strong>${sale.product_name}</strong></td>
                <td>${sale.qty}</td>
                <td>₹${sale.total_sale}</td>
                <td>₹${sale.profit}</td>
                <td>${sale.bill_id ? `<span class="bill-tag">${formatBillId(sale.bill_id)}</span>` : "—"}</td>
                <td>${paymentBadge(sale.payment_mode)}</td>
            </tr>
        `;

    });

}

function filterProducts() {

    const search =
        searchInput.value.toLowerCase();

    const rows =
        document.querySelectorAll(
            "#inventoryBody tr"
        );

    rows.forEach(row => {

        const productName =
            row.children[0]
                .innerText
                .toLowerCase();

        if (
            productName.includes(search)
        ) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

}

// --------------------
// ENTER KEY SUPPORT
// --------------------

// Centralized keydown handler is registered below inside DOMContentLoaded.

searchInput.addEventListener(
   "keyup",
    filterProducts
); 
settingsBtn.addEventListener("click", async () => {
    if (settingsPanel.style.display === "block") {
        closeAllViews();
        setActiveTab("dashboardBtn");
        return;
    }
    
    closeAllViews();
    settingsPanel.style.display = "block";

    const pathEl =
        document.getElementById("settingsDataPath");

    if (
        pathEl &&
        window.electronAPI?.getDataFolder
    ) {

        try {

            const info =
                await window.electronAPI.getDataFolder();

            if (info?.path) {
                pathEl.textContent =
                    "Data folder: " + info.path;
                pathEl.hidden = false;
            }

        } catch {

            pathEl.hidden = true;

        }

    }
    setActiveTab("settingsBtn");
});

const accountSettingsBtnEl =
    document.getElementById("accountSettingsBtn");

if (accountSettingsBtnEl) {

    accountSettingsBtnEl.addEventListener("click", async (e) => {

        e.preventDefault();
        e.stopPropagation();

        if (typeof openAccountModal === "function") {
            await openAccountModal();
        } else if (typeof showToast === "function") {
            showToast(
                "Login settings failed to load. Restart the app.",
                "error"
            );
        }

    });

}

closeSettingsBtn.addEventListener("click", () => {
    closeAllViews();
    setActiveTab("dashboardBtn");
});

document.addEventListener("click", (e) => {
    if (
        settingsPanel.style.display === "block" &&
        !settingsPanel.contains(e.target) &&
        !settingsBtn.contains(e.target)
    ) {
        settingsPanel.style.display = "none";
        setActiveTab("dashboardBtn");
    }
});
if (backupBtn) {

    backupBtn.addEventListener(
        "click",
        async () => {

            settingsPanel.style.display = "none";

            const result =
                await window.electronAPI
                    .backupDatabase();

            if (result.success) {

                await showAppDialog({
                    variant: "success",
                    title: "Backup created",
                    message:
                        "Your inventory database was copied safely.",
                    detail: result.path || "",
                    confirmText: "Done"
                });

            } else {

                await showAppDialog({
                    variant: "error",
                    title: "Backup failed",
                    message:
                        result.error ||
                        "Could not create a backup.",
                    confirmText: "Close"
                });

            }

        }
    );

}

if (restoreBtn) {

    restoreBtn.addEventListener(
        "click",
        async () => {

            settingsPanel.style.display = "none";

            const confirmed =
                await showConfirmDialog({
                    variant: "warn",
                    title: "Restore database?",
                    message:
                        "All current data will be replaced with your latest backup file. This cannot be undone.",
                    confirmText: "Restore",
                    cancelText: "Cancel"
                });

            if (!confirmed) {
                return;
            }

            const result =
                await window.electronAPI
                    .restoreDatabase();

            if (result.success) {

                await showAppDialog({
                    variant: "success",
                    title: "Restore complete",
                    message:
                        "Your shop data was restored from the latest backup. The application will now reload to apply changes.",
                    detail: result.file || "",
                    confirmText: "Reload"
                });

                window.location.reload();

            } else {

                await showAppDialog({
                    variant: "error",
                    title: "Restore failed",
                    message:
                        result.error ||
                        "Could not restore the database.",
                    confirmText: "Close"
                });

            }

        }
    );

}

const headerThemeToggle = document.getElementById("headerThemeToggle");
if (headerThemeToggle) {
    headerThemeToggle.addEventListener(
        "click",
        async () => {
            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            const nextTheme = isDark ? "light" : "dark";
            applyTheme(nextTheme);
            localStorage.setItem("theme", nextTheme);
            await loadProducts();
        }
    );
}

// --------------------
// GOOGLE DRIVE BACKUP & SYNC UI HANDLERS
// --------------------
const googleSignInBtn = document.getElementById("googleSignInBtn");
const googleSignOutBtn = document.getElementById("googleSignOutBtn");
const googleReconnectBtn = document.getElementById("googleReconnectBtn");
const googleChangeAccountBtn = document.getElementById("googleChangeAccountBtn");
const cloudSyncNowBtn = document.getElementById("cloudSyncNowBtn");
const autoBackupSelect = document.getElementById("autoBackupSelect");

async function updateCloudStatusUI() {
    if (!window.electronAPI?.getGoogleDriveStatus) return;
    
    try {
        const status = await window.electronAPI.getGoogleDriveStatus();
        applyCloudStatusToUI(status);
    } catch (err) {
        console.error("Failed to fetch Google Drive status:", err);
    }
}

function applyCloudStatusToUI(status) {
    const cloudStatusIndicator = document.getElementById("cloudStatusIndicator");
    const cloudStatusText = document.getElementById("cloudStatusText");
    const cloudEmailText = document.getElementById("cloudEmailText");
    const cloudLastSyncText = document.getElementById("cloudLastSyncText");
    const cloudBackupCountText = document.getElementById("cloudBackupCountText");
    const googleConnectedActions = document.getElementById("googleConnectedActions");
    const googleAvatarImg = document.getElementById("googleAvatarImg");
    const googleAvatarPlaceholder = document.getElementById("googleAvatarPlaceholder");
    
    if (!cloudStatusIndicator || !cloudStatusText) return;
    
    if (status.connected) {
        cloudStatusIndicator.style.color = "#10b981"; // Emerald green
        cloudStatusIndicator.textContent = "●";
        cloudStatusText.textContent = "Connected";
        
        if (cloudEmailText) {
            cloudEmailText.textContent = status.email || "Google Drive Connected";
        }
        
        if (googleAvatarImg && googleAvatarPlaceholder) {
            if (status.avatar) {
                googleAvatarImg.src = status.avatar;
                googleAvatarImg.hidden = false;
                googleAvatarPlaceholder.style.display = "none";
            } else {
                googleAvatarImg.hidden = true;
                googleAvatarPlaceholder.style.display = "flex";
            }
        }
        
        if (googleSignInBtn) googleSignInBtn.style.display = "none";
        if (googleConnectedActions) googleConnectedActions.style.display = "flex";
        
        if (status.lastSynced) {
            const date = new Date(status.lastSynced);
            cloudLastSyncText.textContent = date.toLocaleDateString("en-IN") + " " + date.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
        } else {
            cloudLastSyncText.textContent = "Awaiting backup";
        }
        
        if (cloudBackupCountText) {
            cloudBackupCountText.textContent = `${status.backupCount || 0} backups`;
        }
    } else {
        cloudStatusIndicator.style.color = "#ef4444"; // Red disconnected
        cloudStatusIndicator.textContent = "●";
        cloudStatusText.textContent = "Disconnected";
        
        if (cloudEmailText) {
            cloudEmailText.textContent = "No account linked";
        }
        
        if (googleAvatarImg && googleAvatarPlaceholder) {
            googleAvatarImg.hidden = true;
            googleAvatarPlaceholder.style.display = "flex";
        }
        
        if (googleSignInBtn) googleSignInBtn.style.display = "flex";
        if (googleConnectedActions) googleConnectedActions.style.display = "none";
        
        cloudLastSyncText.textContent = "Never synced";
        if (cloudBackupCountText) {
            cloudBackupCountText.textContent = "0 backups";
        }
    }
    
    if (status.error) {
        cloudLastSyncText.textContent = "Sync Error";
        cloudStatusIndicator.style.color = "#ef4444"; // Red error
        cloudStatusText.textContent = "Sync Error";
    }
    
    if (autoBackupSelect && status.autoBackupInterval) {
        autoBackupSelect.value = status.autoBackupInterval;
    }
    
    const sidebarBackupLine = document.getElementById("sidebarBackupLine");
    if (sidebarBackupLine) {
        if (status.connected) {
            sidebarBackupLine.textContent = "Safe";
            sidebarBackupLine.style.color = "var(--success)";
        } else {
            sidebarBackupLine.textContent = "Local Only";
            sidebarBackupLine.style.color = "var(--text-muted)";
        }
    }
}

if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", async () => {
        try {
            googleSignInBtn.disabled = true;
            googleSignInBtn.innerHTML = `<span>⏳</span> Connecting...`;
            
            const status = await window.electronAPI.googleSignIn();
            applyCloudStatusToUI(status);
            
            if (status.connected) {
                showToast(`Signed in successfully as ${status.email}!`, "success");
            }
        } catch (err) {
            showToast("Google Sign-In failed: " + err.message, "error");
        } finally {
            if (googleSignInBtn) {
                googleSignInBtn.disabled = false;
                googleSignInBtn.innerHTML = `<span style="font-weight: 700;">G</span> Sign In with Google`;
            }
        }
    });
}

if (googleReconnectBtn) {
    googleReconnectBtn.addEventListener("click", () => {
        if (googleSignInBtn) googleSignInBtn.click();
    });
}

if (googleChangeAccountBtn) {
    googleChangeAccountBtn.addEventListener("click", () => {
        if (googleSignInBtn) googleSignInBtn.click();
    });
}

if (googleSignOutBtn) {
    googleSignOutBtn.addEventListener("click", async () => {
        try {
            const status = await window.electronAPI.googleSignOut();
            applyCloudStatusToUI(status);
            showToast("Google Drive account disconnected.", "success");
        } catch (err) {
            showToast("Sign out failed: " + err.message, "error");
        }
    });
}

if (cloudSyncNowBtn) {
    cloudSyncNowBtn.addEventListener("click", async () => {
        cloudSyncNowBtn.disabled = true;
        cloudSyncNowBtn.textContent = "Backing up...";
        
        try {
            const res = await window.electronAPI.backupToGoogleDrive();
            if (res.success) {
                showToast("Google Drive cloud sync complete!", "success");
                await updateCloudStatusUI();
            } else {
                showToast(res.error || "Cloud sync failed.", "error");
                await updateCloudStatusUI();
            }
        } catch (err) {
            showToast(err.message || "An error occurred during sync.", "error");
            await updateCloudStatusUI();
        } finally {
            if (cloudSyncNowBtn) {
                cloudSyncNowBtn.disabled = false;
                cloudSyncNowBtn.textContent = "Backup Now";
            }
        }
    });
}

if (autoBackupSelect) {
    autoBackupSelect.addEventListener("change", async () => {
        try {
            const interval = autoBackupSelect.value;
            const res = await window.electronAPI.saveAutoBackupInterval(interval);
            applyCloudStatusToUI(res);
            showToast(`Auto backup updated to: ${autoBackupSelect.options[autoBackupSelect.selectedIndex].text}`, "success");
        } catch (err) {
            showToast("Failed to save auto backup interval: " + err.message, "error");
        }
    });
}

// Google Drive Restore modal bindings
const cloudRestoreBtn = document.getElementById("cloudRestoreBtn");
const driveBackupsModal = document.getElementById("driveBackupsModal");
const closeDriveBackupsModal = document.getElementById("closeDriveBackupsModal");
const closeDriveBackupsBtn = document.getElementById("closeDriveBackupsBtn");
const driveBackupsList = document.getElementById("driveBackupsList");

const showDriveBackupsModal = async () => {
    if (!driveBackupsModal || !driveBackupsList) return;
    driveBackupsList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: var(--text-sm);">⌛ Loading cloud checkpoints...</div>`;
    driveBackupsModal.style.display = "flex";
    
    try {
        const status = await window.electronAPI.getGoogleDriveStatus();
        const backups = status.backups || [];
        
        if (backups.length === 0) {
            driveBackupsList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: var(--text-sm);">☁️ No backups found on Google Drive.</div>`;
            return;
        }
        
        driveBackupsList.innerHTML = "";
        backups.forEach(b => {
            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.alignItems = "center";
            row.style.padding = "12px 16px";
            row.style.borderBottom = "1px solid var(--border-light)";
            row.style.fontSize = "var(--text-sm)";
            
            const info = document.createElement("div");
            info.style.display = "flex";
            info.style.flexDirection = "column";
            info.style.gap = "2px";
            
            const name = document.createElement("span");
            name.style.fontWeight = "700";
            name.style.color = "var(--text-primary)";
            name.textContent = b.name;
            
            const meta = document.createElement("span");
            meta.style.fontSize = "var(--text-xs)";
            meta.style.color = "var(--text-muted)";
            meta.textContent = `${b.size} · ${new Date(b.date).toLocaleDateString("en-IN")} ${new Date(b.date).toLocaleTimeString("en-IN", {hour: '2-digit', minute:'2-digit'})}`;
            
            info.appendChild(name);
            info.appendChild(meta);
            
            const restoreBtn = document.createElement("button");
            restoreBtn.type = "button";
            restoreBtn.className = "btn btn--ghost btn--sm";
            restoreBtn.style.padding = "4px 10px";
            restoreBtn.style.fontSize = "var(--text-xs)";
            restoreBtn.textContent = "Restore";
            restoreBtn.addEventListener("click", async () => {
                if (confirm(`Are you sure you want to restore the backup "${b.name}"?\nThis will overwrite your local database. The app will restart.`)) {
                    try {
                        restoreBtn.disabled = true;
                        restoreBtn.textContent = "Restoring...";
                        const res = await window.electronAPI.restoreFromGoogleDrive(b.id);
                        if (res.success) {
                            alert("Google Drive backup restored successfully! Reloading application...");
                            window.location.reload();
                        } else {
                            alert("Restore failed: " + (res.error || "Unknown error"));
                            restoreBtn.disabled = false;
                            restoreBtn.textContent = "Restore";
                        }
                    } catch (err) {
                        alert("Restore failed: " + err.message);
                        restoreBtn.disabled = false;
                        restoreBtn.textContent = "Restore";
                    }
                }
            });
            
            row.appendChild(info);
            row.appendChild(restoreBtn);
            driveBackupsList.appendChild(row);
        });
    } catch (err) {
        driveBackupsList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--danger); font-size: var(--text-sm);">❌ Failed to load backups: ${err.message}</div>`;
    }
};

const hideDriveBackupsModal = () => {
    if (driveBackupsModal) driveBackupsModal.style.display = "none";
};

if (cloudRestoreBtn) cloudRestoreBtn.addEventListener("click", showDriveBackupsModal);
if (closeDriveBackupsModal) closeDriveBackupsModal.addEventListener("click", hideDriveBackupsModal);
if (closeDriveBackupsBtn) closeDriveBackupsBtn.addEventListener("click", hideDriveBackupsModal);

// --------------------
// UPDATE CENTER & VERSION SIMULATOR UI
// --------------------
const updateCenterSettingsBtn = document.getElementById("updateCenterSettingsBtn");
const updateModal = document.getElementById("updateModal");
const closeUpdateModal = document.getElementById("closeUpdateModal");
const cancelUpdateBtn = document.getElementById("cancelUpdateBtn");
const checkUpdatesBtn = document.getElementById("checkUpdatesBtn");
const installUpdateBtn = document.getElementById("installUpdateBtn");
const simulateUpdateCheckbox = document.getElementById("simulateUpdateCheckbox");
const currentVersionText = document.getElementById("currentVersionText");
const latestVersionText = document.getElementById("latestVersionText");
const lastCheckedText = document.getElementById("lastCheckedText");
const updateStatusText = document.getElementById("updateStatusText");
const updateDownloadProgressWrap = document.getElementById("updateDownloadProgressWrap");
const progressStatusText = document.getElementById("progressStatusText");
const progressPercentText = document.getElementById("progressPercentText");
const progressPercentBar = document.getElementById("progressPercentBar");

function initUpdateCenter() {
    const currentVersion = localStorage.getItem("appVersion") || "1.1.0";
    if (currentVersionText) {
        currentVersionText.textContent = currentVersion;
    }
    if (latestVersionText) {
        latestVersionText.textContent = currentVersion;
    }
    
    if (updateCenterSettingsBtn) {
        updateCenterSettingsBtn.addEventListener("click", () => {
            settingsPanel.style.display = "none";
            updateModal.style.display = "flex";
        });
    }
    
    const hideUpdateModal = () => {
        if (updateModal) {
            updateModal.style.display = "none";
            updateDownloadProgressWrap.style.display = "none";
            progressPercentBar.style.width = "0%";
            progressPercentText.textContent = "0%";
        }
    };
    
    if (closeUpdateModal) closeUpdateModal.addEventListener("click", hideUpdateModal);
    if (cancelUpdateBtn) cancelUpdateBtn.addEventListener("click", hideUpdateModal);
    
    if (checkUpdatesBtn) {
        checkUpdatesBtn.addEventListener("click", () => {
            checkUpdatesBtn.disabled = true;
            checkUpdatesBtn.textContent = "Checking...";
            
            setTimeout(() => {
                const now = new Date();
                const checkTime = now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                lastCheckedText.textContent = checkTime;
                
                if (simulateUpdateCheckbox && simulateUpdateCheckbox.checked) {
                    latestVersionText.textContent = "1.2.0";
                    updateStatusText.textContent = "Update Available";
                    updateStatusText.className = "badge badge--low";
                    updateStatusText.style.background = "var(--warning-soft)";
                    updateStatusText.style.color = "var(--warning)";
                    
                    checkUpdatesBtn.style.display = "none";
                    installUpdateBtn.style.display = "inline-flex";
                    showToast("New RetailHub version 1.2.0 is available for download!", "success");
                } else {
                    latestVersionText.textContent = currentVersion;
                    updateStatusText.textContent = "Up to date";
                    updateStatusText.className = "badge badge--ok";
                    updateStatusText.style.background = "var(--success-soft)";
                    updateStatusText.style.color = "var(--success)";
                    
                    checkUpdatesBtn.style.display = "inline-flex";
                    installUpdateBtn.style.display = "none";
                    showToast("RetailHub is up to date.", "success");
                }
                
                checkUpdatesBtn.disabled = false;
                checkUpdatesBtn.textContent = "Check for Updates";
            }, 1200);
        });
    }
    
    if (installUpdateBtn) {
        installUpdateBtn.addEventListener("click", () => {
            installUpdateBtn.style.display = "none";
            cancelUpdateBtn.style.display = "none";
            updateDownloadProgressWrap.style.display = "block";
            
            let percent = 0;
            progressStatusText.textContent = "Downloading updates from secure server...";
            progressPercentText.textContent = "0%";
            progressPercentBar.style.width = "0%";
            
            const downloadInterval = setInterval(() => {
                percent += Math.floor(Math.random() * 8) + 4;
                if (percent >= 100) {
                    percent = 100;
                    clearInterval(downloadInterval);
                    
                    progressStatusText.textContent = "Verifying package integrity...";
                    setTimeout(() => {
                        progressStatusText.textContent = "Extracting & Installing RetailHub 1.2.0...";
                        
                        setTimeout(() => {
                            // Save version update to persistence
                            localStorage.setItem("appVersion", "1.2.0");
                            
                            // Ask to restart
                            if (confirm("RetailHub updated to version 1.2.0 successfully! Click OK to restart and apply changes.")) {
                                window.location.reload();
                            } else {
                                hideUpdateModal();
                                if (currentVersionText) currentVersionText.textContent = "1.2.0";
                                if (latestVersionText) latestVersionText.textContent = "1.2.0";
                                updateStatusText.textContent = "Up to date";
                                updateStatusText.className = "badge badge--ok";
                                updateStatusText.style.background = "var(--success-soft)";
                                updateStatusText.style.color = "var(--success)";
                                checkUpdatesBtn.style.display = "inline-flex";
                                cancelUpdateBtn.style.display = "inline-flex";
                            }
                        }, 1500);
                    }, 1200);
                }
                
                progressPercentText.textContent = `${percent}%`;
                progressPercentBar.style.width = `${percent}%`;
            }, 150);
        });
    }
}

// Listen to background synced events from IPC
if (window.electronAPI?.onCloudSynced) {
    window.electronAPI.onCloudSynced((freshStatus) => {
        applyCloudStatusToUI(freshStatus);
        showToast("Database auto-backed up to cloud.", "success");
    });
}

// Initial status load
document.addEventListener("DOMContentLoaded", () => {
    updateCloudStatusUI();
    initUpdateCenter();
    
    // Robust backup close listener for Expense Modal close button
    const closeExpenseModalBtn = document.getElementById("closeExpenseModal");
    if (closeExpenseModalBtn) {
        closeExpenseModalBtn.addEventListener("click", () => {
            const modal = document.getElementById("expenseModal");
            if (modal) {
                modal.style.display = "none";
                modal.hidden = true;
            }
        });
    }
    
    // Active Sidebar Tab Highlighter
    window.setActiveTab = function(buttonId) {
        const navButtons = [
            "dashboardBtn",
            "sellBtn",
            "addBtn",
            "stockBtn",
            "expensesBtn",
            "reportsBtn",
            "settingsBtn"
        ];
        navButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                if (id === buttonId) {
                    btn.classList.add("nav-btn--active");
                } else {
                    btn.classList.remove("nav-btn--active");
                }
            }
        });
    };

    // Close all open modals and panels cleanly
    window.closeAllViews = function() {
        if (sellModal && sellModal.style.display === "flex") {
            closeSellModalFn();
        }
        if (modal && modal.style.display === "flex") {
            closeAddProductModal();
        }
        if (stockModal && stockModal.style.display === "flex") {
            closeStockModalFn();
        }
        
        const otherModals = [
            editModal,
            profileModal,
            reportsModal,
            priceHistoryModal,
            billHistoryModal,
            expenseModal,
            salesHistoryModal,
            driveBackupsModal,
            updateModal
        ];
        otherModals.forEach(m => {
            if (m) {
                m.style.display = "none";
                m.hidden = true;
            }
        });
        
        if (typeof cloudSetupModal !== "undefined" && cloudSetupModal) {
            cloudSetupModal.style.display = "none";
        }
        
        if (settingsPanel) {
            settingsPanel.style.display = "none";
        }
    };

    // Set initial active tab on page load
    setActiveTab("dashboardBtn");

    // Dashboard sidebar button binder
    const dashboardBtn = document.getElementById("dashboardBtn");
    if (dashboardBtn) {
        dashboardBtn.addEventListener("click", () => {
            closeAllViews();
            setActiveTab("dashboardBtn");
            showToast("Returned to Dashboard", "success");
        });
    }
    
    // Global Keyboard Shortcut System Handler
    window.addEventListener("keydown", async (e) => {
        // Prevent Ctrl+R / Cmd+R page reloads to protect application state stability
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
            e.preventDefault();
            console.log("Page reload shortcut intercepted & blocked.");
            return;
        }

        // Esc = Close Modals Cleanly
        if (e.key === "Escape") {
            e.preventDefault();
            closeAllViews();
            setActiveTab("dashboardBtn");
            return;
        }

        // F1 - F7 modal navigation triggers
        switch (e.key) {
            case "F1":
                e.preventDefault();
                closeAllViews();
                setActiveTab("dashboardBtn");
                showToast("Returned to Dashboard", "success");
                break;
            case "F2":
                e.preventDefault();
                closeAllViews();
                await openSellBillModal();
                setActiveTab("sellBtn");
                break;
            case "F3":
                e.preventDefault();
                closeAllViews();
                openAddProductModal();
                setActiveTab("addBtn");
                break;
            case "F4":
                e.preventDefault();
                closeAllViews();
                await populateStockProductSelect();
                stockModal.style.display = "flex";
                setTimeout(() => {
                    const newStockEl = document.getElementById("newStock");
                    if (newStockEl) {
                        newStockEl.value = "";
                        newStockEl.focus();
                    }
                }, 50);
                setActiveTab("stockBtn");
                break;
            case "F5":
                e.preventDefault();
                closeAllViews();
                if (typeof openExpenseModal === "function") {
                    await openExpenseModal();
                }
                setActiveTab("expensesBtn");
                break;
            case "F6":
                e.preventDefault();
                closeAllViews();
                reportsModal.style.display = "flex";
                const fromEl = document.getElementById("reportFrom");
                const toEl = document.getElementById("reportTo");
                if (fromEl && !fromEl.value) {
                    fromEl.value = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                }
                if (toEl && !toEl.value) {
                    toEl.value = new Date().toISOString().split("T")[0];
                }
                await loadReportsAnalytics();
                setActiveTab("reportsBtn");
                break;
            case "F7":
                e.preventDefault();
                closeAllViews();
                settingsPanel.style.display = "block";
                const pathEl = document.getElementById("settingsDataPath");
                if (pathEl && window.electronAPI?.getDataFolder) {
                    try {
                        const info = await window.electronAPI.getDataFolder();
                        if (info?.path) {
                            pathEl.textContent = "Data folder: " + info.path;
                            pathEl.hidden = false;
                        }
                    } catch {
                        pathEl.hidden = true;
                    }
                }
                setActiveTab("settingsBtn");
                break;
        }

        // Ctrl + Enter = Complete Bill (when sellModal is active)
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            if (sellModal && sellModal.style.display === "flex") {
                const billDoneOpen = posBillDone && !posBillDone.hidden;
                if (!billDoneOpen) {
                    e.preventDefault();
                    completeBill();
                    return;
                }
            }
        }

        // Enter key inside modals/forms
        if (e.key === "Enter") {
            const active = document.activeElement;
            const activeId = active?.id || "";

            if (sellModal && sellModal.style.display === "flex") {
                const billDoneOpen = posBillDone && !posBillDone.hidden;
                if (billDoneOpen) return;

                if (active === sellProductSelect || activeId === "sellQty" || activeId === "actualSellPrice" || active === addToBillBtn) {
                    e.preventDefault();
                    addItemToBill();
                }
                return;
            }

            if (stockModal && stockModal.style.display === "flex") {
                if (activeId === "newStock" || active === updateStockBtn) {
                    e.preventDefault();
                    updateStockBtn.click();
                }
                return;
            }

            if (modal && modal.style.display === "flex") {
                e.preventDefault();
                saveBtn.click();
                return;
            }

            if (editModal && editModal.style.display === "flex") {
                e.preventDefault();
                saveEditBtn.click();
                return;
            }

            if (profileModal && profileModal.style.display === "flex") {
                e.preventDefault();
                saveProfileBtn.click();
                return;
            }
        }

        // Ctrl + F = Global Search Focus
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
            e.preventDefault();
            const searchInput = document.getElementById("searchProduct");
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
            return;
        }

        // Ctrl + B = Backup database immediately
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            const cloudSyncNowBtn = document.getElementById("cloudSyncNowBtn");
            if (cloudSyncNowBtn) {
                cloudSyncNowBtn.click();
            }
            return;
        }

        // Arrow keys focus movement in forms and modals
        const focused = document.activeElement;
        if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'SELECT' || focused.tagName === 'TEXTAREA' || focused.tagName === 'BUTTON')) {
            const activeModal = Array.from(document.querySelectorAll('.modal')).find(m => m.style.display === 'flex' || m.style.display === 'block');
            const container = activeModal || document.getElementById("settingsPanel") || document.querySelector('.main') || document;
            
            const getFocusableElements = (parent) => {
                return Array.from(parent.querySelectorAll(
                    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
                )).filter(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
                });
            };

            const focusables = getFocusableElements(container);
            const index = focusables.indexOf(focused);

            if (index !== -1) {
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                    e.preventDefault();
                    const nextIndex = (index + 1) % focusables.length;
                    focusables[nextIndex].focus();
                    if (focusables[nextIndex].select) focusables[nextIndex].select();
                } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const prevIndex = (index - 1 + focusables.length) % focusables.length;
                    focusables[prevIndex].focus();
                    if (focusables[prevIndex].select) focusables[prevIndex].select();
                }
            }
        }
    });
});

// Also trigger on initApp
setTimeout(() => {
    updateCloudStatusUI();
}, 1000);