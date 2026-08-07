const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace the Cart anchor to include Dashboard right before it
    const target1 = '<a href="wishlist.html" class="auth-required" style="display:none;">Wishlist</a>\r\n            <a href="bag.html">';
    const target2 = '<a href="wishlist.html" class="auth-required" style="display:none;">Wishlist</a>\n            <a href="bag.html">';

    let replaced = false;
    
    if (content.includes(target1)) {
        content = content.replace(target1, '<a href="wishlist.html" class="auth-required" style="display:none;">Wishlist</a>\r\n            <a href="dashboard.html" class="admin-only" style="display:none;">Dashboard</a>\r\n            <a href="bag.html">');
        replaced = true;
    } else if (content.includes(target2)) {
        content = content.replace(target2, '<a href="wishlist.html" class="auth-required" style="display:none;">Wishlist</a>\n            <a href="dashboard.html" class="admin-only" style="display:none;">Dashboard</a>\n            <a href="bag.html">');
        replaced = true;
    } else {
        // Fallback using Regex
        const regex = /<a href="wishlist\.html" class="auth-required" style="display:none;">Wishlist<\/a>\s*<a href="bag\.html">/g;
        if (regex.test(content)) {
            content = content.replace(regex, '<a href="wishlist.html" class="auth-required" style="display:none;">Wishlist</a>\n            <a href="dashboard.html" class="admin-only" style="display:none;">Dashboard</a>\n            <a href="bag.html">');
            replaced = true;
        }
    }

    if (replaced) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`Could not find target in ${file}`);
    }
});
