const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    shell
} = require("electron");

const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// Configure logging & updater
log.transports.file.level = "debug";
autoUpdater.logger = log;
log.info("RetailHub App starting...");

app.setName("RetailHub");

if (process.platform === "win32") {
    app.setAppUserModelId("com.retailhub.app");
}

const fs = require("fs");
const path = require("path");

// ─── Load .env (credentials, never committed to Git) ─────────────────────────
(function loadEnv() {
    const envPath = path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx < 1) continue;
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim();
            if (!process.env[key]) process.env[key] = val;
        }
        log.info(".env loaded from:", envPath);
    } else {
        log.warn(".env not found at:", envPath, "— OAuth credentials must be set via environment variables.");
    }
})();

const XLSX = require("xlsx");
const http = require("http");
const https = require("https");
const querystring = require("querystring");
const {
    verifyPassword,
    hashPassword
} = require("./auth");

const {
    getDataPaths,
    migrateLegacyData
} = require("./dataPaths");

const cloudStorage = require("./cloudStorage");

let db = null;
let mainWindow = null;
let dbFilePath = null;
let backupsDir = null;

function removeSqliteSidecars(filePath) {

    for (const suffix of ["-wal", "-shm"]) {

        const sidecar = filePath + suffix;

        if (fs.existsSync(sidecar)) {
            fs.unlinkSync(sidecar);
        }

    }

}

function getLatestBackupFile(backupsDir) {

    if (!fs.existsSync(backupsDir)) {
        return null;
    }

    const files =
        fs.readdirSync(backupsDir)
            .filter((name) =>
                name.endsWith(".db")
            )
            .map((name) => {

                const fullPath =
                    path.join(backupsDir, name);

                return {
                    name,
                    fullPath,
                    mtime:
                        fs.statSync(fullPath).mtimeMs
                };

            })
            .sort((a, b) => b.mtime - a.mtime);

    return files[0] || null;

}

let dbIsClosed = false;

async function waitForDatabase() {

    if (dbIsClosed || !db) {
        await openDatabase();
    }

    if (db && db.ready) {
        await db.ready;
    }

}

function checkDbIntegrity() {
    return new Promise((resolve) => {
        if (dbIsClosed || !db) {
            resolve(false);
            return;
        }
        db.get("PRAGMA integrity_check", [], (err, row) => {
            if (err) {
                console.error("Integrity check query failed:", err.message);
                resolve(false);
            } else if (row && row.integrity_check === "ok") {
                resolve(true);
            } else {
                console.error("Integrity check failed:", row ? row.integrity_check : "unknown");
                resolve(false);
            }
        });
    });
}

function runCheckpoint() {

    return new Promise((resolve, reject) => {

        if (dbIsClosed || !db) {
            reject(new Error("Database is not open"));
            return;
        }

        db.run(
            "PRAGMA wal_checkpoint(TRUNCATE)",
            (err) => {

                if (err) {
                    reject(err);
                } else {
                    resolve();
                }

            }
        );

    });

}

async function dbGet(sql, params) {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.get(sql, params, (err, row) => {

            if (err) {
                reject(err);
            } else {
                resolve(row);
            }

        });

    });

}

async function dbRun(sql, params) {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.run(sql, params, function (err) {

            if (err) {
                reject(err);
            } else {
                resolve({
                    changes: this.changes,
                    lastID: this.lastID
                });
            }

        });

    });

}

function closeDatabase() {

    return new Promise((resolve, reject) => {

        if (dbIsClosed || !db) {
            resolve();
            return;
        }

        db.close((err) => {

            dbIsClosed = true;

            if (
                err &&
                !/closed/i.test(err.message)
            ) {
                reject(err);
                return;
            }

            resolve();

        });

    });

}

function openDatabase() {

    const paths = getDataPaths();

    process.env.GNC_DB_PATH = paths.dbPath;
    dbFilePath = paths.dbPath;
    backupsDir = paths.backupsDir;

    if (db && !dbIsClosed) {
        return Promise.resolve(db);
    }

    delete require.cache[
        require.resolve("./database")
    ];

    db = require("./database");
    dbIsClosed = false;

    return db.ready.then(() => {
        try {
            cloudStorage.initCloudStorage(app.getPath("userData"), dbFilePath);
            startAutoBackupTimer();
        } catch (e) {
            console.error("Cloud storage initialization failed in openDatabase:", e);
        }
        return db;
    });

}

async function initApplicationData() {

    const paths = migrateLegacyData();

    dbFilePath = paths.dbPath;
    backupsDir = paths.backupsDir;
    process.env.GNC_DB_PATH = paths.dbPath;

    delete require.cache[
        require.resolve("./database")
    ];

    db = require("./database");
    dbIsClosed = false;

    await db.ready;

    try {
        cloudStorage.initCloudStorage(app.getPath("userData"), dbFilePath);
        startAutoBackupTimer();
    } catch (e) {
        console.error("Cloud storage initialization failed in initApplicationData:", e);
    }

}

async function reconnectDatabase() {

    await closeDatabase();
    await openDatabase();
    return db;

}

function createWindow() {

    let iconPath = path.join(__dirname, "build/icon.ico");
    
    // When packaged, the icon is embedded in the executable, but we can still try to use the build folder
    if (app.isPackaged) {
        iconPath = path.join(process.resourcesPath, "../build/icon.ico");
        if (!fs.existsSync(iconPath)) {
            // Fallback: use the embedded icon from the executable
            iconPath = path.join(process.execPath, "../..");
        }
    }

    mainWindow = new BrowserWindow({

        width: 1280,
        height: 860,
        minWidth: 1024,
        minHeight: 700,
        autoHideMenuBar: true,
        icon: fs.existsSync(iconPath) ? iconPath : undefined,

        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }

    });

    mainWindow.loadFile("index.html");

}

function buildBillPrintHtml(data) {

    const profile = data.profile || {};
    const lines = data.lines || [];
    const billId = data.billId;
    const billLabel =
        billId ? (String(billId).startsWith("RH-") ? String(billId) : `#${String(billId).slice(-6)}`) : "—";

    const discountRate = Number(data.discount) || 0;
    const taxRate = Number(data.tax) || 0;
    const factor = (1 - discountRate / 100) * (1 + taxRate / 100);
    const safeFactor = factor > 0 ? factor : 1;

    let subtotal = 0;
    const rows = lines.map((line) => {
        const netPrice = Number(line.sell_price) || 0;
        const basePrice = netPrice / safeFactor;
        const baseAmount = basePrice * (Number(line.qty) || 0);
        subtotal += baseAmount;
        return `
            <tr>
                <td>${line.product_name}</td>
                <td class="num">${line.qty}</td>
                <td class="num">₹${basePrice.toFixed(2)}</td>
                <td class="num">₹${baseAmount.toFixed(2)}</td>
            </tr>
        `;
    }).join("");

    const discountAmount = subtotal * (discountRate / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const grandTotal = taxableAmount + taxAmount;

    const qrData = `Bill ID: ${billLabel}\nTotal: ₹${grandTotal.toFixed(2)}\nShop: ${profile.shop_name || "RetailHub"}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Bill ${billLabel}</title>
<style>
@page { size: auto; margin: 0mm; }
body {
    font-family: 'Courier New', Courier, monospace;
    width: 80mm;
    margin: 0 auto;
    padding: 6mm;
    color: #000;
    background: #fff;
    font-size: 11px;
    line-height: 1.4;
}
.center { text-align: center; }
.right { text-align: right; }
.logo-wrap { text-align: center; margin-bottom: 6px; }
.logo { max-width: 50px; max-height: 50px; object-fit: contain; }
.shop-name { font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 2px 0; }
.shop-details { font-size: 10px; margin-bottom: 8px; }
.divider { border-top: 1px dashed #000; margin: 8px 0; }
.meta-table { width: 100%; margin-bottom: 6px; font-size: 10px; }
.meta-table td { padding: 1px 0; }
.item-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
.item-table th, .item-table td { padding: 4px 0; font-size: 10px; text-align: left; }
.item-table th { font-weight: bold; border-bottom: 1px dashed #000; }
.item-table td { border-bottom: 1px dotted #ccc; }
.item-table .num { text-align: right; }
.totals-wrap { width: 100%; font-size: 10px; margin-bottom: 8px; }
.totals-wrap td { padding: 2px 0; }
.totals-wrap .grand-total { font-size: 13px; font-weight: bold; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; }
.qr-wrap { text-align: center; margin: 12px 0 6px; }
.qr-wrap img { width: 90px; height: 90px; }
.footer { font-size: 9px; text-align: center; margin-top: 8px; }
</style>
</head>
<body>
<div class="logo-wrap">
    ${profile.logo ? `<img src="${profile.logo}" class="logo" alt="logo">` : ""}
    <div class="shop-name">${profile.shop_name || "RETAIL HUB"}</div>
    <div class="shop-details">
        ${profile.address && profile.address !== "-" ? `<div>${profile.address}</div>` : ""}
        ${profile.mobile && profile.mobile !== "-" ? `<div>Mob: ${profile.mobile}</div>` : ""}
        ${profile.email && profile.email !== "-" ? `<div>Email: ${profile.email}</div>` : ""}
        ${profile.gst_number && profile.gst_number !== "-" ? `<div>GSTIN: ${profile.gst_number}</div>` : ""}
    </div>
</div>

<div class="divider"></div>

<table class="meta-table">
    <tr>
        <td><strong>Bill ID:</strong> ${billLabel}</td>
        <td class="right"><strong>Date:</strong> ${data.date || ""}</td>
    </tr>
    <tr>
        <td><strong>Cust:</strong> ${data.customerName || "Walk-in Customer"}</td>
        <td class="right"><strong>Mob:</strong> ${data.customerMobile || "—"}</td>
    </tr>
    <tr>
        <td><strong>Payment:</strong> ${data.paymentMode || "Cash"}</td>
        <td></td>
    </tr>
</table>

<div class="divider"></div>

<table class="item-table">
    <thead>
        <tr>
            <th>Item Description</th>
            <th class="num">Qty</th>
            <th class="num">Rate</th>
            <th class="num">Amt</th>
        </tr>
    </thead>
    <tbody>
        ${rows}
    </tbody>
</table>

<table class="totals-wrap">
    <tr>
        <td>Subtotal</td>
        <td class="right">₹${subtotal.toFixed(2)}</td>
    </tr>
    ${discountRate > 0 ? `
    <tr>
        <td>Discount (${discountRate}%)</td>
        <td class="right">-₹${discountAmount.toFixed(2)}</td>
    </tr>
    ` : ""}
    ${taxRate > 0 ? `
    <tr>
        <td>Tax (${taxRate}%)</td>
        <td class="right">+₹${taxAmount.toFixed(2)}</td>
    </tr>
    ` : ""}
    <tr class="grand-total">
        <td>GRAND TOTAL</td>
        <td class="right">₹${grandTotal.toFixed(2)}</td>
    </tr>
</table>

<div class="qr-wrap">
    <img src="${qrCodeUrl}" alt="QR Code">
</div>

<div class="footer">
    Thank you for your visit!<br>
    Powered by RetailHub POS
</div>
</body>
</html>`;

}

ipcMain.handle("save-product", async (event, product) => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.run(
            `INSERT INTO products
            (name, category, buy_price, sell_price, stock)
            VALUES (?, ?, ?, ?, ?)`,
            [
                product.name,
                product.category,
                product.buyPrice,
                product.sellPrice,
                product.stock
            ],
            function(err) {

                if (err) {
                    reject(err);
                } else {
                    triggerAutoCloudSync();
                    resolve({
                        success: true,
                        id: this.lastID
                    });
                }

            }
        );

    });

});

ipcMain.handle("get-products", async () => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.all(
            "SELECT * FROM products ORDER BY id DESC",
            [],
            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }

            }
        );

    });

});

ipcMain.handle("delete-product", async (event, id) => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.run(
            "DELETE FROM products WHERE id = ?",
            [id],
            function(err) {

                if (err) {
                    reject(err);
                } else {
                    triggerAutoCloudSync();
                    resolve({
                        success: true
                    });
                }

            }
        );

    });

});

ipcMain.handle("update-stock", async (event, id, stock) => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.run(
            "UPDATE products SET stock = ? WHERE id = ?",
            [stock, id],
            function(err) {

                if (err) {
                    reject(err);
                } else {
                    triggerAutoCloudSync();
                    resolve({
                        success: true
                    });
                }

            }
        );

    });

});

ipcMain.handle("edit-product", async (event, product) => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.get(
            "SELECT * FROM products WHERE id = ?",
            [product.id],
            (err, oldProduct) => {

                if (err || !oldProduct) {
                    reject(err || "Product Not Found");
                    return;
                }

                db.run(
                    `
                    UPDATE products
                    SET
                        name = ?,
                        category = ?,
                        buy_price = ?,
                        sell_price = ?
                    WHERE id = ?
                    `,
                    [
                        product.name,
                        product.category,
                        product.buyPrice,
                        product.sellPrice,
                        product.id
                    ],
                    function(err) {

                        if (err) {
                            reject(err);
                            return;
                        }

                        db.run(
                            `
                            INSERT INTO price_history
                            (
                                product_id,
                                product_name,
                                old_buy_price,
                                new_buy_price,
                                old_sell_price,
                                new_sell_price
                            )
                            VALUES (?, ?, ?, ?, ?, ?)
                            `,
                            [
                                oldProduct.id,
                                oldProduct.name,
                                oldProduct.buy_price,
                                product.buyPrice,
                                oldProduct.sell_price,
                                product.sellPrice
                            ],
                            (historyErr) => {

                                if (historyErr) {
                                    reject(historyErr);
                                } else {
                                    triggerAutoCloudSync();
                                    resolve({
                                        success: true
                                    });
                                }

                            }
                        );

                    }
                );

            }
        );

    });

});

/* SELL PRODUCT */

ipcMain.handle("sell-product", async (event, sale) => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.get(
            "SELECT * FROM products WHERE id = ?",
            [sale.productId],
            (err, product) => {

                if (err || !product) {
                    reject("Product Not Found");
                    return;
                }

                if (product.stock < sale.qty) {
                    reject("Not Enough Stock");
                    return;
                }

                const newStock =
                    product.stock - sale.qty;

                const totalSale =
                    sale.qty * sale.sellPrice;

                const profit =
                    (sale.sellPrice - product.buy_price)
                    * sale.qty;

                db.run(
                    "UPDATE products SET stock = ? WHERE id = ?",
                    [newStock, sale.productId]
                );

               db.run(
    `INSERT INTO sales
    (
        product_id,
        product_name,
        qty,
        buy_price,
        sell_price,
        total_sale,
        profit,
        payment_mode
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
        product.id,
        product.name,
        sale.qty,
        product.buy_price,
        sale.sellPrice,
        totalSale,
        profit,
        sale.paymentMode

    ],
                    function(err) {

                        if (err) {
                            reject(err);
                        } else {
                            triggerAutoCloudSync();
                            resolve({
                                success: true,
                                profit,
                                totalSale
                            });

                        }

                    }
                );

            }
        );

    });

});

ipcMain.handle("sell-bill", async (event, bill) => {

    const items = bill.items || [];

    if (items.length === 0) {
        throw new Error("Add at least one item to the bill");
    }

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        let totalSale = 0;
        let totalProfit = 0;
        let index = 0;

        db.serialize(() => {

            db.run("BEGIN TRANSACTION");

            db.get("SELECT current_number FROM bill_sequence WHERE id = 1", [], (seqErr, seqRow) => {
                if (seqErr) {
                    db.run("ROLLBACK");
                    reject(seqErr.message || seqErr);
                    return;
                }

                const nextNumber = (seqRow ? seqRow.current_number : 0) + 1;
                const year = new Date().getFullYear();
                const billId = `RH-${year}-${String(nextNumber).padStart(6, '0')}`;

                db.run("INSERT OR REPLACE INTO bill_sequence (id, current_number) VALUES (1, ?)", [nextNumber], (seqUpdateErr) => {
                    if (seqUpdateErr) {
                        db.run("ROLLBACK");
                        reject(seqUpdateErr.message || seqUpdateErr);
                        return;
                    }

                    const finish = (err, result) => {

                        if (err) {
                            db.run("ROLLBACK");
                            reject(err.message || err);
                        } else {
                            db.run(
                                "COMMIT",
                                (commitErr) => {
                                    if (commitErr) {
                                        reject(commitErr.message);
                                    } else {
                                        triggerAutoCloudSync();
                                        resolve(result);
                                    }
                                }
                            );
                        }

                    };

                    const processNext = () => {

                        if (index >= items.length) {
                            finish(null, {
                                success: true,
                                billId,
                                totalSale,
                                totalProfit,
                                itemCount: items.length
                            });
                            return;
                        }

                        const item = items[index++];

                        db.get(
                            "SELECT * FROM products WHERE id = ?",
                            [item.productId],
                            (err, product) => {

                                if (err || !product) {
                                    finish("Product not found");
                                    return;
                                }

                                const qty =
                                    Number(item.qty);

                                const sellPrice =
                                    Number(item.sellPrice);

                                if (!qty || qty <= 0) {
                                    finish("Invalid quantity");
                                    return;
                                }

                                if (!sellPrice && sellPrice !== 0) {
                                    finish("Invalid sell price");
                                    return;
                                }

                                if (product.stock < qty) {
                                    finish(
                                        `Not enough stock for ${product.name} (have ${product.stock})`
                                    );
                                    return;
                                }

                                const lineTotal =
                                    qty * sellPrice;

                                const lineProfit =
                                    (sellPrice - product.buy_price) * qty;

                                const newStock =
                                    product.stock - qty;

                                totalSale += lineTotal;
                                totalProfit += lineProfit;

                                db.run(
                                    "UPDATE products SET stock = ? WHERE id = ?",
                                    [newStock, product.id],
                                    (updateErr) => {

                                        if (updateErr) {
                                            finish(updateErr);
                                            return;
                                        }

                                        db.run(
                                            `
                                            INSERT INTO sales
                                            (
                                                product_id,
                                                product_name,
                                                qty,
                                                buy_price,
                                                sell_price,
                                                total_sale,
                                                profit,
                                                payment_mode,
                                                bill_id,
                                                customer_name,
                                                customer_mobile,
                                                tax,
                                                discount
                                            )
                                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                            `,
                                            [
                                                product.id,
                                                product.name,
                                                qty,
                                                product.buy_price,
                                                sellPrice,
                                                lineTotal,
                                                lineProfit,
                                                bill.paymentMode,
                                                billId,
                                                bill.customerName || "",
                                                bill.customerMobile || "",
                                                bill.tax || 0,
                                                bill.discount || 0
                                            ],
                                            (insertErr) => {

                                                if (insertErr) {
                                                    finish(insertErr);
                                                } else {
                                                    processNext();
                                                }

                                            }
                                        );

                                    }
                                );

                            }
                        );

                    };

                    processNext();
                });
            });

        });

    });

});

/* SALES HISTORY */

ipcMain.handle("get-sales", async () => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.all(
            "SELECT * FROM sales ORDER BY id DESC",
            [],
            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }

            }
        );

    });

});

ipcMain.handle("get-price-history", async () => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.all(
            `
            SELECT *
            FROM price_history
            ORDER BY id DESC
            `,
            [],
            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }

            }
        );

    });

});

// Configure auto-updater events to communicate with the renderer
autoUpdater.on("checking-for-update", () => {
    log.info("Checking for update...");
    if (mainWindow) mainWindow.webContents.send("updater:checking-for-update");
});

autoUpdater.on("update-available", (info) => {
    log.info("Update available: version " + info.version);
    if (mainWindow) mainWindow.webContents.send("updater:update-available", info);
});

autoUpdater.on("update-not-available", (info) => {
    log.info("Update not available.");
    if (mainWindow) mainWindow.webContents.send("updater:update-not-available", info);
});

autoUpdater.on("download-progress", (progressObj) => {
    log.info(`Download progress: ${progressObj.percent}%`);
    if (mainWindow) mainWindow.webContents.send("updater:download-progress", progressObj);
});

autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded: version " + info.version);
    if (mainWindow) mainWindow.webContents.send("updater:update-downloaded", info);
});

autoUpdater.on("error", (err) => {
    log.error("Updater error:", err);
    if (mainWindow) mainWindow.webContents.send("updater:error", err.message || String(err));
});

// IPC handler for triggering update checks
ipcMain.handle("check-for-updates", async () => {
    log.info("Renderer requested update check. app.isPackaged:", app.isPackaged);
    if (app.isPackaged) {
        try {
            const result = await autoUpdater.checkForUpdates();
            return { success: true, result };
        } catch (err) {
            log.error("checkForUpdates failed:", err);
            return { success: false, error: err.message };
        }
    } else {
        // Dev Simulation Mode (so developers can test UI response smoothly)
        log.info("Running in development mode, simulating clean updater lifecycle.");
        if (mainWindow) {
            mainWindow.webContents.send("updater:checking-for-update");
            setTimeout(() => {
                mainWindow.webContents.send("updater:update-not-available", { version: app.getVersion() });
            }, 1500);
        }
        return { success: true, devMode: true };
    }
});

// IPC handler for getting real app version
ipcMain.handle("get-app-version", () => {
    return app.getVersion();
});

// IPC handler for restarting to install the update
ipcMain.handle("install-update", () => {
    log.info("Quitting and installing update...");
    autoUpdater.quitAndInstall();
    return { success: true };
});

app.whenReady().then(async () => {

    try {
        await initApplicationData();
    } catch (err) {
        console.error("Database init failed:", err);
    }

    createWindow();

    // Check for updates automatically in production after window is shown
    if (app.isPackaged) {
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify().catch(err => {
                log.error("Automatic update check on startup failed:", err);
            });
        }, 3000);
    }

});

ipcMain.handle("navigate", async (event, page) => {

    const win =
        BrowserWindow.fromWebContents(event.sender) ||
        mainWindow;

    if (!win) {
        return { success: false };
    }

    const filePath =
        path.isAbsolute(page)
            ? page
            : path.join(__dirname, page);

    await win.loadFile(filePath);

    return { success: true };

});

ipcMain.handle("get-data-folder", async () => {

    const paths = getDataPaths();

    return {
        success: true,
        path: paths.userDataDir
    };

});

ipcMain.handle(
    "resolve-session-user",
    async (event, username) => {

        await waitForDatabase();

        const name =
            (username || "").trim();

        if (!name) {
            return {
                success: false,
                error: "No username"
            };
        }

        return new Promise((resolve, reject) => {

            db.get(
                `
                SELECT id, username, display_name
                FROM users
                WHERE username = ?
                `,
                [name],
                (err, row) => {

                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve({
                            success: false,
                            error: "Account not found"
                        });
                        return;
                    }

                    resolve({
                        success: true,
                        user: {
                            id: Number(row.id),
                            username: row.username,
                            displayName:
                                row.display_name ||
                                row.username
                        }
                    });

                }
            );

        });

    }
);

ipcMain.handle("login", async (event, credentials) => {

    await waitForDatabase();

    const loginUsername =
        (credentials.username || "").trim();

    const loginPassword =
        String(credentials.password || "").trim();

    return new Promise((resolve, reject) => {

        db.get(
            "SELECT * FROM users WHERE username = ?",
            [loginUsername],
            (err, user) => {

                if (err) {
                    reject(err);
                    return;
                }

                if (
                    !user ||
                    !verifyPassword(
                        loginPassword,
                        user.password_hash
                    )
                ) {
                    resolve({
                        success: false,
                        error: "Invalid username or password"
                    });
                    return;
                }

                resolve({
                    success: true,
                    user: {
                        id: Number(user.id),
                        username: user.username,
                        displayName:
                            user.display_name || user.username
                    }
                });

            }
        );

    });

});

ipcMain.handle("get-account", async (event, userId) => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.get(
            `
            SELECT id, username, display_name
            FROM users
            WHERE id = ?
            `,
            [Number(userId)],
            (err, row) => {

                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve({
                        success: false,
                        error: "Account not found"
                    });
                } else {
                    resolve({
                        success: true,
                        account: {
                            id: Number(row.id),
                            username: row.username,
                            displayName:
                                row.display_name || row.username
                        }
                    });
                }

            }
        );

    });

});

ipcMain.handle("update-account", async (event, data) => {

    try {

        await waitForDatabase();

        const userId =
            Number(data.userId);

        const username =
            (data.username || "").trim();

        const displayName =
            (data.displayName || "").trim();

        const currentPassword =
            String(data.currentPassword || "").trim();

        const newPassword =
            String(data.newPassword || "").trim();

        const confirmPassword =
            String(data.confirmPassword || "").trim();

        if (!userId) {
            return {
                success: false,
                error: "Not signed in"
            };
        }

        if (!username) {
            return {
                success: false,
                error: "Login ID is required"
            };
        }

        if (!currentPassword) {
            return {
                success: false,
                error: "Enter your current password"
            };
        }

        if (newPassword && newPassword.length < 4) {
            return {
                success: false,
                error: "New password must be at least 4 characters"
            };
        }

        if (
            newPassword &&
            newPassword !== confirmPassword
        ) {
            return {
                success: false,
                error: "New passwords do not match"
            };
        }

        const user =
            await dbGet(
                "SELECT * FROM users WHERE id = ?",
                [userId]
            );

        if (!user) {
            return {
                success: false,
                error: "Account not found"
            };
        }

        if (
            !verifyPassword(
                currentPassword,
                user.password_hash
            )
        ) {
            return {
                success: false,
                error: "Current password is incorrect"
            };
        }

        const existing =
            await dbGet(
                `
                SELECT id FROM users
                WHERE username = ? AND id != ?
                `,
                [username, userId]
            );

        if (existing) {
            return {
                success: false,
                error: "This Login ID is already in use"
            };
        }

        const passwordHash =
            newPassword
                ? hashPassword(newPassword)
                : user.password_hash;

        const updateResult =
            await dbRun(
                `
                UPDATE users SET
                    username = ?,
                    password_hash = ?,
                    display_name = ?
                WHERE id = ?
                `,
                [
                    username,
                    passwordHash,
                    displayName || username,
                    userId
                ]
            );

        await runCheckpoint();

        const savedRow =
            await dbGet(
                `
                SELECT username, password_hash
                FROM users WHERE id = ?
                `,
                [userId]
            );

        if (
            !savedRow ||
            savedRow.username !== username
        ) {
            return {
                success: false,
                error: "Login ID was not saved"
            };
        }

        const passwordToTest =
            newPassword || currentPassword;

        if (
            !verifyPassword(
                passwordToTest,
                savedRow.password_hash
            )
        ) {
            return {
                success: false,
                error: "Password was not saved correctly"
            };
        }

        return {
            success: true,
            user: {
                id: userId,
                username,
                displayName: displayName || username
            },
            passwordChanged: Boolean(newPassword),
            loginIdChanged:
                username !== user.username
        };

    } catch (err) {

        console.error("update-account:", err);

        if (dbIsClosed) {

            try {
                await openDatabase();
            } catch (reopenErr) {
                console.error(reopenErr);
            }

        }

        return {
            success: false,
            error: err.message || "Could not save login details"
        };

    }

});

ipcMain.handle("get-dashboard", async () => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        const today =
            new Date().toISOString().split("T")[0];

        db.get(
            `
            SELECT
            COALESCE(SUM(total_sale), 0) AS totalSales,
            COALESCE(SUM(profit), 0) AS totalProfit
            FROM sales
            WHERE date(sale_date) = date(?)
            `,
            [today],
            (err, row) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(row || {
                        totalSales: 0,
                        totalProfit: 0
                    });
                }

            }
        );

    });

});

ipcMain.handle("get-analytics", async () => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        const today =
            new Date().toISOString().split("T")[0];

        db.serialize(() => {

            const result = {
                todaySales: 0,
                todayProfit: 0,
                salesTrend: [],
                paymentSplit: [],
                topProducts: []
            };

            db.get(
                `
                SELECT
                COALESCE(SUM(total_sale), 0) AS sales,
                COALESCE(SUM(profit), 0) AS profit
                FROM sales WHERE date(sale_date) = date(?)
                `,
                [today],
                (err, row) => {

                    if (!err && row) {
                        result.todaySales = row.sales;
                        result.todayProfit = row.profit;
                    }

                }
            );

            db.all(
                `
                SELECT
                date(sale_date) AS day,
                COALESCE(SUM(total_sale), 0) AS sales,
                COALESCE(SUM(profit), 0) AS profit
                FROM sales
                WHERE date(sale_date) >= date('now', '-6 days')
                GROUP BY date(sale_date)
                ORDER BY day ASC
                `,
                [],
                (err, rows) => {

                    if (!err) {
                        result.salesTrend = rows || [];
                    }

                }
            );

            db.all(
                `
                SELECT
                payment_mode AS mode,
                COALESCE(SUM(total_sale), 0) AS amount
                FROM sales
                WHERE date(sale_date) >= date('now', '-30 days')
                GROUP BY payment_mode
                `,
                [],
                (err, rows) => {

                    if (!err) {
                        result.paymentSplit = rows || [];
                    }

                }
            );

            db.all(
                `
                SELECT
                product_name AS name,
                COALESCE(SUM(qty), 0) AS qty
                FROM sales
                WHERE date(sale_date) >= date('now', '-30 days')
                GROUP BY product_name
                ORDER BY qty DESC
                LIMIT 5
                `,
                [],
                (err, rows) => {

                    if (err) {
                        reject(err);
                    } else {
                        result.topProducts = rows || [];
                        resolve(result);
                    }

                }
            );

        });

    });

});

ipcMain.handle("get-sales-by-date", async (event, range) => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.all(
            `
            SELECT *
            FROM sales
            WHERE date(sale_date) >= date(?)
            AND date(sale_date) <= date(?)
            ORDER BY sale_date DESC
            `,
            [range.from, range.to],
            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }

            }
        );

    });

});

ipcMain.handle("export-sales-excel", async (event, range) => {

    try {

        await waitForDatabase();

        const rows = await new Promise((resolve, reject) => {

            db.all(
                `
                SELECT
                sale_date AS Date,
                bill_id AS BillId,
                product_name AS Product,
                qty AS Qty,
                sell_price AS Rate,
                total_sale AS Amount,
                profit AS Profit,
                payment_mode AS Payment,
                customer_name AS Customer,
                customer_mobile AS Mobile
                FROM sales
                WHERE date(sale_date) >= date(?)
                AND date(sale_date) <= date(?)
                ORDER BY sale_date DESC
                `,
                [range.from, range.to],
                (err, data) => {

                    if (err) {
                        reject(err);
                    } else {
                        resolve(data || []);
                    }

                }
            );

        });

        const summary = await new Promise((resolve, reject) => {

            db.all(
                `
                SELECT
                date(sale_date) AS Date,
                COUNT(DISTINCT bill_id) AS Bills,
                COALESCE(SUM(total_sale), 0) AS TotalSales,
                COALESCE(SUM(profit), 0) AS TotalProfit
                FROM sales
                WHERE date(sale_date) >= date(?)
                AND date(sale_date) <= date(?)
                GROUP BY date(sale_date)
                ORDER BY date(sale_date) DESC
                `,
                [range.from, range.to],
                (err, data) => {

                    if (err) {
                        reject(err);
                    } else {
                        resolve(data || []);
                    }

                }
            );

        });

        const workbook = XLSX.utils.book_new();
        const detailSheet =
            XLSX.utils.json_to_sheet(rows);

        XLSX.utils.book_append_sheet(
            workbook,
            detailSheet,
            "Sales Detail"
        );

        const summarySheet =
            XLSX.utils.json_to_sheet(summary);

        XLSX.utils.book_append_sheet(
            workbook,
            summarySheet,
            "Daily Summary"
        );

        const defaultName =
            `sales_${range.from}_to_${range.to}.xlsx`;

        const saveResult =
            await dialog.showSaveDialog(mainWindow, {
                title: "Save sales report",
                defaultPath: path.join(
                    app.getPath("documents"),
                    defaultName
                ),
                filters: [
                    { name: "Excel", extensions: ["xlsx"] }
                ]
            });

        if (saveResult.canceled || !saveResult.filePath) {
            return { success: false, canceled: true };
        }

        XLSX.writeFile(workbook, saveResult.filePath);

        return {
            success: true,
            path: saveResult.filePath
        };

    } catch (err) {

        return {
            success: false,
            error: err.message
        };

    }

});

function formatUtcToLocal(utcStr) {
    if (!utcStr) return "";
    try {
        const str = String(utcStr);
        let isoStr = str;
        if (!str.includes("Z") && !str.includes("+")) {
            isoStr = str.replace(" ", "T") + "Z";
        }
        const date = new Date(isoStr);
        if (isNaN(date.getTime())) {
            return str;
        }
        const pad = (n) => String(n).padStart(2, "0");
        const yyyy = date.getFullYear();
        const mm = pad(date.getMonth() + 1);
        const dd = pad(date.getDate());
        const hh = pad(date.getHours());
        const min = pad(date.getMinutes());
        const ss = pad(date.getSeconds());
        return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    } catch (e) {
        console.error("Error formatting date:", e);
        return String(utcStr);
    }
}

function fetchBillDetails(billId) {

    return new Promise((resolve, reject) => {

        db.all(
            `
            SELECT *
            FROM sales
            WHERE bill_id = ?
            ORDER BY id
            `,
            [billId],
            (err, lines) => {

                if (err) {
                    reject(err);
                    return;
                }

                db.get(
                    "SELECT * FROM shop_profile WHERE id = 1",
                    [],
                    (profileErr, profile) => {

                        if (profileErr) {
                            reject(profileErr);
                            return;
                        }

                        const first = lines[0] || {};
                        const totalSale =
                            lines.reduce(
                                (s, l) =>
                                    s + Number(l.total_sale),
                                0
                            );

                        resolve({
                            profile: profile || {},
                            lines: lines || [],
                            billId,
                            totalSale,
                            paymentMode: first.payment_mode,
                            customerName: first.customer_name,
                            customerMobile: first.customer_mobile,
                            tax: first.tax || 0,
                            discount: first.discount || 0,
                            date: formatUtcToLocal(first.sale_date)
                        });

                    }
                );

            }
        );

    });

}

ipcMain.handle("get-bill-details", async (event, billId) => {

    await waitForDatabase();
    return fetchBillDetails(billId);

});

async function loadBillHtmlWindow(billId) {

    const data =
        await fetchBillDetails(billId);

    const html = buildBillPrintHtml(data);

    const billWin = new BrowserWindow({
        show: false,
        width: 800,
        height: 900,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true
        }
    });

    await billWin.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );

    await new Promise((resolve) => {
        setTimeout(resolve, 400);
    });

    return { billWin, data };

}

ipcMain.handle("print-bill", async (event, billId) => {

    try {

        await waitForDatabase();

        const { billWin } =
            await loadBillHtmlWindow(billId);

        return new Promise((resolve) => {

            billWin.webContents.print(
                { silent: false, printBackground: true },
                (success, failureReason) => {

                    if (!success) {
                        resolve({
                            success: false,
                            error: failureReason
                        });
                    } else {
                        resolve({ success: true });
                    }

                    billWin.close();

                }
            );

        });

    } catch (err) {

        return {
            success: false,
            error: err.message
        };

    }

});

ipcMain.handle("export-bill-pdf", async (event, billId) => {

    try {

        await waitForDatabase();

        const { billWin, data } =
            await loadBillHtmlWindow(billId);

        const pdfBuffer =
            await billWin.webContents.printToPDF({
                printBackground: true,
                marginsType: 1
            });

        billWin.close();

        const billLabel =
            billId
                ? (String(billId).startsWith("RH-") ? String(billId) : String(billId).slice(-6))
                : "bill";

        const saveResult =
            await dialog.showSaveDialog({
                title: "Save bill PDF",
                defaultPath: path.join(
                    app.getPath("documents"),
                    `Bill-${billLabel}.pdf`
                ),
                filters: [
                    {
                        name: "PDF",
                        extensions: ["pdf"]
                    }
                ]
            });

        if (saveResult.canceled || !saveResult.filePath) {
            return {
                success: false,
                cancelled: true
            };
        }

        fs.writeFileSync(
            saveResult.filePath,
            pdfBuffer
        );

        return {
            success: true,
            path: saveResult.filePath,
            totalSale: data.totalSale
        };

    } catch (err) {

        return {
            success: false,
            error: err.message
        };

    }

});

ipcMain.handle("open-file", async (event, filePath) => {

    if (!filePath || !fs.existsSync(filePath)) {
        return {
            success: false,
            error: "File not found"
        };
    }

    await shell.openPath(filePath);

    return { success: true };

});

ipcMain.handle("get-bills", async () => {

    await waitForDatabase();

    return new Promise((resolve, reject) => {

        db.all(
            `
            SELECT
                bill_id,
                MIN(sale_date) AS sale_date,
                SUM(total_sale) AS total_sale,
                SUM(profit) AS profit,
                COUNT(*) AS item_count,
                MAX(payment_mode) AS payment_mode,
                MAX(customer_name) AS customer_name,
                MAX(customer_mobile) AS customer_mobile
            FROM sales
            WHERE bill_id IS NOT NULL
            GROUP BY bill_id
            ORDER BY sale_date DESC
            `,
            [],
            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }

            }
        );

    });

});

const EXPENSE_CATEGORIES = [
    "Shop Rent",
    "Electricity",
    "Internet",
    "Salary"
];

ipcMain.handle("get-expense-categories", async () => {

    return EXPENSE_CATEGORIES;

});

ipcMain.handle("get-expenses", async (event, range) => {

    await waitForDatabase();

    const from = range?.from || "1970-01-01";
    const to = range?.to || "9999-12-31";

    return new Promise((resolve, reject) => {

        db.all(
            `
            SELECT *
            FROM expenses
            WHERE date(expense_date) >= date(?)
            AND date(expense_date) <= date(?)
            ORDER BY expense_date DESC, id DESC
            `,
            [from, to],
            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }

            }
        );

    });

});

ipcMain.handle("add-expense", async (event, expense) => {

    await waitForDatabase();

    const category =
        (expense.category || "").trim();

    const amount =
        Number(expense.amount);

    const note =
        (expense.note || "").trim();

    const expenseDate =
        (expense.expenseDate || "").trim() ||
        new Date().toISOString().slice(0, 10);

    if (!EXPENSE_CATEGORIES.includes(category)) {
        return {
            success: false,
            error: "Invalid expense category"
        };
    }

    if (!amount || amount <= 0) {
        return {
            success: false,
            error: "Enter a valid amount"
        };
    }

    const result =
        await dbRun(
            `
            INSERT INTO expenses
            (category, amount, note, expense_date)
            VALUES (?, ?, ?, ?)
            `,
            [category, amount, note, expenseDate]
        );

    await runCheckpoint();

    triggerAutoCloudSync();

    return {
        success: true,
        id: result.lastID
    };

});

ipcMain.handle("delete-expense", async (event, id) => {

    await waitForDatabase();

    const result =
        await dbRun(
            "DELETE FROM expenses WHERE id = ?",
            [Number(id)]
        );

    await runCheckpoint();

    if (result.changes > 0) {
        triggerAutoCloudSync();
    }

    return {
        success: result.changes > 0
    };

});

ipcMain.handle("get-expense-summary", async (event, range) => {

    await waitForDatabase();

    const from = range?.from || "1970-01-01";
    const to = range?.to || "9999-12-31";

    return new Promise((resolve, reject) => {

        db.all(
            `
            SELECT category, SUM(amount) AS total
            FROM expenses
            WHERE date(expense_date) >= date(?)
            AND date(expense_date) <= date(?)
            GROUP BY category
            ORDER BY total DESC
            `,
            [from, to],
            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }

            }
        );

    });

});

ipcMain.handle(
    "backup-database",
    async () => {

        try {

            await waitForDatabase();

            // Before backup: Verify active database integrity
            const isHealthy = await checkDbIntegrity();
            if (!isHealthy) {
                return {
                    success: false,
                    error: "Database integrity check failed. Cannot backup unhealthy database."
                };
            }

            const backupDir =
                backupsDir || getDataPaths().backupsDir;

            if (!fs.existsSync(backupDir)) {

                fs.mkdirSync(backupDir, { recursive: true });

            }

            const backupName =
                `inventory_${
                    Date.now()
                }.db`;

            const backupPath =
                path.join(backupDir, backupName);

            await runCheckpoint();

            const sourcePath =
                db.dbPath || dbFilePath;

            fs.copyFileSync(sourcePath, backupPath);

            // After backup: Verify backup file size and backup file integrity
            if (!fs.existsSync(backupPath)) {
                return { success: false, error: "Backup file was not created on disk." };
            }
            const stats = fs.statSync(backupPath);
            if (stats.size === 0) {
                return { success: false, error: "Backup verification failed: created file is empty (0 bytes)." };
            }

            const sqlite3 = require("sqlite3").verbose();
            const testDb = new sqlite3.Database(backupPath);
            const isValid = await new Promise((res) => {
                testDb.get("PRAGMA integrity_check", [], (testErr, testRow) => {
                    testDb.close();
                    if (testErr || !testRow || testRow.integrity_check !== "ok") {
                        res(false);
                    } else {
                        res(true);
                    }
                });
            });

            if (!isValid) {
                fs.unlinkSync(backupPath);
                return {
                    success: false,
                    error: "Backup verification failed: created SQLite backup file is invalid/corrupt."
                };
            }

            return {
                success: true,
                path: backupPath,
                fileName: backupName
            };

        } catch (err) {

            try {

                if (dbIsClosed) {
                    await openDatabase();
                }

            } catch (reopenErr) {
                console.error(reopenErr);
            }

            return {
                success: false,
                error: err.message
            };

        }

    }
);
async function ensureProfileRow() {

    await waitForDatabase();

    return new Promise((resolve) => {

        db.serialize(() => {
            db.run(
                `
                CREATE TABLE IF NOT EXISTS shop_profile (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    shop_name TEXT,
                    owner_name TEXT,
                    mobile TEXT,
                    address TEXT,
                    gst_number TEXT,
                    logo TEXT,
                    shop_image TEXT,
                    banner_image TEXT,
                    email TEXT,
                    created_at TEXT
                )
                `,
                [],
                (createErr) => {
                    if (createErr) {
                        console.error("ensureProfileRow table creation failed:", createErr.message);
                    }
                }
            );
            
            // Safe sequential migration additions for legacy tables
            db.run("ALTER TABLE shop_profile ADD COLUMN shop_image TEXT", () => {});
            db.run("ALTER TABLE shop_profile ADD COLUMN banner_image TEXT", () => {});
            db.run("ALTER TABLE shop_profile ADD COLUMN email TEXT", () => {});
            db.run("ALTER TABLE shop_profile ADD COLUMN created_at TEXT", () => {});

            db.run(
                `
                INSERT OR IGNORE INTO shop_profile
                (id, shop_name, owner_name, mobile, address, gst_number, logo, shop_image, banner_image, email, created_at)
                VALUES (1, 'My Shop', 'Owner', '-', '-', '-', '', '', '', '-', '2026-05-27')
                `,
                [],
                (err) => {
                    if (err) {
                        console.error("ensureProfileRow seed insert failed:", err.message);
                    }
                    resolve();
                }
            );
        });

    });

}

ipcMain.handle("get-profile", async () => {

    await ensureProfileRow();

    return new Promise((resolve, reject) => {

        db.get(
            "SELECT * FROM shop_profile WHERE id = 1",
            [],
            (err, row) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }

            }
        );

    });

});

ipcMain.handle("save-profile", async (event, profile) => {

    await ensureProfileRow();

    return new Promise((resolve, reject) => {

        db.run(
            `
            INSERT INTO shop_profile
            (id, shop_name, owner_name, mobile, address, gst_number, logo, shop_image, banner_image, email, created_at)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                shop_name = excluded.shop_name,
                owner_name = excluded.owner_name,
                mobile = excluded.mobile,
                address = excluded.address,
                gst_number = excluded.gst_number,
                logo = excluded.logo,
                shop_image = excluded.shop_image,
                banner_image = excluded.banner_image,
                email = excluded.email,
                created_at = excluded.created_at
            `,
            [
                profile.shopName || "",
                profile.ownerName || "",
                profile.mobile || "",
                profile.address || "",
                profile.gstNumber || "",
                profile.logo || "",
                profile.shopImage || "",
                profile.bannerImage || "",
                profile.email || "",
                profile.createdAt || ""
            ],
            function(err) {

                if (err) {
                    reject(err);
                } else {
                    triggerAutoCloudSync();
                    resolve({
                        success: true,
                        changes: this.changes
                    });
                }

            }
        );

    });

});

ipcMain.handle("database-vacuum", async () => {
    await waitForDatabase();
    return new Promise((resolve, reject) => {
        db.run("VACUUM", [], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({ success: true });
            }
        });
    });
});

ipcMain.handle("database-clear-logs", async () => {
    await waitForDatabase();
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("DELETE FROM sales");
            db.run("DELETE FROM expenses");
            db.run("VACUUM", [], (err) => {
                if (err) reject(err);
                else resolve({ success: true });
            });
        });
    });
});

ipcMain.handle("database-factory-reset", async () => {
    await waitForDatabase();
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("DELETE FROM sales");
            db.run("DELETE FROM expenses");
            db.run("DELETE FROM products");
            db.run("DELETE FROM price_history");
            db.run("DELETE FROM users");
            db.run("DELETE FROM shop_profile");
            db.run("DELETE FROM sqlite_sequence");
            db.run(`
                INSERT OR IGNORE INTO shop_profile
                (id, shop_name, owner_name, mobile, address, gst_number, logo, shop_image, email, created_at)
                VALUES (1, 'My Shop', 'Owner', '-', '-', '-', '', '', '-', '2026-05-27')
            `);
            const { seedDefaultUser } = require("./auth");
            seedDefaultUser(db)
                .then(() => {
                    db.run("VACUUM", [], (err) => {
                        if (err) reject(err);
                        else resolve({ success: true });
                    });
                })
                .catch(reject);
        });
    });
});

ipcMain.handle(
    "restore-database",
    async () => {

        try {

            const backupDir =
                backupsDir || getDataPaths().backupsDir;

            const latest =
                getLatestBackupFile(backupDir);

            if (!latest) {

                return {
                    success: false,
                    error: "No backup found. Create a backup first."
                };

            }

            // Before restore: Verify backup file integrity
            if (!fs.existsSync(latest.fullPath)) {
                return { success: false, error: "Backup file not found on disk." };
            }
            const stats = fs.statSync(latest.fullPath);
            if (stats.size === 0) {
                return { success: false, error: "Backup verification failed: file is empty (0 bytes)." };
            }

            const sqlite3 = require("sqlite3").verbose();
            const testDb = new sqlite3.Database(latest.fullPath);
            const isValid = await new Promise((res) => {
                testDb.get("PRAGMA integrity_check", [], (testErr, testRow) => {
                    testDb.close();
                    if (testErr || !testRow || testRow.integrity_check !== "ok") {
                        res(false);
                    } else {
                        res(true);
                    }
                });
            });

            if (!isValid) {
                return {
                    success: false,
                    error: "Cannot restore: backup file is invalid or corrupt SQLite database."
                };
            }

            await waitForDatabase();
            await runCheckpoint();
            await closeDatabase();

            removeSqliteSidecars(dbFilePath);

            fs.copyFileSync(
                latest.fullPath,
                dbFilePath
            );

            removeSqliteSidecars(dbFilePath);

            await openDatabase();
            await waitForDatabase();

            return {
                success: true,
                file: latest.name,
                path: latest.fullPath
            };

        } catch (err) {

            try {

                if (dbIsClosed) {
                    await openDatabase();
                    await waitForDatabase();
                }

            } catch (reopenErr) {
                console.error(reopenErr);
            }

            return {
                success: false,
                error: err.message
            };

        }

    }
);

let cloudSyncTimeout = null;
let autoBackupIntervalTimer = null;

function startAutoBackupTimer() {
    if (autoBackupIntervalTimer) {
        clearInterval(autoBackupIntervalTimer);
        autoBackupIntervalTimer = null;
    }
    
    const status = cloudStorage.getStatus();
    if (!status.connected || status.autoBackupInterval === "disabled") {
        console.log("Auto backup timer disabled or not connected.");
        return;
    }
    
    let ms = 0;
    switch (status.autoBackupInterval) {
        case "1h":
            ms = 60 * 60 * 1000;
            break;
        case "6h":
            ms = 6 * 60 * 60 * 1000;
            break;
        case "12h":
            ms = 12 * 60 * 60 * 1000;
            break;
        case "daily":
            ms = 24 * 60 * 60 * 1000;
            break;
        default:
            console.log("Unknown interval setting:", status.autoBackupInterval);
            return;
    }
    
    console.log(`Starting auto backup timer for interval: ${status.autoBackupInterval} (${ms} ms)`);
    
    autoBackupIntervalTimer = setInterval(async () => {
        try {
            console.log("Triggering scheduled background Google Drive backup...");
            await waitForDatabase();
            await runCheckpoint();
            const res = await cloudStorage.uploadBackup();
            console.log("Scheduled background backup completed successfully!");
            
            // Notify the renderer that sync has completed
            if (mainWindow && !mainWindow.isDestroyed()) {
                const freshStatus = cloudStorage.getStatus();
                mainWindow.webContents.send("cloud-synced", freshStatus);
            }
        } catch (err) {
            console.error("Scheduled background backup failed:", err.message);
        }
    }, ms);
}

function triggerAutoCloudSync() {
    if (cloudSyncTimeout) {
        clearTimeout(cloudSyncTimeout);
    }
    
    // 15-second debounce background sync
    cloudSyncTimeout = setTimeout(async () => {
        try {
            const status = cloudStorage.getStatus();
            if (status.connected) {
                console.log("Triggering automatic background Google Drive cloud backup...");
                await waitForDatabase();
                await runCheckpoint();
                await cloudStorage.uploadBackup();
                console.log("Automatic background cloud backup completed successfully!");
                
                // Notify the renderer that sync has completed
                if (mainWindow && !mainWindow.isDestroyed()) {
                    const freshStatus = cloudStorage.getStatus();
                    mainWindow.webContents.send("cloud-synced", freshStatus);
                }
            }
        } catch (err) {
            console.error("Automatic background cloud backup failed:", err.message);
        }
    }, 15000);
}

// ─── Google OAuth 2.0 Configuration ─────────────────────────────────────────
// Credentials are loaded from .env (see loadEnv above) or from the system environment.
// NEVER hard-code credentials here — .env is in .gitignore.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
].join(" ");
const OAUTH_CALLBACK_PORT = 42857;
const OAUTH_REDIRECT_URI = `http://127.0.0.1:${OAUTH_CALLBACK_PORT}/callback`;

// Fetch JSON from HTTPS endpoint with optional POST body and headers
function httpsRequest(options, postBody) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error("Invalid JSON response: " + data.substring(0, 200)));
                }
            });
        });
        req.on("error", reject);
        if (postBody) req.write(postBody);
        req.end();
    });
}

// Exchange authorization code for access + refresh tokens
async function exchangeCodeForTokens(code) {
    const body = querystring.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: OAUTH_REDIRECT_URI,
        grant_type: "authorization_code"
    });

    return httpsRequest({
        hostname: "oauth2.googleapis.com",
        path: "/token",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(body)
        }
    }, body);
}

// Fetch Google user profile using an access token
async function fetchGoogleUserInfo(accessToken) {
    return httpsRequest({
        hostname: "www.googleapis.com",
        path: "/oauth2/v2/userinfo",
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });
}

// Refresh an expired access token using the stored refresh token
async function refreshAccessToken(refreshToken) {
    if (!refreshToken) throw new Error("No refresh token available.");
    const body = querystring.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token"
    });
    const result = await httpsRequest({
        hostname: "oauth2.googleapis.com",
        path: "/token",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(body)
        }
    }, body);
    if (result.error) throw new Error(result.error_description || result.error);
    return result; // { access_token, expires_in, token_type, ... }
}

// Revoke a Google OAuth token (call on sign-out)
async function revokeGoogleToken(token) {
    if (!token) return;
    try {
        const body = querystring.stringify({ token });
        await httpsRequest({
            hostname: "oauth2.googleapis.com",
            path: "/revoke",
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(body)
            }
        }, body);
        log.info("Google OAuth token revoked successfully.");
    } catch (err) {
        log.warn("Token revocation failed (non-fatal):", err.message);
    }
}

// Get a valid access token — refreshes automatically if expired
async function getValidAccessToken() {
    const status = cloudStorage.getStatus();
    if (!status.connected) throw new Error("Not connected to Google Drive.");

    // Try to use existing access token
    if (status.accessToken) {
        // Quick test: fetch userinfo to see if still valid
        try {
            const info = await fetchGoogleUserInfo(status.accessToken);
            if (info.email) return status.accessToken;
        } catch (_) {
            // Token likely expired — fall through to refresh
        }
    }

    // Attempt token refresh
    if (!status.refreshToken) throw new Error("Session expired. Please sign in again.");
    const refreshed = await refreshAccessToken(status.refreshToken);
    // Update stored access token
    cloudStorage.updateAccessToken(refreshed.access_token);
    return refreshed.access_token;
}

// Google Drive IPC Handlers
ipcMain.handle("get-google-drive-status", async () => {
    return cloudStorage.getStatus();
});

ipcMain.handle("google-signin", async () => {
    // Prevent multiple auth windows
    if (global._oauthInProgress) {
        return cloudStorage.getStatus();
    }
    global._oauthInProgress = true;

    return new Promise((resolve) => {
        let resolved = false;
        let server = null;
        let waitingWindow = null;

        const finish = (status) => {
            if (resolved) return;
            resolved = true;
            global._oauthInProgress = false;

            if (server) {
                try { server.close(); } catch (_) {}
                server = null;
            }
            if (waitingWindow && !waitingWindow.isDestroyed()) {
                try { waitingWindow.close(); } catch (_) {}
            }
            resolve(status);
        };

        // ── Validate credentials are present (loaded from .env) ───────
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            const errMsg = "Google OAuth credentials not found. " +
                "Ensure .env exists with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.";
            log.error(errMsg);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("cloud-oauth-error", { message: errMsg });
            }
            finish(cloudStorage.getStatus());
            return;
        }

        // Shared callback processor that handles local server callback from external browser
        const handleOauthCallback = async (url) => {
            if (!url.startsWith(OAUTH_REDIRECT_URI)) return;

            const urlObj = new URL(url);
            const code = urlObj.searchParams.get("code");
            const error = urlObj.searchParams.get("error");

            if (error) {
                log.error("Google OAuth error from redirect:", error);
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("cloud-oauth-error", { message: "Authentication cancelled or failed." });
                }
                finish(cloudStorage.getStatus());
                return;
            }

            if (!code) return;

            // Prevent multiple parallel processing runs
            if (resolved) return;

            // Update waiting window UI to "processing" state
            if (waitingWindow && !waitingWindow.isDestroyed()) {
                waitingWindow.webContents.executeJavaScript(
                    `document.dispatchEvent(new CustomEvent('oauth-processing'))`
                ).catch(() => {});
            }

            try {
                // Exchange code → tokens
                const tokens = await exchangeCodeForTokens(code);

                if (tokens.error) {
                    throw new Error(tokens.error_description || tokens.error);
                }

                // Fetch real Google user profile
                const userInfo = await fetchGoogleUserInfo(tokens.access_token);

                if (!userInfo.email) {
                    throw new Error("Could not retrieve Google account email.");
                }

                // Persist authenticated session with real data
                const newStatus = cloudStorage.signIn(
                    userInfo.email,
                    userInfo.name || userInfo.email,
                    tokens.access_token,
                    tokens.refresh_token || ""
                );

                // Store avatar URL in config if available
                if (userInfo.picture) {
                    cloudStorage.setAvatarUrl(userInfo.picture);
                }

                startAutoBackupTimer();

                // Notify waiting window that authorization is fully complete
                if (waitingWindow && !waitingWindow.isDestroyed()) {
                    waitingWindow.webContents.executeJavaScript(
                        `document.dispatchEvent(new CustomEvent('oauth-done'))`
                    ).catch(() => {});
                }

                // Notify main window of successful auth to update UI instantly
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("cloud-synced", cloudStorage.getStatus());
                    
                    // Focus back to the main app window automatically
                    try {
                        mainWindow.show();
                        mainWindow.focus();
                    } catch (_) {}
                }

                // Let the user see the "Connected!" green screen for 2.5 seconds before auto-closing waiting window
                setTimeout(() => {
                    finish(cloudStorage.getStatus());
                }, 2500);

            } catch (err) {
                log.error("Google OAuth token exchange failed:", err.message);
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("cloud-oauth-error", { message: err.message });
                }
                finish(cloudStorage.getStatus());
            }
        };

        // ── Start the loopback callback server ────────────────────────
        server = http.createServer(async (req, res) => {
            if (!req.url.startsWith("/callback")) {
                res.writeHead(404);
                res.end("Not found");
                return;
            }

            const fullUrl = `http://127.0.0.1:${OAUTH_CALLBACK_PORT}${req.url}`;
            const urlObj = new URL(fullUrl);
            const error = urlObj.searchParams.get("error");

            if (error) {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
                    <h2>Authentication cancelled</h2>
                    <p>You can close this window.</p>
                    <script>setTimeout(()=>window.close(),2000)</script>
                </body></html>`);
                handleOauthCallback(fullUrl);
                return;
            }

            // Success page shown in the browser
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`<html><body style="font-family:sans-serif;background:#f0fdf4;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
                <div style="text-align:center">
                    <div style="font-size:48px;margin-bottom:16px">✅</div>
                    <h2 style="color:#166534;margin:0 0 8px">Connected Successfully!</h2>
                    <p style="color:#4b5563;margin:0">RetailHub is now linked to your Google account.<br>You can close this window.</p>
                    <script>setTimeout(()=>window.close(),3000)</script>
                </div>
            </body></html>`);

            handleOauthCallback(fullUrl);
        });

        server.on("error", (err) => {
            console.error("OAuth callback server error:", err.message);
            finish(cloudStorage.getStatus());
        });

        server.listen(OAUTH_CALLBACK_PORT, "127.0.0.1", () => {
            // ── Show waiting window (custom, frameless, beautiful progress popup) ─────
            waitingWindow = new BrowserWindow({
                width: 460,
                height: 300,
                parent: mainWindow,
                modal: false,
                resizable: false,
                frame: false,
                transparent: false,
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            waitingWindow.setMenuBarVisibility(false);
            waitingWindow.loadFile("google-auth.html");

            waitingWindow.once("ready-to-show", () => {
                if (waitingWindow && !waitingWindow.isDestroyed()) {
                    waitingWindow.show();
                }
            });

            waitingWindow.on("closed", () => {
                waitingWindow = null;
                // If user closes the waiting window, cancel auth
                if (!resolved) {
                    finish(cloudStorage.getStatus());
                }
            });

            // ── Generate Google OAuth URL ──
            const authUrl =
                "https://accounts.google.com/o/oauth2/v2/auth?" +
                querystring.stringify({
                    client_id: GOOGLE_CLIENT_ID,
                    redirect_uri: OAUTH_REDIRECT_URI,
                    response_type: "code",
                    scope: GOOGLE_SCOPES,
                    access_type: "offline",
                    prompt: "select_account consent"
                });

            // Open secure system browser for authentication
            shell.openExternal(authUrl).catch((err) => {
                log.error("Failed to open external system browser:", err.message);
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("cloud-oauth-error", { message: "Failed to open external browser: " + err.message });
                }
                finish(cloudStorage.getStatus());
            });
        });
    });
});

ipcMain.handle("google-signout", async () => {
    // Revoke tokens with Google before clearing local state
    try {
        const status = cloudStorage.getStatus();
        if (status.accessToken) {
            await revokeGoogleToken(status.accessToken);
        }
    } catch (err) {
        log.warn("Could not revoke token during sign-out:", err.message);
    }
    const newStatus = cloudStorage.signOut();
    startAutoBackupTimer();
    return newStatus;
});

ipcMain.handle("backup-to-google-drive", async () => {
    try {
        await waitForDatabase();
        await runCheckpoint();
        const res = await cloudStorage.uploadBackup();
        return res;
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle("restore-from-google-drive", async (event, backupId) => {
    try {
        await waitForDatabase();
        await runCheckpoint();
        await closeDatabase();
        
        removeSqliteSidecars(dbFilePath);
        
        const res = await cloudStorage.restoreBackup(backupId);
        
        removeSqliteSidecars(dbFilePath);
        
        await openDatabase();
        await waitForDatabase();
        
        return res;
    } catch (err) {
        try {
            if (dbIsClosed) {
                await openDatabase();
                await waitForDatabase();
            }
        } catch (reopenErr) {
            console.error(reopenErr);
        }
        return { success: false, error: err.message };
    }
});

ipcMain.handle("save-auto-backup-interval", async (event, interval) => {
    const res = cloudStorage.saveInterval(interval);
    startAutoBackupTimer();
    return res;
});

// Deprecated Cloud Handlers Compatibility Map
ipcMain.handle("get-cloud-status", async () => {
    return cloudStorage.getStatus();
});

ipcMain.handle("save-cloud-config", async (event, config) => {
    return { success: true };
});

ipcMain.handle("sync-cloud-now", async () => {
    try {
        await runCheckpoint();
        const res = await cloudStorage.uploadBackup();
        return res;
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle("get-reports-analytics", async (event, range) => {
    await waitForDatabase();
    return new Promise((resolve, reject) => {
        let fromDate = range?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        let toDate = range?.to || new Date().toISOString().split("T")[0];

        db.serialize(() => {
            const data = {
                salesSummary: { today: 0, week: 0, month: 0, year: 0 },
                profitSummary: { today: 0, week: 0, month: 0, year: 0 },
                expenseSummary: { today: 0, week: 0, month: 0, year: 0 },
                inventorySummary: { productsCount: 0, stockCount: 0, value: 0, potentialSales: 0 },
                paymentBreakdown: { cash: 0, upi: 0, credit: 0 },
                bestSellers: [],
                lowestSellers: [],
                topProfitItems: [],
                dailySalesTrend: [],
                monthlySalesTrend: [],
                profitTrend: [],
                expenseTrend: []
            };

            // Today, Week, Month, Year Sales and Profit
            db.get(`
                SELECT 
                    SUM(CASE WHEN date(sale_date) = date('now') THEN total_sale ELSE 0 END) as salesToday,
                    SUM(CASE WHEN date(sale_date) >= date('now', '-6 days') THEN total_sale ELSE 0 END) as salesWeek,
                    SUM(CASE WHEN date(sale_date) >= date('now', '-29 days') THEN total_sale ELSE 0 END) as salesMonth,
                    SUM(CASE WHEN date(sale_date) >= date('now', '-364 days') THEN total_sale ELSE 0 END) as salesYear,
                    SUM(CASE WHEN date(sale_date) = date('now') THEN profit ELSE 0 END) as profitToday,
                    SUM(CASE WHEN date(sale_date) >= date('now', '-6 days') THEN profit ELSE 0 END) as profitWeek,
                    SUM(CASE WHEN date(sale_date) >= date('now', '-29 days') THEN profit ELSE 0 END) as profitMonth,
                    SUM(CASE WHEN date(sale_date) >= date('now', '-364 days') THEN profit ELSE 0 END) as profitYear
                FROM sales
            `, [], (err, row) => {
                if (!err && row) {
                    data.salesSummary.today = row.salesToday || 0;
                    data.salesSummary.week = row.salesWeek || 0;
                    data.salesSummary.month = row.salesMonth || 0;
                    data.salesSummary.year = row.salesYear || 0;
                    
                    data.profitSummary.today = row.profitToday || 0;
                    data.profitSummary.week = row.profitWeek || 0;
                    data.profitSummary.month = row.profitMonth || 0;
                    data.profitSummary.year = row.profitYear || 0;
                }
            });

            // Expenses summary
            db.get(`
                SELECT 
                    SUM(CASE WHEN date(expense_date) = date('now') THEN amount ELSE 0 END) as expToday,
                    SUM(CASE WHEN date(expense_date) >= date('now', '-6 days') THEN amount ELSE 0 END) as expWeek,
                    SUM(CASE WHEN date(expense_date) >= date('now', '-29 days') THEN amount ELSE 0 END) as expMonth,
                    SUM(CASE WHEN date(expense_date) >= date('now', '-364 days') THEN amount ELSE 0 END) as expYear
                FROM expenses
            `, [], (err, row) => {
                if (!err && row) {
                    data.expenseSummary.today = row.expToday || 0;
                    data.expenseSummary.week = row.expWeek || 0;
                    data.expenseSummary.month = row.expMonth || 0;
                    data.expenseSummary.year = row.expYear || 0;
                }
            });

            // Inventory Summary
            db.get(`
                SELECT 
                    COUNT(*) as pCount,
                    SUM(stock) as sCount,
                    SUM(stock * buy_price) as totalValue,
                    SUM(stock * sell_price) as totalSalesVal
                FROM products
            `, [], (err, row) => {
                if (!err && row) {
                    data.inventorySummary.productsCount = row.pCount || 0;
                    data.inventorySummary.stockCount = row.sCount || 0;
                    data.inventorySummary.value = row.totalValue || 0;
                    data.inventorySummary.potentialSales = row.totalSalesVal || 0;
                }
            });

            // Payment Breakdown within date range
            db.all(`
                SELECT payment_mode as mode, SUM(total_sale) as total
                FROM sales
                WHERE date(sale_date) >= date(?) AND date(sale_date) <= date(?)
                GROUP BY payment_mode
            `, [fromDate, toDate], (err, rows) => {
                if (!err && rows) {
                    rows.forEach(r => {
                        const m = (r.mode || "").toLowerCase();
                        if (m === "cash") data.paymentBreakdown.cash = r.total;
                        else if (m === "upi" || m === "online" || m === "gpay" || m === "phonepe") data.paymentBreakdown.upi = r.total;
                        else if (m === "credit") data.paymentBreakdown.credit = r.total;
                    });
                }
            });

            // Best Selling Products within date range
            db.all(`
                SELECT product_name as name, SUM(qty) as totalQty, SUM(total_sale) as totalSale
                FROM sales
                WHERE date(sale_date) >= date(?) AND date(sale_date) <= date(?)
                GROUP BY product_name
                ORDER BY totalQty DESC
                LIMIT 5
            `, [fromDate, toDate], (err, rows) => {
                if (!err) data.bestSellers = rows || [];
            });

            // Lowest Selling Products within date range
            db.all(`
                SELECT product_name as name, SUM(qty) as totalQty, SUM(total_sale) as totalSale
                FROM sales
                WHERE date(sale_date) >= date(?) AND date(sale_date) <= date(?)
                GROUP BY product_name
                ORDER BY totalQty ASC
                LIMIT 5
            `, [fromDate, toDate], (err, rows) => {
                if (!err) data.lowestSellers = rows || [];
            });

            // Top Profit Products within date range
            db.all(`
                SELECT product_name as name, SUM(profit) as totalProfit, SUM(qty) as totalQty
                FROM sales
                WHERE date(sale_date) >= date(?) AND date(sale_date) <= date(?)
                GROUP BY product_name
                ORDER BY totalProfit DESC
                LIMIT 5
            `, [fromDate, toDate], (err, rows) => {
                if (!err) data.topProfitItems = rows || [];
            });

            // Daily Sales Trend within date range
            db.all(`
                SELECT date(sale_date) as day, SUM(total_sale) as sales, SUM(profit) as profit
                FROM sales
                WHERE date(sale_date) >= date(?) AND date(sale_date) <= date(?)
                GROUP BY date(sale_date)
                ORDER BY day ASC
            `, [fromDate, toDate], (err, rows) => {
                if (!err) data.dailySalesTrend = rows || [];
            });

            // Monthly Sales Trend for last 12 months
            db.all(`
                SELECT strftime('%Y-%m', sale_date) as month, SUM(total_sale) as sales
                FROM sales
                WHERE date(sale_date) >= date('now', '-364 days')
                GROUP BY strftime('%Y-%m', sale_date)
                ORDER BY month ASC
            `, [], (err, rows) => {
                if (!err) data.monthlySalesTrend = rows || [];
            });

            // Profit Trend within date range
            db.all(`
                SELECT date(sale_date) as day, SUM(profit) as profit
                FROM sales
                WHERE date(sale_date) >= date(?) AND date(sale_date) <= date(?)
                GROUP BY date(sale_date)
                ORDER BY day ASC
            `, [fromDate, toDate], (err, rows) => {
                if (!err) data.profitTrend = rows || [];
            });

            // Expense Trend within date range
            db.all(`
                SELECT date(expense_date) as day, SUM(amount) as amount
                FROM expenses
                WHERE date(expense_date) >= date(?) AND date(expense_date) <= date(?)
                GROUP BY date(expense_date)
                ORDER BY day ASC
            `, [fromDate, toDate], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    data.expenseTrend = rows || [];
                    resolve(data);
                }
            });
        });
    });
});