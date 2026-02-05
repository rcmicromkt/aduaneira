import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";

async function diagnose() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL not found");
        return;
    }

    console.log("Attempting to connect to:", url.replace(/:[^:]+@/, ":****@"));

    try {
        const connection = await mysql.createConnection(url);
        console.log("✅ Basic mysql2 connection successful");

        const [rows] = await connection.query("SHOW TABLES");
        console.log("Tables in database:", rows);

        const db = drizzle(connection);
        const result = await db.execute(sql`SELECT 1 as test`);
        console.log("✅ Drizzle test query successful:", result);

        const [describeUsers] = await connection.query("DESCRIBE users");
        console.log("Schema for 'users' table:", describeUsers);

        await connection.end();
    } catch (error) {
        console.error("❌ Diagnostic failed:");
        console.error(error);
    }
}

diagnose();
