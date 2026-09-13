const bcrypt = require("bcryptjs");

const senha = "1234";
const hash = bcrypt.hashSync(senha, 10);

console.log(hash);
