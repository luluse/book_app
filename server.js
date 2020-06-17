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


app.get('/', getBooks);
// app.get('addBook', showAddForm);
app.post('addBook', addNewBook);

app.get('/searches', (request, response) => {
  response.status(200).render('./searches/new.ejs');
})

app.get('/books/:id', getOneBook);

function getOneBook(request, response){
  let id = request.params.id;
  console.log(request.params.id);
  let sql = 'SELECT * FROM books WHERE id=$1;';
  let safeValues = [id];

  client.query(sql, safeValues)
    .then(sqlResults =>{
      // console.log(sqlResults.rows);
      response.status(200).render('books/detail.ejs', {oneBook: sqlResults.rows[0]});
      // console.log(oneBook);
    })
}

function getBooks(request, response) {
  let sql = 'SELECT * FROM books;';
  client.query(sql)
    .then(sqlResults => {
      let books = sqlResults.rows;
      // Count for number of books in database
      console.log(books.length);
      response.status(200).render('pages/index.ejs', { myBookShelf: books })
    })
}

// function showAddForm(reques,response){
//   response.status(200).render()
// }

function addNewBook(request,response){
  let {title, author, isbn, image_url, description} = request.body;
  let sql = 'INSERT INTO books (author, title, isbn, description, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING ID;';
  let safeValues = [title, author, isbn, description, image_url];

  client.query(sql, safeValues)
    .then(results =>{
      let id = results.rows[0].id;
      response.redirect(`/books/${id}`);
    })
}




app.post('/searches', (request, response) => {
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
});


function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = info.title ? info.title : 'no title available';
  this.author = info.authors ? info.authors : 'no author available';
  this.isbn = info.industryIdentifiers[1] ? info.industryIdentifiers[1] : 'no ISBN avialable';
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
