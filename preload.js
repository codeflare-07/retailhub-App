const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {

    saveProduct: (product) =>
        ipcRenderer.invoke("save-product", product),

    getProducts: () =>
        ipcRenderer.invoke("get-products"),

    deleteProduct: (id) =>
        ipcRenderer.invoke("delete-product", id),

    updateStock: (id, stock) =>
        ipcRenderer.invoke("update-stock", id, stock),

    sellProduct: (saleData) =>
        ipcRenderer.invoke("sell-product", saleData),

    sellBill: (billData) =>
        ipcRenderer.invoke("sell-bill", billData),

    getSales: () =>
        ipcRenderer.invoke("get-sales"),

    getPriceHistory: () =>
    ipcRenderer.invoke("get-price-history"),

    getDashboard: () =>
        ipcRenderer.invoke("get-dashboard"),

    editProduct: (product) =>
        ipcRenderer.invoke(
            "edit-product",
            product
        ),
        backupDatabase: () =>
    ipcRenderer.invoke(
        "backup-database"
    ),

restoreDatabase: () =>
    ipcRenderer.invoke(
        "restore-database"
    ),

    getProfile: () =>
        ipcRenderer.invoke("get-profile"),

    saveProfile: (profile) =>
        ipcRenderer.invoke("save-profile", profile),

    navigate: (page) =>
        ipcRenderer.invoke("navigate", page),

    getDataFolder: () =>
        ipcRenderer.invoke("get-data-folder"),

    resolveSessionUser: (username) =>
        ipcRenderer.invoke("resolve-session-user", username),

    login: (credentials) =>
        ipcRenderer.invoke("login", credentials),

    getAccount: (userId) =>
        ipcRenderer.invoke("get-account", userId),

    updateAccount: (data) =>
        ipcRenderer.invoke("update-account", data),

    getAnalytics: () =>
        ipcRenderer.invoke("get-analytics"),

    getSalesByDate: (range) =>
        ipcRenderer.invoke("get-sales-by-date", range),

    getReportsAnalytics: (range) =>
        ipcRenderer.invoke("get-reports-analytics", range),

    exportSalesExcel: (range) =>
        ipcRenderer.invoke("export-sales-excel", range),

    printBill: (billId) =>
        ipcRenderer.invoke("print-bill", billId),

    getBillDetails: (billId) =>
        ipcRenderer.invoke("get-bill-details", billId),

    exportBillPdf: (billId) =>
        ipcRenderer.invoke("export-bill-pdf", billId),

    openFile: (filePath) =>
        ipcRenderer.invoke("open-file", filePath),

    getBills: () =>
        ipcRenderer.invoke("get-bills"),

    getExpenseCategories: () =>
        ipcRenderer.invoke("get-expense-categories"),

    getExpenses: (range) =>
        ipcRenderer.invoke("get-expenses", range),

    addExpense: (expense) =>
        ipcRenderer.invoke("add-expense", expense),

    deleteExpense: (id) =>
        ipcRenderer.invoke("delete-expense", id),

    getExpenseSummary: (range) =>
        ipcRenderer.invoke("get-expense-summary", range),

    getGoogleDriveStatus: () =>
        ipcRenderer.invoke("get-google-drive-status"),

    googleSignIn: () =>
        ipcRenderer.invoke("google-signin"),

    googleSignOut: () =>
        ipcRenderer.invoke("google-signout"),

    backupToGoogleDrive: () =>
        ipcRenderer.invoke("backup-to-google-drive"),

    restoreFromGoogleDrive: (id) =>
        ipcRenderer.invoke("restore-from-google-drive", id),

    saveAutoBackupInterval: (interval) =>
        ipcRenderer.invoke("save-auto-backup-interval", interval),

    onCloudSynced: (callback) =>
        ipcRenderer.on("cloud-synced", (event, data) => callback(data))

});