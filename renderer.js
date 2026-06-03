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
        qtyField.value = "1";
    }

}

function restorePosFocus(selectAll) {

    if (sellModal.style.display !== "flex") {
        return;
    }

    requestAnimationFrame(() => {

        const searchField =
            document.getElementById("posSearchInput");

        if (!searchField) {
            return;
        }

        searchField.focus();

        if (selectAll && searchField.value) {
            searchField.select();
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
const expenseModal = document.getElementById("expenseModal");
const billHistoryModal = document.getElementById("billHistoryModal");

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

    const searchInp = document.getElementById("posSearchInput");
    if (searchInp) searchInp.value = "";

    const barcodeInp = document.getElementById("posBarcodeInput");
    if (barcodeInp) barcodeInp.value = "";

    const discInp = document.getElementById("discountRate");
    if (discInp) discInp.value = "0";

    const taxInp = document.getElementById("taxRate");
    if (taxInp) taxInp.value = "0";

    const cashRec = document.getElementById("cashReceived");
    if (cashRec) cashRec.value = "";

    const balRet = document.getElementById("balanceReturn");
    if (balRet) balRet.textContent = "₹0.00";

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
                <td colspan="5" class="pos-cart-empty">No items added yet. Search or scan to add products.</td>
            </tr>
        `;
        updateBillTotals();
        return;

    }

    tbody.innerHTML = "";

    sellCart.forEach((item, index) => {

        tbody.innerHTML += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px; background: var(--accent-soft); color: var(--accent); padding: 6px; border-radius: var(--radius-sm);">📦</span>
                        <div>
                            <div style="font-weight: 700; color: var(--text-primary); text-align: left;">${item.productName}</div>
                            <div style="font-size: 10px; color: var(--text-muted); text-align: left;">Product ID: #${item.productId}</div>
                        </div>
                    </div>
                </td>
                <td class="text-center">
                    <div class="inline-qty-controls">
                        <button type="button" class="inline-qty-btn" onclick="adjustCartItemQty(${index}, -1)">−</button>
                        <input
                            type="text"
                            class="inline-qty-input"
                            inputmode="numeric"
                            value="${item.qty}"
                            onchange="updateBillItemQty(${index}, this.value)"
                            onclick="event.stopPropagation()">
                        <button type="button" class="inline-qty-btn" onclick="adjustCartItemQty(${index}, 1)">+</button>
                    </div>
                </td>
                <td class="text-right">₹${Number(item.sellPrice).toFixed(2)}</td>
                <td class="text-right" style="font-weight: 700; color: var(--text-primary);">₹${Number(item.lineTotal).toFixed(2)}</td>
                <td class="text-center">
                    <button
                        type="button"
                        class="modal-close"
                        style="width: 22px; height: 22px; font-size: 10px; background: var(--danger-soft); color: var(--danger);"
                        onclick="removeBillItem(${index})"
                        aria-label="Remove">✕</button>
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

    const discountRate = parseFloat(document.getElementById("discountRate").value) || 0;
    const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;

    const discountAmount = subtotal * (discountRate / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const grandTotal = taxableAmount + taxAmount;

    document.getElementById("billSubtotal").innerText = "₹" + subtotal.toFixed(2);
    document.getElementById("posSubtotalVal").innerText = "₹" + subtotal.toFixed(2);
    document.getElementById("posDiscountVal").innerText = "-₹" + discountAmount.toFixed(2);
    document.getElementById("posTaxVal").innerText = "+₹" + taxAmount.toFixed(2);
    document.getElementById("billGrandTotal").innerText = "₹" + grandTotal.toFixed(2);

    document.getElementById("billItemCount").innerText =
        `${sellCart.length} item${sellCart.length === 1 ? "" : "s"} · ${pieces} pcs`;

    calculateBalanceReturn();

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

    const discountRate = parseFloat(document.getElementById("discountRate").value) || 0;
    const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;

    const bill = {

        items: sellCart.map((item) => {
            const basePrice = Number(item.sellPrice) || 0;
            const netPrice = basePrice * (1 - discountRate / 100) * (1 + taxRate / 100);
            return {
                productId: item.productId,
                qty: item.qty,
                sellPrice: netPrice
            };
        }),

        paymentMode:
            document.getElementById("paymentMode").value,

        customerName:
            document.getElementById("customerName").value.trim(),

        customerMobile:
            document.getElementById("customerMobile").value.trim(),

        tax: taxRate,

        discount: discountRate

    };

    try {

        const result =
            await window.electronAPI.sellBill(bill);

        showToast(
            `Bill ${formatBillId(result.billId)} saved · ₹${result.totalSale}`,
            "success"
        );

        sellCart = [];
        resetSellBillForm(true, false);

        await openInvoicePreview(result.billId, false);

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

if (addBtn) addBtn.addEventListener("click", () => {
    if (typeof closeAllViews === "function") closeAllViews();
    openAddProductModal();
    if (typeof setActiveTab === "function") setActiveTab("addBtn");
});

function closeAddProductModal() {

    modal.style.display = "none";

}

function closeStockModalFn() {

    stockModal.style.display = "none";

}

if (closeAddModal) closeAddModal.addEventListener("click", closeAddProductModal);

const cancelAddBtn =
    document.getElementById("cancelAddBtn");

if (cancelAddBtn) {
    cancelAddBtn.addEventListener("click", closeAddProductModal);
}

if (closeStockModal) closeStockModal.addEventListener("click", closeStockModalFn);

const cancelStockBtn =
    document.getElementById("cancelStockBtn");

if (cancelStockBtn) {
    cancelStockBtn.addEventListener("click", closeStockModalFn);
}

if (closeSellModal) closeSellModal.addEventListener("click", closeSellModalFn);

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

if (sellProductBtn) sellProductBtn.addEventListener("click", completeBill);

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

// reportsBtn click listener removed as it is handled dynamically in DOMContentLoaded

if (closeReportsModal) closeReportsModal.addEventListener("click", () => {
    if (reportsModal) reportsModal.style.display = "none";
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

// expensesBtn click listener removed as it is handled dynamically in DOMContentLoaded

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

if (stockBtn) stockBtn.addEventListener("click", async () => {
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

// sellBtn click listener removed as it is handled dynamically in DOMContentLoaded

window.adjustCartItemQty = function(index, delta) {
    const item = sellCart[index];
    if (item) {
        const newQty = item.qty + delta;
        window.updateBillItemQty(index, newQty);
    }
};

function calculateBalanceReturn() {
    const grandTotalText = document.getElementById("billGrandTotal")?.innerText.replace("₹", "") || "0";
    const grandTotal = parseFloat(grandTotalText) || 0;
    const cashInput = document.getElementById("cashReceived");
    if (!cashInput) return;
    
    const cashReceived = parseFloat(cashInput.value) || 0;

    const balance = cashReceived - grandTotal;
    const balanceEl = document.getElementById("balanceReturn");
    if (balanceEl) {
        if (balance >= 0) {
            balanceEl.innerText = "₹" + balance.toFixed(2);
            balanceEl.className = "text-success";
        } else {
            balanceEl.innerText = "-₹" + Math.abs(balance).toFixed(2);
            balanceEl.className = "text-danger";
        }
    }
}

let currentPreviewBillId = null;

async function openInvoicePreview(billId, isDraft = false, draftData = null) {
    const previewModal = document.getElementById("invoicePreviewModal");
    const contentEl = document.getElementById("thermalReceiptContent");
    const printBtn = document.getElementById("previewPrintBtn");
    const pdfBtn = document.getElementById("previewPdfBtn");
    const shareBtn = document.getElementById("previewShareBtn");

    if (!previewModal || !contentEl) return;

    currentPreviewBillId = billId;

    if (isDraft && draftData) {
        contentEl.innerHTML = generateThermalReceiptHtml(draftData);
        if (printBtn) printBtn.disabled = true;
        if (pdfBtn) pdfBtn.disabled = true;
        if (shareBtn) shareBtn.disabled = true;
    } else {
        try {
            const data = await window.electronAPI.getBillDetails(billId);
            contentEl.innerHTML = generateThermalReceiptHtml(data);
            if (printBtn) printBtn.disabled = false;
            if (pdfBtn) pdfBtn.disabled = false;
            if (shareBtn) shareBtn.disabled = false;
        } catch (e) {
            showToast("Failed to load invoice preview: " + e.message, "error");
            return;
        }
    }

    previewModal.style.display = "flex";
}

function getShopProfileFromDOM() {
    const shopName = document.getElementById("sidebarShopName")?.innerText || "RetailHub";
    const ownerLine = document.getElementById("sidebarOwnerLine")?.textContent || "";
    const ownerName = ownerLine.replace("Owner: ", "");
    const mobile = document.getElementById("sidebarMobileLine")?.textContent || "";
    const email = document.getElementById("sidebarEmailLine")?.textContent || "";
    const gst = document.getElementById("sidebarGstLine")?.textContent || "";
    const address = document.getElementById("sidebarAddressLine")?.textContent || "";
    const logoImg = document.getElementById("profileLogoImg");
    const logoSrc = logoImg && logoImg.style.display !== "none" ? logoImg.src : "";

    return {
        shop_name: shopName,
        owner_name: ownerName,
        mobile: mobile !== "-" ? mobile : "",
        email: email !== "-" ? email : "",
        gst_number: gst !== "-" ? gst : "",
        address: address !== "-" ? address : "",
        logo: logoSrc
    };
}

function generateThermalReceiptHtml(data) {
    const profile = data.profile || getShopProfileFromDOM();
    const lines = data.lines || [];
    const billId = data.billId;
    const billLabel = billId ? (String(billId).startsWith("RH-") ? String(billId) : `#${String(billId).slice(-6)}`) : "DRAFT PREVIEW";

    const discountRate = Number(data.discount) || 0;
    const taxRate = Number(data.tax) || 0;
    const factor = (1 - discountRate / 100) * (1 + taxRate / 100);
    const safeFactor = factor > 0 ? factor : 1;

    let subtotal = 0;
    const rows = lines.map((line) => {
        const netPrice = Number(line.sellPrice || line.sell_price) || 0;
        const basePrice = netPrice / safeFactor;
        const baseAmount = basePrice * (Number(line.qty) || 0);
        subtotal += baseAmount;
        
        return `
            <tr>
                <td style="padding: 4px 0; max-width: 140px; word-wrap: break-word; text-align: left;">${line.productName || line.product_name}</td>
                <td class="num" style="padding: 4px 0; text-align: right;">${line.qty}</td>
                <td class="num" style="padding: 4px 0; text-align: right;">₹${basePrice.toFixed(2)}</td>
                <td class="num" style="padding: 4px 0; text-align: right;">₹${baseAmount.toFixed(2)}</td>
            </tr>
        `;
    }).join("");

    const discountAmount = subtotal * (discountRate / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const grandTotal = taxableAmount + taxAmount;

    const qrData = `Bill ID: ${billLabel}\nTotal: ₹${grandTotal.toFixed(2)}\nShop: ${profile.shop_name}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;

    return `
        <div class="thermal-header" style="text-align: center; margin-bottom: 12px;">
            ${profile.logo ? `<img src="${profile.logo}" class="thermal-logo" alt="Logo" style="max-width: 60px; max-height: 60px; margin-bottom: 6px; object-fit: contain;">` : ""}
            <div class="thermal-title" style="font-size: 14px; font-weight: 700; text-transform: uppercase;">${profile.shop_name}</div>
            <div style="font-size: 10px; color: #555; margin-top: 4px;">
                ${profile.address ? `<div>${profile.address}</div>` : ""}
                ${profile.mobile ? `<div>Mob: ${profile.mobile}</div>` : ""}
                ${profile.email ? `<div>Email: ${profile.email}</div>` : ""}
                ${profile.gst_number ? `<div>GSTIN: ${profile.gst_number}</div>` : ""}
            </div>
        </div>
        <div class="thermal-divider" style="border-top: 1px dashed #000; margin: 8px 0;"></div>
        <div class="thermal-meta" style="font-size: 10px; line-height: 1.3;">
            <div style="display: flex; justify-content: space-between;"><span><strong>Bill:</strong> ${billLabel}</span><span><strong>Date:</strong> ${data.date || new Date().toLocaleString()}</span></div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;"><span><strong>Cust:</strong> ${data.customerName || "Walk-in Customer"}</span><span><strong>Mob:</strong> ${data.customerMobile || "—"}</span></div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;"><span><strong>Payment:</strong> ${data.paymentMode || "Cash"}</span><span></span></div>
        </div>
        <div class="thermal-divider" style="border-top: 1px dashed #000; margin: 8px 0;"></div>
        <table class="thermal-table" style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
                <tr>
                    <th style="text-align: left; border-bottom: 1px dashed #000; padding: 4px 0;">Item</th>
                    <th class="num" style="text-align: right; border-bottom: 1px dashed #000; padding: 4px 0; width: 35px;">Qty</th>
                    <th class="num" style="text-align: right; border-bottom: 1px dashed #000; padding: 4px 0; width: 55px;">Rate</th>
                    <th class="num" style="text-align: right; border-bottom: 1px dashed #000; padding: 4px 0; width: 65px;">Amt</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div class="thermal-divider" style="border-top: 1px dashed #000; margin: 8px 0;"></div>
        <div class="thermal-totals" style="display: flex; flex-direction: column; align-items: flex-end; font-size: 10px; gap: 3px;">
            <div class="thermal-total-line" style="display: flex; justify-content: space-between; width: 100%;"><span>Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
            ${discountRate > 0 ? `<div class="thermal-total-line" style="display: flex; justify-content: space-between; width: 100%;"><span>Discount (${discountRate}%):</span><span>-₹${discountAmount.toFixed(2)}</span></div>` : ""}
            ${taxRate > 0 ? `<div class="thermal-total-line" style="display: flex; justify-content: space-between; width: 100%;"><span>Tax (${taxRate}%):</span><span>+₹${taxAmount.toFixed(2)}</span></div>` : ""}
            <div class="thermal-total-line thermal-total-line--grand" style="display: flex; justify-content: space-between; width: 100%; font-weight: 700; border-top: 1px dashed #000; padding-top: 4px; margin-top: 2px; font-size: 13px;"><span>GRAND TOTAL:</span><span>₹${grandTotal.toFixed(2)}</span></div>
        </div>
        <div class="thermal-qr-code" style="text-align: center; margin: 12px 0 6px;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 100px; height: 100px;">
        </div>
        <div class="thermal-footer" style="text-align: center; font-size: 9px; margin-top: 8px; color: #555;">
            Thank you for your visit!<br>
            Powered by RetailHub POS
        </div>
    `;
}

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

if (saveBtn) saveBtn.addEventListener("click", async () => {

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

if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
        const profile = {
            shopName: document.getElementById("profileShopName")?.value?.trim() || "",
            ownerName: document.getElementById("profileOwnerName")?.value?.trim() || "",
            mobile: document.getElementById("profileMobile")?.value?.trim() || "",
            address: document.getElementById("profileAddress")?.value?.trim() || "",
            gstNumber: document.getElementById("profileGst")?.value?.trim() || "",
            email: document.getElementById("profileEmail")?.value?.trim() || "",
            createdAt: document.getElementById("profileCreatedAt")?.value?.trim() || "",
            logo: pendingLogoData ?? "",
            shopImage: pendingBannerData ?? ""
        };

        if (!profile.shopName) {
            alert("Please enter a shop name.");
            return;
        }

        try {
            const result = await window.electronAPI.saveProfile(profile);
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
}

// 1. Save Store Info Button
const saveStoreBtn = document.getElementById("saveStoreBtn");
if (saveStoreBtn) {
    saveStoreBtn.addEventListener("click", async () => {
        const shopName = document.getElementById("profileShopName").value.trim();
        const mobile = document.getElementById("profileMobile").value.trim();
        const email = document.getElementById("profileEmail").value.trim();
        const gstNumber = document.getElementById("profileGst").value.trim();
        const createdAt = document.getElementById("profileCreatedAt").value.trim();
        const address = document.getElementById("profileAddress").value.trim();

        if (!shopName) {
            showToast("Please enter a shop name.", "error");
            return;
        }

        try {
            const currentProfile = await window.electronAPI.getProfile() || {};
            const profile = {
                ...currentProfile,
                shopName: shopName,
                mobile: mobile,
                email: email,
                gstNumber: gstNumber,
                createdAt: createdAt,
                address: address,
                logo: pendingLogoData ?? currentProfile.logo ?? "",
                shopImage: pendingBannerData ?? currentProfile.banner_image ?? currentProfile.shop_image ?? ""
            };

            const result = await window.electronAPI.saveProfile(profile);
            if (!result || !result.success) {
                showToast("Store profile could not be saved.", "error");
                return;
            }

            await loadProfile();
            showToast("Store information saved successfully!", "success");
        } catch (err) {
            console.error(err);
            showToast("Could not save store profile: " + (err.message || err), "error");
        }
    });
}

// 2. Save Owner Info Button
const saveOwnerBtn = document.getElementById("saveOwnerBtn");
if (saveOwnerBtn) {
    saveOwnerBtn.addEventListener("click", async () => {
        const ownerName = document.getElementById("profileOwnerName").value.trim();
        const username = document.getElementById("ownerUsername").value.trim();
        const currentPassword = document.getElementById("ownerCurrentPassword").value;
        const newPassword = document.getElementById("ownerNewPassword").value;
        const confirmPassword = document.getElementById("ownerConfirmPassword").value;

        if (!ownerName) {
            showToast("Please enter an owner name.", "error");
            return;
        }

        try {
            const currentProfile = await window.electronAPI.getProfile() || {};
            const profile = {
                ...currentProfile,
                ownerName: ownerName
            };

            const profileResult = await window.electronAPI.saveProfile(profile);
            if (!profileResult || !profileResult.success) {
                showToast("Owner profile could not be saved.", "error");
                return;
            }

            if (currentPassword || newPassword || username !== "admin") {
                if (!currentPassword) {
                    showToast("Current password is required to modify account security credentials.", "error");
                    return;
                }

                if (newPassword) {
                    if (newPassword.length < 4) {
                        showToast("New password must be at least 4 characters long.", "error");
                        return;
                    }
                    if (newPassword !== confirmPassword) {
                        showToast("Confirm password does not match new password.", "error");
                        return;
                    }
                }

                const accountResult = await window.electronAPI.updateAccount({
                    username: username,
                    currentPassword: currentPassword,
                    newPassword: newPassword || undefined
                });

                if (!accountResult || !accountResult.success) {
                    showToast(accountResult?.error || "Failed to update account security.", "error");
                    return;
                }

                document.getElementById("ownerCurrentPassword").value = "";
                document.getElementById("ownerNewPassword").value = "";
                document.getElementById("ownerConfirmPassword").value = "";
            }

            await loadProfile();
            showToast("Owner information saved successfully!", "success");
        } catch (err) {
            console.error(err);
            showToast("Could not save owner profile: " + (err.message || err), "error");
        }
    });
}

// 3. Database Management Button Handlers
const vacuumDbBtn = document.getElementById("vacuumDbBtn");
if (vacuumDbBtn) {
    vacuumDbBtn.addEventListener("click", async () => {
        try {
            vacuumDbBtn.disabled = true;
            vacuumDbBtn.textContent = "Optimizing...";
            const res = await window.electronAPI.vacuumDatabase();
            if (res && res.success) {
                showToast("Database optimized successfully!", "success");
            } else {
                showToast("Optimization failed: " + (res?.error || "Unknown error"), "error");
            }
        } catch (err) {
            showToast("Error optimizing database: " + err.message, "error");
        } finally {
            vacuumDbBtn.disabled = false;
            vacuumDbBtn.textContent = "Optimize Now";
        }
    });
}

const clearLogsDbBtn = document.getElementById("clearLogsDbBtn");
if (clearLogsDbBtn) {
    clearLogsDbBtn.addEventListener("click", async () => {
        const confirmed = await showAppDialog({
            title: "Clear Logs Confirmation",
            message: "Are you sure you want to clear all sales and expense transaction logs? This action will keep your products list and shop profile intact, but delete all historical billing records. This is permanent and cannot be undone.",
            variant: "warning"
        });

        if (!confirmed) return;

        try {
            clearLogsDbBtn.disabled = true;
            clearLogsDbBtn.textContent = "Clearing...";
            const res = await window.electronAPI.clearLogsDatabase();
            if (res && res.success) {
                showToast("Sales and expense transaction logs cleared successfully!", "success");
                if (typeof loadDashboard === "function") loadDashboard();
            } else {
                showToast("Failed to clear logs: " + (res?.error || "Unknown error"), "error");
            }
        } catch (err) {
            showToast("Error clearing logs: " + err.message, "error");
        } finally {
            clearLogsDbBtn.disabled = false;
            clearLogsDbBtn.textContent = "Clear Logs";
        }
    });
}

const factoryResetDbBtn = document.getElementById("factoryResetDbBtn");
if (factoryResetDbBtn) {
    factoryResetDbBtn.addEventListener("click", async () => {
        const confirmed1 = await showAppDialog({
            title: "CRITICAL: Factory Reset Confirmation",
            message: "This will completely delete ALL products, sales history, customer databases, supplier logs, expense books, shop profiles, and custom user credentials from this computer. It will restore the software to its original installation state.",
            variant: "danger"
        });

        if (!confirmed1) return;

        const confirmed2 = await showAppDialog({
            title: "FINAL WARNING",
            message: "This is your LAST warning. ALL data on this RetailHub instance will be deleted permanently. Are you absolutely certain you wish to proceed?",
            variant: "danger"
        });

        if (!confirmed2) return;

        try {
            factoryResetDbBtn.disabled = true;
            factoryResetDbBtn.textContent = "Wiping Data...";
            const res = await window.electronAPI.factoryResetDatabase();
            if (res && res.success) {
                if (typeof clearAuthUser === "function") clearAuthUser();
                localStorage.removeItem("amUser");
                sessionStorage.removeItem("amUser");
                showToast("System factory reset complete. Reloading...", "success");
                setTimeout(() => {
                    if (window.electronAPI && window.electronAPI.navigate) {
                        window.electronAPI.navigate("login.html");
                    } else {
                        window.location.reload();
                    }
                }, 2000);
            } else {
                showToast("Failed to perform factory reset: " + (res?.error || "Unknown error"), "error");
                factoryResetDbBtn.disabled = false;
                factoryResetDbBtn.textContent = "Wipe All Data";
            }
        } catch (err) {
            showToast("Error during factory reset: " + err.message, "error");
            factoryResetDbBtn.disabled = false;
            factoryResetDbBtn.textContent = "Wipe All Data";
        }
    });
}

// 4. Theme Selection Handler
const themeRadioButtons = document.querySelectorAll('input[name="settingsTheme"]');
if (themeRadioButtons.length > 0) {
    const activeTheme = localStorage.getItem("theme") || "light";
    themeRadioButtons.forEach(radio => {
        if (radio.value === activeTheme) {
            radio.checked = true;
        }
        radio.addEventListener("change", (e) => {
            const selectedTheme = e.target.value;
            applyTheme(selectedTheme);
            localStorage.setItem("theme", selectedTheme);
            showToast(`Switched to ${selectedTheme} theme!`, "success");
        });
    });
}



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
// settingsBtn click listener removed as it is handled dynamically in DOMContentLoaded

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
    const cloudStatusBadge = document.getElementById("cloudStatusBadge");
    const cloudStatusText = document.getElementById("cloudStatusText");
    const cloudEmailText = document.getElementById("cloudEmailText");
    const cloudProfileName = document.getElementById("cloudProfileName");
    const cloudLastSyncText = document.getElementById("cloudLastSyncText");
    const cloudBackupCountText = document.getElementById("cloudBackupCountText");
    const googleConnectedActions = document.getElementById("googleConnectedActions");
    const googleAvatarImg = document.getElementById("googleAvatarImg");
    const googleAvatarPlaceholder = document.getElementById("googleAvatarPlaceholder");
    
    if (!cloudStatusBadge || !cloudStatusText) return;
    
    if (status.connected) {
        cloudStatusBadge.className = "cloud-badge cloud-badge--connected";
        cloudStatusText.textContent = "Cloud Active";
        
        if (cloudProfileName) {
            cloudProfileName.textContent = status.name || "Google Drive Account";
        }
        
        if (cloudEmailText) {
            cloudEmailText.textContent = status.email || "Connected";
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
            cloudLastSyncText.textContent = "Awaiting Backup";
        }
        
        if (cloudBackupCountText) {
            cloudBackupCountText.textContent = `${status.backupCount || 0} Backups`;
        }
    } else {
        cloudStatusBadge.className = "cloud-badge cloud-badge--disconnected";
        cloudStatusText.textContent = "Local Mode";
        
        if (cloudProfileName) {
            cloudProfileName.textContent = "Not Connected";
        }
        
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
        cloudStatusBadge.className = "cloud-badge cloud-badge--disconnected";
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
            googleSignInBtn.innerHTML = `<span class="cloud-loader"></span> Connecting...`;
            
            const status = await window.electronAPI.googleSignIn();
            applyCloudStatusToUI(status);
            
            if (status.connected) {
                showToast(`Connected successfully as ${status.name}!`, "success");
            }
        } catch (err) {
            showToast("Google Sign-In failed: " + err.message, "error");
        } finally {
            if (googleSignInBtn) {
                googleSignInBtn.disabled = false;
                googleSignInBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.357-2.829-6.357-6.315 0-3.486 2.847-6.315 6.357-6.315 1.583 0 2.973.57 4.053 1.516l3.125-3.125C18.89 2.05 15.8 1 12.24 1 5.926 1 12.24 5.925 12.24 12.24c0 6.316 4.927 11.24 11.24 11.24 6.786 0 11.24-4.757 11.24-11.458 0-.741-.067-1.3-.15-1.737H12.24z"/>
                    </svg>
                    <span>Connect Google Drive</span>
                `;
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
        cloudSyncNowBtn.innerHTML = `<span class="cloud-loader"></span> Syncing...`;
        
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
    // Load persisted last checked time
    const lastChecked = localStorage.getItem("lastCheckedUpdate");
    if (lastChecked && lastCheckedText) {
        lastCheckedText.textContent = lastChecked;
    }

    // Load real app version from main process
    if (window.electronAPI?.getAppVersion) {
        window.electronAPI.getAppVersion().then((version) => {
            if (currentVersionText) currentVersionText.textContent = version;
            if (latestVersionText) latestVersionText.textContent = version;
        }).catch(err => console.error("Failed to load app version:", err));
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
        checkUpdatesBtn.addEventListener("click", async () => {
            checkUpdatesBtn.disabled = true;
            checkUpdatesBtn.textContent = "Checking...";
            updateStatusText.textContent = "Checking...";
            updateStatusText.className = "badge";
            updateStatusText.style.background = "var(--border-light)";
            updateStatusText.style.color = "var(--text-secondary)";

            try {
                if (window.electronAPI?.checkForUpdates) {
                    await window.electronAPI.checkForUpdates();
                } else {
                    throw new Error("Electron API is not available.");
                }
            } catch (err) {
                console.error("Check for updates trigger failed:", err);
                showToast("Update check failed: " + err.message, "error");
                checkUpdatesBtn.disabled = false;
                checkUpdatesBtn.textContent = "Check for Updates";
            }
        });
    }

    if (installUpdateBtn) {
        installUpdateBtn.addEventListener("click", () => {
            if (window.electronAPI?.installUpdate) {
                window.electronAPI.installUpdate();
            }
        });
    }

    // Register actual IPC listeners from main process
    if (window.electronAPI) {
        window.electronAPI.onCheckingForUpdate(() => {
            if (updateStatusText) {
                updateStatusText.textContent = "Checking...";
                updateStatusText.className = "badge";
                updateStatusText.style.background = "var(--border-light)";
                updateStatusText.style.color = "var(--text-secondary)";
            }
        });

        window.electronAPI.onUpdateAvailable((info) => {
            // Persist check time
            const now = new Date();
            const checkTime = now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            localStorage.setItem("lastCheckedUpdate", checkTime);
            if (lastCheckedText) lastCheckedText.textContent = checkTime;

            if (latestVersionText) latestVersionText.textContent = info.version;
            if (updateStatusText) {
                updateStatusText.textContent = "Downloading...";
                updateStatusText.className = "badge badge--low";
                updateStatusText.style.background = "var(--warning-soft)";
                updateStatusText.style.color = "var(--warning)";
            }
            if (checkUpdatesBtn) checkUpdatesBtn.style.display = "none";
            if (installUpdateBtn) installUpdateBtn.style.display = "none";
            if (updateDownloadProgressWrap) updateDownloadProgressWrap.style.display = "block";
            
            showToast(`New version ${info.version} is available and downloading!`, "success");
        });

        window.electronAPI.onUpdateNotAvailable((info) => {
            // Persist check time
            const now = new Date();
            const checkTime = now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            localStorage.setItem("lastCheckedUpdate", checkTime);
            if (lastCheckedText) lastCheckedText.textContent = checkTime;

            if (latestVersionText) latestVersionText.textContent = info.version || (currentVersionText ? currentVersionText.textContent : "1.1.5");
            if (updateStatusText) {
                updateStatusText.textContent = "Up to date";
                updateStatusText.className = "badge badge--ok";
                updateStatusText.style.background = "var(--success-soft)";
                updateStatusText.style.color = "var(--success)";
            }
            if (checkUpdatesBtn) {
                checkUpdatesBtn.style.display = "inline-flex";
                checkUpdatesBtn.disabled = false;
                checkUpdatesBtn.textContent = "Check for Updates";
            }
            if (installUpdateBtn) installUpdateBtn.style.display = "none";
            if (updateDownloadProgressWrap) updateDownloadProgressWrap.style.display = "none";

            showToast("RetailHub is up to date.", "success");
        });

        window.electronAPI.onDownloadProgress((progress) => {
            if (updateDownloadProgressWrap) updateDownloadProgressWrap.style.display = "block";
            if (progressStatusText) {
                const mbPerSec = progress.bytesPerSecond ? (progress.bytesPerSecond / 1024 / 1024).toFixed(2) : "0.00";
                progressStatusText.textContent = `Downloading update (${mbPerSec} MB/s)...`;
            }
            const percent = Math.round(progress.percent || 0);
            if (progressPercentText) progressPercentText.textContent = `${percent}%`;
            if (progressPercentBar) progressPercentBar.style.width = `${percent}%`;
        });

        window.electronAPI.onUpdateDownloaded((info) => {
            if (updateStatusText) {
                updateStatusText.textContent = "Ready to Install";
                updateStatusText.className = "badge badge--ok";
                updateStatusText.style.background = "var(--success-soft)";
                updateStatusText.style.color = "var(--success)";
            }
            if (updateDownloadProgressWrap) updateDownloadProgressWrap.style.display = "none";
            if (checkUpdatesBtn) checkUpdatesBtn.style.display = "none";
            if (installUpdateBtn) {
                installUpdateBtn.style.display = "inline-flex";
                installUpdateBtn.textContent = "Restart & Install";
            }

            showToast(`RetailHub version ${info.version} downloaded! Restarting to install update...`, "success");

            // Auto-restart after 2 seconds to install the downloaded update
            setTimeout(() => {
                if (window.electronAPI?.installUpdate) {
                    window.electronAPI.installUpdate();
                }
            }, 2000);
        });

        window.electronAPI.onUpdateError((err) => {
            if (updateStatusText) {
                updateStatusText.textContent = "Update Error";
                updateStatusText.className = "badge badge--error";
                updateStatusText.style.background = "rgba(239, 68, 68, 0.1)";
                updateStatusText.style.color = "var(--danger)";
            }
            if (checkUpdatesBtn) {
                checkUpdatesBtn.style.display = "inline-flex";
                checkUpdatesBtn.disabled = false;
                checkUpdatesBtn.textContent = "Check for Updates";
            }
            if (installUpdateBtn) installUpdateBtn.style.display = "none";
            if (updateDownloadProgressWrap) updateDownloadProgressWrap.style.display = "none";

            showToast("Update failed: " + err, "error");
        });
    }
}

// Listen to background synced events from IPC
if (window.electronAPI?.onCloudSynced) {
    window.electronAPI.onCloudSynced((freshStatus) => {
        applyCloudStatusToUI(freshStatus);
        // Only show toast for background auto-backups (not for sign-in triggered syncs)
        if (freshStatus && freshStatus.connected && freshStatus.lastSynced) {
            showToast("Database auto-backed up to Google Drive.", "success");
        }
    });
}

// OAuth credentials not configured — show guidance dialog
if (window.electronAPI?.onOAuthSetupRequired) {
    window.electronAPI.onOAuthSetupRequired((data) => {
        showAppDialog({
            variant: "warn",
            title: "Google OAuth Setup Required",
            message: "Google credentials are not configured yet.",
            detail: "To enable real Google sign-in, you need to create OAuth credentials in Google Cloud Console and add them to main.js. See the developer notes for setup instructions.",
            confirmText: "OK"
        });
    });
}

    // OAuth token exchange or network error
    if (window.electronAPI?.onOAuthError) {
        window.electronAPI.onOAuthError((data) => {
            showToast("Google sign-in error: " + (data?.message || "Unknown error"), "error");
            updateCloudStatusUI();
        });
    }

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

        // Active Static Tab tracking
        let activeStaticTab = "dashboardBtn";
        
        // Active Sidebar Tab Highlighter & View Switcher
        window.setActiveTab = function(buttonId) {
            const navButtons = [
                "dashboardBtn",
                "inventoryBtn",
                "salesBtn",
                "sellBtn",
                "expensesBtn",
                "reportsBtn",
                "customersBtn",
                "suppliersBtn",
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

            const staticSections = {
                "dashboardBtn": "dashboardView",
                "inventoryBtn": "inventorySection",
                "salesBtn": "salesSection",
                "customersBtn": "customersSection",
                "suppliersBtn": "suppliersSection"
            };

            if (staticSections[buttonId]) {
                activeStaticTab = buttonId;
                Object.keys(staticSections).forEach(btnId => {
                    const sectId = staticSections[btnId];
                    const el = document.getElementById(sectId);
                    if (el) {
                        el.style.display = (btnId === buttonId) ? "block" : "none";
                    }
                });
            }
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

            // Restore sidebar active highlight and correct static view visibility
            if (activeStaticTab) {
                window.setActiveTab(activeStaticTab);
            }
        };

        // Set initial active tab on page load
        setActiveTab("dashboardBtn");

        // Sidebar navigation click binders
        const sidebarBtns = [
            { id: "dashboardBtn", handler: () => { closeAllViews(); setActiveTab("dashboardBtn"); } },
            { id: "inventoryBtn", handler: () => { closeAllViews(); setActiveTab("inventoryBtn"); } },
            { id: "salesBtn", handler: () => { closeAllViews(); setActiveTab("salesBtn"); } },
            { id: "customersBtn", handler: () => { closeAllViews(); setActiveTab("customersBtn"); } },
            { id: "suppliersBtn", handler: () => { closeAllViews(); setActiveTab("suppliersBtn"); } },
            { id: "sellBtn", handler: async () => { closeAllViews(); await openSellBillModal(); setActiveTab("sellBtn"); } },
            { id: "expensesBtn", handler: async () => {
                closeAllViews();
                if (typeof openExpenseModal === "function") {
                    await openExpenseModal();
                    if (expenseModal) {
                        expenseModal.hidden = false;
                        if (!expenseModal.style.display || expenseModal.style.display === "none") {
                            expenseModal.style.display = "flex";
                        }
                    }
                }
                setActiveTab("expensesBtn");
            } },
            { id: "reportsBtn", handler: async () => {
                closeAllViews();
                if (reportsModal) {
                    reportsModal.hidden = false;
                    reportsModal.style.display = "flex";
                }
                const fromEl = document.getElementById("reportFrom");
                const toEl = document.getElementById("reportTo");
                if (fromEl && !fromEl.value) {
                    fromEl.value = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                }
                if (toEl && !toEl.value) {
                    toEl.value = new Date().toISOString().split("T")[0];
                }
                if (typeof loadReportsAnalytics === "function") await loadReportsAnalytics();
                setActiveTab("reportsBtn");
            } },
            { id: "settingsBtn", handler: async () => {
                if (settingsPanel && settingsPanel.style.display === "flex") {
                    closeAllViews();
                    return;
                }
                closeAllViews();
                if (settingsPanel) {
                    settingsPanel.hidden = false;
                    settingsPanel.style.display = "flex";
                }
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
            } }
        ];

        sidebarBtns.forEach(item => {
            const btn = document.getElementById(item.id);
            if (btn) {
                btn.addEventListener("click", item.handler);
            }
        });

        // Bind all Close buttons on overlays
        const overlayCloseButtons = [
            "closeSellModal",
            "closeExpenseModal",
            "closeReportsModal",
            "closeSettingsBtn"
        ];
        overlayCloseButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    closeAllViews();
                });
            }
        });

        // Settings Sub Navigation Switcher
        const settingsSubTabs = [
            { btnId: "setNavStore", panelId: "setSubStore" },
            { btnId: "setNavOwner", panelId: "setSubOwner" },
            { btnId: "setNavBackup", panelId: "setSubBackup" },
            { btnId: "setNavDrive", panelId: "setSubDrive" },
            { btnId: "setNavDB", panelId: "setSubDB" },
            { btnId: "setNavTheme", panelId: "setSubTheme" },
            { btnId: "setNavLogout", panelId: "setSubLogout" }
        ];

        settingsSubTabs.forEach(tab => {
            const btn = document.getElementById(tab.btnId);
            if (btn) {
                btn.addEventListener("click", () => {
                    settingsSubTabs.forEach(t => {
                        const b = document.getElementById(t.btnId);
                        if (b) b.classList.remove("settings-menu-btn--active");
                        const p = document.getElementById(t.panelId);
                        if (p) p.style.display = "none";
                    });
                    btn.classList.add("settings-menu-btn--active");
                    const panel = document.getElementById(tab.panelId);
                    if (panel) {
                        panel.style.display = (tab.panelId === "setSubStore" || tab.panelId === "setSubOwner") ? "grid" : "block";
                    }
                });
            }
        });

        // Settings Logout button handler
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                if (typeof clearAuthUser === "function") {
                    clearAuthUser();
                } else {
                    localStorage.removeItem("amUser");
                    sessionStorage.removeItem("amUser");
                }
                if (window.electronAPI && window.electronAPI.navigate) {
                    window.electronAPI.navigate("login.html");
                } else {
                    window.location.reload();
                }
            });
        }

        // Inventory View Action Buttons
        const inventoryAddBtn = document.getElementById("inventoryAddBtn");
        if (inventoryAddBtn) {
            inventoryAddBtn.addEventListener("click", () => {
                if (typeof openAddProductModal === "function") {
                    openAddProductModal();
                }
            });
        }

        const inventoryStockBtn = document.getElementById("inventoryStockBtn");
        if (inventoryStockBtn) {
            inventoryStockBtn.addEventListener("click", async () => {
                if (typeof populateStockProductSelect === "function") {
                    await populateStockProductSelect();
                    if (stockModal) stockModal.style.display = "flex";
                    setTimeout(() => {
                        const newStockEl = document.getElementById("newStock");
                        if (newStockEl) {
                            newStockEl.value = "";
                            newStockEl.focus();
                        }
                    }, 50);
                }
            });
        }

        // Top Bar Profile Click redirects to settings profile
        const profileTrigger = document.getElementById("profileSettingsBtnTrigger");
        if (profileTrigger) {
            profileTrigger.addEventListener("click", () => {
                closeAllViews();
                if (settingsPanel) {
                    settingsPanel.style.display = "block";
                }
                const profileTabBtn = document.getElementById("setNavProfile");
                if (profileTabBtn) profileTabBtn.click();
                setActiveTab("settingsBtn");
            });
        }

        // Top Bar Quick Product Add Button
        const quickAddProductBtn = document.getElementById("quickAddProductBtn");
        if (quickAddProductBtn) {
            quickAddProductBtn.addEventListener("click", () => {
                if (typeof openAddProductModal === "function") {
                    openAddProductModal();
                }
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
                    openAddProductModal();
                    setActiveTab("inventoryBtn");
                    break;
                case "F3":
                    e.preventDefault();
                    closeAllViews();
                    openAddProductModal();
                    setActiveTab("inventoryBtn");
                    break;
                case "F4":
                    e.preventDefault();
                    const custNameInput = document.getElementById("customerName");
                    if (custNameInput) {
                        custNameInput.focus();
                        custNameInput.select();
                    }
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
                    if (reportsModal) reportsModal.style.display = "flex";
                    const fromEl = document.getElementById("reportFrom");
                    const toEl = document.getElementById("reportTo");
                    if (fromEl && !fromEl.value) {
                        fromEl.value = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                    }
                    if (toEl && !toEl.value) {
                        toEl.value = new Date().toISOString().split("T")[0];
                    }
                    if (typeof loadReportsAnalytics === "function") await loadReportsAnalytics();
                    setActiveTab("reportsBtn");
                    break;
                case "F7":
                    e.preventDefault();
                    closeAllViews();
                    if (settingsPanel) settingsPanel.style.display = "block";
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
                case "F8":
                    e.preventDefault();
                    closeAllViews();
                    await openSellBillModal();
                    setActiveTab("sellBtn");
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

                    const posSearchResults = document.getElementById("posSearchResults");
                    const searchResultsOpen = posSearchResults && !posSearchResults.hidden;
                    if (searchResultsOpen) return; // let suggestions select handle Enter!

                    if (active === sellProductSelect || activeId === "sellQty" || activeId === "actualSellPrice" || active === addToBillBtn || activeId === "posSearchInput" || activeId === "posBarcodeInput") {
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

        // Realtime Top Bar clock
        function startTopBarClock() {
            const timeEl = document.getElementById("topBarTime");
            const dateEl = document.getElementById("topBarDate");
            if (!timeEl || !dateEl) return;
            
            const updateClock = () => {
                const now = new Date();
                timeEl.textContent = now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
                dateEl.textContent = now.toLocaleDateString("en-IN", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
            };
            updateClock();
            setInterval(updateClock, 1000);
        }
        startTopBarClock();

        // Global Search routing
        const globalSearch = document.getElementById("globalSearchInput");
        if (globalSearch) {
            globalSearch.addEventListener("keyup", () => {
                const val = globalSearch.value;
                const activeBtn = document.querySelector(".nav-btn--active");
                const activeId = activeBtn ? activeBtn.id : "";
                
                if (activeId === "inventoryBtn" || activeId === "dashboardBtn") {
                    const searchProduct = document.getElementById("searchProduct");
                    if (searchProduct) {
                        searchProduct.value = val;
                        searchProduct.dispatchEvent(new Event('keyup'));
                    }
                } else if (activeId === "reportsBtn") {
                    const reportSearch = document.getElementById("reportSearch");
                    if (reportSearch) {
                        reportSearch.value = val;
                        reportSearch.dispatchEvent(new Event('keyup'));
                    }
                } else if (activeId === "customersBtn") {
                    const searchCustomers = document.getElementById("searchCustomers");
                    if (searchCustomers) {
                        searchCustomers.value = val;
                        searchCustomers.dispatchEvent(new Event('keyup'));
                    }
                }
            });
        }

        // Customer tab rendering logic
        async function renderCustomersTab() {
            const customersBody = document.getElementById("customersBody");
            if (!customersBody) return;
            
            try {
                const sales = await window.electronAPI.getSales();
                if (!sales || !sales.length) {
                    customersBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">No customer records found</td></tr>`;
                    return;
                }
                
                const customerMap = {};
                sales.forEach(sale => {
                    const name = sale.customer_name || "Walk-in Customer";
                    const mobile = sale.customer_mobile || "—";
                    const key = `${name}_${mobile}`;
                    
                    if (!customerMap[key]) {
                        customerMap[key] = {
                            name: name,
                            mobile: mobile,
                            invoices: new Set(),
                            revenue: 0,
                            paymentModes: new Set()
                        };
                    }
                    
                    if (sale.bill_id) {
                        customerMap[key].invoices.add(sale.bill_id);
                    }
                    customerMap[key].revenue += Number(sale.total_sale || 0);
                    if (sale.payment_mode) {
                        customerMap[key].paymentModes.add(sale.payment_mode);
                    }
                });
                
                const customerList = Object.values(customerMap);
                customerList.sort((a, b) => b.revenue - a.revenue);
                
                if (!customerList.length) {
                    customersBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">No customer records found</td></tr>`;
                    return;
                }
                
                customersBody.innerHTML = customerList.map(c => {
                    const paymentModesStr = Array.from(c.paymentModes).join(", ") || "—";
                    return `
                        <tr>
                            <td><strong>${c.name}</strong></td>
                            <td>${c.mobile}</td>
                            <td>${c.invoices.size} invoices</td>
                            <td><strong>₹${c.revenue.toFixed(2)}</strong></td>
                            <td>${paymentModesStr}</td>
                        </tr>
                    `;
                }).join("");
                
            } catch (err) {
                console.error("Failed to load customer registry:", err);
                customersBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-danger);">Error loading customer records</td></tr>`;
            }
        }

        const searchCustomersInput = document.getElementById("searchCustomers");
        if (searchCustomersInput) {
            searchCustomersInput.addEventListener("keyup", () => {
                const query = searchCustomersInput.value.toLowerCase().trim();
                const rows = document.querySelectorAll("#customersBody tr");
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(query) ? "" : "none";
                });
            });
        }

        // Override loadSales to also render the Dashboard's Recent Transactions
        const originalLoadSales = window.loadSales;
        window.loadSales = async function() {
            if (originalLoadSales) await originalLoadSales();
            
            try {
                const sales = await window.electronAPI.getSales();
                const dashboardTable = document.getElementById("dashboardRecentSalesBody");
                
                if (dashboardTable && sales) {
                    dashboardTable.innerHTML = "";
                    const recentSales = sales.slice(0, 5); // Take 5 most recent
                    
                    if (recentSales.length === 0) {
                        dashboardTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No transactions recorded today</td></tr>`;
                        return;
                    }
                    
                    recentSales.forEach(sale => {
                        dashboardTable.innerHTML += `
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
            } catch (e) {
                console.error("Error populating recent transactions:", e);
            }
        };
        
        // Initial triggering
        setTimeout(() => {
            window.loadSales();
        }, 1500);

        // POS Stepper Buttons
        const posQtyDec = document.getElementById("posQtyDec");
        const posQtyInc = document.getElementById("posQtyInc");
        const sellQtyInput = document.getElementById("sellQty");
        
        if (posQtyDec && sellQtyInput) {
            posQtyDec.addEventListener("click", () => {
                let val = parseInt(sellQtyInput.value) || 1;
                if (val > 1) {
                    sellQtyInput.value = val - 1;
                }
            });
        }
        if (posQtyInc && sellQtyInput) {
            posQtyInc.addEventListener("click", () => {
                let val = parseInt(sellQtyInput.value) || 1;
                sellQtyInput.value = val + 1;
            });
        }

        // Live Calculations on Discount & Tax & Cash Received
        const discountRateInput = document.getElementById("discountRate");
        const taxRateInput = document.getElementById("taxRate");
        const cashReceivedInput = document.getElementById("cashReceived");

        if (discountRateInput) {
            discountRateInput.addEventListener("input", updateBillTotals);
            discountRateInput.addEventListener("change", updateBillTotals);
        }
        if (taxRateInput) {
            taxRateInput.addEventListener("input", updateBillTotals);
            taxRateInput.addEventListener("change", updateBillTotals);
        }
        if (cashReceivedInput) {
            cashReceivedInput.addEventListener("input", calculateBalanceReturn);
        }

        // Save Draft Button
        const saveDraftBtn = document.getElementById("saveDraftBtn");
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener("click", () => {
                if (sellCart.length === 0) {
                    showToast("Cannot save draft on empty cart.", "warn");
                    return;
                }
                const draft = {
                    cart: sellCart,
                    customerName: document.getElementById("customerName").value,
                    customerMobile: document.getElementById("customerMobile").value,
                    discountRate: document.getElementById("discountRate").value,
                    taxRate: document.getElementById("taxRate").value,
                    paymentMode: document.getElementById("paymentMode").value,
                    cashReceived: document.getElementById("cashReceived").value
                };
                localStorage.setItem("amDraftBill", JSON.stringify(draft));
                showToast("Draft bill saved successfully!", "success");
            });
        }

        // Check for draft in openSellBillModal context
        const originalOpenSellBillModal = window.openSellBillModal;
        window.openSellBillModal = async function() {
            if (originalOpenSellBillModal) {
                await originalOpenSellBillModal();
            }
            const savedDraft = localStorage.getItem("amDraftBill");
            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    sellCart = draft.cart || [];
                    document.getElementById("customerName").value = draft.customerName || "";
                    document.getElementById("customerMobile").value = draft.customerMobile || "";
                    document.getElementById("discountRate").value = draft.discountRate || "0";
                    document.getElementById("taxRate").value = draft.taxRate || "0";
                    document.getElementById("paymentMode").value = draft.paymentMode || "Cash";
                    document.getElementById("cashReceived").value = draft.cashReceived || "";
                    renderBillCart();
                    localStorage.removeItem("amDraftBill"); // clear after restore
                    showToast("Draft bill restored successfully!", "success");
                } catch (e) {
                    console.error("Failed to restore draft:", e);
                }
            }
        };

        // Preview Invoice Button (Draft Preview)
        const previewInvoiceBtn = document.getElementById("previewInvoiceBtn");
        if (previewInvoiceBtn) {
            previewInvoiceBtn.addEventListener("click", () => {
                if (sellCart.length === 0) {
                    showToast("Add items to cart to preview receipt.", "warn");
                    return;
                }
                const subtotal = sellCart.reduce((sum, item) => sum + item.lineTotal, 0);
                const discountRate = parseFloat(document.getElementById("discountRate").value) || 0;
                const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;
                const draftData = {
                    profile: getShopProfileFromDOM(),
                    lines: sellCart.map(item => ({
                        product_name: item.productName,
                        qty: item.qty,
                        sell_price: item.sellPrice,
                        total_sale: item.lineTotal
                    })),
                    billId: null,
                    totalSale: subtotal,
                    paymentMode: document.getElementById("paymentMode").value,
                    customerName: document.getElementById("customerName").value.trim(),
                    customerMobile: document.getElementById("customerMobile").value.trim(),
                    tax: taxRate,
                    discount: discountRate,
                    date: new Date().toLocaleString()
                };
                openInvoicePreview(null, true, draftData);
            });
        }

        // Invoice Preview Modal Actions (Print, PDF, Share, Cancel)
        const previewPrintBtn = document.getElementById("previewPrintBtn");
        const previewPdfBtn = document.getElementById("previewPdfBtn");
        const previewShareBtn = document.getElementById("previewShareBtn");
        const previewCancelBtn = document.getElementById("previewCancelBtn");
        const closeInvoicePreviewModal = document.getElementById("closeInvoicePreviewModal");
        const invoicePreviewModal = document.getElementById("invoicePreviewModal");

        if (previewPrintBtn) {
            previewPrintBtn.addEventListener("click", async () => {
                if (!currentPreviewBillId) {
                    showToast("No active bill to print. Complete sale first.", "warn");
                    return;
                }
                await window.printBillById(currentPreviewBillId);
            });
        }
        if (previewPdfBtn) {
            previewPdfBtn.addEventListener("click", async () => {
                if (!currentPreviewBillId) {
                    showToast("No active bill to download. Complete sale first.", "warn");
                    return;
                }
                await window.exportBillPdfById(currentPreviewBillId);
            });
        }
        if (previewShareBtn) {
            previewShareBtn.addEventListener("click", async () => {
                if (!currentPreviewBillId) {
                    showToast("No active bill to share. Complete sale first.", "warn");
                    return;
                }
                await window.exportBillPdfById(currentPreviewBillId);
            });
        }
        const closePreview = () => {
            if (invoicePreviewModal) {
                invoicePreviewModal.style.display = "none";
            }
        };
        if (previewCancelBtn) previewCancelBtn.addEventListener("click", closePreview);
        if (closeInvoicePreviewModal) closeInvoicePreviewModal.addEventListener("click", closePreview);

        // Product Autocomplete Suggestions logic
        const posSearchInput = document.getElementById("posSearchInput");
        const posSearchResults = document.getElementById("posSearchResults");
        let selectedSearchIndex = -1;

        if (posSearchInput && posSearchResults) {
            posSearchInput.addEventListener("input", () => {
                const query = posSearchInput.value.toLowerCase().trim();
                if (!query) {
                    posSearchResults.hidden = true;
                    return;
                }
                const matches = sellProductsCache.filter(p => 
                    p.name.toLowerCase().includes(query) || 
                    (p.category && p.category.toLowerCase().includes(query))
                );
                if (matches.length === 0) {
                    posSearchResults.innerHTML = `<li class="pos-search-item text-muted" style="padding: 8px 12px; font-size: 11px;">No matches</li>`;
                    posSearchResults.hidden = false;
                    selectedSearchIndex = -1;
                    return;
                }
                selectedSearchIndex = 0;
                posSearchResults.innerHTML = matches.map((p, idx) => `
                    <li class="pos-search-item ${idx === 0 ? 'is-selected' : ''}" data-id="${p.id}" style="padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); font-size: 11px;">
                        <span><strong>${p.name}</strong></span>
                        <span style="color: var(--text-muted);">₹${p.sell_price} | Stock: ${p.stock}</span>
                    </li>
                `).join("");
                posSearchResults.hidden = false;
            });

            posSearchInput.addEventListener("keydown", (e) => {
                const items = posSearchResults.querySelectorAll(".pos-search-item");
                if (posSearchResults.hidden || items.length === 0) return;

                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    items[selectedSearchIndex]?.classList.remove("is-selected");
                    selectedSearchIndex = (selectedSearchIndex + 1) % items.length;
                    items[selectedSearchIndex].classList.add("is-selected");
                    items[selectedSearchIndex].scrollIntoView({ block: "nearest" });
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    items[selectedSearchIndex]?.classList.remove("is-selected");
                    selectedSearchIndex = (selectedSearchIndex - 1 + items.length) % items.length;
                    items[selectedSearchIndex].classList.add("is-selected");
                    items[selectedSearchIndex].scrollIntoView({ block: "nearest" });
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    const selected = items[selectedSearchIndex];
                    if (selected && selected.dataset.id) {
                        selectProductFromSearch(selected.dataset.id);
                    }
                } else if (e.key === "Escape") {
                    posSearchResults.hidden = true;
                }
            });

            // Delegate click for suggestion list
            posSearchResults.addEventListener("click", (e) => {
                const item = e.target.closest(".pos-search-item");
                if (item && item.dataset.id) {
                    selectProductFromSearch(item.dataset.id);
                }
            });
        }

        // Global click to hide suggestions
        document.addEventListener("click", (e) => {
            if (posSearchResults && !e.target.closest(".pos-search-wrapper")) {
                posSearchResults.hidden = true;
            }
        });

        function selectProductFromSearch(id) {
            if (sellProductSelect) {
                sellProductSelect.value = id;
                sellProductSelect.dispatchEvent(new Event("change"));
            }
            if (posSearchInput) {
                const prod = sellProductsCache.find(p => p.id == id);
                posSearchInput.value = prod ? prod.name : "";
            }
            if (posSearchResults) {
                posSearchResults.hidden = true;
            }
            // Focus unit price field
            const qtyField = document.getElementById("sellQty");
            if (qtyField) {
                qtyField.focus();
                qtyField.select();
            }
        }

        // Barcode scanner logic
        const posBarcodeInput = document.getElementById("posBarcodeInput");
        if (posBarcodeInput) {
            posBarcodeInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const code = posBarcodeInput.value.trim();
                    if (!code) return;

                    // Match product by ID or name
                    let matchedProduct = null;
                    if (/^\d+$/.test(code)) {
                        const id = parseInt(code);
                        matchedProduct = sellProductsCache.find(p => p.id === id);
                    }
                    if (!matchedProduct) {
                        matchedProduct = sellProductsCache.find(p => p.name.toLowerCase() === code.toLowerCase());
                    }
                    if (!matchedProduct) {
                        matchedProduct = sellProductsCache.find(p => p.category && p.category.toLowerCase() === code.toLowerCase());
                    }

                    if (matchedProduct) {
                        sellProductSelect.value = matchedProduct.id;
                        sellProductSelect.dispatchEvent(new Event("change"));
                        if (sellQtyInput) sellQtyInput.value = "1";
                        addItemToBill();
                        posBarcodeInput.value = "";
                        posBarcodeInput.focus();
                    } else {
                        showToast(`No product found for code: "${code}"`, "warn");
                        posBarcodeInput.select();
                    }
                }
            });
        }
    });

    // Also trigger on initApp
    setTimeout(() => {
        updateCloudStatusUI();
    }, 1000);