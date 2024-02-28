'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

let loadProduct = function (filename) {

      const products = JSON.parse(fs.readFileSync(filename));

      db.prepare('DROP TABLE IF EXISTS products').run();
      console.log('products table dropped');
      db.prepare('CREATE TABLE IF NOT EXISTS products (productId TEXT PRIMARY KEY, productName TEXT, productCategory TEXT,productPrice INTEGER, productHeight INTEGER, productWidth INTEGER, productDepth INTEGER, productMaterial TEXT, productDescription TEXT, productPicture TEXT)').run();
      let insertProduct = db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

      let transaction = db.transaction((products) => {

            for (let tempProduct = 0; tempProduct < products.length; tempProduct++) {
                  let product = products[tempProduct];
                  insertProduct.run(product.productId, product.productName, product.productCategory, product.productPrice, product.productHeight, product.productWidth, product.productDepth, product.productMaterial, product.productDescription, product.productPicture);
            }
      });

      transaction(products);
}

loadProduct('./json/products.json');

// CREATE

exports.create = function (productId, productName, productCategory = "None", productHeight, productWidth, productDepth, productMaterial="None", productPrice, productDescription) {

      let pictureName = convertInAlphabet(productName) + '_' + productId + '.png';

      let newProduct = {
            "productId": productId,
            "productName": productName,
            "productCategory": productCategory,
            "productPrice": productPrice,
            "productHeight": productHeight,
            "productWidth": productWidth,
            "productDepth": productDepth,
            "productMaterial": productMaterial,
            "productDescription": productDescription,
            "productPicture": pictureName
      };
      try {
            fs.readFile('./json/products.json', (err, data) => {
                  if (err) throw err;
                  let productList = JSON.parse(data);
                  productList.push(newProduct);
                  fs.writeFile('json/products.json', JSON.stringify(productList, null, 2), function (err) {
                        if (err) console.log(err);
                        console.log('product Added!');
                  });
            });
            db.prepare('INSERT INTO products(productId, productName, productCategory, productPrice, productHeight, productWidth, productDepth, productMaterial, productDescription, productPicture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(productId, productName, productCategory, productPrice, productHeight, productWidth, productDepth, productMaterial, productDescription, pictureName);
      } catch (err) {
            console.log(err);
      }
}

// READ

exports.read = function (productId) {
      return db.prepare('SELECT * FROM products WHERE productId = ?').get(productId);
}

// GET

exports.getProductFromCategory = function (category) {
      return db.prepare('SELECT * FROM products WHERE productCategory = ?').all(category);
}

exports.getCategories = function () {
      let categories = db.prepare('SELECT DISTINCT productCategory FROM products').all();
      for (let i = 0; i < categories.length; i++) {
            let category = categories[i];
            if (category.productCategory === "None") {
                  categories.splice(i, 1);
            }
      }
      return categories;
}

exports.getMaterials = function () {
      let materials = db.prepare('SELECT DISTINCT productMaterial FROM products').all();
      for (let i = 0; i < materials.length; i++) {
            let material = materials[i];
            if (material.productMaterial === "None") {
                  materials.splice(i, 1);
                  break;
            }
      }
      return materials;
}


// UPDATE

exports.update = function (productId, productName, productCategory = "None", productPrice, productHeight, productWidth, productDepth, productMaterial, productDescription) {
      fs.readFile('json/products.json', function (err, data) { 
            if (err) throw err;
            let productsList = JSON.parse(data);
            for (let i = 0; i < productsList.length; i++) {
                  let product = productsList[i];
                  if (product.productId === productId) {
                        product.productName = productName;
                        product.productCategory = productCategory;
                        product.productPrice = productPrice;
                        product.productDescription = productDescription;
                        product.productHeight = productHeight;
                        product.productWidth = productWidth;
                        product.productDepth = productDepth;
                        product.productMaterial = productMaterial;
                  }
            }
            fs.writeFileSync('json/products.json', JSON.stringify(productsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      db.prepare('UPDATE products SET productName = ?, productCategory = ?, productPrice = ?, productHeight = ?, productWidth = ?, productDepth = ?, productMaterial = ?, productDescription = ? WHERE productId = ?').run(productName, productCategory, productPrice, productHeight, productWidth, productDepth, productMaterial, productDescription, productId);
}

// LIST

exports.list = function () {
      return db.prepare('SELECT * FROM products').all();
}


// DELETE

exports.delete = function (productId) {
      fs.readFile('json/products.json', function (err, data) {
            if (err) throw err;
            let productsList = JSON.parse(data);
            for (let i = 0; i < productsList.length; i++) {
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
      db.prepare('DELETE FROM products WHERE productId = ?').run(productId);
      console.log('product ' + productId + ' deleted');
}

// FUNCTION

function convertInAlphabet(str) {
      let alphabet = "abcdefghijklmnopqrstuvwxyz0123456789@_-";
      let newStr = "";
      for (let i = 0; i < str.length; i++) {
            if (alphabet.includes(str[i].toLowerCase())) {
                  newStr += str[i];
            }
      }
      return newStr;
};