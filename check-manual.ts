import 'dotenv/config';
import mysql from "mysql2/promise";

async function check() {
    const url = process.env.DATABASE_URL;
    if (!url) return;
    try {
        const connection = await mysql.createConnection(url);
        console.log("CONNECTED");
        try {
            const [rows] = await connection.query("SELECT * FROM users LIMIT 1");
            console.log("SELECT SUCCESS:", rows);
        } catch (e: any) {
            console.log("SELECT ERROR:", e.message, e.code, e.sqlState);
        }
        await connection.end();
    } catch (e: any) {
        console.log("CONNECTION ERROR:", e.message, e.code);
    }
}
check();
