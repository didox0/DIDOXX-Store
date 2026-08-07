const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('href="style.css?v=2"')) {
        content = content.replace(/href="style.css\?v=2"/g, 'href="style.css?v=3"');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated cache string to v=3 in ${file}`);
    } else if (content.includes('href="style.css"')) {
        content = content.replace(/href="style.css"/g, 'href="style.css?v=3"');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated cache string to v=3 in ${file}`);
    }
});
