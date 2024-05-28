const dotenv=require("dotenv").config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const db = require('./db_con.js');

app.use(session({
    secret: 'test123!@#',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    res.render('index');

});



//TO MOVE TO LOGIN PAGE
app.get('/login', function (req, res) {
    var msg = "";
    if (req.session.msg != "")
        msg = req.session.msg;
    res.render('login', { msg: "LOGIN TO DONAR DRIVE" });
});

app.post('/login_submit1', function (req, res) {
    const { email, pass } = req.body;
    let sql = "";
    let params = [];
    if (isNaN(email)) {
        sql = "SELECT * FROM admin WHERE email = ? AND pass = ? AND status = 1 AND softdelete = 1";
        params = [email, pass]; // Add email and pass as parameters
    } else {
        sql = "SELECT * FROM admin WHERE voterid = ? AND pass = ? AND status = 1 AND softdelete = 1";
        params = [email, pass]; // Add mobile and password as parameters
    }
    db.query(sql, params, function (err, result, fields) {
        if (err) {
            console.error(err);
            res.render('login', { msg: "Error processing login request" });
        } else {
            if (result.length === 0) {
                res.render('login', { msg: "Username or Password did not match" });
            } else {
                req.session.userid = result[0].uid;
                req.session.un = result[0].username;
                // Redirect to the candidates page after successful admin login
                res.redirect('/candidates');
            }
        }
    });
    });
   app.post('/login_submit2', async (req, res) => {
        const { email, pass } = req.body;
        const sql = "SELECT * FROM users WHERE email = ?  AND pass = ? AND status = 1 AND softdelete = 1";
        const params = [email, pass];
    
        // If credentials are correct, generate OTP and send email
        db.query(sql, params, async (err, result, fields) => {
            if (err) {
                console.error(err);
                res.render('login', { msg: "Error processing login request" });
            } else {
                if (result.length === 0) {
                    res.render('login', { msg: "Aadhar ID or Email or Password did not match" });
                } else {
                    req.session.userid = result[0].uid;
                    req.session.un = result[0].username;
                    res.redirect('/users');
                }
            }
        });
    });
    function credentialsAreCorrect(email, pass) {
        return new Promise((resolve, reject) => {
          // Query to check if the credentials match any record in the database
          const sql = 'SELECT * FROM users WHERE email = ? AND pass = ?';
          const values = [email, pass];
      
          db.query(sql, values, (error, results) => {
            if (error) {
              reject(error);
            } else {
              // If a record is found, the credentials are correct
              resolve(results.length > 0);
            }
          });
        });
      }
      
    // Route to verify OTP
    
    //SIGNUP PAGE FOR VOTERS/USER
app.get('/signup', (req, res) => {
    const { errmsg } = req.query; // Assuming errmsg is passed as a query parameter
    res.render('signup', { errmsg }); // Pass errmsg to the template
});
app.post('/reg_submit1', (req, res) => {
    const { fname, mname, lname, dob, mobileno, pass, nationality, email, blood_group} = req.body;

    // Check if Aadhar ID already exists
    

        

        // If Aadhar ID is unique, proceed with signup
        const sql = "INSERT INTO users (fname, mname, lname, dob, mobileno, pass, nationality, email,blood_group) VALUES (?,?,?, ?, ?, ?, ?, ?, ?)";
        const t = new Date();
        const m = t.getMonth() + 1;
        const dor = t.getFullYear() + "-" + m + "-" + t.getDate();

        db.query(sql, [fname, mname, lname, dob, mobileno, pass, nationality, email,blood_group], function (err, result) {
            if (err) {
                console.error("Error executing SQL query:", err);
                return res.status(500).send("Internal Server Error");
            }

            if (result.insertId > 0) {
                if (isNaN(email))
                    sendVerifyMail(email);
                req.session.msg = "Account created,Please Check Your Mail to Verify Your Email.";
                res.redirect('/login');//redirect to login page
            }
            else {
                res.render('signup', { errmsg: "Cannot complete signup,try again" });
            }
        });
    });


//TO VERIFY YOUR MAIL
app.get('/verifyemail', function (req, res) {
    let email = req.query['email'];
    let sql_update = "update voter set status=1 where email=?";
    db.query(sql_update, [email], function (err, result) {
        if (err)
            console.log(err);
        if (result.affectedRows == 1) {
            req.session.msg = "Email verified now you can login with your password and email";
            res.redirect('/');//redirecting to login page
        }
        else {
            req.session.msg = "Cannot verify your email contact website admin";
            res.redirect('/');
        }
    });
});

    app.get('/howtodonateblood', (req, res) => {
        res.render('howtodonateblood');
    });
    app.get('/about', (req, res) => {
        res.render('about');
    });
    app.get('/logout', function (req, res) {
        //req.session.userid = "";
        res.redirect('/');
    });
    app.get('/contactus', (req, res) => {
        res.render('contactus');
    });
    app.post('/submit_contact', (req, res) => {
        // Extract data from the form submission
        const name = req.body.name;
        const email = req.body.email;
        const message = req.body.message;
    
        // Here you can handle the form submission data (e.g., send an email, save to database, etc.)
    
        // Respond with a simple success message for demonstration purposes
        res.send(`<h1>Thank you for your message, ${name}!</h1><p>We'll get back to you soon.</p>`);
    
    
    });
    app.get('/help', (req, res) => {
        res.render('help');
    });

    app.get('/candidates', (req, res) => {
        // Retrieve the list of candidates from the database
        const sql = 'SELECT * FROM candidates';
        db.query(sql, (err, result) => {
            if (err) {
                console.error('Error retrieving candidates:', err);
                return res.status(500).send('Error retrieving candidates. Please try again.');
            } else {
                // Fetch admin's data
                const adminSql = 'SELECT uid, fname, email FROM admin LIMIT 1'; // Assuming you want to fetch the first admin
                db.query(adminSql, (adminErr, adminResult) => {
                    if (adminErr) {
                        console.error('Error retrieving admin data:', adminErr);
                        return res.status(500).send('Error retrieving admin data. Please try again.');
                    } else {
                        // Extract adminId from the admin's data
                        const adminId = adminResult[0].uid;
    
                        // Render the candidates page with the retrieved data and admin's info
                        res.render('candidates', { candidates: result, adminName: adminResult[0].fname, adminEmail: adminResult[0].email });
                    }
                });
            }
        });
    });
    
    app.post('/candidates', (req, res) => {
        const sql = 'SELECT * FROM candidates'; // Modify the SQL query to select all fields from the candidates table
        db.query(sql, (err, result) => {
            if (err) {
                console.error('Error retrieving candidates:', err);
                return res.status(500).send('Error retrieving candidates. Please try again.');
            } else {
                // Fetch admin's data
                const adminSql = 'SELECT uid, fname, email FROM admin LIMIT 1';
                db.query(adminSql, (adminErr, adminResult) => {
                    if (adminErr) {
                        console.error('Error retrieving admin data:', adminErr);
                        return res.status(500).send('Error retrieving admin data. Please try again.');
                    } else {
                        // Render the candidates page with the retrieved data and admin's info
                        res.render('candidates', { candidates: result, adminName: adminResult[0].fname, adminEmail: adminResult[0].email });
                    }
                });
            }
        });
    });
    

    app.get('/addcandidate', (req, res) => {
        res.render('addcandidate');
    });
    
    // Route to handle adding a new candidate
    app.post('/addcandidatessubmit', (req, res) => {
        const { full_name, email, dob, nationality, blood_group } = req.body;
    
        // Check if the candidate already exists in the database
        const sqlCheck = 'SELECT COUNT(*) AS count FROM candidates WHERE full_name = ? AND dob = ? AND email = ?';
        db.query(sqlCheck, [full_name, dob, email], (err, result) => {
            if (err) {
                console.error('Error checking candidate existence:', err);
                return res.status(500).send('Error checking candidate existence. Please try again.');
            }
    
            // Check if the candidate already exists
            if (result[0].count > 0) {
                console.log('Candidate already exists.');
                return res.status(400).render('addcandidate', { errmsg: "Candidate already exists." });
            } else {
                // If candidate does not exist, proceed with registration
                const sqlInsert = 'INSERT INTO candidates (full_name, email, dob, nationality, blood_group) VALUES (?, ?, ?, ?, ?)';
                const values = [full_name, email, dob, nationality, blood_group];
    
                db.query(sqlInsert, values, (err, result) => {
                    if (err) {
                        console.error('Error adding candidate:', err);
                        return res.status(500).send('Error adding candidate. Please try again.');
                    } else {
                        console.log('Candidate added successfully.');
                        res.redirect('/candidates'); // Redirect to the candidates page after adding the candidate
                    }
                });
            }
        });
    });

    //DELETE THE CANDIDATE
app.get('/deletecandidate/:candidate_id', (req, res) => {
    const candidateId = req.params.candidate_id;

    // Here you can perform any necessary operations before deleting the candidate
    // For example, you might want to display a confirmation page before deletion

    // Then, you can redirect or render a confirmation page
    const sql = 'DELETE FROM candidates WHERE candidate_id = ?';
    db.query(sql, [candidateId], (err, result) => {
        if (err) {
            console.error('Error deleting candidate:', err);
            return res.status(500).send('Error deleting candidate. Please try again.');
        }
        // Redirect to the candidates list page after deletion
        res.redirect('/candidates');
    });
});


//UPDATE THE CANDIDATE
app.get('/updatecandidate/:id', (req, res) => {
    const candidateId = req.params.id;
    res.render('updatecandidate', { candidate_id: candidateId });
});
// Handle updating a candidate



const bloodInventory = {
    'A+': 100,
    'A-': 50,
    'B+': 75,
    'B-': 30,
    'O+': 120,
    'O-': 90,
    'AB+': 60,
    'AB-': 25,
};

app.get('/blood-info', (req, res) => {
    res.render('blood-info', { bloodInventory });
});



app.get('/users', (req, res) => {
    // Check if user is logged in
    if (!req.session.userid) {
        console.error('User ID is undefined in session.');
        return res.status(500).send('User ID is undefined in session. Please log in again.');
    }

    // Query the voter status, name, and Aadhar ID for the current user
    const sqlQuery = "SELECT fname ,mobileno FROM users  WHERE uid = ?";
    db.query(sqlQuery, [req.session.userid], (err, voterResult) => {
        if (err) {
            console.error('Error retrieving voter data:', err);
            return res.status(500).send('Error retrieving voter data. Please try again.');
        } else {
            // Check if a row was returned
            if (voterResult.length > 0) {
                // Voter data found
                const voterStatus = voterResult[0].voterstatus;
                const fname = voterResult[0].fname;
                
                
                const mobileno = voterResult[0].mobileno;
               

                // Proceed wth rendering the page or performing other actions
                // For example, you can render the page with the retrieved data and hasVoted variable

                // Query candidates from the same state and district as the voter
                const sqlCandidates = 'SELECT * FROM candidates ';
                db.query(sqlCandidates,  (err, candidatesResult) => {
                    if (err) {
                        console.error('Error retrieving candidates:', err);
                        return res.status(500).send('Error retrieving candidates. Please try again.');
                    } else {
                        // Render the voter page with the retrieved data, hasVoted variable, fname, and aadharid
                        res.render('users', { candidates: candidatesResult,  fname: fname, mobileno:mobileno });
                    }
                });
            } else {
                // Voter data not found
                console.log('users data not found for user:', req.session.userid);
                // Handle the case where the user does not exist or there is no voter data
            }
        }
    });
});

app.listen(PORT, () => {
    console.log(`panel is running at http://localhost:${PORT}`);
});