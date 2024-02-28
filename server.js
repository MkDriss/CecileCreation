
// CONST & VARIABLES
const express = require("express");
const bodyparser = require("body-parser");
const mustache = require('mustache-express');
const cookieSession = require('cookie-session');
const crypto = require('crypto');
const multer = require('multer');
const stripe = require("stripe")('sk_test_51NZ9oPGoMv8PfBnKajor64U8hHsai70r5GxUcUVZdWNtxs5lEELdBYnBGE3OQxzDlxZb8xOgZXBM2oeRwe5CVajY0024tVXiH5');
const uploadProduct = multer({ dest: 'public/products_pictures/' });
const uploadProfilePicture = multer({ dest: 'public/profiles_pictures/' });
const fs = require('fs');
const app = express();

var account = require('./js/accounts');
var products = require('./js/products');
var cart = require('./js/cart');
var comments = require('./js/comments');
var orderList = require('./js/orderList');

// APP

app.engine('html', mustache());

app.set('view engine', 'html');
app.set('views', './views');

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static('public/products_pictures/'));
app.use(express.static('public/icons'));
app.use(express.static('public/css'));
app.use(express.static('public/profiles_pictures/'));
app.use(express.static('js'));
app.use(cookieSession({ secret: 'j7G!wA4t&L,_T9kq5}M(NBF' }));
app.use(middleware);

// MIDDLEWARE

function middleware(req, res, next) {
    if (req.session.username) {
        res.locals.authenticated = true;
        res.locals.name = req.session.username;
    } else
        res.locals.authenticated = false;
    next();
}


// FUNCTIONS

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

function createOrder(id, email, userName, userLastName, userAdress, userCity, userPostCode, userPhoneNumber, orderCommentary) {

    let orderProducts = "";
    let cartuser = cart.listProducts(id);

    for (let i = 0; i < cartuser.length; i++) {
        let product = JSON.parse(cartuser[i].products);
        orderProducts += product.productId;
        if (i < cartuser.length - 1) {
            orderProducts += ', ';
        }
    }

    let state = "Pedding";
    let date = getDateOrder();
    let price = cart.getTotalPrice(id);

    orderList.createOrder(id, email, userName, userLastName,
        userAdress, userCity, userPostCode, userPhoneNumber,
        orderProducts, price, orderCommentary, date, state);
    cart.clearAll(id);
}



//GET METHODS


app.get('/', (req, res) => {
    let randomId = Math.floor(Math.random() * products.list().length);
    let productsList = products.list();
    let trendProduct = products.read(productsList[randomId].productId);
    res.render('home', { trendProduct: trendProduct, products: productsList, css: '/home.css' });
});

app.get('/home', (req, res) => {
    res.redirect('/');
});

app.get('/login', (req, res) => {
    res.render('login', { css: '/login.css' });
});

app.get('/register', (req, res) => {
    res.render('register', { css: '/register.css' });
});

app.get('/account', (req, res) => {
    let user = account.read(req.session.id);
    if (user.profilePicture === undefined || user.profilePicture === "") {
        user.profilePicture = "defaultAccountIco.png";
    }
    res.render('account', { accountsInfos: user, admin: req.session.admin, css: '/account.css' });
});

app.get('/adminPanel', (req, res) => {
    if (req.session.admin === true) {
        res.render('adminPanel', { admin: req.session.admin, css: '/admin.css' });
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
    res.render('addProduct', { admin: req.session.admin, css: '/addProduct.css', categories: products.getCategories() });
});

app.get('/updateAccount', (req, res) => {
    let user = account.read(req.session.id);
    if (user.profilePicture === undefined || user.profilePicture === "") {
        user.profilePicture = "defaultAccountIco.png";
    }
    res.render('updateAccount', { accountsInfos: user, admin: req.session.admin, css: '/updateAccount.css' });
});


app.get('/updateProduct/:id', (req, res) => {
    let product = products.read(req.params.id)
    let currentCategory = product.productCategory;
    let currentMaterial = product.productMaterial
    if (currentCategory === "None") {
        currentCategory = false;
    }
    if (currentMaterial === "None") {
        currentMaterial = false;
    }


    let productCategories = products.getCategories();
    for (let i = 0; i < productCategories.length; i++) {
        if (productCategories[i].productCategory === product.productCategory) {
            productCategories.splice(i, 1);
            break;
        }
    }

    let productMaterials = products.getMaterials();
    for (let i = 0; i < productMaterials.length; i++) {
        if (productMaterials[i].productMaterial === currentMaterial) {
            productMaterials.splice(i, 1);
            break;
        }
    }
    res.render('updateProduct', { products: product, css: '/updateProduct.css', productPictures: product.productPicture, admin: req.session.admin, categories: productCategories, materials : productMaterials, currentCategory: currentCategory, currentMaterial: currentMaterial });
});

app.get('/updateOrder/:id', (req, res) => {
    let orderId = req.params.id;
    let order = orderList.getOrderFromId(orderId);
    let currentState = order.state;
    productIdList = order.products.split(', ');
    for (let i = 0; i < productIdList.length; i++) {
        productIdList[i] = products.read(productIdList[i]);
    }
    otherStates = [{ state: "Pendding" }, { state: "In progress" }, { state: "Delivered" }, { state: "Cancelled" }]
    for (let i = 0; i < otherStates.length; i++) {
        if (otherStates[i].state === currentState) {
            otherStates.splice(i, 1);
            break;
        }
    }
    res.render('updateOrder', {
        admin: req.session.admin, products: productIdList, order: order,
        css: '/updateOrder.css', otherStates: otherStates, currentState: currentState
    });
});


app.get('/deleteProduct/:id', (req, res) => {
    let productId = req.params.id;
    let product = products.read(productId);
    res.render('deleteProduct', { products: product, css: '/deleteProduct.css', admin: req.session.admin });
});

app.get('/cart', (req, res) => {
    if (req.session.id === undefined) {
        res.redirect('login');
    }
    else {
        let cartuser = cart.listProducts(req.session.id);

        if (cartuser == undefined || cartuser.length == 0) {
            console.log("Cart is empty");
            res.render('cart', { cartId: req.session.id, css: '/cart.css' });
        }
        else {
            let cartProductsInfos = []
            for (let i = 0; i < cartuser.length; i++) {
                cartProductsInfos.push(JSON.parse(cartuser[i].products));
            }
            let totalPrice = cart.getTotalPrice(req.session.id);
            let passOrder = cartuser.length > 0;
            res.render('cart', { css: '/cart.css', cartLength: cartuser.length, cartId: req.session.id, cartProducts: cartProductsInfos, totalPrice: totalPrice, passOrder: passOrder });
        }
    }

});

app.get('/addToCart/:id', (req, res) => {

    if (req.session.authenticated === false || req.session.authenticated === undefined) {
        return res.render('login', { msg: "You must be logged in to add a product to your cart", css: '/login.css', productId: req.params.id });
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

        let category = product.productCategory;
        if (category == "None") {
            category = "";
        }

        if (product.productMaterial === "None"){
            product.productMaterial = "";
        }
        return res.render('readProduct', { products: product, category: category, comments: commentsList, otherProducts: otherProducts, admin: req.session.admin, css: '/readProduct.css' });
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
    //TO DO
});

app.get('/resetPassword/:id', (req, res) => {
    res.render('resetPassword');
    //TO DO
});

app.get('/aboutUs', (req, res) => {
    //TO DO
    res.render('aboutUs', { css: '/aboutUs.css' });
});


app.get('/deliveryInfos', (req, res) => {
    let cartuser = cart.listProducts(req.session.id);

    if (req.session.id == undefined || req.session.id == null) {
        res.redirect('/login');
    }

    let totalPrice = cart.getTotalPrice(req.session.id);

    if (cartuser == undefined || cartuser.length == 0) {
        console.log("Cart is empty");
        return res.redirect('/cart');
    }

    let cartProductsInfos = []

    for (let i = 0; i < cartuser.length; i++) {
        cartProductsInfos.push(JSON.parse(cartuser[i].products));
    }

    let userAccountInfos = account.read(req.session.id);

    res.render('deliveryInfos', { cartItems: cartProductsInfos, userAccountInfos: userAccountInfos, totalPrice: totalPrice, css: '/deliveryInfos.css' });
});


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
        res.render('checkout', { css: '/checkout.css', authenticated: req.session.authenticated });
    }
    catch (err) {
        res.redirect('/cart');
    }
});

app.get('/createOrder', (req, res) => {
    createOrder(req.session.id, req.session.email, req.session.username, req.session.userLastName, req.session.userAdress, req.session.userCity, req.session.userPostCode, req.session.userPhoneNumber, req.session.orderCommentary);
    res.redirect('/orders');
});

//POST METHODS

app.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let productId = req.body.productId;
    if (email == undefined || password == undefined) {
        console.log("email or password is undefined")
        return res.render('login', { msg: "Invalid email or password", css: '/login.css' });
    }
    else if (account.checkPassword(email, password) == 'true') {

        req.session.id = (account.getIdFromEmail(email)).id;
        req.session.email = email;
        req.session.username = account.read(req.session.id).username;
        req.session.authenticated = true;
        req.session.admin = account.checkAdmin(req.session.id);

        console.log(req.session.username + ' connected');
        if (productId != undefined) {

            console.log("Adding product to cart")
            return res.redirect('/addToCart/' + productId);
        }
        return res.redirect('/home');
    }
    else if (account.checkPassword(email, password) == 'false') {
        console.log("Invalid username or password")
        return res.render('login', { msg: "Wrong username or password", css: '/login.css' });
    }
});

app.post('/register', (req, res) => {
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    let confirmPassword = req.body.confimPassword;
    let id = crypto.randomBytes(32).toString("hex");

    if (email == undefined || username == undefined || password == undefined) {
        console.log("Invalid username or password")
        return res.render('register', { msg: "Invalid email, username or password", css: '/register.css' });
    }
    else if (confirmPassword != password) {
        console.log("Password aren't matching")
        return res.render('register', { msg: "Wrong password", css: '/register.css' })
    }
    else if (account.read(id) == undefined && account.checkEmail(email) == 'false') {
        account.create(id, email, username, password);
        return res.redirect('/login');
    }
    else if (account.read(email) != undefined) {
        console.log("An account already exists with this email")
        return res.render('register', { msg: "An account already exists with this email", css: '/register.css' });
    }
});


app.post('/forgotPassword', (req, res) => {
    let email = req.body.email;
    let username = req.session.username;
    if (email == undefined) {
        console.log("Invalid email")
        return res.render('forgotPassword', { msg: "Invalid email", css: '/forgotPassword.css' });
    }
    else if (account.read(email) == undefined) {
        console.log("No account found with this email")
        return res.render('forgotPassword', { msg: "No account found with this email", css: '/forgotPassword.css' });
    }
    else if (account.read(email) != undefined) {
        let token = account.read(email).token;
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
    //TO DO
});


app.post('/updateAccount', uploadProfilePicture.single('updateProfilePicture'), (req, res) => {
    let username = req.body.name;
    let userlastname = req.body.lastName;
    let email = req.body.email;
    let adress = req.body.adress;
    let city = req.body.city;
    let zipCode = req.body.postCode;
    let phone = req.body.phoneNumber;
    let id = req.session.id;

    let profilePictureName;
    if (req.file == undefined) {
        profilePictureName = account.read(id).profilePicture;
    } else {
        profilePictureName = convertInAlphabet(req.file.originalname) + '_' + id + '.png';
    }

    if (email == undefined || username == undefined) {
        console.log("Invalid username or password")
        return res.render('updateAccount', { msg: "Invalid email, username or password", css: '/updateAccount.css' });
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

        return res.redirect('/account');
    }
});


app.post('/addProduct', uploadProduct.single('uploadPicture'), (req, res) => {
    let name = req.body.name;
    let price = req.body.price;
    let description = req.body.description;
    let productCategory = req.body.productCategory;
    let productNewCategory = req.body.newCategory;
    let productHeight = req.body.height;
    let productWidth = req.body.width;
    let productDepth = req.body.depth;
    let productMaterial = req.body.material;
    let productNewMaterial = req.body.newMaterial;

    if (productCategory === "addCategory") {
        if (productNewCategory === "") {
            productCategory = "None";
        }
        else {
            productCategory = productNewCategory;
        }
    }

    if (productMaterial === "addMaterial") {
        if (productNewMaterial === "") {
            productMaterial = "None";
        }
        else {
            productMaterial = productNewMaterial;
        }
    }

    let pictureData = req.file;
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
        products.create(productId, name, productCategory, productHeight, productWidth, productDepth, productMaterial, price, description, pictureData);

        let tmp_path = req.file.path;
        let target_path = 'public/products_pictures/' + convertInAlphabet(name) + '_' + productId + '.png';
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
    let category = req.body.productCategory;
    let newCategory = req.body.newCategory;
    let price = req.body.productPrice;
    let productHeight = req.body.productHeight;
    let productWidth = req.body.productWidth;
    let productDepth = req.body.productDepth;
    let productMaterial = req.body.productMaterial;
    let productNewMaterial = req.body.newProductMaterial;
    let description = req.body.productDescription;
    let pictureData = req.file;
    if (category === "addCategory") {
        if (newCategory === "") {
            category = "None";
        }
        else {
            category = newCategory;
        }
    }

    if (productMaterial === "addProductMaterial") {
        if (productNewMaterial === "") {
            productMaterial = "None";
        }
        else {
            productMaterial = productNewMaterial;
        }
    }

    if (name == undefined || price == undefined || description == undefined) {
        console.log("Invalid product")
        return res.redirect('/updateProduct/' + productId);
    }

    else if (products.read(productId) != undefined) {
        products.update(productId, name, category, price, productHeight, productWidth, productDepth, productMaterial, description);
        if (!(pictureData === undefined)) {
            let tmp_path = req.file.path;
            let target_path = 'public/products_pictures/' + name + '_' + productId + '.png';
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
    let category = req.body.productCategory;

    if (category != undefined && category != "None") {
        for (let i = 0; i < productsList.length; i++) {
            if (productsList[i].productCategory == category) {
                productsFoundbyCategory.push(productsList[i]);
                if (search != undefined && search != "") {
                    if ((productsList[i].productName).toLowerCase().includes(search.toLowerCase())) {
                        productsFoundbySearch.push(productsList[i]);
                    }
                }
            }
        }
        if (productsFoundbySearch.length > 0) {
            return res.render('shop', { products: productsFoundbySearch, css: '/shop.css', categories: products.getCategories() });
        }
        return res.render('shop', { products: productsFoundbyCategory, css: '/shop.css', categories: products.getCategories() });
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
    let user = account.read(req.session.id);
    req.session.email = user.email;
    req.session.userName = req.body.name;
    req.session.userLastName = req.body.lastName;
    req.session.userAdress = req.body.adress;
    req.session.userCity = req.body.city;
    req.session.userPostCode = req.body.postCode;
    req.session.userPhoneNumber = req.body.phoneNumber;
    req.session.orderCommentary = req.body.orderCommentary;
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
            clientSecret: paymentIntent.client_secret
        });

    }
    catch (err) {
        res.redirect('/');
    }
});

app.post('/updateOrder/:id', (req, res) => {
    let newState = req.body.orderState;
    let orderId = req.params.id;
    orderList.updateOrderState(orderId, newState);
    res.redirect('/allOrders');
});

app.post('/deleteOrder/:id', (req, res) => {
    if (req.session.admin === true) {
        let orderId = req.params.id;
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