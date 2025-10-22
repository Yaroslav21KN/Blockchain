
const crypto = require("crypto");

//Завдання 1
function task1() {
    const input = "Hello, world!";
    const sha256 = crypto.createHash("sha256").update(input).digest("hex");
    const sha3_256 = crypto.createHash("sha3-256").update(input).digest("hex");

    console.log("\n=== Завдання 1: SHA-256 та SHA3-256 ===");
    console.log("Вхідний рядок:", input);
    console.log("SHA-256:", sha256);
    console.log("SHA3-256:", sha3_256);
    console.log("Довжини:", sha256.length, sha3_256.length);
    console.log("SHA-256 зазвичай швидший; SHA3-256 — надійніший (новіший стандарт).");
}

//Завдання 2 
function randomString(len = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function task2() {
    const original = randomString(16);
    const modified = original.slice(0, -1) + (original.slice(-1) === "A" ? "B" : "A");
    const hash1 = crypto.createHash("sha256").update(original).digest("hex");
    const hash2 = crypto.createHash("sha256").update(modified).digest("hex");

    
    const b1 = Buffer.from(hash1, "hex");
    const b2 = Buffer.from(hash2, "hex");
    let diffBits = 0;
    for (let i = 0; i < b1.length; i++) {
        diffBits += (b1[i] ^ b2[i]).toString(2).replace(/0/g, "").length;
    }
    const percent = (diffBits / (b1.length * 8) * 100).toFixed(2);

    console.log("\n=== Завдання 2: Ефект лавини ===");
    console.log("Рядок 1:", original);
    console.log("Рядок 2:", modified);
    console.log("SHA256 #1:", hash1);
    console.log("SHA256 #2:", hash2);
    console.log("Відмінність бітів:", diffBits, `(${percent}%)`);
    console.log("// Властивість лавини критична для блокчейну: мінімальна зміна → повністю новий хеш.");
}

//Завдання 3 
function task3() {
    console.log("\n=== Завдання 3: Спрощений пошук колізій (префікс) ===");
    const base = "student_test";
    const n = 4; 
    const hashes = {};
    let nonce = 0;

    while (true) {
        const str = base + nonce;
        const h = crypto.createHash("sha256").update(str).digest("hex");
        const prefix = h.slice(0, n);
        if (hashes[prefix] && hashes[prefix] !== str) {
            console.log(`Знайдено колізію після ${nonce} спроб!`);
            console.log("Строки:", hashes[prefix], "і", str);
            console.log("Хеш:", prefix + "...");
            break;
        }
        hashes[prefix] = str;
        nonce++;
    }
}

//Завдання 4 
function task4() {
    console.log("\n=== Завдання 4: RSA підпис ===");
    const { generateKeyPairSync, createSign, createVerify } = crypto;
    const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

    const message = "My secret message";
    const sign = createSign("SHA256");
    sign.update(message);
    const signature = sign.sign(privateKey, "base64");

    const verify = createVerify("SHA256");
    verify.update(message);
    const valid = verify.verify(publicKey, signature, "base64");

    const verifyFake = createVerify("SHA256");
    verifyFake.update(message + "x");
    const validFake = verifyFake.verify(publicKey, signature, "base64");

    console.log("Публічний ключ (скорочено):", publicKey.export({ type: "spki", format: "pem" }).slice(0, 80) + "...");
    console.log("Підпис (base64):", signature.slice(0, 60) + "...");
    console.log("Перевірка (оригінал):", valid);
    console.log("Перевірка (змінене повідомлення):", validFake);
    console.log("// Приватний ключ ніколи не передається, бо дозволяє створювати будь-які підписи.");
}

//Завдання 5 
function signData(privateKey, data) {
    const sign = crypto.createSign("SHA256");
    sign.update(data);
    return sign.sign(privateKey, "base64");
}

function verifyData(publicKey, data, signature) {
    const verify = crypto.createVerify("SHA256");
    verify.update(data);
    return verify.verify(publicKey, signature, "base64");
}

function task5() {
    console.log("\n=== Завдання 5: Підпис документу ===");
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });

    const document = JSON.stringify({ id: 1, content: "Це мій документ" });
    const signature = signData(privateKey, document);

    console.log("(a) Оригінал →", verifyData(publicKey, document, signature));
    console.log("(b) Змінений документ →", verifyData(publicKey, document + "!", signature));
    console.log("(c) Підмінений підпис →", verifyData(publicKey, document, signature.slice(0, -3) + "abc"));
}

//Завдання 6: Merkle root 
function sha256(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
}

function merkleRoot(transactions) {
    let level = transactions.map(tx => sha256(JSON.stringify(tx)));
    if (level.length === 0) return null;
    while (level.length > 1) {
        if (level.length % 2 !== 0) level.push(level[level.length - 1]);
        const next = [];
        for (let i = 0; i < level.length; i += 2) {
            next.push(sha256(level[i] + level[i + 1]));
        }
        level = next;
    }
    return level[0];
}

function task6() {
    console.log("\n=== Завдання 6: Merkle root у блоці ===");
    const transactions = [
        { from: "Alice", to: "Bob", amount: 10 },
        { from: "Bob", to: "Charlie", amount: 5 },
        { from: "Charlie", to: "Dave", amount: 2 },
    ];
    const prevHash = "00000abc123";
    const merkle = merkleRoot(transactions);
    const header = prevHash + Date.now() + merkle;
    const blockHash = sha256(header);

    console.log("Merkle root:", merkle);
    console.log("Hash блоку:", blockHash);

    
    transactions[0].amount = 999;
    const newMerkle = merkleRoot(transactions);
    const newHash = sha256(prevHash + Date.now() + newMerkle);

    console.log("Після зміни tx → Merkle root:", newMerkle);
    console.log("Новий hash блоку:", newHash);
    console.log("// Мінімальна зміна змінює Merkle root → змінює hash → ланцюг невалідний.");
}

//Завдання 7: Merkle proof
function getMerkleProof(transactions, index) {
    let level = transactions.map(tx => sha256(JSON.stringify(tx)));
    const proof = [];
    while (level.length > 1) {
        if (level.length % 2 !== 0) level.push(level[level.length - 1]);
        const next = [];
        for (let i = 0; i < level.length; i += 2) {
            next.push(sha256(level[i] + level[i + 1]));
            if (i === index || i + 1 === index) {
                const dir = i === index ? "right" : "left";
                const sibling = i === index ? level[i + 1] : level[i];
                proof.push({ sibling, direction: dir });
                index = Math.floor(i / 2);
            }
        }
        level = next;
    }
    return proof;
}

function verifyProof(tx, proof, merkleRoot) {
    let hash = sha256(JSON.stringify(tx));
    for (const { sibling, direction } of proof) {
        hash = direction === "left" ? sha256(sibling + hash) : sha256(hash + sibling);
    }
    return hash === merkleRoot;
}

function task7() {
    console.log("\n=== Завдання 7: Merkle proof ===");
    const transactions = [
        { from: "Alice", to: "Bob", amount: 10 },
        { from: "Bob", to: "Charlie", amount: 5 },
        { from: "Charlie", to: "Dave", amount: 2 },
    ];
    const merkle = merkleRoot(transactions);
    const proof = getMerkleProof(transactions, 1);
    const tx = transactions[1];

    console.log("Proof:", proof);
    console.log("Перевірка (існує):", verifyProof(tx, proof, merkle));
    console.log("Перевірка (змінений tx):", verifyProof({ ...tx, amount: 999 }, proof, merkle));
    console.log("Перевірка (tx не існує):", verifyProof({ from: "X", to: "Y", amount: 1 }, proof, merkle));
}


task1();
task2();
task3();
task4();
task5();
task6();
task7();
