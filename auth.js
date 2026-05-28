const crypto = require("crypto");

function verifyPassword(password, stored) {

    const pass =
        String(password || "").trim();

    if (!stored || !pass) {
        return false;
    }

    const parts = stored.split(":");

    if (parts.length !== 2) {
        return false;
    }

    const [salt, hash] = parts;

    try {

        const test =
            crypto.scryptSync(pass, salt, 64).toString("hex");

        return hash === test;

    } catch {
        return false;
    }

}

function hashPassword(password) {

    const pass =
        String(password || "").trim();

    const salt =
        crypto.randomBytes(16).toString("hex");

    const hash =
        crypto.scryptSync(pass, salt, 64).toString("hex");

    return `${salt}:${hash}`;

}

function seedDefaultUser(db) {

    return new Promise((resolve, reject) => {

        db.get(
            "SELECT id FROM users WHERE username = ?",
            ["admin"],
            (err, row) => {

                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    resolve();
                    return;
                }

                const passwordHash =
                    hashPassword("admin123");

                db.run(
                    `
                    INSERT INTO users (username, password_hash, display_name)
                    VALUES (?, ?, ?)
                    `,
                    ["admin", passwordHash, "Administrator"],
                    (insertErr) => {

                        if (insertErr) {
                            reject(insertErr);
                        } else {
                            resolve();
                        }

                    }
                );

            }
        );

    });

}

module.exports = {
    hashPassword,
    verifyPassword,
    seedDefaultUser
};
