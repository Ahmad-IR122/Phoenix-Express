const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');

fs.readdirSync(modelsDir).forEach((file) => {
  if (
    file.endsWith('.js') &&
    file !== 'index.js' &&
    !file.endsWith('.model.js')
  ) {
    const oldPath = path.join(modelsDir, file);
    const newFileName = file.replace('.js', '.model.js');
    const newPath = path.join(modelsDir, newFileName);

    fs.renameSync(oldPath, newPath);
    console.log(`${file} -> ${newFileName}`);
  }
});

console.log('Done.');