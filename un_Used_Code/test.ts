import { pbkdf2Sync, randomBytes } from "crypto";

const password = "123456";

const salt = randomBytes(16).toString("hex");
const hash = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

console.log("Salt:", salt);
console.log("Hash:", hash);
