const path = require("path");
const fs = require("fs");
const { app } = require("electron");

function getDataPaths() {

    const userDataDir =
        app.getPath("userData");

    const dbPath =
        path.join(userDataDir, "inventory.db");

    const backupsDir =
        path.join(userDataDir, "Backups");

    const legacyDb =
        path.join(__dirname, "inventory.db");

    const legacyBackups =
        path.join(__dirname, "Backups");

    return {
        userDataDir,
        dbPath,
        backupsDir,
        legacyDb,
        legacyBackups
    };

}

function copyIfMissing(source, dest) {

    if (!fs.existsSync(source)) {
        return false;
    }

    if (fs.existsSync(dest)) {
        return false;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(source, dest);

    return true;

}

function migrateFromFolder(sourceDir, destDir) {

    if (
        !fs.existsSync(sourceDir) ||
        sourceDir === destDir
    ) {
        return;
    }

    const dbDest =
        path.join(destDir, "inventory.db");

    if (fs.existsSync(dbDest)) {
        return;
    }

    const dbSource =
        path.join(sourceDir, "inventory.db");

    if (!fs.existsSync(dbSource)) {
        return;
    }

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(dbSource, dbDest);

    for (const suffix of ["-wal", "-shm"]) {
        copyIfMissing(
            dbSource + suffix,
            dbDest + suffix
        );
    }

    const legacyBackups =
        path.join(sourceDir, "Backups");

    const destBackups =
        path.join(destDir, "Backups");

    if (fs.existsSync(legacyBackups)) {

        fs.mkdirSync(destBackups, { recursive: true });

        fs.readdirSync(legacyBackups).forEach((name) => {

            const from =
                path.join(legacyBackups, name);

            const to =
                path.join(destBackups, name);

            if (
                fs.statSync(from).isFile() &&
                !fs.existsSync(to)
            ) {
                fs.copyFileSync(from, to);
            }

        });

    }

    console.log(
        "Migrated data from",
        sourceDir,
        "to",
        destDir
    );

}

function migrateLegacyData() {

    const paths = getDataPaths();

    const appData =
        app.getPath("appData");

    migrateFromFolder(
        path.join(appData, "guru-nanak-communication"),
        paths.userDataDir
    );

    migrateFromFolder(
        path.join(appData, "AccessoryManager"),
        paths.userDataDir
    );

    fs.mkdirSync(paths.userDataDir, { recursive: true });
    fs.mkdirSync(paths.backupsDir, { recursive: true });

    if (copyIfMissing(paths.legacyDb, paths.dbPath)) {

        console.log(
            "Database migrated to user data folder:",
            paths.dbPath
        );

    }

    for (const suffix of ["-wal", "-shm"]) {

        copyIfMissing(
            paths.legacyDb + suffix,
            paths.dbPath + suffix
        );

    }

    if (fs.existsSync(paths.legacyBackups)) {

        const files =
            fs.readdirSync(paths.legacyBackups);

        files.forEach((name) => {

            const from =
                path.join(paths.legacyBackups, name);

            const to =
                path.join(paths.backupsDir, name);

            if (
                fs.statSync(from).isFile() &&
                !fs.existsSync(to)
            ) {
                fs.copyFileSync(from, to);
            }

        });

    }

    return paths;

}

module.exports = {
    getDataPaths,
    migrateLegacyData
};
