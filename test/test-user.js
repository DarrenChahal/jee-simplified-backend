import 'dotenv/config';
import { stackServerApp } from './stack/server.js';

async function main() {
const user = await stackServerApp.getUser('9a4ac764-1e1f-4e02-8238-493492e54a31');
console.log(user);
}

main().catch(console.error);