'use strict';

const express = require('express');
const app = express();

require('ejs');
require('dotenv').config();

const superagent = require('superagent');

const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
// app.set("views", path.results(__dirname, 'public'));

app.use(express.static('public'));
// app.use(express.static(__dirname + 'views'));

app.get('/', (req, res) => {
  res.render('pages/index.ejs');
});

app.get('/searches', (request, response) => {
  response.render('./searches/new.ejs');
})




app.post('/searches', (request, response) => {
  console.log(request.body.search);

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

      console.log(finalBookArray);
      response.render('searches/show.ejs', {searchResults: finalBookArray})

    })
})

function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = info.title ? info.title : 'no title available';
  this.author = info.authors ? info.authors : 'no author available';
  this.description = info.description ? info.description : 'no description available';
  this.image = info.imageLinks.smallThumbnail ? info.imageLinks.smallThumbnail : placeholderImage;

}

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
