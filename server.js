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
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

//ROUTES
app.get('/', getBooks);
app.get('/books/:id', getOneBook);
app.get('/searches', searchBook);
app.put('/update/:id', updateBook);
app.delete('/delete/:id', deleteBook);
app.post('/detail', addNewBook);
app.post('/searches', getBooksFromAPI);

function getBookshelves(request, response) {
  let sql = 'SELECT DISTINCT bookshelf FROM books;';
  return client.query(sql);
}

function deleteBook(request, response) {
  let bookId = request.params.id;
  // let { title, author, isbn, image_url, description } = request.body;

  let sql = 'DELETE FROM books WHERE id=$1;';
  let safeValues = [bookId];

  client.query(sql, safeValues)
    .then(sqlResults => {
      // console.log('my sql results', sqlResults.rows);
      response.redirect(`/`);
    }).catch(error => console.log(error));
}


function updateBook(request, response) {
  let bookId = request.params.id;
  let { title, author, isbn, image_url, description } = request.body;

  let sql = 'UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5 WHERE id=$6;';
  let safeValues = [title, author, isbn, image_url, description, bookId];

  client.query(sql, safeValues)
    .then(sqlResults => {
      // console.log('my sql results', sqlResults.rows);
      response.redirect(`/books/${bookId}`);
    }).catch(error => console.log(error));
}

function searchBook(request, response) {
  response.status(200).render('./searches/new.ejs');
}

function getOneBook(request, response) {
  let id = request.params.id;

  let sql = 'SELECT * FROM books WHERE id=$1;';
  let safeValues = [id];

  client.query(sql, safeValues)
    .then(sqlResults => {
      // console.log('my sql results', sqlResults.rows);
      response.status(200).render('pages/books/detail.ejs', { oneBook: sqlResults.rows[0] });
    }).catch(error => console.log(error))
}

function getBooks(request, response) {
  getBookshelves()
    .then(bookshelf => {
      // console.log(bookshelf);
      let sql = 'SELECT * FROM books;';
      client.query(sql)
        .then(sqlResults => {
          let books = sqlResults.rows;
          // Count for number of books in database
          // console.log(books.length);
          if (sqlResults.rowCount === 0) {
            response.status(200).render('pages/searches/news.ejs');
          } else {
            response.status(200).render('pages/index.ejs', { myBookShelf: books, totalBookshelves: bookshelf.rows })

          }
        }).catch(error => console.log(error))
    })
}

function addNewBook(request, response) {
  let { title, author, isbn, image_url, description, bookshelf } = request.body;
  // console.log(bookshelf);
  let sql = 'INSERT INTO books (author, title, isbn, description, image_url, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ID;';
  let safeValues = [author, title, isbn, description, image_url, bookshelf];

  client.query(sql, safeValues)
    .then(results => {
      let id = results.rows[0].id;
      response.redirect(`/books/${id}`);
    }).catch(error => console.log(error))
}


function getBooksFromAPI(request, response) {
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
