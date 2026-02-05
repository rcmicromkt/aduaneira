import 'dotenv/config';
import * as db from "./server/db";

async function test() {
    try {
        const clients = await db.listClients();
        console.log("✅ listClients successful:", clients.length, "clients found");
    } catch (error) {
        console.error("❌ listClients failed:");
        console.error(error);
    }
}

test();
