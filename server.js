const express = require("express");
const bodyparser = require("body-parser");
const mustache = require('mustache-express');
const nodemailer = require('nodemailer');
const mailgen = require('mailgen');
const crypto = require('crypto');
const multer = require('multer');
const stripe = require("stripe")('sk_test_51NZ9oPGoMv8PfBnKajor64U8hHsai70r5GxUcUVZdWNtxs5lEELdBYnBGE3OQxzDlxZb8xOgZXBM2oeRwe5CVajY0024tVXiH5');

const uploadProduct = multer({ dest: 'public/products_pictures/BackPack/' });
const uploadProfilePicture = multer({ dest: 'public/profiles_pictures/' });
const fs = require('fs');
const app = express();

app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', './views');

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('public/products_pictures/BackPack'));
app.use(express.static('public/icons'));
app.use(express.static('public/css'));
app.use(express.static('public/profiles_pictures/'));
app.use(express.static('js'));

const cookieSession = require('cookie-session');
app.use(cookieSession({
    secret: 'j7G!wA4t&L,_T9kq5}M(NBF'
}));




//Middleware to check if user un authenticated

function middleware(req, res, next) {
    if (req.session.username) {
        res.locals.authenticated = true;
        res.locals.name = req.session.username;
    } else
        res.locals.authenticated = false;
    next();
}


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


app.use(middleware);


var account = require('./js/accounts');
var products = require('./js/products');
var cart = require('./js/cart');
var comments = require('./js/comments');
var orderList = require('./js/orderList');
const { setMaxIdleHTTPParsers } = require("http");

//SEND MAILS


const config = {
    service: 'gmail',
    auth: {
        user: 'meskinidrisspro@gmail.com',
        pass: 'snnzxxkuepkpmbwh'
    }
}

const transporter = nodemailer.createTransport(config);

const mailgenerator = new mailgen({
    theme: 'default',
    product: {
        name: 'Cecile Creation',
        link: 'http://localhost:3001/home'
    }
});


const getbill = (req, res) => {

    let message = {
        from: 'meskinidrisspro@gmail.com',
        to: 'mathieumeskini@gmail.com',
        subject: 'Order Confirmation',
        html: mail
    }

    transporter.sendMail(message).then(() => {
        console.log('you should receive an email shortly');
    }).catch(err => {
        console.log(err);
    });
}

//OTHER FUNCTIONS

//GET METHODS


app.get('/', (req, res) => {
    let randomId = Math.floor(Math.random() * products.list().length);
    let productsList = products.list();
    let trendProduct = products.read(productsList[randomId].productId);
    account.test();
    res.render('home', { trendProduct: trendProduct, products: productsList, css: '/home.css' });
});

app.get('/home', (req, res) => {
    res.redirect('/');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/account', (req, res) => {
    let user = account.read(req.session.id);
    res.render('account', { accountsInfos: user, admin: req.session.admin });
});

app.get('/adminPanel', (req, res) => {
    if (req.session.admin === true) {
        res.render('adminPanel', { admin: req.session.admin });
    }
});

app.get('/logout', (req, res) => {
    console.log(req.session.username + " logged out");
    req.session.username = null;
    req.session.email = null;
    req.session.authenticated = false;
    req.session.admin = false;
    req.session.id = null;
    res.redirect('/home');
});

app.get('/orders', (req, res) => {

    if (!req.session.authenticated) {
        res.redirect('/login');
    }

    else {
        res.render('orders', { orders: orderList.getOrdersFromUserId(req.session.id), css: '/orders.css' });
    }
});

app.get('/shop', (req, res) => {
    let categories = products.getCategories();
    res.render('shop', { products: products.list(), css: '/shop.css', categories: categories });
});

app.get('/addProduct', (req, res) => {
    res.render('addProduct', { admin: req.session.admin });
});


app.get('/updateAccount', (req, res) => {
    let user = account.read(req.session.id);
    res.render('updateAccount', { accountsInfos: user });
});


app.get('/updateProduct/:id', (req, res) => {
    let product = products.read(req.params.id)
    console.log(product.productPicture)
    res.render('updateProduct', { products: product, css: '/updateProduct.css', admin: req.session.admin, productPictures: product.productPicture });
});

app.get('/updateOrder/:id', (req, res) => {
    let orderId = req.params.id;
    let order = orderList.getOrderFromId(orderId);
    res.render('updateOrder', { admin: req.session.admin, order: order, css: '/updateOrder.css' });
});


app.get('/deleteOrder/:id', (req, res) => {
    let orderId = req.params.id;
    let order = orderList.getOrderFromId(orderId);
    res.render('deleteOrder', { admin: req.session.admin, order: order, css: '/deleteOrder.css' });
});


app.get('/deleteProduct/:id', (req, res) => {
    let productId = req.params.id;
    let product = products.read(productId);
    res.render('deleteProduct', { product: product, css: '/deleteProduct.css', admin: req.session.admin });
});

app.get('/cart', (req, res) => {
    if (req.session.id === undefined) {
        res.redirect('login');
    }
    else {
        let cartuser = cart.listProducts(req.session.id);

        if (cartuser == undefined || cartuser.length == 0) {
            console.log("Cart is empty");
            res.render('cart', { cartId: req.session.id });
        }
        else {
            let cartProductsInfos = []
            for (let i = 0; i < cartuser.length; i++) {
                cartProductsInfos.push(JSON.parse(cartuser[i].products));
            }
            let totalPrice = cart.getTotalPrice(req.session.id);
            let passOrder = cartuser.length > 0;
            res.render('cart', { cartLength: cartuser.length, cartId: req.session.id, cartProducts: cartProductsInfos, totalPrice: totalPrice, passOrder: passOrder });
        }
    }

});

app.get('/addToCart/:id', (req, res) => {

    if (req.session.authenticated === false || req.session.authenticated === undefined) {
        return res.render('login', { msg: "You must be logged in to add a product to your cart", css: '/login.css', productId : req.params.id});
    }

    let id = req.params.id;
    let userId = req.session.id;
    if (id == undefined || userId == undefined) {
        console.log("Product or User not found");
        return res.redirect('/cart');
    }

    else {
        let product = JSON.stringify(products.read(id));
        cart.addProduct(userId, product);
        return res.redirect('/cart');
    }
});

app.get('/removeFromCart/:productId', (req, res) => {
    let productId = req.params.productId;
    let cartId = req.session.id;
    if (productId == undefined) {
        console.log("Product not found");
        return res.redirect('/cart');
    }
    else {
        let product = JSON.stringify(products.read(productId));
        cart.removeProduct(cartId, product);
        console.log("Product removed from cart");
        return res.redirect('/cart');
    }
});

app.get('/removeFromSummary/:productId', (req, res) => {
    let productId = req.params.productId;
    let cartId = req.session.id;
    if (productId == undefined) {
        console.log("Product not found");
        return res.redirect('/orderSummary');
    }
    else {
        let product = JSON.stringify(products.read(productId));
        cart.removeProduct(cartId, product);
        console.log("Product removed from cart");
        return res.redirect('/orderSummary');
    }
});

app.get('/readProduct/:productId', (req, res) => {
    let productId = req.params.productId;
    if (productId == undefined) {
        console.log("Product not found");
        return res.redirect('/shop');
    }
    else {
        let product = products.read(productId);
        let commentsList = comments.list(productId);
        let prod = products.list();
        let otherProducts = [];

        for (let i = 0; i < prod.length; i++) {
            if (prod[i].productId != productId && !otherProducts.includes(prod[i])) {
                otherProducts.push(prod[i]);
            }
            if (otherProducts.length == 4) {
                break;
            }
        }

        return res.render('readProduct', { products: product, comments: commentsList, otherProducts: otherProducts, admin: req.session.admin });
    }
});

app.get('/deleteComment/:commentId', (req, res) => {
    let commentId = req.params.commentId;
    if (commentId == undefined) {
        console.log("Comment not found");
        return res.redirect('/shop');
    }
    else {
        comments.delete(commentId);
        console.log("Comment deleted");
        return res.redirect('/shop');
    }
});

app.get('/forgotPassword', (req, res) => {
    res.render('forgotPassword');
});

app.get('/resetPassword/:id', (req, res) => {
    res.render('resetPassword');

});

app.get('/aboutUs', (req, res) => {
    res.render('aboutUs');
});


app.get('/deliveryInfos', (req, res) => {
    let cartuser = cart.listProducts(req.session.id);

    if (req.session.id == undefined || req.session.id == null) {
        res.redirect('/login');
    }

    let totalPrice = cart.getTotalPrice(req.session.id);
    let cartProductsInfos = []

    for (let i = 0; i < cartuser.length; i++) {
        cartProductsInfos.push(JSON.parse(cartuser[i].products));
    }

    let userAccountInfos = account.read(req.session.id);

    res.render('deliveryInfos', { cartItems: cartProductsInfos, userAccountInfos: userAccountInfos, totalPrice: totalPrice, css: '/deliveryInfos.css' });
});




app.get('/orderSummary', (req, res) => {
    if (req.session.id == undefined) {
        res.redirect('/login');
    }
    else {
        let cartuser = cart.listProducts(req.session.id);

        if (cartuser == undefined || cartuser.length == 0) {
            console.log("Cart is empty");
            res.render('cart', { cartId: req.session.id });
        }
        else if (cartuser != undefined) {
            let cartProductsInfos = []
            for (let i = 0; i < cartuser.length; i++) {
                cartProductsInfos.push(JSON.parse(cartuser[i].products));
            }

            let totalPrice = cart.getTotalPrice(req.session.id);
            res.render('orderSummary', { cartLength: cartuser.length, cartId: req.session.id, cartProducts: cartProductsInfos, totalPrice: totalPrice, name: req.session.userName, lastName: req.session.userLastName, adress: req.session.userAdress, city: req.session.userCity, postCode: req.session.userPostCode, phoneNumber: req.session.userPhoneNumber });
        }
    }

});


function getDateOrder() {
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    if (day < 10) {
        day = "0" + day;
    }
    if (month < 10) {
        month = "0" + month;
    }

    let dateOrder = day + "/" + month + "/" + year;
    return dateOrder;
}

function createOrder(req) {
    let orderProducts = "";
    let cartuser = cart.listProducts(req.session.id);
    for (let i = 0; i < cartuser.length; i++) {
        let product = JSON.parse(cartuser[i].products);
        orderProducts += product.productId;

        if (i < cartuser.length - 1) {
            orderProducts += ', ';
        }
    }
    let state = "En cours de traitement";
    let date = getDateOrder();
    let price = cart.getTotalPrice(req.session.id);

    orderList.createOrder(req.session.id, req.session.email, req.session.userName, req.session.userLastName,
        req.session.userAdress, req.session.userCity, req.session.userPostCode, req.session.userPhoneNumber,
        orderProducts, price, req.body.orderCommentary, date, state);
}

app.get('/orderDetails/:id', (req, res) => {
    let orderId = req.params.id;
    let order = orderList.getOrderFromId(orderId);
    let orderProductsId = order.products.split(', ');
    let productsList = [];
    for (let i = 0; i < orderProductsId.length; i++) {
        productsList.push(products.read(orderProductsId[i]));
    }
    res.render('orderDetails', { order: order, css: '/orderDetails.css', products: productsList });
});

app.get('/allOrders', (req, res) => {
    if (req.session.admin === true) {
        res.render('allOrders', { admin: req.session.admin, orders: orderList.listOrders(), css: '/allOrders.css' });
    }
});


app.get('/adminProductList', (req, res) => {
    if (req.session.admin === true) {
        res.render('adminProductList', { products: products.list(), css: '/adminProductList.css', admin: req.session.admin })
    }
});

app.get('/checkout', (req, res) => {
    try {
        res.render('checkout', { css: '/checkout.css' });
    }
    catch (err) {
        res.redirect('/cart');
    }
});


//POST METHODS


app.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let productId = req.body.productId;
    if (email == undefined || password == undefined) {
        console.log("email or password is undefined")
        return res.render('login', { msg: "Invalid email or password" });
    }
    else if (account.checkPassword(email, password) == 'true') {

        req.session.id = (account.getIdFromEmail(email)).id;
        req.session.email = email;
        req.session.username = account.read(req.session.id).username;
        req.session.authenticated = true;
        req.session.admin = account.checkAdmin(req.session.id);

        console.log(req.session.username + ' connected');
        console.log(req.session.email)
        console.log(req.session.admin);
        console.log("productId : " + productId)
        if (productId != undefined) {
            
            console.log("Adding product to cart")
            return res.redirect('/addToCart/' + productId);
        }
        return res.redirect('/home');
    }
    else if (account.checkPassword(email, password) == 'false') {
        console.log("Invalid username or password")
        return res.render('login', { msg: "Wrong username or password" });
    }
});

app.post('/register', (req, res) => {
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    let id = crypto.randomBytes(32).toString("hex");

    if (email == undefined || username == undefined || password == undefined) {
        console.log("Invalid username or password")
        return res.render('register', { msg: "Invalid email, username or password" });
    }
    else if (account.read(id) == undefined && account.checkEmail(email) == 'false') {
        account.create(id, email, username, password);
        console.log("username : " + username);
        console.log("password : " + password);
        return res.redirect('/login');
    }
    else if (account.read(email) != undefined) {
        console.log("An account already exists with this email")
        return res.render('register', { msg: "An account already exists with this email" });
    }
});


app.post('/forgotPassword', (req, res) => {
    let email = req.body.email;
    let username = req.session.username;
    if (email == undefined) {
        console.log("Invalid email")
        return res.render('forgotPassword', { msg: "Invalid email" });
    }
    else if (account.read(email) == undefined) {
        console.log("No account found with this email")
        return res.render('forgotPassword', { msg: "No account found with this email" });
    }
    else if (account.read(email) != undefined) {
        let token = account.read(email).token;
        console.log(token);
        console.log("An email has been sent to " + email);

        let response = {
            body: {
                name: username,
                intro: "Reset password by following the link below",
                table: {
                    data: [
                        {
                            item: 'http://localhost:3001/resetPassword/' + token,
                        }
                    ]
                },
                outro: 'We thank you for your purchase'
            }
        };


        let mail = mailgenerator.generate(response);

        let message = {
            from: 'meskinidrisspro@gmail.com',
            to: email,
            subject: 'Reset password',
            html: mail
        }

        transporter.sendMail(message).then(() => {
            console.log('you should receive an email shortly');
        }).catch(err => {
            console.log(err);
        });
    }
});

app.post('/resetPassword/:token', (req, res) => {
});


app.post('/updateAccount', uploadProfilePicture.single('profilePicture'), (req, res) => {
    let username = req.body.username;
    let userlastname = req.body.lastName;
    let email = req.body.email;
    let adress = req.body.adress;
    let city = req.body.city;
    let zipCode = req.body.zipCode;
    let phone = req.body.phone;
    let id = req.session.id;
    let profilePictureName;
    if (req.file == undefined) {
        profilePictureName = account.read(id).profilePicture;
    } else {
        profilePictureName = convertInAlphabet(req.file.originalname) + '_' + id + '.png';
    }

    if (email == undefined || username == undefined) {
        console.log("Invalid username or password")
        return res.render('updateAccount', { msg: "Invalid email, username or password" });
    }
    else if (account.read(email) == undefined) {
        account.updateAccount(id, username, userlastname, email, adress, city, zipCode, phone, profilePictureName);

        if (req.file == undefined) {
            console.log("No profile picture uploaded");
        } else {
            let tmp_path = req.file.path;
            let target_path = 'public/profiles_pictures/' + profilePictureName;
            let src = fs.createReadStream(tmp_path);
            let dest = fs.createWriteStream(target_path);
            src.pipe(dest);
        }

        console.log("Account updated");
        console.log("username : " + username);
        console.log("userlastname : " + userlastname);
        console.log("email : " + email);
        console.log("adress : " + adress);
        console.log("city : " + city);
        console.log("phone : " + phone);
        console.log("profilePicture : " + profilePictureName);
        console.log(account.read(id));
        return res.redirect('/account');
    }
});


app.post('/addProduct', uploadProduct.single('picture'), (req, res) => {
    let name = req.body.name;
    let price = req.body.price;
    let description = req.body.description;
    let pictureData = req.file;
    console.log(pictureData)
    if (name == undefined || price == undefined || description == undefined || pictureData == undefined) {
        console.log("Invalid product")
        return res.redirect('/addProduct');
    }

    else if (products.read(name) != undefined) {
        console.log("Product already exists")
        return res.redirect('/addProduct');
    }

    else if (products.read(name) == undefined) {

        let productId = crypto.randomBytes(10).toString("hex");
        products.create(productId, name, price, description, pictureData);

        let tmp_path = req.file.path;
        let target_path = 'public/products_pictures/BackPack/' + name + '_' + productId + '.png';
        let src = fs.createReadStream(tmp_path);
        let dest = fs.createWriteStream(target_path);
        src.pipe(dest);

        return res.redirect('/shop');
    }

    return res.redirect('/addProduct');
});

app.post('/updateProduct/:id', uploadProduct.single('inputPicture'), (req, res) => {
    let productId = req.params.id;
    let name = req.body.productName;
    let price = req.body.productPrice;
    let description = req.body.productDescription;
    let pictureData = req.file;
    if (name == undefined || price == undefined || description == undefined) {
        console.log("Invalid product")
        return res.redirect('/updateProduct/' + productId);
    }

    else if (products.read(productId) != undefined) {
        products.update(productId, name, price, description);
        if (!(pictureData === undefined)) {
            let tmp_path = req.file.path;
            let target_path = 'public/products_pictures/BackPack/' + name + '_' + productId + '.png';
            let src = fs.createReadStream(tmp_path);
            let dest = fs.createWriteStream(target_path);
            src.pipe(dest);
        }

        return res.redirect('/shop');
    }

    return res.redirect('/shop');
});

app.post('/searchProduct', (req, res) => {
    let search = req.body.search;
    let productsList = products.list();
    let productsFoundbyCategory = [];
    let productsFoundbySearch = [];
    let category = req.body.category;
    
    if (category != undefined) {
        
        for (let i = 0; i < productsList.length; i++) {
            if (productsList[i].productCategory == category) {
                productsFoundbyCategory.push(productsList[i]);
            }
            if (search != undefined) {
                for (let i = 0; i < productsFoundbyCategory.length; i++) {
                    if ((productsFoundbyCategory[i].productName).toLowerCase().includes(search.toLowerCase())) {
                        productsFoundbySearch.push(productsFoundbyCategory[i]);
                    }
                }
                return res.render('shop', { products: productsFoundbySearch, css: '/shop.css', categories: products.getCategories()});
            }
            return res.render('shop', { products: productsFoundbyCategory, css: '/shop.css', categories : products.getCategories()});
        }
    }

    else if (search != undefined) {
        for (let i = 0; i < productsList.length; i++) {
            if ((productsList[i].productName).toLowerCase().includes(search.toLowerCase())) {
                productsFoundbySearch.push(productsList[i]);
            }
        }
        return res.render('shop', { products: productsFoundbySearch, css: '/shop.css', categories: products.getCategories() });
    }
});


app.post('/addComment', (req, res) => {
    if (req.session.authenticated === false || req.session.authenticated === undefined) {
        console.log("You must be logged in to add a comment");
        return res.redirect('/login');
    }

    let productId = req.body.productId;
    let commentContent = req.body.content;
    let user = req.session.username;
    let profilePicture = account.read(req.session.id).profilePicture;
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    let dateComment = day + "/" + month + "/" + year;

    if (commentContent == undefined || commentContent == "") {
        console.log("Invalid comment")
        return res.redirect('/shop');
    }

    else {
        comments.create(user, dateComment, commentContent, productId, profilePicture);
        return res.redirect('/readProduct/' + productId);
    }
});


app.post('/deliveryInfos', (req, res) => {
    res.redirect('/checkout');
});

app.post("/create-payment-intent", async (req, res) => {
    if (req.session.id == undefined) {
        res.redirect('/login');
    }
    let tolalPrice = cart.getTotalPrice(req.session.id) * 100;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: tolalPrice,
            currency: "eur",
            automatic_payment_methods: {
                enabled: true,
            },
        });
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    }
    catch (err) {
        res.redirect('/');
    }
});

app.post('/updateOrder', (req, res) => {
    let newState = req.body.state;
    let orderId = req.body.orderId;
    orderList.updateOrderState(orderId, newState);
    res.redirect('/allOrders');
});

app.post('/deleteOrder', (req, res) => {
    if (req.session.admin === true) {
        let orderId = req.body.orderId;
        orderList.deleteOrderFromId(orderId);
        res.redirect('/allOrders');
    }
});

app.post('/deleteProduct/:id', (req, res) => {
    let productId = req.params.id;
    products.delete(productId);
    res.redirect('/adminProductList');
});

//LISTENING


app.listen(3000, () => {
    console.log("Server listening ");
    console.log("http://localhost:3000");
});