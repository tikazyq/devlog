/**
 * Abstract storage interface that supports different storage backends
 */
/**
 * Factory for creating storage providers based on configuration
 */
export class StorageProviderFactory {
    static async create(config) {
        switch (config.type) {
            case "sqlite":
                const { SQLiteStorageProvider } = await import("./sqlite-storage.js");
                return new SQLiteStorageProvider(config.filePath || ":memory:", config.options);
            case "postgres":
                const { PostgreSQLStorageProvider } = await import("./postgresql-storage.js");
                return new PostgreSQLStorageProvider(config.connectionString, config.options);
            case "mysql":
                const { MySQLStorageProvider } = await import("./mysql-storage.js");
                return new MySQLStorageProvider(config.connectionString, config.options);
            case "enterprise":
                const { EnterpriseStorageAdapter } = await import("./enterprise-storage.js");
                if (!config.options?.integrations) {
                    throw new Error("Enterprise storage requires integrations configuration");
                }
                return new EnterpriseStorageAdapter(config.options);
            default:
                throw new Error(`Unsupported storage type: ${config.type}`);
        }
    }
}
