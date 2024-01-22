require('dotenv').config()
const mongoose = require('mongoose')
const passport = require('passport')
const flash = require('express-flash')  
const session = require('cookie-session')
const bcrypt = require('bcryptjs')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const multer = require('multer')
const axios = require('axios')
const path = require('path')
const express = require('express')
const app = express();
const User = require('./models/User')
const Product = require('./models/Products')
const receipt = require('./models/save_reciept')
const Receipt = require('./models/PaypalWebhook');
const ApprovalRequest = require('./models/approvalrequests')
const savedPurchase = require('./models/savedpurchases')





const initializePassport = require('./passport-config')

app.set('view engine', 'ejs')

app.use('/uploads', express.static('uploads'))
app.use(express.urlencoded({ extended: false }))

//set up multer
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads/')
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage });

//setup bodyparser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//initialize passport
initializePassport(
    passport,
    reg_id => User.findOne({ reg_id: reg_id }),
    id => User.findById(id)
)


app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

mongoose.connect(process.env.DATABASE_URL)

//if connection is successful
mongoose.connection.on('connected', () => {
    console.log('Mongoose is connected')
})

//if connection has an error
mongoose.connection.on('error', (err) => {
    console.log(err, 'Mongoose failed to connect')
})

//function checkauthenticated
function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    res.send(`
        <script>
            alert('You need to login first');
            window.location.href = '/login';
        </script>
    `);
}

function regemail(full_name, email, reg_id){

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'madastore49@gmail.com', 
          pass: 'iycbwrkdhivdddgr' 
        }
      });
        //create mail options
        const mailOptions = {
            from: 'MADASTORE',
            to: email,
            subject: 'REGISTRATION SUCCESSFUL',
            text: `Dear ${full_name}\n\n You have successfully registered on MADASTORE. Your registration number is ${reg_id}.\n\n Thank you for registering on MADASTORE. login @ https://madastore.herokuapp.com/login \n\n Regards, \n MADASTORE TEAM`

            };
            //send mail
            transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
            }
        );
}

async function getCustomerProducts(userId) {
    try {
        const user = await User.findOne({ _id: userId });
        const products = await Product.find(); // Modify this query based on your requirements

        // Fetch prices for each product
        const productPrices = await Promise.all(products.map(async (product) => {
            return product.price;
        }));

        const shuffledProducts = products.sort(() => Math.random() - 0.5).slice(0, 6);

        return { user, products: shuffledProducts, prices: productPrices };
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const admin_reg_id_random = Math.floor(Math.random() * 1000000000)
const admin_reg_id = admin_reg_id_random+'a'
//create admin user function
async function createAdminUser(){
    try{
        const hashedPassword = await bcrypt.hash('admin', 10)
        const admin = new User({
            reg_id: admin_reg_id,
            full_name: 'admin',
            email: 'stanfordperenje@Gmail.com',
            password: hashedPassword,
            usertype: 'admin',
            continent: 'Africa',
            currentRates: '1.0000',
            currencyPlural: 'Zimbabwean dollars',
            currency: 'ZWL',
            country: 'Zimbabwe',
            countryCode: 'ZW',
            countryPhone: '+263'
        })
        //check if admin user already exists
        if(await User.findOne({usertype: 'admin'})){
            console.log('Admin user already exists')
        }else{
            await admin.save()
            console.log('Admin user created successfully')
        }
    }
    catch(error){
        console.log(error)
    }
}

//call create admin user function
createAdminUser();



app.get('/', (req, res) => {
    res.render('index.ejs')
})
app.get('/login',(req, res) => {
    res.render('login.ejs')
})


app.post('/loginrequest', passport.authenticate('local', {
    successRedirect: '/dashboard', 
    failureRedirect: '/login', 
    failureFlash: true 
  }));
  

let continent;
let currentRates;
let currencyPlural;
let currency;
let country;
let countryCode;
let countryPhone;

app.get('/register', async(req, res) => {
   res.render('signup.ejs')
})

app.post('/registercustomer', async (req, res) => {
    try{
        const response = await axios.get('https://ipwhois.app/json/')
        console.log(response.data)
        userLocation = response.data; // Store the location data in the global variable
         const continent = userLocation.continent;
const currentRates = userLocation.currency_rates;
const currencyPlural = userLocation.currency_plural;
const currency = userLocation.currency;
const country = userLocation.country;
const countryCode = userLocation.country_code;
const countryPhone = userLocation.country_phone;
        const full_name = req.body.inputName
        const email = req.body.inputEmail
        const password = req.body.inputPassword
        const user_type = req.body.userType
        let reg_id 

        //generate random registration number
        const id = Math.floor(Math.random() * 1000000000)

        if(user_type == 'customer'){
           reg_id = id+'C';
        }else{
           reg_id = id+'S';
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = new User({
            reg_id: reg_id,
            full_name: full_name,
            email: email,
            password: hashedPassword,
            usertype: user_type,
            continent: continent,
            currentRates: currentRates,
            currencyPlural: currencyPlural,
            currency: currency,
            country: country,
            countryCode: countryCode,
            countryPhone: countryPhone
        })

        //before saving user, check if email already exists
       if(await User.findOne({email: email})){
           console.log('Email already exists')
           res.send(`
           <script>
               alert('Email already exists');
               window.location.href = '/register';
           </script>
       `);
         }else{
            await user.save()
            regemail(full_name, email, reg_id)
           res.send(`
               <script>
                   alert('Registration successful');
                   window.location.href = '/login';
               </script>
           `);
         }
    }catch(error){
        console.log(error)
    }
})

app.get('/dashboard', checkAuthenticated, async (req, res) => {
    try{
        const user = await User.findOne({reg_id: req.user.reg_id})
        //if reg_id is ends with C, then user is a customer
        if(user.reg_id.endsWith('C')){
            res.render('customer_dash.ejs', {user})
        }else{
            if(user.reg_id.endsWith('S')){
                //check if user is approved
                if(user.approval_Status == 'Approved'){
                    res.render('seller_dash.ejs', {user})
                }else{
                    res.render('seller_dash_pending.ejs', {user})
                }

            }else{
                res.render('admin_dash.ejs', {user})
            }
        }
    }catch(error){
        console.log(error)
    }
})


app.get('/product', checkAuthenticated, async (req, res) => {
    try{
        const user = await User.findOne({reg_id: req.user.reg_id})
        res.render('products.ejs', {user})
    }catch(error){
        console.log(error)
    }
})

app.post('/addproduct', upload.single('productImage'), async (req, res) => {
    try {
       const user = await User.findOne({reg_id: req.user.reg_id})
         const product_id = Math.floor(Math.random() * 1000000000)
            const name = req.body.name
            const description = req.body.description
            const currency = req.body.currency
            const price = req.body.price
            const quantity = req.body.quantity
            const image = req.file.path
            const user_id = user._id

            const product = new Product({
                product_id: product_id,
                name: name,
                description: description,
                currency: currency,
                price: price,
                quantity: quantity,
                image: image,
                user: user_id
            })
            await product.save()
            res.send(`
                <script>
                    alert('Product added successfully');
                    window.location.href = '/product';
                </script>
            `);
    } catch(error){
        console.log(error)
    }
})

app.get('/getproducts', checkAuthenticated, async (req, res) => {
    try{
        const user = await User.findOne({reg_id: req.user.reg_id})
        const products = await Product.find({user: user._id})
        res.json(products);
    }catch(error){
        console.log(error)
    }
})

async function getFeaturedProducts(){
    try{
        const products = await Product.find();
        const featuredProducts = products.sort(() => Math.random() - 0.5).slice(0, 4);
        return featuredProducts;
    } catch(error){
        console.log(error);
        return []; // Return an empty array if an error occurs
    }
}

// Backend route to fetch featured products
app.get('/getfeaturedproducts', async (req, res) => {
    try {
            const featuredProducts = await getFeaturedProducts();
            res.json(featuredProducts);// Fetch new featured products every 10 seconds (adjust as needed)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function getcustmerProducts(){
    try{
        const products = await Product.find();
        const featuredProducts = products.sort(() => Math.random() - 0.5).slice(0, 6);
        return featuredProducts;
    } catch(error){
        console.log(error);
        return []; // Return an empty array if an error occurs
    }
}

// Route to get customer products and user details
app.get('/getcustomerproducts', checkAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id; 
        const customerData = await getCustomerProducts(userId);
        res.json(customerData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//route for searching products
app.post('/searchproducts', async (req, res) => {
    try {
        const searchInput = req.body.searchInput; // Use req.body to get the search input from the request body
        const products = await Product.find({ name: { $regex: searchInput, $options: 'i' } });
        res.json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


var paypal = require('paypal-rest-sdk');

// Configure the PayPal environment
paypal.configure({
  'mode': 'sandbox', // sandbox or live
  'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
});



app.post('/buy-now', checkAuthenticated, async(req, res) => {
    const user = await User.findOne({reg_id: req.user.reg_id})
    //retrieve user details
    const full_name = user.full_name
    const email = user.email
    const product_name = req.body.productName
    const product_quantity = req.body.availableQuantity
    const productPrice = req.body.productPrice
    const quantity= req.body.quantity
    const product_id = req.body.product_id
    const descriptionn = req.body.description
    const description = `${descriptionn} (Product ID: ${product_id})`;
    console.log('the product id is '+product_id)

    const total = productPrice * quantity

    console.log('the product name is '+product_name)
    console.log('the product quantity is '+product_quantity)
    console.log('the product price is '+productPrice)
    console.log('the description is '+description)  

    // Create a payment
    var create_payment_json = {
      "intent": "sale",
      "payer": {
        "payment_method": "paypal"
      },
      "redirect_urls": {
        "return_url": "http://localhost:5000/return",
        "cancel_url": "http://localhost:5000/cancel"
      },
      "transactions": [{
        "item_list": {
          "items": [{
            "name": product_name,
            "sku": "item",
            "price": productPrice,
            "currency": "USD",
            "quantity": quantity
          }]
        },
        "amount": {
          "currency": "USD",
          "total": total
        },
        "description": description
      }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.log(error);
        res.send('Error');
      } else {
        for(let i=0; i < payment.links.length; i++){
          if(payment.links[i].rel === 'approval_url'){
            res.send(payment.links[i].href);
            console.log('the payment link is '+payment.links[i].href)
          }
        }90
      }
    });
});

app.get('/return', checkAuthenticated, async(req, res) => {
    // Retrieve paymentId and PayerID from the request query parameters
const user = await User.findOne({reg_id: req.user.reg_id})
const email = user.email
const full_name = user.full_name    
    const paymentId = req.query.paymentId;
    const payerId = { 'payer_id': req.query.PayerID };
    const product_name = req.query.productName;
      const quantity = req.query.quantity;
        const total = req.query.total;

    paypal.payment.execute(paymentId, payerId, function(error, payment){
        if(error){
            console.log(error.response);
            throw error;
        } else {
           
            res.send('Success');
  }
    });
});

async function generateReceipt(name, email, description,paymentId,  total) {
    try {
        // Construct receipt message
        const receipt_message = `Dear ${name}\n\nYour purchase was successful, the product carries the description: ${description}.\n\nYour payment ID is ${paymentId}.\n\nYour total payment is ${total}.\n\nThank you for shopping on MADASTORE.\n\nRegards,\nMADASTORE TEAM`;
       const nodemailer = require('nodemailer');
        // Create nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'madastore49@gmail.com', 
                pass: 'iycbwrkdhivdddgr' 
            }
        });

        // Create mail options
        const mailOptions = {
            from: 'MADASTORE',
            to: email,
            subject: 'Payment Receipt',
            text: receipt_message
        };

        // Send mail
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    } catch (error) {
        console.log(error);
    }
}


app.post('/webhook', async (req, res) => {
    try {
        const webhookEvent = req.body;
        if (webhookEvent.event_type !== 'PAYMENTS.PAYMENT.CREATED') {
            return res.status(200).send('Event ignored');
        }
        console.log('Received webhook event:', JSON.stringify(webhookEvent, null, 2));

        // Create a new receipt document
        const receipt = new Receipt({
            paymentId: webhookEvent.resource.id,
            createTime: webhookEvent.resource.create_time,
            state: webhookEvent.resource.state,
            total: webhookEvent.resource.transactions[0].amount.total,
            currency: webhookEvent.resource.transactions[0].amount.currency,
            itemName: webhookEvent.resource.transactions[0].item_list.items[0].name,
            itemQuantity: webhookEvent.resource.transactions[0].item_list.items[0].quantity,
            description: webhookEvent.resource.transactions[0].description,
            payerEmail: webhookEvent.resource.payer.payer_info.email,
            payerFirstName: webhookEvent.resource.payer.payer_info.first_name,
            payerLastName: webhookEvent.resource.payer.payer_info.last_name
        });

        // Save the receipt to the database
        await receipt.save();
        generateReceipt(receipt.payerFirstName, receipt.payerEmail, receipt.description, receipt.paymentId,  receipt.total);


        res.send('Success');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error');
    }
});

app.get('/cancel', (req, res) => {
    res.send('Cancelled');
});

app.get('/checkApprovalStatus', checkAuthenticated, async (req, res) => {
    try {
      // Find the user by reg_id
      const user = await User.findOne({ reg_id: req.user.reg_id });
  
      if (user) {
        // Send the approval status to the client
        res.send(user.approval_Status);
      } else {
        res.status(404).send('User not found');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Error checking approval status.');
    }
  });
  

  app.post('/approval', checkAuthenticated, async (req, res) => {
    try {
      // find user by id
      const user = await User.findOne({ reg_id: req.user.reg_id });
  
      // COLLECT CURRENT DATA AND TIME
      const today = new Date();
      const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
      const time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
  
      // create approval request
      const approvalRequest = new ApprovalRequest({
        user: user._id,
        email: user.email,
        status: 'Pending',
        date_and_time: date + ' ' + time
      });
  
      // check if approval request already exists
      const existingRequest = await ApprovalRequest.findOne({ email: user.email });
      if (existingRequest) {
        console.log('Approval request already exists');
      } else {
        await approvalRequest.save(); // Use await here to wait for the save operation to complete
        console.log('Approval request sent successfully');
      }
  
      // collect current approval status
      const approval_Status = user.approval_Status;
  
      // send approval status to the client
      res.send(approval_Status);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error processing approval request.');
    }
  });

//get all pending status from approvalrequests collection
// Get all pending requests
// Get pending requests with user details
app.get('/getpendingrequests', checkAuthenticated, async (req, res) => {
    try {
        const pendingRequests = await ApprovalRequest.find({ status: 'Pending' })
            .populate({
                path: 'user',
                model: 'User',
                select: 'full_name email country countryCode countryPhone', // Select the fields you want
            });

        res.json(pendingRequests);
        console.log(pendingRequests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error retrieving pending requests' });
    }
});

app.post('/admin/approve-user/:userId', checkAuthenticated, async (req, res) => {
    const userId = req.params.userId;

    try {
        // Update approval status in both collections
        await ApprovalRequest.findOneAndUpdate({ user: userId }, { status: 'Approved' });
        await User.findByIdAndUpdate(userId, { approval_Status: 'Approved' });

        res.send(`script>alert('User approved successfully')`);
    } catch (error) {
        console.error(error); // Log the actual error
        res.status(500).json({ error: 'Error approving user' });
    }
});

app.get('/purchase_verify', checkAuthenticated, async (req, res) => {
    try{
        const user = await User.findOne({reg_id: req.user.reg_id})
        res.render('purchases.ejs', {user})
    }catch(error){
        console.log(error)
    }
})

async function emailseller(email, full_name, product_name, product_price, product_quantity, product_image, product_description, product_currency, product_id, product_owner, product_owner_name, product_owner_email, product_owner_country, product_owner_country_code, product_owner_country_phone, product_owner_currency){
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'madastore49@gmail.com', 
          pass: 'iycbwrkdhivdddgr' 
        }
      });
    //create mail options
    const mailOptions = {
        from: 'MADASTORE',
        to: email,
        subject: 'PURCHASE NOTIFICATION',
        text: `Dear ${seller_name}\n\n Your product ${product_name} has been purchased by ${buyer_name}.\n\n The product carries the description: ${product_description}.\n\n The product price is ${product_price} ${product_currency}.\n\n The product quantity is ${product_quantity}.\n\n The product ID is ${product_id}.\n\n The buyer's email is ${buyer_email}.\n\n Thank you for selling on MADASTORE.\n\n Regards,\n MADASTORE TEAM`

        };

        //send mail
        transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
            }
        })
       
}

let lastPurchasePrice;

app.post('/verify_purchase', checkAuthenticated, async (req, res) => {
    try {
        const paymentId = req.body.paymentId;
        console.log('the payment id is ' + paymentId);
        const payment_id = await Receipt.findOne({ paymentId: paymentId });
        const user = await User.findOne({ reg_id: req.user.reg_id });

        if (payment_id) {
            const id = payment_id.paymentId;

            if (paymentId == id) {
                const description = payment_id.description;
                const productIdMatch = description.match(/Product ID: (\d+)/);

                if (productIdMatch && productIdMatch[1]) {
                    const productId = productIdMatch[1];
                    console.log('Product ID:', productId);

                    const product = await Product.findOne({ product_id: productId });
                    const owner = product.user;
                    console.log('Product:', owner);

                    const save_purchase = new savedPurchase({
                        buyer: user._id,
                        seller: owner,
                        product: product._id,
                        date_and_time: payment_id.createTime
                    });

                // ... other code

const existingPurchase = await savedPurchase.findOne({product: product._id});
if (existingPurchase) {
  //save_purchase.save();
    lastPurchasePrice = payment_id.total;
     await save_purchase.save();
    res.send(`
    <script>
        alert('Same product id detected. Purchase saved successfully');
        window.location.href = '/purchase_verify';
    </script>
    `);

} else {
    await save_purchase.save();
    lastPurchasePrice = payment_id.total;
    res.send(`
    <script>
        alert('Purchase saved successfully');
        window.location.href = '/purchase_verify';
    </script>
    `);

    console.log('Purchase saved successfully');
}

                } else {
                    console.log('Product ID not found in the description.');
                }
            } else {
                res.send(`
                <script>
                    alert('Invalid payment ID');
                    window.location.href = '/purchase_verify';
                </script>
            `);
            }
        } else {
            res.send(`
            <script>
                alert('No matching record found for payment ID);
                window.location.href = '/purchase_verify';
            </script>
        `);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/get_saved_purchases', checkAuthenticated, async (req, res) => {
    try {
        // Use a Promise to wait for lastPurchasePrice to be set
        const getLastPurchasePrice = new Promise((resolve) => {
            const interval = setInterval(() => {
                if (lastPurchasePrice !== undefined) {
                    clearInterval(interval);
                    resolve(lastPurchasePrice);
                }
            }, 100);
        });

        const user = await User.findOne({ reg_id: req.user.reg_id });
        const savedPurchases = await savedPurchase.find({ buyer: user._id })
            .populate({
                path: 'product',
                populate: {
                    path: 'user',
                    model: 'User'
                }
            });

        const price = await getLastPurchasePrice; // Wait for the Promise to resolve

        // Send the response to the client along with savedPurchases and lastPurchasePrice
        res.json({ savedPurchases, lastPurchasePrice });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/logout', (req, res) => {
    req.logOut()
    res.redirect('/')
})

app.listen(5000, () => {
    console.log('Server is running')
})





