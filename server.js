if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOveride = require('method-override');

// User model
let User = require('./models/user.model');

// passport-config used to handle local users
const initializePassport = require('./passport-config');

//initialize our express application
const app = express();

// set authenticate function for passport
initializePassport(
    passport, 
    email => User.findOne({email: email}),
    id => User.findOne({id: id})
);

// flash messages for passport 
app.use(flash());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());

app.use(passport.session());

app.use(methodOveride('_method'));

// port is either defined in env or 5000
const PORT = process.env.PORT || 5000;

// connect to mongod DB
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, 
    {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    }
);

// open connection. print success/error to console
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected to mongodb')
});

// register the handlebars views engine with express
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// static files will reside in our public folder
app.use(express.static('public'));

// access form values via name field for reg/login/logout 
app.use(express.urlencoded({ extended: false }));

// Routing for handlebars pages
app.get('/', checkAuthenticated, (req,res) => {
    res.render('index', { 
        isAuth: !!req.user,
        title: 'Home',
        bannerHeader: 'Welcome to a Sample Handlebars Page!',
        bannerContent: 'This page uses Node JS, Express, Mongoose, Express-Handlebars, and Sass',
        contentHeader: 'So how does Handlebars work? It is actually quite simple...',
        content: [
        `This is the content passed in by the res.render function.`,
        `You can pass in anything you want here; you could even pass in content from an API or database.`,
        `Handlebars can use helper functions such as {{#each}} to work through an iterative set of items. Here we've printed these items and insterted a <br> after each one.`,
        `Handlebars also allows you to create "partials" which represent different elements you can render to a page. You can do this for things like navigation bars and forms.`,
        ]
    });
});

app.get('/register', (req, res) => {
    res.render('register');
});

// on register page post, has password and save new user
// redirect to login view if success, else log error and
// redirect back to the register view
app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const email = req.body.email;

        const newUser = new User ({
            email: email,
            password: hashedPassword
        });

        newUser.save()
            .then(() => res.redirect('/'))
            .catch((err) => {
                console.log(err);
                res.redirect('/register');
            });
    } catch {
        res.redirect('/register')
    }
    console.log(users);
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login', {title: "Login"});
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/login');
})

// redirect if client isn't authenticated
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login');
}

// redirect if client is authenticated
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next();
}

// listen to serve at our port
app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
})