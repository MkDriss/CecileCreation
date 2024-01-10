'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');



let loadProduct = function(filename) {

    const orders= JSON.parse(fs.readFileSync(filename));
    
    db.prepare('DROP TABLE IF EXISTS orderList').run();
    console.log('orderList table dropped');
    db.prepare('CREATE TABLE IF NOT EXISTS orderList (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, userEmail TEXT, userName TEXT, userLastName TEXT, userAdress TEXT, userCity TEXT, userPostCode TEXT, userPhoneNumber TEXT, products TEXT, price INTEGER, commentary TEXT, date TEXT, state TEXT)').run();
    let insertOrder = db.prepare('INSERT INTO orderList VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

    let transaction = db.transaction((orders) => {
                
                for(let tempOrder = 0; tempOrder < orders.length; tempOrder++) {
                      let order = orders[tempOrder];
                      //console.log(product);
                      insertOrder.run(order.id, order.userId, order.userEmail, order.userName, order.userLastName, order.userAdress, order.userCity, order.userPostCode, order.userPhoneNumber, order.products, order.price, order.commentary, order.date, order.state);
                }     
          });

    transaction(orders);
    }

loadProduct('./json/orders.json');


exports.createOrder= function(userId, userEmail, userName, userLastName, userAdress, userCity, userPostCode, userPhoneNumber, products, price, commentary, date, state){
    let newOrder = {"userId": userId,
                    "userEmail": userEmail,
                    "userName": userName,
                    "userLastName": userLastName,
                    "userAdress": userAdress,
                    "userCity": userCity,
                    "userPostCode": userPostCode,
                    "userPhoneNumber": userPhoneNumber,
                    "products": products,
                    "price": price,
                    "commentary": commentary,
                    "date": date,
                    "state": state
            };
            let orderList = JSON.parse(fs.readFileSync('json/orders.json'));
            orderList.push(newOrder);
            fs.writeFile('json/orders.json', JSON.stringify(orderList, null, 2), function (err) {
                if (err) throw err;
                console.log(err);
          });
          try {
            db.prepare('INSERT INTO orderList (userId, userEmail, userName, userLastName, userAdress, userCity, userPostCode, userPhoneNumber, products, price, commentary, date,  state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(userId, userEmail, userName, userLastName, userAdress, userCity, userPostCode, userPhoneNumber, products, price, commentary, date, state);
      } catch(err) {
            console.log(err);
      }
      console.log('Order created');
    
}

exports.updateOrderCommentary = function(id, commentary){
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