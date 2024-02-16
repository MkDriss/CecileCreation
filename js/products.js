'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

let loadProduct = function(filename) {

      const products= JSON.parse(fs.readFileSync(filename));

      
      db.prepare ('DROP TABLE IF EXISTS product').run();
      console.log('product table dropped');
      db.prepare('CREATE TABLE IF NOT EXISTS product (productId TEXT PRIMARY KEY, productName TEXT, productPrice INTEGER, productDescription TEXT, productPicture TEXT)').run();
      let insertProduct = db.prepare('INSERT INTO product VALUES (?, ?, ?, ?, ?)');

      let transaction = db.transaction((products) => {
                  
                  for(let tempProduct = 0;tempProduct < products.length; tempProduct++) {
                        let product = products[tempProduct];
                        insertProduct.run(product.productId, product.productName, product.productPrice, product.productDescription, product.productPicture);
                  }     
            });

      transaction(products);
      }

loadProduct('./json/products.json');


exports.create = function (productId, productName, productPrice, productDescription) {
      let pictureName = productName + '_' + productId + '.png';
      console.log(productName);

      let newProduct = {
            "productId": productId,
            "productName": productName,
            "productPrice": productPrice,
            "productDescription": productDescription, 
            "productPicture": pictureName 
      };
      try{
            fs.readFile('./json/products.json', (err, data) => {
                  if (err) throw err;
                  let productList = JSON.parse(data);
                  productList.push(newProduct);
                  fs.writeFile('json/products.json', JSON.stringify(productList, null, 2), function (err) {
                        if (err) console.log(err);
                        console.log('product Added!');
                  });
            });
            db.prepare('INSERT INTO product(productId, productName, productPrice, productDescription, productPicture) VALUES (?, ?, ?, ?, ?)').run(productId, productName, productPrice, productDescription, pictureName);
      } catch(err) {
            console.log(err);
      }
      
      
}

exports.read = function (productId) {
      return db.prepare('SELECT * FROM product WHERE productId = ?').get(productId);
}

exports.update = function (productId, productName, productPrice, productDescription) {
      fs.readFile('json/products.json', function (err, data) {
            if (err) throw err;
            let productsList = JSON.parse(data);
            for(let i = 0;i < productsList.length; i++) {
                  let product = productsList[i];
                  if (product.productId === productId) {
                        product.productName = productName;
                        product.productPrice = productPrice;
                        product.productDescription = productDescription;
                  }
            }
            fs.writeFileSync('json/products.json', JSON.stringify(productsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      
      db.prepare('UPDATE product SET productName = ?, productPrice = ?, productDescription = ? WHERE productId = ?').run(productName, productPrice, productDescription, productId);

}

exports.delete = function (productId) {
      fs.readFile('json/products.json', function (err, data) {
            if (err) throw err;
            let productsList = JSON.parse(data);
            for(let i = 0;i < productsList.length; i++) {
                  let product = productsList[i];
                  if (product.productId === productId) {
                        productsList.splice(i, 1);
                  }
            }
            fs.writeFileSync('json/products.json', JSON.stringify(productsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      db.prepare('DELETE FROM product WHERE productId = ?').run(productId);
      console.log('product ' + productId + ' deleted');
}

exports.list = function () {
      return db.prepare('SELECT * FROM product').all();
}


