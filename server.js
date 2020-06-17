'use strict';

const express = require('express');
const app = express();
const pg = require('pg');

require('ejs');
require('dotenv').config();

const superagent = require('superagent');

const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(express.static('public'));

//ROUTES
app.get('/', getBooks);
app.get('/books/:id', getOneBook);
app.post('/addBook', addNewBook);
app.post('/searches', getBooksFromAPI);
app.get('/searches', searchBook);

function searchBook (request, response) {
  response.status(200).render('./searches/new.ejs');
}

function getOneBook(request, response){
  let id = request.params.id;

  let sql = 'SELECT * FROM books WHERE id=$1;';
  let safeValues = [id];

  client.query(sql, safeValues)
    .then(sqlResults =>{
      console.log('my sql results', sqlResults.rows);
      response.status(200).render('pages/books/detail.ejs', {oneBook: sqlResults.rows[0]});
    });
}

function getBooks(request, response) {
  let sql = 'SELECT * FROM books;';
  client.query(sql)
    .then(sqlResults => {
      let books = sqlResults.rows;
      // Count for number of books in database
      // console.log(books.length);
      if(sqlResults.rowCount === 0){
        response.status(200).render('pages/searches/news.ejs');
      } else{
        response.status(200).render('pages/index.ejs', { myBookShelf: books })

      }
    }).catch(error => console.log(error))
}

function addNewBook(request,response){
  let {title, author, isbn, image_url, description} = request.body;
  let sql = 'INSERT INTO books (author, title, isbn, description, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING ID;';
  let safeValues = [author, title, isbn, description, image_url];

  client.query(sql, safeValues)
    .then(results =>{
      let id = results.rows[0].id;
      response.redirect(`/books/${id}`);
    })
}


function getBooksFromAPI (request, response){
  try {
    // console.log(request.body.search);

    let query = request.body.search[0];
    let titleOrAuthor = request.body.search[1];

    let url = 'https://www.googleapis.com/books/v1/volumes?q=';

    if (titleOrAuthor === 'title') {
      url += `intitle:${query}`;
    } else if (titleOrAuthor === 'author') {
      url += `+inauthor:${query}`;
    }

    superagent.get(url)
      .then(results => {
        // console.log(results.body.items);

        let bookArray = results.body.items;

        const finalBookArray = bookArray.map(book => {
          return new Book(book.volumeInfo);
        });

        // console.log(finalBookArray.length);
        response.status(200).render('searches/show.ejs', { searchResults: finalBookArray })

      })
  } catch (err) {
    console.log('ERROR', err);
    response.status(500).send('Sorry, there is an error');
  }
}


function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = info.title ? info.title : 'no title available';
  this.author = info.authors ? info.authors : 'no author available';
  this.isbn = info.industryIdentifiers[1] ? info.industryIdentifiers[1].identifier : 'no ISBN available';
  this.image = info.imageLinks ? info.imageLinks.smallThumbnail : placeholderImage;
  this.description = info.description ? info.description : 'no description available';
}

app.get('*', (request, response) => {
  response.status(404).send('sorry, this route does not exist');
});


const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.log(err));
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  });
