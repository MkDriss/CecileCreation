'use strict';

const Sqlite = require('better-sqlite3');
let db = new Sqlite('db.sqlite');

db.prepare('DROP TABLE IF EXISTS comments').run();
console.log('comments table dropped');
db.prepare('CREATE TABLE  IF NOT EXISTS comments (commentId INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT, date TEXT, content TEXT, productId INTEGER, profilePicture TEXT)').run();


// CREATE
exports.create = function(author, date, content, productId, profilePicture){
    db.prepare('INSERT INTO comments (author, date, content, productId, profilePicture) VALUES (?, ?, ?, ?, ?)').run(author, date, content, productId, profilePicture);
}


// LIST

exports.list = function(productId){
    return db.prepare('SELECT * FROM comments WHERE productId = ?').all(productId);
}


// DELETE

exports.delete = function(commentId){
    db.prepare('DELETE FROM comments WHERE commentId = ?').run(commentId);
}