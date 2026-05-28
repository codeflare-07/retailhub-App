const fs = require("fs");
const path = require("path");
const { safeStorage } = require("electron");

let configPath = "";
let dbPath = "";
let driveFolder = "";

let config = {
    connected: false,
    email: "",
    name: "RetailHub User",
    avatarUrl: "",
    backups: [],
    autoBackupInterval: "disabled",
    lastAutoBackup: null,
    lastSynced: null,
    error: null,
    accessToken: "",
    refreshToken: ""
};

function encryptToken(token) {
    if (!token) return "";
    try {
        if (safeStorage.isEncryptionAvailable()) {
            const encryptedBuffer = safeStorage.encryptString(token);
            return encryptedBuffer.toString("hex");
        }
        return Buffer.from(token).toString("base64");
    } catch (err) {
        console.error("Token encryption failed:", err);
        return "";
    }
}

function decryptToken(encryptedHex) {
    if (!encryptedHex) return "";
    try {
        if (safeStorage.isEncryptionAvailable()) {
            const encryptedBuffer = Buffer.from(encryptedHex, "hex");
            return safeStorage.decryptString(encryptedBuffer);
        }
        return Buffer.from(encryptedHex, "base64").toString("utf8");
    } catch (err) {
        console.error("Token decryption failed:", err);
        return "";
    }
}

function getGoogleAvatar(name, email) {
    const initial = (name ? name[0] : (email ? email[0] : 'G')).toUpperCase();
    const colors = ["#2563eb", "#ea580c", "#16a34a", "#db2777", "#4f46e5", "#0891b2"];
    const charCode = initial.charCodeAt(0);
    const color = colors[charCode % colors.length];
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="${encodeURIComponent(color)}"/><text x="50%" y="62%" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="white" text-anchor="middle">${initial}</text></svg>`;
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
            
            // Decrypt tokens during config load
            const decryptedAccessToken = decryptToken(data.accessToken);
            const decryptedRefreshToken = decryptToken(data.refreshToken);
            
            config = { 
                ...config, 
                ...data,
                accessToken: decryptedAccessToken,
                refreshToken: decryptedRefreshToken
            };
            
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
        // Create an encrypted copy for writing to disk
        const encryptedConfig = {
            ...config,
            accessToken: encryptToken(config.accessToken),
            refreshToken: encryptToken(config.refreshToken)
        };
        fs.writeFileSync(configPath, JSON.stringify(encryptedConfig, null, 2), "utf8");
    } catch (err) {
        console.error("Failed to save Google Drive configuration:", err);
    }
}

function getStatus() {
    // Ensure accurate counts and files list before returning status
    loadConfig();
    // Use real Google profile picture if available, otherwise generate initials avatar
    const avatar = config.connected
        ? (config.avatarUrl || getGoogleAvatar(config.name, config.email))
        : null;
    return {
        ...config,
        avatar,
        backupCount: config.backups ? config.backups.length : 0
    };
}

function signIn(email, name, accessToken, refreshToken) {
    config.connected = true;
    config.email = email || "";
    config.name = name || email || "Google Account";
    config.accessToken = accessToken || "";
    config.refreshToken = refreshToken || "";
    config.avatarUrl = ""; // Will be set by setAvatarUrl() after OAuth
    config.error = null;
    saveConfig();
    return getStatus();
}

function setAvatarUrl(url) {
    if (url && typeof url === "string") {
        config.avatarUrl = url;
        saveConfig();
    }
    return getStatus();
}

function signOut() {
    config.connected = false;
    config.email = "";
    config.name = "RetailHub User";
    config.accessToken = "";
    config.refreshToken = "";
    config.avatarUrl = "";
    config.error = null;
    saveConfig();
    return getStatus();
}

// Update only the access token (after a silent refresh)
function updateAccessToken(newAccessToken) {
    if (!newAccessToken) return;
    config.accessToken = newAccessToken;
    saveConfig();
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
    setAvatarUrl,
    updateAccessToken,
    saveInterval,
    uploadBackup,
    restoreBackup
};
