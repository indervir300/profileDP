const express = require('express')
const app = express()
const multer = require('multer')
const bodyparser = require('body-parser')
const mongoose = require('mongoose')
const fs = require('fs')
const sharp = require('sharp')
const path = require('path')
const User = require('./userModel')
const port = 80

async function mongoConnection() {
    try {
        await mongoose.connect('mongodb://localhost:27017/practice');
        console.log(`MongoDB connected`);
    } catch (error) {
        console.log(`Error connecting to MongoDB database ${error}`);
    }
}

mongoConnection();

// const newUser = new User({
//     name: 'Indervir Singh',
//     email: 'inder@gmail.com',
//     dp_image: '',
//     timestamp: new Date()
// });

// try {
//     newUser.save();
// } catch(error) {
//     console.log(`Error in creating user`);
// }


app.use(express.json());
app.use(bodyparser.urlencoded({ extended: true }));
// app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
    try {
        const email = 'inder@gmail.com'
        const user = await User.findOne({ email: email });
        if (!user) {
            console.log('User not found');
            return;
        }

        const image = user.dp_image;
        const img = `./profiles/${image}`;

        if (!image || !fs.existsSync(img)) {
            return res.status(200).render('index', { image: '' })
        }

        const file = fs.readFileSync(img);
        const dataUrl = `data:image/webp;base64,${Buffer.from(file).toString('base64')}`;

        return res.status(200).render('index', { image: dataUrl });
    } catch (err) {
        console.log(err);
    }
})

const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(express.static('./profiles'));

app.post('/upload_profile', upload.single('profilepic'), async (req, res) => {
    try {
        fs.access('./profiles', (error) => {
            if (error) {
                fs.mkdir('./profiles', (error) => {
                    if (error) {
                        console.log(error);
                    }
                });
            }
        });

        const { buffer, originalname } = req.file;
        // remove file extension
        const filename = path.basename(originalname, path.extname(originalname));
        const timestamp = Date.now();
        const ref = `${timestamp}_${filename}.webp`;

        // Compression technique
        await sharp(buffer)
            .webp({ quality: 20 })
            .toFile("./profiles/" + ref);

        const email = 'inder@gmail.com'
        const user = await User.findOne({ email: email });
        if (!user) {
            console.log('User not found');
            return;
        }

        new User({
            dp_image: ref
        });

        user.dp_image = ref;
        await user.save();

        return res.status(200).json({ message: 'Profile Uploaded' });
    } catch (error) {
        return res.status(500).json({ message: 'An error occured!' });
    }
});

app.listen(port, console.log(`Server is listenning at port ${port}`))