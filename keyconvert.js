const fs = require('fs');
const key = fs.readFileSync('./etuitiondb-firebase-adminsdk-fbsvc-0bf105b9e1.json', 'utf8')
const base64 = Buffer.from(key).toString('base64')
console.log(base64)