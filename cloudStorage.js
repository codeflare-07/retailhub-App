const fs = require("fs");
const path = require("path");

let configPath = "";
let dbPath = "";
let driveFolder = "";

let config = {
    connected: false,
    email: "",
    name: "RetailHub User",
    backups: [],
    autoBackupInterval: "disabled",
    lastAutoBackup: null,
    lastSynced: null,
    error: null
};

function getGoogleAvatar(email) {
    const initial = (email ? email[0] : 'G').toUpperCase();
    const colors = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];
    const charCode = initial.charCodeAt(0);
    const color = colors[charCode % colors.length];
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="${encodeURIComponent(color)}"/><text x="50%" y="62%" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">${initial}</text></svg>`;
}

function initCloudStorage(userDataDir, databasePath) {
    configPath = path.join(userDataDir, "googleDriveConfig.json");
    dbPath = databasePath;
    
    // Create actual folder on disk to represent "Google Drive / Retail Hub Backups"
    driveFolder = path.join(userDataDir, "GoogleDrive", "Retail Hub Backups");
    if (!fs.existsSync(driveFolder)) {
        fs.mkdirSync(driveFolder, { recursive: true });
    }
    
    loadConfig();
}

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const raw = fs.readFileSync(configPath, "utf8");
            const data = JSON.parse(raw);
            config = { ...config, ...data };
            
            // Clean up list by checking which backup files actually exist in our local Drive replica
            if (config.backups) {
                config.backups = config.backups.filter(b => {
                    const filePath = path.join(driveFolder, b.fileName);
                    return fs.existsSync(filePath);
                });
            }
        }
    } catch (err) {
        console.error("Failed to load Google Drive configuration:", err);
    }
}

function saveConfig() {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
    } catch (err) {
        console.error("Failed to save Google Drive configuration:", err);
    }
}

function getStatus() {
    // Ensure accurate counts and files list before returning status
    loadConfig();
    return {
        ...config,
        avatar: config.connected ? getGoogleAvatar(config.email) : null,
        backupCount: config.backups ? config.backups.length : 0
    };
}

function signIn(email) {
    config.connected = true;
    config.email = email || "retailhub.user@gmail.com";
    config.name = "RetailHub User";
    config.error = null;
    saveConfig();
    return getStatus();
}

function signOut() {
    config.connected = false;
    config.email = "";
    config.error = null;
    saveConfig();
    return getStatus();
}

function saveInterval(interval) {
    config.autoBackupInterval = interval || "disabled";
    saveConfig();
    return getStatus();
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function uploadBackup() {
    if (!config.connected) {
        throw new Error("Google Drive account is not connected.");
    }
    
    try {
        if (!fs.existsSync(dbPath)) {
            throw new Error("Local database file not found.");
        }
        
        const timestamp = new Date().toISOString();
        const dateStr = timestamp.replace(/[:.]/g, "-");
        const fileName = `inventory_${dateStr}.db`;
        const destPath = path.join(driveFolder, fileName);
        
        // Copy database file securely
        fs.copyFileSync(dbPath, destPath);
        
        // Get file stats
        const stats = fs.statSync(destPath);
        const sizeLabel = formatBytes(stats.size);
        
        const newBackup = {
            id: "gd_" + Date.now(),
            name: `Retail Hub Backup (${new Date(timestamp).toLocaleDateString("en-IN")} ${new Date(timestamp).toLocaleTimeString("en-IN", {hour: '2-digit', minute:'2-digit'})})`,
            fileName: fileName,
            size: sizeLabel,
            date: timestamp
        };
        
        config.backups = [newBackup, ...(config.backups || [])];
        config.lastSynced = timestamp;
        config.error = null;
        saveConfig();
        
        return { success: true, lastSynced: config.lastSynced, backups: config.backups };
    } catch (err) {
        console.error("Google Drive sync upload failed:", err);
        config.error = err.message;
        saveConfig();
        throw err;
    }
}

async function restoreBackup(backupId) {
    try {
        const backup = config.backups.find(b => b.id === backupId);
        if (!backup) {
            throw new Error("Specified cloud backup checkpoint not found.");
        }
        
        const backupPath = path.join(driveFolder, backup.fileName);
        if (!fs.existsSync(backupPath)) {
            throw new Error("Backup file not found in Google Drive replicas.");
        }
        
        // Before restore: Verify backup file integrity
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
            throw new Error("Cannot restore: Backup file is invalid or corrupt SQLite database.");
        }
        
        // Copy the backup database file back to live dbPath
        fs.copyFileSync(backupPath, dbPath);
        
        return { success: true, file: backup.name };
    } catch (err) {
        console.error("Google Drive restore backup failed:", err);
        throw err;
    }
}

module.exports = {
    initCloudStorage,
    getStatus,
    signIn,
    signOut,
    saveInterval,
    uploadBackup,
    restoreBackup
};
