const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./textquestions.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

const createTableIfNotExists = () => {
    const query = `
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;

    db.run(query, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Table exists.');
    });
};

const writeDBmessage = (phone, question, answer) => {
    const query = `
    INSERT INTO messages (phone, question, answer)
    VALUES (?, ?, ?)
    `;

    db.run(query, [phone, question, answer], function (err) {
        if (err) {
            console.error(err.message);
        }
    });
};

const closeDbConnection = () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
    });
};


module.exports = {
    db,
    createTableIfNotExists,
    writeDBmessage,
    closeDbConnection
};

