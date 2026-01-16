const fs = require('fs');

fs.readFile('input.txt', 'utf8', (err, data) => {
  if (err) return console.error(err);

  const wordCount = data.trim().split(/\s+/).length;
  fs.writeFile('word_count.txt', `Word Count: ${wordCount}`, err => {
    if (err) console.error(err);
    else console.log('Word count written to word_count.txt');
  });
});
