require('./config/config');
require('./models/db');

const { randomNumber } = require('./helpers/libs');

const morgan = require('morgan');
const express = require('express');
const cors = require('cors');
//const bodyParser = require('body-parser');
const path = require('path');
const exphbs = require('express-handlebars');
const multer = require('multer');

const rtsIndex = require('./routes/index.router');

// Base de datos
const db = require('./models/db');
db.authenticate()
  .then(() => {
    console.log('Conexión con SQLite establecida con éxito.');
  })
  .catch(err => {
    console.error('No se puede conectar con la base de datos:', err);
  });
db.sync();

// Inicializo express y configuro las el motor de plantillas.
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares utilizados
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(cors());
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'public/img/uploads'),
  filename: (req, file, cb, filename) => {
    var extension = (path.extname(file.originalname).split(".")[1]);
    if(extension == 'jpg' || extension == 'jpeg' || extension == 'png') {
      cb(null, randomNumber() + path.extname(file.originalname));
    } else {
      return cb(new Error('Error en el tipo de archivo.'));
    }
  }
});
app.use(multer({storage}).single('image'));
app.use('/api', rtsIndex);

// Control de errores
app.use((err, req, res, next) => {
    if (err.name === 'ValidationError') {
        var valErrors = [];
        Object.keys(err.errors).forEach(key => valErrors.push(err.errors[key].message));
        res.status(422).send(valErrors)
    }
    else{
        console.log(err);
    }
});

// Archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

// Iniciar la escucha del servidor
app.listen(process.env.PORT, () => console.log(`Servidor iniciado en el puerto : ${process.env.PORT}`));