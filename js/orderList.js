'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

db.prepare('DROP TABLE IF EXISTS orderList').run();
console.log('orderList table dropped');
db.prepare('CREATE TABLE IF NOT EXISTS orderList (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, userEmail TEXT, userName TEXT, userLastName TEXT, userAdress TEXT, userCity TEXT, userPostCode TEXT, userPhoneNumber TEXT, products TEXT, price INTEGER, commentary TEXT, date TEXT, state TEXT)').run();
exports.createOrder= function(userId, userEmail, userName, userLastName, userAdress, userCity, userPostCode, userPhoneNumber, products, price, commentary, date, state){
    db.prepare('INSERT INTO orderList (userId, userEmail, userName, userLastName, userAdress, userCity, userPostCode, userPhoneNumber, products, price, commentary, date,  state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(userId, userEmail, userName, userLastName, userAdress, userCity, userPostCode, userPhoneNumber, products, price, commentary, date, state);
}

exports.updateOrderCommentary= function(id, commentary){
    db.prepare('UPDATE orderList SET commentary = ? where id = ?').run(commentary, id);
}

exports.updateOrderSate = function(id, state){
    db.prepare('UPDATE orderList SET state = ? WHERE id = ?').run(state, id);
}

exports.listOrders = function () {
    return db.prepare('SELECT * FROM orderList').all();
}

exports.getOrderFromId = function(id){
    return db.prepare('SELECT * FROM orderList WHERE id = ?').get(id);
}

exports.getOrdersFromUserId = function(userId){
    return db.prepare('SELECT * FROM orderList WHERE userId = ?').all(userId);
}

exports.deleteOrderFromId = function(id){
    db.prepare('DELETE FROM orderList WHERE id = ?').run(id);
}

exports.getProductsFromId = function(id){
    return db.prepare('SELECT products FROM orderList WHERE id = ?').get(id);
}