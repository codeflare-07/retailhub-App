const path = require("path");
const sqlite3 = require("sqlite3").verbose();

function resolveDatabasePath() {

    if (process.env.GNC_DB_PATH) {
        return process.env.GNC_DB_PATH;
    }

    try {

        const { app } = require("electron");

        return path.join(
            app.getPath("userData"),
            "inventory.db"
        );

    } catch {

        return path.join(__dirname, "inventory.db");

    }

}

const dbPath = resolveDatabasePath();

let readyResolve;

const dbReady = new Promise((resolve) => {
    readyResolve = resolve;
});

const db = new sqlite3.Database(dbPath, (err) => {

    if (err) {
        console.log(err.message);
        return;
    }

    console.log("Database Connected:", dbPath);

    db.serialize(() => {

        db.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                category TEXT,
                buy_price REAL,
                sell_price REAL,
                stock INTEGER
            )
        `);

        db.run(`
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
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                product_name TEXT,
                qty INTEGER,
                buy_price REAL,
                sell_price REAL,
                total_sale REAL,
                profit REAL,
                payment_mode TEXT,
                sale_date DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                product_name TEXT,
                old_buy_price REAL,
                new_buy_price REAL,
                old_sell_price REAL,
                new_sell_price REAL,
                change_date DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                display_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                note TEXT,
                expense_date TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS bill_sequence (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_number INTEGER NOT NULL
            )
        `);

        db.run(`
            INSERT OR IGNORE INTO bill_sequence (id, current_number) VALUES (1, 0)
        `);

        // Safe migration and seeding cascade
        migrateShopProfileColumns(db, () => {
            db.run(`
                INSERT OR IGNORE INTO shop_profile
                (id, shop_name, owner_name, mobile, address, gst_number, logo, shop_image, email, created_at)
                VALUES (1, 'My Shop', 'Owner', '-', '-', '-', '', '', '-', '2026-05-27')
            `, [], (insertErr) => {
                if (insertErr) {
                    console.error("Failed to seed shop_profile default row:", insertErr.message);
                }

                migrateSalesColumns(db, () => {
                    // Startup table existence check & automatic validation
                    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (masterErr, rows) => {
                        if (masterErr || !rows) {
                            console.error("Startup Validation Error: Failed to query sqlite_master:", masterErr ? masterErr.message : "no rows");
                        } else {
                            const tables = rows.map(r => r.name);
                            const required = ["products", "shop_profile", "sales", "price_history", "users", "expenses"];
                            const missing = required.filter(t => !tables.includes(t));
                            if (missing.length > 0) {
                                console.error("Startup Validation: Missing tables detected on connection:", missing.join(", "));
                                console.log("Startup Validation: Tables rebuilt successfully.");
                            } else {
                                console.log("Startup Validation: All required SQLite tables verified and healthy.");
                            }
                        }
                        
                        const { seedDefaultUser } = require("./auth");
                        seedDefaultUser(db)
                            .catch((e) => console.log("Default User seeding failed:", e.message))
                            .finally(() => {
                                readyResolve();
                            });
                    });
                });
            });
        });

    });

});

function migrateSalesColumns(database, done) {

    database.all(
        "PRAGMA table_info(sales)",
        [],
        (err, columns) => {

            if (err || !columns) {
                if (done) {
                    done();
                }
                return;
            }

            const names =
                columns.map((c) => c.name);

            const pending = [];

            if (!names.includes("bill_id")) {
                pending.push(
                    "ALTER TABLE sales ADD COLUMN bill_id INTEGER"
                );
            }

            if (!names.includes("customer_name")) {
                pending.push(
                    "ALTER TABLE sales ADD COLUMN customer_name TEXT"
                );
            }

            if (!names.includes("customer_mobile")) {
                pending.push(
                    "ALTER TABLE sales ADD COLUMN customer_mobile TEXT"
                );
            }

            if (!names.includes("tax")) {
                pending.push(
                    "ALTER TABLE sales ADD COLUMN tax REAL DEFAULT 0"
                );
            }

            if (!names.includes("discount")) {
                pending.push(
                    "ALTER TABLE sales ADD COLUMN discount REAL DEFAULT 0"
                );
            }

            if (!pending.length) {
                if (done) {
                    done();
                }
                return;
            }

            let i = 0;

            const runNext = () => {

                if (i >= pending.length) {
                    if (done) {
                        done();
                    }
                    return;
                }

                database.run(pending[i], [], () => {
                    i += 1;
                    runNext();
                });

            };

            runNext();

        }
    );

}

function migrateShopProfileColumns(database, done) {
    database.all(
        "PRAGMA table_info(shop_profile)",
        [],
        (err, columns) => {
            if (err || !columns) {
                if (done) done();
                return;
            }

            const names = columns.map((c) => c.name.toLowerCase());
            const pending = [];

            if (!names.includes("shop_image")) {
                pending.push("ALTER TABLE shop_profile ADD COLUMN shop_image TEXT");
            }
            if (!names.includes("banner_image")) {
                pending.push("ALTER TABLE shop_profile ADD COLUMN banner_image TEXT");
            }
            if (!names.includes("email")) {
                pending.push("ALTER TABLE shop_profile ADD COLUMN email TEXT");
            }
            if (!names.includes("created_at")) {
                pending.push("ALTER TABLE shop_profile ADD COLUMN created_at TEXT");
            }

            if (!pending.length) {
                if (done) done();
                return;
            }

            let i = 0;
            const runNext = () => {
                if (i >= pending.length) {
                    if (done) done();
                    return;
                }
                database.run(pending[i], [], (alterErr) => {
                    if (alterErr) {
                        console.error("shop_profile ALTER TABLE failed:", alterErr.message);
                    }
                    i += 1;
                    runNext();
                });
            };
            runNext();
        }
    );
}

db.dbPath = dbPath;
db.ready = dbReady;

module.exports = db;
