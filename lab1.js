
const crypto = require('crypto');
const axios = require('axios');

class PoWBlock {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
       
        const payload = String(this.index) + String(this.timestamp) + JSON.stringify(this.data) + this.previousHash + String(this.nonce);
        return crypto.createHash('sha256').update(payload).digest('hex');
    }

    
    mineBlock(difficulty) {
        const target = '0'.repeat(difficulty);
        const start = Date.now();
        let iterations = 0;

        while (!this.hash.startsWith(target)) {
            this.nonce++;
            this.hash = this.calculateHash();
            iterations++;
        }

        const timeMs = Date.now() - start;
        console.log(`Block mined: ${this.hash} (nonce iter: ${iterations}, time: ${timeMs} ms)`);
        return { iterations, timeMs, hash: this.hash };
    }

    
    alternativeMineBlock() {
        const start = Date.now();
        let iterations = 0;
        while (true) {
            this.nonce++;
            this.hash = this.calculateHash();
            iterations++;
            if (this.hash.length > 2 && this.hash[2] === '3') {
                break;
            }
        }
        const timeMs = Date.now() - start;
        console.log(`Block alt-mined: ${this.hash} (nonce iter: ${iterations}, time: ${timeMs} ms)`);
        return { iterations, timeMs, hash: this.hash };
    }
}


class PoWBlockchain {
    constructor(difficulty = 3) {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = difficulty;
    }

    createGenesisBlock() {
        return new PoWBlock(0, new Date().toISOString(), "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(data, useAlternativeMiner = false) {
        const index = this.chain.length;
        const previousHash = this.getLatestBlock().hash;
        const block = new PoWBlock(index, new Date().toISOString(), data, previousHash);
        if (useAlternativeMiner) {
            const meta = block.alternativeMineBlock();
            this.chain.push(block);
            return { block, meta, method: 'alternative' };
        } else {
            const meta = block.mineBlock(this.difficulty);
            this.chain.push(block);
            return { block, meta, method: 'pow' };
        }
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const current = this.chain[i];
            const prev = this.chain[i - 1];

            if (current.previousHash !== prev.hash) {
                console.warn(`Invalid previousHash at index ${i}`);
                return false;
            }

            
            if (current.hash !== current.calculateHash()) {
                console.warn(`Hash mismatch at index ${i}`);
                return false;
            }

            
            if (!current.hash.startsWith('0'.repeat(this.difficulty))) {
                console.warn(`Block ${i} does not meet difficulty (${this.difficulty})`);
                return false;
            }
        }
        return true;
    }
}



function demoPoW() {
    console.log('--- PoW demo start ---');
    const bc = new PoWBlockchain(3);

    
    bc.addBlock({ amount: 4, from: 'A', to: 'B' });
    bc.addBlock({ amount: 10, from: 'C', to: 'D' });
    bc.addBlock({ amount: 2, from: 'E', to: 'F' });

    console.log('isChainValid():', bc.isChainValid()); 

    
    console.log('--- Tampering block 1 data ---');
    bc.chain[1].data = "Hacked!";
    console.log('isChainValid() after tamper:', bc.isChainValid()); 

    
    bc.chain[1].data = { amount: 4, from: 'A', to: 'B' };
    bc.chain[1].hash = bc.chain[1].calculateHash();

    console.log('--- Alternative mining demo (new block) ---');
    const resAlt = bc.addBlock({ amount: 99 }, true); 
    
    console.log('Alt mining result meta:', resAlt.meta);
    console.log('--- PoW demo end ---\n');
}


// Частина 2: Proof-of-Stake (PoS)
class Validator {
    constructor(name, stake) {
        this.name = name;
        this.stake = stake;
    }
}

class PoSBlock {
    constructor(index, timestamp, data, previousHash, validator) {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.validator = validator; 
        this.hash = this.calculateHash();
    }

    calculateHash() {
        const payload = String(this.index) + String(this.timestamp) + JSON.stringify(this.data) + this.previousHash + String(this.validator);
        return crypto.createHash('sha256').update(payload).digest('hex');
    }
}

class PoSBlockchain {
    constructor(validators = []) {
        this.chain = [this.createGenesisBlock()];
        this.validators = validators; 
    }

    createGenesisBlock() {
        return new PoSBlock(0, new Date().toISOString(), "Genesis PoS", "0", "genesis");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    
    chooseValidator() {
        const totalStake = this.validators.reduce((s, v) => s + v.stake, 0);
        const r = Math.random() * totalStake;
        let acc = r;
        for (let v of this.validators) {
            acc -= v.stake;
            if (acc < 0) {
                return v;
            }
        }
        
        return this.validators[this.validators.length - 1];
    }

    addBlock(data) {
        const validator = this.chooseValidator();
        const index = this.chain.length;
        const previousHash = this.getLatestBlock().hash;
        const block = new PoSBlock(index, new Date().toISOString(), data, previousHash, validator.name);
        block.hash = block.calculateHash();
        this.chain.push(block);
        console.log(`Block ${block.index} validated by ${validator.name} (stake=${validator.stake})`);
        return block;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const cur = this.chain[i];
            const prev = this.chain[i - 1];

            if (cur.previousHash !== prev.hash) {
                console.warn(`Invalid previousHash at PoS block ${i}`);
                return false;
            }
            if (cur.hash !== cur.calculateHash()) {
                console.warn(`Hash mismatch at PoS block ${i}`);
                return false;
            }
        }
        return true;
    }
}



function demoPoS() {
    console.log('--- PoS demo start ---');

   
    const validators = [
        new Validator('Alice', 5),
        new Validator('Bob', 10),
        new Validator('Charlie', 1)
    ];
    const pos = new PoSBlockchain(validators);

    
    for (let i = 1; i <= 5; i++) {
        pos.addBlock({ tx: `tx${i}`, amount: i });
    }

    console.log('isChainValid():', pos.isChainValid()); 

    
    console.log('--- Tampering PoS block 3 ---');
    pos.chain[3].data = "Hacked!";
    console.log('isChainValid() after tamper:', pos.isChainValid()); 

    
    pos.chain[3].data = { tx: `tx3`, amount: 3 };
    pos.chain[3].hash = pos.chain[3].calculateHash();

    
    console.log('--- PoS frequency test (50 blocks) ---');
    const freq = {};
    for (let v of validators) freq[v.name] = 0;

    for (let i = 0; i < 50; i++) {
        const b = pos.addBlock({ test: i });
        freq[b.validator] = (freq[b.validator] || 0) + 1;
    }

    console.log('Validator wins in 50 blocks:', freq);
    console.log('Expected approx proportions -> Alice:5, Bob:10, Charlie:1');
    console.log('--- PoS demo end ---\n');
}


//  Частина 3: Etherscan API 

const ETHERSCAN_API_KEY = 'REPLACE_WITH_YOUR_API_KEY';

async function demoEtherscan() {
    console.log('--- Etherscan demo start ---');

    if (!ETHERSCAN_API_KEY || ETHERSCAN_API_KEY === 'BRUHYMZPB4TAJUT9RI7TVBRUYKF2QH1Y5P') {
        console.warn('Etherscan API key not provided. Заміни ETHERSCAN_API_KEY у коді на свій ключ.');
        return;
    }

    try {
        
        const base = 'https://api.etherscan.io/api';
        const resBlockNumber = await axios.get(base, {
            params: {
                module: 'proxy',
                action: 'eth_blockNumber',
                apikey: ETHERSCAN_API_KEY
            }
        });

        if (!resBlockNumber.data || resBlockNumber.data.error) {
            throw new Error('Cannot fetch block number: ' + JSON.stringify(resBlockNumber.data));
        }

        const blockNumberHex = resBlockNumber.data.result; // hex string
        const blockNumber = parseInt(blockNumberHex, 16);
        console.log('Latest block number (decimal):', blockNumber);

        
        const resBlock = await axios.get(base, {
            params: {
                module: 'proxy',
                action: 'eth_getBlockByNumber',
                tag: blockNumberHex,
                boolean: 'true',
                apikey: ETHERSCAN_API_KEY
            }
        });

        if (!resBlock.data || resBlock.data.error) {
            throw new Error('Cannot fetch block data: ' + JSON.stringify(resBlock.data));
        }

        const block = resBlock.data.result;
        if (!block) throw new Error('Empty block result');

        const timestamp = parseInt(block.timestamp, 16);
        const date = new Date(timestamp * 1000).toISOString();
        const txCount = block.transactions ? block.transactions.length : 0;

        console.log('Block info:');
        console.log(' - number:', blockNumber);
        console.log(' - time:', date);
        console.log(' - tx count:', txCount);
        console.log(' - hash:', block.hash);
        console.log(' - parentHash:', block.parentHash);

        
        let sumTx = txCount;
        let count = 1;
        let current = blockNumber;
        for (let i = 1; i < 5; i++) {
            const bn = '0x' + (current - i).toString(16);
            const r = await axios.get(base, {
                params: {
                    module: 'proxy',
                    action: 'eth_getBlockByNumber',
                    tag: bn,
                    boolean: 'true',
                    apikey: ETHERSCAN_API_KEY
                }
            });
            const b = r.data.result;
            const c = b && b.transactions ? b.transactions.length : 0;
            sumTx += c;
            count++;
        }
        console.log(`Average tx per block (last ${count} blocks):`, (sumTx / count).toFixed(2));

    } catch (err) {
        if (err.response) {
            console.error('HTTP error from Etherscan:', err.response.status, err.response.data);
        } else {
            console.error('Error while calling Etherscan:', err.message);
        }
    }

    console.log('--- Etherscan demo end ---\n');
}



async function runAll() {
    demoPoW();
    demoPoS();
    await demoEtherscan();
}

runAll();
